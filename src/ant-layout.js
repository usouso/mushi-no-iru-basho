/* A single narrow, one-way foraging circuit; display metres, not natural size. */
export const ANT_ROUTE=Object.freeze([[.995,10.75],[1.10,10.75],[1.10,8.44],[.995,8.44],[.89,8.44],[.89,10.75],[.995,10.75]].map(([x,z])=>Object.freeze({x,z})));
export const ANT_START_DISTANCES=Object.freeze([.63,1.89,3.15,4.41]);
// Individual roles stay fixed; this small loop does not simulate leaf handoff.
export const ANT_CARRYING_LEAF=Object.freeze([true,true,false,false]);
export const ANT_SHELTER_CENTRES=Object.freeze([Object.freeze({x:.995,z:10.75}),Object.freeze({x:.995,z:8.44})]);
export const ANT_PATH_LENGTH=5.04;
export const ANT_FOOT_RADIUS=.07;
export function sampleAntPath(distance){
  let s=Math.max(0,Math.min(ANT_PATH_LENGTH,distance));
  for(let i=1;i<ANT_ROUTE.length;i++){const a=ANT_ROUTE[i-1],b=ANT_ROUTE[i],length=Math.hypot(b.x-a.x,b.z-a.z);if(s<=length||i===ANT_ROUTE.length-1){const t=Math.min(1,s/length);return{x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t,heading:Math.atan2(b.x-a.x,b.z-a.z)};}s-=length;}
}
