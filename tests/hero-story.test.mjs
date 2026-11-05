import test from 'node:test';
import assert from 'node:assert/strict';
import {HERO_CONFIG,homeRevealLayers} from '../src/hero-story.mjs';

test('captions change in sequence and clear before the first niche receives the bottle',()=>{
 const names=HERO_CONFIG.phases.map(phase=>phase.name);
 assert.deepEqual(names,['origin','opening','essence','capture','completion','docking']);
 assert.equal(homeRevealLayers(0).captionOpacity,1);
 for(const [index,phase] of HERO_CONFIG.phases.entries()){
  const frame=homeRevealLayers(phase.start+.03);
  assert.equal(frame.chapter,index);
  assert.equal(frame.captionOpacity,1);
 }
 assert.equal(homeRevealLayers(.91).captionOpacity,0);
 assert.equal(homeRevealLayers(.998).selectionReady,false);
 assert.equal(homeRevealLayers(1).collectionOpacity,1);
 assert.equal(homeRevealLayers(1).selectionReady,true);
});
