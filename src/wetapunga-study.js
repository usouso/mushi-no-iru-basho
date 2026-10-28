/** One bounded, fixed-heading branch lane for a wingless adult female display.
 * Speeds/waits/half-step reactions are game tuning, not measured wild behaviour.
 * Field caller owns quiet/fast/miss, distance and real leaf/branch LOS filtering.
 * Native signed-distance gait owns foot/bone geometry; terrain owns clearance.
 */
import {WETAPUNGA_DIMENSIONS as D} from './wetapunga-kinematics.js?v=0.67.0&b=06ee2abee345';
export const WETAPUNGA_MOTION=Object.freeze({normalSpeed:.05,retreatSpeed:.12,normalDistance:.06,retreatDistance:.12,rampSeconds:.25,finishMaxSeconds:.5,releaseRampSeconds:.35,maxStepSeconds:.1});
const TAU=2*Math.PI,M=WETAPUNGA_MOTION,C=D.cycleDistance,H=C/2;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),smooth=u=>u*u*(3-2*u),integral=u=>u*u*u-.5*u*u*u*u;
const record=(v,keys)=>v&&[Object.prototype,null].includes(Object.getPrototypeOf(v))&&Reflect.ownKeys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k)&&'value'in Object.getOwnPropertyDescriptor(v,k)&&Number.isFinite(v[k]));
export function createWetapungaStudy({position={x:0,y:D.rootAboveSupport,z:0},orientation={x:0,y:0,z:0,w:1},retreatBounds={min:-.24,max:.24},motionSeed=1729}={}){
 if(!record(position,['x','y','z'])||Object.values(position).some(v=>Math.abs(v)>1e4)||!record(orientation,['x','y','z','w'])||Math.abs(Math.hypot(orientation.x,orientation.y,orientation.z,orientation.w)-1)>1e-6||!record(retreatBounds,['min','max'])||retreatBounds.min>0||retreatBounds.max<0||retreatBounds.min>=retreatBounds.max||Math.max(Math.abs(retreatBounds.min),Math.abs(retreatBounds.max))>1||!Number.isInteger(motionSeed)||motionSeed<0||motionSeed>0xffffffff)throw new TypeError('Invalid wetapunga fixed support');
 const qLength=Math.hypot(orientation.x,orientation.y,orientation.z,orientation.w),q=Object.fromEntries(Object.entries(orientation).map(([k,v])=>[k,v/qLength])),home={...position};
 const axis={x:2*(q.x*q.z+q.w*q.y),y:2*(q.y*q.z-q.w*q.x),z:1-2*(q.x*q.x+q.y*q.y)},normalY=1-2*(q.x*q.x+q.z*q.z);
 if(normalY<1-1e-8||Math.abs(axis.y)>1e-8)throw new TypeError('Wetapunga needs a horizontal support quaternion');
 const lo=Math.ceil((retreatBounds.min-1e-10)/H)*H,hi=Math.floor((retreatBounds.max+1e-10)/H)*H;
 if(hi-lo<H-1e-10)throw new TypeError('Wetapunga support cannot fit a half-step');
 let phase,distance,time,caught,move,pending,wait,rng,ramp,lastReaction;
 const random=()=>{rng=(Math.imul(rng,1664525)+1013904223)>>>0;return rng/4294967296;};
 function rest(){phase='resting';move=null;pending=null;wait=4+4*random();}
 function reset(){distance=0;time=0;caught=false;move=null;pending=null;rng=motionSeed>>>0;ramp=M.releaseRampSeconds;lastReaction=-Infinity;rest();}
 const location=()=>({x:home.x+axis.x*distance,y:home.y,z:home.z+axis.z*distance});
 function valueAt(m,t){
  if(m.finish){const u=clamp(t/m.duration,0,1),travel=m.length*smooth(u)+m.startSpeed*m.duration*(u*u*u-2*u*u+u),speed=(m.length*(6*u-6*u*u)+m.startSpeed*m.duration*(3*u*u-4*u+1))/m.duration;return{travel,speed:Math.max(0,speed)};}
  if(t<m.ramp)return{travel:.5*m.peak*t*t/m.ramp,speed:m.peak*t/m.ramp};
  if(t>m.duration-m.ramp){const tail=m.duration-t;return{travel:m.length-.5*m.peak*tail*tail/m.ramp,speed:m.peak*tail/m.ramp};}
  return{travel:m.peak*(t-.5*m.ramp),speed:m.peak};
 }
 function startMove(target,kind){
  target=clamp(Math.round(target/H)*H,lo,hi);const length=Math.abs(target-distance);
  if(length<1e-10){rest();return false;}
  const peak=kind==='retreating'?M.retreatSpeed:M.normalSpeed,rampTime=Math.min(M.rampSeconds,Math.sqrt(length*M.rampSeconds/peak)),actualPeak=Math.min(peak,length/rampTime);
  move={start:distance,target,length,sign:Math.sign(target-distance),elapsed:0,ramp:rampTime,peak:actualPeak,duration:length/actualPeak+rampTime};phase=kind;return true;
 }
 function normal(){
  if(Math.abs(distance)>H*.1)return startMove(distance+Math.sign(-distance)*Math.min(Math.abs(distance),M.normalDistance),'walking');
  let direction=random()<.5?-1:1;if(direction<0&&lo>-H*.5)direction=1;else if(direction>0&&hi<H*.5)direction=-1;
  return startMove(clamp(direction*M.normalDistance,lo,hi),'walking');
 }
 function retreat(){
  const source=pending;pending=null;if(!source){rest();return;}
  const p=location(),projection=(p.x-source.x)*axis.x+(p.z-source.z)*axis.z;
  const sign=Math.abs(projection)>1e-8?Math.sign(projection):hi-distance>=distance-lo?1:-1;
  // A blocked end stays still: never fake an escape by moving toward the source.
  startMove(clamp(distance+sign*M.retreatDistance,lo,hi),'retreating');
 }
 function disturb(observer){
  if(!record(observer,['x','z'])||Math.abs(observer.x)>1e4||Math.abs(observer.z)>1e4||caught||phase==='finishing'||phase==='retreating'||time-lastReaction<1)return false;
  pending={...observer};lastReaction=time;
  if(move){
   const current=move,speed=valueAt(current,current.elapsed).speed,sign=current.sign;
   let target=clamp((sign>0?Math.ceil(distance/H-1e-10):Math.floor(distance/H+1e-10))*H,lo,hi);
   // At a mid-route contact boundary, a moving body still needs a braking step.
   if(Math.abs(target-distance)<1e-10&&speed>1e-10)target=clamp(target+sign*H,lo,hi);
   const length=Math.abs(target-distance);
   if(length>1e-10){
    // Hermite half-step completion: derivative starts at the existing speed and
    // ends at zero. v*T <= 2*length keeps the curve monotonic, even near contact.
    const duration=Math.min(M.finishMaxSeconds,speed>1e-10?2*length/speed:M.finishMaxSeconds);
    move={start:distance,target,length,sign,elapsed:0,duration,startSpeed:speed,finish:true};phase='finishing';return true;
   }
  }
  move=null;retreat();return true;
 }
 function update(dt){
  dt=Number.isFinite(dt)?clamp(dt,0,M.maxStepSeconds):0;if(!dt||caught)return;
  const oldRamp=ramp;ramp=Math.min(M.releaseRampSeconds,ramp+dt);
  let left=oldRamp<M.releaseRampSeconds?M.releaseRampSeconds*(integral(ramp/M.releaseRampSeconds)-integral(oldRamp/M.releaseRampSeconds))+Math.max(0,dt-(ramp-oldRamp)):dt;
  while(left>1e-12){
   if(move){const m=move,part=Math.min(left,Math.max(0,m.duration-m.elapsed));m.elapsed+=part;time+=part;left-=part;distance=m.start+m.sign*valueAt(m,m.elapsed).travel;
    if(m.elapsed>=m.duration-1e-12){distance=m.target;move=null;if(phase==='finishing')retreat();else rest();}else break;
   }else{const part=Math.min(left,wait);wait-=part;time+=part;left-=part;if(wait<=1e-12)normal();else break;}
  }
 }
 reset();return{update,disturb,capture(){if(caught)return false;caught=true;return true;},release(){if(!caught)return false;caught=false;ramp=0;if(phase==='resting')normal();return true;},reset,get effectiveBounds(){return{min:lo,max:hi};},get state(){return{id:'wetapunga-study-1',position:location(),orientation:{...q},walkPhase:distance/C*TAU,walkSpeed:caught?0:move?move.sign*valueAt(move,move.elapsed).speed*smooth(ramp/M.releaseRampSeconds):0,phase,caught,captured:caught,time,distance,wait};}};
}
