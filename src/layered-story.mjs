import * as THREE from 'three';
import {NICHE} from './scene-layout.mjs';
import {smoothRange} from './collection-layout.mjs';

// Registered layers share the original bottle's pixel coordinate system.
// No label lettering is regenerated and the closed actor equals the shelf artwork.
export function createLayeredStory({texture,plate,glass,resources}){
 const root=new THREE.Group(),environment=new THREE.Group(),effects=new THREE.Group();
 const own=v=>{resources.push(v);return v;};
 const width=NICHE.bottleHeight*texture.image.width/texture.image.height,H=NICHE.bottleHeight;
 const level={value:.12},closed={value:0},exposure={value:1};
 const originalMaterial=(cap=false)=>own(new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{map:{value:texture},fill:level,assembled:closed,exposure},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:`
 varying vec2 vUv;uniform sampler2D map;uniform float fill,assembled,exposure;
 void main(){vec4 c=texture2D(map,vUv);float y=1.-vUv.y;
 ${cap?'if(y>.335)discard;':'if(y<.335)discard;'}
 ${cap?'':`float interior=step(.347,y)*(1.-step(.892,y));
 float label=step(.39,y)*(1.-step(.89,y))*step(.045,vUv.x)*(1.-step(.955,vUv.x));
 float glassZone=1.-label;
 float fillTop=mix(.90,.35,fill);
 float empty=1.-smoothstep(fillTop-.008,fillTop+.008,y);
 float grey=dot(c.rgb,vec3(.2126,.7152,.0722));
 c.rgb=mix(c.rgb,vec3(grey*.70,grey*.78,grey*.73),empty*glassZone*(1.-assembled));
 c.a*=mix(1.,.34,empty*glassZone*(1.-assembled));`}
 gl_FragColor=vec4(c.rgb*exposure,c.a);
 #include <colorspace_fragment>
 }` }));
 const geo=own(new THREE.PlaneGeometry(width,H)),bodyMat=originalMaterial(),capMat=originalMaterial(true);
 const body=new THREE.Mesh(geo,bodyMat);body.position.y=H/2;root.add(body);
 const cap=new THREE.Mesh(geo,capMat);cap.position.set(0,H/2,.003);root.add(cap);
 // A short glass neck is revealed only after the cap lifts. It uses the clear
 // neck artwork, not an invented gold stopper over the opening.
 const neckMat=own(new THREE.MeshBasicMaterial({map:glass,transparent:true,depthWrite:false,toneMapped:false,opacity:0}));
 const neckGeo=own(new THREE.PlaneGeometry(width*.40,.25));const neckUV=neckGeo.getAttribute('uv');
 for(let i=0;i<neckUV.count;i++)neckUV.setXY(i,.30+neckUV.getX(i)*.40,.84+neckUV.getY(i)*.135);
 const neck=new THREE.Mesh(neckGeo,neckMat);neck.position.set(0,H*(1-.335)+.07,.001);root.add(neck);
 const surfaceMat=own(new THREE.MeshBasicMaterial({color:0xf5cb70,transparent:true,opacity:.65,depthWrite:false,toneMapped:false}));
 const surface=new THREE.Mesh(own(new THREE.RingGeometry(.43,.45,64)),surfaceMat);surface.scale.set(width,.12,1);surface.position.z=.005;root.add(surface);
 // An unlit photographic environment preserves the reference's actual colour.
 const envMat=own(new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{map:{value:plate},opacity:{value:1},aspect:{value:1},verticalScale:{value:1},base:{value:.84}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:`varying vec2 vUv;uniform sampler2D map;uniform float opacity,aspect,verticalScale,base;
 void main(){float y=(1.-vUv.y-base)/verticalScale+.84;float x=(vUv.x-.54)*aspect/verticalScale+.535;vec3 c=texture2D(map,vec2(clamp(x,0.,1.),1.-clamp(y,0.,1.))).rgb;float edge=1.-smoothstep(-.12,.03,y);c=mix(c,vec3(.0012,.005,.0018),edge);gl_FragColor=vec4(c,opacity);
 #include <colorspace_fragment>
 }` }));
 const env=new THREE.Mesh(own(new THREE.PlaneGeometry(1,1)),envMat);environment.add(env);
 const oilMat=own(new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{reach:{value:0},drain:{value:0},opacity:{value:0}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:`varying vec2 vUv;uniform float reach,drain,opacity;void main(){float t=1.-vUv.y;if(t>reach||t<drain)discard;float x=vUv.x;vec3 c=mix(vec3(.20,.075,.008),vec3(.95,.55,.10),sin(x*3.14159));c+=vec3(1.,.91,.64)*pow(max(0.,1.-abs(x-.28)*9.),8.);float a=smoothstep(0.,.12,x)*(1.-smoothstep(.88,1.,x));gl_FragColor=vec4(c,a*opacity);#include <colorspace_fragment>}`.replace(';#include',';\n#include')}));
 const stream=new THREE.Mesh(own(new THREE.PlaneGeometry(.045,1)),oilMat);effects.add(stream);
 const dropMat=own(new THREE.MeshPhysicalMaterial({color:0xe8ab35,metalness:.58,roughness:.16,clearcoat:1,emissive:0x9d5c10,emissiveIntensity:.3}));
 const dropGeo=own(new THREE.LatheGeometry([[0,.19],[.014,.08],[.043,.015],[.065,-.04],[.046,-.09],[0,-.105]].map(p=>new THREE.Vector2(...p)),32));
 const drop=new THREE.Mesh(dropGeo,dropMat);effects.add(drop);
 const pool=new THREE.Mesh(own(new THREE.SphereGeometry(1,32,12)),dropMat);pool.scale.set(.30,.04,.08);effects.add(pool);
 let openingKey='';
 return {root,environment,effects,update(state,brightness=1){
  root.visible=state.actorVisible;root.position.fromArray(state.bottle.position);root.scale.setScalar(state.bottle.scale);
  cap.position.set(state.cap.offset[0],H/2+state.cap.offset[1],.003);level.value=state.fill;
  closed.value=smoothRange(.70,.78,state.progress);exposure.value=brightness;
  neckMat.opacity=smoothRange(.15,.18,state.progress)*(1-smoothRange(.74,.78,state.progress));
  const surfaceY=.32+1.72*state.fill;surface.position.y=surfaceY;surface.visible=state.progress>=.325&&state.progress<.70;surfaceMat.opacity=(.25+state.ripple*.35)*(1-smoothRange(.65,.70,state.progress));surface.scale.x=width*(1+state.ripple*.06*Math.sin(state.progress*190));
  const key=state.view.width+':'+state.view.height;
  if(key!==openingKey){openingKey=key;const openingDistance=state.view.height/(2*Math.tan(32*Math.PI/360)),depthFactor=(openingDistance+.55)/openingDistance;env.scale.set(state.view.width*depthFactor,state.view.height*depthFactor,1);env.position.set(state.openingBottlePosition[0]-.04*state.view.width,8.5,.55);envMat.uniforms.aspect.value=state.view.width/state.view.height/(1672/941);envMat.uniforms.verticalScale.value=state.view.height>7?.38/.56:1;envMat.uniforms.base.value=state.view.height>7?.88:.84;}
  environment.visible=state.environmentOpacity>.001;envMat.uniforms.opacity.value=state.environmentOpacity;
  effects.visible=state.progress<.70;const source=state.source,mouth=state.mouth,len=source[1]-mouth[1];stream.position.set(source[0],(source[1]+mouth[1])/2,1.13);stream.scale.y=len;oilMat.uniforms.reach.value=state.streamReach;oilMat.uniforms.drain.value=state.streamDrain;oilMat.uniforms.opacity.value=state.stream;
  pool.position.set(source[0],source[1]+.025,.59);pool.visible=state.progress>.18&&state.progress<.61;pool.scale.x=.30*smoothRange(.18,.28,state.progress)*(1-smoothRange(.57,.61,state.progress));
  drop.visible=state.drop.visible;drop.position.fromArray(state.drop.position);drop.scale.setScalar(state.drop.scale);
 }};
}
