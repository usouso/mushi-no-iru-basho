/** Independent actual-main check for the fourth battle-eligible beetle.
 * Uses real simulation/net targeting, module code and THREE geometry. DOM,
 * WebGL, WebAudio and storage are doubles: this is NOT browser/render/listening
 * or durable-user-save certification. No production debug API is introduced. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const JOURNAL_KEY='mushi-journal-v2',ROSTER_KEY='mushi-companions-v2',LEGACY_ROSTER_KEY='mushi-companions-v1';
// Reuse only the existing harness factory, not its test bodies or expectations.
const original=fs.readFileSync(path.join(root,'tests/companions-main.test.mjs'),'utf8');
const marker='\nconst legacy=';assert.ok(original.includes(marker));
const factory=original.slice(0,original.indexOf(marker)).replace("const root=path.resolve(import.meta.dirname,'..');",`const root=${JSON.stringify(root)};`)+'\nexport {app,finishWatching};';
const {app,finishWatching}=await import('data:text/javascript;base64,'+Buffer.from(factory).toString('base64'));
const extraExports='roster,battle,models,keepCaptured,openCompanions,closeCompanions,releaseCompanion,startBattle,leaveBattle,returnFromBattle,applyCompanionPresence,collides';
const oldEntries=[
 {id:'tropical/insect-5',species:'hercules',originHabitat:'tropical',originIndividualId:'insect-5',capturedAt:10},
 {id:'night/insect-4',species:'rhino',originHabitat:'night',originIndividualId:'insect-4',capturedAt:20},
 {id:'night/insect-5',species:'stag',originHabitat:'night',originIndividualId:'insect-5',capturedAt:30},
];
const normalized=rows=>rows.map(row=>({...row,originKind:'legacy',originEncounterId:null,sizePermille:null,measureVersion:null}));
const oldRaw=JSON.stringify({version:1,entries:oldEntries});
const oldJournal={species:'rhino',firstSeen:1,lastSeen:2,location:'previous visit',x:1,z:2,note:'以前から残した角のメモ'};
const journalRaw=JSON.stringify({version:2,legacyImportDone:true,entries:[oldJournal]});
const legacyRaw=JSON.stringify({version:1,entries:[]});
const click=(h,id)=>h.elements.get(id).click();
const select=(h,id,value)=>{const element=h.elements.get(id);element.value=value;element.dispatchEvent(new Event('change'));};
const originalLeafRows=[['insect-1','leafinsect',0,4],['insect-2','leafinsect',-5,-3],['insect-3','leafinsect',5,-9]];
function fieldLayout(h){
 const items=h.g.simulation.items;assert.equal(items.length,5);assert.deepEqual(items.slice(0,3).map(i=>[i.id,i.species,i.home.x,i.home.z]),originalLeafRows);
 assert.equal(items[3].species,'metallifer');assert.equal(items[3].id,'insect-4');assert.deepEqual([items[4].id,items[4].species],['insect-5','atlas']);return items[3];
}
function catchMetallifer(h,{wait=true}={}){
 const {g}=h,item=g.simulation.items.find(i=>i.species==='metallifer'&&!i.companion);assert.ok(item,'one wild metallifer is available');
 // Side-on to the low observation branch, with a normal legal standing eye.
 const x=0,z=item.z,y=g.world.heightAt(x,z)+1.65;
 assert.equal(g.collides(x,z),false,'catch approach is not inside a solid');
 g.setPose({x,z,y,speed:0,yaw:Math.atan2(x-item.x,z-item.z),pitch:Math.atan2(item.y-y,Math.hypot(item.x-x,item.z-z))});h.frame(1);g.state.cooldown=0;
 h.key('keydown','Space');h.key('keyup','Space');assert.equal(g.simulation.caught?.id,item.id,'actual net catches the new individual');
 assert.ok(g.journal.entries.some(e=>e.species==='metallifer'),'record exists at capture, before inspection delay');
 if(wait){h.frame(22);assert.equal(g.state.mode,'inspect');assert.equal(h.elements.get('keep-button').hidden,false);}return item;
}
function retainedAbsent(h,entry){
 const item=h.g.simulation.items.find(i=>i.id===entry.originIndividualId&&i.species===entry.species);assert.ok(item);assert.equal(item.companion,true);assert.equal(item.caught,true);assert.equal(h.g.simulation.caught,null);h.frame(1);assert.equal(h.g.models.get(item.id).visible,false);
 const eye={x:item.x+1.8,y:item.y+.8,z:item.z+.15},direction={x:item.x-eye.x,y:item.y-eye.y,z:item.z-eye.z};assert.notEqual(h.g.simulation.findTarget(eye,direction)?.item.id,item.id);const result=h.g.simulation.swing(eye,direction);assert.notEqual(result.item?.id,item.id,'owned insect cannot be caught a second time');if(result.ok)h.g.simulation.release(eye);
}
async function begin(h,{own='understory/insect-4',opponent='rhino'}={}){
 click(h,'companions-button');assert.equal(h.g.state.mode,'companions');select(h,'companion-select',own);select(h,'battle-opponent-select',opponent);click(h,'battle-start-button');assert.equal(h.g.state.mode,'battle');assert.equal(h.g.battle.playerSpecies,own.startsWith('understory/')?'metallifer':h.g.roster.entries.find(e=>e.id===own).species);assert.equal(h.g.battle.opponentSpecies,opponent);
}

test('new actual net capture keeps legacy records, completes COM loss without ownership loss, and returns for recapture only after explicit release',async t=>{
 const h=await app(t,{entries:[[LEGACY_ROSTER_KEY,oldRaw],[JOURNAL_KEY,journalRaw],['mushi-journal-v1',legacyRaw]],extraExports}),{g,elements}=h;
 assert.deepEqual(g.roster.entries,normalized(oldEntries));h.choose('understory');fieldLayout(h);const item=catchMetallifer(h,{wait:false});g.openCompanions();assert.equal(g.state.mode,'playing','capture delay cannot be stolen by companion menu');h.frame(22);assert.equal(g.state.mode,'inspect');
 g.journal.setNote('metallifer','長い顎と大きな内歯');click(h,'keep-button');assert.equal(g.state.mode,'playing');assert.equal(g.simulation.caught,null);click(h,'keep-button');assert.equal(g.roster.entries.length,4,'double Keep cannot duplicate');await g.roster.flush();await g.journal.flush();
 assert.deepEqual(g.roster.entries.slice(0,3),normalized(oldEntries));assert.deepEqual(g.journal.entries.find(e=>e.species==='rhino'),oldJournal);assert.equal(h.savedSettings.get('mushi-journal-v1'),legacyRaw);
 const entry=g.roster.entries.find(e=>e.species==='metallifer');assert.equal(entry.id,'understory/'+item.id);assert.equal(entry.originHabitat,'understory');retainedAbsent(h,entry);g.restart();retainedAbsent(h,entry);
 h.travel('night');for(const old of oldEntries.filter(e=>e.originHabitat==='night'))retainedAbsent(h,old);h.travel('tropical');retainedAbsent(h,oldEntries[0]);h.travel('understory');fieldLayout(h);retainedAbsent(h,entry);
 const savedRoster=h.savedSettings.get(ROSTER_KEY),savedJournal=h.savedSettings.get(JOURNAL_KEY);assert.equal(JSON.parse(savedRoster).version,2,'new roster schema retains normalized legacy entries');assert.equal(JSON.parse(savedRoster).legacyImportDone,true);assert.equal(h.savedSettings.get(LEGACY_ROSTER_KEY),oldRaw);
 await begin(h);assert.equal(elements.get('companion-select').children.length,4);assert.equal(elements.get('battle-opponent-select').children.length,5);finishWatching(h);
 assert.equal(g.battle.phase,'finished');assert.equal(g.battle.winner,'opponent');assert.equal(h.savedSettings.get(ROSTER_KEY),savedRoster);assert.equal(h.savedSettings.get(JOURNAL_KEY),savedJournal);click(h,'battle-finish-button');assert.equal(g.state.mode,'playing');retainedAbsent(h,entry);
 // A true fresh-main instance consumes successful saved bytes before any release.
 const fresh=await app(t,{entries:[[ROSTER_KEY,savedRoster],[LEGACY_ROSTER_KEY,oldRaw],[JOURNAL_KEY,savedJournal],['mushi-journal-v1',legacyRaw]],extraExports});fresh.choose('understory');fieldLayout(fresh);retainedAbsent(fresh,entry);assert.deepEqual(fresh.g.roster.entries.slice(0,3),normalized(oldEntries));assert.equal(fresh.g.journal.entries.find(e=>e.species==='metallifer').note,'長い顎と大きな内歯');
 click(fresh,'companions-button');select(fresh,'companion-select',entry.id);click(fresh,'companion-release-button');assert.equal(fresh.g.roster.entries.length,4,'first click merely confirms intent');click(fresh,'companions-close-button');click(fresh,'companions-button');select(fresh,'companion-select',entry.id);click(fresh,'companion-release-button');assert.equal(fresh.g.roster.entries.length,4,'closing cancels earlier confirmation');click(fresh,'companion-release-button');await fresh.g.roster.flush();assert.deepEqual(fresh.g.roster.entries,normalized(oldEntries));assert.equal(fresh.savedSettings.get(JOURNAL_KEY),savedJournal);click(fresh,'companions-close-button');assert.equal(fresh.g.state.mode,'playing');const returned=fresh.g.simulation.items.find(i=>i.species==='metallifer');assert.equal(returned.companion,false);assert.equal(returned.caught,false);fresh.frame(2);assert.equal(fresh.g.models.get(returned.id).visible,true);catchMetallifer(fresh);fresh.g.release({lock:false});assert.equal(fresh.g.state.mode,'playing');assert.equal(fresh.g.roster.entries.length,3,'normal release never silently keeps an insect');
});

test('metallifer is available as visible COM opponent; cancellation returns through the roster to the exact originating mode',async t=>{
 const all=[...oldEntries,{id:'understory/insect-4',species:'metallifer',originHabitat:'understory',originIndividualId:'insect-4',capturedAt:40}],raw=JSON.stringify({version:1,entries:all});
 const h=await app(t,{entries:[[LEGACY_ROSTER_KEY,raw],[JOURNAL_KEY,journalRaw]],extraExports}),{g}=h;h.choose('understory');
 await begin(h,{own:'night/insect-4',opponent:'metallifer'});assert.ok(g.battle.cue.length>0);assert.match(h.elements.get('battle-cue').textContent,/見守ろう/);click(h,'battle-exit-button');assert.equal(g.state.mode,'companions');assert.equal(g.battle.phase,'cancelled');click(h,'companions-close-button');assert.equal(g.state.mode,'playing');
 g.pause({lock:false});click(h,'pause-companions-button');assert.equal(g.state.mode,'companions');select(h,'companion-select','understory/insect-4');select(h,'battle-opponent-select','metallifer');click(h,'battle-start-button');assert.equal(g.state.mode,'battle');h.key('keydown','Escape');h.key('keyup','Escape');assert.equal(g.state.mode,'companions');h.key('keydown','Escape');h.key('keyup','Escape');assert.equal(g.state.mode,'paused');assert.deepEqual(g.roster.entries,normalized(all));assert.equal(h.savedSettings.get(LEGACY_ROSTER_KEY),raw);assert.equal(h.savedSettings.get(JOURNAL_KEY),journalRaw);g.resume({lock:false});retainedAbsent(h,all[3]);
});

test('quota-like failure keeps the new companion session-only with visible warning, preserves old saved ownership, and does not block journaling',async t=>{
 const h=await app(t,{entries:[[LEGACY_ROSTER_KEY,oldRaw],[JOURNAL_KEY,journalRaw],['mushi-journal-v1',legacyRaw]],blockWrite:key=>key===ROSTER_KEY,extraExports}),{g,elements}=h;h.choose('understory');catchMetallifer(h);click(h,'keep-button');await g.roster.flush();await g.journal.flush();assert.equal(g.roster.saved,false);assert.equal(g.roster.entries.length,4);assert.equal(h.savedSettings.get(LEGACY_ROSTER_KEY),oldRaw);assert.equal(h.savedSettings.has(ROSTER_KEY),false);assert.equal(h.savedSettings.get('mushi-journal-v1'),legacyRaw);assert.deepEqual(g.journal.entries.find(e=>e.species==='rhino'),oldJournal);assert.ok(JSON.parse(h.savedSettings.get(JOURNAL_KEY)).entries.some(e=>e.species==='metallifer'));
 retainedAbsent(h,g.roster.entries.find(e=>e.species==='metallifer'));await begin(h);assert.equal(elements.get('companion-save-status').dataset.unsaved,'true');assert.match(elements.get('companion-save-status').textContent,/保存できません/);click(h,'battle-exit-button');click(h,'companions-close-button');assert.equal(g.state.mode,'playing');assert.match(elements.get('toast').textContent,/未保存/);assert.equal(h.savedSettings.get(LEGACY_ROSTER_KEY),oldRaw);assert.equal(h.savedSettings.has(ROSTER_KEY),false);
});
