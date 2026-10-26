/** Horizontal, supported lab motion only. Speeds, waits and retreat distance are
 * game choices, not measured C. atlas defensive behaviour. No flight/teleport. */
import {ATLAS_DIMENSIONS as D} from './atlas-kinematics.js?v=0.23.0&b=6eab031e296e';
export const ATLAS_MOTION=Object.freeze({normalRange:.12,retreatRange:.70,normalSpeed:.04,retreatSpeed:.18,warningSeconds:.35,settleSeconds:1.2,normalRamp:.4,retreatRamp:.45,maxStepSeconds:.25});
const smooth=t=>t*t*(3-2*t),TAU=Math.PI*2;
export function createAtlasStudy({position,heading=0,scale=1,motionSeed=null}={}){
 if(position===undefined)position={x:0,y:D.rootAboveSupport*scale,z:0};
 if(!position||![Object.prototype,null].includes(Object.getPrototypeOf(position))||Reflect.ownKeys(position).length!==3||!['x','y','z'].every(k=>Object.prototype.hasOwnProperty.call(position,k)&&'value'in Object.getOwnPropertyDescriptor(position,k)&&Number.isFinite(position[k])&&Math.abs(position[k])<=1e4)||!Number.isFinite(heading)||Math.abs(heading)>1e4)throw new TypeError('Invalid atlas support');
 if(!Number.isFinite(scale)||scale<1||scale>1.15||motionSeed!==null&&(!Number.isInteger(motionSeed)||motionSeed<0||motionSeed>0xffffffff))throw new TypeError('Invalid atlas individual');
 const origin={...position},range=ATLAS_MOTION.normalRange*scale,retreat=ATLAS_MOTION.retreatRange*scale,cycle=D.cycleDistance*scale,halfStep=cycle/2;
 let restNumber=0;const rest=()=>motionSeed===null?5:3+(((Math.imul(motionSeed^++restNumber,1664525)+1013904223)>>>0)%251)/100;
 const initialWait=rest();let distance=0,time=0,phase='resting',wait=initialWait,phaseElapsed=0,move=null,caught=false,walkSpeed=0,headLift=0,warningStart=0;
 function beginMove(target,speed,reason='normal'){
  const length=Math.abs(target-distance);if(length<1e-12){arrive(reason);return;}
  const maxSpeed=speed*scale,ramp=reason==='retreat'?ATLAS_MOTION.retreatRamp:ATLAS_MOTION.normalRamp,acceleration=maxSpeed/ramp,up=Math.min(ramp,Math.sqrt(length/acceleration)),peak=acceleration*up,cruise=Math.max(0,(length-acceleration*up*up)/peak);
  move={start:distance,target,length,direction:Math.sign(target-distance),reason,headStart:headLift,elapsed:0,up,cruise,peak,acceleration,duration:2*up+cruise};phase=reason==='retreat'?'retreating':'walking';phaseElapsed=0;walkSpeed=0;
 }
 function warn(){warningStart=headLift;move=null;phase='warning';phaseElapsed=0;wait=ATLAS_MOTION.warningSeconds;walkSpeed=0;}
 function arrive(reason){move=null;walkSpeed=0;phaseElapsed=0;if(reason==='prepare'){warn();return;}if(reason==='retreat'){phase='settling';wait=ATLAS_MOTION.settleSeconds;headLift=.2;return;}phase='resting';wait=rest();headLift=0;}
 function sampleMove(m){const t=m.elapsed,a=m.acceleration,u=m.up,c=m.cruise,p=m.peak;let travelled,speed;if(t<u){travelled=.5*a*t*t;speed=a*t;}else if(t<u+c){travelled=.5*a*u*u+p*(t-u);speed=p;}else{const v=Math.min(u,Math.max(0,t-u-c));travelled=.5*a*u*u+p*c+p*v-.5*a*v*v;speed=Math.max(0,p-a*v);}distance=m.start+m.direction*Math.min(m.length,travelled);walkSpeed=m.direction*speed;const blend=smooth(Math.min(1,t/m.duration));headLift=m.reason==='prepare'?m.headStart:m.headStart+(m.reason==='retreat'?.2-m.headStart:-m.headStart)*blend;}
 function update(dt){dt=Number.isFinite(dt)?Math.max(0,Math.min(ATLAS_MOTION.maxStepSeconds,dt)):0;if(!dt||caught)return;time+=dt;let left=dt,guard=0;
  while(left>1e-12&&guard++<8){
   if(move){const m=move,part=Math.min(left,m.duration-m.elapsed);m.elapsed+=part;phaseElapsed+=part;left-=part;sampleMove(m);if(m.duration-m.elapsed<=1e-12){distance=m.target;arrive(m.reason);}continue;}
   const part=Math.min(left,wait);wait-=part;phaseElapsed+=part;left-=part;if(phase==='warning')headLift=warningStart+(1-warningStart)*smooth(Math.min(1,phaseElapsed/ATLAS_MOTION.warningSeconds));else if(phase==='settling')headLift=.2*(1-smooth(Math.min(1,phaseElapsed/ATLAS_MOTION.settleSeconds)));
   if(wait>1e-12)break;
   if(phase==='warning')beginMove(-retreat,ATLAS_MOTION.retreatSpeed,'retreat');else if(phase==='settling'){phase='resting';wait=rest();phaseElapsed=0;headLift=0;}else beginMove(distance>=range-1e-12||distance<0?0:range,ATLAS_MOTION.normalSpeed);
  }
 }
 function disturb(){if(caught||phase==='warning'||phase==='retreating'||move?.reason==='prepare'||distance<=-retreat+1e-12)return false;if(move){const direction=move.direction,q=distance/halfStep,target=Math.max(-retreat,Math.min(range,(direction>0?Math.ceil(q-1e-10):Math.floor(q+1e-10))*halfStep));if(Math.abs(target-distance)<1e-12)warn();else beginMove(target,ATLAS_MOTION.normalSpeed,'prepare');}else warn();return true;}
 function snapshot(){return{id:'atlas-study-1',position:{x:origin.x+Math.sin(heading)*distance,y:origin.y,z:origin.z+Math.cos(heading)*distance},heading,scale,pitch:0,walkPhase:distance/cycle*TAU,walkSpeed,phase,caught,time,headLift,warningBlend:headLift,direction:move?.direction||0,distance};}
 return{update,disturb,capture(){if(caught)return false;caught=true;return true;},release(){if(!caught)return false;caught=false;if(distance>-retreat+1e-12)beginMove(-retreat,ATLAS_MOTION.retreatSpeed,'retreat');else beginMove(0,ATLAS_MOTION.normalSpeed);return true;},reset(){distance=0;time=0;phase='resting';wait=initialWait;phaseElapsed=0;move=null;caught=false;walkSpeed=0;headLift=0;warningStart=0;restNumber=motionSeed===null?0:1;},get state(){return snapshot();}};
}
