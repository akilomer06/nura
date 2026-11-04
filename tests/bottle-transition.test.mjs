import test from 'node:test';
import assert from 'node:assert/strict';
import {bottleTransitionPose} from '../src/bottle-transition.mjs';
import {browseFormat} from '../src/browse-format.mjs';
test('shelf and reopened products preserve the chosen format, with oil as the first-visit default',()=>{
 assert.equal(browseFormat('/shelf'),'oil');
 for(const path of ['/shelf','/','/products/al-harun','/about'])assert.equal(browseFormat(path,'','perfume'),'perfume');
 assert.equal(browseFormat('/shelf','format=perfume','oil'),'perfume');
 assert.equal(browseFormat('/products/al-zaf','format=oil','perfume'),'oil');
 assert.equal(browseFormat('/shelf','format=invalid','perfume'),'perfume');
 assert.equal(browseFormat('/perfume','format=oil','perfume'),'oil');
 assert.equal(browseFormat('/perfume'),'perfume');assert.equal(browseFormat('/perfume-oil','','perfume'),'oil');
});
test('the dissolve has exact endpoints and reverses without a flash',()=>{
 assert.equal(bottleTransitionPose(0).blend,0);assert.equal(bottleTransitionPose(1).blend,1);
 assert.equal(bottleTransitionPose(.5).blend,.5);
 for(let i=0;i<=100;i++){
  const p=i/100,a=bottleTransitionPose(p),b=bottleTransitionPose(1-p);
  assert.ok(Math.abs(a.blend-(1-b.blend))<1e-12);assert.ok(Math.abs(a.depth-b.depth)<1e-12);
 }
});
test('dissolve motion is continuous, finite and settles back to the shelf plane',()=>{
 let last=bottleTransitionPose(0);
 for(let i=1;i<=1000;i++){
  const pose=bottleTransitionPose(i/1000);for(const key of ['blend','depth']){assert.ok(Number.isFinite(pose[key]));assert.ok(Math.abs(pose[key]-last[key])<.01);}
  assert.ok(pose.blend>=last.blend);assert.ok(pose.depth>=0&&pose.depth<=.035);last=pose;
 }
 assert.ok(Math.abs(last.depth)<1e-12);
});
