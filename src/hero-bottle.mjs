import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

export function createBottleEnvironment(renderer,resources){
 const studio=new THREE.Scene();studio.background=new THREE.Color(0x080b09);
 const cards=[];
 const card=(x,y,z,w,h,color,power=1)=>{const geometry=new THREE.PlaneGeometry(w,h),material=new THREE.MeshBasicMaterial({color:new THREE.Color(color).multiplyScalar(power),toneMapped:false}),object=new THREE.Mesh(geometry,material);object.position.set(x,y,z);object.lookAt(0,2,0);studio.add(object);cards.push(geometry,material);};
 card(-3,2.8,4,1.2,8,0xfff1d6,2.4);card(3,2.8,3,1.4,7,0xffffff,2.1);card(0,7,0,5,3,0xfff3db,1.8);card(0,2,-4,4,7,0x356e50,.7);card(-4,1,-1,2,4,0x6e7a70,.4);
 card(0,2,5.5,4,7,0x5b6d5f,.8);
 const pmrem=new THREE.PMREMGenerator(renderer),target=pmrem.fromScene(studio,.018);resources.push(target);pmrem.dispose();cards.forEach(resource=>resource.dispose());return target.texture;
}

// Original pixels become a curved front decal; no redrawn lettering or packaging.
function labelTexture(image){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=896;
 const context=canvas.getContext('2d');if(!context)throw new Error('Bottle decal unavailable');
 const left=.04,top=.365,w=.92,h=.525;
 const points=[[.055,.43],[.33,.414],[.365,.396],[.415,.380],[.45,.369],[.5,.365],[.55,.369],[.585,.380],[.635,.396],[.67,.414],[.945,.43],[.95,.60],[.93,.845],[.63,.855],[.59,.87],[.54,.883],[.5,.888],[.46,.883],[.41,.87],[.37,.855],[.07,.845],[.05,.60]];
 context.beginPath();points.forEach(([x,y],i)=>context[i?'lineTo':'moveTo']((x-left)/w*512,(y-top)/h*896));context.closePath();context.clip();
 context.drawImage(image,left*image.width,top*image.height,w*image.width,h*image.height,0,0,512,896);
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}

