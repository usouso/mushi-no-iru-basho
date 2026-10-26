/** Original display rig; stride/segment dimensions are game tuning, not measured anatomy. */
export const JEWEL_DIMENSIONS=Object.freeze({bodyLength:.16,bodyWidth:.05,rootAboveSupport:.030,cycleDistance:.030,stanceFraction:.5,upperLegLength:.035,lowerLegLength:.034});
const f=(v,d=0)=>Number.isFinite(v)?v:d,pt=(x,y,z)=>({x,y,z}),smooth=t=>t*t*(3-2*t);
export function sampleJewelPose(state={}){
 const legs=[];
 for(const side of[-1,1])for(let i=0;i<3;i++){
  let q=((f(state.walkPhase)/(2*Math.PI)+(i%2===(side===1?0:1)?0:.5))%1+1)%1;if(q<1e-12||q>1-1e-12)q=0;else if(Math.abs(q-.5)<1e-12)q=.5;const contact=q<=.5;
  const travel=contact?.25-q:-.25+.5*smooth((q-.5)*2),lift=contact?0:.006*Math.sin(Math.PI*(q-.5)*2)**2;
  const hip=pt(side*.012,-.010,[.045,.006,-.040][i]),foot=pt(side*.044,-.030+lift,[.045,0,-.050][i]+.030*travel);
  const dx=foot.x-hip.x,dy=foot.y-hip.y,dz=foot.z-hip.z,r=Math.hypot(dx,dy,dz),a=(.035**2-.034**2+r*r)/(2*r),h=Math.sqrt(Math.max(0,.035**2-a*a)),n=Math.hypot(dx,dz),bend=i===2?-side:side;
  const knee=pt(hip.x+dx*a/r-bend*dz/n*h,hip.y+dy*a/r,hip.z+dz*a/r+bend*dx/n*h);
  legs.push({id:`${['front','middle','hind'][i]}-${side}`,role:['front','middle','hind'][i],side,hip,knee,foot,contact});
 }
 return{body:{position:pt(f(state.position?.x),f(state.position?.y),f(state.position?.z)),heading:f(state.heading),pitch:0},legs};
}
