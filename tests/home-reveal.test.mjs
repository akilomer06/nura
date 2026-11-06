import test from 'node:test';
import assert from 'node:assert/strict';
import {displayCell,displayPose,homeStoryState} from '../src/collection-layout.mjs';
import {NICHE} from '../src/scene-layout.mjs';

const screens=[[1440,900],[1024,768],[390,844],[320,740]];

test('the empty vessel opens before the oil arrives, then closes before departure',()=>{
 for(const [width,height] of screens){
  const frame=p=>homeStoryState(p,5,width,height);
  const opening=frame(0),threaded=frame(.22),uncapped=frame(.30),pouring=frame(.56),finished=frame(.805);
  assert.equal(opening.fill,0);
  assert.deepEqual(opening.cap.offset,[0,0,0]);
  assert.equal(threaded.cap.offset[0],0);
  assert.ok(threaded.cap.rotation[1]>Math.PI*2);
  assert.ok(threaded.cap.offset[1]>0&&threaded.cap.offset[1]<.25);
  assert.ok(uncapped.cap.offset[1]>.6);
  assert.ok(uncapped.camera.position[2]<opening.camera.position[2]);
  assert.equal(uncapped.stream,0);
  assert.equal(pouring.streamReach,1);
  assert.ok(pouring.fill>0&&pouring.fill<1);
  assert.ok(pouring.source[1]>pouring.bottle.position[1]+2.29);
  assert.equal(finished.fill,1);
  assert.equal(finished.stream,0);
  assert.deepEqual(finished.cap.offset,[0,0,0]);
  assert.deepEqual(finished.cap.rotation,[0,0,0]);
 }
});

test('Althaïr clears the shelf face before it slides into the first responsive niche',()=>{
 for(const [width,height] of screens){
  const frame=p=>homeStoryState(p,5,width,height);
  const cell=displayCell(0,'featured',5,width);
  const landed=frame(1);
  assert.deepEqual(landed.camera,displayPose('featured',5,width,height));
  assert.deepEqual(landed.bottle.position,[cell.x,cell.y+.75*cell.scale,NICHE.bottleZ]);
  assert.equal(landed.bottle.scale,cell.scale);
  assert.equal(landed.shelfArtwork,1);
  for(let i=805;i<=1000;i++){
   const {bottle,shelfArtwork}=frame(i/1000);
   if(bottle.position[2]<NICHE.front+.32){
    assert.equal(bottle.position[0],cell.x);
    assert.equal(bottle.position[1],cell.y+.75*cell.scale);
   }
   if(shelfArtwork>0){
    assert.equal(bottle.position[0],cell.x);
    assert.equal(bottle.position[1],cell.y+.75*cell.scale);
   }
   if(shelfArtwork===1)assert.ok(Math.abs(bottle.position[2]-NICHE.bottleZ)<.01);
  }
 }
});

test('scroll states are finite and continuous at every handoff in both directions',()=>{
 for(const [width,height] of screens){
  const sample=Array.from({length:1001},(_,index)=>homeStoryState(index/1000,5,width,height));
  for(let i=1000;i>=1;i--){
   const next=sample[i],previous=sample[i-1];
   assert.deepEqual(next,homeStoryState(i/1000,5,width,height));
   assert.ok([...next.bottle.position,...next.camera.position,...next.cap.offset,next.fill,next.stream].every(Number.isFinite));
   assert.ok(next.fill>=previous.fill);
   assert.ok(next.camera.position.every((value,axis)=>Math.abs(value-previous.camera.position[axis])<.41));
   assert.ok(next.bottle.position.every((value,axis)=>Math.abs(value-previous.bottle.position[axis])<.2));
  }
 }
});