export function createHeroBottle({texture,environment,resources}){
 const root=new THREE.Group();root.name='NURA 3D hero bottle';
 const exposure={value:1},level={value:-.865};
 const own=value=>{resources.push(value);return value;};
 const shade=material=>{
  material.customProgramCacheKey=()=>`nura-hero-${material.type}-${material.userData.liquid?'liquid':'solid'}`;
  own(material);material.onBeforeCompile=shader=>{
   shader.uniforms.nuraBottleExposure=exposure;
   shader.fragmentShader='uniform float nuraBottleExposure;\n'+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <tonemapping_fragment>','#include <tonemapping_fragment>\ngl_FragColor.rgb*=nuraBottleExposure;');
   if(material.userData.liquid){
    shader.uniforms.nuraLiquidLevel=level;
    shader.vertexShader='varying float nuraLiquidY;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nnuraLiquidY=position.y;');
    shader.fragmentShader='varying float nuraLiquidY;uniform float nuraLiquidLevel;\n'+shader.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif(nuraLiquidY>nuraLiquidLevel)discard;');
   }
  };return material;
 };
 const glass=shade(new THREE.MeshPhysicalMaterial({color:0xd5dfd9,metalness:0,roughness:.04,transmission:.95,thickness:.06,ior:1.46,envMap:environment,envMapIntensity:1.2}));
 const gold=shade(new THREE.MeshStandardMaterial({color:0xe8b24d,metalness:1,roughness:.11,envMap:environment,envMapIntensity:1.1}));
 const mesh=(geometry,material,parent=root)=>{own(geometry);const object=new THREE.Mesh(geometry,material);parent.add(object);return object;};
 mesh(new RoundedBoxGeometry(1.112,2.14,.63,5,.20),glass).position.y=1.07;
 const baseGlass=shade(new THREE.MeshPhysicalMaterial({color:0xffffff,metalness:0,roughness:.035,transmission:1,thickness:.18,ior:1.46,envMap:environment,envMapIntensity:.45}));
 mesh(new RoundedBoxGeometry(1.078,.27,.59,4,.12),baseGlass).position.y=.15;
 const neckProfile=[[.16,2.01],[.21,2.08],[.21,2.27],[.16,2.27],[.16,2.01]].map(([x,y])=>new THREE.Vector2(x,y));
 mesh(new THREE.LatheGeometry(neckProfile,48),glass);
 mesh(new THREE.CylinderGeometry(.25,.28,.055,48),gold).position.y=2.13;
 const cap=new THREE.Group();root.add(cap);
 const capProfile=[[0,0],[.31,0],[.31,.06],[.39,.08],[.41,.12],[.41,.18],[.35,.22],[.35,.65],[.395,.68],[.41,.71],[.41,.75],[.35,.78],[.35,.83],[.41,.86],[.42,.90],[.42,1.04],[.39,1.10],[0,1.10]].map(([x,y])=>new THREE.Vector2(x,y));
 mesh(new THREE.LatheGeometry(capProfile,64),gold,cap);
 const label=own(labelTexture(texture.image));label.anisotropy=texture.anisotropy;
 const labelMaterial=shade(new THREE.MeshBasicMaterial({map:label,transparent:true,alphaTest:.02,depthWrite:false,toneMapped:false}));
 const decalGeometry=new THREE.PlaneGeometry(1.023,1.706,48,48),vertices=decalGeometry.getAttribute('position');
 for(let i=0;i<vertices.count;i++){const qx=Math.max(0,Math.abs(vertices.getX(i))-.356),qy=Math.max(0,Math.abs(vertices.getY(i)+1.210-1.07)-.87);vertices.setZ(i,.115+Math.sqrt(Math.max(0,.04-qx*qx-qy*qy))+.012);}decalGeometry.computeVertexNormals();
 const labelMesh=mesh(decalGeometry,labelMaterial);labelMesh.position.y=1.210;
 // Opaque interior enters Three's transmission buffer, so the outer glass can
 // refract the amber volume instead of sampling straight through it to the wall.
 const liquidMaterial=new THREE.MeshPhysicalMaterial({color:0xc58a2b,metalness:0,roughness:.17,clearcoat:.75,envMap:environment,envMapIntensity:.65,emissive:0x7b3d0d,emissiveIntensity:.38,transparent:true,opacity:1});
 liquidMaterial.userData.liquid=true;shade(liquidMaterial);
 const liquid=mesh(new RoundedBoxGeometry(1.055,1.73,.53,5,.14),liquidMaterial);liquid.position.y=1.145;
 const surfaceMaterial=shade(new THREE.MeshPhysicalMaterial({color:0xd9a14a,roughness:.13,clearcoat:1,envMap:environment,envMapIntensity:.7}));
 const surface=mesh(new RoundedBoxGeometry(1.035,.012,.505,3,.10),surfaceMaterial);
 const rimMaterial=shade(new THREE.MeshBasicMaterial({color:0xffedb9,transparent:true,opacity:0,depthWrite:false,toneMapped:false}));
 const rimPoints=[];for(let corner=0;corner<4;corner++){const cx=corner===0||corner===3?.37:-.37,cy=corner<2?1.96:.18;for(let j=0;j<=10;j++){const a=(corner*90+j*9)*Math.PI/180;rimPoints.push(new THREE.Vector3(cx+Math.cos(a)*.16,cy+Math.sin(a)*.16,.24));}}
 const rim=mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rimPoints,true),128,.007,6,true),rimMaterial);
 return {root,setBrightness:value=>{exposure.value=value;},update(state){
  const treatment=state.storyLight;
  glass.color.set(treatment>.01?0xffffff:0xd5dfd9);glass.transmission=.95+.05*treatment;glass.thickness=.06-.035*treatment;glass.roughness=.04-.025*treatment;glass.envMapIntensity=1.2+treatment*.7;
  gold.roughness=.11+.12*treatment;gold.envMapIntensity=1.1+.7*treatment;gold.color.setRGB(.76+.22*treatment,.445+.19*treatment,.074+.12*treatment);
  liquidMaterial.opacity=1-.80*treatment;liquidMaterial.depthWrite=treatment<.01;liquidMaterial.emissiveIntensity=.38*(1-treatment);
  labelMesh.scale.x=1-.16*treatment;rimMaterial.opacity=.46*treatment;rim.visible=treatment>.001;
  cap.scale.set(1-.16*treatment,1-.18*treatment,1-.16*treatment);
  root.position.fromArray(state.bottle.position);root.rotation.fromArray([...state.bottle.rotation,'XYZ']);root.scale.setScalar(state.bottle.scale);
  cap.position.set(state.cap.offset[0],2.15+state.cap.offset[1],state.cap.offset[2]);cap.rotation.fromArray([...state.cap.rotation,'XYZ']);cap.visible=state.cap.visible!==false;
  level.value=-.865+1.73*state.fill;liquid.visible=surface.visible=state.fill>.001;
  surface.position.y=.28+1.73*state.fill;surface.rotation.z=Math.sin(state.fill*Math.PI*7)*.009*state.stream;
 }};
}

