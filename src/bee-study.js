/** Independent worker-bee flower visit. Timings, arc and wing cycles are game
 * tuning, not measured flight or wingbeat rates. Supports are horizontal roots. */
const TAU=2*Math.PI,openTime=.45,closeTime=.45,rampTime=.5,wingCycles=18;
const smooth=t=>t*t*(3-2*t),clamp=v=>Math.max(0,Math.min(1,v)),angle=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
export function createBeeStudy(supports){
 const record=(v,keys)=>{if(!v||![Object.prototype,null].includes(Object.getPrototypeOf(v))||Reflect.ownKeys(v).length!==keys.length||!keys.every(k=>Object.prototype.hasOwnProperty.call(v,k)&&'value'in Object.getOwnPropertyDescriptor(v,k)))throw new TypeError('Invalid bee supports');};
 if(!Array.isArray(supports)||supports.length!==2||Reflect.ownKeys(supports).length!==3)throw new TypeError('Invalid bee supports');
 const flowers=Array.from({length:2},(_,i)=>{const d=Object.getOwnPropertyDescriptor(supports,String(i));if(!d||!('value'in d))throw new TypeError('Invalid bee supports');const p=d.value;record(p,['position','heading']);record(p.position,['x','y','z']);if(![p.heading,...Object.values(p.position)].every(n=>Number.isFinite(n)&&Math.abs(n)<=1e4))throw new TypeError('Invalid bee supports');return{position:{...p.position},heading:p.heading};});
 const a=flowers[0].position,b=flowers[1].position,distance=Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);if(distance<.1||distance>2||Math.abs(a.y-b.y)>.3)throw new TypeError('Invalid bee supports');
 let phase='resting',elapsed=0,time=0,caught=false,flower=0,heading=flowers[0].heading,wingBase=0,route=null,ramp=rampTime;
 function pose(){
  let position={...flowers[flower].position},bodyHeading=heading,pitch=0,wingOpen=0,wingPhase=wingBase,legTuck=0;
  if(phase==='opening')wingOpen=smooth(clamp(elapsed/openTime));
  else if(phase==='flying'){
   const p=clamp(elapsed/route.duration),u=smooth(p),s=route.start,e=route.end;
   position={x:s.x+(e.x-s.x)*u,y:s.y+(e.y-s.y)*u+.8*u*(1-u),z:s.z+(e.z-s.z)*u};
   bodyHeading=p<.25?heading+angle(heading,route.flightHeading)*smooth(p/.25):route.flightHeading;
   if(p>.75)bodyHeading=route.flightHeading+(route.endHeading-route.flightHeading)*smooth((p-.75)/.25);
   // Pitch vanishes cubically near contact, more quickly than root clearance.
   pitch=-.10*Math.sin(TAU*p)*Math.sin(Math.PI*p)**2;
   wingOpen=1;wingPhase=wingBase+TAU*wingCycles*smooth(p);legTuck=smooth(clamp(p/.2))*smooth(clamp((1-p)/.2));
  }else if(phase==='closing'){position={...route.end};bodyHeading=route.endHeading;wingOpen=1-smooth(clamp(elapsed/closeTime));wingPhase=wingBase+TAU*wingCycles;}
  return{id:'bee-study-1',phase,position,heading:bodyHeading,pitch,wingOpen,wingPhase,legTuck,caught,time};
 }
 function depart(){
  if(caught||phase!=='resting')return false;
  const next=1-flower,start=pose().position,end=flowers[next],flightHeading=heading+angle(heading,Math.atan2(end.position.x-start.x,end.position.z-start.z));
  route={start,end:{...end.position},index:next,flightHeading,endHeading:flightHeading+angle(flightHeading,end.heading),duration:2+.4*distance};phase='opening';elapsed=0;return true;
 }
 function update(dt){
  dt=Number.isFinite(dt)?Math.max(0,Math.min(.1,dt)):0;if(!dt||caught)return;
  const before=ramp;ramp=Math.min(rampTime,ramp+dt);const integral=t=>{const u=t/rampTime;return rampTime*(u*u*u-.5*u*u*u*u);};
  let left=before<rampTime?integral(ramp)-integral(before)+Math.max(0,dt-(ramp-before)):dt;time+=left;
  while(left>0){
   const duration=phase==='resting'?7+flower:phase==='opening'?openTime:phase==='closing'?closeTime:route.duration,part=Math.min(left,Math.max(0,duration-elapsed));elapsed+=part;left-=part;if(elapsed<duration-1e-12)break;
   if(phase==='resting')depart();else if(phase==='opening'){phase='flying';elapsed=0;}else if(phase==='flying'){phase='closing';elapsed=0;}else{flower=route.index;heading=route.endHeading;wingBase+=TAU*wingCycles;route=null;phase='resting';elapsed=0;}
  }
 }
 return{update,depart,capture(){if(caught)return false;caught=true;return true;},release(){if(!caught)return false;caught=false;ramp=0;if(phase==='resting')depart();return true;},get state(){return pose();}};
}
