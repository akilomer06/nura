import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {FEATURED_IDS,featuredProducts,displayLayout,displayCell,displayPose,displayDetailPose,shelfHeight} from '../src/collection-layout.mjs';
const products=JSON.parse(await fs.readFile(new URL('../src/catalog.json',import.meta.url),'utf8'));
test('home features only the requested five existing fragrances, in the requested order',()=>{
 assert.deepEqual(FEATURED_IDS,['althair-pdm','erba-pura','delighted-dior','almarj','sheikh-musk']);
 assert.deepEqual(featuredProducts(products).map(p=>p.name),['Althaïr','Erba Pura','Delighted Dior','Al Marj','Sheikh Musk']);
 assert.equal(featuredProducts(products).length,5);assert.equal(products.length,15);
});
test('the shelf lays out every product in distinct columns and rows at each breakpoint',()=>{
 for(const width of [320,390,834,1440]){
  const {columns,rows}=displayLayout('shelf',15,width),cells=products.map((p,i)=>displayCell(i,'shelf',15,width));
  assert.equal(columns,width>1050?5:3);assert.equal(rows,Math.ceil(15/columns));assert.equal(new Set(cells.map(c=>`${c.x}:${c.y}`)).size,15);
  assert.ok(shelfHeight(15,width)>0);assert.ok(shelfHeight(0,width)<400);
  for(let i=0;i<15;i++){const pose=displayDetailPose(i,'shelf',15,width),cell=cells[i];assert.ok(pose.position.every(Number.isFinite));assert.ok(Math.abs(pose.target[0]-cell.x)<1);assert.ok(pose.target[1]>cell.y);}
 }
});
test('vertical scrolling moves the shelf camera by the matching world distance without horizontal travel',()=>{
 for(const width of [390,1440]){
  const before=displayPose('shelf',15,width,900,{scroll:0,top:280}),after=displayPose('shelf',15,width,900,{scroll:400,top:280});
  const {columns}=displayLayout('shelf',15,width),unitsPerPixel=(columns*3.1+.8)/width;
  assert.equal(before.position[0],after.position[0]);assert.equal(before.position[2],after.position[2]);assert.ok(Math.abs(before.position[1]-after.position[1]-400*unitsPerPixel)<1e-10);
 }
});
