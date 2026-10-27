/** Field-only, bounded departure prototype. Durations/trajectory are game tuning,
 * not measured escape responses. Uses the existing supported walk unchanged. */
import {createRhinoStudy} from './rhino-study.js?v=0.64.0&b=3616c2fe808e';
const TAU=2*Math.PI,clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),ease=x=>{const t=clamp(x,0,1);return t*t*(3-2*t);};
export const RHINO_FLIGHT_TIMING=Object.freeze({prepare:.65,flight:5.7,landing:.65,cooldown:8});
// Local +X is the existing branch's forward direction, +Z the selected clear side.
// Endpoint velocities vanish; before lateral travel the body clears the branch.
const keys=[
 [0,0,0,0],[.65,.05,.36,0],[1.6,.40,.70,1.0],[2.7,.70,.80,2.2],
 [3.4,1.0,.65,1.5],[4.4,.5,.5,.5],[5.1,.05,.36,0],[5.7,0,0,0]
];
const headingKeys=[[0,0],[.65,0],[1.6,.9],[2.7,2.6],[3.4,3.6],[4.4,4.65],[5.1,TAU],[5.7,TAU]];
function tangent(index,component){
 if(index===0||index===keys.length-1)return 0;
 if(index===1)return component===2?.55:0;
 if(index===6)return component===2?-.55:0;
 return (keys[index+1][component]-keys[index-1][component])/(keys[index+1][0]-keys[index-1][0]);
}
function pathAt(t){
 const x=clamp(t,0,RHINO_FLIGHT_TIMING.flight);let i=0;while(i<keys.length-2&&x>keys[i+1][0])i++;
 const a=keys[i],b=keys[i+1],d=b[0]-a[0],u=(x-a[0])/d,u2=u*u,u3=u2*u;
 const p=[1,2,3].map(k=>(2*u3-3*u2+1)*a[k]+(u3-2*u2+u)*d*tangent(i,k)+(-2*u3+3*u2)*b[k]+(u3-u2)*d*tangent(i+1,k));
 const angle=headingKeys[i][1]+(headingKeys[i+1][1]-headingKeys[i][1])*ease(u);
 return{x:p[0],y:p[1],z:p[2],angle};
}
export function createRhinoFlightStudy(options={}){
 const enabled=options.retreatBounds!==undefined,base=createRhinoStudy(enabled?{...options,exposeTransitions:true}:options),warningSeconds=.3;
 let time=0,flight=null,caught=false,cooldownUntil=0,lastSource=null,lastPressureTime=-Infinity;
 function startFlight(){
  const state=base.state,source=lastSource,side=source&&Math.abs(source.z-state.position.z)>.02?(source.z<state.position.z?1:-1):((options.motionSeed??0)&1?1:-1);
  flight={elapsed:0,origin:{...state.position},state,side,warningStart:state.warningBlend||0};
 }
 function maybeStartFlight(){
  if(!enabled||flight||time<cooldownUntil-1e-10)return;
  const phase=base.state.phase;
  if(phase==='warning'||phase==='cornered'&&time-lastPressureTime<=.25+1e-10)startFlight();
 }
 function snapshot(){
  const s=base.state;if(!flight)return{...s,time,caught};
  const t=flight.elapsed,{prepare,flight:duration}=RHINO_FLIGHT_TIMING;
  let phase,position={...flight.origin},heading=flight.state.heading,elytra=1,unfold=1,tuck=0,flapAmplitude=0,warningBlend=0;
  if(t<prepare){
   // One .65-second wing clock: the .30-second head warning overlaps, rather
   // than preceding, the unchanged .25 shell / .40 membrane sequence.
   phase=t<warningSeconds?'warning':'preparing-flight';elytra=ease(t/.25);unfold=ease((t-.25)/.4);
   warningBlend=t<warningSeconds?flight.warningStart+(1-flight.warningStart)*ease(t/warningSeconds):1-ease((t-warningSeconds)/(prepare-warningSeconds));
  }else if(t<prepare+duration){
   phase='flying';const a=t-prepare,p=pathAt(a),forward={x:Math.sin(heading),z:Math.cos(heading)},side={x:-Math.cos(heading)*flight.side,z:Math.sin(heading)*flight.side};
   position.x+=forward.x*p.x+side.x*p.z;position.y+=p.y;position.z+=forward.z*p.x+side.z*p.z;
   heading-=flight.side*p.angle;tuck=ease((p.y-.20)/.18);flapAmplitude=ease((p.y-.10)/.15);
  }else{phase='landing';const a=t-prepare-duration;unfold=1-ease(a/.4);elytra=1-ease((a-.4)/.25);warningBlend=(s.warningBlend||0)*ease((a-.4)/.25);}
  return{...flight.state,id:s.id,time,caught,phase,position,heading,pitch:0,walkSpeed:0,warningBlend,
   flightPose:{elytra,unfold,tuck,flapAmplitude,flapPhase:TAU*18*Math.max(0,t-prepare),pitch:0,roll:0}};
 }
 function update(dt){
  dt=Number.isFinite(dt)?clamp(dt,0,.1):0;if(!dt||caught)return;
  if(!enabled){time+=dt;base.update(dt);return;}
  let left=dt,transitions=0;
  while(left>1e-12){
   if(++transitions>16)throw new Error('Rhino flight transition did not advance');
   maybeStartFlight();
   if(flight){
    const end=RHINO_FLIGHT_TIMING.prepare+RHINO_FLIGHT_TIMING.flight+RHINO_FLIGHT_TIMING.landing,part=Math.min(left,end-flight.elapsed);
    // Consume only the stationary base warning, stopping exactly before its
    // first retreat step. The original supported state then waits for landing.
    const remaining=base.transitionInfo.warningRemaining;
    if(remaining!==null&&remaining>1e-12)base.update(Math.min(part,remaining));
    flight.elapsed+=part;time+=part;left-=part;
    for(const boundary of[warningSeconds,RHINO_FLIGHT_TIMING.prepare,RHINO_FLIGHT_TIMING.prepare+RHINO_FLIGHT_TIMING.flight,end])if(Math.abs(flight.elapsed-boundary)<1e-10)flight.elapsed=boundary;
    if(flight.elapsed>=end-1e-10){flight=null;cooldownUntil=time+RHINO_FLIGHT_TIMING.cooldown;}
   }else{
    const boundary=base.transitionInfo.remaining;
    let part=boundary!==null&&boundary>1e-12?Math.min(left,boundary):left;
    if(time<cooldownUntil&&cooldownUntil-time>1e-12)part=Math.min(part,cooldownUntil-time);
    base.update(part);time+=part;left-=part;maybeStartFlight();
   }
  }
 }
 return{update,disturb(source){if(caught||flight)return false;const changed=base.disturb(source);if(source&&Number.isFinite(source.x)&&Number.isFinite(source.z)&&Math.abs(source.x)<=1e4&&Math.abs(source.z)<=1e4){lastSource={x:source.x,z:source.z};lastPressureTime=time;}maybeStartFlight();return changed;},
  capture(){if(caught)return false;caught=true;base.capture();return true;},
  release(){if(!caught)return false;caught=false;base.release();return true;},
  reset(){base.reset();time=0;flight=null;caught=false;cooldownUntil=0;lastSource=null;lastPressureTime=-Infinity;},
  get state(){return snapshot();}};
}