export function createRockStream({source,bottlePosition,resources,environment,surfaceAt}){
 const root=new THREE.Group();root.name='Basalt spring';
 const own=value=>{resources.push(value);return value;};
 const origin=new THREE.Vector3(...source),mouth=new THREE.Vector3(bottlePosition[0],bottlePosition[1]+2.26,bottlePosition[2]);
 origin.z=(surfaceAt?.(origin.x,origin.y,source[2])??source[2])+.045;
 const curve=new THREE.CatmullRomCurve3([origin,origin.clone().add(new THREE.Vector3(.03,-.10,.20)),mouth.clone().add(new THREE.Vector3(0,.48,-.03)),mouth]);
 const reach={value:0},drain={value:0};
 const material=own(new THREE.MeshPhysicalMaterial({color:0xe1bc7b,roughness:.075,metalness:0,transmission:.82,thickness:.10,ior:1.45,attenuationColor:0xa56615,attenuationDistance:.12,clearcoat:1,envMap:environment,envMapIntensity:.95,transparent:true,depthWrite:false,emissive:0x391d04,emissiveIntensity:.035}));
 material.onBeforeCompile=shader=>{
  shader.uniforms.nuraStreamReach=reach;shader.uniforms.nuraStreamDrain=drain;
  shader.vertexShader='varying float nuraStreamT;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nnuraStreamT=uv.x;');
  shader.fragmentShader='varying float nuraStreamT;uniform float nuraStreamReach;uniform float nuraStreamDrain;\n'+shader.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif(nuraStreamT>nuraStreamReach||nuraStreamT<nuraStreamDrain)discard;');
 };
 const viscousGeometry=path=>{const geometry=new THREE.TubeGeometry(path,96,.043,24,false),p=geometry.getAttribute('position'),uv=geometry.getAttribute('uv');for(let i=0;i<p.count;i++){const t=uv.getX(i),center=path.getPointAt(t),bulge=.85+.13*Math.sin(t*17)+.35*Math.pow(t,8);p.setXYZ(i,center.x+(p.getX(i)-center.x)*bulge,center.y+(p.getY(i)-center.y)*bulge,center.z+(p.getZ(i)-center.z)*bulge);}geometry.computeVertexNormals();return geometry;};
 const stream=new THREE.Mesh(own(viscousGeometry(curve)),material);root.add(stream);
 const dropMaterial=own(new THREE.MeshStandardMaterial({color:0xe2ac50,roughness:.17,metalness:.25,transparent:true,depthWrite:false,envMap:environment}));
 const drops=new THREE.InstancedMesh(own(new THREE.SphereGeometry(.022,8,8)),dropMaterial,7);root.add(drops);const dummy=new THREE.Object3D();
 const runoffReach={value:0},runoffMaterial=material.clone();own(runoffMaterial);runoffMaterial.onBeforeCompile=shader=>{shader.uniforms.nuraRunoffReach=runoffReach;shader.vertexShader='varying float nuraRunoffT;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nnuraRunoffT=uv.x;');shader.fragmentShader='varying float nuraRunoffT;uniform float nuraRunoffReach;\n'+shader.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif(nuraRunoffT>nuraRunoffReach)discard;');};
 const runoffCurve=()=>{const guide=new THREE.CatmullRomCurve3([new THREE.Vector3(origin.x+1.10,origin.y+.80,.88),new THREE.Vector3(origin.x+.78,origin.y+.45,1.02),new THREE.Vector3(origin.x+.30,origin.y+.18,1.20),origin.clone()]);return new THREE.CatmullRomCurve3(Array.from({length:49},(_,i)=>{const p=guide.getPoint(i/48);p.z=(surfaceAt?.(p.x,p.y,p.z)??p.z)+.032;return p;}));};
 const filmGeometry=()=>{const path=runoffCurve(),geometry=new THREE.TubeGeometry(path,128,.028,16,false),p=geometry.getAttribute('position'),uv=geometry.getAttribute('uv');for(let i=0;i<p.count;i++){const center=path.getPointAt(uv.getX(i));p.setZ(i,center.z+(p.getZ(i)-center.z)*.35);}geometry.computeVertexNormals();return geometry;};
 const runoff=new THREE.Mesh(own(filmGeometry()),runoffMaterial);root.add(runoff);
 const poolMaterial=own(material.clone()),pool=new THREE.Mesh(own(new THREE.SphereGeometry(1,24,16)),poolMaterial);root.add(pool);
 const placePool=()=>{const x=origin.x+1.10,y=origin.y+.80;pool.position.set(x,y,(surfaceAt?.(x,y,.88)??.88)+.035);pool.scale.set(.19,.12,.032);};placePool();
 const finalDrop=new THREE.Mesh(own(new THREE.LatheGeometry([[0,.15],[.016,.08],[.042,.025],[.061,-.035],[.045,-.08],[0,-.095]].map(([x,y])=>new THREE.Vector2(x,y)),32)),dropMaterial);root.add(finalDrop);
 const replaceGeometry=(object,next)=>{const old=object.geometry,index=resources.indexOf(old);if(index>=0)resources.splice(index,1);old.dispose();object.geometry=own(next);};
 return {root,update(state,progress){
  if(Math.abs(origin.x-state.source[0])>.0001||Math.abs(origin.y-state.source[1])>.0001){
   origin.fromArray(state.source);origin.z=(surfaceAt?.(origin.x,origin.y,state.source[2])??state.source[2])+.045;mouth.set(state.openingBottlePosition[0],state.openingBottlePosition[1]+2.26,state.openingBottlePosition[2]);
   curve.points=[origin,origin.clone().add(new THREE.Vector3(.03,-.10,.20)),mouth.clone().add(new THREE.Vector3(0,.48,-.03)),mouth];curve.updateArcLengths();
   replaceGeometry(stream,viscousGeometry(curve));replaceGeometry(runoff,filmGeometry());placePool();
  }
  stream.visible=state.stream>.001;drops.visible=stream.visible&&(state.streamReach<.999||state.streamDrain>0);reach.value=state.streamReach;drain.value=state.streamDrain;material.opacity=state.stream;dropMaterial.opacity=Math.max(state.stream,state.runoff*state.runoffOpacity)*.85;
  runoff.visible=state.runoff>.001&&state.runoffOpacity>.001;runoffReach.value=state.runoff;runoffMaterial.opacity=state.runoffOpacity*state.storyOpacity;
  pool.visible=runoff.visible;poolMaterial.opacity=state.runoff*state.runoffOpacity*state.storyOpacity;
  finalDrop.visible=state.runoff>.25&&state.streamDrain<.999&&(state.streamReach<.1||state.streamDrain>0);finalDrop.position.copy(curve.getPoint(state.streamDrain>0?state.streamDrain:0));finalDrop.position.y-=.09;finalDrop.scale.setScalar(state.streamDrain>0?1:.35+.65*state.runoff);
  for(let i=0;i<7;i++){const t=(i/7+progress*3.2)%1;dummy.position.copy(curve.getPoint(t));dummy.position.x+=Math.sin(i*3.1)*.018;dummy.scale.set(.65,1.6,.65);dummy.updateMatrix();drops.setMatrixAt(i,dummy.matrix);}drops.instanceMatrix.needsUpdate=true;
 }};
}
