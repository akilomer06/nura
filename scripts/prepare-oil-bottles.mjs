import fs from 'node:fs/promises';
import sharp from 'sharp';
const catalog=JSON.parse(await fs.readFile('src/catalog.json','utf8'));
const tiles=[];
for(const product of catalog){
 const record=JSON.parse(await fs.readFile(`source-recovery/oil-v2-${product.id}.json`,'utf8'));
 const bytes=await fs.readFile(record.path),meta=await sharp(bytes).metadata();if(!meta.hasAlpha)throw new Error(`${product.id} needs transparency.`);
 const output=`public/assets/bottles/${product.id}-oil-v2.webp`;
 await sharp(bytes).trim({background:'#00000000',threshold:15}).resize({width:500,height:1400,fit:'inside',withoutEnlargement:true}).webp({quality:93,alphaQuality:100,effort:5}).toFile(output);
 await sharp(await fs.readFile(output)).resize({width:220,height:620,fit:'inside',withoutEnlargement:true}).webp({quality:88,alphaQuality:100,effort:5}).toFile(output.replace('.webp','-small.webp'));
 product.artwork=output.replace('public','');
 const tile=await sharp(await fs.readFile(output)).resize({width:180,height:530,fit:'contain',background:'#101b1500'}).png().toBuffer();tiles.push({input:tile,left:(tiles.length%5)*200+10,top:Math.floor(tiles.length/5)*560+15});
 console.log('Prepared',product.id);
}
await fs.writeFile('src/catalog.json',JSON.stringify(catalog,null,2)+'\n');
await sharp({create:{width:1000,height:1680,channels:4,background:'#17211b'}}).composite(tiles).jpeg({quality:92}).toFile('source-recovery/oil-bottles-v2-contact-sheet.jpg');
