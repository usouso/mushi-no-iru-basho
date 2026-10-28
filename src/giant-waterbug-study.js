/** Bounded display-space plant-grip / nearby-swim study. Durations, distances,
 * stroke rates and seeded waits are game tuning, not measured animal behaviour.
 * YXZ orientation is applied by the native model exactly once. Real water,
 * bottom, shoreline and support-skin clearance remain integration checks.
 */
import {GIANT_WATERBUG_DIMENSIONS as D} from './giant-waterbug-kinematics.js?v=0.67.0&b=06ee2abee345';
const TAU=Math.PI*2,RAMP=.5,RATE=TAU*1.4;
const smooth=u=>u*u*(3-2*u),integral=u=>u*u*u-.5*u*u*u*u;
const phases=['warning','releasing','diving','swimming','turning','returning','gripping','settling'];
const durations={warning:.7,releasing:.55,diving:1.2,swimming:1.2,turning:1.2,returning:2,gripping:.65,settling:.4};
const finite=v=>Number.isFinite(v)&&Math.abs(v)<=1e4;
const record=(v,keys)=>v&&[Object.prototype,null].includes(Object.getPrototypeOf(v))&&keys.every(k=>Object.hasOwn(v,k)&&'value'in Object.getOwnPropertyDescriptor(v,k)&&finite(v[k]));
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));

export function createGiantWaterbugStudy(options={}) {
 if(!options||![Object.prototype,null].includes(Object.getPrototypeOf(options)))throw new TypeError('Invalid giant waterbug options');
 const waterY=options.waterY??0,initial=options.orientation??{pitch:options.pitch??.95,yaw:options.heading??0,roll:0};
 if(!finite(waterY)||!record(initial,['pitch','yaw','roll'])||initial.pitch<.55||initial.pitch>1.2||initial.roll!==0)throw new TypeError('Invalid giant waterbug support orientation');
 const orientation={pitch:initial.pitch,yaw:initial.yaw,roll:initial.roll},tail=D.tailBreathingPoint;
 const rootY=waterY+Math.sin(initial.pitch)*tail.z-Math.cos(initial.pitch)*tail.y;
 const p=options.position??{x:0,y:rootY,z:0};
 if(!record(p,['x','y','z'])||Math.abs(p.y-rootY)>1e-7)throw new TypeError('Invalid giant waterbug breathing support position');
 const home={x:p.x,y:p.y,z:p.z};
 const envelope=options.envelope??{};
 if(!envelope||![Object.prototype,null].includes(Object.getPrototypeOf(envelope)))throw new TypeError('Invalid giant waterbug envelope');
 const r=envelope.retreat??{x:.16,y:-.04,z:-.20};
 if(!record(r,['x','y','z'])||r.y>0||r.y<-.08||Math.hypot(r.x,r.z)<.05||Math.hypot(r.x,r.z)>.4)throw new TypeError('Invalid giant waterbug retreat');
 const retreat={x:r.x,y:r.y,z:r.z},seed=options.seed??1;
 if(!Number.isInteger(seed)||seed<1||seed>0xffffffff)throw new TypeError('Invalid giant waterbug seed');
 const swimPitch=Math.min(.3,orientation.pitch),outYaw=orientation.yaw+wrap(Math.atan2(r.x,r.z)-orientation.yaw);
 // Choose the opposite heading without a wrap discontinuity, then return to the
 // exact support yaw before any contact. No heading-reset teleport at home.
 const inYaw=outYaw+(outYaw>orientation.yaw?-Math.PI:Math.PI);
 let phase,elapsed,time,captured,ramp,stroke,random,restWait;
 function nextWait(){random^=random<<13;random^=random>>>17;random^=random<<5;random>>>=0;return 9+6*random/0x100000000;}
 function reset(){phase='resting';elapsed=0;time=0;captured=false;ramp=RAMP;stroke=0;random=seed;restWait=nextWait();}
 reset();
 function pose(){
  let travel=0,depth=0,pitch=orientation.pitch,yaw=orientation.yaw,grip=1,forelegFold=0;
  const u=phase==='resting'?0:Math.max(0,Math.min(1,elapsed/durations[phase])),s=smooth(u);
  if(phase==='warning')forelegFold=s;
  else if(phase==='releasing'){forelegFold=1;grip=1-s;}
  else if(['diving','swimming','turning','returning'].includes(phase)){
   forelegFold=1;grip=0;
   if(phase==='diving'){travel=.5*s;depth=s;pitch=orientation.pitch+(swimPitch-orientation.pitch)*s;yaw=orientation.yaw+(outYaw-orientation.yaw)*s;}
   else if(phase==='swimming'){travel=.5+.5*s;depth=1;pitch=swimPitch;yaw=outYaw;}
   else if(phase==='turning'){travel=1;depth=1;pitch=swimPitch;yaw=outYaw+(inYaw-outYaw)*s;}
   else {travel=1-s;depth=1-s;pitch=swimPitch+(orientation.pitch-swimPitch)*s;yaw=inYaw+(orientation.yaw-inYaw)*s;}
  }else if(phase==='gripping'){grip=s;forelegFold=1;}
  else if(phase==='settling')forelegFold=1-s;
  const position={x:home.x+retreat.x*travel,y:home.y+retreat.y*depth,z:home.z+retreat.z*travel};
  return {id:'giant-waterbug-study-1',phase,phaseTime:elapsed,time,captured,caught:captured,position,orientation:{pitch,yaw,roll:0},heading:yaw,pitch,grip,stroke,strokeStrength:1-grip,forelegFold,restWait};
 }
 function disturb(reason){
  if(captured||phase!=='resting'||reason==='quiet')return false;
  phase='warning';elapsed=0;return true;
 }
 function strokeIntegral(t){
  if(phase==='releasing')return RATE*durations.releasing*integral(t/durations.releasing);
  if(phase==='gripping')return RATE*(t-durations.gripping*integral(t/durations.gripping));
  return ['diving','swimming','turning','returning'].includes(phase)?RATE*t:0;
 }
 function update(dt){
  dt=Number.isFinite(dt)?Math.max(0,Math.min(.1,dt)):0;if(!dt||captured)return;
  const oldRamp=ramp;ramp=Math.min(RAMP,ramp+dt);
  let left=oldRamp<RAMP?RAMP*(integral(ramp/RAMP)-integral(oldRamp/RAMP))+Math.max(0,dt-(ramp-oldRamp)):dt;
  time+=left;
  while(left>0){
   const duration=phase==='resting'?restWait:durations[phase],part=Math.min(left,Math.max(0,duration-elapsed));
   stroke+=strokeIntegral(elapsed+part)-strokeIntegral(elapsed);elapsed+=part;left-=part;
   if(elapsed<duration-1e-12)break;
   if(phase==='resting'){phase='warning';elapsed=0;}
   else {const next=phases.indexOf(phase)+1;phase=phases[next]??'resting';elapsed=0;if(phase==='resting')restWait=nextWait();}
   // Discard only floating-point residue at an exact segment boundary.
   if(left<1e-12)left=0;
  }
 }
 return {update,disturb,capture(){if(captured)return false;captured=true;return true;},release(){if(!captured)return false;captured=false;ramp=0;if(phase==='resting')disturb();return true;},reset,get state(){return pose();}};
}
