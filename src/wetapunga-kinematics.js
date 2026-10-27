/** Original female wetapunga display dimensions, not measured natural ratios.
 * +Z head; level flat-top branch. Signed phase advances by distance / .04 * 2PI.
 * Gait order is authored, not a claim of observed natural footfall sequence.
 */
const point=(x,y,z)=>({x,y,z}),frozen=(x,y,z)=>Object.freeze(point(x,y,z));
const feet=Object.freeze([-1,1].flatMap(side=>['front','middle','hind'].map((role,i)=>Object.freeze({id:`${role}-${side}`,position:frozen(side*.13,-.065,[.11,0,-.13][i]+(i%2===(side===1?0:1)?.01:-.01))}))));
export const WETAPUNGA_DIMENSIONS=Object.freeze({bodyLength:.26,bodyWidth:.116,rootAboveSupport:.065,supportHalfWidth:.17,cycleDistance:.04,stanceFraction:.5,stepLift:.010,frontBones:Object.freeze([.080,.075]),middleBones:Object.freeze([.080,.075]),hindBones:Object.freeze([.105,.120]),restFootContacts:feet,ovipositorTip:frozen(0,.025,-.22),antennaTips:Object.freeze([-1,1].map(side=>frozen(side*.14,.05,.37)))});
const finite=(v,f=0)=>Number.isFinite(v)?v:f,smooth=x=>x*x*(3-2*x),norm=p=>{const l=Math.hypot(p.x,p.y,p.z);return point(p.x/l,p.y/l,p.z/l);};
export function sampleWetapungaPose(state={}){
 const D=WETAPUNGA_DIMENSIONS,phase=finite(state.walkPhase),legs=[];
 for(const side of [-1,1])for(let i=0;i<3;i++){
  let q=((phase/(2*Math.PI)+(i%2===(side===1?0:1)?0:.5))%1+1)%1;
  if(q<1e-12||q>1-1e-12)q=0;else if(Math.abs(q-.5)<1e-12)q=.5;
  const contact=q<=.5,travel=contact?.25-q:-.25+.5*smooth((q-.5)*2),lift=contact?0:D.stepLift*Math.sin(Math.PI*(q-.5)*2)**2;
  const role=['front','middle','hind'][i],hip=point(side*[.034,.038,.041][i],[-.012,-.017,-.018][i],[.055,.010,-.035][i]),foot=point(side*.13,-D.rootAboveSupport+lift,[.11,0,-.13][i]+D.cycleDistance*travel),bones=D[`${role}Bones`];
  const delta=point(foot.x-hip.x,foot.y-hip.y,foot.z-hip.z),r=Math.hypot(delta.x,delta.y,delta.z),axis=norm(delta),out=point(side*.25,1,i===2?.15:.05),dot=out.x*axis.x+out.y*axis.y+out.z*axis.z,bend=norm(point(out.x-axis.x*dot,out.y-axis.y*dot,out.z-axis.z*dot));
  const along=(bones[0]**2-bones[1]**2+r*r)/(2*r),height=Math.sqrt(Math.max(0,bones[0]**2-along*along));
  const knee=point(hip.x+axis.x*along+bend.x*height,hip.y+axis.y*along+bend.y*height,hip.z+axis.z*along+bend.z*height);
  legs.push({id:`${role}-${side}`,role,side,hip,knee,foot,contact,boneLengths:bones});
 }
 const p=state.position||state,q=state.orientation||{},heading=finite(state.heading),x=finite(q.x),y=finite(q.y,Math.sin(heading/2)),z=finite(q.z),w=finite(q.w,Math.cos(heading/2)),length=Math.hypot(x,y,z,w)||1;
 return {body:{position:point(finite(p.x),finite(p.y),finite(p.z)),orientation:{x:x/length,y:y/length,z:z/length,w:Math.hypot(x,y,z,w)?w/length:1}},legs,walkPhase:phase};
}
