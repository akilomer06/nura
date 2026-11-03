import fs from 'node:fs/promises';
const root = new URL('../', import.meta.url);
await fs.mkdir(new URL('source-recovery/', root), {recursive:true});
const paths=['/','/collections','/products/al-zaf','/about','/circle-of-light','/create','/bespoke','/contact','/faq','/shipping','/shipping-returns','/terms','/privacy','/store-locator'];
const chunks=new Set();
for(const path of paths){
 const html=await (await fetch('https://nura-i33k.vercel.app'+path)).text();
 await fs.writeFile(new URL('source-recovery/'+(path==='/'?'home':path.replaceAll('/','_'))+'.html',root),html);
 for(const match of html.matchAll(/src="([^" ]+\.js)"/g)) chunks.add(match[1]);
}
for(const path of chunks){ const text=await(await fetch('https://nura-i33k.vercel.app'+path)).text(); await fs.writeFile(new URL('source-recovery/'+path.split('/').pop(),root),text); }
console.log('Recovered',paths.length,'pages and',chunks.size,'public JavaScript bundles.');
