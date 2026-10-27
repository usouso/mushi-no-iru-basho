/** Unregistered ladybird pose study. Durations, stride and flight path are game
 * tuning, not biological measurements. No prey, physics, audio or renderer. */
import {LADYBIRD_DIMENSIONS as D} from './ladybird-kinematics.js?v=0.41.0&b=bed5219b02cd';
const TAU=2*Math.PI,walkLength=.036,walkSpeed=.018,rampTime=.5;
const clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>x*x*(3-2*x),angle=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
export function createLadybirdStudy(supports){
 const record=(v,keys)=>{if(!v||![Object.prototype,null].includes(Object.getPrototypeOf(v))||Reflect.ownKeys(v).length!==keys.length||!keys.every(k=>Object.prototype.hasOwnProperty.call(v,k)&&'value' in Object.getOwnPropertyDescriptor(v,k)))throw new TypeError('Invalid ladybird supports');};
 if(!Array.isArray(supports)||supports.length!==2||Reflect.ownKeys(supports).length!==3)throw new TypeError('Invalid ladybird supports');
 const perches=Array.from({length:2},(_,i)=>{const d=Object.getOwnPropertyDescriptor(supports,String(i));if(!d||!('value'in d))throw new TypeError('Invalid ladybird supports');const p=d.value;record(p,['position','heading']);record(p.position,['x','y','z']);if(![p.heading,...Object.values(p.position)].every(n=>Number.isFinite(n)&&Math.abs(n)<=1e4))throw new TypeError('Invalid ladybird supports');return{position:{...p.position},heading:p.heading};});
 const a=perches[0].position,b=perches[1].position,distance=Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);if(distance<.1||distance>3||Math.abs(a.y-b.y)>.5)throw new TypeError('Invalid ladybird supports');
 let perch=0,position={...a},heading=perches[0].heading,phase='resting',elapsed=0,time=0,caught=false,ramp=rampTime,walkPhase=0,wingPhase=0,walk=null,flight=null;
 function pose(){
  let p={...position},h=heading,elytraOpen=0,hindwingDeploy=0,hindwingSweep=0,flap=wingPhase,legTuck=0;
  if(phase==='opening')elytraOpen=smooth(clamp(elapsed/.8));
  else if(phase==='deploying'){const u=clamp(elapsed/1.2);elytraOpen=1;hindwingDeploy=smooth(clamp(u*2));hindwingSweep=smooth(clamp(u*2-1));}
  else if(phase==='flying'){
   const t=clamp(elapsed/flight.duration),u=smooth(t),s=flight.start,e=flight.end;
   p={x:s.x+(e.x-s.x)*u,y:s.y+(e.y-s.y)*u+.75*u*(1-u),z:s.z+(e.z-s.z)*u};
   h=t<.25?heading+angle(heading,flight.heading)*smooth(t/.25):flight.heading;
   if(t>.75)h=flight.heading+(flight.endHeading-flight.heading)*smooth((t-.75)/.25);
   elytraOpen=hindwingDeploy=hindwingSweep=1;flap=wingPhase+TAU*24*smooth(t);legTuck=smooth(clamp(t/.2))*smooth(clamp((1-t)/.2));
  }else if(phase==='closing'){const u=clamp(elapsed/1.2);hindwingDeploy=1;hindwingSweep=1-smooth(clamp(u*2));elytraOpen=1-smooth(clamp(u*2-1));}
  else if(phase==='stowing')hindwingDeploy=1-smooth(clamp(elapsed/1.5));
  return{id:'ladybird-study-1',position:p,heading:h,pitch:0,phase,time,caught,walkPhase,walkSpeed:phase==='walking'&&!caught?walkSpeed*smooth(ramp/rampTime):0,elytraOpen,hindwingDeploy,hindwingSweep,wingPhase:flap,legTuck};
 }
 function open(){
  const next=1-perch,end=perches[next],h=heading+angle(heading,Math.atan2(end.position.x-position.x,end.position.z-position.z));
  flight={index:next,start:{...position},end:{...end.position},heading:h,endHeading:h+angle(h,end.heading),duration:2.8+.4*Math.hypot(end.position.x-position.x,end.position.y-position.y,end.position.z-position.z)};
  phase='opening';elapsed=0;walk=null;
 }
 function depart(){
  if(caught)return false;
  if(phase==='resting'){open();return true;}
  if(phase!=='walking')return false;
  // Finish the next all-feet-supported half cycle without snapping position or gait.
  const targetHalf=Math.ceil(walkPhase/Math.PI-1e-10),left=Math.max(0,(targetHalf*Math.PI-walkPhase)/TAU*D.cycleDistance);
  walk.distance=Math.min(walk.distance,walk.travelled+left);walk.targetPhase=targetHalf*Math.PI;
  if(left<1e-10){walkPhase=walk.targetPhase;open();}return true;
 }
 function update(dt){
  dt=Number.isFinite(dt)?Math.max(0,Math.min(.1,dt)):0;if(!dt||caught)return;
  const before=ramp;ramp=Math.min(rampTime,ramp+dt);const integral=t=>{const u=t/rampTime;return rampTime*(u*u*u-.5*u*u*u*u);};
  let left=before<rampTime?integral(ramp)-integral(before)+Math.max(0,dt-(ramp-before)):dt;time+=left;
  while(left>0){
   if(phase==='walking'){
    const seconds=Math.max(0,(walk.distance-walk.travelled)/walkSpeed),part=Math.min(left,seconds),advance=part*walkSpeed;
    walk.travelled=Math.min(walk.distance,walk.travelled+advance);walkPhase=walk.startPhase+walk.travelled/D.cycleDistance*TAU;
    position={x:walk.start.x+Math.sin(heading)*walk.travelled,y:walk.start.y,z:walk.start.z+Math.cos(heading)*walk.travelled};left-=part;
    if(walk.distance-walk.travelled>1e-12)break;
    walkPhase=walk.targetPhase;open();continue;
   }
   const duration=phase==='resting'?24+2*perch:phase==='opening'?.8:phase==='deploying'||phase==='closing'?1.2:phase==='stowing'?1.5:flight.duration;
   const part=Math.min(left,Math.max(0,duration-elapsed));elapsed+=part;left-=part;if(elapsed<duration-1e-12)break;
   if(phase==='resting'){walk={start:{...position},startPhase:walkPhase,travelled:0,distance:walkLength,targetPhase:walkPhase+walkLength/D.cycleDistance*TAU};phase='walking';elapsed=0;}
   else if(phase==='opening'){phase='deploying';elapsed=0;}
   else if(phase==='deploying'){phase='flying';elapsed=0;}
   else if(phase==='flying'){position={...flight.end};heading=flight.endHeading;wingPhase+=TAU*24;perch=flight.index;phase='closing';elapsed=0;}
   else if(phase==='closing'){phase='stowing';elapsed=0;}
   else{phase='resting';elapsed=0;flight=null;}
  }
 }
 return{update,depart,capture(){if(caught)return false;caught=true;return true;},release(){if(!caught)return false;caught=false;ramp=0;if(phase==='resting'||phase==='walking')depart();return true;},get state(){return pose();}};
}
