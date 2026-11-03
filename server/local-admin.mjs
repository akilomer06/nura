import fs from 'node:fs/promises';
import path from 'node:path';
import {randomBytes,scryptSync,timingSafeEqual,createHash} from 'node:crypto';
import sharp from 'sharp';
import {validateCatalog} from '../src/catalog-validation.mjs';
import {DEFAULT_RATES} from '../src/currencies.mjs';

export function localAdmin({root=process.cwd()}={}){
 const privateDir=path.join(root,'.nura-admin'),catalogPath=path.join(privateDir,'catalog.json'),credentialPath=path.join(privateDir,'credentials.json');
 const sessions=new Map(),attempts=new Map();let writing=false;
 const read=async()=>{try{return JSON.parse(await fs.readFile(catalogPath,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;return {products:JSON.parse(await fs.readFile(path.join(root,'src/catalog.json'),'utf8')),rates:DEFAULT_RATES};}};
 const credentials=async()=>{try{return JSON.parse(await fs.readFile(credentialPath,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;return null;}};
 const json=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
 const body=async(req,limit)=>{let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>limit)throw new Error('Upload is too large. Maximum image size is 6 MB.');chunks.push(chunk);}return Buffer.concat(chunks);};
 const middleware=async(req,res,next)=>{
  const url=new URL(req.url,'http://localhost');if(!['/api/catalog','/api/admin/status','/api/admin/session','/api/admin/catalog','/api/admin/upload'].includes(url.pathname))return next();
  // This backend is intentionally available only through a loopback development server.
  const remote=req.socket.remoteAddress;if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(remote))return json(res,403,{error:'Local administration requires this computer.'});
  const host=req.headers.host;if(!/^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(host||''))return json(res,403,{error:'Invalid host.'});
  if(req.headers.origin&&req.headers.origin!==`http://${host}`&&req.headers.origin!==`https://${host}`)return json(res,403,{error:'Cross-origin requests are not allowed.'});
  const token=req.headers.cookie?.match(/(?:^|;\s*)nura_admin=([a-f0-9]{64})(?:;|$)/)?.[1],session=token&&sessions.get(token),authed=!!session&&session>Date.now();
  try{
   if(url.pathname==='/api/catalog'&&req.method==='GET'){const data=await read();return json(res,200,{...data,products:data.products.filter(p=>p.published!==false)});}
   if(url.pathname==='/api/admin/status'&&req.method==='GET')return json(res,200,{mode:'local',setup:!(await credentials()),authenticated:authed});
   if(url.pathname==='/api/admin/session'&&req.method==='DELETE'){if(token)sessions.delete(token);res.setHeader('Set-Cookie','nura_admin=; HttpOnly; SameSite=Strict; Path=/api/admin; Max-Age=0');return json(res,200,{ok:true});}
   if(url.pathname==='/api/admin/session'&&req.method==='POST'){
    if(!req.headers['content-type']?.startsWith('application/json'))return json(res,415,{error:'JSON is required.'});
    const {password}=JSON.parse((await body(req,2048)).toString());if(typeof password!=='string'||password.length<12||password.length>200)return json(res,400,{error:'Use a password of 12–200 characters.'});
    const recent=(attempts.get(remote)||[]).filter(t=>t>Date.now()-60000);if(recent.length>=8)return json(res,429,{error:'Too many attempts. Wait a minute and try again.'});attempts.set(remote,[...recent,Date.now()]);
    let saved=await credentials();if(!saved){const salt=randomBytes(24).toString('hex');saved={salt,hash:scryptSync(password,salt,64).toString('hex')};await fs.mkdir(privateDir,{recursive:true});await fs.writeFile(credentialPath,JSON.stringify(saved),{flag:'wx',mode:0o600});}
    if(!timingSafeEqual(Buffer.from(saved.hash,'hex'),scryptSync(password,saved.salt,64)))return json(res,401,{error:'Incorrect password.'});
    const key=randomBytes(32).toString('hex');sessions.set(key,Date.now()+8*60*60*1000);res.setHeader('Set-Cookie',`nura_admin=${key}; HttpOnly; SameSite=Strict; Path=/api/admin; Max-Age=28800`);return json(res,200,{ok:true});
   }
   if(!authed)return json(res,401,{error:'Sign in to manage the catalog.'});
   if(url.pathname==='/api/admin/catalog'&&req.method==='GET'){const data=await read();return json(res,200,{...data,revision:createHash('sha256').update(JSON.stringify(data)).digest('hex')});}
   if(url.pathname==='/api/admin/catalog'&&req.method==='PUT'){
    if(writing)return json(res,409,{error:'A save is in progress. Try again.'});writing=true;
    try{const input=JSON.parse((await body(req,2*1024*1024)).toString()),current=await read(),revision=createHash('sha256').update(JSON.stringify(current)).digest('hex');if(input.revision!==revision)return json(res,409,{error:'The catalog changed in another window. Reload before saving.'});const data=validateCatalog(input);await fs.mkdir(privateDir,{recursive:true});await fs.writeFile(path.join(privateDir,'catalog.previous.json'),JSON.stringify(current,null,2));await fs.writeFile(catalogPath+'.tmp',JSON.stringify(data,null,2));await fs.rename(catalogPath+'.tmp',catalogPath);return json(res,200,{...data,revision:createHash('sha256').update(JSON.stringify(data)).digest('hex')});}finally{writing=false;}
   }
   if(url.pathname==='/api/admin/upload'&&req.method==='POST'){
    const buffer=await body(req,6*1024*1024),image=sharp(buffer,{limitInputPixels:24000000}),meta=await image.metadata();if(!['png','jpeg','webp'].includes(meta.format))throw new Error('Upload a PNG, JPEG or WebP bottle image.');
    const name=randomBytes(16).toString('hex')+'.webp',dir=path.join(root,'public/assets/uploads');await fs.mkdir(dir,{recursive:true});await image.rotate().resize({width:900,height:1800,fit:'inside',withoutEnlargement:true}).webp({quality:92}).toFile(path.join(dir,name));return json(res,201,{artwork:'/assets/uploads/'+name});
   }
   return json(res,405,{error:'Method not allowed.'});
  }catch(e){return json(res,400,{error:e.message||'The operation could not be completed.'});}
 };
 return {name:'nura-local-admin',configureServer(server){server.middlewares.use(middleware);},configurePreviewServer(server){server.middlewares.use(middleware);}};
}
