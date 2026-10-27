/** Independent sloping-ground pose study; timings/path are game tuning, not
 * measured puddling or flight. No terrain modification, fluids or renderer. */
import {SWALLOWTAIL_DIMENSIONS as D} from './swallowtail-kinematics.js?v=0.40.0&b=8b1b975eded1';
const TAU=2*Math.PI,openTime=.6,closeTime=.6,rampTime=.5,cycles=24;
const clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>x*x*(3-2*x),dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z+a.w*b.w;
const neg=q=>({x:-q.x,y:-q.y,z:-q.z,w:-q.w}),align=(a,b)=>dot(a,b)<0?neg(b):{...b};
const unit=q=>{const n=Math.hypot(q.x,q.y,q.z,q.w);return{x:q.x/n,y:q.y/n,z:q.z/n,w:q.w/n};};
function slerp(a,target,t){const b=align(a,target),d=Math.max(-1,Math.min(1,dot(a,b)));let u=1-t,v=t;if(d<.9995){const angle=Math.acos(d),sin=Math.sin(angle);u=Math.sin((1-t)*angle)/sin;v=Math.sin(t*angle)/sin;}return unit({x:a.x*u+b.x*v,y:a.y*u+b.y*v,z:a.z*u+b.z*v,w:a.w*u+b.w*v});}
function rotate(q,v){const x=2*(q.y*v.z-q.z*v.y),y=2*(q.z*v.x-q.x*v.z),z=2*(q.x*v.y-q.y*v.x);return{x:v.x+q.w*x+q.y*z-q.z*y,y:v.y+q.w*y+q.z*x-q.x*z,z:v.z+q.w*z+q.x*y-q.y*x};}
export function createSwallowtailStudy(supports){
 const record=(v,keys)=>{if(!v||![Object.prototype,null].includes(Object.getPrototypeOf(v))||Reflect.ownKeys(v).length!==keys.length||!keys.every(k=>Object.prototype.hasOwnProperty.call(v,k)&&'value'in Object.getOwnPropertyDescriptor(v,k)))throw new TypeError('Invalid swallowtail supports');};
 if(!Array.isArray(supports)||Object.getPrototypeOf(supports)!==Array.prototype||supports.length!==2||Reflect.ownKeys(supports).length!==3)throw new TypeError('Invalid swallowtail supports');
 const points=Array.from({length:2},(_,i)=>{const d=Object.getOwnPropertyDescriptor(supports,String(i));if(!d||!('value'in d))throw new TypeError('Invalid swallowtail supports');const p=d.value;record(p,['position','orientation']);record(p.position,['x','y','z']);record(p.orientation,['x','y','z','w']);if(![...Object.values(p.position),...Object.values(p.orientation)].every(n=>Number.isFinite(n)&&Math.abs(n)<=1e4)||Math.abs(Math.hypot(...Object.values(p.orientation))-1)>1e-6)throw new TypeError('Invalid swallowtail supports');return{position:{...p.position},orientation:unit(p.orientation)};});
 const a=points[0],b=points[1],normal=rotate(a.orientation,{x:0,y:1,z:0}),other=rotate(b.orientation,{x:0,y:1,z:0}),delta={x:b.position.x-a.position.x,y:b.position.y-a.position.y,z:b.position.z-a.position.z},distance=Math.hypot(delta.x,delta.y,delta.z);
 if(distance<.1||distance>2||normal.y<.9||Math.hypot(normal.x-other.x,normal.y-other.y,normal.z-other.z)>1e-6||Math.abs(delta.x*normal.x+delta.y*normal.y+delta.z*normal.z)>1e-6)throw new TypeError('Invalid swallowtail supports');
 b.orientation=align(a.orientation,b.orientation);
 let phase='resting',elapsed=0,time=0,caught=false,index=0,orientation={...a.orientation},wingBase=0,route=null,ramp=rampTime;
 function pose(){
  let position={...points[index].position},q={...orientation},wingOpen=0,wingPhase=wingBase,legTuck=0,flapBlend=0,flightProgress=0,lift=0;
  if(phase==='opening')wingOpen=smooth(clamp(elapsed/openTime));
  else if(phase==='flying'){
   const p=clamp(elapsed/route.duration),u=smooth(p),s=route.start,e=route.end;flightProgress=p;lift=4*.28*u*(1-u);
   position={x:s.x+(e.x-s.x)*u+normal.x*lift,y:s.y+(e.y-s.y)*u+normal.y*lift,z:s.z+(e.z-s.z)*u+normal.z*lift};
   const air=smooth(clamp((lift-.015)/.08));q=p<.5?slerp(orientation,route.air,air*smooth(clamp(p/.35))):slerp(route.endOrientation,route.air,air*smooth(clamp((1-p)/.35)));
   wingOpen=1;wingPhase=wingBase+TAU*cycles*smooth(p);legTuck=smooth(clamp((lift-.005)/.055));flapBlend=smooth(clamp((lift-.14)/.06));
  }else if(phase==='closing'){position={...route.end};q={...route.endOrientation};wingOpen=1-smooth(clamp(elapsed/closeTime));wingPhase=wingBase+TAU*cycles;}
  return{id:'swallowtail-study-1',position,orientation:q,phase,flightProgress,wingOpen,wingPhase,flapBlend,legTuck,supportClearance:D.rootAboveSupport+lift,time,caught};
 }
 function depart(){
  if(caught||phase!=='resting')return false;
  const next=1-index,start={...points[index].position},end=points[next],yaw=Math.atan2(end.position.x-start.x,end.position.z-start.z),air=align(orientation,{x:0,y:Math.sin(yaw/2),z:0,w:Math.cos(yaw/2)});
  route={start,end:{...end.position},air,endOrientation:align(air,end.orientation),index:next,duration:3+.3*distance};phase='opening';elapsed=0;return true;
 }
 function update(dt){
  dt=Number.isFinite(dt)?Math.max(0,Math.min(.1,dt)):0;if(!dt||caught)return;
  const before=ramp;ramp=Math.min(rampTime,ramp+dt);const integral=t=>{const u=t/rampTime;return rampTime*(u*u*u-.5*u*u*u*u);};
  let left=before<rampTime?integral(ramp)-integral(before)+Math.max(0,dt-(ramp-before)):dt;time+=left;
  while(left>0){const duration=phase==='resting'?8+index:phase==='opening'?openTime:phase==='closing'?closeTime:route.duration,part=Math.min(left,Math.max(0,duration-elapsed));elapsed+=part;left-=part;if(elapsed<duration-1e-12)break;
   if(phase==='resting')depart();else if(phase==='opening'){phase='flying';elapsed=0;}else if(phase==='flying'){phase='closing';elapsed=0;}else{index=route.index;orientation={...route.endOrientation};wingBase+=TAU*cycles;route=null;phase='resting';elapsed=0;}
  }
 }
 return{update,depart,capture(){if(caught)return false;caught=true;return true;},release(){if(!caught)return false;caught=false;ramp=0;if(phase==='resting')depart();return true;},get state(){return pose();}};
}
