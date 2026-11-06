import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {smoothRange} from './hero-story.mjs';
import {oilGold} from './hero-oil.mjs';

export function createBottleEnvironment(renderer,resources){
 const studio=new THREE.Scene();studio.background=new THREE.Color(0x514939);
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
 const exposure={value:1},level={value:-.865},visibility={value:1},ripple={value:0};
 const own=value=>{resources.push(value);return value;};
 const shade=material=>{
  material.customProgramCacheKey=()=>`nura-hero-${material.type}-${material.userData.finish??'solid'}`;
  own(material);material.onBeforeCompile=shader=>{
   shader.uniforms.nuraBottleExposure=exposure;
   shader.uniforms.nuraBottleVisibility=visibility;
   shader.fragmentShader='uniform float nuraBottleExposure; uniform float nuraBottleVisibility;\n'+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif(nuraBottleVisibility<1.&&fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(.06711056,.00583715))))>nuraBottleVisibility)discard;');
   shader.fragmentShader=shader.fragmentShader.replace('#include <tonemapping_fragment>','#include <tonemapping_fragment>\ngl_FragColor.rgb*=nuraBottleExposure;');
   if(material.userData.finish==='liquid'){
    shader.uniforms.nuraLiquidLevel=level;
    shader.uniforms.nuraRipple=ripple;
    shader.vertexShader='varying vec3 liquidLocal;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nliquidLocal=position;');
    shader.fragmentShader='varying vec3 liquidLocal; uniform float nuraLiquidLevel; uniform float nuraRipple;\n'+shader.fragmentShader.replace('#include <clipping_planes_fragment>',`#include <clipping_planes_fragment>
     float edge=max(abs(liquidLocal.x)*1.9,abs(liquidLocal.z)*3.75);
     float waterline=nuraLiquidLevel+.012*pow(edge,5.0)+.009*sin(liquidLocal.x*21.0+nuraRipple)*sin(nuraRipple*.36);
     float surfaceGap=waterline-liquidLocal.y;
     if(surfaceGap<0.0)discard;`).replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
     float meniscus=1.0-smoothstep(.002,.024,surfaceGap);
     float wall=smoothstep(.68,.97,abs(liquidLocal.x)*1.9);
     float foot=smoothstep(-.855,-.80,liquidLocal.y)*(1.0-smoothstep(-.79,-.69,liquidLocal.y));
     float glint=1.0-smoothstep(.04,.46,abs(liquidLocal.x+.07));
     diffuseColor.rgb*=.48+.28*wall;
     totalEmissiveRadiance+=vec3(1.48,.73,.029)*(meniscus*.44+wall*.15+foot*(.10+glint*.31));`);
   }
   if(material.userData.finish==='glass-body'){
    shader.uniforms.nuraLiquidLevel=level;
    shader.vertexShader='varying vec3 glassLocal;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nglassLocal=position;');
    shader.fragmentShader='varying vec3 glassLocal; uniform float nuraLiquidLevel;\n'+shader.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
     float wet=smoothstep(-.865,-.79,nuraLiquidLevel)*smoothstep(-.85,-.75,glassLocal.y)*smoothstep(0.0,.07,nuraLiquidLevel+.075-glassLocal.y);
     float edge=(abs(glassLocal.x)-.493)/.035;
     float base=(glassLocal.y+.766)/.032;
     float stripe=exp(-edge*edge)*smoothstep(.05,.24,glassLocal.z);
     float lower=exp(-base*base)*(1.0-smoothstep(.07,.43,abs(glassLocal.x+.06)))*smoothstep(.10,.29,glassLocal.z);
     totalEmissiveRadiance+=vec3(1.27,.64,.035)*wet*(stripe*.36+lower*.58);`);
   }
   if(material.userData.finish==='gold-cap'){
    shader.vertexShader='varying vec3 capLocal;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ncapLocal=position;');
    shader.fragmentShader='varying vec3 capLocal;\n'+shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
     float azimuth=atan(capLocal.z,capLocal.x);
     float brush=.5+.5*sin(azimuth*119.0+sin(capLocal.y*22.0));
     float sheen=.5+.5*cos(azimuth*3.0+.7);
     roughnessFactor*=mix(.72,1.45,sheen)*mix(.94,1.08,brush);
     diffuseColor.rgb*=mix(.76,1.10,pow(sheen,2.0));`);
   }
  };return material;
 };
 const glass=shade(new THREE.MeshPhysicalMaterial({color:0xf0f4ec,metalness:0,roughness:.065,transmission:.96,thickness:.095,ior:1.46,envMap:environment,envMapIntensity:1.45}));
 const bodyGlass=glass.clone();bodyGlass.userData.finish='glass-body';shade(bodyGlass);
 const gold=new THREE.MeshStandardMaterial({color:0xe8b24d,metalness:1,roughness:.13,envMap:environment,envMapIntensity:1.1});
 gold.userData.finish='gold-cap';shade(gold);
 const mesh=(geometry,material,parent=root)=>{own(geometry);const object=new THREE.Mesh(geometry,material);parent.add(object);return object;};
 mesh(new RoundedBoxGeometry(1.112,2.14,.63,5,.20),bodyGlass).position.y=1.07;
 const baseGlass=shade(new THREE.MeshPhysicalMaterial({color:0xffffff,metalness:0,roughness:.035,transmission:1,thickness:.18,ior:1.46,envMap:environment,envMapIntensity:.45}));
 mesh(new RoundedBoxGeometry(1.078,.27,.59,4,.12),baseGlass).position.y=.15;
 const neckProfile=[[.15,2.01],[.22,2.04],[.24,2.10],[.22,2.12],[.206,2.15],[.23,2.16],[.23,2.18],[.206,2.19],[.23,2.21],[.23,2.23],[.208,2.24],[.228,2.26],[.224,2.29],[.16,2.29],[.15,2.25],[.15,2.01]].map(([x,y])=>new THREE.Vector2(x,y));
 mesh(new THREE.LatheGeometry(neckProfile,48),glass);
 const cap=new THREE.Group();root.add(cap);
 const capProfile=[[.30,.77],[.30,.015],[.32,0],[.35,.025],[.35,.06],[.39,.08],[.41,.12],[.41,.18],[.35,.22],[.35,.65],[.395,.68],[.41,.71],[.41,.75],[.35,.78],[.35,.83],[.41,.86],[.42,.90],[.42,1.04],[.39,1.10],[0,1.10]].map(([x,y])=>new THREE.Vector2(x,y));
 mesh(new THREE.LatheGeometry(capProfile,64),gold,cap);
 const label=own(labelTexture(texture.image));label.anisotropy=texture.anisotropy;
 const labelMaterial=shade(new THREE.MeshBasicMaterial({map:label,transparent:true,alphaTest:.02,depthWrite:false,toneMapped:false}));
 const decalGeometry=new THREE.PlaneGeometry(1.023,1.706,48,48),vertices=decalGeometry.getAttribute('position');
 for(let i=0;i<vertices.count;i++){const qx=Math.max(0,Math.abs(vertices.getX(i))-.356),qy=Math.max(0,Math.abs(vertices.getY(i)+1.210-1.07)-.87);vertices.setZ(i,.115+Math.sqrt(Math.max(0,.04-qx*qx-qy*qy))+.012);}decalGeometry.computeVertexNormals();
 const labelMesh=mesh(decalGeometry,labelMaterial);labelMesh.position.y=1.210;
 // Opaque interior enters Three's transmission buffer, so the outer glass can
 // refract the amber volume instead of sampling straight through it to the wall.
 const liquidMaterial=new THREE.MeshPhysicalMaterial({color:oilGold.gold,roughness:.061,clearcoat:1,clearcoatRoughness:.045,envMap:environment,envMapIntensity:1.4,emissive:oilGold.amber,emissiveIntensity:.14});
 liquidMaterial.userData.finish='liquid';shade(liquidMaterial);
 const liquid=mesh(new RoundedBoxGeometry(1.055,1.73,.53,5,.14),liquidMaterial);liquid.position.y=1.145;
 const surfaceMaterial=shade(new THREE.MeshPhysicalMaterial({color:oilGold.highlight,roughness:.055,clearcoat:1,envMap:environment,envMapIntensity:1.45}));
 const surface=mesh(new RoundedBoxGeometry(1.035,.012,.505,3,.10),surfaceMaterial);
 const rimMaterial=shade(new THREE.MeshBasicMaterial({color:0xffedb9,transparent:true,opacity:0,depthWrite:false,toneMapped:false}));
 const rimPoints=[];for(let corner=0;corner<4;corner++){const cx=corner===0||corner===3?.37:-.37,cy=corner<2?1.96:.18;for(let j=0;j<=10;j++){const a=(corner*90+j*9)*Math.PI/180;rimPoints.push(new THREE.Vector3(cx+Math.cos(a)*.16,cy+Math.sin(a)*.16,.24));}}
 const rim=mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rimPoints,true),128,.007,6,true),rimMaterial);
 const arc=new THREE.CatmullRomCurve3(Array.from({length:44},(_,i)=>{
  const t=i/43,angle=t*Math.PI*3.25;
  return new THREE.Vector3(Math.cos(angle)*(.43+t*.16),2.06+t*1.08,Math.sin(angle)*(.32+t*.14));
 }));
 const trailMaterial=own(new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{strength:{value:0},head:{value:0}},
  vertexShader:'varying float t; void main(){t=uv.x;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'varying float t; uniform float strength; uniform float head; void main(){float a=smoothstep(0.,.17,t)*(1.-smoothstep(.81,1.,t))*exp(-pow((t-head)*2.4,2.));gl_FragColor=vec4(.98,.73,.32,a*strength);}' }));
 const trail=mesh(new THREE.TubeGeometry(arc,64,.006,6,false),trailMaterial);
 return {root,setBrightness:value=>{exposure.value=value;},update(state){
  visibility.value=1-smoothRange(.76,1,state.shelfArtwork);
  const treatment=state.storyLight;
  rimMaterial.opacity=.55*treatment;rim.visible=treatment>.001;
  const {position,rotation,scale,depthScale}=state.bottle;
  root.position.fromArray(position);root.rotation.set(...rotation);root.scale.set(scale,scale,scale*depthScale);
  cap.position.set(state.cap.offset[0],2.15+state.cap.offset[1],state.cap.offset[2]);cap.rotation.set(...state.cap.rotation,'ZXY');
  trail.visible=state.capTrail>.001;trailMaterial.uniforms.strength.value=state.capTrail*.54;trailMaterial.uniforms.head.value=state.trailPhase;
  level.value=-.865+1.73*state.fill;liquid.visible=surface.visible=state.fill>.001;
  ripple.value=state.fill*Math.PI*8;
  surface.position.y=.28+1.73*state.fill;surface.rotation.z=Math.sin(state.fill*Math.PI*7)*.011*state.stream;
 }};
}
