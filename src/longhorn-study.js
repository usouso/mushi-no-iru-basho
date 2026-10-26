/** Unregistered fixed bark-plane study. Distances, speed and waits are game
 * tuning, not measured natural activity or an intelligent escape response. */
import {LONGHORN_DIMENSIONS as D} from './longhorn-kinematics.js?v=0.21.0&b=80addd8ed820';
const TAU=2*Math.PI,length=.06,speed=.018,rampTime=.5,halfStep=D.cycleDistance/2;
const smooth=t=>t*t*(3-2*t);
export function createLonghornStudy(support){
 const record=(v,keys)=>{if(!v||![Object.prototype,null].includes(Object.getPrototypeOf(v))||Reflect.ownKeys(v).length!==keys.length||!keys.every(k=>Object.prototype.hasOwnProperty.call(v,k)&&'value'in Object.getOwnPropertyDescriptor(v,k)))throw new TypeError('Invalid longhorn support');};
 record(support,['position','orientation']);record(support.position,['x','y','z']);record(support.orientation,['x','y','z','w']);
 if(![...Object.values(support.position),...Object.values(support.orientation)].every(n=>Number.isFinite(n)&&Math.abs(n)<=1e4))throw new TypeError('Invalid longhorn support');
 const norm=Math.hypot(...Object.values(support.orientation));if(Math.abs(norm-1)>1e-6)throw new TypeError('Invalid longhorn support');
 const origin={...support.position},q=Object.fromEntries(Object.entries(support.orientation).map(([k,v])=>[k,v/norm]));
 // rotate(q, local +Z): a fixed tangent, including vertical bark supports.
 const tangent={x:2*(q.x*q.z+q.w*q.y),y:2*(q.y*q.z-q.w*q.x),z:1-2*(q.x*q.x+q.y*q.y)};
 let distance=0,direction=1,phase='resting',wait=8,target=length,time=0,caught=false,ramp=rampTime,stopping=false,disturbed=false;
 function snapshot(){return{id:'longhorn-study-1',position:{x:origin.x+tangent.x*distance,y:origin.y+tangent.y*distance,z:origin.z+tangent.z*distance},orientation:{...q},walkPhase:distance/D.cycleDistance*TAU,walkSpeed:phase==='walking'&&!caught&&ramp>0?direction*speed*smooth(ramp/rampTime):0,phase,direction,caught,time};}
 function begin(){phase='walking';target=direction>0?length:0;ramp=0;disturbed=false;}
 function stop(){phase='resting';wait=stopping?1.5:5;direction=distance<=1e-12?1:distance>=length-1e-12?-1:-direction;stopping=false;}
 function update(dt){
  dt=Number.isFinite(dt)?Math.max(0,Math.min(.1,dt)):0;if(!dt||caught)return;
  time+=dt;let left=dt;
  while(left>1e-12){
   if(phase==='resting'){const part=Math.min(left,wait);wait-=part;left-=part;if(wait>1e-12)break;begin();continue;}
   const part=left,old=ramp;ramp=Math.min(rampTime,ramp+part);
   const integral=t=>{const u=t/rampTime;return rampTime*(u*u*u-.5*u*u*u*u);};
   const elapsed=old<rampTime?integral(ramp)-integral(old)+Math.max(0,part-(ramp-old)):part;
   const remaining=Math.abs(target-distance),advance=Math.min(remaining,speed*elapsed);distance+=direction*advance;left=0;
   if(remaining-advance<1e-12){distance=target;stop();}
  }
 }
 function disturb(){
  if(caught||disturbed)return false;
  disturbed=true;
  if(phase==='resting'){wait=Math.min(wait,1.5);direction=distance<=1e-12?1:distance>=length-1e-12?-1:-direction;return true;}
  // Continue the current stride only as far as the next six-foot support pose.
  const half=distance/halfStep,n=direction>0?Math.ceil(half-1e-10):Math.floor(half+1e-10);
  target=Math.max(0,Math.min(length,n*halfStep));stopping=true;
  if(Math.abs(target-distance)<1e-12){distance=target;stop();}return true;
 }
 return{update,disturb,capture(){if(caught)return false;caught=true;return true;},release(){if(!caught)return false;caught=false;if(phase==='resting')begin();ramp=0;return true;},reset(){distance=0;direction=1;phase='resting';wait=8;target=length;time=0;caught=false;ramp=rampTime;stopping=false;disturbed=false;},get state(){return snapshot();}};
}
