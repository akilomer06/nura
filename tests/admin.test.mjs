import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import sharp from 'sharp';
import {localAdmin} from '../server/local-admin.mjs';
import {validateCatalog} from '../src/catalog-validation.mjs';
import {DEFAULT_RATES,displayMoney} from '../src/currencies.mjs';
import {addItem,whatsappUrl} from '../src/domain.mjs';
const seed=JSON.parse(await fs.readFile(new URL('../src/catalog.json',import.meta.url),'utf8'));

test('catalog validation rejects duplicate URLs, invalid prices, unsafe images and rates',()=>{
 const valid={products:structuredClone(seed),rates:DEFAULT_RATES};assert.equal(validateCatalog(valid).products.length,15);
 for(const mutate of [d=>d.products.push(d.products[0]),d=>d.products[0].oilPrice6ml=-1,d=>d.products[0].artwork='javascript:alert(1)',d=>d.rates={...d.rates,INR:2},d=>d.products[0].notes.top='']){const data=structuredClone(valid);mutate(data);assert.throws(()=>validateCatalog(data));}
});
test('converted orders include both the chosen currency and the original INR subtotal',()=>{
 assert.equal(displayMoney(1000,'AED'),'AED 44.00');assert.equal(displayMoney(1000,'USD'),'US$12.00');
 const cart=addItem([],seed[0],'oil',6,2),message=decodeURIComponent(whatsappUrl(cart,seed,{currency:'AED'}).split('text=')[1]);
 assert.match(message,/AED/);assert.match(message,/45\.76/);assert.match(message,/Base subtotal: ₹1,040 INR/);assert.match(message,/Indicative AED/);
});
test('local admin enforces authentication, origin checks, persistence, draft visibility and image validation',async t=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'nura-admin-test-'));await fs.mkdir(path.join(root,'src'));await fs.writeFile(path.join(root,'src/catalog.json'),JSON.stringify(seed));
 let handler;localAdmin({root}).configureServer({middlewares:{use(fn){handler=fn;}}});
 const server=http.createServer((req,res)=>handler(req,res,()=>{res.writeHead(404);res.end();}));await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(async()=>{await new Promise(resolve=>server.close(resolve));await fs.rm(root,{recursive:true,force:true});});
 const base=`http://127.0.0.1:${server.address().port}`;
 const request=(url,options={})=>fetch(base+url,options);
 assert.equal((await request('/api/admin/catalog')).status,401);
 assert.equal((await request('/api/admin/session',{method:'POST',headers:{Origin:'https://attacker.example','Content-Type':'application/json'},body:JSON.stringify({password:'fixture-password-only'})})).status,403);
 const login=await request('/api/admin/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:'fixture-password-only'})});assert.equal(login.status,200);const cookie=login.headers.get('set-cookie').split(';')[0];assert.match(login.headers.get('set-cookie'),/HttpOnly; SameSite=Strict/);
 const data=await(await request('/api/admin/catalog',{headers:{Cookie:cookie}})).json();data.products[0].oilPrice6ml=777;data.products[1].published=false;
 const save=()=>request('/api/admin/catalog',{method:'PUT',headers:{Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify(data)});
 assert.equal((await save()).status,200);assert.equal((await save()).status,409);
 const storefront=await(await request('/api/catalog')).json();assert.equal(storefront.products.length,14);assert.equal(storefront.products[0].oilPrice6ml,777);assert.equal(JSON.parse(await fs.readFile(path.join(root,'.nura-admin/catalog.json'),'utf8')).products[0].oilPrice6ml,777);
 const invalid=await request('/api/admin/upload',{method:'POST',headers:{Cookie:cookie,'Content-Type':'image/png'},body:'<svg>invalid</svg>'});assert.equal(invalid.status,400);
 const png=await sharp({create:{width:20,height:40,channels:4,background:'#aabbcc00'}}).png().toBuffer();
 const upload=await request('/api/admin/upload',{method:'POST',headers:{Cookie:cookie,'Content-Type':'image/png'},body:png});assert.equal(upload.status,201);const image=await upload.json();assert.match(image.artwork,/^\/assets\/uploads\/[a-f0-9]+\.webp$/);assert.equal((await sharp(await fs.readFile(path.join(root,'public',image.artwork))).metadata()).hasAlpha,true);
 await request('/api/admin/session',{method:'DELETE',headers:{Cookie:cookie}});assert.equal((await request('/api/admin/catalog',{headers:{Cookie:cookie}})).status,401);
});
