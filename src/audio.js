/** Small original synthesized soundscape. No downloads, recordings, or tracking. */
export function createAudio(){
 let ctx,master,windGain,cicadaGain,cicadaPan,chirpTimer=0,lastStep=0,level=.55,active=false;
 const makeNoise=()=>{const b=ctx.createBuffer(1,ctx.sampleRate*3,ctx.sampleRate),d=b.getChannelData(0);let v=0;for(let i=0;i<d.length;i++){v=(v+Math.random()*.16-.08)*.96;d[i]=v;}return b;};
 function start(){
  if(!ctx){
   ctx=new (window.AudioContext||window.webkitAudioContext)();master=ctx.createGain();master.gain.value=level;master.connect(ctx.destination);
   const noise=ctx.createBufferSource();noise.buffer=makeNoise();noise.loop=true;const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=900;windGain=ctx.createGain();windGain.gain.value=.18;noise.connect(filter);filter.connect(windGain);windGain.connect(master);noise.start();
   const osc=ctx.createOscillator();osc.type='sawtooth';osc.frequency.value=3200;const filter2=ctx.createBiquadFilter();filter2.type='bandpass';filter2.frequency.value=3600;filter2.Q.value=3;cicadaGain=ctx.createGain();cicadaGain.gain.value=0;cicadaPan=ctx.createStereoPanner();osc.connect(filter2);filter2.connect(cicadaGain);cicadaGain.connect(cicadaPan);cicadaPan.connect(master);osc.start();
  }
  ctx.resume().catch(()=>{});active=true;master.gain.setTargetAtTime(level,ctx.currentTime,.2);
 }
 function tone(f,d=.14,vol=.06,type='sine',end=f*1.2){if(!ctx||!active)return;const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(f,ctx.currentTime);o.frequency.exponentialRampToValueAtTime(end,ctx.currentTime+d);g.gain.setValueAtTime(.0001,ctx.currentTime);g.gain.exponentialRampToValueAtTime(vol,ctx.currentTime+.015);g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+d);o.connect(g);g.connect(master);o.start();o.stop(ctx.currentTime+d+.02);}
 function noiseBurst(duration,vol,freq){if(!ctx||!active)return;const n=ctx.createBufferSource();n.buffer=makeNoise();const f=ctx.createBiquadFilter(),g=ctx.createGain();f.type='lowpass';f.frequency.value=freq;g.gain.setValueAtTime(vol,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+duration);n.connect(f);f.connect(g);g.connect(master);n.start();n.stop(ctx.currentTime+duration);}
 return {
  start,
  setVolume(v){level=v;if(ctx)master.gain.setTargetAtTime(active?level:0,ctx.currentTime,.1);},
  pause(){active=false;if(ctx)master.gain.setTargetAtTime(0,ctx.currentTime,.2);},
  swing(){noiseBurst(.28,.45,1800);},
  capture(){tone(750,.13,.07,'sine',1100);setTimeout(()=>tone(1150,.19,.05,'sine',900),100);},
  release(){tone(900,.3,.04,'sine',1450);},
  update(dt,player,items,time){
   if(!ctx||!active)return;
   windGain.gain.setTargetAtTime(.15+Math.sin(time*.18)*.04,ctx.currentTime,.3);
   const cicadas=items.filter(i=>i.species==='cicada'&&!i.caught);
   let nearest=null,distance=100;for(const i of cicadas){const d=Math.hypot(i.x-player.x,i.z-player.z);if(d<distance){distance=d;nearest=i;}}
   cicadaGain.gain.setTargetAtTime(Math.max(0,1-distance/30)*(.007+.005*Math.sin(time*21)**2),ctx.currentTime,.05);
   if(nearest){const dx=nearest.x-player.x,dz=nearest.z-player.z;const pan=(dx*Math.cos(player.yaw)-dz*Math.sin(player.yaw))/Math.max(1,distance);cicadaPan.pan.setTargetAtTime(Math.max(-1,Math.min(1,pan)),ctx.currentTime,.1);}
   chirpTimer-=dt;if(chirpTimer<0){chirpTimer=5+Math.random()*7;tone(2200,.12,.025,'sine',3300);setTimeout(()=>tone(2900,.11,.018,'sine',2400),180);}
   lastStep-=dt;if(player.speed>.1&&lastStep<0){lastStep=player.quiet?.7:.48;noiseBurst(.12,player.quiet?.035:.09,500);}
  }
 };
}
