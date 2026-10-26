/** Supported, opt-in branch response. Human distances/timing/speed are game
 * tuning, not measured wild behaviour. A fixed branch axis is not free pathfinding. */
const TAU=2*Math.PI,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),ease=t=>{const u=clamp(t,0,1);return u*u*(3-2*u);};
export function createBranchRetreatStudy({species,position,heading,scale,motionSeed,retreatBounds,cycleDistance,rootAboveSupport,warningSeconds,retreatDistance,retreatSpeed,jawRest=null,jawWarning=null,warningPulse=false,boundedStepFinish=false}){
 const keys=retreatBounds&&Reflect.ownKeys(retreatBounds);
 if(!retreatBounds||![Object.prototype,null].includes(Object.getPrototypeOf(retreatBounds))||keys.length!==2||!keys.includes('min')||!keys.includes('max')||!keys.every(k=>'value'in Object.getOwnPropertyDescriptor(retreatBounds,k))||![retreatBounds.min,retreatBounds.max].every(Number.isFinite)||retreatBounds.min>0||retreatBounds.max<0||retreatBounds.min>=retreatBounds.max||Math.max(Math.abs(retreatBounds.min),Math.abs(retreatBounds.max))>3)throw new TypeError('Invalid branch retreat bounds');
 const origin={...position},axis={x:Math.sin(heading),z:Math.cos(heading)},halfStep=cycleDistance*scale/2,lo=Math.ceil((retreatBounds.min-1e-10)/halfStep)*halfStep,hi=Math.floor((retreatBounds.max+1e-10)/halfStep)*halfStep,normalEnd=Math.min(.12*scale,hi),normalSpeed=.02*scale;
 if(lo>0||hi<0||hi-lo<halfStep-1e-10)throw new TypeError('Branch range cannot support a step');
 let restNumber=0;
 const rest=(initial=false)=>motionSeed===null?(initial?10:6):3+(((Math.imul(motionSeed^++restNumber,1664525)+1013904223)>>>0)%700)/100;
 const initialWait=rest(true),initialRestNumber=restNumber;
 let time=0,distance=0,direction=1,phase='resting',wait=initialWait,caught=false,warningBlend=0,warningElapsed=0,warningStart=0,move=null,threat=null,lastStimulus=-Infinity,lastReaction=-Infinity;
 const fresh=()=>!!threat&&time-lastStimulus<=.25+1e-10;
 function location(){return{x:origin.x+axis.x*distance,y:origin.y,z:origin.z+axis.z*distance};}
 function awaySign(){const p=location(),dot=(p.x-threat.x)*axis.x+(p.z-threat.z)*axis.z;if(Math.abs(dot)>.02)return Math.sign(dot);const left=distance-lo,right=hi-distance;return Math.abs(right-left)>.02?Math.sign(right-left):((motionSeed??0)&1?1:-1);}
 function retreatTarget(){if(!threat)return distance;const sign=awaySign(),raw=clamp(distance+sign*retreatDistance*scale,lo,hi);return sign>0?Math.floor((raw+1e-10)/halfStep)*halfStep:Math.ceil((raw-1e-10)/halfStep)*halfStep;}
 function warning(){phase='warning';warningElapsed=0;if(warningPulse)warningBlend=0;warningStart=warningBlend;move=null;lastReaction=time;}
 function speedAt(m){if(!m)return 0;const t=m.elapsed;if(m.forelegFinish){const u=clamp(t/m.duration,0,1);return (m.length*(6*u-6*u*u)+m.startSpeed*m.duration*(3*u*u-4*u+1))/m.duration;}if(m.brake)return t<m.cruise?m.startSpeed:m.startSpeed*(1-(t-m.cruise)/m.ramp);if(t<m.ramp)return m.peak*t/m.ramp;if(t>m.duration-m.ramp)return m.peak*(m.duration-t)/m.ramp;return m.peak;}
 function advanceAt(m,t){if(m.forelegFinish){const u=clamp(t/m.duration,0,1);return m.length*(3*u*u-2*u*u*u)+m.startSpeed*m.duration*(u*u*u-2*u*u+u);}if(m.brake){if(t<m.cruise)return m.startSpeed*t;const u=Math.min(m.ramp,t-m.cruise);return m.startSpeed*m.cruise+m.startSpeed*(u-.5*u*u/m.ramp);}if(t<m.ramp)return .5*m.peak*t*t/m.ramp;const acceleration=.5*m.peak*m.ramp;if(t<=m.duration-m.ramp)return acceleration+m.peak*(t-m.ramp);const left=m.duration-t;return m.length-.5*m.peak*left*left/m.ramp;}
 function startMove(target,kind='walking',after='resting',peak=normalSpeed,initialSpeed=0){
  const length=Math.abs(target-distance);if(length<1e-10){move=null;if(after==='warning')warning();else{phase=after;wait=after==='settling'?1.4:rest();}return;}
  const sign=Math.sign(target-distance);direction=sign;
  /* Foreleg-pulse opt-in: finish this planted half-step within .6 s without
   * the old slow-cruise tail, keeping both endpoint velocities continuous. */
  if((boundedStepFinish||warningPulse)&&after==='warning'&&initialSpeed>1e-8){const duration=Math.min(.6,Math.max(.12,2*length/.06),2*length/initialSpeed);move={start:distance,target,length,sign,elapsed:0,duration,forelegFinish:true,startSpeed:initialSpeed,after,blendStart:warningPulse?0:warningBlend};}
  else if(initialSpeed>1e-8){const ramp=Math.min(.30,2*length/initialSpeed),cruise=Math.max(0,(length-.5*initialSpeed*ramp)/initialSpeed),duration=cruise+ramp;move={start:distance,target,length,sign,elapsed:0,duration,ramp,cruise,brake:true,startSpeed:initialSpeed,after,blendStart:warningBlend};}
  else{let ramp=.30,actualPeak=peak;if(length<actualPeak*ramp){ramp=Math.sqrt(length*.30/actualPeak);actualPeak=length/ramp;}move={start:distance,target,length,sign,elapsed:0,duration:length/actualPeak+ramp,ramp,peak:actualPeak,brake:false,after,blendStart:warningBlend};}
  phase=kind;
 }
 function normal(){warningBlend=0;if(distance<-.000001||distance>normalEnd+.000001){startMove(clamp(distance,0,normalEnd),'walking','resting',.04*scale);return;}if(normalEnd<halfStep-1e-10){phase='resting';wait=rest();return;}const target=distance<normalEnd/2?normalEnd:0;startMove(target);}
 function chooseRetreat(){const target=retreatTarget();if(Math.abs(target-distance)<halfStep*.5){phase='cornered';move=null;wait=0;return;}startMove(target,'retreating','settling',retreatSpeed*scale);}
 function completeMove(){const done=move;distance=done.target;move=null;if(done.after==='warning'){warning();return;}warningBlend=0;phase=done.after;wait=phase==='settling'?1.4:rest();}
 function update(dt){
  dt=Number.isFinite(dt)?clamp(dt,0,.1):0;if(!dt||caught)return;let left=dt,steps=0;
  while(left>1e-12&&steps++<12){
   if(move){const part=Math.min(left,move.duration-move.elapsed);move.elapsed+=part;time+=part;left-=part;distance=move.start+move.sign*advanceAt(move,move.elapsed);warningBlend=warningPulse?0:move.after==='warning'?move.blendStart+(.35-move.blendStart)*ease(move.elapsed/move.duration):move.blendStart*(1-ease(move.elapsed/move.duration));if(move.elapsed>=move.duration-1e-10)completeMove();continue;}
   if(phase==='warning'){const part=Math.min(left,warningSeconds-warningElapsed);warningElapsed+=part;time+=part;left-=part;warningBlend=warningPulse?Math.sin(Math.PI*clamp(warningElapsed/warningSeconds,0,1))**2:warningStart+(1-warningStart)*ease(warningElapsed/warningSeconds);if(warningElapsed>=warningSeconds-1e-10)chooseRetreat();continue;}
   if(phase==='cornered'){
    const part=left;time+=part;left=0;warningBlend*=Math.exp(-part*3);
    if(!fresh()){phase='settling';wait=.6;}else if(time-lastReaction>=.8&&Math.abs(retreatTarget()-distance)>=halfStep*.5)warning();continue;
   }
   const part=Math.min(left,Math.max(0,wait));wait-=part;time+=part;left-=part;warningBlend*=Math.exp(-part*6);
   if(wait<=1e-10){if(fresh()){if(Math.abs(retreatTarget()-distance)>=halfStep*.5)warning();else{phase='cornered';lastReaction=time;}}else normal();}
  }
 }
 function disturb(source){
  if(caught||!source||!Number.isFinite(source.x)||!Number.isFinite(source.z)||Math.abs(source.x)>1e4||Math.abs(source.z)>1e4)return false;
  threat={x:source.x,z:source.z};lastStimulus=time;
  if(phase==='warning'||phase==='retreating'||phase==='cornered'||move?.after==='warning'||phase==='settling')return false;
  if(move){const speed=speedAt(move),sign=move.sign,n=sign>0?Math.ceil(distance/halfStep-1e-10):Math.floor(distance/halfStep+1e-10),target=clamp(n*halfStep,lo,hi);startMove(target,'walking','warning',.06*scale,speed);}else warning();return true;
 }
 function snapshot(){const result={id:species+'-study-1',position:location(),heading,pitch:0,walkPhase:distance/(cycleDistance*scale)*TAU,walkSpeed:caught?0:move?move.sign*speedAt(move):0,phase,direction,caught,time,warningBlend:clamp(warningBlend,0,1)};if(jawRest!==null)result.jawOpen=jawRest+(jawWarning-jawRest)*result.warningBlend;return result;}
 return{update,disturb,capture(){if(caught)return false;caught=true;return true;},release(){if(!caught)return false;caught=false;if(phase==='resting')normal();return true;},reset(){time=0;distance=0;direction=1;phase='resting';wait=initialWait;caught=false;warningBlend=0;warningElapsed=0;warningStart=0;move=null;threat=null;lastStimulus=-Infinity;lastReaction=-Infinity;restNumber=initialRestNumber;},get state(){return snapshot();}};
}
