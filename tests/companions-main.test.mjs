/** Local companion/COM integration. Real THREE matrices and actual main modules;
 * fake DOM/WebGL/audio, Map storage and explicit Web Locks. Not browser visual,
 * acoustic, persistence, physical-controller or play-feel certification. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve(import.meta.dirname,'..');
const JOURNAL_KEY='mushi-journal-v2',ROSTER_KEY='mushi-companions-v2',LEGACY_ROSTER_KEY='mushi-companions-v1',EXPEDITION_KEY='mushi-expedition-v1';
let nonce=0;
function testLocks(){const tails=new Map();return {request(key,options,callback){assert.ok([JOURNAL_KEY,ROSTER_KEY,LEGACY_ROSTER_KEY,EXPEDITION_KEY].includes(key));assert.equal(options.mode,'exclusive');const next=(tails.get(key)||Promise.resolve()).then(callback);tails.set(key,next.catch(()=>{}));return next;}};}
async function app(t,{entries=[],battleSeed=0,locks=testLocks(),blockWrite=()=>false,expeditionEnabled=false,extraExports='roster,battle,models,keepCaptured,openCompanions,closeCompanions,releaseCompanion,startBattle,leaveBattle,returnFromBattle,applyCompanionPresence'}={}){
 const config={entries,battleSeed,locks,blockWrite,expeditionEnabled,writes:[]};Object.defineProperty(globalThis,'__companionsMainConfig',{configurable:true,value:config});
 const existing=fs.readFileSync(path.join(root,'tests/direct-habitat-switch.test.mjs'),'utf8'),marker="\nconst select=()=>elements.get('travel-habitat-select');";assert.ok(existing.includes(marker));
 let source=existing.slice(0,existing.indexOf(marker));
 source=source.replace("from './fixtures/journal-locks.mjs'",`from ${JSON.stringify(pathToFileURL(path.join(root,'tests/fixtures/journal-locks.mjs')).href)}`).replace("const root=path.resolve(import.meta.dirname,'..');",`const root=${JSON.stringify(root)};\nconst companionConfig=globalThis.__companionsMainConfig;`);
 source=source.replace('const savedSettings=new Map();','const savedSettings=new Map(companionConfig.entries);');
 // Legacy scenarios explicitly make only the new outing key unavailable.
 // New individual scenarios enable the real production store and Web Locks.
 source=source.replace("getItem:key=>{if(blockStorage)throw Error('Storage blocked');return savedSettings.get(key)??null;}","getItem:key=>{if(blockStorage||(!companionConfig.expeditionEnabled&&key==='mushi-expedition-v1'))throw Error('Storage blocked');return savedSettings.get(key)??null;}");
 source=source.replace("setItem:(key,value)=>{if(blockStorage)throw Error('Storage blocked');savedSettings.set(key,String(value));}","setItem:(key,value)=>{if(blockStorage||companionConfig.blockWrite(key))throw Error('Storage blocked');companionConfig.writes.push([key,String(value)]);savedSettings.set(key,String(value));}");
 source=source.replace('navigator:{locks:createTestLocks(),','navigator:{locks:companionConfig.locks,');
 source=source.replace('const globals={window,', 'const globals={crypto:{getRandomValues(array){array[0]=companionConfig.battleSeed;return array;}},window,');
 const read="let source=fs.readFileSync(path.join(root,'src',name),'utf8');";assert.ok(source.includes(read));
 source=source.replace(read,read+`\n source+='\\n// companions-main scenario ${++nonce}';`);
 source=source.replace('export {state,simulation,world,journal,',`export {expedition,activeOuting,newOuting,capturedMeasurement,${extraExports?extraExports+',':''}state,simulation,world,journal,`);
 source+='\nexport {g,frame,elements,key,choose,find,modal,descendants,moduleURL,savedSettings,settle,master};';
 const h=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 const appWindow=window;t.after(()=>{appWindow.dispatchEvent(new Event('pagehide'));delete globalThis.__companionsMainConfig;});
 const mouse=(type,button)=>{const target=h.elements.get('game-canvas'),event=new Event(type,{cancelable:true});Object.defineProperties(event,{target:{value:target},button:{value:button},clientX:{value:0},clientY:{value:0}});(type==='mousedown'?target:document).dispatchEvent(event);};
 function catchEligible(species,{wait=true}={}){
  const {g}=h,item=g.simulation.items.find(i=>i.species===species&&!i.companion);assert.ok(item,`${species} wild specimen`);
  let x,z;if(species==='rhino'){x=-2;z=2;}else if(species==='stag'){x=-3.15;z=4;}else{x=item.x;z=item.z+1.8;}
  const quiet=species==='stag',y=g.world.heightAt(x,z)+(quiet?1.28:1.65);if(quiet)mouse('mousedown',2);
  g.setPose({x,y,z,speed:0,yaw:Math.atan2(x-item.x,z-item.z),pitch:Math.atan2(item.y-y,Math.hypot(item.x-x,item.z-z))});h.frame(1);g.state.cooldown=0;
  h.key('keydown','Space');h.key('keyup','Space');if(quiet)mouse('mouseup',2);
  assert.equal(g.simulation.caught?.id,item.id,'actual net catches the intended individual');if(wait){h.frame(22);assert.equal(g.state.mode,'inspect');}return item;
 }
 function travel(id){const {g,elements}=h;if(g.state.mode==='paused'){}else{assert.equal(g.state.mode,'playing');g.pause({lock:false});}const select=elements.get('travel-habitat-select');select.value=id;select.dispatchEvent(new Event('change'));elements.get('travel-button').click();h.frame(1);assert.equal(g.state.mode,'playing');assert.equal(g.state.habitat,id);}
 return {...h,config,mouse,catchEligible,travel};
}
function finishWatching(h){
 const frozenTime=h.g.simulation.time;let frames=0;
 assert.equal(h.g.battle.phase,'watching');
 while(h.g.battle.phase==='watching'&&frames<30*60){h.frame(1);frames++;assert.equal(h.g.simulation.time,frozenTime,'field time is frozen throughout the match');}
 assert.equal(h.g.battle.phase,'finished');assert.ok(h.g.battle.elapsed>=15&&h.g.battle.elapsed<=30,'a short visible match ends without action input');return h.g.battle;
}
const legacy=JSON.stringify({version:1,entries:[]});
const journalRecord={species:'rhino',firstSeen:1,lastSeen:2,location:'previous visit',x:1,z:2,note:'既存の角のメモ'};
const journalSeed=JSON.stringify({version:2,legacyImportDone:true,entries:[journalRecord]});
const select=(h,id,value)=>{const el=h.elements.get(id);el.value=value;el.dispatchEvent(new Event('change'));};
const click=(h,id)=>h.elements.get(id).click();
function hasOrigin(h,entry){
 const item=h.g.simulation.items.find(i=>i.id===entry.originIndividualId&&i.species===entry.species);assert.ok(item);assert.equal(item.companion,true);assert.equal(item.caught,true);assert.equal(h.g.simulation.caught,null);h.frame(1);assert.equal(h.g.models.get(item.id).visible,false);
 const eye={x:item.x,y:item.y+.5,z:item.z+1.5},direction={x:0,y:-.5,z:-1.5};assert.notEqual(h.g.simulation.findTarget(eye,direction)?.item.id,item.id,'retained specimen is not a target');
 const result=h.g.simulation.swing(eye,direction);assert.notEqual(result.item?.id,item.id,'retained specimen cannot be caught twice');if(result.ok)h.g.simulation.release(eye);
}

test('actual captures become three companions, survive resets/travel/reload, fight COM without loss, and return only after explicit release',async t=>{
 const h=await app(t,{entries:[['mushi-journal-v1',legacy],[JOURNAL_KEY,journalSeed]]}),{g,elements}=h;
 assert.equal(g.roster.entries.length,0,'existing encounter records do not create ownership');
 h.choose('tropical');const hercules=h.catchEligible('hercules',{wait:false});g.openCompanions();assert.equal(g.state.mode,'playing','capture-delay transition cannot be stolen by companions');h.frame(22);assert.equal(g.state.mode,'inspect');assert.equal(elements.get('keep-button').hidden,false);click(h,'keep-button');assert.equal(g.state.mode,'playing');assert.equal(g.simulation.caught,null);assert.equal(hercules.companion,true);assert.equal(g.roster.entries.length,1);click(h,'keep-button');assert.equal(g.roster.entries.length,1,'double Keep cannot duplicate');await g.roster.flush();await g.journal.flush();
 const first=g.roster.entries[0];hasOrigin(h,first);g.restart();hasOrigin(h,first);
 const another=h.catchEligible('hercules');assert.notEqual(another.id,first.originIndividualId);assert.equal(elements.get('keep-button').disabled,false);g.keepCaptured();assert.equal(g.state.mode,'inspect');assert.equal(g.roster.entries.length,1);g.release({lock:false});
 h.travel('night');for(const species of ['rhino','stag']){h.catchEligible(species);click(h,'keep-button');assert.equal(g.state.mode,'playing');await g.roster.flush();await g.journal.flush();}
 assert.deepEqual(g.roster.entries.map(e=>e.species),['hercules','rhino','stag']);assert.equal(g.journal.entries.find(e=>e.species==='rhino').note,journalRecord.note);
 for(const e of g.roster.entries.filter(e=>e.originHabitat==='night'))hasOrigin(h,e);
 g.restart();for(const e of g.roster.entries.filter(e=>e.originHabitat==='night'))hasOrigin(h,e);
 const rosterRaw=h.savedSettings.get(ROSTER_KEY),journalRaw=h.savedSettings.get(JOURNAL_KEY);assert.equal(h.savedSettings.get('mushi-journal-v1'),legacy);
 // Explicitly load a new store against the current bytes. Main's own reload is
 // exercised below as a separate independent scenario, not a hidden fake save.
 const store=await import(h.moduleURL('individual-roster.js'));assert.deepEqual(store.createCompanionRoster(localStorage,{locks:testLocks()}).entries,g.roster.entries);
 h.travel('tropical');hasOrigin(h,first);h.travel('night');
 click(h,'companions-button');assert.equal(g.state.mode,'companions');assert.equal(elements.get('companions-screen').hidden,false);await h.settle();assert.equal(h.master().value,0);assert.equal(elements.get('companion-select').children.length,3);select(h,'companion-select',first.id);select(h,'battle-opponent-select','rhino');click(h,'battle-start-button');assert.equal(g.state.mode,'battle');assert.equal(elements.get('battle-screen').hidden,false);assert.match(elements.get('battle-cue').textContent,/操作は不要/);assert.equal(g.battle.opponentSpecies,'rhino');
 const oldRoster=g.roster.entries;finishWatching(h);
 assert.equal(g.battle.phase,'finished');assert.equal(g.battle.winner,'opponent');assert.match(elements.get('battle-cue').textContent,/相手の勝ち/);assert.equal(elements.get('battle-finish-button').hidden,false);assert.deepEqual(g.roster.entries,oldRoster);assert.equal(h.savedSettings.get(ROSTER_KEY),rosterRaw);assert.equal(h.savedSettings.get(JOURNAL_KEY),journalRaw);click(h,'battle-finish-button');assert.equal(g.state.mode,'playing');
 // Paused-origin cancellation returns through the list, not a hidden resume.
 g.pause({lock:false});click(h,'pause-companions-button');assert.equal(g.state.mode,'companions');click(h,'battle-start-button');assert.equal(g.state.mode,'battle');h.key('keydown','Escape');h.key('keyup','Escape');assert.equal(g.state.mode,'companions');assert.equal(g.battle.phase,'cancelled');h.key('keydown','Escape');h.key('keyup','Escape');assert.equal(g.state.mode,'paused');assert.deepEqual(g.roster.entries,oldRoster);assert.equal(h.savedSettings.get(ROSTER_KEY),rosterRaw);g.resume({lock:false});
 // First release click only arms confirmation. Leaving the list cancels it.
 click(h,'companions-button');select(h,'companion-select','night/insect-4');click(h,'companion-release-button');assert.equal(g.roster.entries.length,3);click(h,'companions-close-button');click(h,'companions-button');select(h,'companion-select','night/insect-4');click(h,'companion-release-button');assert.equal(g.roster.entries.length,3);click(h,'companion-release-button');assert.equal(g.roster.entries.length,2);await g.roster.flush();assert.equal(h.savedSettings.get(JOURNAL_KEY),journalRaw);
 const returned=g.simulation.items.find(i=>i.species==='rhino');assert.equal(returned.companion,false);assert.equal(returned.caught,false);assert.equal(returned.rhinoPhase,'walking');click(h,'companions-close-button');h.frame(2);assert.equal(g.models.get(returned.id).visible,true);assert.deepEqual(g.roster.entries.map(e=>e.species),['hercules','stag']);
 // Save the raw successful three-companion snapshot for a true fresh-main load.
 const fresh=await app(t,{entries:[[ROSTER_KEY,rosterRaw],[JOURNAL_KEY,journalRaw],['mushi-journal-v1',legacy]]});assert.equal(fresh.g.roster.entries.length,3);fresh.choose('night');for(const e of fresh.g.roster.entries.filter(e=>e.originHabitat==='night'))hasOrigin(fresh,e);fresh.travel('tropical');hasOrigin(fresh,fresh.g.roster.entries.find(e=>e.species==='hercules'));assert.equal(fresh.savedSettings.get(JOURNAL_KEY),journalRaw);assert.equal(fresh.savedSettings.get('mushi-journal-v1'),legacy);
});

test('unsupported captured insects keep the existing journal and release flow without a companion button',async t=>{
 const h=await app(t),{g,elements}=h;h.choose('meadow');g.restart();h.frame(60);const item=g.simulation.items[0];g.setPose({x:item.x,y:item.y+.5,z:item.z+1.5,yaw:0,pitch:-.3});g.swing();assert.equal(g.simulation.caught?.species,'butterfly');h.frame(22);assert.equal(g.state.mode,'inspect');assert.equal(elements.get('keep-button').hidden,true);g.keepCaptured();assert.equal(g.roster.entries.length,0);assert.equal(g.state.mode,'inspect');click(h,'release-button');assert.equal(g.state.mode,'playing');assert.equal(g.simulation.caught,null);assert.equal(g.journal.entries.some(e=>e.species==='butterfly'),true);
});

test('failed companion persistence remains visibly session-only without overwriting stored ownership or the journal',async t=>{
 // Quota-like failure on the new key only; the existing journal remains usable.
 const raw=JSON.stringify({version:1,entries:[{id:'night/insect-4',species:'rhino',originHabitat:'night',originIndividualId:'insect-4',capturedAt:100}]}),h=await app(t,{entries:[[LEGACY_ROSTER_KEY,raw],[JOURNAL_KEY,journalSeed]],blockWrite:key=>key===ROSTER_KEY}),{g,elements}=h;
 h.choose('tropical');const item=h.catchEligible('hercules');click(h,'keep-button');await g.roster.flush();await g.journal.flush();assert.equal(g.roster.saved,false);assert.equal(g.roster.entries.length,2);assert.equal(item.companion,true);h.frame(1);assert.equal(g.models.get(item.id).visible,false);assert.equal(h.savedSettings.get(LEGACY_ROSTER_KEY),raw);assert.equal(h.savedSettings.has(ROSTER_KEY),false);click(h,'companions-button');assert.equal(elements.get('companion-save-status').dataset.unsaved,'true');assert.match(elements.get('companion-save-status').textContent,/保存できません/);assert.match(elements.get('companion-save-status').textContent,/ページ内では遊べます/);
 const before=g.roster.entries,journalRaw=h.savedSettings.get(JOURNAL_KEY);select(h,'companion-select','tropical/'+item.id);click(h,'battle-start-button');assert.equal(g.state.mode,'battle');click(h,'battle-exit-button');assert.equal(g.state.mode,'companions');assert.deepEqual(g.roster.entries,before);assert.equal(h.savedSettings.get(JOURNAL_KEY),journalRaw);assert.equal(h.savedSettings.get(LEGACY_ROSTER_KEY),raw);assert.equal(h.savedSettings.has(ROSTER_KEY),false);
});


test('failed release of the last companion remains warned after closing the menu; original saved bytes survive',async t=>{
 const raw=JSON.stringify({version:1,entries:[{id:'night/insect-4',species:'rhino',originHabitat:'night',originIndividualId:'insect-4',capturedAt:100}]}),h=await app(t,{entries:[[LEGACY_ROSTER_KEY,raw],[JOURNAL_KEY,journalSeed]],blockWrite:key=>key===ROSTER_KEY}),{g,elements}=h;
 h.choose('night');click(h,'companions-button');select(h,'companion-select','night/insect-4');click(h,'companion-release-button');click(h,'companion-release-button');await g.roster.flush();
 assert.equal(g.roster.entries.length,0);assert.equal(g.roster.saved,false);assert.equal(h.savedSettings.get(LEGACY_ROSTER_KEY),raw);assert.equal(h.savedSettings.has(ROSTER_KEY),false);assert.match(elements.get('companion-save-status').textContent,/保存できません/);
 click(h,'companions-close-button');assert.equal(g.state.mode,'playing');assert.match(elements.get('toast').textContent,/未保存/);
 g.pause({lock:false});g.resume({lock:false});assert.match(elements.get('toast').textContent,/未保存/);
});
