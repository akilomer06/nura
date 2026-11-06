import * as THREE from 'three';

const {lerp,smoothstep}=THREE.MathUtils;

// Oval sections keep the oil broad over the ledge and rounded in free fall.
function oilSurface(path,sections,profile,falling){
 const sides=20,stride=sides+1,positions=[],uvs=[],indices=[];
 const center=new THREE.Vector3(),tangent=new THREE.Vector3();
 const across=new THREE.Vector3(),face=new THREE.Vector3();
 for(let i=0;i<=sections;i++){
  const t=i/sections;
  path.getPointAt(t,center);path.getTangentAt(t,tangent);
  if(falling)across.set(1,0,0).addScaledVector(tangent,-tangent.x).normalize();
  else across.set(-tangent.y,tangent.x,0).normalize();
  face.crossVectors(tangent,across).normalize();
  const {width,depth,fan}=profile(t);
  center.addScaledVector(across,fan);
  for(let j=0;j<=sides;j++){
   const angle=j/sides*Math.PI*2;
   const a=Math.cos(angle)*width;
   const crown=Math.max(0,Math.sin(angle));
   const ripple=falling?0:(.019*Math.sin(t*19+j*.43)+.010*Math.sin(t*37-j*.76))*crown*crown;
   const b=Math.sin(angle)*depth+ripple;
   positions.push(center.x+across.x*a+face.x*b,center.y+across.y*a+face.y*b,center.z+across.z*a+face.z*b);
   uvs.push(t,j/sides);
   if(i<sections&&j<sides){const k=i*stride+j;indices.push(k,k+1,k+stride,k+1,k+stride+1,k+stride);}
  }
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
 geometry.setIndex(indices);geometry.computeVertexNormals();
 // Average normals across the closed side of each UV ring.
 const normals=geometry.getAttribute('normal');
 for(let i=0;i<=sections;i++){
  const a=i*stride,b=a+sides;
  across.fromBufferAttribute(normals,a).add(face.fromBufferAttribute(normals,b)).normalize();
  normals.setXYZ(a,across.x,across.y,across.z);normals.setXYZ(b,across.x,across.y,across.z);
 }
 return geometry;
}

function oilMaterial(environment,flow,reach,drain){
 const material=new THREE.MeshPhysicalMaterial({
  color:0xc58e23,roughness:.05,metalness:.63,transmission:.17,thickness:.105,ior:1.465,
  attenuationColor:0xf9b732,attenuationDistance:.40,clearcoat:1,clearcoatRoughness:.046,
  envMap:environment,envMapIntensity:2.25,transparent:true,depthWrite:false
 });
 material.onBeforeCompile=shader=>{
  Object.assign(shader.uniforms,{oilFlow:flow,oilReach:reach,oilDrain:drain});
  shader.vertexShader='varying vec2 oilUv; uniform float oilFlow;\n'+shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   oilUv=uv;
   float pulse=sin(uv.x*46.0-oilFlow*132.0)+.35*sin(uv.x*97.0-oilFlow*212.0);
   transformed+=normal*pulse*.005*sin(uv.x*3.14159);`);
  shader.fragmentShader='varying vec2 oilUv; uniform float oilFlow; uniform float oilReach; uniform float oilDrain;\n'+shader.fragmentShader.replace('#include <clipping_planes_fragment>',`#include <clipping_planes_fragment>
   if(oilUv.x>oilReach||oilUv.x<oilDrain)discard;`).replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
   float swirl=sin(oilUv.x*28.0-oilFlow*120.0);
   float facing=clamp(dot(normal,normalize(vViewPosition)),0.0,1.0);
   vec3 reflected=reflect(-normalize(vViewPosition),normal);
   float strip=pow(max(dot(reflected,normalize(vec3(-.47,.31,1.0))),0.0),25.0);
   float reflectedSky=pow(max(dot(reflected,normalize(vec3(.54,.58,.82))),0.0),32.0);
   float rim=pow(1.0-facing,3.0)*.12;
   float veinOffset=(cos(oilUv.y*6.28318)-(.51+.14*swirl))/.095;
   float vein=exp(-veinOffset*veinOffset);
   diffuseColor.rgb*=.48+.27*facing+.08*swirl;
   totalEmissiveRadiance+=vec3(1.87,1.36,.65)*(strip*.90+reflectedSky*.63+vein*.25+rim)*(.82+.18*swirl);`);
 };
 return material;
}

