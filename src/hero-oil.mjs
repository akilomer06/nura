import * as THREE from 'three';

const {lerp,smoothstep}=THREE.MathUtils;

// Oval sections keep the oil broad over the ledge and rounded in free fall.
function oilSurface(path,lip,ledgeDepth){
 const sections=104,sides=16,stride=sides+1,positions=[],uvs=[],indices=[];
 const center=new THREE.Vector3(),tangent=new THREE.Vector3();
 const across=new THREE.Vector3(),face=new THREE.Vector3();
 for(let i=0;i<=sections;i++){
  const t=i/sections;
  path.getPoint(t,center);path.getTangent(t,tangent);
  across.set(-tangent.y,tangent.x,0).normalize();
  face.crossVectors(tangent,across).normalize();
  const runoff=Math.min(1,t/lip),fall=Math.max(0,(t-lip)/(1-lip));
  const width=t<lip?lerp(.013,.108,smoothstep(runoff,0,.88))*(1+.13*Math.sin(runoff*17)*Math.sin(runoff*Math.PI)):.026+.082*Math.exp(-fall*8);
  const depth=.023+.011*(t<lip?smoothstep(runoff,.45,1):Math.exp(-fall*10));
  const contact=1-smoothstep(t,lip-.027,lip+.034);
  for(let j=0;j<=sides;j++){
   const angle=j/sides*Math.PI*2;
   const a=Math.cos(angle)*width;
   const crown=Math.max(0,Math.sin(angle));
   const ripple=(.014*Math.sin(runoff*17+j*.42)+.008*Math.sin(runoff*32-j*.65))*crown*crown*contact;
   const b=Math.sin(angle)*depth+ripple;
   const x=center.x+across.x*a+face.x*b,y=center.y+across.y*a+face.y*b;
   const z=lerp(center.z+face.z*b,ledgeDepth(x,y)+.012+b,contact);
   positions.push(x,y,z);
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

function oilMaterial(environment,uniforms){
 const material=new THREE.MeshPhysicalMaterial({
  color:0xc58e23,roughness:.05,metalness:.63,transmission:.17,thickness:.105,ior:1.465,
  attenuationColor:0xf9b732,attenuationDistance:.40,clearcoat:1,clearcoatRoughness:.046,
  envMap:environment,envMapIntensity:2.25,transparent:true,depthWrite:false
 });
 material.onBeforeCompile=shader=>{
  Object.assign(shader.uniforms,uniforms);
  shader.vertexShader='varying vec2 oilUv; uniform float oilFlow;\n'+shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   oilUv=uv;
   float pulse=sin(uv.x*46.0-oilFlow*132.0)+.35*sin(uv.x*97.0-oilFlow*212.0);
   transformed+=normal*pulse*.005*sin(uv.x*3.14159);`);
  shader.fragmentShader='varying vec2 oilUv; uniform float oilFlow; uniform float oilReach; uniform float oilDrain; uniform float oilLip; uniform float oilFilm; uniform float oilFall;\n'+shader.fragmentShader.replace('#include <clipping_planes_fragment>',`#include <clipping_planes_fragment>
   if(oilUv.x>oilReach||oilUv.x<oilDrain)discard;`).replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
   float swirl=sin(oilUv.x*28.0-oilFlow*120.0);
   float facing=clamp(dot(normal,normalize(vViewPosition)),0.0,1.0);
   vec3 reflected=reflect(-normalize(vViewPosition),normal);
   float strip=pow(max(dot(reflected,normalize(vec3(-.47,.31,1.0))),0.0),25.0);
   float reflectedSky=pow(max(dot(reflected,normalize(vec3(.54,.58,.82))),0.0),32.0);
   float rim=pow(1.0-facing,3.0)*.12;
   float veinOffset=(cos(oilUv.y*6.28318)-(.51+.14*swirl))/.095;
   float vein=exp(-veinOffset*veinOffset);
   diffuseColor.a*=mix(oilFilm,oilFall,smoothstep(oilLip-.018,oilLip+.024,oilUv.x));
   diffuseColor.rgb*=.48+.27*facing+.08*swirl;
   totalEmissiveRadiance+=vec3(1.87,1.36,.65)*(strip*.90+reflectedSky*.63+vein*.25+rim)*(.82+.18*swirl);`);
 };
 return material;
}

export function createRockStream({source,bottlePosition,resources,environment,surfaceAt}){
 const root=new THREE.Group();root.name='Althaïr oil';
 const own=resource=>{resources.push(resource);return resource;};
 const origin=new THREE.Vector3(),mouth=new THREE.Vector3();
 const uniforms={oilFlow:{value:0},oilReach:{value:0},oilDrain:{value:0},oilLip:{value:0},oilFilm:{value:0},oilFall:{value:0}};
 const material=own(oilMaterial(environment,uniforms));
 const stream=new THREE.Mesh(undefined,material);root.add(stream);stream.renderOrder=2;
 const dropMaterial=own(new THREE.MeshPhysicalMaterial({color:0xe99a25,metalness:.42,roughness:.055,clearcoat:1,envMap:environment,envMapIntensity:2,transparent:true,depthWrite:false}));
 const dropProfile=[[0,-.086],[.030,-.082],[.059,-.049],[.061,-.018],[.048,.025],[.024,.075],[.012,.117],[0,.153]].map(([r,y])=>new THREE.Vector2(r,y));
 const drop=new THREE.Mesh(own(new THREE.LatheGeometry(dropProfile,32)),dropMaterial);root.add(drop);drop.renderOrder=3;
 let curve,lip;
 const rebuild=(nextSource,base)=>{
  origin.set(nextSource[0],nextSource[1]-.016,surfaceAt(nextSource[0],nextSource[1])+.032);
  mouth.set(base[0],base[1]+2.281,base[2]+.023);
  curve=new THREE.CubicBezierCurve3(origin,origin.clone().add(new THREE.Vector3(-.12,-.13,.31)),mouth.clone().add(new THREE.Vector3(-.012,.43,-.014)),mouth);
  const guide=new THREE.CatmullRomCurve3([
   new THREE.Vector3(origin.x+1.16,origin.y+.103,0),
   new THREE.Vector3(origin.x+.77,origin.y+.062,0),
   new THREE.Vector3(origin.x+.20,origin.y+.052,0),
   origin.clone()
  ]);
  const runoff=new THREE.CatmullRomCurve3(Array.from({length:28},(_,i)=>{
   const p=guide.getPoint(i/27);p.z=lerp(surfaceAt(p.x,p.y)+.015,origin.z,smoothstep(i/27,.83,1));return p;
  }));
  const path=new THREE.CurvePath();path.add(runoff);path.add(curve);
  lip=runoff.getLength()/path.getLength();uniforms.oilLip.value=lip;
  const previous=resources.indexOf(stream.geometry);
  if(previous>=0)resources.splice(previous,1);
  stream.geometry.dispose();stream.geometry=own(oilSurface(path,lip,surfaceAt));
 };
 rebuild(source,bottlePosition);
 let sourceY=source[1];
 return {root,update(state,progress){
  if(Math.abs(origin.x-state.source[0])>.0001||Math.abs(sourceY-state.source[1])>.0001){rebuild(state.source,state.openingBottlePosition);sourceY=state.source[1];}
  uniforms.oilFlow.value=progress;
  uniforms.oilReach.value=lip*state.runoff+(1-lip)*state.streamReach;
  uniforms.oilDrain.value=state.streamDrain;
  uniforms.oilFilm.value=state.runoffOpacity*state.storyOpacity;
  uniforms.oilFall.value=state.stream;
  stream.visible=state.runoff>.001&&(state.runoffOpacity>.001||state.stream>.001);
  const draining=state.streamDrain>lip;
  const front=draining?(state.streamDrain-lip)/(1-lip):state.streamReach;
  drop.visible=state.runoff>.92&&front<.991&&(state.streamReach<.99||draining);
  if(drop.visible){
   curve.getPointAt(front,drop.position);drop.position.y-=.049;
   const stretch=smoothstep(front,0,.3);
   drop.scale.set(.58+stretch*.22,.59+stretch*.54,.58+stretch*.22);
   dropMaterial.opacity=state.storyOpacity*(1-smoothstep(front,.95,1));
  }
 }};
}
