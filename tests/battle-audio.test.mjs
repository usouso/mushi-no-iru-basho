/** Battle scheduling and lifecycle only: mock audio, not a listening test. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,flush,still} from './fixtures/asset-audio-mock.mjs';
import {AUDIO_ASSETS as ASSETS} from '../src/audio-assets.js';
const exchange=number=>({number,playerAction:'push',opponentAction:'brace',positionBefore:0,positionAfter:.2,delta:.2,reason:'test'});
const bgm=f=>f.loops().find(n=>n.buffer?.file===ASSETS.bgm+'.ogg');
const names=f=>f.assetShots().map(n=>n.buffer.file);
const settleDecode=async f=>{for(let i=0;i<40&&f.decodePending.length;i++){f.decodePending.shift().finish();await flush();}};

test('arena reuses one BGM at lower gain, clears field voices and forbids field ambience or footsteps',async t=>{
 const f=fixture(t);await f.ready();const music=bgm(f);f.audio.swing();const old=f.liveShots();f.advance(4);
 f.audio.battle({fresh:true});await flush();assert.equal(bgm(f),music);assert.equal(music.starts.length,1);assert.equal(music.connections[0].gain.value,.07);assert.equal(f.ctx.gains[1].gain.value,0);assert.ok(old.every(n=>n.ended));
 const count=f.ctx.sources.length;
 for(let i=0;i<60;i++){f.audio.update(1,{...still,speed:5.4,running:true},[{id:1,species:'cicada',x:0,y:1,z:0,resting:true}],i);f.audio.swing();f.audio.capture();f.audio.release();f.audio.battle();}
 assert.equal(f.ctx.sources.length,count);assert.equal(f.ctx.gains[1].gain.value,0);assert.equal(f.requests.length,13);assert.equal(f.contexts.length,1);
 f.audio.start();await flush();assert.equal(bgm(f),music);assert.equal(music.connections[0].gain.value,.12);assert.equal(f.ctx.gains[1].gain.value,.08);
 f.audio.capture();f.audio.inspect();await flush();assert.equal(bgm(f),music);assert.ok(f.ctx.gains[1].gain.value>0,'observation keeps the established wind');
});

test('exchange whoosh precedes .18s scheduled low impact, uses three approved samples and deduplicates old numbers',async t=>{
 const f=fixture(t);await f.ready();f.audio.battle({fresh:true});await flush();
 for(let n=1;n<=3;n++){
  const start=f.ctx.currentTime,before=f.ctx.sources.length;f.audio.battleExchange(exchange(n));const made=f.ctx.sources.slice(before);
  assert.equal(made.length,3);assert.equal(made[0].buffer.file,ASSETS.net[n-1]+'.ogg');assert.equal(made[0].starts[0][0],0);
  assert.equal(made[1].starts[0][0],start+.18);assert.equal(made[2].starts[0][0],start+.18);assert.ok(made.every(node=>node.stops[0]<=start+.4));assert.ok(made[2].frequency.events.every(event=>event[1]<=180));
  for(let i=0;i<10;i++){f.audio.battleExchange({...exchange(n)});f.audio.battle();}assert.equal(f.ctx.sources.length,before+3);assert.equal(f.timers.size,0);
  f.advance(1);assert.ok(made.every(node=>node.ended&&node.disconnected));
 }
 f.audio.battleExchange(exchange(1));const count=f.ctx.sources.length;f.audio.battleExchange({...exchange(4),playerAction:'invalid'});f.audio.battleExchange(exchange(99));assert.equal(f.ctx.sources.length,count);
 f.audio.battleResult('player');assert.equal(names(f).at(-1),ASSETS.capture+'.ogg');const resultCount=f.ctx.sources.length;f.audio.battleResult('player');f.audio.battle();f.audio.battleResult('opponent');assert.equal(f.ctx.sources.length,resultCount);
 f.audio.battle({fresh:true});f.audio.battleExchange(exchange(1));assert.ok(f.ctx.sources.length>resultCount,'new match resets only via fresh:true');
});

test('rapid calls stay within six tracked shots and all scheduled impacts stop on mute or caller hidden/blur/pagehide pause',async t=>{
 for(const gate of ['mute','pause']){
  const f=fixture(t);await f.ready();f.audio.battle({fresh:true});await flush();
  for(let n=1;n<=12;n++){f.audio.battleExchange(exchange(n));assert.ok(f.liveShots().length<=6);}f.audio.battleResult('player');assert.ok(f.liveShots().length<=6);
  const scheduled=f.liveShots(),count=f.ctx.sources.length;assert.ok(scheduled.some(n=>n.starts[0][0]>f.ctx.currentTime));
  if(gate==='mute')f.audio.setVolume(0);else f.audio.pause();await flush();assert.equal(f.master.value,0);assert.ok(scheduled.every(n=>n.ended&&n.disconnected));assert.equal(f.liveShots().length,0);assert.equal(bgm(f),undefined);
  f.advance(2);f.fireTimers();for(const fn of f.retired)fn();assert.equal(f.ctx.sources.length,count,'no orphan delayed impact');
  if(gate==='mute')f.audio.setVolume(.25);else f.audio.battle();await flush();
  const resumed=f.ctx.sources.length;f.audio.battleExchange(exchange(12));f.audio.battleResult('player');assert.equal(f.ctx.sources.length,resumed,'focus does not replay earlier exchange/result');assert.equal(f.ctx.gains[1].gain.value,0);
 }
});

test('exact zero consumes events silently, survives battle resume, and re-enables only new exchanges',async t=>{
 const f=fixture(t);await f.ready();f.audio.setVolume(0);f.audio.battle({fresh:true});await flush();const before=f.ctx.sources.length;
 f.audio.battleExchange(exchange(1));f.audio.battleResult('player');f.audio.pause();await flush();f.audio.battle();await flush();assert.equal(f.master.value,0);assert.equal(f.ctx.sources.length,before);
 f.audio.setVolume(.4);const after=f.ctx.sources.length;f.audio.battleExchange(exchange(1));f.audio.battleResult('player');assert.equal(f.ctx.sources.length,after);f.audio.battleExchange(exchange(2));assert.equal(f.ctx.sources.length,after+3);assert.equal(f.master.value,.4);
});

test('battle loop respects 36.36s end, resumes at wrapped offset, and leaves non-meadow arenas without leaking BGM',async t=>{
 const f=fixture(t);await f.ready();f.audio.resetField('understory');assert.equal(bgm(f),undefined);f.audio.battle({fresh:true});await flush();const first=bgm(f);assert.ok(first);assert.equal(first.loopStart,0);assert.equal(first.loopEnd,36.36);
 f.advance(37);f.audio.battle();assert.equal(bgm(f),first);f.audio.pause();await flush();assert.ok(first.ended);f.audio.battle();await flush();const resumed=bgm(f);assert.ok(Math.abs(resumed.starts[0][1]-.64)<1e-8);assert.equal(f.loops().filter(n=>n.buffer?.file).length,1);
 f.audio.start();await flush();assert.ok(resumed.ended);assert.equal(bgm(f),undefined);assert.equal(f.ctx.gains[1].gain.value,.08);
 f.audio.battle({fresh:true});await flush();f.audio.inspect();await flush();assert.equal(bgm(f),undefined);assert.equal(f.ctx.gains[1].gain.value,.08);
 f.audio.battle({fresh:true});await flush();f.audio.resetField('tropical');assert.equal(bgm(f),undefined);const count=f.ctx.sources.length;f.audio.battleExchange(exchange(1));assert.equal(f.ctx.sources.length,count);
});

test('failed or late audio loads use finite fallback without replay, and late decoding cannot defeat mute/pause/exit/disposal',async t=>{
 const files=[...new Set(Object.values(ASSETS).flat())].map(name=>name+'.ogg');
 const failed=fixture(t,{failedFiles:files});await failed.ready();failed.audio.battle({fresh:true});await flush();failed.audio.battleExchange(exchange(1));failed.audio.battleResult('player');assert.equal(failed.assetShots().length,0);assert.ok(failed.liveShots().length>0&&failed.liveShots().length<=6);assert.equal(failed.timers.size,0);assert.ok(failed.liveShots().every(n=>n.stops[0]<failed.ctx.currentTime+1));failed.advance(1);assert.equal(failed.liveShots().length,0);
 for(const gate of ['mute','pause','exit','dispose']){
  const f=fixture(t,{deferDecode:true});await f.ready();f.audio.resetField('tropical');f.audio.battle({fresh:true});await flush();f.audio.battleExchange(exchange(1));const fallback=f.ctx.sources.length;
  if(gate==='mute')f.audio.setVolume(0);else if(gate==='exit')f.audio.start();else f.audio[gate]();await settleDecode(f);await flush();f.fireTimers();assert.equal(f.assetShots().length,0);assert.equal(bgm(f),undefined);assert.equal(f.ctx.sources.length,fallback);assert.equal(f.master.value,gate==='exit'?.25:0);
 }
 const late=fixture(t,{deferDecode:true});await late.ready();late.audio.battle({fresh:true});await flush();late.audio.battleExchange(exchange(1));await settleDecode(late);assert.equal(late.assetShots().length,0);assert.ok(bgm(late));late.advance(1);late.audio.battleExchange(exchange(2));assert.equal(names(late).at(-1),ASSETS.net[1]+'.ogg');
});

test('a newer pause wins a pending battle resume; focus restores the graph but not old effects',async t=>{
 const f=fixture(t,{deferContext:true});await f.ready();f.audio.battle({fresh:true});f.audio.battleExchange(exchange(1));f.audio.pause();const count=f.ctx.sources.length;
 f.ctx.pending.shift().done();await flush();assert.equal(f.master.value,0);assert.equal(f.ctx.pending[0].name,'suspend');f.ctx.pending.shift().done();await flush();assert.equal(f.ctx.state,'suspended');assert.equal(f.ctx.sources.length,count);
 f.audio.battle();assert.equal(f.master.value,0);f.ctx.pending.shift().done();await flush();assert.equal(f.master.value,.25);const restored=f.ctx.sources.length;f.audio.battleExchange(exchange(1));assert.equal(f.ctx.sources.length,restored);f.audio.battleExchange(exchange(2));assert.equal(f.ctx.sources.length,restored+3);
 f.audio.dispose();await flush();assert.equal(f.master.value,0);assert.equal(f.liveShots().length,0);const disposed=f.ctx.sources.length;f.audio.battle({fresh:true});f.audio.battleExchange(exchange(1));f.audio.battleResult('player');assert.equal(f.ctx.sources.length,disposed);
});

test('direct arena initialization and non-winning endings are finite, quiet and never play a victory sample',async t=>{
 const f=fixture(t);f.audio.battle({fresh:true});await flush();assert.equal(f.contexts.length,1);assert.equal(f.master.value,.25);assert.ok(bgm(f));assert.equal(f.ctx.gains[1].gain.value,0);
 for(const winner of ['opponent','draw']){
  f.audio.battle({fresh:true});f.audio.battleResult(winner);const shots=f.liveShots();assert.equal(shots.length,1);assert.equal(shots[0].kind,'oscillator');assert.ok(shots[0].frequency.events.every(e=>e[1]<=180));assert.ok(shots[0].stops[0]<=f.ctx.currentTime+.36+1e-9);
  assert.equal(f.assetShots().length,0);f.audio.battleResult(winner);assert.equal(f.liveShots().length,1);f.advance(1);assert.equal(f.liveShots().length,0);
 }
});
