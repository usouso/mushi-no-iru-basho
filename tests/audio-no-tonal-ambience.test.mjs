/** Graph-level evidence only; no recording comparison or audible-comfort claim. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createAudio } from '../src/audio.js';
const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
function fixture(t){
 const contexts=[],timers=new Map();let timerId=0,scheduled=0;
 const param=()=>({value:0,targets:[],cancelScheduledValues(){},setValueAtTime(v){this.value=v;},setTargetAtTime(v){this.value=v;this.targets.push(v);},exponentialRampToValueAtTime(v){this.targets.push(v);}});
 const node=kind=>({kind,gain:param(),frequency:param(),Q:param(),pan:param(),connect(){},disconnect(){},start(){this.started=true;},stops:[],stop(time){this.stops.push(time);}});
 class FakeAudioContext{
  constructor(){this.state='suspended';this.currentTime=0;this.sampleRate=32;this.destination={};this.gains=[];this.sources=[];this.filters=[];this.panners=[];contexts.push(this);}
  createGain(){const n=node('gain');this.gains.push(n);return n;}
  createBufferSource(){const n=node('buffer');this.sources.push(n);return n;}
  createOscillator(){const n=node('oscillator');this.sources.push(n);return n;}
  createBiquadFilter(){const n=node('filter');this.filters.push(n);return n;}
  createStereoPanner(){const n=node('panner');this.panners.push(n);return n;}
  createBuffer(_,length){return {getChannelData:()=>new Float32Array(length)};}
  resume(){this.state='running';return Promise.resolve();}suspend(){this.state='suspended';return Promise.resolve();}close(){this.state='closed';return Promise.resolve();}
 }
 t.mock.method(globalThis,'setTimeout',(fn,delay)=>{scheduled++;const id=++timerId;timers.set(id,{fn,delay});return id;});
 t.mock.method(globalThis,'clearTimeout',id=>timers.delete(id));
 const before=Object.getOwnPropertyDescriptor(globalThis,'window');Object.defineProperty(globalThis,'window',{configurable:true,value:{AudioContext:FakeAudioContext}});t.after(()=>{if(before)Object.defineProperty(globalThis,'window',before);else delete globalThis.window;});
 return {audio:createAudio(),contexts,timers,get scheduled(){return scheduled;},get ctx(){return contexts[0];},fireTimers(){for(const [id,{fn}]of [...timers]){timers.delete(id);fn();}}};
}
const still={x:0,z:0,yaw:0,speed:0,quiet:false,running:false};
test('sixty stationary seconds beside a cicada create no tonal ambience or delayed bird callbacks',async t=>{
 const f=fixture(t);f.audio.start();await flush();const items=[{species:'cicada',caught:false,x:0,z:0}];
 for(let frame=0;frame<3600;frame++){const time=frame/60;f.ctx.currentTime=time;f.audio.update(1/60,still,items,time);f.fireTimers();}
 assert.equal(f.ctx.sources.filter(n=>n.kind==='oscillator').length,0);
 assert.equal(f.scheduled,0);assert.equal(f.timers.size,0);
 assert.equal(f.ctx.sources.length,1);assert.equal(f.ctx.sources[0].loop,true);
 assert.equal(f.ctx.panners.length,0);assert.equal(f.ctx.filters.length,1);assert.equal(f.ctx.filters[0].type,'lowpass');assert.equal(f.ctx.filters[0].frequency.value,700);
 const wind=f.ctx.gains[1].gain;assert.equal(wind.targets.length,3600);assert.ok(wind.targets.every(v=>v>=.06&&v<=.1));
 assert.equal(f.ctx.gains[0].gain.value,.25);
});
test('repeated starts and pause/resume do not duplicate the one wind source or graph',async t=>{
 const f=fixture(t);for(let i=0;i<20;i++){f.audio.start();f.audio.start();await flush();f.audio.pause();await flush();}
 f.audio.start();await flush();assert.equal(f.contexts.length,1);assert.equal(f.ctx.sources.length,1);assert.equal(f.ctx.gains.length,2);assert.equal(f.ctx.filters.length,1);assert.equal(f.scheduled,0);
 f.audio.dispose();await flush();assert.equal(f.ctx.state,'closed');assert.equal(f.ctx.gains[0].gain.value,0);assert.ok(f.ctx.sources[0].stops.includes(undefined));
});
test('walking, net, capture and release effects remain finite and explicitly triggered',async t=>{
 const f=fixture(t);f.audio.start();await flush();
 f.audio.update(.01,{...still,speed:2},[],0);assert.equal(f.ctx.sources.filter(n=>n.kind==='buffer'&&!n.loop).length,1,'Footstep noise remains');
 f.audio.swing();assert.equal(f.ctx.sources.filter(n=>n.kind==='buffer'&&!n.loop).length,2,'Net noise remains');
 f.audio.capture();assert.equal(f.ctx.sources.filter(n=>n.kind==='oscillator').length,1);assert.equal(f.timers.size,1);assert.equal([...f.timers.values()][0].delay,100);
 f.fireTimers();assert.equal(f.ctx.sources.filter(n=>n.kind==='oscillator').length,2);
 f.audio.release();assert.equal(f.ctx.sources.filter(n=>n.kind==='oscillator').length,3);assert.equal(f.timers.size,0);
 assert.ok(f.ctx.sources.slice(1).every(n=>n.started&&n.stops.some(Number.isFinite)),'Every action effect has a finite scheduled stop');
});
test('exact zero prevents remaining effects and callbacks without recreating ambience',async t=>{
 const f=fixture(t);f.audio.setVolume(0);f.audio.start();await flush();
 for(let i=0;i<60;i++){f.audio.update(1,{...still,speed:3,running:true},[{species:'cicada',x:0,z:0}],i);f.audio.swing();f.audio.capture();f.audio.release();}
 assert.equal(f.ctx.gains[0].gain.value,0);assert.equal(f.ctx.sources.length,1);assert.equal(f.scheduled,0);
 f.audio.pause();await flush();f.audio.start();await flush();assert.equal(f.ctx.gains[0].gain.value,0);assert.equal(f.ctx.sources.length,1);
});
