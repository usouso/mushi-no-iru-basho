/** Game display dimensions and signed-distance gait, not measured natural ratios. */
export const GIANT_STAG_DIMENSIONS=Object.freeze({bodyLength:.185,totalLength:.290,bodyWidth:.100,rootAboveSupport:.045,cycleDistance:.04,stanceFraction:.5,upperLegLength:.052,lowerLegLength:.047,restJawOpen:.25,maxJawAngle:.22});
const finite=(x,d=0)=>Number.isFinite(x)?x:d,point=(x,y,z)=>({x,y,z}),smooth=x=>x*x*(3-2*x);
export function sampleGiantStagPose(state={}){
 const legs=[],D=GIANT_STAG_DIMENSIONS;
 for(const side of[-1,1])for(let i=0;i<3;i++){
  let q=((finite(state.walkPhase)/(2*Math.PI)+(i%2===(side===1?0:1)?0:.5))%1+1)%1;
  if(q<1e-12||q>1-1e-12)q=0;else if(Math.abs(q-.5)<1e-12)q=.5;
  const contact=q<=.5,travel=contact?.25-q:-.25+.5*smooth((q-.5)*2),lift=contact?0:.008*Math.sin(Math.PI*(q-.5)*2)**2;
  const hip=point(side*.030,-.013,[.043,-.005,-.050][i]),foot=point(side*.085,-D.rootAboveSupport+lift,[.065,0,-.070][i]+D.cycleDistance*travel);
  const dx=foot.x-hip.x,dy=foot.y-hip.y,dz=foot.z-hip.z,r=Math.hypot(dx,dy,dz),a=(D.upperLegLength**2-D.lowerLegLength**2+r*r)/(2*r),h=Math.sqrt(Math.max(0,D.upperLegLength**2-a*a)),n=Math.hypot(dx,dz),bend=i===2?-side:side;
  const knee=point(hip.x+dx*a/r-bend*dz/n*h,hip.y+dy*a/r,hip.z+dz*a/r+bend*dx/n*h);
  legs.push({id:`${['front','middle','hind'][i]}-${side}`,role:['front','middle','hind'][i],side,hip,knee,foot,contact});
 }
 const jawOpen=Math.max(0,Math.min(1,finite(state.jawOpen,D.restJawOpen)));
 return{body:{position:point(finite(state.position?.x),finite(state.position?.y),finite(state.position?.z)),heading:finite(state.heading),pitch:0},legs,jawOpen,jaws:[-1,1].map(side=>({side,angle:side*D.maxJawAngle*(jawOpen-D.restJawOpen)}))};
}
