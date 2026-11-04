// Render native vector labels over the image-edited blank packaging masters.
import fs from 'node:fs/promises';
import sharp from 'sharp';
const brand=JSON.parse(await fs.readFile('src/brand-data.json','utf8'));
const products=JSON.parse(await fs.readFile('src/catalog.json','utf8'));
const font=brand.font;
const paths=(text,size)=>{
 let x=0;const items=[];
 for(const letter of text){const glyph=font.glyphs[letter]||font.glyphs['?'];if(!glyph)continue;items.push({d:glyph.d,x});x+=glyph.ha+24;}
 return {width:x*size/font.units,body:items.map(p=>`<path d="${p.d}" transform="translate(${p.x*size/font.units} 0) scale(${size/font.units} ${-size/font.units})"/>`).join('')};
};
// Preserve the exact supplied outlines, including the U's original hairline.
const part=(name,x,y,width)=>`<path fill-rule="evenodd" d="${brand[name].d}" transform="translate(${x} ${y}) scale(${width/brand[name].width})"/>`;
const configs={oil:{file:'public/assets/packaging/oil-master.png',label:[.14,.45,.72,.36]},perfume:{file:'public/assets/packaging/perfume-master.png',label:[.16,.39,.68,.40]}};
const manifest={};
for(const [format,config] of Object.entries(configs)){
 const master=await fs.readFile(config.file);const {width:w,height:h}=await sharp(master).metadata();
 const [fx,fy,fw,fh]=config.label;const x=fx*w,y=fy*h,width=fw*w,height=fh*h;
 for(const p of products){
  const name=p.name.toLocaleUpperCase('en');const lines=name.length>15?name.split(/ (?=[^ ]+$)/):[name];
  let label=part('emblem',x+width*.34,y+height*.02,width*.32)+part('word',x+width*.06,y+height*.33,width*.88)+part('byline',x+width*.13,y+height*.49,width*.74);
  for(let i=0;i<lines.length;i++){let text=paths(lines[i],width*.14);if(text.width>width*.96)text=paths(lines[i],width*.14*width*.96/text.width);label+=`<g transform="translate(${x+(width-text.width)/2} ${y+height*(.76+i*.12)})">${text.body}</g>`;}
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><image width="${w}" height="${h}" href="data:image/png;base64,${master.toString('base64')}"/><g fill="#d1b76c">${label}</g></svg>`;
  const file=`/assets/bottles/${p.id}-${format}-brand-v5.webp`;
  // Keep the master's native resolution and lossless text instead of reducing
  // the label before the browser/GPU performs its own final-size sampling.
  const buffer=await sharp(Buffer.from(svg),{limitInputPixels:false}).webp({lossless:true,effort:4}).toBuffer();
  await fs.writeFile('public'+file,buffer);
  await sharp(buffer).resize({width:220}).webp({lossless:true}).toFile('public'+file.replace('.webp','-small.webp'));
  (manifest[p.id]??={})[format]=file;
 }
}
await fs.writeFile('src/bottle-artwork.json',JSON.stringify(manifest,null,2)+'\n');
console.log('Rendered 30 branded format images and 30 small collection images.');
