/** A visible perch/patrol cycle. All seconds, route interpolation and wing rates
 * are game tuning, not measured Anax flight or escape behaviour. No Three.js. */
export const ANAX_TIMING=Object.freeze({initialRest:5,rest:4,warning:.30,takeoff:.8,patrol:14,landing:1.1,clearance:.32,wingHz:14});
const XYZ=['x','y','z'],Q=[...XYZ,'w'],TAU=2*Math.PI,clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{const t=clamp(x);return t*t*(3-2*t);};
const mix=(a,b,t)=>Object.fromEntries(XYZ.map(k=>[k,a[k]+(b[k]-a[k])*t]));
function record(v,keys){return !!v&&[Object.prototype,null].includes(Object.getPrototypeOf(v))&&Reflect.ownKeys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k)&&'value'in Object.getOwnPropertyDescriptor(v,k));}
function vector(v,keys=XYZ){if(!record(v,keys)||!keys.every(k=>Number.isFinite(v[k])&&Math.abs(v[k])<=1e4))throw new TypeError('Invalid Anax scalar vector');return Object.fromEntries(keys.map(k=>[k,v[k]]));}
function unit(v,keys){const length=Math.hypot(...keys.map(k=>v[k]));if(length<1e-8)throw new TypeError('Invalid Anax zero direction');return Object.fromEntries(keys.map(k=>[k,v[k]/length]));}
function slerp(a,b,t){let dot=Q.reduce((s,k)=>s+a[k]*b[k],0),sign=dot<0?-1:1;dot=Math.min(1,Math.abs(dot));if(dot>.9995)return unit(Object.fromEntries(Q.map(k=>[k,a[k]+(sign*b[k]-a[k])*t])),Q);const theta=Math.acos(dot),s=Math.sin(theta);return Object.fromEntries(Q.map(k=>[k,(a[k]*Math.sin((1-t)*theta)+sign*b[k]*Math.sin(t*theta))/s]));}
// Local +Z is the head/flight direction; local +Y remains dorsal/up.
function tangentOrientation(v){const yaw=Math.atan2(v.x,v.z),pitch=-Math.atan2(v.y,Math.hypot(v.x,v.z)),sy=Math.sin(yaw/2),cy=Math.cos(yaw/2),sx=Math.sin(pitch/2),cx=Math.cos(pitch/2);return{x:cy*sx,y:sy*cx,z:-sy*sx,w:cy*cx};}
function curve(points,t){const n=points.length,a=t*n,i=Math.min(n-1,Math.floor(a)),u=a-i,p0=points[(i+n-1)%n],p1=points[i],p2=points[(i+1)%n],p3=points[(i+2)%n],position={},tangent={};for(const k of XYZ){const A=2*p1[k],B=-p0[k]+p2[k],C=2*p0[k]-5*p1[k]+4*p2[k]-p3[k],D=-p0[k]+3*p1[k]-3*p2[k]+p3[k];position[k]=.5*(A+B*u+C*u*u+D*u*u*u);tangent[k]=.5*(B+2*C*u+3*D*u*u);}return{position,tangent};}
export function createAnaxStudy(options){
 if(!record(options,['perch','patrol'])||!record(options.perch,['position','orientation','normal']))throw new TypeError('Invalid Anax study options');
 const perch={position:vector(options.perch.position),orientation:unit(vector(options.perch.orientation,Q),Q),normal:unit(vector(options.perch.normal),XYZ)},input=options.patrol;
 if(!Array.isArray(input)||Object.getPrototypeOf(input)!==Array.prototype||input.length<3||input.length>8||Reflect.ownKeys(input).length!==input.length+1)throw new TypeError('Invalid Anax patrol points');
 const points=Array.from({length:input.length},(_,i)=>{const d=Object.getOwnPropertyDescriptor(input,String(i));if(!d||!('value'in d))throw new TypeError('Invalid Anax patrol accessor');return vector(d.value);});
 for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];if(Math.hypot(...XYZ.map(k=>a[k]-b[k]))<.1)throw new TypeError('Invalid Anax repeated patrol point');}
 const first=points[0],second=points[1];if(!points.some(p=>Math.abs((second.x-first.x)*(p.z-first.z)-(second.z-first.z)*(p.x-first.x))>1e-6))throw new TypeError('Invalid Anax collinear patrol');
 // Sampled tangent screening is input hygiene, not a proof of obstacle clearance.
 // Caller/native QA must check its actual finite route and support geometry.
 for(let i=0;i<=points.length*64;i++){const v=curve(points,i/(points.length*64)).tangent;if(Math.hypot(v.x,v.z)<1e-6)throw new TypeError('Invalid Anax patrol tangent');}
 const clear=Object.fromEntries(XYZ.map(k=>[k,perch.position[k]+perch.normal[k]*ANAX_TIMING.clearance])),entry=curve(points,0),flightQ=tangentOrientation(entry.tangent);
 let phase,phaseTime,time,wingPhase,caught,restDuration,pendingRelease;
 function reset(){phase='resting';phaseTime=time=wingPhase=0;caught=false;restDuration=ANAX_TIMING.initialRest;pendingRelease=false;}
 reset();
 function snapshot(){
  const u=phase==='resting'?0:clamp(phaseTime/ANAX_TIMING[phase]);let position={...perch.position},orientation={...perch.orientation},legTuck=0,flightBlend=0;
  if(phase==='warning')flightBlend=smooth(u);
  if(phase==='takeoff'||phase==='landing'){
   // Retrace the clearance corridor on arrival. Rotation occurs only outside
   // .32m normal separation; the long abdomen never pivots at the grip point.
   const v=phase==='takeoff'?u:1-u;
   if(v<=.5){position=mix(perch.position,clear,smooth(v*2));legTuck=0;}
   else{const t=smooth((v-.5)*2);position=mix(clear,entry.position,t);orientation=slerp(perch.orientation,flightQ,t);legTuck=t;}
   flightBlend=phase==='takeoff'?1:smooth((1-u)/.22);
  }
  if(phase==='patrol'){const p=curve(points,smooth(u));position=p.position;orientation=tangentOrientation(p.tangent);legTuck=flightBlend=1;}
  return{phase,phaseTime,time,position,orientation,legTuck,flightBlend,wingPhase,caught};
 }
 function start(){phase='warning';phaseTime=0;pendingRelease=false;}
 function update(dt){dt=Number.isFinite(dt)?Math.max(0,Math.min(.1,dt)):0;if(!dt||caught)return;let left=dt;while(left>1e-12){if(pendingRelease&&phase==='resting')start();const duration=phase==='resting'?restDuration:ANAX_TIMING[phase],part=Math.min(left,Math.max(0,duration-phaseTime));if(phase!=='resting')wingPhase=(wingPhase+TAU*ANAX_TIMING.wingHz*part)%TAU;phaseTime+=part;time+=part;left-=part;if(phaseTime<duration-1e-12)break;const next={resting:'warning',warning:'takeoff',takeoff:'patrol',patrol:'landing',landing:'resting'};phase=next[phase];phaseTime=0;if(phase==='resting')restDuration=ANAX_TIMING.rest;}}
 return{update,reset,capture(){if(caught)return false;caught=true;return true;},release(){if(!caught)return false;caught=false;if(phase==='resting')pendingRelease=true;return true;},disturb(observer){if(caught||phase!=='resting')return false;if(observer!==undefined){if(!observer||![Object.prototype,null].includes(Object.getPrototypeOf(observer))||!['x','z'].every(k=>Object.hasOwn(observer,k)&&'value'in Object.getOwnPropertyDescriptor(observer,k)&&Number.isFinite(observer[k])))return false;}start();return true;},get state(){return snapshot();}};
}
