export const NICHE={stride:3.1,width:2.22,bottom:.64,top:5.55,back:-1.02,front:.12,bottleZ:-.48,bottleHeight:3.25};
export const visibleCount=width=>width<=700?3.35:width<=1050?3:5;
export const maxGalleryIndex=(count,width)=>Math.max(0,Math.ceil(count-visibleCount(width)));
export const clampIndex=(index,count,width)=>Math.max(0,Math.min(maxGalleryIndex(count,width),index));
export function galleryPose(index,count,width,height){
 const visible=visibleCount(width),aspect=width/height;
 const start=Math.min(clampIndex(index,count,width),Math.max(0,count-visible));
 const center=(start+(Math.min(visible,count)-1)/2)*NICHE.stride;
 const z=Math.max((NICHE.stride*visible-.25)/(2*Math.tan(32*Math.PI/360)*aspect),8.6/(2*Math.tan(32*Math.PI/360)));
 return {position:[center,3.1,z],target:[center,2.1,-.5]};
}
export function detailPose(index,width){const x=index*NICHE.stride;return width<=700?{position:[x,1.0,14.5],target:[x,.87,-.55]}:{position:[x-1.23,2.9,6.4],target:[x-1.23,2.65,-.65]};}
export function cameraEase(x){
 // The reference's cubic-bezier(.62,0,.22,1), solved by bisection.
 let low=0,high=1,t=x;
 for(let i=0;i<14;i++){const bx=3*(1-t)*(1-t)*t*.62+3*(1-t)*t*t*.22+t*t*t;if(bx<x)low=t;else high=t;t=(low+high)/2;}
 return 3*(1-t)*t*t+t*t*t;
}
