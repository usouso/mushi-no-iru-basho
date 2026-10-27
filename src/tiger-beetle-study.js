/** Three supported stops and a short visible flight. Seconds, distances, wing
 * cycles and reactions are game tuning, not measured Sophiodela behaviour. */
const TAU=2*Math.PI,clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{const t=clamp(x);return t*t*(3-2*t);};
export const TIGER_BEETLE_TIMING=Object.freeze({warning:.30,opening:.28,unfolding:.32,takeoff:.55,flying:1.35,landing:.55,folding:.32,closing:.28,lift:.24,arc:.15});
const phases=['warning','opening','unfolding','takeoff','flying','landing','folding','closing'];
function record(v,keys){return !!v&&[Object.prototype,null].includes(Object.getPrototypeOf(v))&&Reflect.ownKeys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k)&&'value'in Object.getOwnPropertyDescriptor(v,k));}
function normal(q){return{x:2*(q.x*q.y-q.w*q.z),y:1-2*(q.x*q.x+q.z*q.z),z:2*(q.y*q.z+q.w*q.x)};}
function mix(a,b,t){return{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t};}
function quaternion(a,b,t){let sign=a.x*b.x+a.y*b.y+a.z*b.z+a.w*b.w<0?-1:1;const q={};for(const k of['x','y','z','w'])q[k]=a[k]+(sign*b[k]-a[k])*t;const n=Math.hypot(q.x,q.y,q.z,q.w);for(const k of Object.keys(q))q[k]/=n;return q;}
export function createTigerBeetleStudy(options){
 if(!options||![Object.prototype,null].includes(Object.getPrototypeOf(options))||Reflect.ownKeys(options).some(k=>!['stops','motionSeed'].includes(k)||!('value'in Object.getOwnPropertyDescriptor(options,k)))||!Object.hasOwn(options,'stops'))throw new TypeError('Invalid tiger-beetle study options');
 const {stops,motionSeed=1729}=options;
 if(!Number.isInteger(motionSeed)||motionSeed<0||motionSeed>0xffffffff||!Array.isArray(stops)||Object.getPrototypeOf(stops)!==Array.prototype||stops.length!==3||Reflect.ownKeys(stops).length!==4)throw new TypeError('Invalid tiger-beetle stops');
 const points=Array.from({length:3},(_,i)=>{const d=Object.getOwnPropertyDescriptor(stops,String(i));if(!d||!('value'in d))throw new TypeError('Invalid tiger-beetle stop accessor');const s=d.value;if(!record(s,['position','orientation'])||!record(s.position,['x','y','z'])||!record(s.orientation,['x','y','z','w'])||![...Object.values(s.position),...Object.values(s.orientation)].every(n=>Number.isFinite(n)&&Math.abs(n)<=1e4)||Math.abs(Math.hypot(...Object.values(s.orientation))-1)>1e-8||normal(s.orientation).y<.95)throw new TypeError('Invalid tiger-beetle support pose');return{position:{...s.position},orientation:{...s.orientation}};});
 for(let i=0;i<3;i++)for(let j=i+1;j<3;j++){const a=points[i].position,b=points[j].position,d=Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);if(d<.5||d>2.2||Math.abs(a.y-b.y)>.25)throw new TypeError('Invalid tiger-beetle stop spacing');}
 let phase,elapsed,time,caught,index,target,wingPhase,cycle,wait,pendingRelease,lastObserver,direction;
 const rest=()=>3+((motionSeed%997+cycle*173)%997)/997*2;
 function reset(){phase='resting';elapsed=0;time=0;caught=false;index=0;target=0;wingPhase=0;cycle=0;wait=rest();pendingRelease=false;lastObserver=null;direction=1;}
 reset();
 function start(){
  const choices=index===0?[1]:index===2?[1]:[0,2];
  if(choices.length===2&&lastObserver){const distance=i=>Math.hypot(points[i].position.x-lastObserver.x,points[i].position.z-lastObserver.z);target=distance(0)>distance(2)?0:2;}else target=choices.length===1?choices[0]:index+direction;direction=Math.sign(target-index);
  phase='warning';elapsed=0;pendingRelease=false;
 }
 function snapshot(){
  const a=points[index],b=points[target],n=normal(a.orientation),m=normal(b.orientation),T=TIGER_BEETLE_TIMING,u=phase==='resting'?0:clamp(elapsed/T[phase]);let position={...a.position},orientation={...a.orientation},elytra=0,unfold=0,tuck=0,flapAmplitude=0;
  if(phase==='warning')elytra=.12*Math.sin(Math.PI*u)**2;
  if(phase==='opening')elytra=ease(u);
  if(phase==='unfolding'){elytra=1;unfold=ease(u);}
  if(['takeoff','flying','landing'].includes(phase)){
   elytra=unfold=1;const lift=phase==='takeoff'?T.lift*ease(u):phase==='landing'?T.lift*(1-ease(u)):T.lift;
   if(phase==='takeoff')position={x:a.position.x+n.x*lift,y:a.position.y+n.y*lift,z:a.position.z+n.z*lift};
   else if(phase==='landing'){position={x:b.position.x+m.x*lift,y:b.position.y+m.y*lift,z:b.position.z+m.z*lift};orientation={...b.orientation};}
   else{const from={x:a.position.x+n.x*T.lift,y:a.position.y+n.y*T.lift,z:a.position.z+n.z*T.lift},to={x:b.position.x+m.x*T.lift,y:b.position.y+m.y*T.lift,z:b.position.z+m.z*T.lift};position=mix(from,to,ease(u));position.y+=T.arc*Math.sin(Math.PI*u)**2;const yaw=Math.atan2(b.position.x-a.position.x,b.position.z-a.position.z),flight={x:0,y:Math.sin(yaw/2),z:0,w:Math.cos(yaw/2)};if(flight.y*a.orientation.y+flight.w*a.orientation.w<0)for(const k of Object.keys(flight))flight[k]*=-1;orientation=u<.25?quaternion(a.orientation,flight,ease(u/.25)):u>.75?quaternion(flight,b.orientation,ease((u-.75)/.25)):flight;}
   tuck=ease((lift-.03)/.13);flapAmplitude=ease((lift-.08)/.10);
  }
  if(phase==='folding'||phase==='closing'){position={...b.position};orientation={...b.orientation};elytra=phase==='closing'?1-ease(u):1;unfold=phase==='folding'?1-ease(u):0;}
  return{id:'tigerbeetle-study-1',time,phase,position,orientation,walkPhase:0,walkSpeed:0,flightPose:{elytra,unfold,flapPhase:wingPhase,flapAmplitude,tuck},caught,stopIndex:index,targetIndex:target};
 }
 function update(dt){dt=Number.isFinite(dt)?Math.max(0,Math.min(.1,dt)):0;if(!dt||caught)return;let left=dt,steps=0;while(left>1e-12){if(++steps>12)throw new Error('Tiger-beetle transition failed to advance');if(pendingRelease&&phase==='resting')start();const duration=phase==='resting'?wait:TIGER_BEETLE_TIMING[phase],part=Math.min(left,Math.max(0,duration-elapsed));if(['takeoff','flying','landing'].includes(phase))wingPhase+=part*TAU*14;elapsed+=part;time+=part;left-=part;if(elapsed<duration-1e-12)break;if(phase==='resting')start();else{const next=phases.indexOf(phase)+1;if(next===phases.length){index=target;cycle++;phase='resting';wait=rest();lastObserver=null;}else phase=phases[next];elapsed=0;}}}
 return{update,disturb(observer){if(caught||phase!=='resting')return false;if(observer!==undefined){if(!observer||![Object.prototype,null].includes(Object.getPrototypeOf(observer))||!['x','z'].every(k=>Object.hasOwn(observer,k)&&'value'in Object.getOwnPropertyDescriptor(observer,k)&&Number.isFinite(observer[k])&&Math.abs(observer[k])<=1e4))return false;lastObserver={x:observer.x,z:observer.z};}start();return true;},capture(){if(caught)return false;caught=true;return true;},release(){if(!caught)return false;caught=false;if(phase==='resting')pendingRelease=true;return true;},reset,get state(){return snapshot();}};
}
