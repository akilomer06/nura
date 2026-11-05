import test from 'node:test';
import assert from 'node:assert/strict';
import {HERO_CONFIG,heroStoryState,heroEntranceProgress,heroEntranceLayers} from '../src/hero-story.mjs';

test('centred brand opens automatically and immediate scrolling can advance it',()=>{
 const {holdSeconds,openSeconds,scrollEnd}=HERO_CONFIG.entrance;
 assert.equal(heroEntranceProgress(0,0),0);
 assert.equal(heroEntranceProgress(holdSeconds,0),0);
 assert.equal(heroEntranceProgress(holdSeconds+openSeconds+.01,0),1);
 assert.equal(heroEntranceProgress(0,scrollEnd),1);
 assert.equal(heroEntranceProgress(0,0,1),1);
 assert.equal(heroEntranceProgress(0,0,0,false),1);
 assert.deepEqual(heroEntranceLayers(0),{brandOpacity:1,sceneOpacity:0,scale:1,y:-0});
 assert.equal(heroEntranceLayers(1).brandOpacity,0);assert.equal(heroEntranceLayers(1).sceneOpacity,1);
 for(let i=0;i<=100;i++){
  const state=heroEntranceLayers(i/100);
  assert.ok(Object.values(state).every(Number.isFinite));
  assert.ok(state.brandOpacity<.5||state.sceneOpacity<.5,'brand clears before product copy becomes prominent');
 }
});

test('each chapter is readable at its milestone; only its own CTA is enabled',()=>{
 for(const [p,index] of [[0,0],[.25,1],[.5,2],[.75,3],[1,3]]){
  const state=heroStoryState(p);assert.equal(state.copy[index].opacity,1);
  state.copy.forEach((copy,i)=>{if(i!==index)assert.equal(copy.opacity,0);});
 }
 assert.equal(HERO_CONFIG.phases[0].action,'featured');assert.equal(HERO_CONFIG.phases[3].action,'shelf');
});

test('the centered copy comes into view as the perfume moves left',()=>{
 for(let i=0;i<=250;i++){
  const {copy}=heroStoryState(i/1000);
  assert.ok(copy[0].opacity>0||copy[1].opacity>0);
 }
 assert.ok(heroStoryState(.2).copy[1].opacity>.8);
});
test('product poses fit desktop, tablet and narrow phones without distorting their aspect ratios',()=>{
 for(const [width,height] of [[1920,1080],[1440,900],[1168,861],[1024,768],[768,1024],[390,844],[320,740]]){
  for(let i=0;i<=400;i++){
   const state=heroStoryState(i/400,width,height);
   for(const [key,ratio] of [['perfume',821/1916],['oil',700/2048]]){
    const pose=state[key],halfWidth=pose.height*height*ratio/2;
    assert.ok(pose.x*width-halfWidth>=0,`${key} left edge ${width} at ${i}`);
    assert.ok(pose.x*width+halfWidth<=width,`${key} right edge ${width} at ${i}`);
    assert.ok(pose.base-pose.height>=.1&&pose.base<=.91,`${key} vertical fitting`);
   }
  }
 }
});
test('timeline is continuous at phase boundaries and deterministic when reversed',()=>{
 const samples=Array.from({length:1001},(_,i)=>heroStoryState(i/1000));
 for(let i=1000;i>=0;i--)assert.deepEqual(heroStoryState(i/1000),samples[i]);
 for(const p of [.17,.21,.25,.42,.46,.5,.625,.67,.71,.75,1]){
  const before=heroStoryState(p-1e-6),after=heroStoryState(p+1e-6);
  for(const key of ['perfume','oil'])for(const coordinate of ['x','base','height'])assert.ok(Math.abs(before[key][coordinate]-after[key][coordinate])<.0001);
  assert.ok(Math.abs(before.perfume.yaw-after.perfume.yaw)<.0001);
  before.copy.forEach((pose,i)=>assert.ok(Math.abs(pose.opacity-after.copy[i].opacity)<.0001));
 }
 for(const value of [NaN,Infinity,-Infinity,-2,2])assert.ok(Number.isFinite(heroStoryState(value).perfume.x));
});
test('scroll rotates the main bottle, moves it left and settles without exposing the back',()=>{
 for(const [w,h] of [[1440,900],[1024,768],[390,844],[320,740]]){
  const opening=heroStoryState(0,w,h),craft=heroStoryState(.25,w,h),end=heroStoryState(1,w,h);
  assert.equal(opening.perfume.yaw,0);assert.ok(craft.perfume.yaw<-.4);assert.ok(heroStoryState(.75,w,h).perfume.yaw>.3);
  assert.ok(craft.perfume.x<opening.perfume.x);assert.ok(end.perfume.x<.5);
  for(let i=0;i<=1000;i++){const pose=heroStoryState(i/1000,w,h).perfume;assert.ok(Number.isFinite(pose.yaw)&&Math.abs(pose.yaw)<Math.PI/6);}
 }
});
