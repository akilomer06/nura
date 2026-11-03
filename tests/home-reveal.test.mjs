import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {homeStoryState,homeRevealPose,homeRevealLayers,displayPose,displayCell,HOME_REVEAL_SCREENS,HOME_HOLD_SCREENS} from '../src/collection-layout.mjs';
const screens=[[1440,900],[1024,768],[390,844],[320,740]];
const project=(state,width,height,position)=>{
 const camera=new THREE.PerspectiveCamera(32,width/height,.1,170);
 camera.position.fromArray(state.camera.position);camera.lookAt(new THREE.Vector3(...state.camera.target));camera.updateMatrixWorld();
 const result=new THREE.Vector3(...position).project(camera);return {x:(result.x+1)/2,y:(1-result.y)/2};
};

test('the hybrid story holds one composition and bottle scale before docking',()=>{
 assert.equal(1+HOME_REVEAL_SCREENS+HOME_HOLD_SCREENS,3.6);
 for(const [width,height] of screens){
  const opening=homeStoryState(0,5,width,height);
  for(const progress of [.15,.225,.30,.425,.55,.625,.70,.75,.80]){
   const state=homeStoryState(progress,5,width,height);
   assert.deepEqual(state.camera,opening.camera);assert.deepEqual(state.bottle,opening.bottle);assert.deepEqual(state.source,opening.source);
  }
  const base=project(opening,width,height,opening.bottle.position),top=project(opening,width,height,[opening.bottle.position[0],opening.bottle.position[1]+3.25,opening.bottle.position[2]]);
  assert.ok(Math.abs(base.x-.54)<1e-12);assert.ok(Math.abs(base.y-(width<=700?.88:.84))<1e-12);
  assert.ok(Math.abs(base.y-top.y-(width<=700?.38:.56))<1e-12);
  const outlet=project(opening,width,height,opening.source);assert.ok(outlet.y>0&&outlet.y<top.y);
 }
});

test('docking ends at the existing shelf and transfers exactly one visible bottle',()=>{
 for(const [width,height] of screens)for(let index=0;index<5;index++){
  const cell=displayCell(index,'featured',5,width),state=homeStoryState(1,5,width,height,index);
  assert.deepEqual(state.camera,displayPose('featured',5,width,height));
  assert.deepEqual(state.bottle.position,[cell.x,cell.y+.75*cell.scale,-.48]);assert.equal(state.bottle.scale,cell.scale);
  assert.deepEqual(state.cap.offset,[0,0,0]);assert.equal(state.fill,1);assert.equal(state.stream,0);assert.equal(state.environmentOpacity,0);
  for(const progress of [.969999,.97,1]){const value=homeStoryState(progress,5,width,height,index);assert.equal(Number(value.actorVisible)+Number(value.shelfVisible),1);}
  const transfer=homeStoryState(.97,5,width,height,index);assert.deepEqual(transfer.bottle,state.bottle);assert.deepEqual(transfer.camera,state.camera);
 }
});

test('scroll states reverse deterministically and transforms remain continuous and finite',()=>{
 for(const [width,height] of screens){
  const forward=Array.from({length:401},(_,i)=>homeStoryState(i/400,5,width,height));
  for(let i=400;i>=0;i--){const state=homeStoryState(i/400,5,width,height);assert.deepEqual(state,forward[i]);assert.ok([...state.camera.position,...state.camera.target,...state.bottle.position,...state.cap.offset,...state.drop.position,state.bottle.scale,state.fill,state.streamReach,state.streamDrain,state.environmentOpacity].every(Number.isFinite));
   if(i<400)assert.ok(state.fill<=forward[i+1].fill);
   if(i/400<.92)assert.ok(state.bottle.position[2]>.14);else assert.equal(state.bottle.position[0],displayCell(0,'featured',5,width).x);
   if(i/400>=.80){for(const y of [0,3.25]){const point=project(state,width,height,[state.bottle.position[0],state.bottle.position[1]+y*state.bottle.scale,state.bottle.position[2]]);assert.ok(point.y>=0&&point.y<=1,`Bottle outside viewport ${width} / ${i/400}`);}}
  }
  for(const boundary of [.15,.20,.27,.30,.325,.55,.57,.61,.65,.70,.74,.78,.80,.92,.94,.97]){
   const a=homeStoryState(boundary-1e-7,5,width,height),b=homeStoryState(boundary+1e-7,5,width,height);
   for(const key of ['position','target'])a.camera[key].forEach((v,i)=>assert.ok(Math.abs(v-b.camera[key][i])<.001));
   for(let i=0;i<3;i++){assert.ok(Math.abs(a.bottle.position[i]-b.bottle.position[i])<.001);assert.ok(Math.abs(a.cap.offset[i]-b.cap.offset[i])<.001);}
  }
 }
 assert.deepEqual(homeRevealPose(-1,5,1440,900),homeRevealPose(0,5,1440,900));assert.deepEqual(homeRevealPose(2,5,1440,900),homeRevealPose(1,5,1440,900));
});

test('cap clears the stream before filling and only closes after the final droplet',()=>{
 for(let i=0;i<=1000;i++){
  const p=i/1000,state=homeStoryState(p,5,1440,900);
  if(state.stream>0){assert.ok(state.cap.offset[0]>.9);assert.ok(state.cap.offset[1]>.6);}
  if(p<.325)assert.equal(state.fill,.12);
  if(p>.65&&state.cap.offset[0]<.9){assert.equal(state.stream,0);assert.equal(state.drop.visible,false);}
 }
 const full=homeStoryState(.55,5,1440,900);assert.equal(full.fill,1);
 const closed=homeStoryState(.78,5,1440,900);assert.deepEqual(closed.cap.offset,[0,0,0]);
 const middle=homeStoryState(.425,5,1440,900);assert.ok(middle.fill>.12&&middle.fill<1);assert.equal(middle.streamReach,1);
 assert.equal(homeRevealLayers(.12).brandOpacity,1);assert.equal(homeRevealLayers(.15).brandOpacity,0);
 assert.equal(homeRevealLayers(.97).collectionOpacity,0);assert.equal(homeRevealLayers(.998).selectionReady,false);assert.equal(homeRevealLayers(1).selectionReady,true);
 assert.deepEqual([0,.225,.425,.625,.75,.9].map(p=>homeRevealLayers(p).chapter),[0,1,2,3,4,5]);
});
