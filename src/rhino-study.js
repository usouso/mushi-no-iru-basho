/** Registered branch study: the original short walk stays the default; an
 * opt-in supported field response receives threat position and safe limits.
 * Distances, speeds and waits are game tuning, not measured wild behaviour. */
import {createBranchRetreatStudy} from './branch-retreat-study.js?v=0.41.0&b=bed5219b02cd';
import {RHINO_DIMENSIONS as D} from './rhino-kinematics.js?v=0.41.0&b=bed5219b02cd';
const TAU=2*Math.PI,rampTime=.5;
const smooth=t=>t*t*(3-2*t);
export function createRhinoStudy({position={x:0,y:D.rootAboveSupport,z:0},heading=0,scale=1,motionSeed=null,retreatBounds=undefined,exposeTransitions=false}={}){
 if(typeof exposeTransitions!=='boolean')throw new TypeError('Invalid transition exposure');
 if(!position||![Object.prototype,null].includes(Object.getPrototypeOf(position))||Reflect.ownKeys(position).length!==3||!['x','y','z'].every(k=>Object.prototype.hasOwnProperty.call(position,k)&&'value'in Object.getOwnPropertyDescriptor(position,k)&&Number.isFinite(position[k])&&Math.abs(position[k])<=1e4)||!Number.isFinite(heading)||Math.abs(heading)>1e4)throw new TypeError('Invalid rhino support');
 if(!Number.isFinite(scale)||scale<1||scale>1.15||motionSeed!==null&&(!Number.isInteger(motionSeed)||motionSeed<0||motionSeed>0xffffffff))throw new TypeError('Invalid individual motion');
 if(retreatBounds!==undefined)return createBranchRetreatStudy({exposeTransitions,boundedStepFinish:true,species:'rhino',position,heading,scale,motionSeed,retreatBounds,cycleDistance:D.cycleDistance,rootAboveSupport:D.rootAboveSupport,warningSeconds:0.3,retreatDistance:0.4,retreatSpeed:0.14});
 const length=.12*scale,speed=.02*scale,cycleDistance=D.cycleDistance*scale,halfStep=cycleDistance/2;
 let restNumber=0;const rest=(initial=false)=>motionSeed===null?(initial?10:6):3+(((Math.imul(motionSeed^++restNumber,1664525)+1013904223)>>>0)%700)/100;
 const initialWait=rest(true);
 const origin={...position};let distance=0,direction=1,phase='resting',wait=initialWait,target=length,time=0,caught=false,ramp=rampTime,stopping=false,disturbed=false;
 function snapshot(){return{id:'rhino-study-1',position:{x:origin.x+Math.sin(heading)*distance,y:origin.y,z:origin.z+Math.cos(heading)*distance},heading,pitch:0,walkPhase:distance/cycleDistance*TAU,walkSpeed:phase==='walking'&&!caught&&ramp>0?direction*speed*smooth(ramp/rampTime):0,phase,direction,caught,time};}
 function begin(){phase='walking';target=direction>0?length:0;ramp=0;disturbed=false;}
 function stop(){phase='resting';wait=stopping?2:rest();direction=distance<=1e-12?1:distance>=length-1e-12?-1:-direction;stopping=false;}
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
  if(phase==='resting'){wait=Math.min(wait,2);direction=distance<=1e-12?1:distance>=length-1e-12?-1:-direction;return true;}
  // Continue the current stride only as far as the next six-foot support pose.
  const half=distance/halfStep,n=direction>0?Math.ceil(half-1e-10):Math.floor(half+1e-10);
  target=Math.max(0,Math.min(length,n*halfStep));stopping=true;
  if(Math.abs(target-distance)<1e-12){distance=target;stop();}return true;
 }
 return{update,disturb,capture(){if(caught)return false;caught=true;return true;},release(){if(!caught)return false;caught=false;if(phase==='resting')begin();ramp=0;return true;},reset(){distance=0;direction=1;phase='resting';restNumber=1;wait=initialWait;target=length;time=0;caught=false;ramp=rampTime;stopping=false;disturbed=false;},get state(){return snapshot();}};
}
