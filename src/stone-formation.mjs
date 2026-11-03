import * as THREE from 'three';

// One continuous reference-derived environment, projected onto shallow geometry.
// Product, oil, cap and camera remain live geometry in the same renderer.
export function createStoneFormation({plate,glowTexture,resources}){
 const root=new THREE.Group(),haloRoot=new THREE.Group();root.name='Reference-matched mineral environment';
 const own=v=>{resources.push(v);return v;};
 const mat=own(new THREE.MeshBasicMaterial({map:plate,transparent:true,toneMapped:false,fog:false,depthWrite:true}));
 const geo=own(new THREE.PlaneGeometry(1,1,48,32)),positions=geo.getAttribute('position'),uv=geo.getAttribute('uv');
 const env=new THREE.Mesh(geo,mat);root.add(env);
 let lastKey='';
 return {root,haloRoot,surfaceAt(x,y,fallback){return .29;},update(state){
  const {width,height}=state.environment,key=width+':'+height;
  if(lastKey!==key){lastKey=key;
   for(let i=0;i<positions.count;i++){
    const u=uv.getX(i),v=uv.getY(i),upper=THREE.MathUtils.smoothstep(v,.35,.72);
    positions.setXYZ(i,(u-.64)*width-upper*.095*width,(v-.18)*height,.24);
   }
   positions.needsUpdate=true;geo.computeVertexNormals();geo.computeBoundingSphere();
  }
  root.position.set(state.openingBottlePosition[0],state.openingBottlePosition[1],0);
  root.visible=state.storyOpacity>.001;mat.opacity=state.storyOpacity;mat.depthWrite=state.storyOpacity>.999;
 }};
}
