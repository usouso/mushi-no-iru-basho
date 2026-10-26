/** Original display rig; stride/segment dimensions are game tuning, not measured anatomy. */
export const STAG_DIMENSIONS=Object.freeze({bodyLength:.18,totalLength:.30,rootAboveSupport:.045,cycleDistance:.04,stanceFraction:.5,upperLegLength:.052,lowerLegLength:.047,restJawOpen:.25});
const f=(v,d=0)=>Number.isFinite(v)?v:d,pt=(x,y,z)=>({x,y,z}),smooth=t=>t*t*(3-2*t);
export function sampleStagPose(state={}){
 const legs=[];
 for(const side of[-1,1])for(let i=0;i<3;i++){
  let q=((f(state.walkPhase)/(2*Math.PI)+(i%2===(side===1?0:1)?0:.5))%1+1)%1;if(q<1e-12||q>1-1e-12)q=0;else if(Math.abs(q-.5)<1e-12)q=.5;const contact=q<=.5;
  const travel=contact?.25-q:-.25+.5*smooth((q-.5)*2),lift=contact?0:.009*Math.sin(Math.PI*(q-.5)*2)**2;
  const hip=pt(side*.028,-.012,[.042,-.004,-.044][i]),foot=pt(side*.085,-.045+lift,[.065,0,-.070][i]+.04*travel);
  const dx=foot.x-hip.x,dy=foot.y-hip.y,dz=foot.z-hip.z,r=Math.hypot(dx,dy,dz),a=(.052**2-.047**2+r*r)/(2*r),h=Math.sqrt(Math.max(0,.052**2-a*a)),n=Math.hypot(dx,dz),bend=i===2?-side:side;
  const knee=pt(hip.x+dx*a/r-bend*dz/n*h,hip.y+dy*a/r,hip.z+dz*a/r+bend*dx/n*h);
  legs.push({id:`${['front','middle','hind'][i]}-${side}`,role:['front','middle','hind'][i],side,hip,knee,foot,contact});
 }
 return{body:{position:pt(f(state.position?.x),f(state.position?.y),f(state.position?.z)),heading:f(state.heading),pitch:0},legs,jaws:[-1,1].map(side=>({side,angle:side*.2*(Math.max(0,Math.min(1,f(state.jawOpen,.25)))-.25)}))};
}
