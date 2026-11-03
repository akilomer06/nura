import sharp from 'sharp';
import fs from 'node:fs/promises';
const products=JSON.parse(await fs.readFile('source-recovery/catalog-original.json'));
const summaries=[
'Jasmine and almond open into roasted coffee and cocoa, settling on warm amber and woods.',
'Leather and geranium give way to smoky cedar, with a soft finish of amber, musk and sandalwood.',
'Bergamot and cinnamon over dates and praline. Vanilla, amber and tonka bring a warm finish.',
'Juicy fruit and soft blossom meet dark leather, warm woods and oud.',
'Raspberry and pear unfold into honey and delicate florals, grounded by leather and warm woods.',
'A fresh citrus opening lifts traditional oud, with a warm floral heart and soft leather finish.',
'Blood orange, plum and red berries soften into musk, vanilla and warm woods.',
'Lemon and ripe peach brighten cherry blossom and jasmine, over airy musk and cedar.',
'Sicilian citrus and sun-ripened fruit settle into white musk, vanilla and amber.',
'Dewy fruit and creamy white petals, with a gentle amber and wood finish.',
'A citrus opening gives way to jasmine sambac, softened by earthy amber and vanilla.',
'Orange flower, cardamom and cinnamon wrap around bourbon vanilla and soft guaiac wood.',
'Pistachio and roasted hazelnut meet whipped cream, jasmine and a soft marshmallow finish.',
'Warm vanilla and amber unfold into smoky woods, sensual musk and creamy sandalwood.',
'Cypress and cedar frame smooth sandalwood, with an earthy trail of incense and smoky woods.'
];
await fs.mkdir('src',{recursive:true});
await fs.mkdir('public/assets/bottles',{recursive:true});
await fs.writeFile('src/catalog.json',JSON.stringify(products.map((p,i)=>({...p,description:summaries[i],number:String(i+1).padStart(2,'0'),artwork:`/assets/bottles/${p.id}.webp`})),null,2));
await fs.writeFile('source-recovery/variant-inventory.csv','Product,Slug,Perfume 50 ml INR,Perfume 100 ml INR,Oil 6 ml INR,Oil 12 ml INR\n'+products.map(p=>[p.name,p.id,p.perfumePrice50ml,p.perfumePrice100ml,p.oilPrice6ml,p.oilPrice12ml].join(',')).join('\n'));
const composites=[];
for(let i=0;i<products.length;i++){
 const thumb=await sharp(`source-recovery/originals/${products[i].id}-perfume.png`).resize(260,260,{fit:'contain'}).png().toBuffer();
 composites.push({input:thumb,left:(i%5)*260,top:Math.floor(i/5)*290});
 composites.push({input:Buffer.from(`<svg width="260" height="30"><text x="8" y="20" fill="white" font-size="15">${products[i].name}</text></svg>`),left:(i%5)*260,top:Math.floor(i/5)*290+260});
}
await sharp({create:{width:1300,height:870,channels:4,background:'#171c19'}}).composite(composites).png().toFile('source-recovery/contact-sheet.png');
console.log('Catalog and 60-variant inventory prepared.');
