/** Display metres and signed-distance gait; not measurements of a wild beetle.
 * Local +Z forward, +Y away from support. Rotation order YXZ is authoritative. */
export const XYLOTRUPES_DIMENSIONS=Object.freeze({bodyLength:.20,bodyRearZ:-.105,headFrontZ:.095,totalLength:.283245,hornTipZ:.166,hornFrontZ:.178245,bodyWidth:.105,rootAboveSupport:.055,cycleDistance:.04,stanceFraction:.5,upperLegLength:.064,lowerLegLength:.060,swingLift:.008,sex:'male',displayScaleOnly:true});
const finite=(x,d=0)=>Number.isFinite(x)?x:d,point=(x,y,z)=>({x,y,z}),smooth=x=>x*x*(3-2*x);
export function sampleXylotrupesPose(state={}){
 const D=XYLOTRUPES_DIMENSIONS,legs=[];
 for(const side of[-1,1])for(let i=0;i<3;i++){
  let q=((finite(state.walkPhase)/(2*Math.PI)+(i%2===(side===1?0:1)?0:.5))%1+1)%1;
  if(q<1e-12||q>1-1e-12)q=0;else if(Math.abs(q-.5)<1e-12)q=.5;
  const contact=q<=.5,travel=contact?.25-q:-.25+.5*smooth((q-.5)*2),lift=contact?0:D.swingLift*Math.sin(Math.PI*(q-.5)*2)**2;
  const hip=point(side*[.027,.031,.024][i],-.015,[.043,.006,-.016][i]),foot=point(side*.100,-D.rootAboveSupport+lift,[.090,0,-.090][i]+D.cycleDistance*travel);
  const dx=foot.x-hip.x,dy=foot.y-hip.y,dz=foot.z-hip.z,r=Math.hypot(dx,dy,dz),a=(D.upperLegLength**2-D.lowerLegLength**2+r*r)/(2*r),h=Math.sqrt(Math.max(0,D.upperLegLength**2-a*a)),n=Math.hypot(dx,dz),bend=i===2?-side:side;
  const knee=point(hip.x+dx*a/r-bend*dz/n*h,hip.y+dy*a/r,hip.z+dz*a/r+bend*dx/n*h);
  legs.push({id:`${['front','middle','hind'][i]}-${side}`,role:['front','middle','hind'][i],side,hip,knee,foot,contact});
 }
 return{body:{position:point(finite(state.position?.x),finite(state.position?.y,D.rootAboveSupport),finite(state.position?.z)),orientation:state.orientation?{...state.orientation}:null,heading:finite(state.heading),pitch:finite(state.pitch),roll:finite(state.roll),rotationOrder:'YXZ'},legs,headLift:Math.max(0,Math.min(1,finite(state.headLift,finite(state.warningBlend))))};
}