export function createRockStream({source,bottlePosition,resources,environment,surfaceAt}){
 const root=new THREE.Group();root.name='Althaïr oil';
 const own=resource=>{resources.push(resource);return resource;};
 const origin=new THREE.Vector3(),mouth=new THREE.Vector3();
 const reach={value:0},drain={value:0},flow={value:0},runoffReach={value:0};
 const material=own(oilMaterial(environment,flow,reach,drain));
 const filmMaterial=own(oilMaterial(environment,flow,runoffReach,{value:0}));
 const stream=new THREE.Mesh(undefined,material),film=new THREE.Mesh(undefined,filmMaterial);
 root.add(stream,film);film.renderOrder=1;stream.renderOrder=2;
 const dropMaterial=own(new THREE.MeshPhysicalMaterial({color:0xe99a25,metalness:.42,roughness:.055,clearcoat:1,envMap:environment,envMapIntensity:2,transparent:true,depthWrite:false}));
 const dropProfile=[[0,-.086],[.030,-.082],[.059,-.049],[.061,-.018],[.048,.025],[.024,.075],[.012,.117],[0,.153]].map(([r,y])=>new THREE.Vector2(r,y));
 const drop=new THREE.Mesh(own(new THREE.LatheGeometry(dropProfile,32)),dropMaterial);root.add(drop);drop.renderOrder=3;
 let curve;
 const rebuild=(nextSource,base)=>{
  origin.set(nextSource[0],nextSource[1],surfaceAt(nextSource[0],nextSource[1])+.056);
  mouth.set(base[0],base[1]+2.281,base[2]+.023);
  curve=new THREE.CubicBezierCurve3(origin,origin.clone().add(new THREE.Vector3(.13,-.18,.32)),mouth.clone().add(new THREE.Vector3(-.011,.46,-.011)),mouth);
  const guide=new THREE.CatmullRomCurve3([
   new THREE.Vector3(origin.x+1.16,origin.y+.103,0),
   new THREE.Vector3(origin.x+.77,origin.y+.062,0),
   new THREE.Vector3(origin.x+.37,origin.y+.022,0),
   origin.clone()
  ]);
  const runoff=new THREE.CatmullRomCurve3(Array.from({length:28},(_,i)=>{
   const p=guide.getPoint(i/27);p.z=lerp(surfaceAt(p.x,p.y)+.037,origin.z,smoothstep(i/27,.83,1));return p;
  }));
  const replace=(mesh,geometry)=>{
   const previous=resources.indexOf(mesh.geometry);
   if(previous>=0)resources.splice(previous,1);
   mesh.geometry.dispose();mesh.geometry=own(geometry);
  };
  replace(stream,oilSurface(curve,70,t=>{
   const lip=Math.exp(-t*24),strand=lerp(.049,.026,smoothstep(t,.13,.88));
   return {width:strand+.19*lip,depth:strand*.83+.013*lip,fan:.205*lip};
  },true));
  replace(film,oilSurface(runoff,46,t=>({
   width:(.058+.014*Math.sin(t*14)**2+.034*smoothstep(t,.38,.88))*lerp(.15,1,smoothstep(t,0,.22)),
   depth:.020+.012*smoothstep(t,.52,1),fan:0
  }),false));
 };
 rebuild(source,bottlePosition);
 return {root,update(state,progress){
  if(Math.abs(origin.x-state.source[0])>.0001||Math.abs(origin.y-state.source[1])>.0001)rebuild(state.source,state.openingBottlePosition);
  flow.value=progress;reach.value=state.streamReach;drain.value=state.streamDrain;runoffReach.value=state.runoff;
  stream.visible=state.stream>.001;material.opacity=state.stream;
  film.visible=state.runoff>.001&&state.runoffOpacity>.001;filmMaterial.opacity=state.runoffOpacity*state.storyOpacity;
  const front=state.streamDrain>.01?state.streamDrain:state.streamReach;
  drop.visible=state.runoff>.68&&front<.991&&(state.streamReach<.99||state.streamDrain>.01);
  if(drop.visible){
   curve.getPointAt(front,drop.position);drop.position.y-=.049;
   const stretch=smoothstep(front,0,.3);
   drop.scale.set(.58+stretch*.22,.59+stretch*.54,.58+stretch*.22);
   dropMaterial.opacity=state.storyOpacity*(1-smoothstep(front,.95,1));
  }
 }};
}
