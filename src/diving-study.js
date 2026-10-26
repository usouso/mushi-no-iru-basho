/** Isolated shallow-water pose study, not a registered game species.
 * Durations, speeds and the elliptical path are game tuning, not measured biology.
 */
import {DIVING_DIMENSIONS as D} from './diving-kinematics.js?v=0.28.0&b=52b81ed2c56b';
const TAU=2*Math.PI,period=12,surfaceTime=4,travelTime=8,rampTime=.6;
const smooth=u=>u*u*(3-2*u),mix=(a,b,u)=>a+(b-a)*smooth(u);
export function createDivingStudy({center={x:0,z:0},waterY=0}={}) {
 if(!center||![center.x,center.z,waterY].every(Number.isFinite))throw new TypeError('Invalid diving study origin');
 const cx=center.x,cz=center.z,tail=D.tailBreathingPoint;
 const surfaceY=waterY-(-Math.sin(D.surfacePitch)*tail.z+Math.cos(D.surfacePitch)*tail.y),deepY=waterY+D.deepRootY;
 let time=0,caught=false,ramp=rampTime,speed=0;
 function pose(){
  const cycle=Math.floor(time/period),local=time-cycle*period,travel=Math.max(0,local-surfaceTime),u=travel/travelTime,angle=TAU*smooth(u);
  const direction=Math.atan2(-.30*Math.sin(angle),.15*Math.cos(angle));
  const heading=direction-(angle>Math.PI?TAU:0)-cycle*TAU;
  let phase='surface',y=surfaceY,pitch=D.surfacePitch;
  if(local>=surfaceTime&&travel<2){phase='diving';y=mix(surfaceY,deepY,travel/2);pitch=mix(D.surfacePitch,0,travel/2);}
  else if(travel>=2&&travel<6){phase='swimming';y=deepY;pitch=0;}
  else if(travel>=6){
   phase='rising';const rise=(travel-6)/2;
   if(rise<.4){y=mix(deepY,waterY-.085,rise/.4);pitch=mix(0,-.12,rise/.4);}
   else{y=mix(waterY-.085,surfaceY,(rise-.4)/.6);pitch=mix(-.12,D.surfacePitch,(rise-.4)/.6);}
  }
  return {id:'diving-study-1',phase,caught,position:{x:cx+.30*Math.cos(angle),y,z:cz+.15*Math.sin(angle)},heading,pitch,strokePhase:phase==='surface'?0:(travel*2)%1,speed,time};
 }
 function update(dt){
  dt=Number.isFinite(dt)?Math.max(0,Math.min(.1,dt)):0;if(!dt||caught)return;
  const before=pose().position,oldRamp=ramp;ramp=Math.min(rampTime,ramp+dt);
  const integral=t=>{const u=t/rampTime;return rampTime*(u*u*u-.5*u*u*u*u);};
  time+=oldRamp<rampTime?integral(ramp)-integral(oldRamp)+Math.max(0,dt-(ramp-oldRamp)):dt;
  const after=pose().position;speed=Math.hypot(after.x-before.x,after.y-before.y,after.z-before.z)/dt;
 }
 return {update,dive(){if(caught||pose().phase!=='surface')return false;time=Math.floor(time/period)*period+surfaceTime;speed=0;return true;},capture(){if(caught)return false;caught=true;speed=0;return true;},release(){if(!caught)return false;caught=false;ramp=0;return true;},reset(){time=0;caught=false;ramp=rampTime;speed=0;},get state(){return pose();}};
}
