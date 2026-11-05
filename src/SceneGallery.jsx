import React,{useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {bottleArtwork} from './bottle-artwork.mjs';
import {bottleTransitionPose,FORMAT_TRANSITION_MS} from './bottle-transition.mjs';
import {bottleBlendGLSL,bottleBlendMaterial,setBottleBlend} from './bottle-blend.mjs';
import {createHeroBottle,createRockStream,createBottleEnvironment} from './hero-bottle.mjs';
import {createStoneFormation} from './stone-formation.mjs';
import {HERO_CONFIG} from './hero-story.mjs';
import {Reflector} from 'three/addons/objects/Reflector.js';
import {HorizontalBlurShader} from 'three/addons/shaders/HorizontalBlurShader.js';
import {VerticalBlurShader} from 'three/addons/shaders/VerticalBlurShader.js';
import {NICHE,galleryPose,detailPose,cameraEase,clampIndex,visibleCount} from './scene-layout.mjs';
import {displayLayout,displayCell,displayPose,displayDetailPose,ROW_PITCH,homeStoryState,clampReveal} from './collection-layout.mjs';

export default function SceneGallery({items,index,selectedId,selectedFormat='oil',onSelect,onIndexChange,onMotion,onReady,layout='wall',shelfTop=270,onProductFocus,revealProgressRef,onRevealProgress,interactionEnabled=true,onFallback}){
 const [layoutWidth,setLayoutWidth]=useState(()=>document.body.clientWidth||innerWidth);
 useEffect(()=>{const update=()=>setLayoutWidth(host.current?.clientWidth||document.body.clientWidth);window.addEventListener('resize',update);return()=>window.removeEventListener('resize',update);},[]);
 const spec=displayLayout(layout,items.length,layoutWidth),structured=layout!=='wall',stacked=spec.scale!==1;
 const host=useRef(),canvasMount=useRef(),zoneRefs=useRef(new Map()),engine=useRef(),props=useRef();
 const [hovered,setHovered]=useState(null),[fallback,setFallback]=useState(false),[loaded,setLoaded]=useState(false),[failedImages,setFailedImages]=useState(new Set()),[fallbackScroll,setFallbackScroll]=useState(scrollY);
 useEffect(()=>{if(!fallback||layout!=='shelf')return;const update=()=>setFallbackScroll(scrollY);window.addEventListener('scroll',update,{passive:true});update();return()=>window.removeEventListener('scroll',update);},[fallback,layout]);
 props.current={items,index,selectedId,selectedFormat,onSelect,onIndexChange,onMotion,onReady,hovered,layout,shelfTop,onProductFocus,revealProgressRef,onRevealProgress,interactionEnabled,onFallback};
 const ids=layout+':'+spec.columns+':'+items.map(p=>`${p.id}:${p.artwork}`).join('|');
 useEffect(()=>{
  const mount=canvasMount.current,element=host.current;
  setFailedImages(new Set());
  let renderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});}catch{setFallback(true);setLoaded(true);onReady?.();onMotion?.(false);onFallback?.();return;}
  // Supersample desktop labels even on 1x displays, then let the browser
  // resolve the canvas to its display size with proper subpixel coverage.
  renderer.setPixelRatio(innerWidth>700?2:Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
  renderer.transmissionResolutionScale=.5;
  renderer.setClearColor(0x080b0a);mount.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-hidden','true');
  const scene=new THREE.Scene();scene.background=new THREE.Color(0x080b0a);scene.fog=new THREE.FogExp2(0x080b0a,.016);
  const camera=new THREE.PerspectiveCamera(32,1,.1,170);
  scene.add(new THREE.HemisphereLight(0xc7d0ca,0x1c231f,1.25));
  const moon=new THREE.DirectionalLight(0xd1d9d4,2.2);moon.position.set(-10,12,13);scene.add(moon);
  const bounce=new THREE.DirectionalLight(0x477356,.45);bounce.position.set(10,3,12);scene.add(bounce);
  let assetsReady=false,readyNotified=false;
  const manager=new THREE.LoadingManager(()=>{assetsReady=true;}),loader=new THREE.TextureLoader(manager),resources=[],bottles=[],lamps=[],zones=[];
  delete element.dataset.heroActorReady;
  let hero,formation,heroStream,plateReady=false;
  const heroIndex=revealProgressRef?items.findIndex(product=>product.id===HERO_CONFIG.product):-1;
  const plate=heroIndex>=0?loader.load(HERO_CONFIG.backdrop,()=>{plateReady=true;},undefined,()=>{if(!stopped)props.current.onFallback?.();}):null;
  if(plate){plate.colorSpace=THREE.SRGBColorSpace;plate.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());resources.push(plate);}
  delete element.dataset.stoneReady;
  const stone=loader.load('/assets/stone.webp',()=>{if(!stopped)element.dataset.stoneReady='true';});stone.colorSpace=THREE.SRGBColorSpace;stone.wrapS=stone.wrapT=THREE.RepeatWrapping;stone.repeat.set(.65,.75);if(revealProgressRef)stone.offset.set(.45,.1);stone.anisotropy=Math.min(16,renderer.capabilities.getMaxAnisotropy());resources.push(stone);
  const stoneDetail=revealProgressRef?loader.load('/assets/stone-detail-v1.webp'):null;
  if(stoneDetail){stoneDetail.wrapS=stoneDetail.wrapT=THREE.RepeatWrapping;stoneDetail.anisotropy=stone.anisotropy;resources.push(stoneDetail);}
  // Crossfade texture boundaries with an offset sample. The macro opening stays
  // sharp without hard tile seams or mirrored patterns in the same stone room.
  const seamlessStone=`vec4 sampleStone(sampler2D stoneMap,vec2 uv){
   vec2 base=fract(uv),offset=fract(base+.5),blend=smoothstep(vec2(.32),vec2(.5),abs(base-.5));
   return mix(mix(texture2D(stoneMap,base),texture2D(stoneMap,vec2(offset.x,base.y)),blend.x),mix(texture2D(stoneMap,vec2(base.x,offset.y)),texture2D(stoneMap,offset),blend.x),blend.y);
  }`;
  const material=(color,extra={})=>{const m=new THREE.MeshStandardMaterial({map:stone,bumpMap:stone,bumpScale:.12,color,roughness:.96,metalness:.02,...extra});m.onBeforeCompile=shader=>{
   if(revealProgressRef){
    shader.uniforms.stoneDetailMap={value:stoneDetail};
    const heightSample='uniform sampler2D stoneDetailMap;\nfloat stoneHeight(sampler2D sourceMap,vec2 uv){return sampleStone(sourceMap,uv).r+(sampleStone(stoneDetailMap,uv*5.5).r-.5)*.13;}';
    const bump=THREE.ShaderChunk.bumpmap_pars_fragment.replace('texture2D( bumpMap, vBumpMapUv ).x','stoneHeight(bumpMap,vBumpMapUv)').replace('texture2D( bumpMap, vBumpMapUv + dSTdx ).x','stoneHeight(bumpMap,vBumpMapUv+dSTdx)').replace('texture2D( bumpMap, vBumpMapUv + dSTdy ).x','stoneHeight(bumpMap,vBumpMapUv+dSTdy)');
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\n'+seamlessStone+'\n'+heightSample).replace('#include <bumpmap_pars_fragment>',bump);
   }
   const mapped=revealProgressRef?THREE.ShaderChunk.map_fragment.replace('texture2D( map,','sampleStone( map,'):'#include <map_fragment>';
   shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',mapped+'\ndiffuseColor.rgb=pow(diffuseColor.rgb,vec3(.60))*1.25;');
  };resources.push(m);return m;};
  const front=material(0xb2bbb6),side=material(0x6c7b71),back=material(0x6a786e),ledge=material(0x9ba99c,{roughness:.55});
  const room=new THREE.Group();scene.add(room);
  const box=(w,h,d,x,y,z,mat,relief=false)=>{
   const geo=new THREE.BoxGeometry(w,h,d,relief?Math.min(240,Math.ceil(w*4)):1,relief?32:1,1),uv=geo.getAttribute('uv'),pos=geo.getAttribute('position'),normal=geo.getAttribute('normal');
   for(let i=0;i<uv.count;i++){
    const px=pos.getX(i)+x,py=pos.getY(i)+y,pz=pos.getZ(i)+z;
    if(Math.abs(normal.getX(i))>.5)uv.setXY(i,pz*.26,py*.26);else if(Math.abs(normal.getY(i))>.5)uv.setXY(i,px*.26,pz*.26);else uv.setXY(i,px*.26,py*.26);
    if(relief&&normal.getZ(i)>.5){const edge=Math.sin(Math.PI*(pos.getX(i)/w+.5))*Math.sin(Math.PI*(pos.getY(i)/h+.5)),grain=.55+.25*Math.sin(px*7.13+Math.sin(py*5.1))*.9+.2*Math.sin(py*11.4-px*.3);pos.setZ(i,pos.getZ(i)+.045*edge*grain);}
   }
   if(relief)geo.computeVertexNormals();const mesh=new THREE.Mesh(geo,mat);mesh.position.set(x,y,z);room.add(mesh);resources.push(geo);return mesh;
  };
  const total=(structured?spec.columns:Math.max(1,items.length))*NICHE.stride,center=((structured?spec.columns:items.length)-1)*NICHE.stride/2;
  const bottom=-(spec.rows-1)*ROW_PITCH,wallHeight=spec.rows*ROW_PITCH+18;
  box(total+50,wallHeight,.45,center,bottom/2+3,-1.25,back);
  if(stacked||layout==='shelf'){
   box(total+50,revealProgressRef?13.745:6,1.2,center,revealProgressRef?11.1275:7,-.46,front,!!revealProgressRef);
   for(let row=0;row<spec.rows;row++)box(total+.9,.65,1.2,center,-row*ROW_PITCH+3.93,-.46,front);
   // Finish the wall below each ledge so captions sit on continuous stone,
   // instead of the dark rectangular gaps left between the shelf rows.
   if(layout==='shelf')for(let row=0;row<spec.rows;row++)box(total+.9,.78,1.2,center,-row*ROW_PITCH+NICHE.bottom*spec.scale-.39,-.46,front);
   if(layout==='shelf')for(let col=0;col<=spec.columns;col++)box(NICHE.stride-NICHE.width,wallHeight,1.2,col*NICHE.stride-NICHE.stride/2,bottom/2+2,-.46,front);
   box(total+50,1.5,1.3,center,bottom-.35,-.45,front);
  }else{box(total+50,revealProgressRef?12.43:3.3,1.2,center,revealProgressRef?11.785:7.22,-.46,front,!!revealProgressRef);box(total+50,.65,1.3,center,.28,-.45,front);}
  box(12,wallHeight,1.2,-7.6,bottom/2+4,-.46,front);box(12,wallHeight,1.2,(structured?spec.columns-1:items.length-1)*NICHE.stride+7.6,bottom/2+4,-.46,front);
  const heroGraze=new THREE.DirectionalLight(0xd6dac6,0);heroGraze.position.set(center-4,8.8,1.4);heroGraze.target.position.set(center,7.2,.14);if(revealProgressRef)scene.add(heroGraze,heroGraze.target);
  const glowCanvas=document.createElement('canvas');glowCanvas.width=64;glowCanvas.height=64;
  const ctx=glowCanvas.getContext('2d'),gradient=ctx.createRadialGradient(32,32,2,32,32,31);gradient.addColorStop(0,'rgba(162,255,185,.55)');gradient.addColorStop(.28,'rgba(96,213,137,.18)');gradient.addColorStop(1,'rgba(45,163,102,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);
  const glowTexture=new THREE.CanvasTexture(glowCanvas);resources.push(glowTexture);
  items.forEach((product,i)=>{
   const cell=structured?displayCell(i,layout,items.length,layoutWidth):{x:i*NICHE.stride,y:0,scale:1};
   const x=cell.x,firstMesh=room.children.length;
   // The recess has an actual back, sides, ceiling and a slab with visible thickness.
   if(layout!=='shelf')box(NICHE.stride-NICHE.width,5.57,1.2,x-NICHE.stride/2,2.785,-.46,front);
   if(layout!=='shelf'&&(i===items.length-1||structured&&(i+1)%spec.columns===0))box(NICHE.stride-NICHE.width,5.57,1.2,x+NICHE.stride/2,2.785,-.46,front);
   box(NICHE.width,.17,1.25,x,.65,-.46,ledge);
   box(NICHE.width,.12,1.2,x,NICHE.top,-.46,side);
   box(.035,NICHE.top-NICHE.bottom,1.15,x-NICHE.width/2+.02,3.08,-.46,side);
   box(.035,NICHE.top-NICHE.bottom,1.15,x+NICHE.width/2-.02,3.08,-.46,side);
   const bulbMaterial=new THREE.MeshBasicMaterial({color:0x356b4c,toneMapped:false});resources.push(bulbMaterial);
   const housingGeo=new THREE.CylinderGeometry(.19,.19,.035,32),housing=new THREE.Mesh(housingGeo,new THREE.MeshStandardMaterial({color:0x252b28,metalness:.75,roughness:.4}));housing.position.set(x,5.43,-.48);room.add(housing);resources.push(housingGeo,housing.material);
   const bulbGeo=new THREE.CircleGeometry(.155,32),bulb=new THREE.Mesh(bulbGeo,bulbMaterial);bulb.rotation.x=Math.PI/2;bulb.position.set(x,5.405,-.48);room.add(bulb);resources.push(bulbGeo);
   const glowMat=new THREE.SpriteMaterial({map:glowTexture,transparent:true,opacity:.08,depthWrite:false,blending:THREE.AdditiveBlending});resources.push(glowMat);const glow=new THREE.Sprite(glowMat);glow.position.set(x,5.39,-.4);glow.scale.set(1.4,.55,1);room.add(glow);
   // A faint volume is separate geometry, never part of the stone or product artwork.
   const beamGeo=new THREE.ConeGeometry(.83,4.55,40,1,true);beamGeo.translate(0,-2.275,0);
   const beamMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,uniforms:{strength:{value:0}},vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'uniform float strength; varying vec2 vUv; void main(){float edge=pow(sin(vUv.x*3.14159265),3.0);float fade=pow(vUv.y,1.2)*(1.0-smoothstep(.94,1.0,vUv.y));gl_FragColor=vec4(.33,.85,.49,edge*fade*strength);}' });
   const beam=new THREE.Mesh(beamGeo,beamMat);beam.position.set(x,5.38,-.48);room.add(beam);resources.push(beamGeo,beamMat);
   lamps.push({id:product.id,x,y:cell.y,scale:cell.scale,bulbMaterial,glowMat,beamMat,energy:0});
   const shadowGeo=new THREE.PlaneGeometry(1.45,.72),shadowMat=new THREE.MeshBasicMaterial({map:glowTexture,color:0x000000,transparent:true,opacity:.85,depthWrite:false}),shadow=new THREE.Mesh(shadowGeo,shadowMat);shadow.rotation.x=-Math.PI/2;shadow.position.set(x,.741,-.43);room.add(shadow);resources.push(shadowGeo,shadowMat);
   const bottleMat=bottleBlendMaterial();resources.push(bottleMat);
   const bottleGeo=new THREE.PlaneGeometry(1,NICHE.bottleHeight),bottle=new THREE.Mesh(bottleGeo,bottleMat);bottle.position.set(x,.75+NICHE.bottleHeight/2,NICHE.bottleZ);room.add(bottle);resources.push(bottleGeo);
   let reflectionMaterial;
   if(stacked||layout==='shelf'){
    const geometry=new THREE.PlaneGeometry(1,1),mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{map:{value:null},brightness:{value:.25},...bottleMat.userData.blend},vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'uniform sampler2D map;uniform float brightness;varying vec2 vUv;'+bottleBlendGLSL+'void main(){vec2 uv=vec2(vUv.x,(1.0-vUv.y)*.4);vec4 c=vec4(0.0);for(int x=-1;x<=1;x++)for(int y=-1;y<=1;y++)c+=sampleBottle(uv+vec2(float(x),float(y))*.009);c/=9.0;gl_FragColor=vec4(c.rgb*.37*brightness,c.a*pow(vUv.y,2.0)*.4);\n#include <colorspace_fragment>\n}'});
    const mesh=new THREE.Mesh(geometry,mat);mesh.position.set(x,.25,NICHE.bottleZ+.015);room.add(mesh);reflectionMaterial={mat,mesh};resources.push(geometry,mat);
   }
   const record={id:product.id,material:bottleMat,reflectionMaterial,brightness:.56,mesh:bottle,textures:{},cellScale:cell.scale,activeFormat:null,transition:null,formatOpacity:1,baseY:bottle.position.y,baseZ:bottle.position.z};
   bottles.push(record);
   for(const format of ['oil','perfume'])loader.load(bottleArtwork(product,format),texture=>{
    if(stopped){texture.dispose();return;}texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=renderer.capabilities.getMaxAnisotropy();
    // Proper minification plus the supersampled canvas preserves fine strokes
    // without the jagged/shimmering edges of sampling the full-size image directly.
    texture.generateMipmaps=true;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter;
    record.textures[format]=texture;resources.push(texture);
   },undefined,()=>{if(stopped||format!=='oil')return;setFailedImages(previous=>new Set([...previous,product.id]));if(i===heroIndex)props.current.onFallback?.();});
   zones.push({id:product.id,index:i,labelPoint:new THREE.Vector3(x,cell.y+(.75+NICHE.bottleHeight/2)*cell.scale,NICHE.bottleZ),corners:[new THREE.Vector3(x-NICHE.width/2,cell.y+NICHE.top*cell.scale,.12),new THREE.Vector3(x+NICHE.width/2,cell.y+NICHE.bottom*cell.scale,.12)]});
   if(cell.scale!==1||cell.y!==0){const meshes=room.children.slice(firstMesh),group=new THREE.Group();group.position.y=cell.y;group.scale.y=cell.scale;meshes.forEach(mesh=>group.add(mesh));room.add(group);}

  });
  const activeSpot=new THREE.SpotLight(0x73eaa0,0,8,.39,.95,1.2),activeBacklight=new THREE.PointLight(0x28c77b,0,5,1.5);room.add(activeSpot,activeSpot.target,activeBacklight);let activeLamp=null;
  const reflectionShader={...Reflector.ReflectorShader,uniforms:{...THREE.UniformsUtils.clone(Reflector.ReflectorShader.uniforms),uTime:{value:0}},fragmentShader:Reflector.ReflectorShader.fragmentShader.replace('uniform vec3 color;','uniform vec3 color; uniform float uTime;').replace('vec4 base = texture2DProj( tDiffuse, vUv );',`vec4 reflectedUv=vUv;float ripple=sin(vUv.y*210.0+uTime*.23)*.00015+sin(vUv.y*570.0-uTime*.13)*.00008;reflectedUv.x+=ripple*vUv.w;vec4 base=texture2DProj(tDiffuse,reflectedUv);`).replace('vec4( blendOverlay( base.rgb, color ), 1.0 )','vec4( blendOverlay( base.rgb, color ) * .76, 1.0 )')};
  const floorGeo=new THREE.PlaneGeometry(total+100,90),floor=new Reflector(floorGeo,{clipBias:.003,textureWidth:Math.min(innerWidth*devicePixelRatio,1800),textureHeight:Math.min(innerHeight*devicePixelRatio,1200),color:0x9aab9e,multisample:0,shader:reflectionShader});floor.rotation.x=-Math.PI/2;floor.position.set(center,.45,16);scene.add(floor);floor.visible=!stacked&&layout!=='shelf';resources.push(floorGeo);
  // Blur the mirror texture itself in two separable passes: smooth frosted reflections,
  // without ghosted duplicate samples or blurring the bottle and stone geometry.
  const blurWidth=640,blurHeight=480,blurA=new THREE.WebGLRenderTarget(blurWidth,blurHeight),blurB=new THREE.WebGLRenderTarget(blurWidth,blurHeight);
  const horizontal=new THREE.ShaderMaterial(HorizontalBlurShader),vertical=new THREE.ShaderMaterial(VerticalBlurShader);
  horizontal.uniforms=THREE.UniformsUtils.clone(HorizontalBlurShader.uniforms);vertical.uniforms=THREE.UniformsUtils.clone(VerticalBlurShader.uniforms);horizontal.uniforms.h.value=1.8/blurWidth;vertical.uniforms.v.value=2.5/blurHeight;
  const blurScene=new THREE.Scene(),blurCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,1),blurQuad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),horizontal);blurScene.add(blurQuad);resources.push(blurA,blurB,horizontal,vertical,blurQuad.geometry);
  const reflect=floor.onBeforeRender,viewport=new THREE.Vector4();
  floor.onBeforeRender=function(...args){reflect.apply(this,args);const target=renderer.getRenderTarget(),xr=renderer.xr.enabled;renderer.getViewport(viewport);renderer.xr.enabled=false;horizontal.uniforms.tDiffuse.value=floor.getRenderTarget().texture;blurQuad.material=horizontal;renderer.setRenderTarget(blurA);renderer.render(blurScene,blurCamera);vertical.uniforms.tDiffuse.value=blurA.texture;blurQuad.material=vertical;renderer.setRenderTarget(blurB);renderer.render(blurScene,blurCamera);floor.material.uniforms.tDiffuse.value=blurB.texture;renderer.setRenderTarget(target);renderer.setViewport(viewport);renderer.xr.enabled=xr;};
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let homeProgress=clampReveal(props.current.revealProgressRef?.current??0);
  let heroStillFrame=false,inView=true;
  const frameSamples=new Float64Array(240);let sampleCount=0,sampleCursor=0;
  const visibilityObserver=revealProgressRef?new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;}):null;
  if(visibilityObserver)visibilityObserver.observe(element.closest('.home-experience'));
  const widePose=(config,w,h,story)=>config.revealProgressRef?(story??homeStoryState(homeProgress,items.length,w,h)).camera:structured?displayPose(layout,items.length,w,h,{scroll:scrollY,top:config.shelfTop}):galleryPose(config.index,items.length,w,h);
  let width=innerWidth,height=innerHeight,currentPose=widePose(props.current,width,height),motion=null,lastKey='',animationFrame,stopped=false,drag=null,swallowClick=false,lastTime=performance.now(),renderedOnce=false;
  camera.position.fromArray(currentPose.position);let look=new THREE.Vector3(...currentPose.target);camera.lookAt(look);
  const resize=()=>{width=element.clientWidth;height=element.clientHeight;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();heroStillFrame=false;sampleCount=0;sampleCursor=0;};
  const observer=new ResizeObserver(resize);observer.observe(element);resize();
  const contextLost=()=>{if(stopped)return;setFallback(true);setLoaded(true);props.current.onMotion?.(false);props.current.onFallback?.();};
  renderer.domElement.addEventListener('webglcontextlost',contextLost);
  const startMotion=(pose,duration,notify=false)=>{motion={start:performance.now(),duration:reduced.matches?1:duration,from:camera.position.clone(),fromLook:look.clone(),to:new THREE.Vector3(...pose.position),toLook:new THREE.Vector3(...pose.target),notify};if(notify)props.current.onMotion?.(true);};
  const pointerDown=e=>{if(structured||props.current.selectedId||e.button!==0)return;drag={x:e.clientX,y:e.clientY,index:props.current.index,moved:false};};
  const pointerMove=e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(!drag.moved&&Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>8){drag=null;return;}if(Math.abs(dx)>7){drag.moved=true;swallowClick=true;const value=clampIndex(drag.index-dx/(width/visibleCount(width)),items.length,width);const pose=galleryPose(value,items.length,width,height);startMotion(pose,140);}};
  const pointerUp=e=>{if(!drag)return;if(drag.moved){const value=clampIndex(Math.round(drag.index-(e.clientX-drag.x)/(width/visibleCount(width))),items.length,width);startMotion(galleryPose(value,items.length,width,height),250);props.current.onIndexChange(value);setTimeout(()=>{swallowClick=false;},0);}drag=null;};
  const pointerCancel=()=>{if(drag?.moved)startMotion(galleryPose(props.current.index,items.length,width,height),250);drag=null;swallowClick=false;};
  const clickCapture=e=>{if(swallowClick){e.preventDefault();e.stopPropagation();swallowClick=false;}};
  const wheel=e=>{if(structured||props.current.selectedId||Math.abs(e.deltaX)<=Math.abs(e.deltaY))return;e.preventDefault();if(Math.abs(e.deltaX)>8){const next=clampIndex(props.current.index+Math.sign(e.deltaX),items.length,width);props.current.onIndexChange(next);}};
  element.addEventListener('pointerdown',pointerDown);element.addEventListener('pointermove',pointerMove);window.addEventListener('pointerup',pointerUp);window.addEventListener('pointercancel',pointerCancel);element.addEventListener('click',clickCapture,true);if(!structured)element.addEventListener('wheel',wheel,{passive:false});
  const animate=now=>{
   if(stopped)return;animationFrame=requestAnimationFrame(animate);const elapsed=now-lastTime,dt=Math.min(elapsed/1000,.1);lastTime=now;element.dataset.frameMs=elapsed.toFixed(1);
   const config=props.current,selected=items.findIndex(p=>p.id===config.selectedId),key=`${config.index}:${config.selectedId}:${width}:${height}`;
   if(document.hidden||(!inView&&selected<0))return;
   const previousProgress=homeProgress;
   if(config.revealProgressRef&&selected<0){const target=clampReveal(config.revealProgressRef.current);homeProgress=THREE.MathUtils.damp(homeProgress,target,12,dt);if(Math.abs(homeProgress-target)<.0001)homeProgress=target;}
   const story=config.revealProgressRef?homeStoryState(selected>=0?1:homeProgress,items.length,width,height):null;
   if(!hero&&story&&plateReady&&bottles[heroIndex]?.textures.oil){
    try{
     const environment=createBottleEnvironment(renderer,resources);
     hero=createHeroBottle({texture:bottles[heroIndex].textures.oil,environment,resources});
     formation=createStoneFormation({plate,resources});formation.update(story);
     heroStream=createRockStream({source:story.source,bottlePosition:story.openingBottlePosition,resources,environment,surfaceAt:formation.surfaceAt});
     scene.add(formation.root,hero.root,heroStream.root);
    }catch{props.current.onFallback?.();return;}
   }
   if(config.revealProgressRef&&Math.abs(homeProgress-previousProgress)>.00001){
    frameSamples[sampleCursor++%240]=elapsed;sampleCount=Math.min(240,sampleCount+1);
    if(sampleCount>=30&&sampleCursor%30===0){const samples=Array.from(frameSamples.subarray(0,sampleCount)).sort((a,b)=>a-b);element.dataset.frameMean=(samples.reduce((a,b)=>a+b,0)/sampleCount).toFixed(1);element.dataset.frameP95=samples[Math.floor((sampleCount-1)*.95)].toFixed(1);element.dataset.frameSamples=String(sampleCount);}
   }

   if(key!==lastKey&&!drag){const old=lastKey.split(':'),wasDetail=lastKey.includes(':')&&old[1]!=='null'&&old[1]!=='undefined',pose=selected>=0?(structured?displayDetailPose(selected,layout,items.length,width):detailPose(selected,width)):widePose(config,width,height,story);if(!lastKey){camera.position.fromArray(pose.position);look.fromArray(pose.target);motion=null;props.current.onMotion?.(false);}else if(old[0]===String(config.index)&&old[1]===String(config.selectedId)){if(motion){motion.to.fromArray(pose.position);motion.toLook.fromArray(pose.target);}else {camera.position.fromArray(pose.position);look.fromArray(pose.target);}}else startMotion(pose,selected>=0?1500:wasDetail?1350:850,selected>=0||wasDetail);lastKey=key;}
   if(motion){if((layout==='shelf'||story)&&selected<0){const pose=widePose(config,width,height,story);motion.to.fromArray(pose.position);motion.toLook.fromArray(pose.target);}const t=Math.min((now-motion.start)/motion.duration,1),e=cameraEase(t);camera.position.lerpVectors(motion.from,motion.to,e);look.lerpVectors(motion.fromLook,motion.toLook,e);if(t>=1){const notify=motion.notify;motion=null;if(notify)props.current.onMotion?.(false);}}
   if((layout==='shelf'||story)&&selected<0&&!motion){const pose=widePose(config,width,height,story);camera.position.fromArray(pose.position);look.fromArray(pose.target);}
   camera.lookAt(look);camera.updateMatrixWorld();
   const inStory=story&&selected<0&&homeProgress<.998;
   const quality=inStory?Math.min(devicePixelRatio,width>760?1.35:1.2):innerWidth>700?2:Math.min(devicePixelRatio,1.5);
   if(renderer.getPixelRatio()!==quality){renderer.setPixelRatio(quality);renderer.setSize(width,height,false);heroStillFrame=false;}
   // Retain a completed stone/product frame while the entrance and scroll rest.
   if(inStory&&!motion&&heroStillFrame&&readyNotified&&homeProgress===previousProgress){element.dataset.renderMode='retained-frame';return;}
   heroStillFrame=!!inStory&&!motion;
   element.dataset.renderMode='live-scene';
   bottles.forEach(bottle=>{
    const isSelected=config.selectedId===bottle.id,format=config.selectedFormat;
    const animateSwitch=(!config.selectedId||isSelected)&&!reduced.matches&&bottle.activeFormat&&bottle.textures[format];
    if(!animateSwitch){bottle.transition=null;bottle.activeFormat=bottle.textures[format]?format:'oil';}
    else if(format!==(bottle.transition?.to??bottle.activeFormat)){
     if(bottle.transition&&format===bottle.transition.from){
      const previous=bottle.transition,progress=Math.min(1,(now-previous.start)/FORMAT_TRANSITION_MS);
      bottle.transition={from:previous.to,to:previous.from,start:now-(1-progress)*FORMAT_TRANSITION_MS};
     }else bottle.transition=format===bottle.activeFormat?null:{from:bottle.activeFormat,to:format,start:now};
    }
    let blend=0,depth=0,from=bottle.activeFormat,to=from;
    if(bottle.transition){
     const transition=bottle.transition,pose=bottleTransitionPose((now-transition.start)/FORMAT_TRANSITION_MS);
     from=transition.from;to=transition.to;blend=pose.blend;depth=pose.depth;
     if(pose.complete){bottle.activeFormat=to;bottle.transition=null;from=to;blend=0;}
    }
    const source=bottle.textures[from]||bottle.textures.oil,target=bottle.textures[to]||source;
    if(source&&target)setBottleBlend(bottle,source,target,blend,NICHE.bottleHeight);
    bottle.formatOpacity=1;bottle.material.opacity=source?1:0;
    bottle.mesh.position.y=bottle.baseY;bottle.mesh.position.z=bottle.baseZ+depth;
    bottle.mesh.rotation.y=0;bottle.mesh.scale.y=1;
    const zone=zoneRefs.current.get(bottle.id);if(zone)zone.dataset.bottleFormat=bottle.activeFormat;
   });
   element.dataset.bottleFormat=config.selectedFormat;
   element.dataset.formatMotion=bottles.some(bottle=>bottle.transition)?'switching':'settled';
   lamps.forEach((lamp,i)=>{const lit=lamp.id===(config.selectedId||(config.interactionEnabled?config.hovered:null));lamp.energy=THREE.MathUtils.damp(lamp.energy,lit?1:0,lit?9:7,dt);if(lit)activeLamp=lamp;lamp.bulbMaterial.color.setRGB(.07+lamp.energy*.10,.15+lamp.energy*.65,.10+lamp.energy*.25);lamp.glowMat.opacity=.03+lamp.energy*.65;lamp.beamMat.uniforms.strength.value=.005+lamp.energy*.09;const target=config.selectedId&&lamp.id!==config.selectedId?.012:lit?1:.56;const value=THREE.MathUtils.damp(bottles[i].brightness,target,lit?9:7,dt);bottles[i].brightness=value;bottles[i].material.color.setRGB(value,value,value);if(bottles[i].reflectionMaterial)bottles[i].reflectionMaterial.mat.uniforms.brightness.value=value*bottles[i].formatOpacity;const zone=zoneRefs.current.get(lamp.id);if(zone)zone.dataset.illumination=value.toFixed(3);});
   if(activeLamp){activeSpot.position.set(activeLamp.x,activeLamp.y+5.36*activeLamp.scale,-.45);activeSpot.target.position.set(activeLamp.x,activeLamp.y+.73*activeLamp.scale,-.62);activeBacklight.position.set(activeLamp.x,activeLamp.y+3.6*activeLamp.scale,-.28);activeSpot.intensity=activeLamp.energy*46;activeBacklight.intensity=activeLamp.energy*5;}
   if(story){
    room.visible=story.storyOpacity<.999;
    if(hero){
     const first=bottles[heroIndex],showActor=story.shelfArtwork<1;
     hero.root.visible=showActor;first.mesh.visible=story.shelfArtwork>0;first.material.opacity*=story.shelfArtwork;
     if(first.reflectionMaterial)first.reflectionMaterial.mat.uniforms.brightness.value*=story.shelfArtwork;
     if(showActor){hero.update(story);hero.setBrightness(1-(1-story.storyLight)*(1-first.brightness));}
     formation.update(story);heroStream.root.visible=formation.root.visible;
     if(heroStream.root.visible)heroStream.update(story,homeProgress);
     element.dataset.heroFill=story.fill.toFixed(3);element.dataset.heroStream=story.stream.toFixed(3);
    }
    heroGraze.intensity=2.4*story.storyLight;
    floor.visible=!stacked&&(homeProgress>.91||selected>=0);
    element.dataset.revealProgress=homeProgress.toFixed(4);config.onRevealProgress?.(homeProgress,!!motion);
   }
   element.dataset.motion=motion?'moving':'settled';element.dataset.view=selected>=0?'detail':'gallery';
   floor.material.uniforms.uTime.value=reduced.matches?0:now*.001;
   zones.forEach(zone=>{const el=zoneRefs.current.get(zone.id);if(!el)return;const a=zone.corners[0].clone().project(camera),b=zone.corners[1].clone().project(camera),left=(a.x*.5+.5)*width,top=(-a.y*.5+.5)*height,right=(b.x*.5+.5)*width,bottom=(-b.y*.5+.5)*height;const visible=right>0&&left<width&&selected<0;el.style.display=visible?'block':'none';if(visible){const label=zone.labelPoint.clone().project(camera);el.style.setProperty('--label-center',`${(label.x*.5+.5)*width-left}px`);el.style.setProperty('--label-width',`${Math.max(70,(right-left)*1.06)}px`);el.style.transform=`translate3d(${left}px,${top}px,0)`;el.style.width=`${right-left}px`;el.style.height=`${bottom-top}px`;}});
   renderer.render(scene,camera);if(hero)element.dataset.heroActorReady='true';if(!renderedOnce){renderedOnce=true;setLoaded(true);}if(renderedOnce&&assetsReady&&(!story||hero)&&!readyNotified){readyNotified=true;props.current.onReady?.();}
  };
  animationFrame=requestAnimationFrame(animate);engine.current={renderer,scene,camera};
  return()=>{stopped=true;cancelAnimationFrame(animationFrame);observer.disconnect();visibilityObserver?.disconnect();renderer.domElement.removeEventListener('webglcontextlost',contextLost);element.removeEventListener('pointerdown',pointerDown);element.removeEventListener('pointermove',pointerMove);window.removeEventListener('pointerup',pointerUp);window.removeEventListener('pointercancel',pointerCancel);element.removeEventListener('click',clickCapture,true);if(!structured)element.removeEventListener('wheel',wheel);floor.dispose();resources.forEach(r=>r.dispose?.());renderer.dispose();renderer.domElement.remove();};
 },[ids]);
 useEffect(()=>{props.current.hovered=hovered;},[hovered]);
 useEffect(()=>{setHovered(null);},[selectedId]);
 useEffect(()=>{if(fallback)props.current.onMotion?.(false);},[selectedId,fallback]);
 return <div className={`scene-world display-${layout} ${selectedId?'scene-in-detail':''} ${loaded?'scene-loaded':''} ${fallback?'scene-fallback':''}`} ref={host}>
  <div className="scene-renderer" ref={canvasMount}/>
  {fallback?<div className="fallback-room" style={{'--position':index,'--columns':spec.columns,'--rows':spec.rows,'--shelf-top':(shelfTop-fallbackScroll)+'px'}}>{items.map(p=><button className={`fallback-niche ${p.id===selectedId?'is-selected':''}`} key={p.id} onClick={()=>onSelect(p)}><span className="fallback-back"/><span className="fallback-left"/><span className="fallback-right"/><span className="fallback-top"/><span className="fallback-base"/><img src={bottleArtwork(p,selectedFormat)} alt={p.name}/><img className="fallback-reflection" src={bottleArtwork(p,selectedFormat)} alt=""/><span className="fallback-name">{p.name}</span></button>)}</div>:<div className="scene-zones" aria-label="Perfume display" aria-hidden={!interactionEnabled||undefined}>{items.map((p,i)=><button ref={el=>{if(el)zoneRefs.current.set(p.id,el);else zoneRefs.current.delete(p.id);}} key={p.id} disabled={!interactionEnabled} className={`scene-zone ${hovered===p.id?'zone-lit':''} ${failedImages.has(p.id)?'image-missing':''}`} aria-label={`Explore ${p.name}, ${i+1} of ${items.length}`} onPointerEnter={e=>{if(e.pointerType==='mouse')setHovered(p.id);}} onPointerLeave={()=>setHovered(null)} onFocus={e=>{if(e.currentTarget.matches(':focus-visible'))props.current.onProductFocus?.();setHovered(p.id);}} onBlur={()=>setHovered(null)} onClick={()=>{if(props.current.interactionEnabled)onSelect(p);}}><span className="scene-tag"><strong>{p.name}</strong><small>{failedImages.has(p.id)?'Image unavailable':`N° ${p.number} · ${p.family}`}</small></span></button>)}</div>}
  <div className="scene-vignette"/>
 </div>;
}
