import {NICHE,galleryPose,detailPose} from './scene-layout.mjs';
import {HERO_CONFIG,clampReveal,smoothRange} from './hero-story.mjs';
export {clampReveal,homeRevealLayers} from './hero-story.mjs';

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

export const HOME_REVEAL_SCREENS=HERO_CONFIG.scrollScreens;
export const HOME_HOLD_SCREENS=HERO_CONFIG.holdScreens;
const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
const mixCamera=(a,b,t)=>({position:mix(a.position,b.position,t),target:mix(a.target,b.target,t)});
const frustum=2*Math.tan(32*Math.PI/360);

export function homeStoryState(value,count,width,height){
 const progress=clampReveal(value), aspect=Math.max(.2,width/Math.max(1,height));
 const compact=width<=760||aspect<1.1;
 const end=displayPose('featured',count,width,height);
 const bottleZ=.86, baseY=6.45;
 const openingHeight=NICHE.bottleHeight/(compact?.40:.55);
 const openingDistance=openingHeight/frustum;
 const x=end.target[0]+(compact?.095:.22)*openingHeight*aspect;
 const openingBottlePosition=[x,baseY,bottleZ];
 const environmentHeight=(openingDistance+bottleZ-.22)*frustum;
 const environment={height:environmentHeight,width:Math.max(16/9,aspect*1.13)*environmentHeight};
 const {foot,lip,ledgeRise}=HERO_CONFIG.mountain;
 const source=[x-.035,baseY+environmentHeight*(lip-foot+ledgeRise),.24];
 const shot=(viewHeight,y,bottleScreenX)=>{
  const cx=x-(bottleScreenX-.5)*viewHeight*aspect;
  return {position:[cx,y,viewHeight/frustum+bottleZ],target:[cx,y,0]};
 };
 const opening=shot(openingHeight,baseY+openingHeight*(compact?.385:.33),compact?.595:.72);
 const macro=shot(openingHeight*(compact?.62:.48),baseY+2.91,compact?.54:.70);
 const pourHeight=openingHeight*(compact?1.10:.88);
 const pour=shot(pourHeight,baseY+pourHeight*(compact?.37:.39),compact?.585:.71);
 const cell=displayCell(0,'featured',count,width);
 const dock=[cell.x,cell.y+.75*cell.scale,NICHE.bottleZ];
 const move=smoothRange(.805,.925,progress), inset=smoothRange(.925,.995,progress);
 const clearance=[dock[0],dock[1],1.15];
 const position=inset===1?dock:progress>=.925?mix(clearance,dock,inset):mix(openingBottlePosition,clearance,move);
 if(move>0&&move<1)position[2]+=.64*Math.sin(move*Math.PI);
 const twist=smoothRange(.13,.255,progress),release=smoothRange(.245,.33,progress);
 const align=smoothRange(.68,.738,progress),close=smoothRange(.738,.795,progress);
 const stow=smoothRange(.315,.425,progress)*(1-smoothRange(.665,.726,progress));
 const free=release*(1-align),thread=twist*(1-close);
 let camera=opening;
 if(progress>=.925)camera=end;
 else if(progress>=.805)camera=mixCamera(opening,end,move);
 else if(progress>=.72)camera=mixCamera(pour,opening,smoothRange(.72,.805,progress));
 else if(progress>=.345)camera=mixCamera(macro,pour,smoothRange(.345,.455,progress));
 else camera=mixCamera(opening,macro,smoothRange(.055,.205,progress));
 return {
  camera, environment, openingBottlePosition, source,
  bottle:{position,rotation:[0,0,0],scale:1+(cell.scale-1)*move},
  cap:{offset:[(compact?.33:.63)*free+(compact?1.97:.45)*stow,.24*thread+.57*free+(compact?3.6:1.95)*stow,0-(compact?.26:.12)*free],rotation:[.15*free,Math.PI*3*thread+.57*free,0-.23*free]},
  capTrail:Math.max(smoothRange(.135,.17,progress)*(1-smoothRange(.265,.325,progress)),smoothRange(.718,.75,progress)*(1-smoothRange(.781,.81,progress))),
  trailPhase:progress<.5?twist:thread,
  fill:smoothRange(.49,.689,progress),
  stream:smoothRange(.397,.444,progress)*(1-smoothRange(.662,.703,progress)),
  streamReach:smoothRange(.405,.489,progress),streamDrain:smoothRange(.651,.701,progress),
  runoff:smoothRange(.34,.423,progress),runoffOpacity:1-smoothRange(.642,.688,progress),
  storyOpacity:1-smoothRange(.805,.931,progress),
  storyLight:1-smoothRange(.82,.996,progress),
  shelfArtwork:smoothRange(.979,.998,progress)
 };
}
export const homeRevealPose=(value,count,width,height)=>homeStoryState(value,count,width,height).camera;
