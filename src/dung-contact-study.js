/** One beetle and its original ball; independent of the game's simulation/UI. */
import {DUNG_DIMENSIONS as D,sampleDungPose} from './dung-kinematics.js?v=0.64.0&b=3616c2fe808e';
const duration=1.5*D.pathLength/.035,rampTime=.6;
export function createDungContactStudy(){
 let elapsed=0,distance=0,speed=0,caught=false,finished=false,ramp=rampTime;
 const snapshot=()=>({id:'dung-study-1',status:caught?'caught':finished?'resting':'rolling',caught,distance,speed,ball:{id:'ball-1',position:{x:0,y:D.ballRadius,z:distance},radius:D.ballRadius,angle:distance/D.ballRadius}});
 function update(dt){
  dt=Number.isFinite(dt)?Math.max(0,Math.min(.1,dt)):0;if(!dt||caught||finished)return;
  const before=distance,oldRamp=ramp;ramp=Math.min(rampTime,ramp+dt);
  const integral=t=>{const u=t/rampTime;return rampTime*(u*u*u-.5*u*u*u*u);};
  const advance=oldRamp<rampTime?integral(ramp)-integral(oldRamp)+Math.max(0,dt-(ramp-oldRamp)):dt;
  elapsed=Math.min(duration,elapsed+advance);const u=elapsed/duration;distance=D.pathLength*u*u*(3-2*u);speed=(distance-before)/dt;
  if(elapsed>=duration){distance=D.pathLength;speed=0;finished=true;}
 }
 return{update,capture(){if(caught)return false;caught=true;speed=0;return true;},release(){if(!caught)return false;caught=false;ramp=0;return true;},reset(){elapsed=0;distance=0;speed=0;caught=false;finished=false;ramp=rampTime;},get state(){return snapshot();},get pose(){return sampleDungPose(snapshot());}};
}
