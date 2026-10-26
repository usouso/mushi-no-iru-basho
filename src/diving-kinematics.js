/** Independent female diving-beetle pose study. Display metres, NOT natural size.
 * Pure body-local leg coordinates; no surface foot planting or hidden timers.
 */
export const DIVING_DIMENSIONS=Object.freeze({bodyLength:.14,bodyWidth:.08,bodyHeight:.04,surfacePitch:.35,tailBreathingPoint:Object.freeze({x:0,y:.006,z:-.07}),deepRootY:-.11,footRadius:.12,maxDepth:.18});
const point=(x,y,z)=>({x,y,z});
export function sampleDivingPose(state={}){
 const phase=Number.isFinite(state.strokePhase)?state.strokePhase:0,angle=Math.sin(phase*Math.PI*2),legs=[];
 for(const side of [-1,1]){
  legs.push({id:`front-${side}`,role:'front',side,hip:point(side*.022,-.007,.035),knee:point(side*.034,-.017,.037),foot:point(side*.026,-.020,.053)});
  legs.push({id:`middle-${side}`,role:'middle',side,hip:point(side*.028,-.008,.007),knee:point(side*.044,-.019,-.003),foot:point(side*.035,-.022,.014)});
  // Fixed links rotate as oars, both sides mirror exactly. No inferred fluid forces.
  const sweep=.15+angle*.65,hip=point(side*.023,-.007,-.027),knee=point(side*.047,-.014,-.037);
  const foot=point(knee.x+side*.052*Math.cos(sweep),knee.y-.008,knee.z+.052*Math.sin(sweep));
  legs.push({id:`hind-${side}`,role:'hind',side,hip,knee,foot});
 }
 const p=state.position||point(0,0,0);
 return{body:{position:point(p.x,p.y,p.z),heading:state.heading||0,pitch:state.pitch||0},legs,strokePhase:phase,tailBreathingPoint:DIVING_DIMENSIONS.tailBreathingPoint};
}
