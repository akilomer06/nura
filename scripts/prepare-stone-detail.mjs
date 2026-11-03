// The generated scan supplies relief only. The existing stone.webp stays the colour map.
import sharp from 'sharp';
const source=process.argv[2];
if(!source)throw new Error('Pass the generated basalt scan path.');
await sharp(source).greyscale().normalise({lower:1,upper:99}).webp({quality:94,effort:6}).toFile('public/assets/stone-detail-v1.webp');
console.log('Prepared public/assets/stone-detail-v1.webp (surface relief only).');
