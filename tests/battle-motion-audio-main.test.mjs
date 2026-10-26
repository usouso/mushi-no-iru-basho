/** Actual main/view/audio modules and real THREE geometry. Explicit DOM,
 * WebGL and WebAudio doubles only; this is not rendered or acoustic QA. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fixture,flush} from './fixtures/asset-audio-mock.mjs';
const root=path.resolve(import.meta.dirname,'..');
const original=fs.readFileSync(path.join(root,'tests/companions-main.test.mjs'),'utf8');
let factory=original.slice(0,original.indexOf('\nconst legacy=')).replace("const root=path.resolve(import.meta.dirname,'..');",`const root=${JSON.stringify(root)};`);
const hook=" source=source.replace('const savedSettings=new Map();','const savedSettings=new Map(companionConfig.entries);');";
assert.ok(factory.includes(hook));
factory=factory.replace(hook,hook+`\n source=source.replace('window.AudioContext=AudioContext;', 'window.AudioContext=globalThis.__battleAudioEnvironment.AudioContext;window.fetch=globalThis.__battleAudioEnvironment.fetch;window.location=globalThis.__battleAudioEnvironment.location;');`);
const read=" const read=\"let source=fs.readFileSync(path.join(root,'src',name),'utf8');\";assert.ok(source.includes(read));";
assert.ok(factory.includes(read));
factory=factory.replace(read,read+`\n source=source.replace(read,read+"\\n if(name==='audio.js')source=source.replace('export function createAudio({assetBaseURL}={})',\\\"export function createAudio({assetBaseURL='https://game.invalid/play/assets/audio/'}={})\\\");");`);
factory+='\nexport {app,finishWatching};';
const {app,finishWatching}=await import('data:text/javascript;base64,'+Buffer.from(factory).toString('base64'));
const extraExports='audio,renderer,render,advanceVisibleBattle,battlePresentationFinished,battlePresentationEvents,roster,battle,battleView,battleSuspended,models,keepCaptured,battleCaptured,openCompanions,closeCompanions,releaseCompanion,startBattle,leaveBattle,returnFromBattle,applyCompanionPresence';
const click=(h,id)=>h.elements.get(id).click();
async function scenario(t,{species='rhino',opponentSpecies='rhino',...options}={}){
 const f=fixture(t,options);Object.defineProperty(f,'ctx',{get:()=>f.contexts.at(-1)});Object.defineProperty(f,'master',{get:()=>f.ctx.gains[0].gain});f.liveShots=()=>f.ctx.sources.filter(n=>n.started&&!n.loop&&!n.ended);globalThis.__battleAudioEnvironment=window;t.after(()=>{delete globalThis.__battleAudioEnvironment;});
 const h=await app(t,{extraExports,battleSeed:1});h.choose('night');h.catchEligible(species);await flush();
 const calls={battleWindup:[],battleContact:[],battleResult:[],battleExchange:[]};
 const instrumented=new WeakSet();function instrument(){if(instrumented.has(h.g.audio))return;instrumented.add(h.g.audio);for(const name of Object.keys(calls)){const fn=h.g.audio[name];h.g.audio[name]=(...args)=>{calls[name].push({args,presentation:h.g.battleView?.getPresentation(),time:f.ctx.currentTime,ui:h.elements.get('battle-screen').dataset.phase});return fn(...args);};}}instrument();window.addEventListener('pageshow',instrument);
 if(opponentSpecies==='rhino')click(h,'capture-battle-button');else{click(h,'keep-button');click(h,'companions-button');h.elements.get('battle-opponent-select').value=opponentSpecies;click(h,'battle-start-button');}await flush();
 const frame=(count=1)=>{for(let i=0;i<count;i++){f.advance(1/60);h.frame(1);}};
 const until=predicate=>{for(let i=0;!predicate()&&i<4000;i++)frame();assert.ok(predicate(),'bounded visible match progress');};
 return{h,f,calls,frame,until};
}

test('actual main announces windup/contact at visible edges and shows the result only after the final landing',async t=>{
 const {h,f,calls,frame,until}=await scenario(t),{g,elements}=h,fieldTime=g.simulation.time,owned=g.roster.entries;
 until(()=>calls.battleWindup.length===1);assert.equal(calls.battleWindup[0].presentation.age,0);assert.equal(calls.battleContact.length,0);assert.equal(elements.get('battle-move-'+g.battleView.getPresentation().actor).textContent,'角すくい');assert.equal(calls.battleExchange.length,0,'legacy delayed impact is not called by new main');
 const firstStart=f.ctx.currentTime;frame(27);assert.equal(calls.battleContact.length,0,'no impact before the contact geometry');frame();assert.equal(calls.battleContact.length,1);assert.ok(calls.battleContact[0].presentation.age>=.46);assert.ok(calls.battleContact[0].time-firstStart>=.46);const hits=f.liveShots().filter(n=>n.kind==='oscillator'||(!n.buffer?.file&&!n.loop));assert.equal(hits.length,2);assert.ok(hits.every(n=>n.starts[0][0]===f.ctx.currentTime),'contact voices start now, not .18s later');
 until(()=>g.battle.phase==='finished');assert.equal(g.battlePresentationFinished,false);assert.equal(elements.get('battle-finish-button').hidden,true);assert.equal(elements.get('battle-screen').dataset.phase,'watching');assert.equal(calls.battleResult.length,0);assert.equal(g.battleView.getPresentation().age,0);
 const terminal=g.battle;frame(84);assert.equal(calls.battleResult.length,0,'1.4s is still before landing');until(()=>g.battlePresentationFinished);assert.equal(g.battle,terminal,'presentation does not rewrite battle outcome/time');assert.equal(calls.battleResult.length,1);assert.equal(calls.battleResult[0].presentation.settled,true);assert.equal(elements.get('battle-screen').dataset.phase,'finished');assert.equal(elements.get('battle-finish-button').hidden,false);
 assert.deepEqual(calls.battleWindup.map(x=>x.args[0].number),Array.from({length:g.battle.exchanges},(_,i)=>i+1));assert.deepEqual(calls.battleContact.map(x=>x.args[0].number),calls.battleWindup.map(x=>x.args[0].number));frame(120);window.dispatchEvent(new Event('focus'));await flush();assert.equal(calls.battleResult.length,1);assert.deepEqual(g.roster.entries,owned);assert.equal(g.simulation.time,fieldTime);assert.equal(f.requests.length,13);assert.equal(f.timers.size,0);
});

test('dt zero, hidden/blur/pagehide and interrupted final landing freeze presentation and never replay an exchange',async t=>{
 const {h,f,calls,frame,until}=await scenario(t,{species:'stag',opponentSpecies:'metallifer'}),{g,elements}=h;until(()=>calls.battleWindup.length===1);const motion=g.battleView.getPresentation();assert.equal(motion.family,'jaw');assert.equal(elements.get('battle-move-'+motion.actor).textContent,'大あご崩し');assert.equal(elements.get('battle-move-'+(motion.actor==='player'?'opponent':'player')).textContent,'踏ん張る');frame(10);const age=g.battleView.getPresentation().age,windups=calls.battleWindup.length,contacts=calls.battleContact.length;
 for(let i=0;i<5;i++)g.render(0,0);assert.equal(g.battleView.getPresentation().age,age);assert.equal(calls.battleWindup.length,windups);assert.equal(calls.battleContact.length,contacts);
 for(const gate of ['hidden','blur','pagehide']){
  if(gate==='hidden'){document.hidden=true;document.dispatchEvent(new Event('visibilitychange'));}else window.dispatchEvent(new Event(gate));await flush();const old=g.battle,pose=g.battleView.getPresentation();frame(80);assert.equal(g.battle,old);assert.deepEqual(g.battleView.getPresentation(),pose);assert.equal(f.master.value,0);assert.equal(f.liveShots().length,0);assert.equal(calls.battleContact.length,contacts);
  if(gate==='hidden'){document.hidden=false;document.dispatchEvent(new Event('visibilitychange'));}else if(gate==='pagehide'){const event=new Event('pageshow');Object.defineProperty(event,'persisted',{value:true});window.dispatchEvent(event);}else window.dispatchEvent(new Event('focus'));await flush();assert.equal(calls.battleWindup.length,windups);assert.equal(calls.battleContact.length,contacts);
 }
 until(()=>calls.battleContact.length===1);until(()=>g.battle.phase==='finished');document.hidden=true;document.dispatchEvent(new Event('visibilitychange'));frame(140);assert.equal(elements.get('battle-finish-button').hidden,true);assert.equal(calls.battleResult.length,0);document.hidden=false;document.dispatchEvent(new Event('visibilitychange'));await flush();until(()=>g.battlePresentationFinished);assert.equal(calls.battleResult.length,1);
 const resultCount=calls.battleResult.length;click(h,'battle-exit-button');click(h,'battle-start-button');await flush();until(()=>calls.battleWindup.length>windups&&g.battle.exchanges===1);click(h,'battle-exit-button');const stopped=f.ctx.sources.length;frame(100);assert.equal(g.state.mode,'companions');assert.equal(f.ctx.sources.length,stopped);assert.equal(calls.battleResult.length,resultCount,'cancel never announces a result');
});

test('a failed renderer cannot announce unseen motion; recovery delivers each edge once, and zero volume stays exact',async t=>{
 const {h,f,calls,frame,until}=await scenario(t),{g}=h;until(()=>g.battle.elapsed>3.55);const render=g.renderer.render.bind(g.renderer);let thrown=false;
 g.renderer.render=(...args)=>{if(!thrown&&g.battle.exchanges===1){thrown=true;throw Error('test renderer interruption');}return render(...args);};
 assert.throws(()=>frame(4),/test renderer interruption/);assert.equal(calls.battleWindup.length,0);assert.equal(calls.battleContact.length,0);g.renderer.render=render;g.render(0,0);assert.equal(calls.battleWindup.length,0,'dt0 recovery is not a playback edge');frame();assert.equal(calls.battleWindup.length,1);frame();assert.equal(calls.battleWindup.length,1);
 g.audio.setVolume(0);const nodes=f.ctx.sources.length;until(()=>g.battlePresentationFinished);assert.equal(f.master.value,0);assert.equal(f.ctx.sources.length,nodes);assert.equal(calls.battleResult.length,1,'silent event still consumed once');g.audio.setVolume(.25);const unmuted=f.ctx.sources.length;frame(90);assert.equal(f.ctx.sources.length,unmuted,'unmute cannot replay completed techniques/result');
});


test('render failure across multiple exchanges drops old effects and expired contacts instead of replaying a backlog',async t=>{
 const {h,f,calls,frame,until}=await scenario(t),{g}=h;until(()=>g.battle.elapsed>3.55);const renderer=g.renderer.render.bind(g.renderer),before=f.ctx.sources.length;
 g.renderer.render=(...args)=>{if(g.battle.exchanges>=1)throw Error('test prolonged renderer failure');return renderer(...args);};
 for(let i=0;i<400;i++){
  try{frame();}catch(error){assert.match(error.message,/test prolonged renderer failure/);}
  assert.ok(g.battlePresentationEvents.length<=3,'only current exchange edges are retained');
  if(g.battle.exchanges>=3&&g.battleView.getPresentation().age>1)break;
 }
 assert.equal(g.battle.exchanges,3);assert.ok(g.battleView.getPresentation().age>1);assert.equal(calls.battleWindup.length,0);assert.equal(calls.battleContact.length,0);assert.equal(f.ctx.sources.length,before);
 g.renderer.render=renderer;frame();assert.equal(calls.battleWindup.length,1);assert.equal(calls.battleWindup[0].args[0].number,3);assert.equal(calls.battleWindup[0].args[1].silent,true,'expired windup consumes history silently');assert.equal(calls.battleContact.length,0,'old contact is not presented during release');assert.equal(f.ctx.sources.length,before);
 until(()=>calls.battleContact.length===1);assert.equal(calls.battleContact[0].args[0].number,4);assert.equal(calls.battleWindup.at(-1).args[0].number,4);assert.equal(calls.battleWindup.at(-1).args[1].silent,false);assert.ok(f.ctx.sources.length>before);assert.ok(f.liveShots().length<=6);
});
