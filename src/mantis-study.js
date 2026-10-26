/** Isolated male-mantis short-flight study. Timing/path/wing rate are game tuning,
 * not measurements. Supports are horizontal body-root poses, not leaf heights.
 */
const TAU=2*Math.PI,openTime=.9,closeTime=.9,rampTime=.5;
const smooth=t=>t*t*(3-2*t),clamp=v=>Math.max(0,Math.min(1,v)),angle=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
export function createMantisStudy(supports) {
 const record=(v,keys)=>{if(!v||![Object.prototype,null].includes(Object.getPrototypeOf(v))||Reflect.ownKeys(v).length!==keys.length||!keys.every(k=>Object.prototype.hasOwnProperty.call(v,k)&&'value' in Object.getOwnPropertyDescriptor(v,k)))throw new TypeError('Invalid mantis supports');};
 if(!Array.isArray(supports)||supports.length<2||supports.length>3||Reflect.ownKeys(supports).length!==supports.length+1)throw new TypeError('Invalid mantis supports');
 const perches=Array.from({length:supports.length},(_,i)=>{
  const d=Object.getOwnPropertyDescriptor(supports,String(i));if(!d||!('value' in d))throw new TypeError('Invalid mantis supports');
  const v=d.value;record(v,['position','heading']);record(v.position,['x','y','z']);
  if(![v.heading,...Object.values(v.position)].every(n=>Number.isFinite(n)&&Math.abs(n)<=1e4))throw new TypeError('Invalid mantis supports');
  return{position:{...v.position},heading:v.heading};
 });
 for(let a=0;a<perches.length;a++)for(let b=a+1;b<perches.length;b++){
  const p=perches[a].position,q=perches[b].position,d=Math.hypot(p.x-q.x,p.y-q.y,p.z-q.z);
  if(d<.1||d>3||Math.abs(p.y-q.y)>.5)throw new TypeError('Invalid mantis supports');
 }
 let phase='resting',elapsed=0,time=0,caught=false,perch=0,heading=perches[0].heading,wingBase=0,route=null,ramp=rampTime;
 function pose(){
  let position={...perches[perch].position},bodyHeading=heading,wingOpen=0,wingPhase=wingBase,legTuck=0,headYaw=0;
  if(phase==='resting')headYaw=(perch%2?-.12:.12)*smooth(clamp((elapsed-3)/1.2));
  else if(phase==='opening'){wingOpen=smooth(clamp(elapsed/openTime));headYaw=route.headStart*(1-wingOpen);}
  else if(phase==='flying'){
   const p=clamp(elapsed/route.duration),u=smooth(p),start=route.start,end=route.end;
   position={x:start.x+(end.x-start.x)*u,y:start.y+(end.y-start.y)*u+1.05*u*(1-u),z:start.z+(end.z-start.z)*u};
   bodyHeading=p<.25?heading+angle(heading,route.flightHeading)*smooth(p/.25):route.flightHeading;
   if(p>.75)bodyHeading=route.flightHeading+(route.endHeading-route.flightHeading)*smooth((p-.75)/.25);
   wingOpen=1;wingPhase=wingBase+TAU*32*smooth(p);legTuck=smooth(clamp(p/.2))*smooth(clamp((1-p)/.2));
  }else if(phase==='closing'){position={...route.end};bodyHeading=route.endHeading;wingOpen=1-smooth(clamp(elapsed/closeTime));wingPhase=wingBase+TAU*32;}
  return{id:'mantis-study-1',phase,position,heading:bodyHeading,pitch:0,wingOpen,wingPhase,legTuck,headYaw,caught,time};
 }
 function depart(player=null){
  if(caught||phase!=='resting')return false;
  const next=(perch+1)%perches.length,valid=player&&Number.isFinite(player.x)&&Number.isFinite(player.z);
  const choices=perches.map((s,index)=>({s,index})).filter(c=>c.index!==perch);
  if(valid)choices.sort((a,b)=>Math.hypot(b.s.position.x-player.x,b.s.position.z-player.z)-Math.hypot(a.s.position.x-player.x,a.s.position.z-player.z)||((a.index-perch+perches.length)%perches.length)-((b.index-perch+perches.length)%perches.length));
  const selected=valid?choices[0]:choices.find(c=>c.index===next),start=pose(),end=selected.s.position;
  const flightHeading=heading+angle(heading,Math.atan2(end.x-start.position.x,end.z-start.position.z));
  route={start:start.position,end:{...end},index:selected.index,headStart:start.headYaw,flightHeading,endHeading:flightHeading+angle(flightHeading,selected.s.heading),duration:3.5+.3*Math.hypot(end.x-start.position.x,end.y-start.position.y,end.z-start.position.z)};
  phase='opening';elapsed=0;return true;
 }
 function update(dt){
  dt=Number.isFinite(dt)?Math.max(0,Math.min(.1,dt)):0;if(!dt||caught)return;
  const oldRamp=ramp;ramp=Math.min(rampTime,ramp+dt);const integral=t=>{const u=t/rampTime;return rampTime*(u*u*u-.5*u*u*u*u);};
  let left=oldRamp<rampTime?integral(ramp)-integral(oldRamp)+Math.max(0,dt-(ramp-oldRamp)):dt;time+=left;
  while(left>0){
   const duration=phase==='resting'?24+2*perch:phase==='opening'?openTime:phase==='closing'?closeTime:route.duration;
   const advance=Math.min(left,Math.max(0,duration-elapsed));elapsed+=advance;left-=advance;
   if(elapsed<duration-1e-12)break;
   if(phase==='resting')depart();
   else if(phase==='opening'){phase='flying';elapsed=0;}
   else if(phase==='flying'){phase='closing';elapsed=0;}
   else{perch=route.index;heading=route.endHeading;wingBase+=TAU*32;route=null;phase='resting';elapsed=0;}
  }
 }
 return {update,depart,capture(){if(caught)return false;caught=true;return true;},release(){if(!caught)return false;caught=false;ramp=0;if(phase==='resting')depart();return true;},get state(){return pose();}};
}
