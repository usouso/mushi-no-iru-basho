/** Observation audio scheduling only; no waveform/listening/browser claim. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,flush,still} from './fixtures/asset-audio-mock.mjs';
const cicada={id:20,species:'cicada',x:2,y:1.5,z:0,resting:true,caught:false};
const beetle={id:30,species:'hercules',x:1,y:1,z:0,state:'walking',walkSpeed:.15,caught:false};
const hopper={id:10,species:'grasshopper',x:1,y:.2,z:0,airborne:false,caught:false};
const shots=(f,name)=>f.assetShots().filter(n=>n.buffer.file.includes(name));
function step(f,seconds,items=[],player=still){for(let n=0;n<Math.round(seconds*30);n++){f.advance(1/30);f.audio.update(1/30,player,items,f.ctx.currentTime);}}

test('frozen observation renews nearby cicada ambience but never walking, jumping or player footsteps',async t=>{
 const f=fixture(t);await f.ready();t.mock.method(Math,'random',()=>0);step(f,.1,[beetle,hopper]);const walk=shots(f,'beetle').at(-1);assert.ok(walk&&!walk.ended);
 f.audio.capture();f.audio.inspect();const transientCount=f.ctx.sources.filter(n=>!n.loop&&!n.buffer?.file).length;
 step(f,16,[beetle,{...hopper,airborne:true},cicada],{...still,speed:4,running:true});assert.ok(walk.ended);assert.equal(shots(f,'beetle').length,1);assert.equal(shots(f,'grasshopper').length,0);assert.equal(f.ctx.sources.filter(n=>!n.loop&&!n.buffer?.file).length,transientCount);assert.equal(shots(f,'aburazemi').length,1);
 const first=shots(f,'aburazemi')[0];step(f,first.stops[0]+26-f.ctx.currentTime,[beetle,{...hopper,airborne:false},cicada]);assert.ok(shots(f,'aburazemi').length>=2);assert.ok(first.ended);assert.ok(f.liveShots().length<=6);assert.equal(shots(f,'beetle').length,1);
 const active=shots(f,'aburazemi').find(n=>!n.ended);assert.ok(active);step(f,.1,[{...cicada,caught:true}]);assert.ok(active.ended,'captured creature stops its own call');
 const count=shots(f,'aburazemi').length;step(f,60,[{...cicada,caught:true},{...cicada,id:21,x:30}]);assert.equal(shots(f,'aburazemi').length,count);
});

test('explicit observation resume reuses context, but a newer pause wins pending resumes and stays silent',async t=>{
 const f=fixture(t,{deferContext:true});await f.ready();assert.equal(f.master.value,0);f.audio.inspect();f.audio.pause();f.ctx.pending.shift().done();await flush();assert.equal(f.master.value,0);assert.equal(f.ctx.pending[0].name,'suspend');f.ctx.pending.shift().done();await flush();assert.equal(f.ctx.state,'suspended');
 const count=f.ctx.sources.length;f.audio.inspect();assert.equal(f.ctx.pending[0].name,'resume');assert.equal(f.master.value,0);f.audio.pause();f.ctx.pending.shift().done();await flush();assert.equal(f.master.value,0);f.ctx.pending.shift().done();await flush();assert.equal(f.ctx.state,'suspended');assert.equal(f.ctx.sources.length,count);
 f.audio.inspect();f.ctx.pending.shift().done();await flush();assert.equal(f.ctx.state,'running');assert.equal(f.master.value,.25);assert.equal(f.contexts.length,1);f.audio.setVolume(0);f.audio.pause();f.ctx.pending.shift().done();await flush();f.audio.inspect();f.ctx.pending.shift().done();await flush();assert.equal(f.master.value,0,'explicit return still respects exact zero');
});

test('late observation decode cannot defeat mute, caller pause/hidden gating, field reset or disposal',async t=>{
 for(const gate of['mute','pause','reset','dispose']){
  const f=fixture(t,{deferDecode:true});await f.ready();f.audio.capture();f.audio.inspect();if(gate==='mute')f.audio.setVolume(0);else if(gate==='reset')f.audio.resetField('tropical');else f.audio[gate]();await flush();
  for(let i=0;i<30&&f.decodePending.length;i++){f.decodePending.shift().finish();await flush();}
  f.fireTimers();await flush();assert.equal(f.assetShots().length,0,'no replay of previous action after decode');assert.equal(f.loops().filter(n=>n.buffer?.file).length,0);assert.equal(f.master.value,gate==='reset'?.25:0);assert.equal(f.contexts.length,1);
  if(gate==='pause'){assert.equal(f.ctx.state,'suspended');f.audio.inspect();await flush();assert.equal(f.master.value,.25);assert.equal(f.loops().filter(n=>n.buffer?.file).length,1,'only explicit caller observation return can resume');}
  if(gate==='dispose'){f.audio.inspect();f.audio.start();await flush();assert.equal(f.ctx.state,'closed');assert.equal(f.master.value,0);}
 }
});
