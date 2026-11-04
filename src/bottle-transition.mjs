export const FORMAT_TRANSITION_MS=560;
const smooth=t=>t*t*(3-2*t);
// Keep the bottle grounded; dissolve continuously with a restrained depth settle.
export function bottleTransitionPose(value){
 const p=Math.max(0,Math.min(1,Number.isFinite(value)?value:0));
 return {blend:smooth(p),depth:.035*Math.sin(Math.PI*p),complete:p===1};
}
