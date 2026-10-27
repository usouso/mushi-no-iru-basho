/** Game display dimensions and signed-distance gait, not measured natural ratios. */
export const EUROPE_STAG_DIMENSIONS=Object.freeze({bodyLength:.190,totalLength:.320,bodyWidth:.110,rootAboveSupport:.055,cycleDistance:.04,stanceFraction:.5,upperLegLength:.064,lowerLegLength:.060,restJawOpen:.25,maxJawAngle:.18});
const finite=(x,d=0)=>Number.isFinite(x)?x:d,point=(x,y,z)=>({x,y,z}),smooth=x=>x*x*(3-2*x);
export function sampleEuropeStagPose(state={}){
 const legs=[],D=EUROPE_STAG_DIMENSIONS;
 for(const side of[-1,1])for(let i=0;i<3;i++){
  let q=((finite(state.walkPhase)/(2*Math.PI)+(i%2===(side===1?0:1)?0:.5))%1+1)%1;
  if(q<1e-12||q>1-1e-12)q=0;else if(Math.abs(q-.5)<1e-12)q=.5;
  const contact=q<=.5,travel=contact?.25-q:-.25+.5*smooth((q-.5)*2),lift=contact?0:.008*Math.sin(Math.PI*(q-.5)*2)**2;
  const hip=point(side*.027,-.014,[.038,-.018,-.065][i]),foot=point(side*.095,-D.rootAboveSupport+lift,[.085,0,-.090][i]+D.cycleDistance*travel);
  const dx=foot.x-hip.x,dy=foot.y-hip.y,dz=foot.z-hip.z,r=Math.hypot(dx,dy,dz),a=(D.upperLegLength**2-D.lowerLegLength**2+r*r)/(2*r),h=Math.sqrt(Math.max(0,D.upperLegLength**2-a*a)),n=Math.hypot(dx,dz),bend=i===2?-side:side;
  const knee=point(hip.x+dx*a/r-bend*dz/n*h,hip.y+dy*a/r,hip.z+dz*a/r+bend*dx/n*h);
  legs.push({id:`${['front','middle','hind'][i]}-${side}`,role:['front','middle','hind'][i],side,hip,knee,foot,contact});
 }
 const jawOpen=Math.max(0,Math.min(1,finite(state.jawOpen,D.restJawOpen)));
 const q=state.orientation||{},x=finite(q.x),y=finite(q.y),z=finite(q.z),w=finite(q.w,1),length=Math.hypot(x,y,z,w)||1;
 return{body:{position:point(finite(state.position?.x),finite(state.position?.y),finite(state.position?.z)),orientation:{x:x/length,y:y/length,z:z/length,w:(Math.hypot(x,y,z,w)?w:1)/length}},legs,jawOpen,jaws:[-1,1].map(side=>({side,angle:side*D.maxJawAngle*(jawOpen-D.restJawOpen)}))};
}
