/** Actual main/net/audio integration with DOM, WebGL and WebAudio clock doubles.
 * No real AudioContext, codec, speaker, visual or human comfort claim. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createIntegratedAudioMock} from './fixtures/integrated-audio-mock.mjs';
const root=path.resolve(import.meta.dirname,'..');
async function app(t,audio){
 Object.defineProperty(globalThis,'__observationAudioTest',{configurable:true,value:audio});t.after(()=>delete globalThis.__observationAudioTest);
 const existing=fs.readFileSync(path.join(root,'tests/hercules-main.test.mjs'),'utf8'),marker='\nconst beetles=()=>';assert.ok(existing.includes(marker));
 let source=existing.slice(0,existing.indexOf(marker));
 source=source.replace("from './fixtures/journal-locks.mjs'",`from ${JSON.stringify(pathToFileURL(path.join(root,'tests/fixtures/journal-locks.mjs')).href)}`).replace("const root=path.resolve(import.meta.dirname,'..');",`const root=${JSON.stringify(root)};`);
 source=source.replace('window.AudioContext=AudioContext;',"window.AudioContext=globalThis.__observationAudioTest.AudioContext;window.fetch=globalThis.__observationAudioTest.fetch;window.location={href:'https://game.invalid/play/index.html',origin:'https://game.invalid'};");
 const read="let source=fs.readFileSync(path.join(root,'src',name),'utf8');";assert.ok(source.includes(read));source=source.replace(read,read+"\n if(name==='audio.js')source=source.replaceAll('import.meta.url',JSON.stringify('https://game.invalid/play/src/audio.js?v=0.16.1&b=123456abcdef'));");
 source=source.replace('export {state,simulation,world,journal,','export {roster,keepCaptured,openCompanions,closeCompanions,state,simulation,world,journal,');
 source+='\nexport {g,frame,elements,key,choose};';
 return import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
}

test('net capture keeps one meadow BGM and wind through observation while world freezes; modal, lifecycle and volume gates remain authoritative',async t=>{
 const a=createIntegratedAudioMock(t),h=await app(t,a),{g,elements,key}=h;
 const step=n=>{for(let k=0;k<n;k++){a.advance(1/60);h.frame(1);}};
 const bgm=()=>a.liveAssets().filter(n=>n.buffer.file==='bgm_temperate_preview_01.ogg');
 const wind=()=>a.ctx.sources.filter(n=>n.kind==='buffer'&&n.loop&&!n.buffer?.file&&n.started&&!n.ended);
 const master=()=>a.ctx.gains[0].gain.value;
 const windLevel=()=>wind()[0]?.connections[0]?.connections[0]?.gain.value;
 const volume=value=>{elements.get('volume').value=String(value);elements.get('volume').dispatchEvent(new Event('input'));};
 let focused=true;document.hasFocus=()=>focused;
 const focus=()=>{focused=true;window.dispatchEvent(new Event('focus'));};
 const blur=()=>{focused=false;window.dispatchEvent(new Event('blur'));};
 const hidden=value=>{document.hidden=value;document.dispatchEvent(new Event('visibilitychange'));};
 const audible=()=>{assert.equal(a.ctx.state,'running');assert.equal(master(),g.state.volume);assert.ok(master()>0);assert.equal(wind().length,1);assert.ok(windLevel()>0);};
 const silent=()=>{assert.equal(master(),0);assert.equal(a.liveAssets().length,0);};
 const capture=species=>{
  const i=g.simulation.items.find(i=>i.species===species&&!i.caught);assert.ok(i);
  const x=species==='rhino'?-2:i.x,z=species==='rhino'?2:i.z+1.8,y=g.world.heightAt(x,z)+1.65;
  g.setPose({x,y,z,speed:0,yaw:Math.atan2(x-i.x,z-i.z),pitch:Math.atan2(i.y-y,Math.hypot(i.x-x,i.z-z))});
  elements.get('game-canvas').focus();key('keydown','Space');key('keyup','Space');assert.equal(g.simulation.caught,i,'real input -> net -> intended capture');step(22);assert.equal(g.state.mode,'inspect');return i;
 };
 t.after(()=>window.dispatchEvent(new Event('pagehide')));
 assert.equal(a.contexts.length,0);h.choose('meadow');await a.flush();volume(.25);await a.flush();assert.equal(bgm().length,1);audible();
 const originalBGM=bgm()[0],originalWind=wind()[0],shotStart=a.assetSources().length;capture('butterfly');await a.flush();
 assert.equal(bgm()[0],originalBGM,'inspection must not stop/restart the BGM source');assert.equal(wind()[0],originalWind);audible();
 assert.ok(a.assetSources().slice(shotStart).some(n=>/^sfx_net_swing_0[123]\.ogg$/.test(n.buffer.file)));assert.ok(a.liveAssets().some(n=>n.buffer.file==='sfx_capture_01.ogg'),'success tail remains audible alongside backgrounds');
 const frozen=JSON.stringify(g.simulation.items),time=g.simulation.time,elapsed=g.state.elapsed,player={...g.state.player},initialWind=windLevel(),sourceCount=a.ctx.sources.length;
 key('keydown','KeyW');key('keydown','ShiftLeft');step(45*60);key('keyup','KeyW');key('keyup','ShiftLeft');await a.flush();
 assert.equal(JSON.stringify(g.simulation.items),frozen);assert.equal(g.simulation.time,time);assert.equal(g.state.elapsed,elapsed);assert.deepEqual(g.state.player,player);assert.equal(a.ctx.sources.length,sourceCount,'observation creates no movement/footstep/insect sources');
 assert.equal(bgm()[0],originalBGM);assert.equal(bgm().length,1);assert.equal(originalBGM.loopEnd,36.36);assert.equal(wind()[0],originalWind);assert.notEqual(windLevel(),initialWind,'observation still advances the wind audio adapter');audible();assert.deepEqual(a.liveAssets().map(n=>n.buffer.file),['bgm_temperate_preview_01.ogg']);
 // Journal intentionally pauses, then returns to observation (not walking).
 g.openJournal('butterfly');await a.flush();assert.equal(g.state.mode,'journal');silent();const journalTime=g.simulation.time;step(30);focus();await a.flush();silent();assert.equal(g.simulation.time,journalTime);
 g.closeJournal({lock:false});await a.flush();assert.equal(g.state.mode,'inspect');audible();assert.equal(bgm().length,1);const afterJournal=bgm()[0];assert.notEqual(afterJournal,originalBGM,'resume uses the stopped loop offset, not a second live source');assert.ok(afterJournal.startArgs[1]>0);
 // Background visibility is not a gameplay-resume shortcut; inspection alone resumes.
 hidden(true);await a.flush();assert.equal(g.state.mode,'inspect');silent();step(90);focus();await a.flush();silent();hidden(false);await a.flush();audible();assert.equal(bgm().length,1);assert.equal(g.simulation.time,journalTime);
 blur();await a.flush();silent();step(30);hidden(true);hidden(false);await a.flush();silent();focus();await a.flush();audible();assert.equal(g.state.mode,'inspect');assert.equal(bgm().length,1);
 volume(0);await a.flush();silent();hidden(true);hidden(false);blur();focus();step(60);await a.flush();silent();assert.equal(g.state.volume,0);
 volume(.25);await a.flush();audible();assert.equal(bgm().length,1);
 const continuous=bgm()[0];g.release({lock:false});await a.flush();assert.equal(g.state.mode,'playing');assert.equal(bgm()[0],continuous);assert.equal(wind()[0],originalWind);step(60);capture('butterfly');await a.flush();assert.equal(bgm()[0],continuous);assert.equal(bgm().length,1);assert.equal(wind().length,1);
 g.release({lock:false});g.pause({lock:false});await a.flush();silent();focus();hidden(true);hidden(false);await a.flush();assert.equal(g.state.mode,'paused');silent();g.resume({lock:false});await a.flush();audible();
 g.openCompanions();await a.flush();assert.equal(g.state.mode,'companions');silent();focus();await a.flush();silent();g.closeCompanions();await a.flush();audible();assert.equal(bgm().length,1);
 // Existing retainable beetles live outside the meadow: keeping one must not
 // accidentally invent a meadow track or stack a second wind graph.
 h.choose('night');await a.flush();assert.equal(bgm().length,0);const nightWind=wind()[0];capture('rhino');await a.flush();audible();assert.equal(bgm().length,0);elements.get('keep-button').click();await a.flush();assert.equal(g.state.mode,'playing');assert.equal(g.roster.entries.length,1);assert.equal(wind()[0],nightWind);assert.equal(wind().length,1);assert.equal(bgm().length,0);
 h.choose('meadow');await a.flush();capture('butterfly');await a.flush();g.title();await a.flush();assert.equal(g.state.mode,'title');silent();focus();hidden(true);hidden(false);step(90);await a.flush();silent();
 h.choose('meadow');await a.flush();capture('butterfly');await a.flush();const endedContext=a.ctx,contexts=a.contexts.length;window.dispatchEvent(new Event('pagehide'));await a.flush();assert.equal(endedContext.state,'closed');silent();assert.ok(endedContext.sources.every(n=>n.ended));assert.equal(a.timers.size,0);
 focus();hidden(true);hidden(false);step(90);await a.flush();assert.equal(a.contexts.length,contexts);assert.equal(endedContext.state,'closed');assert.equal(endedContext.gains[0].gain.value,0);assert.equal(a.liveAssets().length,0,'post-dispose focus cannot resurrect observation sound');
 // A persisted browser-page restore is different from ordinary tab focus:
 // the old context was disposed. Keep the existing explicit-resume policy.
 const restored=new Event('pageshow');Object.defineProperty(restored,'persisted',{value:true});window.dispatchEvent(restored);focus();await a.flush();
 assert.equal(g.state.mode,'inspect');assert.equal(a.contexts.length,contexts);assert.equal(a.liveAssets().length,0,'page restoration alone must not create a context');
 g.release({lock:false});await a.flush();assert.equal(g.state.mode,'playing');assert.equal(a.contexts.length,contexts+1);audible();assert.equal(bgm().length,1);assert.equal(wind().length,1);assert.ok(endedContext.sources.every(n=>n.ended&&n.disconnected));
});
