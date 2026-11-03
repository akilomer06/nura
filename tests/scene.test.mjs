import test from 'node:test';
import assert from 'node:assert/strict';
import {NICHE,visibleCount,maxGalleryIndex,clampIndex,galleryPose,detailPose,cameraEase} from '../src/scene-layout.mjs';

test('gallery has finite camera bounds for desktop, tablet and mobile',()=>{
 assert.equal(visibleCount(1440),5);assert.equal(visibleCount(834),3);assert.equal(visibleCount(390),3.35);
 assert.equal(maxGalleryIndex(15,1440),10);assert.equal(maxGalleryIndex(15,834),12);assert.equal(maxGalleryIndex(15,390),12);
 for(const width of [320,390,592,834,1440]){assert.equal(clampIndex(-10,15,width),0);assert.equal(clampIndex(99,15,width),maxGalleryIndex(15,width));assert.equal(maxGalleryIndex(0,width),0);assert.equal(maxGalleryIndex(1,width),0);}
});
test('horizontal navigation travels in world space, with a stable height and depth',()=>{
 const first=galleryPose(0,15,1440,900),next=galleryPose(1,15,1440,900);
 assert.ok(Math.abs(next.position[0]-first.position[0]-NICHE.stride)<1e-10);assert.equal(next.position[1],first.position[1]);assert.equal(next.position[2],first.position[2]);
 assert.ok(Math.abs(next.target[0]-first.target[0]-NICHE.stride)<1e-10);
});
test('detail poses approach the actual selected compartment without changing rooms',()=>{
 for(const width of [390,1440])for(let i=0;i<15;i++){
  const close=detailPose(i,width),wide=galleryPose(Math.min(i,10),15,width,900);
  assert.ok(close.position[2]<wide.position[2]);assert.ok(Math.abs(close.target[0]-i*NICHE.stride)<1.5);assert.ok(close.position.every(Number.isFinite));
 }
});
test('reference easing is continuous, monotonic and has no zoom overshoot',()=>{
 let previous=0;assert.ok(cameraEase(0)<1e-7);assert.ok(Math.abs(cameraEase(1)-1)<1e-7);
 for(let i=0;i<=100;i++){const value=cameraEase(i/100);assert.ok(value>=previous-1e-7);assert.ok(value>=0&&value<=1);previous=value;}
});
