/** Changed edge-pressure outcomes through the actual main/rules/view. Renderer,
 * DOM, storage and audio are doubles; no GPU or physical playtest claim. */
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),source=fs.readFileSync(path.join(root,'tests/companions-main.test.mjs'),'utf8');
const factory=source.slice(0,source.indexOf('\nconst legacy=')).replace("const root=path.resolve(import.meta.dirname,'..');",`const root=${JSON.stringify(root)};`)+'\nexport {app};';
const{app}=await import('data:text/javascript;base64,'+Buffer.from(factory).toString('base64'));
const extraExports='roster,battle,battleView,battlePresentationFinished,battleRingOutShown,render,advanceVisibleBattle,startBattle,leaveBattle,returnFromBattle',click=(h,id)=>h.elements.get(id).click();
test('newly earlier or resolved stag matches still show physical ring-out before a winner; retained draws and return preserve ownership',async t=>{
 for(const[playerSpecies,seed,winner,exchanges]of[['rhino',1,'player',27],['stag',1,'player',32],['stag',4,'draw',36]]){
  const h=await app(t,{battleSeed:seed,extraExports}),{g,elements}=h;h.choose('night');const item=h.catchEligible(playerSpecies);click(h,'keep-button');await g.roster.flush();click(h,'companions-button');elements.get('battle-opponent-select').value='stag';click(h,'battle-start-button');assert.equal(g.state.mode,'battle');
  const owned=g.roster.entries,raw=h.savedSettings.get('mushi-companions-v2'),time=g.simulation.time;let sawOut=false,paused=false;
  for(let n=0;n<650&&!g.battlePresentationFinished;n++){
   g.advanceVisibleBattle(.1);g.render(0,.1);const p=g.battleView.getPresentation(),cue=elements.get('battle-cue').textContent;
   assert.equal(g.simulation.time,time);assert.deepEqual(g.roster.entries,owned);
   if(g.battle.phase==='watching')assert.doesNotMatch(cue,/場外|勝ち/);
   if(p.ringOutVisible){sawOut=true;assert.equal(Math.abs(g.battle.position),4);if(!p.finished){assert.equal(cue,'場外！');assert.equal(elements.get('battle-finish-button').hidden,true);}}
   if(/勝ち/.test(cue)){assert.equal(p.finished,true);assert.equal(p.ringOutVisible,true);}
   if(g.battle.phase==='finished'&&!p.settled&&!paused){paused=true;const old=g.battle,age=p.age;document.hidden=true;document.dispatchEvent(new Event('visibilitychange'));for(let j=0;j<5;j++){g.advanceVisibleBattle(.1);g.render(0,.1);}assert.equal(g.battle,old);assert.equal(g.battleView.getPresentation().age,age);document.hidden=false;document.dispatchEvent(new Event('visibilitychange'));}
  }
  assert.equal(g.battlePresentationFinished,true);assert.equal(g.battle.winner,winner);assert.equal(g.battle.exchanges,exchanges);assert.equal(sawOut,winner!=='draw');assert.equal(elements.get('battle-cue').textContent,winner==='draw'?'時間切れ・引き分け':'自分の勝ち！');assert.equal(h.savedSettings.get('mushi-companions-v2'),raw);g.returnFromBattle();assert.equal(g.state.mode,'playing');assert.deepEqual(g.roster.entries,owned);assert.equal(g.simulation.items.find(i=>i.id===item.id).companion,true);
 }
});
