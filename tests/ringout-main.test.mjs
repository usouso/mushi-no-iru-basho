/** Real main/rules/view with DOM/WebGL/storage doubles. Not visual playtesting. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createBattle,advanceBattle} from '../src/beetle-battle.js';
const root=path.resolve(import.meta.dirname,'..');
const source=fs.readFileSync(path.join(root,'tests/companions-main.test.mjs'),'utf8');
const factory=source.slice(0,source.indexOf('\nconst legacy=')).replace("const root=path.resolve(import.meta.dirname,'..');",`const root=${JSON.stringify(root)};`)+'\nexport {app};';
const {app}=await import('data:text/javascript;base64,'+Buffer.from(factory).toString('base64'));
const extraExports='roster,battle,battleView,battlePresentationFinished,battleRingOutShown,render,advanceVisibleBattle,startBattle,leaveBattle,returnFromBattle';
const seeds={};for(let seed=0;seed<512&&Object.keys(seeds).length<3;seed++){const end=advanceBattle(createBattle({playerSpecies:'rhino',opponentSpecies:'rhino',seed}),100);seeds[end.winner]??=seed;}
const click=(h,id)=>h.elements.get(id).click();
async function enter(t,seed){const h=await app(t,{battleSeed:seed,extraExports});h.choose('night');h.catchEligible('rhino');click(h,'keep-button');await h.g.roster.flush();click(h,'companions-button');h.elements.get('battle-opponent-select').value='rhino';click(h,'battle-start-button');assert.equal(h.g.state.mode,'battle');return h;}
function tick(h){h.g.advanceVisibleBattle(.1);h.g.render(0,.1);}
test('main shows a real visible ring-out before either winner; field and retained collection stay frozen through the final landing',async t=>{
 for(const winner of['player','opponent']){
  const h=await enter(t,seeds[winner]),{g,elements}=h,owned=g.roster.entries,time=g.simulation.time;let sawOut=false,suspended=false;
  for(let n=0;n<650&&!g.battlePresentationFinished;n++){
   tick(h);const p=g.battleView.getPresentation(),cue=elements.get('battle-cue').textContent;
   assert.equal(g.simulation.time,time);assert.deepEqual(g.roster.entries,owned);
   if(g.battle.phase==='watching'){assert.ok(Math.abs(g.battle.position)<4);assert.doesNotMatch(cue,/勝ち|場外/);}
   if(p.ringOutVisible&&!p.finished){sawOut=true;assert.equal(cue,'場外！');assert.equal(elements.get('battle-screen').dataset.phase,'ringout');assert.equal(elements.get('battle-moves').hidden,true);assert.equal(elements.get('battle-finish-button').hidden,true);}
   if(g.battle.phase==='finished'&&!p.settled&&!suspended){suspended=true;const age=p.age,old=g.battle;document.hidden=true;document.dispatchEvent(new Event('visibilitychange'));for(let j=0;j<12;j++)tick(h);assert.equal(g.battle,old);assert.equal(g.battleView.getPresentation().age,age);document.hidden=false;document.dispatchEvent(new Event('visibilitychange'));}
   if(/勝ち/.test(cue)){assert.equal(p.finished,true);assert.equal(p.ringOutVisible,true);assert.equal(Math.abs(g.battle.position),4);}
  }
  assert.ok(sawOut&&suspended);assert.equal(g.battlePresentationFinished,true);assert.equal(g.battle.winner,winner);assert.equal(elements.get('battle-cue').textContent,winner==='player'?'自分の勝ち！':'COMの勝ち');assert.equal(elements.get('battle-finish-button').hidden,false);
  const final=elements.get('battle-cue').textContent;for(let n=0;n<8;n++)g.render(0,0);assert.equal(elements.get('battle-cue').textContent,final);
  g.returnFromBattle();assert.equal(g.state.mode,'playing');assert.equal(g.battleRingOutShown,false);assert.deepEqual(g.roster.entries,owned);assert.equal(g.simulation.time,time);
 }
});
test('inside-ring timeout is explicitly a draw, and cancel/re-enter never creates a winner or loses a companion',async t=>{
 const h=await enter(t,seeds.draw),{g,elements}=h,owned=g.roster.entries;let exchanges12=false;
 for(let n=0;n<650&&!g.battlePresentationFinished;n++){tick(h);if(g.battle.exchanges===12){exchanges12=true;assert.equal(g.battle.phase,'watching');assert.equal(g.battle.winner,null);}assert.equal(g.battleRingOutShown,false);assert.doesNotMatch(elements.get('battle-cue').textContent,/勝ち|場外/);}
 assert.ok(exchanges12);assert.equal(g.battle.finishReason,'time-limit');assert.equal(g.battle.winner,'draw');assert.ok(Math.abs(g.battle.position)<4);assert.equal(elements.get('battle-cue').textContent,'時間切れ・引き分け');
 g.leaveBattle();assert.equal(g.state.mode,'companions');click(h,'battle-start-button');assert.equal(g.battle.exchanges,0);assert.equal(g.battlePresentationFinished,false);assert.equal(g.battleRingOutShown,false);tick(h);g.leaveBattle();assert.equal(g.battle.winner,null);assert.equal(g.battle.phase,'cancelled');assert.deepEqual(g.roster.entries,owned);
});
