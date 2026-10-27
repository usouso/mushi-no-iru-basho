/** Original adult-female display pose. Dimensions/timing are game design, not wild measurements.
 * Four walking legs: one swing at a time, signed distance = phase/TAU * cycleDistance.
 * All four supports meet the plane at every integer PI/2. No grounded body turning. */
export const ORCHID_MANTIS_DIMENSIONS=Object.freeze({bodyLength:.220,closedWingTotalLength:.238,rootAboveSupport:.060,cycleDistance:.040,stanceFraction:.75,upperLegLength:.065,lowerLegLength:.065,footHalfWidth:.080,footFrontZ:.030,footRearZ:-.080,swingHeight:.010});
const f=(x,d=0)=>Number.isFinite(x)?x:d,P=(x,y,z)=>({x,y,z}),smooth=t=>t*t*(3-2*t);
export function sampleOrchidMantisPose(state={}){
 const D=ORCHID_MANTIS_DIMENSIONS,legs=[],forePose=Math.max(0,Math.min(1,f(state.forePose)));
 for(const side of[-1,1]){
  const hip=P(side*.004,-.002,.065),a=.037/Math.hypot(.75,.60,.28),b=.030/Math.hypot(.25,.65,.72),knee=P(hip.x+side*.75*a,hip.y-.60*a,hip.z+.28*a),foot=P(knee.x-side*.25*b,knee.y+.65*b,knee.z+.72*b);
  const angle=-.14*forePose,c=Math.cos(angle),s=Math.sin(angle);for(const p of[knee,foot]){const y=p.y-hip.y,z=p.z-hip.z;p.y=hip.y+c*y-s*z;p.z=hip.z+s*y+c*z;}
  legs.push({id:`fore-${side}`,role:'raptorial',side,hip,knee,foot,contact:false,upperLength:.037,lowerLength:.030});
 }
 const order=[[-1,'middle'],[1,'hind'],[1,'middle'],[-1,'hind']];
 for(let i=0;i<4;i++){
  const[side,role]=order[i];let q=((f(state.walkPhase)/(2*Math.PI)+i/4)%1+1)%1;
  for(const boundary of[0,.25,.5,.75,1])if(Math.abs(q-boundary)<1e-11)q=boundary===1?0:boundary;
  const contact=q<=.75,t=(q-.75)/.25,travel=.375-q+(contact?0:smooth(t)),lift=contact?0:D.swingHeight*Math.sin(Math.PI*t)**2;
  const hip=P(side*.014,-.008,role==='middle'?.003:-.014),foot=P(side*.080,-D.rootAboveSupport+lift,(role==='middle'?D.footFrontZ:D.footRearZ)+D.cycleDistance*travel);
  const dx=foot.x-hip.x,dy=foot.y-hip.y,dz=foot.z-hip.z,r=Math.hypot(dx,dy,dz),a=r/2,h=Math.sqrt(Math.max(0,D.upperLegLength**2-a*a)),n=Math.hypot(dx,dz),bend=role==='middle'?side:-side;
  const knee=P(hip.x+dx*.5-bend*dz/n*h,hip.y+dy*.5,hip.z+dz*.5+bend*dx/n*h);
  legs.push({id:`${role}-${side}`,role,side,hip,knee,foot,contact,upperLength:D.upperLegLength,lowerLength:D.lowerLegLength});
 }
 const q=state.orientation||{},x=f(q.x),y=f(q.y),z=f(q.z),w=f(q.w,1),n=Math.hypot(x,y,z,w)||1;
 return{body:{position:P(f(state.position?.x),f(state.position?.y),f(state.position?.z)),orientation:{x:x/n,y:y/n,z:z/n,w:Math.hypot(x,y,z,w)?w/n:1}},forePose,legs};
}
