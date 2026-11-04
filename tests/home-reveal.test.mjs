import test from 'node:test';
import assert from 'node:assert/strict';
import {homeRevealPose,homeRevealLayers,displayPose,HOME_REVEAL_SCREENS,HOME_HOLD_SCREENS,HOME_STORY_FRACTION} from '../src/collection-layout.mjs';
const screens=[[1440,900],[1024,768],[390,844],[320,740]];
test('restored entrance settles at the existing responsive collection camera',()=>{
 assert.equal(1+HOME_REVEAL_SCREENS+HOME_HOLD_SCREENS,5.4);
 for(const [w,h] of screens)assert.deepEqual(homeRevealPose(1,5,w,h),displayPose('featured',5,w,h));
});
test('stone camera remains finite, continuous and reversible across responsive sizes',()=>{
 for(const [w,h] of screens){let last=homeRevealPose(0,5,w,h);for(let i=1;i<=1000;i++){const p=homeRevealPose(i/1000,5,w,h);assert.ok([...p.position,...p.target].every(Number.isFinite));assert.ok(p.position[2]>=last.position[2]-1e-9);assert.deepEqual(p,homeRevealPose(i/1000,5,w,h));assert.ok(Math.abs(p.position[2]-last.position[2])<1);last=p;}}
});
test('branding fades before collection interaction becomes available',()=>{
 assert.equal(homeRevealLayers(0).brandOpacity,1);assert.equal(homeRevealLayers(HOME_STORY_FRACTION).brandOpacity,1);assert.equal(homeRevealLayers(.85).brandOpacity,0);assert.equal(homeRevealLayers(.85).collectionOpacity,0);assert.equal(homeRevealLayers(.998).selectionReady,false);assert.equal(homeRevealLayers(1).collectionOpacity,1);assert.equal(homeRevealLayers(1).selectionReady,true);
});
test('all four chapters retain the original stone camera before the wall reveal',()=>{
 for(const [w,h] of screens)for(let i=0;i<=12;i++)assert.deepEqual(homeRevealPose(i/12*HOME_STORY_FRACTION,5,w,h),homeRevealPose(0,5,w,h));
 assert.equal(homeRevealLayers(HOME_STORY_FRACTION).storyProgress,1);
 assert.equal(homeRevealLayers(HOME_STORY_FRACTION).wallProgress,0);
});
