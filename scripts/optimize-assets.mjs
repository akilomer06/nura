import fs from 'node:fs/promises';
import sharp from 'sharp';
const generated='C:/Users/brain/.codex/generated_images/01a19e00-4c11-7193-9a38-846910b35cfe/';
const initial={
 'al-zaf':'exec-e732ef3f-ab7f-464c-a2e6-59d846de9284.png',
 'al-harun':'exec-505a2b52-6d05-4a7a-beee-50e89830a76f.png',
 'al-kamrah':'exec-93542732-1679-45ee-963e-cc161361bd56.png',
 'almarj':'exec-e258bc95-a778-4952-9e5f-7491a6e4a498.png'
};
const entries=Object.entries(initial).map(([id,path])=>({id,path:generated+path}));
for(const file of await fs.readdir('source-recovery'))if(file.endsWith('-generation.json'))entries.push(JSON.parse(await fs.readFile('source-recovery/'+file,'utf8')));
await fs.mkdir('public/assets/bottles',{recursive:true});
for(const {id,path} of entries){
 const output=`public/assets/bottles/${id}.webp`;
 try{await fs.access(output);continue;}catch{}
 const {channels}=await sharp(path).metadata();
 if(channels!==4)throw Error(`${id}: missing alpha channel`);
 await sharp(path).trim({background:'#00000000',threshold:15}).resize({width:500,height:1200,fit:'inside',withoutEnlargement:true}).webp({quality:91,alphaQuality:100,effort:5}).toFile(output);
 await sharp(output).resize({width:220,height:520,fit:'inside',withoutEnlargement:true}).webp({quality:86,alphaQuality:100,effort:5}).toFile(output.replace('.webp','-small.webp'));
 console.log('Optimized',id);
}
try{await fs.access('public/assets/stone.webp');}catch{await sharp(generated+'exec-9c9e3dfd-9718-407f-b318-30bc8069ec86.png').resize({width:1600,withoutEnlargement:true}).webp({quality:85}).toFile('public/assets/stone.webp');console.log('Optimized stone texture');}
console.log(entries.length,'bottle outputs available.');
