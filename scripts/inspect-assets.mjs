import sharp from 'sharp';
import fs from 'node:fs/promises';
const products=JSON.parse(await fs.readFile('src/catalog.json','utf8'));
const composites=[];
for(let i=0;i<products.length;i++){
 const path='public'+products[i].artwork,meta=await sharp(path).metadata();
 if(!meta.hasAlpha)throw Error(`${path}: missing alpha`);
 const thumb=await sharp(path).resize(210,290,{fit:'contain',background:'#0d1811'}).png().toBuffer();
 composites.push({input:thumb,left:(i%5)*230+10,top:Math.floor(i/5)*330});
 composites.push({input:Buffer.from(`<svg width="230" height="35"><text x="8" y="23" fill="white" font-size="14">${products[i].name}</text></svg>`),left:(i%5)*230,top:Math.floor(i/5)*330+290});
}
await sharp({create:{width:1150,height:990,channels:3,background:'#0d1811'}}).composite(composites).png().toFile('source-recovery/cleaned-contact-sheet.png');
console.log('All 15 bottle assets present with transparency.');
