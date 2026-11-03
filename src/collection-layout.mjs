import {NICHE,galleryPose,detailPose} from './scene-layout.mjs';

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
export const HOME_REVEAL_SCREENS=2.2;
export const HOME_HOLD_SCREENS=.4;
export const smoothRange=(start,end,value)=>{const t=clampReveal((value-start)/(end-start));return t*t*t*(10+t*(-15+6*t));};
const mix=(a,b,t)=>t===1?[...b]:t===0?[...a]:a.map((value,i)=>value+(b[i]-value)*t);

export function homeRevealLayers(value){
 const progress=clampReveal(value);
 const chapter=progress<.15?0:progress<.30?1:progress<.55?2:progress<.70?3:progress<.80?4:5;
 const bounds=[[0,.15],[.15,.30],[.30,.55],[.55,.70],[.70,.80]][chapter];
 const chapterOpacity=chapter>0&&bounds?smoothRange(bounds[0],bounds[0]+.02,progress)*(1-smoothRange(bounds[1]-.02,bounds[1],progress)):0;
 return {brandOpacity:1-smoothRange(.12,.15,progress),collectionOpacity:smoothRange(.97,1,progress),selectionReady:progress>=.999,chapter,chapterOpacity};
}

// Every phase uses the same actor dimensions and opening camera. The only scale
// change is the physical journey into the responsive collection's existing slot.
export function homeStoryState(value,count,width,height,heroIndex=0){
 const progress=clampReveal(value),w=Number.isFinite(width)&&width>0?width:1440,h=Number.isFinite(height)&&height>0?height:900;
 const n=Number.isFinite(count)?Math.max(1,Math.floor(count)):1,index=Math.max(0,Math.min(n-1,Math.floor(heroIndex)||0));
 const end=displayPose('featured',n,w,h),mobile=w<=700,viewHeight=NICHE.bottleHeight/(mobile?.38:.56),view={width:viewHeight*w/h,height:viewHeight};
 const centerX=end.target[0],centerY=8.5,bottleZ=1.1;
 const openingBottlePosition=[centerX+.04*view.width,centerY-((mobile?.88:.84)-.5)*view.height,bottleZ];
 const opening={position:[centerX,centerY,bottleZ+view.height/(2*Math.tan(32*Math.PI/360))],target:[centerX,centerY,0]};
 const cell=displayCell(index,'featured',n,w),dock=[cell.x,cell.y+.75*cell.scale,NICHE.bottleZ];
 const travel=smoothRange(.80,.92,progress),depth=smoothRange(.92,.97,progress);
 const camera=progress>=.92?end:{position:mix(opening.position,end.position,travel),target:mix(opening.target,end.target,travel)};
 const bottlePosition=progress>=.97?dock:progress>=.92?[dock[0],dock[1],bottleZ+(dock[2]-bottleZ)*depth]:mix(openingBottlePosition,[dock[0],dock[1],bottleZ],travel);
 const lift=smoothRange(.15,.20,progress),aside=smoothRange(.20,.27,progress),align=smoothRange(.70,.74,progress),close=smoothRange(.74,.78,progress);
 const cap={offset:[.95*aside*(1-align),.65*lift*(1-close),0],rotation:[0,0,0]};
 const source=[openingBottlePosition[0],openingBottlePosition[1]+4.1,bottleZ+.015],mouth=[openingBottlePosition[0],openingBottlePosition[1]+2.26,bottleZ+.015];
 const streamReach=smoothRange(.30,.325,progress),streamDrain=smoothRange(.57,.61,progress);
 const stream=progress>=.30&&progress<.61?1:0;
 const hanging=smoothRange(.20,.30,progress),fall=smoothRange(.61,.65,progress);
 const dropVisible=progress>.20&&progress<.30||progress>=.61&&progress<.65;
 const drop={visible:dropVisible,position:progress<.30?[source[0],source[1]-.12*hanging,source[2]]:mix(source,mouth,fall),scale:progress<.30?hanging:1-fall*.15};
 const handoff=progress>=.97;
 return {
  progress,camera,view,openingBottlePosition,source,mouth,
  bottle:{position:bottlePosition,scale:progress>=.92?cell.scale:1+(cell.scale-1)*travel,rotation:[0,0,0]},cap,
  fill:.12+.88*smoothRange(.325,.55,progress),stream,streamReach,streamDrain,drop,
  ripple:smoothRange(.64,.65,progress)*(1-smoothRange(.65,.70,progress)),
  environmentOpacity:1-smoothRange(.80,.94,progress),storyOpacity:1-smoothRange(.80,.94,progress),
  actorVisible:!handoff,shelfVisible:handoff,handoff,
  ...homeRevealLayers(progress)
 };
}
export const homeRevealPose=(value,count,width,height)=>homeStoryState(value,count,width,height).camera;
