/** Original display geometry; proportions and warning motion are game choices,
 * not measured specimen dimensions or observed fighting behaviour. */
export const EUCHIRUS_DIMENSIONS=Object.freeze({bodyLength:.180,bodyWidth:.090,rootAboveSupport:.055,cycleDistance:.04,stanceFraction:.5,frontUpperLength:.160,frontLowerLength:.180,frontTarsusLength:.030,upperLegLength:.060,lowerLegLength:.055,warningLift:.020,warningReach:.010});
const finite=(x,d=0)=>Number.isFinite(x)?x:d,p=(x,y,z)=>({x,y,z}),smooth=x=>x*x*(3-2*x);
export function sampleEuchirusPose(state={}){
 const D=EUCHIRUS_DIMENSIONS,warning=Math.max(0,Math.min(1,finite(state.warningBlend))),legs=[];
 for(const side of[-1,1])for(let i=0;i<3;i++){
  let q=((finite(state.walkPhase)/(2*Math.PI)+(i%2===(side===1?0:1)?0:.5))%1+1)%1;if(q<1e-12||q>1-1e-12)q=0;else if(Math.abs(q-.5)<1e-12)q=.5;
  const gaitContact=q<=.5,travel=(gaitContact?.25-q:-.25+.5*smooth((q-.5)*2))*D.cycleDistance,lift=gaitContact?0:.008*Math.sin(Math.PI*(q-.5)*2)**2,front=i===0;
  const hip=p(side*(front?.030:.027),-.015,[.047,-.012,-.058][i]),foot=p(side*(front?.115:.095),-.055+lift+(front?warning*D.warningLift:0),[.280,0,-.090][i]+travel+(front?warning*D.warningReach:0));
  // Three fixed segments on the long foreleg, two on the shorter walking legs.
  const ankle=front?p(foot.x,foot.y+.012,foot.z-Math.sqrt(D.frontTarsusLength**2-.012**2)):foot;
  const upper=front?D.frontUpperLength:D.upperLegLength,lower=front?D.frontLowerLength:D.lowerLegLength,dx=ankle.x-hip.x,dy=ankle.y-hip.y,dz=ankle.z-hip.z,r=Math.hypot(dx,dy,dz),a=(upper*upper-lower*lower+r*r)/(2*r),h=Math.sqrt(Math.max(0,upper*upper-a*a)),n=Math.hypot(dx,dz),bend=front?-side:i===2?-side:side;
  const knee=p(hip.x+dx*a/r-bend*dz/n*h,hip.y+dy*a/r,hip.z+dz*a/r+bend*dx/n*h);
  legs.push({id:`${['front','middle','hind'][i]}-${side}`,role:['front','middle','hind'][i],side,hip,knee,ankle,tarsus:foot,foot,contact:gaitContact&&(!front||warning===0),upperLength:upper,lowerLength:lower,tarsusLength:front?D.frontTarsusLength:0});
 }
 const q=state.orientation||{},x=finite(q.x),y=finite(q.y),z=finite(q.z),w=finite(q.w,1),length=Math.hypot(x,y,z,w)||1;
 return{body:{position:p(finite(state.position?.x),finite(state.position?.y),finite(state.position?.z)),orientation:{x:x/length,y:y/length,z:z/length,w:(Math.hypot(x,y,z,w)?w:1)/length}},legs,warningBlend:warning};
}
