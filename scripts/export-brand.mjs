import fs from 'node:fs/promises';
import sharp from 'sharp';
const dir='public/assets/brand/';
for(const name of ['nura-logo','nura-logo-dark'])await sharp(dir+name+'.svg',{density:300}).resize(2400).png().toFile(dir+name+'.png');
await sharp(dir+'nura-emblem.svg',{density:300}).resize(1024).png().toFile(dir+'nura-emblem.png');
await sharp(dir+'nura-favicon.svg',{density:300}).resize(180).png().toFile(dir+'nura-touch-icon.png');
console.log('Exported transparent 2400px logos, 1024px emblem and touch icon.');
