/** Mocked asset selection/graph/lifecycle evidence. No OGG waveform or audible-quality claim. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {AUDIO_ASSETS} from '../src/audio-assets.js';
import {fixture,flush,still} from './fixtures/asset-audio-mock.mjs';
const net=AUDIO_ASSETS.net.map(name=>name+'.ogg');
const capture=AUDIO_ASSETS.capture+'.ogg';
const calls=(f,part)=>f.assetShots().filter(n=>n.buffer.file.includes(part));
function step(f,seconds,items=[],player=still){for(let n=0;n<Math.round(seconds*30);n++){f.advance(1/30);f.audio.update(1/30,player,items,f.ctx.currentTime);}}
const hopper=(overrides={})=>({id:10,species:'grasshopper',x:1,y:.2,z:0,resting:true,caught:false,airborne:false,...overrides});
const cicada=(overrides={})=>({id:20,species:'cicada',x:2,y:1.5,z:0,resting:true,caught:false,...overrides});
const beetle=(overrides={})=>({id:30,species:'hercules',x:1,y:1,z:0,state:'walking',walkSpeed:.15,caught:false,...overrides});
test('asset loading is local and bounded to three inflight requests; resolving readiness does not replay old net/capture actions',async t=>{
 const f=fixture(t,{deferFetch:true});await f.ready();assert.equal(f.master.value,.25);assert.ok(f.requests.length>0&&f.requests.length<=3);
 f.audio.swing();f.audio.capture();f.audio.pause();await flush();const before=f.ctx.sources.length;
 for(let i=0;i<30&&f.fetchPending.length;i++){f.fetchPending.shift().finish();await flush();}
 assert.equal(f.requests.length,13);for(const request of f.requests){assert.equal(new URL(request.url).search,'?v=0.3.1&b=123456abcdef');assert.equal(request.options.mode,'same-origin');assert.equal(request.options.credentials,'same-origin');assert.equal(request.options.redirect,'error');const bytes=fs.readFileSync(new URL('../assets/audio/'+request.file,import.meta.url));assert.equal(bytes.subarray(0,4).toString(),'OggS','allowlisted asset exists as OGG');}assert.ok(f.maxInflight<=3);assert.ok(f.requests.every(r=>r.url.startsWith('https://game.invalid/play/assets/audio/')));assert.equal(f.master.value,0);assert.equal(f.ctx.sources.length,before);assert.equal(f.assetShots().length,0);
 const remote=fixture(t,{assetBaseURL:'https://other.invalid/audio/'});await remote.ready();assert.equal(remote.requests.length,0,'cross-origin injected base is rejected');
});
test('three decoded net variants and capture buffer are selected explicitly with no synthetic action duplication',async t=>{
 const f=fixture(t,{callbackOnlyDecode:true});await f.ready();f.audio.resetField('tropical');const selected=new Set();let randomValue=0;t.mock.method(Math,'random',()=>randomValue);
 for(const value of [0,.34,.99]){randomValue=value;f.audio.swing();const shot=f.assetShots().at(-1);assert.ok(net.includes(shot.buffer.file));selected.add(shot.buffer.file);assert.equal(shot.connections[0].gain.value,.35);assert.equal(shot.starts.length,1);shot.end();}
 assert.equal(selected.size,3);const before=f.ctx.sources.filter(n=>n.kind==='oscillator').length;f.audio.capture();assert.equal(f.assetShots().at(-1).buffer.file,capture);assert.equal(f.assetShots().at(-1).connections[0].gain.value,.35);assert.equal(f.ctx.sources.filter(n=>n.kind==='oscillator').length,before);assert.equal(f.timers.size,0);
});
test('404 and failed decode use finite old synthesized fallback without an unhandled rejection or delayed retry sound',async t=>{
 const f=fixture(t,{failedFiles:net,decodeFailures:[capture]});await f.ready();f.audio.resetField('tropical');f.audio.swing();f.audio.capture();assert.equal(f.assetShots().length,0);assert.ok(f.ctx.sources.some(n=>n.kind==='oscillator'));assert.ok(f.ctx.sources.some(n=>!n.loop&&!n.buffer?.file&&n.stops.some(Number.isFinite)));f.fireTimers();const count=f.ctx.sources.length;await flush();assert.equal(f.ctx.sources.length,count);
});
test('meadow BGM is one bounded 0–36.36 loop, pauses/mutes immediately, resumes with offset, and never runs in tropical field',async t=>{
 const f=fixture(t);f.audio.resetField('meadow');await f.ready();step(f,.1);let bgm=f.loops().find(n=>n.buffer?.file===AUDIO_ASSETS.bgm+'.ogg');assert.ok(bgm);assert.equal(bgm.loopStart,0);assert.equal(bgm.loopEnd,36.36);assert.equal(bgm.connections[0].gain.value,.12);f.advance(5);f.audio.pause();assert.ok(bgm.ended);await flush();f.audio.start();await flush();step(f,.1);bgm=f.loops().find(n=>n.buffer?.file===AUDIO_ASSETS.bgm+'.ogg');assert.ok(bgm.starts[0][1]>=5&&bgm.starts[0][1]<36.36);assert.equal(f.loops().length,2);f.audio.setVolume(0);assert.ok(bgm.ended);assert.equal(f.master.value,0);f.audio.setVolume(.25);step(f,.1);assert.ok(f.loops().length<=2);f.audio.resetField('tropical');step(f,1);assert.equal(f.loops().filter(n=>n.buffer?.file).length,0);
});
test('late fetch/decode after mute, pause or disposal cannot create asset playback or unmute',async t=>{
 for(const gate of ['mute','pause','dispose']){
  const f=fixture(t,{deferDecode:true});await f.ready();assert.ok(f.decodePending.length);if(gate==='mute')f.audio.setVolume(0);else f.audio[gate]();await flush();
  for(let i=0;i<30&&f.decodePending.length;i++){f.decodePending.shift().finish();await flush();}
  step(f,20,[cicada(),beetle(),hopper({airborne:true})]);assert.equal(f.master.value,0);assert.equal(f.assetShots().length,0);assert.equal(f.loops().filter(n=>n.buffer?.file).length,0);
 }
});
test('pending context resume keeps zero gain; at most one release is deferred and pause cancels it',async t=>{
 const f=fixture(t,{deferContext:true});f.audio.start();await flush();f.audio.release();f.audio.release();f.audio.release();assert.equal(f.master.value,0);assert.equal(f.liveShots().length,0);f.ctx.pending.shift().done();await flush();assert.equal(f.master.value,.25);assert.equal(f.liveShots().length,1);f.finishShots();f.audio.pause();f.ctx.pending.shift().done();await flush();f.audio.start();f.audio.release();f.audio.pause();f.ctx.pending.shift().done();await flush();assert.equal(f.master.value,0);assert.equal(f.liveShots().length,0);
 const expired=fixture(t,{deferContext:true});expired.audio.start();expired.audio.release();expired.fireTimers();expired.ctx.pending.shift().done();await flush();assert.equal(expired.liveShots().length,0,'expired release does not play after resume');
});
test('cicada call waits twelve game seconds, uses bounded excerpts, distance attenuation and left/right panning without bird or oscillator ambience',async t=>{
 const f=fixture(t);await f.ready();f.audio.resetField('meadow');step(f,11,[cicada()]);assert.equal(calls(f,'aburazemi').length,0);step(f,2,[cicada()]);const shot=calls(f,'aburazemi').at(-1);assert.ok(shot);assert.ok([[0,14.3],[19.3,12.6]].some(([offset,duration])=>Math.abs(shot.starts[0][1]-offset)<1e-8&&Math.abs(shot.starts[0][2]-duration)<1e-8));assert.ok(f.ctx.panners.some(n=>Math.abs(n.pan.value)>0));assert.equal(f.ctx.sources.filter(n=>n.kind==='oscillator').length,0);const count=calls(f,'aburazemi').length;const nearGain=shot.connections[0].gain.value;assert.ok(nearGain>0&&nearGain<.18);step(f,shot.stops[0]+25-f.ctx.currentTime-.1,[cicada()]);assert.equal(calls(f,'aburazemi').length,count,'call cannot repeat before actual excerpt end plus minimum 25 second gap');step(f,15.2,[cicada()]);assert.equal(calls(f,'aburazemi').length,count+1);const afterGap=calls(f,'aburazemi').length;step(f,20,[cicada({x:30})]);assert.equal(calls(f,'aburazemi').length,afterGap);
 f.audio.resetField('meadow');step(f,13,[cicada({x:-2})]);assert.ok(f.ctx.panners.some(n=>n.pan.value<0));assert.ok(f.ctx.panners.some(n=>n.pan.value>0));f.audio.resetField('meadow');step(f,13,[cicada({x:8})]);assert.ok(calls(f,'aburazemi').at(-1).connections[0].gain.value<nearGain,'farther caller attenuates');
 // Exercise the previously flaky legal corner explicitly, in addition to the
 // unrestricted-random check above: short 12.6s excerpt and minimum 25s gap.
 const shortest=fixture(t);await shortest.ready();let choice=0;const random=t.mock.method(Math,'random',()=>choice++===0?.75:0);
 shortest.audio.resetField('meadow');step(shortest,13,[cicada()]);const first=calls(shortest,'aburazemi')[0];assert.equal(first.starts[0][1],19.3);assert.equal(first.starts[0][2],12.6);
 step(shortest,first.stops[0]+25-shortest.ctx.currentTime-.1,[cicada()]);assert.equal(calls(shortest,'aburazemi').length,1);step(shortest,.2,[cicada()]);assert.equal(calls(shortest,'aburazemi').length,2,'short excerpt may legally repeat before the old fixed time 50s');random.mock.restore();
});
test('grasshopper takeoff/landing are one transition each, with no first-snapshot or caught false landing sound',async t=>{
 const f=fixture(t);await f.ready();f.audio.resetField('meadow');step(f,.1,[hopper({airborne:true})]);assert.equal(calls(f,'grasshopper').length,0);step(f,.1,[hopper()]);assert.equal(calls(f,'landing').length,1);step(f,.2,[hopper()]);assert.equal(calls(f,'landing').length,1);step(f,.1,[hopper({airborne:true})]);assert.equal(calls(f,'takeoff').length,1);step(f,.1,[hopper({caught:true})]);assert.equal(calls(f,'landing').length,1);step(f,.1,[hopper()]);assert.equal(calls(f,'landing').length,1);step(f,.1,[hopper({airborne:true,x:10})]);assert.equal(calls(f,'takeoff').length,1);
});
test('beetle walking only sounds within 2.2m and immediately stops when resting, caught or out of range',async t=>{
 const f=fixture(t);await f.ready();f.audio.resetField('tropical');step(f,1,[beetle({x:4})]);assert.equal(calls(f,'beetle').length,0);step(f,.1,[beetle()]);assert.ok(calls(f,'beetle').length>0);assert.ok(calls(f,'beetle').filter(n=>!n.ended).length<=1);step(f,.1,[beetle({state:'resting',walkSpeed:0})]);assert.equal(calls(f,'beetle').filter(n=>!n.ended).length,0);step(f,.8,[beetle()]);step(f,.1,[beetle({caught:true})]);assert.equal(calls(f,'beetle').filter(n=>!n.ended).length,0);step(f,.8,[beetle()]);step(f,.1,[beetle({x:8})]);assert.equal(calls(f,'beetle').filter(n=>!n.ended).length,0);
});
test('short bursts never exceed six one-shots and ended/stopped sources disconnect their graph',async t=>{
 const f=fixture(t);await f.ready();f.audio.resetField('meadow');for(let i=0;i<30;i++){f.audio.swing();f.audio.capture();f.audio.release();assert.ok(f.liveShots().length<=6);assert.ok(f.loops().length<=2);assert.ok(f.ctx.sources.filter(n=>n.started&&!n.ended).length<=8);}assert.ok(f.liveShots().length>0);const active=f.liveShots();f.finishShots();assert.ok(active.every(n=>n.disconnected&&n.connections.every(g=>g.disconnected)));f.audio.swing();const next=f.liveShots();f.audio.pause();assert.ok(next.every(n=>n.ended&&n.disconnected));assert.equal(f.master.value,0);
});
test('field reset and same-id replacement establish a new snapshot without phantom jumps, old creature sounds or inherited cicada delay',async t=>{
 const f=fixture(t);await f.ready();f.audio.resetField('meadow');step(f,.1,[hopper()]);step(f,.1,[hopper({airborne:true})]);const count=calls(f,'grasshopper').length;f.audio.resetField('tropical');step(f,1,[hopper()]);assert.equal(calls(f,'grasshopper').length,count);f.audio.resetField('meadow');step(f,11,[cicada(),hopper({airborne:true})]);assert.equal(calls(f,'aburazemi').length,0);assert.equal(calls(f,'grasshopper').length,count);f.audio.setVolume(0);step(f,3,[cicada(),hopper()]);assert.equal(f.master.value,0);
});

test('inspection keeps only the already-started capture tail, then suspends; zero/pause/reset/dispose stop it immediately',async t=>{
 for(const gate of ['complete','pause','mute','reset','dispose']){
  const f=fixture(t);await f.ready();f.audio.capture();f.audio.swing();f.advance(.28);const tail=calls(f,'capture').at(-1);assert.ok(tail&&!tail.ended);f.audio.inspect();await flush();
  assert.equal(f.liveShots().length,1);assert.equal(f.liveShots()[0],tail);assert.equal(f.loops().filter(n=>n.buffer?.file).length,0);assert.equal(f.ctx.gains[1].gain.value,0,'wind is silent during inspection');
  const before=f.ctx.sources.length;f.audio.capture();f.audio.swing();f.audio.release();step(f,.1,[beetle(),cicada()]);assert.equal(f.ctx.sources.length,before,'inspection cannot enqueue new audio');
  if(gate==='complete'){f.advance(.6);await flush();assert.ok(tail.ended);assert.equal(f.master.value,0);assert.equal(f.ctx.state,'suspended');}
  else{if(gate==='mute')f.audio.setVolume(0);else if(gate==='reset')f.audio.resetField('tropical');else f.audio[gate]();await flush();assert.ok(tail.ended);assert.equal(f.master.value,0);}
 }
});
test('resume invalidates old inspection-tail expiry, and inspection before delayed decode never starts a new capture',async t=>{
 const f=fixture(t);await f.ready();f.audio.capture();f.advance(.28);f.audio.inspect();const tail=calls(f,'capture').at(-1);f.audio.start();await flush();assert.equal(f.master.value,.25);tail.end();for(const callback of f.retired)callback();f.fireTimers();await flush();assert.equal(f.ctx.state,'running');assert.equal(f.master.value,.25);
 const late=fixture(t,{deferDecode:true});await late.ready();late.audio.capture();late.audio.inspect();await flush();for(let i=0;i<30&&late.decodePending.length;i++){late.decodePending.shift().finish();await flush();}assert.equal(late.master.value,0);assert.equal(late.assetShots().length,0);assert.equal(late.ctx.state,'suspended');
});

test('only explicit meadow enables BGM; understory and unknown fields stop it and meadow return resets its offset',async t=>{
 const f=fixture(t);await f.ready();
 const bgms=()=>f.loops().filter(n=>n.buffer?.file===AUDIO_ASSETS.bgm+'.ogg');
 assert.equal(bgms().length,1);
 for(const habitat of ['understory','tropical','unknown','',null,undefined,{}]){
  const previous=bgms()[0];f.advance(2);f.audio.resetField(habitat);assert.ok(previous.ended);assert.equal(bgms().length,0);
  f.audio.pause();await flush();f.audio.start();await flush();f.audio.setVolume(0);f.audio.setVolume(.25);step(f,1);assert.equal(bgms().length,0,'resume/unmute cannot normalize a non-meadow field');
  f.audio.resetField('meadow');assert.equal(bgms().length,1);assert.equal(bgms()[0].starts[0][1],0);assert.equal(f.loops().length,2,'one wind plus one BGM loop');
 }
});
test('BGM decoded after switching to understory or an unknown field stays silent until explicit meadow return',async t=>{
 for(const habitat of ['understory','unknown'])await t.test(habitat,async t=>{
  const f=fixture(t,{deferDecode:true});await f.ready();assert.ok(f.decodePending.length);f.audio.resetField(habitat);
  for(let i=0;i<30&&f.decodePending.length;i++){f.decodePending.shift().finish();await flush();}
  assert.equal(f.requests.length,13);assert.equal(f.loops().filter(n=>n.buffer?.file).length,0);step(f,15);assert.equal(f.loops().filter(n=>n.buffer?.file).length,0);
  f.audio.resetField('meadow');assert.equal(f.loops().filter(n=>n.buffer?.file).length,1);
 });
});
test('leaf insects and water striders do not acquire existing insect samples through similar movement fields',async t=>{
 const f=fixture(t);await f.ready();f.audio.resetField('understory');
 const items=['leafinsect','waterstrider'].map((species,id)=>({id,species,x:1,y:1,z:0,caught:false,resting:true,state:'resting',airborne:false,walkSpeed:0,strokePhase:0,skateSpeed:0}));
 step(f,15,items);step(f,1,items.map(i=>({...i,resting:false,state:'walking',walkSpeed:.1,airborne:true})));step(f,1,items.map(i=>({...i,state:'rowing',strokePhase:.5,skateSpeed:.2})));step(f,1,items.map(i=>({...i,state:'gliding',skateSpeed:.1})));step(f,1,items);
 assert.equal(f.assetShots().length,0);assert.equal(f.loops().filter(n=>n.buffer?.file).length,0);assert.equal(f.ctx.sources.filter(n=>n.kind==='oscillator').length,0);
});
