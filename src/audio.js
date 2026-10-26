/** Brief-1 trial samples with the original wind/footstep/action fallbacks.
 * Gains/radii are game tuning, not a claim of measured listening comfort.
 */
import { AUDIO_ASSETS as ASSETS } from './audio-assets.js?v=0.24.0&b=8d4c904e2377';
export function createAudio({assetBaseURL}={}){
 const MAX_SHOTS=6,LOAD_PARALLELISM=3;
 let ctx,master,windGain,lastStep=0,level=.25,active=false,observing=false,ready=false,disposed=false,contextBusy=false,contextRunning=false,lifecycle=0,soundEpoch=0;
 let battling=false,battleExchangeNumber=0,battleContactNumber=0,battleResultPlayed=false;
 let habitat='meadow',fieldTime=0,nextCicada=12,cicada=null,bgm=null,bgmOffset=0,loading=false,loadAbort,pendingRelease=null;
 const timers=new Set(),oneShots=new Set(),loops=new Set(),buffers=new Map(),previous=new Map(),walkers=new Map();
 const playable=()=>!!ctx&&active&&ready&&!disposed&&level>0;
 const choose=list=>list[Math.floor(Math.random()*list.length)];
 function gain(value){if(!master)return;const now=ctx.currentTime;master.gain.cancelScheduledValues?.(now);master.gain.setValueAtTime(value,now);}
 function disconnect(nodes){for(const node of nodes){try{node.disconnect?.();}catch{}}}
 function stop(record){if(!record)return;try{record.source.stop();}catch{}record.finish();}
 function clearPendingRelease(){if(!pendingRelease)return;clearTimeout(pendingRelease.timer);timers.delete(pendingRelease.timer);pendingRelease=null;}
 function clearSounds(){soundEpoch++;clearPendingRelease();for(const timer of timers)clearTimeout(timer);timers.clear();for(const record of [...oneShots])stop(record);walkers.clear();cicada=null;}
 function later(fn,delay){if(!playable()||timers.size>=MAX_SHOTS)return;const epoch=soundEpoch;const timer=setTimeout(()=>{timers.delete(timer);if(playable()&&epoch===soundEpoch)fn();},delay);timers.add(timer);}
 function track(source,nodes,onFinish){
  let finished=false;const record={source,nodes,finish(){if(finished)return;finished=true;oneShots.delete(record);source.onended=null;disconnect(nodes);onFinish?.(record);}};
  oneShots.add(record);source.onended=record.finish;return record;
 }
 function stopBGM(){if(!bgm)return;const old=bgm;bgm=null;bgmOffset=(old.offset+Math.max(0,ctx.currentTime-old.started))%old.end;try{old.source.stop();}catch{}old.source.onended=null;disconnect(old.nodes);}
 function syncBGM(){
  if(!playable()||(!battling&&habitat!=='meadow')){stopBGM();return;}
  const volume=battling?.07:.12;
  if(bgm){bgm.gain.gain.setTargetAtTime(volume,ctx.currentTime,.12);return;}
  const buffer=buffers.get(ASSETS.bgm);if(!buffer)return;
  const end=Math.min(36.36,buffer.duration);if(!(end>0))return;
  const source=ctx.createBufferSource(),g=ctx.createGain();source.buffer=buffer;source.loop=true;source.loopStart=0;source.loopEnd=end;g.gain.setValueAtTime(volume,ctx.currentTime);source.connect(g);g.connect(master);
  const record={source,gain:g,nodes:[source,g],started:ctx.currentTime,offset:bgmOffset%end,end};bgm=record;
  source.onended=()=>{if(bgm===record)bgm=null;disconnect(record.nodes);};
  try{source.start(0,record.offset);}catch{bgm=null;disconnect(record.nodes);}
 }
 function releaseTone(){tone(900,.3,.025,'sine',1450);}
 function readySounds(){syncBGM();if(playable()&&pendingRelease){const valid=Date.now()<=pendingRelease.until;clearPendingRelease();if(valid)releaseTone();}}
 // Serialize context operations; old suspend/resume completions cannot unmute
 // a newer pause. No new graph is made on resume.
 function reconcileContext(){
  if(!ctx||disposed||contextBusy)return;
  if(typeof ctx.state==='string')contextRunning=ctx.state==='running';
  const target=active,version=lifecycle;
  if(contextRunning===target){ready=target;gain(ready?level:0);readySounds();return;}
  contextBusy=true;
  const finish=ok=>{contextBusy=false;if(ok)contextRunning=target;if(disposed)return;ready=ok&&contextRunning&&active;gain(ready?level:0);if(!ok)clearPendingRelease();readySounds();if(active!==target||lifecycle!==version)reconcileContext();};
  try{const operation=target?ctx.resume?.():ctx.suspend?.();if(operation?.then)operation.then(()=>finish(true),()=>finish(false));else finish(true);}catch{finish(false);}
 }
 const makeNoise=()=>{const b=ctx.createBuffer(1,ctx.sampleRate*3,ctx.sampleRate),d=b.getChannelData(0);let v=0;for(let i=0;i<d.length;i++){v=(v+Math.random()*.16-.08)*.96;d[i]=v;}return b;};
 function decode(bytes){return new Promise((resolve,reject)=>{try{const p=ctx.decodeAudioData(bytes,resolve,reject);p?.then?.(resolve,reject);}catch(error){reject(error);}});}
 function loadAssets(){
  // In pure-simulation/data-URL tests no fetch means no URL construction either.
  if(loading||typeof window.fetch!=='function'||typeof ctx.decodeAudioData!=='function')return;loading=true;
  let base,query;
  try{
   base=new URL(assetBaseURL??'../assets/audio/',import.meta.url);
   const page=window.location?.href?new URL(window.location.href):null;
   if(page&&base.origin!==page.origin)throw new Error('Audio assets must be same-origin');
   if(!['http:','https:','file:'].includes(base.protocol))throw new Error('Invalid audio base');
   // Build writes the same version/content token on every module edge. Carry
   // it to samples without changing physical asset names or fetching externally.
   query=new URL(import.meta.url).search;
  }catch{return;}
  const Controller=window.AbortController||globalThis.AbortController;loadAbort=Controller?new Controller():null;
  const names=[...new Set(Object.values(ASSETS).flat())];let index=0;
  async function worker(){
   while(index<names.length&&!disposed){const name=names[index++];try{
    const url=new URL(name+'.ogg',base);url.search=query;
    const response=await window.fetch(url.href,{mode:'same-origin',credentials:'same-origin',redirect:'error',...(loadAbort?{signal:loadAbort.signal}:{})});
    if(disposed)return;if(!response.ok)throw new Error('Audio response failed');
    const bytes=await response.arrayBuffer();if(disposed)return;
    const buffer=await decode(bytes);if(disposed)return;
    if(!buffer||!Number.isFinite(buffer.duration)||buffer.duration<=0)throw new Error('Invalid audio buffer');
    buffers.set(name,buffer);if(name===ASSETS.bgm)syncBGM();
   }catch{/* Per-file failure: original action fallback, silent new ambience. */}}
  }
  for(let i=0;i<LOAD_PARALLELISM;i++)void worker();
 }
 function start(){
  if(disposed)return;
  if(!ctx){
   ctx=new (window.AudioContext||window.webkitAudioContext)();master=ctx.createGain();master.gain.value=0;contextRunning=ctx.state===undefined||ctx.state==='running';master.connect(ctx.destination);
   const noise=ctx.createBufferSource();noise.buffer=makeNoise();noise.loop=true;const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=700;windGain=ctx.createGain();windGain.gain.value=.08;noise.connect(filter);filter.connect(windGain);windGain.connect(master);noise.start();loops.add({source:noise,nodes:[noise,filter,windGain]});
  }
  if(battling)clearSounds();battling=false;battleExchangeNumber=0;battleContactNumber=0;battleResultPlayed=false;
  observing=false;active=true;lifecycle++;windGain.gain.cancelScheduledValues?.(ctx.currentTime);windGain.gain.setValueAtTime(.08,ctx.currentTime);reconcileContext();loadAssets();
 }
 function tone(f,d=.14,vol=.06,type='sine',end=f*1.2,delay=0){if(!playable()||oneShots.size>=MAX_SHOTS)return;const at=ctx.currentTime+delay,o=ctx.createOscillator(),g=ctx.createGain();const record=track(o,[o,g]);o.type=type;o.frequency.setValueAtTime(f,at);o.frequency.exponentialRampToValueAtTime(end,at+d);g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(vol,at+.015);g.gain.exponentialRampToValueAtTime(.0001,at+d);o.connect(g);g.connect(master);try{o.start(at);o.stop(at+d+.02);}catch{stop(record);}}
 function noiseBurst(duration,vol,freq,delay=0){if(!playable()||oneShots.size>=MAX_SHOTS)return;const at=ctx.currentTime+delay,n=ctx.createBufferSource();n.buffer=makeNoise();const f=ctx.createBiquadFilter(),g=ctx.createGain(),record=track(n,[n,f,g]);f.type='lowpass';f.frequency.value=freq;g.gain.setValueAtTime(vol,at);g.gain.exponentialRampToValueAtTime(.0001,at+duration);n.connect(f);f.connect(g);g.connect(master);try{n.start(at);n.stop(at+duration);}catch{stop(record);}}
 function spatial(player,item,radius){
  const dx=item.x-player.x,dz=item.z-player.z,dy=Number.isFinite(item.y)&&Number.isFinite(player.y)?item.y-player.y:0,distance=Math.hypot(dx,dy,dz);
  if(!Number.isFinite(distance)||distance>=radius)return null;
  const yaw=Number.isFinite(player.yaw)?player.yaw:0,horizontal=Math.hypot(dx,dz);
  return {attenuation:(1-distance/radius)**2,pan:horizontal?Math.max(-1,Math.min(1,(dx*Math.cos(yaw)-dz*Math.sin(yaw))/horizontal)):0};
 }
 function position(record,where,vol){if(!record||!where)return;record.gain.gain.setTargetAtTime(vol*where.attenuation,ctx.currentTime,.06);record.panner?.pan.setTargetAtTime(where.pan,ctx.currentTime,.06);}
 function sample(name,vol,{where=null,offset=0,duration,onFinish}={}){
  const buffer=buffers.get(name);if(!buffer||!playable()||oneShots.size>=MAX_SHOTS)return null;
  const length=Math.min(duration??buffer.duration,buffer.duration-offset);if(!(length>0))return null;
  const source=ctx.createBufferSource(),g=ctx.createGain(),panner=where&&ctx.createStereoPanner?ctx.createStereoPanner():null,nodes=[source,g,...(panner?[panner]:[])];
  source.buffer=buffer;g.gain.setValueAtTime(vol*(where?.attenuation??1),ctx.currentTime);source.connect(g);if(panner){panner.pan.setValueAtTime(where.pan,ctx.currentTime);g.connect(panner);panner.connect(master);}else g.connect(master);
  const record=track(source,nodes,onFinish);record.gain=g;record.panner=panner;record.ends=fieldTime+length;record.name=name;record.endAt=ctx.currentTime+length;
  try{source.start(0,offset,length);source.stop(ctx.currentTime+length);}catch{stop(record);return null;}return record;
 }
 function insectSounds(player,items,edges){
  for(const [id,record]of [...walkers]){const item=items.find(i=>i.id===id),where=item&&spatial(player,item,2.2);if(!item||item.caught||item.state!=='walking'||!(item.walkSpeed>0)||!where||record.ends<=fieldTime)stop(record);else position(record,where,.3);}
  if(cicada){const item=items.find(i=>i.id===cicada.id),where=item&&spatial(player,item,12);if(!item||item.caught||!item.resting||!where||cicada.record.ends<=fieldTime){stop(cicada.record);nextCicada=Math.max(nextCicada,fieldTime+25+Math.random()*15);}else position(cicada.record,where,.18);}
  // Observation freezes creature locomotion. Let an existing brief effect end,
  // but never renew walking loops or infer new jumps from those frozen poses.
  if(!observing)for(const {item,before}of edges){if(item.caught)continue;
   if(item.species==='grasshopper'&&before&&before.airborne!==!!item.airborne){const where=spatial(player,item,6);if(where)sample(choose(item.airborne?ASSETS.takeoff:ASSETS.landing),.45,{where});}
   if(item.species==='hercules'&&item.state==='walking'&&item.walkSpeed>0&&!walkers.has(item.id)){const where=spatial(player,item,2.2);if(where){const record=sample(choose(ASSETS.beetle),.3,{where,onFinish:r=>{if(walkers.get(item.id)===r)walkers.delete(item.id);}});if(record)walkers.set(item.id,record);}}
  }
  if(!cicada&&fieldTime>=nextCicada&&buffers.has(ASSETS.cicada)){
   const candidates=items.filter(i=>i.species==='cicada'&&!i.caught&&i.resting).map(item=>({item,where:spatial(player,item,12)})).filter(c=>c.where).sort((a,b)=>b.where.attenuation-a.where.attenuation),candidate=candidates[0];
   if(candidate){const offset=Math.random()<.5?0:19.3,duration=offset?12.6:14.3;const record=sample(ASSETS.cicada,.18,{where:candidate.where,offset,duration,onFinish:r=>{if(cicada?.record===r)cicada=null;}});if(record){cicada={id:candidate.item.id,record};nextCicada=record.ends+25+Math.random()*15;}}
  }
 }
 // Battle callers send only newly resolved exchanges. Numbers also deduplicate
 // repeated render/focus calls; fresh:true starts a new match, never a resume.
 function battle({fresh=false}={}){
  if(disposed)return;if(!ctx)start();
  if(!battling||fresh){clearSounds();battleExchangeNumber=0;battleContactNumber=0;battleResultPlayed=false;}
  battling=true;observing=false;active=true;lifecycle++;
  windGain.gain.cancelScheduledValues?.(ctx.currentTime);windGain.gain.setValueAtTime(0,ctx.currentTime);
  reconcileContext();loadAssets();
 }
 function validBattleExchange(exchange){
  return battling&&!disposed&&exchange&&Number.isInteger(exchange.number)&&exchange.number>=1&&exchange.number<=12&&
   ['push','brace','evade'].includes(exchange.playerAction)&&['push','brace','evade'].includes(exchange.opponentAction)&&Number.isFinite(exchange.delta);
 }
 function battleWindup(exchange,{silent=false}={}){
  if(!validBattleExchange(exchange)||exchange.number<=battleExchangeNumber)return false;
  battleExchangeNumber=exchange.number;
  if(playable()&&!silent){
   const name=ASSETS.net[(exchange.number-1)%ASSETS.net.length];
   if(buffers.has(name))sample(name,.25,{duration:.35});else noiseBurst(.14,.13,1200);
  }
  return true; // even muted/paused history is consumed, never queued to replay
 }
 function contact(exchange,delay=0){
  if(!validBattleExchange(exchange)||exchange.number!==battleExchangeNumber||exchange.number<=battleContactNumber)return;
  battleContactNumber=exchange.number;
  if(!playable())return;
  const pushing=exchange.playerAction==='push'||exchange.opponentAction==='push';
  noiseBurst(pushing?.13:.09,pushing?.14:.08,650,delay);
  tone(pushing?145:180,.14,pushing?.045:.025,'triangle',85,delay);
 }
 // The presentation owns contact timing. No timeout or pre-scheduled impact can
 // run ahead while a held/hidden frame has stopped the visible move.
 function battleContact(exchange){contact(exchange);}
 // Compatibility for callers without a presentation timeline. New main uses
 // the two explicit events; legacy sources remain tracked/cancelled on pause.
 function battleExchange(exchange){if(battleWindup(exchange))contact(exchange,.18);}
 function battleResult(winner){
  if(!battling||disposed||battleResultPlayed||!['player','opponent','draw'].includes(winner))return;
  battleResultPlayed=true;if(!playable())return;
  if(winner==='player'){
   if(buffers.has(ASSETS.capture))sample(ASSETS.capture,.22,{duration:.8});
   else{tone(330,.18,.035,'sine',440,.12);tone(440,.23,.03,'sine',550,.32);}
  }else tone(winner==='draw'?180:130,.22,.035,'triangle',winner==='draw'?160:85,.12);
 }
 function pause(){if(disposed)return;active=false;ready=false;lifecycle++;gain(0);clearSounds();stopBGM();reconcileContext();}
 return {
  start,battle,battleWindup,battleContact,battleExchange,battleResult,
  resetField(next){if(disposed)return;battling=false;battleExchangeNumber=0;battleContactNumber=0;battleResultPlayed=false;observing=false;clearSounds();stopBGM();bgmOffset=0;habitat=next==='meadow'?'meadow':null;fieldTime=0;nextCicada=12;lastStep=0;previous.clear();syncBGM();},
  setVolume(v){if(disposed||!Number.isFinite(Number(v)))return;level=Math.max(0,Math.min(1,Number(v)));gain(active&&ready?level:0);if(level===0){clearSounds();stopBGM();}else syncBGM();},
  pause,
  inspect(){
   if(disposed||!ctx)return;
   // This is an explicit caller-owned transition, including return from a
   // journal/pause. No DOM/visibility listener or automatic hidden-tab resume.
   // Preserve the same BGM source/offset, wind graph and naturally ending SFX.
   if(battling){clearSounds();battling=false;battleExchangeNumber=0;battleContactNumber=0;battleResultPlayed=false;windGain.gain.cancelScheduledValues?.(ctx.currentTime);windGain.gain.setValueAtTime(.08,ctx.currentTime);}
   observing=true;active=true;lifecycle++;reconcileContext();
  },
  dispose(){if(disposed)return;disposed=true;battling=false;active=false;ready=false;lifecycle++;gain(0);clearSounds();stopBGM();loadAbort?.abort();buffers.clear();previous.clear();for(const record of loops){try{record.source.stop();}catch{}disconnect(record.nodes);}loops.clear();master?.disconnect?.();try{ctx?.close?.()?.catch?.(()=>{});}catch{}},
  swing(){if(observing||battling)return;const name=choose(ASSETS.net);if(buffers.has(name))sample(name,.35);else noiseBurst(.28,.25,1800);},
  capture(){if(observing||battling)return;if(buffers.has(ASSETS.capture))sample(ASSETS.capture,.35);else{tone(750,.13,.045,'sine',1100);later(()=>tone(1150,.19,.035,'sine',900),100);}},
  release(){if(battling)return;if(playable()){releaseTone();return;}if(!ctx||!active||disposed||level===0)return;clearPendingRelease();const pending={until:Date.now()+750,timer:null};pending.timer=setTimeout(()=>{timers.delete(pending.timer);if(pendingRelease===pending)pendingRelease=null;},750);pendingRelease=pending;timers.add(pending.timer);},
  update(dt,player,items,time){
   if(!ctx||!active||disposed||battling)return;
   const step=Number.isFinite(dt)&&dt>0?dt:0;fieldTime+=step;
   const edges=[],present=new Set();for(const item of items){present.add(item.id);edges.push({item,before:previous.get(item.id)});previous.set(item.id,{airborne:!!item.airborne,caught:!!item.caught});}for(const id of previous.keys())if(!present.has(id))previous.delete(id);
   if(!ready)return;
   windGain.gain.setTargetAtTime(.08+Math.sin((Number.isFinite(time)?time:fieldTime)*.18)*.02,ctx.currentTime,.3);
   if(!observing){lastStep-=step;if(player.speed>.1&&lastStep<0){lastStep=player.quiet?.7:player.running?.34:.48;noiseBurst(.12,player.quiet?.02:.055,500);}}
   if(playable())insectSounds(player,items,edges);
  }
 };
}
