/** Registration contract only. Map storage / DOM / WebGL doubles; not real-browser
 * persistence or a claim that every insect is easy to find or physically catch. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {SPECIES} from '../src/insects.js';
import {createJournal,JOURNAL_KEY,LEGACY_JOURNAL_KEY} from '../src/journal.js';
import {createTestLocks} from './fixtures/journal-locks.mjs';
const root=path.resolve(import.meta.dirname,'..');
const ids=Object.keys(SPECIES);
const expected=['butterfly','dragonfly','cicada','morpho','grasshopper','hercules','leafinsect','waterstrider','leafcutterant','firefly','dungbeetle','divingbeetle','mantis','ladybird','rhino','stag','bee','swallowtail','jewel','longhorn','metallifer','atlas','giantstag','elephant','goliath','fivehorn','miyama','euchirus','manticora'];
function memory(){const values=new Map(),writes=[];return{values,writes,storage:{getItem:key=>values.get(key)??null,setItem(key,value){writes.push(key);values.set(key,value);}}};}

test('all twenty-nine candidate species register once, retain notes on recapture, and reload without touching legacy data',async()=>{
 assert.deepEqual([...ids].sort(),[...expected].sort());
 const f=memory(),legacy=JSON.stringify({version:1,entries:[]});f.values.set(LEGACY_JOURNAL_KEY,legacy);
 let now=100;const options={locks:createTestLocks(),now:()=>now++},j=createJournal(f.storage,options);
 for(const species of ids){assert.equal(j.setNote(species,'before capture'),null);assert.equal(j.record({species,location:'registered',x:1,z:2}).species,species);j.setNote(species,`note ${species}`);}
 assert.equal(j.entries.length,29);assert.equal(await j.flush(),true);
 const first=j.entries.map(entry=>entry.firstSeen);
 for(const species of ids){const entry=j.record({species,location:'recaptured',x:3,z:4});assert.equal(entry.note,`note ${species}`);}
 assert.equal(j.entries.length,29);assert.deepEqual(j.entries.map(entry=>entry.firstSeen),first);
 assert.equal(j.record({species:'unknown'}),null);assert.equal(await j.flush(),true);
 assert.deepEqual(createJournal(f.storage,options).entries,j.entries);
 assert.equal(f.values.get(LEGACY_JOURNAL_KEY),legacy);assert.ok(f.writes.every(key=>key===JOURNAL_KEY));
});

test('actual main registers only successful net results, immediately before inspection, for every published species',async t=>{
 // Reuse the existing harness without executing its species-specific tests.
 // The simulator result is stubbed here: this isolates main -> journal wiring,
 // rather than claiming an all-species physical capture test.
 const original=fs.readFileSync(path.join(root,'tests/hercules-main.test.mjs'),'utf8'),marker='\nconst beetles=()=>';assert.ok(original.includes(marker));
 let source=original.slice(0,original.indexOf(marker));
 source=source.replace("from './fixtures/journal-locks.mjs'",`from ${JSON.stringify(pathToFileURL(path.join(root,'tests/fixtures/journal-locks.mjs')).href)}`).replace("const root=path.resolve(import.meta.dirname,'..');",`const root=${JSON.stringify(root)};`);
 source+='\nexport {g,frame,elements};';
 const h=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 t.after(()=>window.dispatchEvent(new Event('pagehide')));
 const {g,frame}=h;g.start();frame(3);assert.equal(g.journal.entries.length,0,'being in a visible habitat does not unlock a species');
 const actualSwing=g.simulation.swing;t.after(()=>{g.simulation.swing=actualSwing;});
 g.simulation.swing=()=>({ok:false,reason:'miss or obstruction'});g.swing();assert.equal(g.journal.entries.length,0);
 for(const [index,species] of ids.entries()){
  g.state.cooldown=0;g.simulation.swing=()=>({ok:true,item:{species,x:index+.04,z:-index-.04}});g.swing();
  assert.equal(g.state.mode,'playing','record occurs before the delayed observation screen');
  assert.equal(g.journal.entries.length,index+1);assert.equal(g.journal.entries[index].species,species);
  assert.equal(g.journal.entries[index].note,'','no memo or release is required');
 }
 assert.equal(await g.journal.flush(),true);
 const reloaded=createJournal(localStorage,{locks:createTestLocks()});assert.equal(reloaded.entries.length,29);
 g.state.mode='paused';g.state.cooldown=0;g.swing();assert.equal(g.journal.entries.length,29,'paused action resumes without a new capture');
});

test('a capture can be visible in the journal but not survive reload when storage locking is unavailable',async()=>{
 const f=memory(),j=createJournal(f.storage,{locks:null,now:()=>100});
 const entry=j.record({species:'hercules',location:'memory only'});assert.equal(entry.species,'hercules');assert.equal(j.entries.length,1);
 assert.equal(await j.flush(),false);assert.equal(j.saved,false);assert.equal(f.writes.length,0);
 assert.equal(createJournal(f.storage,{locks:createTestLocks()}).entries.length,0,'do not describe an empty reload slot as proof the user never captured it');
});
