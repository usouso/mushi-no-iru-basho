/** Test-only fetch/decode/WebAudio clock; no network, OGG codec, or real sound.
 * Decoded buffers carry filenames so main-triggered BufferSources are traceable. */
import assert from 'node:assert/strict';
export function createIntegratedAudioMock(t){
 const contexts=[],requests=[],decoded=[],timers=new Map();let clock=0,nextTimer=0;
 const param=()=>({value:0,cancelScheduledValues(){},setValueAtTime(v){this.value=v;},setTargetAtTime(v){this.value=v;},exponentialRampToValueAtTime(){},linearRampToValueAtTime(){}});
 function node(ctx,kind){return{ctx,kind,gain:param(),frequency:param(),Q:param(),pan:param(),connections:[],started:false,ended:false,disconnected:false,
  connect(to){this.connections.push(to);return to;},disconnect(){this.disconnected=true;this.connections=[];},
  start(at=0,offset=0,duration){this.started=true;this.startArgs=[at,offset,duration];if(this.buffer&&!this.loop)this.endAt=Math.max(at,ctx.currentTime)+(duration??this.buffer.duration-offset);},
  stop(at){if(at===undefined||at<=ctx.currentTime)this.end();else this.stopAt=at;},end(){if(this.ended)return;this.ended=true;this.onended?.();}};}
 class AudioContext{
  constructor(){this.state='suspended';this.currentTime=0;this.sampleRate=32;this.destination={};this.sources=[];this.gains=[];contexts.push(this);}
  createGain(){const n=node(this,'gain');this.gains.push(n);return n;}
  createBufferSource(){const n=node(this,'buffer');this.sources.push(n);return n;}
  createOscillator(){const n=node(this,'oscillator');this.sources.push(n);return n;}
  createBiquadFilter(){return node(this,'filter');}createStereoPanner(){return node(this,'panner');}
  createBuffer(channels,length,rate){return{duration:length/(rate||this.sampleRate),getChannelData:()=>new Float32Array(length)};}
  decodeAudioData(bytes,success){const file=new TextDecoder().decode(bytes);decoded.push(file);const buffer={file,duration:file.startsWith('bgm_')?36.363625:file.includes('aburazemi')?31.9:file.includes('capture')?.8:file.includes('beetle')?2.8:.5};return Promise.resolve().then(()=>{success?.(buffer);return buffer;});}
  resume(){return Promise.resolve().then(()=>{this.state='running';});}suspend(){return Promise.resolve().then(()=>{this.state='suspended';});}close(){return Promise.resolve().then(()=>{this.state='closed';});}
 }
 const fetch=async(url,options)=>{const u=new URL(url);assert.equal(u.origin,'https://game.invalid');assert.match(u.pathname,/^\/play\/assets\/audio\/[^/]+\.ogg$/);assert.equal(options.mode,'same-origin');assert.equal(options.credentials,'same-origin');assert.equal(options.redirect,'error');const file=u.pathname.split('/').at(-1);requests.push({url:String(url),file});return{ok:true,status:200,arrayBuffer:async()=>new TextEncoder().encode(file).buffer};};
 t.mock.method(globalThis,'setTimeout',(fn,delay)=>{const id=++nextTimer;timers.set(id,{fn,at:clock+delay});return id;});
 t.mock.method(globalThis,'clearTimeout',id=>timers.delete(id));
 return{AudioContext,fetch,contexts,requests,decoded,timers,get ctx(){return contexts.at(-1);},
  liveAssets(){return contexts.flatMap(c=>c.sources).filter(n=>n.started&&!n.ended&&n.buffer?.file);},
  assetSources(){return contexts.flatMap(c=>c.sources).filter(n=>n.started&&n.buffer?.file);},
  advance(seconds){clock+=seconds*1000;for(const c of contexts){if(c.state==='running')c.currentTime+=seconds;for(const n of c.sources)if(n.stopAt<=c.currentTime||n.endAt<=c.currentTime)n.end();}for(const[id,timer]of [...timers])if(timer.at<=clock){timers.delete(id);timer.fn();}},
  async flush(){for(let i=0;i<100;i++)await Promise.resolve();}
 };
}
