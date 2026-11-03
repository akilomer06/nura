import fs from 'node:fs/promises';
for(const file of ['scripts/extract-catalog.mjs','scripts/prepare-catalog.mjs']){
 const content=await fs.readFile(file,'utf8');await fs.writeFile(file,content.replaceAll('public/assets/originals','source-recovery/originals'));
}
for(const file of await fs.readdir('source-recovery'))if(file.endsWith('-generation.json')){
 const item=JSON.parse(await fs.readFile('source-recovery/'+file,'utf8'));item.source=item.source.replace('public/assets/originals','source-recovery/originals');await fs.writeFile('source-recovery/'+file,JSON.stringify(item,null,2));
}
const main=await fs.readFile('src/main.jsx','utf8');await fs.writeFile('src/main.jsx',main.replace("window.scrollTo({top:0,behavior:'smooth'})","window.scrollTo({top:0,behavior:scrollBehavior()})").replace("sizes={large?'(max-width: 700px) 75vw, 40vw':'(max-width: 700px) 50vw, 17vw'}","sizes={large?'(max-width: 700px) 60vw, 25vw':'(max-width: 700px) 50vw, 17vw'}").replace(' 400w, ${product.artwork} 900w',' 220w, ${product.artwork} 500w'));
console.log('Source image archive separated from shipped assets.');
