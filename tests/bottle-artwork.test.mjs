import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {bottleArtwork} from '../src/bottle-artwork.mjs';
const catalog=JSON.parse(fs.readFileSync(new URL('../src/catalog.json',import.meta.url)));
test('all 15 collection oil bottles have a distinct branded perfume counterpart',()=>{
 for(const product of catalog){
  const oil=bottleArtwork(product),perfume=bottleArtwork(product,'perfume');
  assert.match(oil,/-oil-brand-v5.webp$/);assert.match(perfume,/-perfume-brand-v5.webp$/);assert.notEqual(oil,perfume);
  for(const format of ['oil','perfume']){
   const artwork=bottleArtwork(product,format),preview=bottleArtwork(product,format,true);
   assert.notEqual(artwork,preview);
   for(const path of [artwork,preview])assert.ok(fs.existsSync(new URL('../public'+path,import.meta.url)));
  }
 }
});
test('custom uploaded artwork and explicit format images remain authoritative',()=>{
 const product={...catalog[0],artwork:'/assets/uploads/custom.webp'};
 assert.equal(bottleArtwork(product,'oil'),product.artwork);assert.equal(bottleArtwork(product,'perfume'),product.artwork);
 assert.equal(bottleArtwork({...product,perfumeArtwork:'/assets/uploads/spray.webp'},'perfume',true),'/assets/uploads/spray.webp');
});
