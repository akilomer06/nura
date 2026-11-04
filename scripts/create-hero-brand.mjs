// Native outlined brand artwork for DOM labels and the rotating Three.js decal.
// Uses the approved paths, including the original U hairline, without redrawing.
import fs from 'node:fs/promises';
const brand=JSON.parse(await fs.readFile(new URL('../src/brand-data.json',import.meta.url),'utf8'));
const part=(name,x,y,width)=>`<path fill-rule="evenodd" d="${brand[name].d}" transform="translate(${x} ${y}) scale(${width/brand[name].width})"/>`;
const body=part('emblem',260,6,120)+part('word',30,158,580)+part('byline',180,307,280);
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="680" viewBox="0 0 640 340" role="img" aria-label="NURA by Bin Sadhik"><g fill="#d1b76c">${body}</g></svg>\n`;
await fs.writeFile(new URL('../public/assets/brand/nura-logo-bottle.svg',import.meta.url),svg);
console.log('Created outlined gold NURA bottle logo.');
