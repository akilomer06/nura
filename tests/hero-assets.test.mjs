import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';

test('optimized hero bottles retain every visible source pixel and all alpha values',async()=>{
 for(const name of ['perfume-original','perfume-oil-original']){
  const source=await sharp(`public/assets/hero/${name}.png`).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const optimized=await sharp(`public/assets/hero/${name}.webp`).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  assert.deepEqual(optimized.info,source.info);
  for(let i=0;i<source.data.length;i+=4){
   assert.equal(optimized.data[i+3],source.data[i+3]);
   // RGB under completely transparent pixels has no visible contribution.
   if(source.data[i+3])for(let channel=0;channel<3;channel++)assert.equal(optimized.data[i+channel],source.data[i+channel]);
  }
 }
});
