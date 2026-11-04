// One editable source of truth for the hero. x/base/height are viewport fractions.
export const HERO_CONFIG={
 scrollScreens:3,
 revealScreens:1,
 holdScreens:.4,
 entrance:{holdSeconds:.6,openSeconds:1.5,scrollEnd:.04,slogan:'A fragrance of your own.'},
 branding:{src:'/assets/brand/nura-logo-bottle.svg?v=1',aspect:640/340,perfume:{left:.18,top:.51,width:.64},oil:{left:.16,top:.55,width:.68}},
 camera:{height:8.5,distance:4.1,targetDepth:.14,settleAt:.9,brandFadeEnd:.3,labelsStart:.85},
 copyWindows:[[0,0,.025,.12],[.21,.25,.42,.46],[.46,.50,.67,.71],[.71,.75,1,1]],
 rotation:[[0,0],[.10,-.12],[.25,-.47],[.5,0],[.75,.38],[1,.16]],
 desktop:{
  perfume:[[0,.65,.85,.66],[.10,.65,.85,.67],[.25,.19,.85,.69],[.5,.18,.85,.70],[.75,.18,.85,.74],[1,.19,.85,.69]],
  oil:[[0,.85,.85,.46],[.25,.88,.85,.48],[.5,.88,.85,.46],[.75,.88,.85,.44],[1,.87,.85,.46]]
 },
 tablet:{
  perfume:[[0,.65,.9,.54],[.10,.65,.9,.55],[.25,.19,.9,.56],[.5,.18,.9,.58],[.75,.18,.9,.60],[1,.19,.9,.56]],
  oil:[[0,.86,.9,.38],[.25,.88,.9,.39],[.5,.88,.9,.38],[.75,.88,.9,.35],[1,.87,.9,.36]]
 },
 compact:{
  perfume:[[0,.43,.90,.40],[.10,.43,.90,.41],[.25,.32,.90,.42],[.5,.31,.90,.43],[.75,.30,.90,.44],[1,.32,.90,.41]],
  oil:[[0,.77,.90,.29],[.25,.79,.90,.30],[.5,.80,.90,.29],[.75,.79,.90,.28],[1,.78,.90,.29]]
 },
 phases:[
  {eyebrow:'NURA — THE ART OF FRAGRANCE',title:['A SIGNATURE','OF HERITAGE'],subtitle:'Fine Fragrances & Perfume Oils',description:'Timeless compositions crafted with rare ingredients, inspired by a rich olfactory heritage.',cta:'Explore the collection',action:'featured'},
  {eyebrow:'01 / THE CRAFT',title:['CRAFTED','WITH INTENTION'],description:'Every detail considered. Every composition shaped to leave a lasting impression.'},
  {eyebrow:'02 / TWO EXPRESSIONS',title:['ONE IDENTITY.','TWO EXPRESSIONS.'],description:'From refined eau de parfum to concentrated perfume oils, discover a signature that is distinctly yours.'},
  {eyebrow:'03 / THE COLLECTION',title:['THE','FRAGRANCES'],description:'Signature scents for discerning connoisseurs.',cta:'Explore fragrances',action:'shelf'}
 ]
};
const clamp=x=>Math.max(0,Math.min(1,Number.isFinite(x)?x:0));
const smooth=x=>{const t=clamp(x);return t*t*t*(10+t*(-15+6*t));};
const range=(a,b,x)=>smooth((x-a)/(b-a));
export function heroEntranceProgress(elapsed,scrollProgress,previous=0,enabled=true){
 if(!enabled)return 1;
 const {holdSeconds,openSeconds,scrollEnd}=HERO_CONFIG.entrance;
 return Math.max(clamp(previous),range(holdSeconds,holdSeconds+openSeconds,Number.isFinite(elapsed)?elapsed:0),range(0,scrollEnd,clamp(scrollProgress)));
}
export function heroEntranceLayers(value){
 const progress=clamp(value);
 return {brandOpacity:1-range(.08,.58,progress),sceneOpacity:range(.42,1,progress),scale:1+progress*.045,y:-progress*18};
}
function interpolate(keys,p){
 for(let i=0;i<keys.length-1;i++)if(p<=keys[i+1][0]){
  const a=keys[i],b=keys[i+1],t=range(a[0],b[0],p);
  return {x:a[1]+(b[1]-a[1])*t,base:a[2]+(b[2]-a[2])*t,height:a[3]+(b[3]-a[3])*t};
 }
 const a=keys.at(-1);return {x:a[1],base:a[2],height:a[3]};
}
export function heroStoryState(value,width=1440,height=900){
 const p=clamp(value),layout=width>1050?HERO_CONFIG.desktop:width>700&&width/height>=1.1?HERO_CONFIG.tablet:HERO_CONFIG.compact;
 const copy=HERO_CONFIG.copyWindows.map(([a,b,c,d],i)=>{
  const entering=i===0?1:range(a,b,p),exiting=i===3?0:range(c,d,p);
  return {opacity:entering*(1-exiting),y:16*(1-entering)-12*exiting};
 });
 let yaw=HERO_CONFIG.rotation.at(-1)[1];
 for(let i=0;i<HERO_CONFIG.rotation.length-1;i++){const a=HERO_CONFIG.rotation[i],b=HERO_CONFIG.rotation[i+1];if(p<=b[0]){yaw=a[1]+(b[1]-a[1])*range(a[0],b[0],p);break;}}
 return {progress:p,chapter:Math.min(3,Math.floor(p*4)),perfume:{...interpolate(layout.perfume,p),yaw},oil:interpolate(layout.oil,p),copy,guideOpacity:1-range(.02,.15,p)};
}
