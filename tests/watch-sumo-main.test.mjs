/** Automatic main-loop lifecycle checks using the established explicit DOM,
 * storage, WebAudio and renderer doubles. Not a rendered/physical playtest. */
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),source=fs.readFileSync(path.join(root,'tests/companions-main.test.mjs'),'utf8'),marker='\nconst legacy=';assert.ok(source.includes(marker));
const factory=source.slice(0,source.indexOf(marker)).replace("const root=path.resolve(import.meta.dirname,'..');",`const root=${JSON.stringify(root)};`)+'\nexport {app,finishWatching};';
const {app,finishWatching}=await import('data:text/javascript;base64,'+Buffer.from(factory).toString('base64'));
const extraExports='roster,battle,battleView,battleSuspended,models,keepCaptured,battleCaptured,openCompanions,closeCompanions,releaseCompanion,startBattle,leaveBattle,returnFromBattle,applyCompanionPresence';
const click=(h,id)=>h.elements.get(id).click(),rosterKey='mushi-companions-v1';
const viewPose=g=>['player','opponent'].map(side=>{const object=g.battleView.scene.getObjectByName('battle-'+side);return[...object.position.toArray(),...object.quaternion.toArray()];});

test('automatic capture match freezes clock and model pose while hidden/unfocused, resumes without catch-up, and loss never removes the captured companion',async t=>{
 const h=await app(t,{extraExports,battleSeed:0}),{g,elements}=h;let focused=true;document.hasFocus=()=>focused;
 const blur=()=>{focused=false;window.dispatchEvent(new Event('blur'));},focus=()=>{focused=true;window.dispatchEvent(new Event('focus'));};
 const visibility=value=>{document.hidden=value;document.dispatchEvent(new Event('visibilitychange'));};
 h.choose('night');const captured=h.catchEligible('rhino');click(h,'capture-battle-button');assert.equal(g.state.mode,'battle');assert.equal(g.battle.phase,'watching');assert.equal(g.battle.seed,0);assert.equal(g.roster.entries[0].originIndividualId,captured.id);await g.roster.flush();await g.journal.flush();
 const owned=g.roster.entries,raw=h.savedSettings.get(rosterKey),fieldTime=g.simulation.time;assert.equal(g.battle.elapsed,0);h.frame(60);assert.ok(g.battle.elapsed>.9&&g.battle.elapsed<1.1);assert.equal(g.simulation.time,fieldTime);
 // There are no action buttons or manual action-dependent progress any more.
 for(const id of ['battle-push','battle-evade','battle-brace'])assert.equal(elements.has(id),false);
 const initial=g.battle;for(const code of ['Digit1','Digit2','Digit3','Space','KeyB']){h.key('keydown',code);h.key('keyup',code);}click(h,'capture-battle-button');click(h,'battle-start-button');assert.equal(g.battle,initial);assert.equal(g.roster.entries.length,1);
 visibility(true);const hidden=g.battle,hiddenPose=viewPose(g);h.frame(180);assert.equal(g.battle,hidden);assert.deepEqual(viewPose(g),hiddenPose);assert.equal(g.battleSuspended,true);assert.match(elements.get('battle-state').textContent,/一時停止/);
 focused=false;visibility(false);h.frame(60);assert.equal(g.battle,hidden,'visibility alone cannot resume an unfocused page');focus();h.frame(1);assert.ok(g.battle.elapsed-hidden.elapsed>0&&g.battle.elapsed-hidden.elapsed<.02,'no hidden-time catch-up');assert.equal(g.battleSuspended,false);
 h.frame(140);blur();const blurred=g.battle,blurredPose=viewPose(g);h.frame(180);assert.equal(g.battle,blurred);assert.deepEqual(viewPose(g),blurredPose);focus();h.frame(1);assert.ok(g.battle.elapsed>blurred.elapsed&&g.battle.elapsed-blurred.elapsed<.02);
 window.dispatchEvent(new Event('pagehide'));const departed=g.battle;h.frame(90);assert.equal(g.battle,departed,'pagehide suspends a visible but departed page');const restored=new Event('pageshow');Object.defineProperty(restored,'persisted',{value:true});window.dispatchEvent(restored);focus();h.frame(1);assert.ok(g.battle.elapsed>departed.elapsed&&g.battle.elapsed-departed.elapsed<.02);
 finishWatching(h);assert.equal(g.battle.winner,'opponent');assert.match(elements.get('battle-cue').textContent,/相手の勝ち/);assert.equal(elements.get('battle-finish-button').hidden,false);assert.deepEqual(g.roster.entries,owned);assert.equal(h.savedSettings.get(rosterKey),raw);assert.equal(g.simulation.time,fieldTime);
 const finished=g.battle;h.frame(300);assert.equal(g.battle,finished);visibility(true);visibility(false);blur();focus();h.frame(10);assert.equal(g.battle,finished,'terminal result cannot be rerolled by focus or frames');click(h,'battle-finish-button');click(h,'battle-finish-button');assert.equal(g.state.mode,'playing');assert.deepEqual(g.roster.entries,owned);assert.equal(g.simulation.items.find(i=>i.id===captured.id).companion,true);
});

test('a winning automatic match returns without rewards mutating the collection; cancellation preserves the same individual and has no result',async t=>{
 const h=await app(t,{extraExports,battleSeed:1}),{g,elements}=h;h.choose('tropical');const item=h.catchEligible('hercules');click(h,'capture-battle-button');await g.roster.flush();const owned=g.roster.entries,raw=h.savedSettings.get(rosterKey);finishWatching(h);assert.equal(g.battle.winner,'player');assert.match(elements.get('battle-cue').textContent,/こちらの勝ち/);assert.deepEqual(g.roster.entries,owned);assert.equal(h.savedSettings.get(rosterKey),raw);click(h,'battle-finish-button');assert.equal(g.state.mode,'playing');
 click(h,'companions-button');click(h,'battle-start-button');assert.equal(g.battle.phase,'watching');h.frame(240);const elapsed=g.battle.elapsed;assert.ok(elapsed>3);h.key('keydown','Escape');h.key('keyup','Escape');assert.equal(g.state.mode,'companions');assert.equal(g.battle.phase,'cancelled');assert.equal(g.battle.winner,null);assert.equal(g.battle.finishReason,null);assert.equal(g.battle.elapsed,elapsed);h.frame(120);assert.equal(g.battle.elapsed,elapsed);assert.deepEqual(g.roster.entries,owned);assert.equal(h.savedSettings.get(rosterKey),raw);click(h,'companions-close-button');assert.equal(g.state.mode,'playing');assert.equal(g.simulation.items.find(i=>i.id===item.id).companion,true);
});
