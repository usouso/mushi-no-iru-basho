/** Original display-space pose, not measured anatomy or fluid dynamics.
 * +Z head / -Z tail. World pitch belongs to the study and is applied once.
 */
const point=(x,y,z)=>({x,y,z}),freezePoint=(x,y,z)=>Object.freeze(point(x,y,z));
const contacts=Object.freeze([-1,1].flatMap(side=>[
 Object.freeze({id:`middle-${side}`,position:freezePoint(side*.006,-.038,.012)}),
 Object.freeze({id:`hind-${side}`,position:freezePoint(side*.006,-.038,-.062)})
]));
export const GIANT_WATERBUG_DIMENSIONS=Object.freeze({
 bodyLength:.24,bodyWidth:.11,bodyHeight:.04,
 supportAxis:Object.freeze({origin:freezePoint(0,-.038,0),direction:freezePoint(0,0,1)}),supportRadius:.006,supportContacts:contacts,
 tailBreathingPoint:freezePoint(0,.002,-.145),breathingTips:Object.freeze([-1,1].map(side=>freezePoint(side*.003,.002,-.145))),
 middleBones:Object.freeze([.05,.048]),hindBones:Object.freeze([.058,.06]),foreBones:Object.freeze([.052,.025,.025,.012])
});
const finite=(v,f=0)=>Number.isFinite(v)?v:f,clamp=v=>Math.max(0,Math.min(1,v));
const add=(a,b)=>point(a.x+b.x,a.y+b.y,a.z+b.z),scale=(a,s)=>point(a.x*s,a.y*s,a.z*s),sub=(a,b)=>point(a.x-b.x,a.y-b.y,a.z-b.z);
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z,norm=a=>scale(a,1/Math.hypot(a.x,a.y,a.z));
// Fixed-link inverse kinematics; the bend plane points away from the stalk.
function kneeFor(hip,foot,l1,l2,side){
 const delta=sub(foot,hip),distance=Math.hypot(delta.x,delta.y,delta.z),axis=norm(delta),out=point(side,0,0);
 const bend=norm(sub(out,scale(axis,dot(out,axis))));
 const along=(l1*l1-l2*l2+distance*distance)/(2*distance),height=Math.sqrt(Math.max(0,l1*l1-along*along));
 return add(add(hip,scale(axis,along)),scale(bend,height));
}
export function sampleGiantWaterbugPose(state={}){
 const grip=clamp(finite(state.grip,1)),swimBlend=clamp(finite(state.swimBlend,finite(state.strokeStrength,1-grip))),strokePhase=finite(state.strokePhase,finite(state.stroke)/(Math.PI*2)),fold=clamp(finite(state.forelegFold,swimBlend)),legs=[];
 for(const side of [-1,1]){
  const hip=point(side*.030,-.008,.073),sweep=.22+fold*.55,knee=add(hip,point(side*.052*Math.cos(sweep),0,.052*Math.sin(sweep)));
  const a=2.02+fold*.95,b=a+.5,ankle=add(knee,point(side*.025*Math.cos(a),-.005,.02449489742783178*Math.sin(a)));
  // Rotate the two tibial links in the XZ plane; y stays fixed, lengths stable.
  ankle.x=knee.x+side*.02449489742783178*Math.cos(a);
  const foot=add(ankle,point(side*.025*Math.cos(b),0,.025*Math.sin(b))),claw=add(foot,point(-side*.012*Math.cos(.35+fold*.3),0,-.012*Math.sin(.35+fold*.3)));
  legs.push({id:`front-${side}`,role:'front',side,hip,knee,ankle,foot,claw,contact:false,boneLengths:GIANT_WATERBUG_DIMENSIONS.foreBones});
  for(const role of ['middle','hind']){
   const hind=role==='hind',hip=point(side*(hind?.030:.035),hind?-.012:-.010,hind?-.015:.035),contact=contacts.find(c=>c.id===`${role}-${side}`).position;
   const phase=strokePhase*Math.PI*2+(hind?0:Math.PI*.6),swim=point(side*((hind?.084:.073)+Math.cos(phase)*.012*swimBlend),-.025+(hind?.006:.003)*Math.sin(phase)*swimBlend, (hind?-.055:.017)+Math.sin(phase)*(hind?.032:.019)*swimBlend);
   const foot=point(contact.x*grip+swim.x*(1-grip),contact.y*grip+swim.y*(1-grip),contact.z*grip+swim.z*(1-grip));
   const lengths=hind?GIANT_WATERBUG_DIMENSIONS.hindBones:GIANT_WATERBUG_DIMENSIONS.middleBones,knee=kneeFor(hip,foot,...lengths,side);
   legs.push({id:`${role}-${side}`,role,side,hip,knee,foot,contact:grip===1,boneLengths:lengths});
  }
 }
 const p=state.position||state;
 return {body:{position:point(finite(p.x),finite(p.y),finite(p.z)),heading:finite(state.orientation?.yaw,finite(state.heading)),pitch:finite(state.orientation?.pitch,finite(state.pitch)),roll:finite(state.orientation?.roll)},legs,grip,swimBlend,strokePhase,forelegFold:fold,tailBreathingPoint:GIANT_WATERBUG_DIMENSIONS.tailBreathingPoint};
}
