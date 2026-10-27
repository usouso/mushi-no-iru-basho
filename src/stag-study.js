/** Registered branch study: preserve the legacy short walk (also reused by
 * Metallifer), with opt-in supported threat response. Motion/jaw tuning is
 * illustrative, not measured wild behaviour. No combat or new flight. */
import {createBranchRetreatStudy} from './branch-retreat-study.js?v=0.64.0&b=3616c2fe808e';
import {STAG_DIMENSIONS as D} from './stag-kinematics.js?v=0.64.0&b=3616c2fe808e';
const TAU=2*Math.PI,rampTime=.5;
const smooth=t=>t*t*(3-2*t);
export function createStagStudy({position={x:0,y:D.rootAboveSupport,z:0},heading=0,scale=1,motionSeed=null,retreatBounds=undefined}={}){
 if(!position||![Object.prototype,null].includes(Object.getPrototypeOf(position))||Reflect.ownKeys(position).length!==3||!['x','y','z'].every(k=>Object.prototype.hasOwnProperty.call(position,k)&&'value'in Object.getOwnPropertyDescriptor(position,k)&&Number.isFinite(position[k])&&Math.abs(position[k])<=1e4)||!Number.isFinite(heading)||Math.abs(heading)>1e4)throw new TypeError('Invalid stag support');
 if(!Number.isFinite(scale)||scale<1||scale>1.15||motionSeed!==null&&(!Number.isInteger(motionSeed)||motionSeed<0||motionSeed>0xffffffff))throw new TypeError('Invalid individual motion');
 if(retreatBounds!==undefined)return createBranchRetreatStudy({boundedStepFinish:true,species:'stag',position,heading,scale,motionSeed,retreatBounds,cycleDistance:D.cycleDistance,rootAboveSupport:D.rootAboveSupport,warningSeconds:0.4,retreatDistance:0.48,retreatSpeed:0.18,jawRest:D.restJawOpen,jawWarning:.7});
 const length=.12*scale,speed=.02*scale,cycleDistance=D.cycleDistance*scale,halfStep=cycleDistance/2;
 let restNumber=0;const rest=(initial=false)=>motionSeed===null?(initial?10:6):3+(((Math.imul(motionSeed^++restNumber,1664525)+1013904223)>>>0)%700)/100;
 const initialWait=rest(true);
 const origin={...position};let distance=0,direction=1,phase='resting',wait=initialWait,target=length,time=0,caught=false,ramp=rampTime,stopping=false,disturbed=false,jawOpen=D.restJawOpen,jaw=null;
 function snapshot(){return{id:'stag-study-1',position:{x:origin.x+Math.sin(heading)*distance,y:origin.y,z:origin.z+Math.cos(heading)*distance},heading,pitch:0,walkPhase:distance/cycleDistance*TAU,walkSpeed:phase==='walking'&&!caught&&ramp>0?direction*speed*smooth(ramp/rampTime):0,phase,direction,jawOpen,caught,time};}
 function jawTo(target){jaw={start:jawOpen,target,elapsed:0};}
 function updateJaw(dt){if(!jaw)return;jaw.elapsed=Math.min(1,jaw.elapsed+dt);jawOpen=jaw.start+(jaw.target-jaw.start)*smooth(jaw.elapsed);if(jaw.elapsed===1){jawOpen=jaw.target;jaw=null;}}
 function begin(){phase='walking';target=direction>0?length:0;ramp=0;disturbed=false;stopping=false;jawTo(D.restJawOpen);}
 function react(){phase='reacting';wait=1;stopping=false;direction=distance<=1e-12?1:-1;jawTo(.7);}
 function stop(){if(stopping){react();return;}phase='resting';wait=rest();direction=distance<=1e-12?1:-1;}
 function update(dt){
  dt=Number.isFinite(dt)?Math.max(0,Math.min(.1,dt)):0;if(!dt||caught)return;
  time+=dt;let left=dt;
  while(left>1e-12){
   if(phase!=='walking'){const part=Math.min(left,wait);updateJaw(part);wait-=part;left-=part;if(wait>1e-12)break;begin();continue;}
   const part=left,old=ramp;ramp=Math.min(rampTime,ramp+part);updateJaw(part);
   const integral=t=>{const u=t/rampTime;return rampTime*(u*u*u-.5*u*u*u*u);};
   const elapsed=old<rampTime?integral(ramp)-integral(old)+Math.max(0,part-(ramp-old)):part;
   const remaining=Math.abs(target-distance),advance=Math.min(remaining,speed*elapsed);distance+=direction*advance;left=0;
   if(remaining-advance<1e-12){distance=target;stop();}
  }
 }
 function disturb(){
  if(caught||disturbed||phase==='reacting')return false;disturbed=true;
  if(phase==='resting'){react();return true;}
  const half=distance/halfStep,n=direction>0?Math.ceil(half-1e-10):Math.floor(half+1e-10);
  target=Math.max(0,Math.min(length,n*halfStep));stopping=true;
  if(Math.abs(target-distance)<1e-12){distance=target;react();}return true;
 }
 return{update,disturb,capture(){if(caught)return false;caught=true;return true;},release(){if(!caught)return false;caught=false;if(phase!=='walking')begin();ramp=0;return true;},reset(){distance=0;direction=1;phase='resting';restNumber=1;wait=initialWait;target=length;time=0;caught=false;ramp=rampTime;stopping=false;disturbed=false;jawOpen=D.restJawOpen;jaw=null;},get state(){return snapshot();}};
}
