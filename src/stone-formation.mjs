import * as THREE from 'three';

// One continuous reference-derived environment, projected onto shallow geometry.
// Product, oil, cap and camera remain live geometry in the same renderer.
export function createStoneFormation({plate,resources}){
 const root=new THREE.Group();root.name='Althaïr mountain';
 const own=v=>{resources.push(v);return v;};
 const mat=own(new THREE.MeshBasicMaterial({map:plate,toneMapped:false,fog:false}));
 const geo=own(new THREE.PlaneGeometry(1,1,48,32)),positions=geo.getAttribute('position'),uv=geo.getAttribute('uv');
 const env=new THREE.Mesh(geo,mat);root.add(env);
 let lastKey='',width=1,height=1;
 const surface=(u,v)=>.22+.045*Math.sin(u*23)*Math.sin(v*17)+.055*THREE.MathUtils.smoothstep(u,.70,.94);
 return {root,surfaceAt(x,y){return surface((x-root.position.x)/width+.725,(y-root.position.y)/height+.18);},update(state){
  ({width,height}=state.environment);
  const key=width+':'+height;
  if(lastKey!==key){lastKey=key;
   for(let i=0;i<positions.count;i++){
    const u=uv.getX(i),v=uv.getY(i);
    positions.setXYZ(i,(u-.725)*width,(v-.18)*height,surface(u,v));
   }
   positions.needsUpdate=true;geo.computeVertexNormals();geo.computeBoundingSphere();
  }
  root.position.set(state.openingBottlePosition[0],state.openingBottlePosition[1],0);
  root.visible=state.storyOpacity>.001;
  const fading=state.storyOpacity<.999;
  if(mat.transparent!==fading){mat.transparent=fading;mat.depthWrite=!fading;mat.needsUpdate=true;}
  mat.opacity=state.storyOpacity;
 }};
}
