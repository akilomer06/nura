import fs from 'node:fs/promises';
const text=await fs.readFile('source-recovery/065-guam3v1y8.js','utf8');
const start=text.indexOf('[{id:"al-zaf"');
let depth=0, quoted=false,escaped=false,end;
for(let i=start;i<text.length;i++) {const c=text[i];if(quoted){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')quoted=false;}else if(c==='"')quoted=true;else if(c==='[')depth++;else if(c===']'&&!--depth){end=i+1;break;}}
const raw=text.slice(start,end);
const products=JSON.parse(raw.replace(/([{,])(\w+):/g,'$1"$2":'));
await fs.mkdir('source-recovery/originals',{recursive:true});
await fs.writeFile('source-recovery/catalog-original.json',JSON.stringify(products,null,2));
for(const p of products){for(const [format,url] of [['perfume',p.image],['oil',p.oilImage]]){if(!url)continue; const file=`source-recovery/originals/${p.id}-${format}.png`;try{await fs.access(file);continue;}catch{} const response=await fetch('https://nura-i33k.vercel.app'+url);if(!response.ok){console.warn('Missing source asset:',url);continue;}await fs.writeFile(file,Buffer.from(await response.arrayBuffer()));}}
console.log(JSON.stringify(products,null,2));
