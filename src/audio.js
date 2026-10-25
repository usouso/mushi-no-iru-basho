/** Small original synthesized soundscape. No downloads, recordings, or tracking. */
export function createAudio(){
 let ctx,master,windGain,lastStep=0,level=.25,active=false,ready=false,disposed=false,contextBusy=false,contextRunning=false,lifecycle=0,soundEpoch=0;
 const timers=new Set(),oneShots=new Set(),loops=new Set();
 function gain(value){if(!master)return;const now=ctx.currentTime;master.gain.cancelScheduledValues?.(now);master.gain.setValueAtTime(value,now);}
 function clearSounds(){soundEpoch++;for(const timer of timers)clearTimeout(timer);timers.clear();for(const source of oneShots){try{source.stop();}catch{}}oneShots.clear();}
 function later(fn,delay){if(!active||!ready||disposed||level===0)return;const epoch=soundEpoch;const timer=setTimeout(()=>{timers.delete(timer);if(active&&ready&&!disposed&&epoch===soundEpoch)fn();},delay);timers.add(timer);}
 function track(source){oneShots.add(source);source.onended=()=>oneShots.delete(source);return source;}
 // Serialize context operations so a late suspend cannot defeat a newer start.
 // Gain stays at exactly zero until the latest requested resume has settled.
 function reconcileContext(){
  if(!ctx||disposed||contextBusy)return;
  if(typeof ctx.state==='string')contextRunning=ctx.state==='running';
  const target=active,version=lifecycle;
  if(contextRunning===target){ready=target;gain(ready?level:0);return;}
  contextBusy=true;
  const finish=ok=>{contextBusy=false;if(ok)contextRunning=target;if(disposed)return;ready=ok&&contextRunning&&active;gain(ready?level:0);if(active!==target||lifecycle!==version)reconcileContext();};
  try{const operation=target?ctx.resume?.():ctx.suspend?.();if(operation?.then)operation.then(()=>finish(true),()=>finish(false));else finish(true);}catch{finish(false);}
 }
 const makeNoise=()=>{const b=ctx.createBuffer(1,ctx.sampleRate*3,ctx.sampleRate),d=b.getChannelData(0);let v=0;for(let i=0;i<d.length;i++){v=(v+Math.random()*.16-.08)*.96;d[i]=v;}return b;};
 function start(){
  if(disposed)return;
  if(!ctx){
   ctx=new (window.AudioContext||window.webkitAudioContext)();master=ctx.createGain();master.gain.value=0;contextRunning=ctx.state===undefined||ctx.state==='running';master.connect(ctx.destination);
   const noise=ctx.createBufferSource();noise.buffer=makeNoise();noise.loop=true;const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=700;windGain=ctx.createGain();windGain.gain.value=.08;noise.connect(filter);filter.connect(windGain);windGain.connect(master);noise.start();loops.add(noise);
  }
  active=true;lifecycle++;reconcileContext();
 }
 function tone(f,d=.14,vol=.06,type='sine',end=f*1.2){if(!ctx||!active||!ready||disposed||level===0)return;const o=track(ctx.createOscillator()),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(f,ctx.currentTime);o.frequency.exponentialRampToValueAtTime(end,ctx.currentTime+d);g.gain.setValueAtTime(.0001,ctx.currentTime);g.gain.exponentialRampToValueAtTime(vol,ctx.currentTime+.015);g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+d);o.connect(g);g.connect(master);o.start();o.stop(ctx.currentTime+d+.02);}
 function noiseBurst(duration,vol,freq){if(!ctx||!active||!ready||disposed||level===0)return;const n=track(ctx.createBufferSource());n.buffer=makeNoise();const f=ctx.createBiquadFilter(),g=ctx.createGain();f.type='lowpass';f.frequency.value=freq;g.gain.setValueAtTime(vol,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+duration);n.connect(f);f.connect(g);g.connect(master);n.start();n.stop(ctx.currentTime+duration);}
 return {
  start,
  setVolume(v){if(disposed||!Number.isFinite(Number(v)))return;level=Math.max(0,Math.min(1,Number(v)));gain(active&&ready?level:0);if(level===0)clearSounds();},
  pause(){if(disposed)return;active=false;ready=false;lifecycle++;gain(0);clearSounds();reconcileContext();},
  dispose(){if(disposed)return;disposed=true;active=false;ready=false;lifecycle++;gain(0);clearSounds();for(const source of loops){try{source.stop();}catch{}}loops.clear();master?.disconnect?.();try{ctx?.close?.()?.catch?.(()=>{});}catch{}},
  swing(){noiseBurst(.28,.25,1800);},
  capture(){tone(750,.13,.045,'sine',1100);later(()=>tone(1150,.19,.035,'sine',900),100);},
  release(){tone(900,.3,.025,'sine',1450);},
  update(dt,player,items,time){
   if(!ctx||!active||!ready||disposed)return;
   // Ambient sound is only quiet, low-pass wind: no cicada oscillator or bird timers.
   windGain.gain.setTargetAtTime(.08+Math.sin(time*.18)*.02,ctx.currentTime,.3);
   lastStep-=dt;if(player.speed>.1&&lastStep<0){lastStep=player.quiet?.7:player.running?.34:.48;noiseBurst(.12,player.quiet?.02:.055,500);}
  }
 };
}
