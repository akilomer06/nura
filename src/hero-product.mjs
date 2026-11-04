import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {HERO_CONFIG} from './hero-story.mjs';

// Front artwork is supplied photography. Depth, back and cap side surfaces are
// reconstructed from the front silhouette; they are not a verified product scan.
// Keep yaw below 30 degrees: no unsupported back label is exposed or invented.
export function createHeroPerfume(texture,renderer,resources,brandTexture){
 const own=object=>{resources.push(object);return object;};
 const anchor=new THREE.Group(),bottle=new THREE.Group();anchor.add(bottle);
 anchor.name='NURA reconstructed perfume, photographic front';
 const studio=new THREE.Scene();studio.background=new THREE.Color(0x151a16);
 for(const [x,y,z,w,h,color] of [[-3,2,4,1.3,7,0xffedce],[3,3,2,1,7,0xd9e3df],[0,6,0,5,2,0xffe8b7]]){
  const geometry=new THREE.PlaneGeometry(w,h),material=new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide}),card=new THREE.Mesh(geometry,material);card.position.set(x,y,z);card.lookAt(0,1,0);studio.add(card);
 }
 const pmrem=new THREE.PMREMGenerator(renderer),environment=own(pmrem.fromScene(studio,.04));pmrem.dispose();studio.traverse(object=>{object.geometry?.dispose();object.material?.dispose();});
 const envMap=environment.texture;
 const glass=own(new THREE.MeshPhysicalMaterial({map:texture,color:0xffffff,roughness:.17,metalness:.04,clearcoat:.8,clearcoatRoughness:.12,alphaTest:.015,transparent:true,opacity:.9,depthWrite:true,envMap,envMapIntensity:.6}));
 const amber=own(new THREE.MeshPhysicalMaterial({color:0xb77b25,roughness:.15,metalness:.05,clearcoat:1,envMap,envMapIntensity:.8}));
 const capPhoto=own(new THREE.MeshBasicMaterial({map:texture,transparent:true,alphaTest:.01,toneMapped:false}));
 const capSheen=own(new THREE.MeshPhysicalMaterial({color:0x242722,roughness:.22,metalness:.85,transparent:true,opacity:.075,depthWrite:false,envMap,envMapIntensity:1.3}));
 const mesh=(geometry,material,y=0)=>{own(geometry);const object=new THREE.Mesh(geometry,material);object.position.y=y;bottle.add(object);return object;};
 const bodyGeometry=new RoundedBoxGeometry(821/1916,.715,.17,5,.026),bodyUV=bodyGeometry.getAttribute('uv'),bodyPosition=bodyGeometry.getAttribute('position'),bodyNormal=bodyGeometry.getAttribute('normal');
 for(let i=0;i<bodyUV.count;i++){
  const x=bodyPosition.getX(i),z=bodyPosition.getZ(i),y=bodyPosition.getY(i)+.3575;
  // Use the photographed glass edge on the reconstructed side, never duplicate
  // the green front label or add unseen text to a side/back surface.
  const u=bodyNormal.getZ(i)<-.4?.04:Math.abs(bodyNormal.getX(i))>.4?(x>0?.94:.02)+(z/.17+.5)*.04:(x/(821/1916)+.5);
  bodyUV.setXY(i,u,y);
 }
 mesh(bodyGeometry,glass,.3575);
 mesh(new RoundedBoxGeometry(.369,.60,.128,4,.025),amber,.354);
 const cap=(radiusTop,radiusBottom,height,y)=>{
  const geometry=new THREE.CylinderGeometry(radiusTop,radiusBottom,height,96,8),uv=geometry.getAttribute('uv'),position=geometry.getAttribute('position');
  for(let i=0;i<uv.count;i++)uv.setXY(i,position.getX(i)/(821/1916)+.5,position.getY(i)+y);
  mesh(geometry,capPhoto,y);
  mesh(new THREE.CylinderGeometry(radiusTop+.0006,radiusBottom+.0006,height,96,1,true),capSheen,y);
 };
 cap(.114,.114,.090,.759);cap(.132,.132,.151,.875);cap(.113,.115,.049,.975);
 // Attach the exact original photographic face to the rotating solid actor.
 // Alpha preserves the photographed silhouette, glass and ornamental label.
 const face=own(new THREE.MeshBasicMaterial({map:texture,transparent:true,alphaTest:.015,depthWrite:true,toneMapped:false}));
 const frontGeometry=new THREE.PlaneGeometry(821/1916,.715),frontUV=frontGeometry.getAttribute('uv');for(let i=0;i<frontUV.count;i++)frontUV.setY(i,frontUV.getY(i)*.715);
 const photographicFace=mesh(frontGeometry,face,.3575);photographicFace.position.z=.09;
 const mark=HERO_CONFIG.branding.perfume,markWidth=mark.width*821/1916,markHeight=markWidth/HERO_CONFIG.branding.aspect;
 const brandMaterial=own(new THREE.MeshBasicMaterial({map:brandTexture,transparent:true,depthWrite:false,alphaTest:.002,toneMapped:false}));
 const brandDecal=mesh(new THREE.PlaneGeometry(markWidth,markHeight),brandMaterial,1-mark.top-markHeight/2);
 brandDecal.position.x=(mark.left+mark.width/2-.5)*821/1916;brandDecal.position.z=.0915;brandDecal.renderOrder=2;
 const materials=[glass,amber,capPhoto,capSheen,face,brandMaterial],baseOpacity=materials.map(material=>material.opacity);
 materials.forEach(material=>{material.transparent=true;});
 const forward=new THREE.Vector3(),right=new THREE.Vector3(),up=new THREE.Vector3();
 return {anchor,update(pose,camera,width,height,opacity){
  anchor.visible=opacity>.001;if(!anchor.visible)return;
  const distance=3.1,visibleHeight=2*distance*Math.tan(THREE.MathUtils.degToRad(camera.fov/2)),scale=pose.height*visibleHeight;
  camera.getWorldDirection(forward);right.set(1,0,0).applyQuaternion(camera.quaternion);up.set(0,1,0).applyQuaternion(camera.quaternion);
  anchor.position.copy(camera.position).addScaledVector(forward,distance+.09*scale).addScaledVector(right,(pose.x-.5)*visibleHeight*width/height).addScaledVector(up,(.5-pose.base)*visibleHeight);
  anchor.quaternion.copy(camera.quaternion);anchor.scale.setScalar(scale);bottle.rotation.y=pose.yaw;
  materials.forEach((material,i)=>{material.opacity=baseOpacity[i]*opacity;});
 }};
}
