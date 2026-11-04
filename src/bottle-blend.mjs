import * as THREE from 'three';

// Both photographs retain their own aspect ratios and the same shelf baseline.
// Blend premultiplied colour to keep transparent glass edges free of dark halos.
export const bottleBlendGLSL=`
uniform sampler2D nextMap;
uniform float bottleBlend;
uniform float sourceAspect;
uniform float targetAspect;
uniform float canvasAspect;
vec4 fittedBottle(sampler2D imageMap,vec2 uv,float aspect){
 uv.x=(uv.x-.5)*canvasAspect/aspect+.5;
 if(uv.x<0.0||uv.x>1.0)return vec4(0.0);
 return texture2D(imageMap,uv);
}
vec4 sampleBottle(vec2 uv){
 vec4 a=fittedBottle(map,uv,sourceAspect),b=fittedBottle(nextMap,uv,targetAspect);
 float alpha=mix(a.a,b.a,bottleBlend);
 vec3 colour=mix(a.rgb*a.a,b.rgb*b.a,bottleBlend)/max(alpha,.00001);
 return vec4(colour,alpha);
}`;

export function bottleBlendMaterial(){
 const material=new THREE.MeshBasicMaterial({transparent:true,opacity:0,alphaTest:.025,side:THREE.DoubleSide,color:0xa6b0a9,toneMapped:false,depthWrite:true});
 const uniforms={nextMap:{value:null},bottleBlend:{value:0},sourceAspect:{value:1},targetAspect:{value:1},canvasAspect:{value:1}};
 material.userData.blend=uniforms;
 material.onBeforeCompile=shader=>{
  Object.assign(shader.uniforms,uniforms);
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_pars_fragment>','#include <map_pars_fragment>\n#ifdef USE_MAP\n'+bottleBlendGLSL+'\n#endif');
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','#ifdef USE_MAP\ndiffuseColor *= sampleBottle(vMapUv);\n#endif');
 };
 material.customProgramCacheKey=()=> 'nura-bottle-cross-dissolve-v1';
 return material;
}

export function setBottleBlend(bottle,source,target,blend,height){
 const material=bottle.material,uniforms=material.userData.blend;
 const sourceAspect=source.image.width/source.image.height,targetAspect=target.image.width/target.image.height;
 const aspect=Math.max(sourceAspect,targetAspect);
 if(material.map!==source){material.map=source;material.needsUpdate=true;}
 uniforms.nextMap.value=target;uniforms.bottleBlend.value=blend;
 uniforms.sourceAspect.value=sourceAspect;uniforms.targetAspect.value=targetAspect;uniforms.canvasAspect.value=aspect;
 bottle.mesh.scale.x=height*aspect*bottle.cellScale;
 if(bottle.reflectionMaterial){bottle.reflectionMaterial.mat.uniforms.map.value=source;bottle.reflectionMaterial.mesh.scale.x=bottle.mesh.scale.x;}
}
