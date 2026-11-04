import {NICHE,galleryPose,detailPose} from './scene-layout.mjs';
import {HERO_CONFIG} from './hero-story.mjs';

export const FEATURED_IDS=['althair-pdm','erba-pura','delighted-dior','almarj','sheikh-musk'];
export const featuredProducts=products=>FEATURED_IDS.map(id=>products.find(p=>p.id===id)).filter(Boolean);
export const ROW_PITCH=4.5;
export function displayLayout(mode,count,width){
 const columns=mode==='wall'?Math.max(1,count):Math.max(1,Math.min(count,width>1050?5:3));
 const rows=Math.max(1,Math.ceil(count/columns));
 return {columns,rows,scale:mode==='shelf'||rows>1?.65:1};
}
export function displayCell(index,mode,count,width){
 const {columns,scale}=displayLayout(mode,count,width),row=Math.floor(index/columns),col=index%columns;
 const offset=mode==='featured'?(columns-Math.min(columns,count-row*columns))/2:0;
 return {x:(col+offset)*NICHE.stride,y:-row*ROW_PITCH,scale,row,col};
}
export function shelfHeight(count,width){if(!count)return 300;const {columns,rows}=displayLayout('shelf',count,width);return rows*ROW_PITCH*width/(columns*NICHE.stride+.8)+35;}
export function displayPose(mode,count,width,height,{scroll=0,top=270}={}){
 if(mode==='wall')return galleryPose(0,count,width,height);
 const {columns,rows,scale}=displayLayout(mode,count,width);
 if(mode==='featured'&&rows===1)return galleryPose(0,count,Math.max(width,1051),height);
 const worldWidth=columns*NICHE.stride+.8,worldHeight=(rows-1)*ROW_PITCH+(NICHE.top-NICHE.bottom)*scale;
 const pixelsPerUnit=mode==='shelf'?width/worldWidth:Math.min(width/worldWidth,height*.59/worldHeight);
 const distance=height/(2*Math.tan(32*Math.PI/360)*pixelsPerUnit),x=(columns-1)*NICHE.stride/2;
 const y=mode==='shelf'?NICHE.top*scale+(top-scroll-height/2)/pixelsPerUnit:((NICHE.top+NICHE.bottom)*scale-(rows-1)*ROW_PITCH)/2-height*.055/pixelsPerUnit;
 return {position:[x,y,distance-.5],target:[x,y,-.5]};
}
export function displayDetailPose(index,mode,count,width){
 if(mode==='wall')return detailPose(index,width);
 const {x,y,scale}=displayCell(index,mode,count,width),pose=detailPose(0,width);
 return {position:[x+pose.position[0]*scale,y+pose.position[1]*scale,(pose.position[2]+.5)*scale-.5],target:[x+pose.target[0]*scale,y+pose.target[1]*scale,pose.target[2]]};
}

export const clampReveal=value=>Number.isFinite(value)?Math.max(0,Math.min(1,value)):0;
export const HOME_REVEAL_SCREENS=HERO_CONFIG.scrollScreens+HERO_CONFIG.revealScreens;
export const HOME_HOLD_SCREENS=HERO_CONFIG.holdScreens;
export const HOME_STORY_FRACTION=HERO_CONFIG.scrollScreens/HOME_REVEAL_SCREENS;
export const smoothRange=(start,end,value)=>{const t=clampReveal((value-start)/(end-start));return t*t*t*(10+t*(-15+6*t));};
export function homeRevealLayers(value){
 const progress=clampReveal(value),storyProgress=clampReveal(progress/HOME_STORY_FRACTION),wallProgress=clampReveal((progress-HOME_STORY_FRACTION)/(1-HOME_STORY_FRACTION));
 return {storyProgress,wallProgress,brandOpacity:1-smoothRange(0,HERO_CONFIG.camera.brandFadeEnd,wallProgress),collectionOpacity:smoothRange(HERO_CONFIG.camera.labelsStart,1,wallProgress),selectionReady:progress>=.999};
}
export function homeRevealPose(value,count,width,height){
 const progress=homeRevealLayers(value).wallProgress,end=displayPose('featured',count,width,height),t=smoothRange(0,HERO_CONFIG.camera.settleAt,progress);
 if(t===1)return end;
 const x=end.target[0],opening={position:[x,HERO_CONFIG.camera.height,HERO_CONFIG.camera.distance],target:[x,HERO_CONFIG.camera.height,HERO_CONFIG.camera.targetDepth]};
 return {position:opening.position.map((v,i)=>v+(end.position[i]-v)*t),target:opening.target.map((v,i)=>v+(end.target[i]-v)*t)};
}
