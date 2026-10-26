/** Original readable male display rig. Dimensions and gait are game tuning,
 * not natural measurements. +Z forward; root +.055 places stance feet on Y=0. */
export const ATLAS_DIMENSIONS=Object.freeze({bodyLength:.20,bodyRearZ:-.10,headFrontZ:.10,hornTipZ:.28,displayLength:.38,bodyWidth:.112,rootAboveSupport:.055,cycleDistance:.04,swingLift:.009,upperLegLength:.068,lowerLegLength:.064,sex:'male',displayScaleOnly:true});
const finite=(value,fallback=0)=>Number.isFinite(value)?value:fallback,point=(x,y,z)=>({x,y,z}),smooth=t=>t*t*(3-2*t);
export function sampleAtlasPose(state={}){
 const legs=[],D=ATLAS_DIMENSIONS;
 for(const side of[-1,1])for(let i=0;i<3;i++){
  const offset=i%2===(side===1?0:1)?0:.5;
  let q=((finite(state.walkPhase)/(2*Math.PI)+offset)%1+1)%1;if(q<1e-12||q>1-1e-12)q=0;else if(Math.abs(q-.5)<1e-12)q=.5;
  const contact=q<=.5,travel=(contact?.25-q:-.25+.5*smooth((q-.5)*2))*D.cycleDistance,lift=contact?0:D.swingLift*Math.sin(Math.PI*(q-.5)*2)**2;
  const hip=point(side*[.036,.040,.037][i],-.010,[.045,-.007,-.055][i]);
  const foot=point(side*.106,-D.rootAboveSupport+lift,[.079,-.004,-.092][i]+travel);
  const dx=foot.x-hip.x,dy=foot.y-hip.y,dz=foot.z-hip.z,r=Math.hypot(dx,dy,dz),a=(D.upperLegLength**2-D.lowerLegLength**2+r*r)/(2*r),h=Math.sqrt(Math.max(0,D.upperLegLength**2-a*a)),n=Math.hypot(dx,dz),bend=i===2?-side:side;
  const knee=point(hip.x+dx*a/r-bend*dz/n*h,hip.y+dy*a/r,hip.z+dz*a/r+bend*dx/n*h);
  legs.push({id:`${['front','middle','hind'][i]}-${side}`,role:['front','middle','hind'][i],side,hip,knee,foot,contact});
 }
 return{body:{position:point(finite(state.position?.x),finite(state.position?.y,ATLAS_DIMENSIONS.rootAboveSupport),finite(state.position?.z)),heading:finite(state.heading)},legs,headLift:Math.max(0,Math.min(1,finite(state.headLift,finite(state.warningBlend))))};
}
