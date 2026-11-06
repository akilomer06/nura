import * as THREE from 'three';
import {HERO_CONFIG,smoothRange} from './hero-story.mjs';

// One continuous reference-derived environment, projected onto shallow geometry.
// Product, oil, cap and camera remain live geometry in the same renderer.
export function createStoneFormation({plate,resources}){
 const root=new THREE.Group();root.name='Althaïr mountain';
 const own=v=>{resources.push(v);return v;};
 const mat=own(new THREE.MeshBasicMaterial({map:plate,toneMapped:false,fog:false}));
 const geo=own(new THREE.PlaneGeometry(1,1,48,32)),positions=geo.getAttribute('position'),uv=geo.getAttribute('uv');
 const dissolve=own(new THREE.MeshBasicMaterial({map:plate,toneMapped:false,fog:false,transparent:true,depthWrite:false}));
 const env=new THREE.Mesh(geo,mat),fade=new THREE.Mesh(geo,dissolve);root.add(env,fade);
 let lastKey='',width=1,height=1;
 const {foot,lip,ledgeRise}=HERO_CONFIG.mountain;
 const surface=(u,v)=>.22+.045*Math.sin(u*23)*Math.sin(v*17)+.055*THREE.MathUtils.smoothstep(u,.70,.94);
 // Runoff samples the ledge, where the height offset is constant and the cliff keeps its original x position.
 return {root,surfaceAt(x,y){return surface((x-root.position.x)/width+.725,(y-root.position.y)/height+foot-ledgeRise);},update(state){
  ({width,height}=state.environment);
  const key=width+':'+height;
  if(lastKey!==key){lastKey=key;
   for(let i=0;i<positions.count;i++){
    const u=uv.getX(i),v=uv.getY(i);
    const rise=ledgeRise*smoothRange(.28,.62,v);
    const setback=.075*smoothRange(.62,.98,u)*smoothRange(.03,.23,Math.abs(v-lip));
    positions.setXYZ(i,(u-.725+setback)*width,(v-foot+rise)*height,surface(u,v));
   }
   positions.needsUpdate=true;geo.computeVertexNormals();geo.computeBoundingSphere();
  }
  root.position.set(state.openingBottlePosition[0],state.openingBottlePosition[1],0);
  root.visible=state.storyOpacity>.001;
  env.visible=state.storyOpacity>=.999;fade.visible=!env.visible;dissolve.opacity=state.storyOpacity;
 }};
}
