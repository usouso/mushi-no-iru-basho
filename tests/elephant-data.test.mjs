/** Map storage and exclusive queue doubles only; no browser durability/playtest claim. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {TROPICAL_HOMES} from '../src/tropical-layout.js';
import {ANT_START_DISTANCES} from '../src/ant-layout.js';
import {createCompanionRoster,COMPANION_KEY,COMPANION_VERSION,LEGACY_COMPANION_KEY,COMPANION_SPECIES,isCompanionSpecies} from '../src/individual-roster.js';
import {COMPANION_SPECIES as V1_SPECIES} from '../src/companion-roster.js';
import {createJournal,JOURNAL_KEY,JOURNAL_VERSION,LEGACY_JOURNAL_KEY,NOTE_LIMIT} from '../src/journal.js';
import {EXPEDITION_KEY,EXPEDITION_SLOTS} from '../src/expedition.js';

const elephant={species:'elephant',originHabitat:'tropical',originIndividualId:'insect-11',originKind:'legacy',originEncounterId:null,sizePermille:null,measureVersion:null};
const entry=(capture,capturedAt=100)=>({id:capture.originKind==='legacy'?`${capture.originHabitat}/${capture.originIndividualId}`:capture.originEncounterId,...capture,capturedAt});
const oldRoster=EXPEDITION_SLOTS.slice(0,5).filter(s=>s.populationSlotId!=='hercules-b').map((s,i)=>entry({species:s.species,originHabitat:s.habitat,originIndividualId:s.runtimeSlotId,originKind:'expedition',originEncounterId:`g1-1234abcd-o1-${s.habitat}-${s.populationSlotId}`,sizePermille:1050+i,measureVersion:1},100+i));
oldRoster.push(entry({species:'atlas',originHabitat:'understory',originIndividualId:'insect-5',originKind:'legacy',originEncounterId:null,sizePermille:null,measureVersion:null},104));
oldRoster.push(entry({species:'giantstag',originHabitat:'night',originIndividualId:'insect-6',originKind:'legacy',originEncounterId:null,sizePermille:null,measureVersion:null},105));
const oldSpecies=['butterfly','dragonfly','cicada','morpho','grasshopper','hercules','leafinsect','waterstrider','leafcutterant','firefly','dungbeetle','divingbeetle','mantis','ladybird','rhino','stag','bee','swallowtail','jewel','longhorn','metallifer','atlas','giantstag'];
const oldJournal=oldSpecies.map((species,i)=>({species,firstSeen:100+i,lastSeen:200+i,location:`場所${i}`,x:i,z:-5-i,note:`残すメモ${species}`}));
const modern=entries=>JSON.stringify({version:2,legacyImportDone:true,entries});
function fixture(){
 const values=new Map([[COMPANION_KEY,modern(oldRoster)],[JOURNAL_KEY,modern(oldJournal)],
  [LEGACY_COMPANION_KEY,'  {"version":1,"entries":[]}\n'],[LEGACY_JOURNAL_KEY,' {"version":1,"entries":[]}\n'],[EXPEDITION_KEY,'unchanged five-slot raw']]);
 const writes=[],tails=new Map(),active=new Set();
 const f={values,writes,failWrite:false,now:()=>1000,locks:{request(key,options,fn){
  assert.equal(options.mode,'exclusive');
  const task=(tails.get(key)||Promise.resolve()).then(async()=>{assert.equal(active.has(key),false);active.add(key);try{return await fn();}finally{active.delete(key);}});
  tails.set(key,task.catch(()=>{}));return task;
 }},storage:{getItem:key=>values.get(key)??null,setItem(key,value){
  assert.ok([COMPANION_KEY,JOURNAL_KEY].includes(key),'only current requested store may be written');
  assert.ok(active.has(key),'writes require the matching exclusive lock');
  if(f.failWrite)throw Error('quota');writes.push(key);values.set(key,value);
 }}};return f;
}
const make=f=>createCompanionRoster(f.storage,f);
const untouched=f=>[LEGACY_COMPANION_KEY,LEGACY_JOURNAL_KEY,EXPEDITION_KEY].map(key=>[key,f.values.get(key)]);

test('actual tropical home arrays retain 4 morphos, 2 Hercules and 4 ants before the new fixed insect-11',async t=>{
 const oldGlobals={window:Object.getOwnPropertyDescriptor(globalThis,'window'),document:Object.getOwnPropertyDescriptor(globalThis,'document')};
 t.after(()=>{for(const [key,descriptor]of Object.entries(oldGlobals)){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}});
 const sandbox={console};vm.runInNewContext(fs.readFileSync(new URL('../assets/vendor/three.min.js',import.meta.url),'utf8'),sandbox);
 const context={};for(const key of['fillRect','beginPath','moveTo','lineTo','stroke'])context[key]=()=>{};
 Object.defineProperty(globalThis,'window',{configurable:true,value:{THREE:sandbox.THREE}});
 Object.defineProperty(globalThis,'document',{configurable:true,value:{createElement:()=>({getContext:()=>context})}});
 const {createTropicalWorld}=await import('../src/world-tropical.js');
 const {createAntHabitat}=await import('../src/ant-habitat.js');
 const scene=new sandbox.THREE.Scene(),world=createTropicalWorld(scene),ants=createAntHabitat(world,scene);
 assert.equal(TROPICAL_HOMES.length,4);assert.equal(ANT_START_DISTANCES.length,4);
 assert.deepEqual([world.insectHomes.length,world.herculesHomes.length,ants.homes.length],[4,2,4]);
 const oldHomes=[...world.insectHomes,...world.herculesHomes,...ants.homes];
 assert.deepEqual(oldHomes.map((home,i)=>[home[0],`insect-${i+1}`]),[
  ['morpho','insect-1'],['morpho','insect-2'],['morpho','insect-3'],['morpho','insect-4'],
  ['hercules','insect-5'],['hercules','insect-6'],['leafcutterant','insect-7'],['leafcutterant','insect-8'],['leafcutterant','insect-9'],['leafcutterant','insect-10']]);
 assert.equal(elephant.originIndividualId,`insect-${oldHomes.length+1}`,'append after all ten old individuals, never reuse the final ant');
});

test('seventh companion is exactly fixed tropical/insect-11, preserves six prior entries, and releases only explicitly',async()=>{
 const f=fixture(),raw=f.values.get(COMPANION_KEY),protectedRaw=untouched(f),journalRaw=f.values.get(JOURNAL_KEY),r=make(f);
 assert.equal(COMPANION_KEY,'mushi-companions-v2');assert.equal(COMPANION_VERSION,2);
 assert.deepEqual(COMPANION_SPECIES,['hercules','rhino','stag','metallifer','atlas','giantstag','elephant','goliath']);
 assert.deepEqual(V1_SPECIES,['hercules','rhino','stag','metallifer']);assert.equal(isCompanionSpecies('elephant'),true);
 assert.deepEqual(r.entries,oldRoster);assert.equal(await r.flush(),true);assert.equal(f.writes.length,0);assert.equal(f.values.get(COMPANION_KEY),raw);
 const result=r.add(elephant);assert.deepEqual(result,{ok:true,entry:entry(elephant,1000)});assert.equal(r.entries.length,7);
 assert.deepEqual(r.add(elephant),{ok:false,reason:'already-owned'});assert.deepEqual(r.replace(result.entry.id,elephant),{ok:false,reason:'same-individual'});
 assert.equal(await r.flush(),true);assert.deepEqual(make(f).entries,[...oldRoster,entry(elephant,1000)]);
 assert.deepEqual(r.entries.slice(0,6),oldRoster);
 assert.equal(r.release('tropical/insect-11').ok,true);assert.equal(await r.flush(),true);assert.deepEqual(make(f).entries,oldRoster);
 assert.deepEqual(r.release('tropical/insect-11'),{ok:false,reason:'not-owned'});
 assert.deepEqual(untouched(f),protectedRaw);assert.equal(f.values.get(JOURNAL_KEY),journalRaw);
});

test('elephant is never adopted from v1 and cannot borrow older fixed IDs or any measured encounter',async()=>{
 const f=fixture(),fake={id:'tropical/insect-11',species:'elephant',originHabitat:'tropical',originIndividualId:'insect-11',capturedAt:50};
 const legacyRaw=JSON.stringify({version:1,entries:[fake]});f.values.delete(COMPANION_KEY);f.values.set(LEGACY_COMPANION_KEY,legacyRaw);
 const r=make(f);assert.equal(r.reason,'invalid-data');assert.deepEqual(r.entries,[]);assert.equal(r.add(elephant).ok,true);assert.equal(await r.flush(),false);
 assert.equal(f.values.get(LEGACY_COMPANION_KEY),legacyRaw);assert.equal(f.values.has(COMPANION_KEY),false);assert.equal(f.writes.length,0);
 const good=fixture(),q=make(good);
 for(const bad of [{...elephant,species:'__proto__'},{...elephant,species:'constructor'},
  ...['insect-5','insect-6','insect-9','insect-10','insect-12'].map(originIndividualId=>({...elephant,originIndividualId})),
  {...elephant,originHabitat:'understory'},{...elephant,sizePermille:1000},{...elephant,measureVersion:1},{...elephant,originKind:undefined},
  ...['elephant','hercules-a','hercules-b'].map(slot=>({...elephant,originKind:'expedition',originEncounterId:`g1-1234abcd-o1-tropical-${slot}`,sizePermille:1100,measureVersion:1}))]){
  assert.deepEqual(q.add(bad),{ok:false,reason:'invalid-capture'});
 }
 assert.deepEqual(q.entries,oldRoster);assert.equal(good.writes.length,0);
 assert.deepEqual(EXPEDITION_SLOTS.slice(0,5).map(s=>[s.populationSlotId,s.habitat,s.runtimeSlotId]),[
  ['hercules-a','tropical','insect-5'],['hercules-b','tropical','insect-6'],['rhino','night','insect-4'],['stag','night','insect-5'],['metallifer','understory','insect-4']]);
});

test('invalid seven-companion payloads remain read-only without overwriting their raw bytes',async()=>{
 const elephantEntry=entry(elephant);
 for(const raw of ['{',JSON.stringify({version:3,legacyImportDone:true,entries:oldRoster}),modern([...oldRoster,elephantEntry,elephantEntry]),
  modern([...oldRoster,{...elephantEntry,extra:'keep'}]),modern([...oldRoster,{...elephantEntry,originIndividualId:'insect-5'}]),modern([...oldRoster,{...elephantEntry,sizePermille:1000}])]){
  const f=fixture();f.values.set(COMPANION_KEY,raw);const r=make(f);assert.equal(r.reason,'invalid-data');r.add(elephant);r.release('tropical/insect-11');
  assert.equal(await r.flush(),false);assert.equal(f.values.get(COMPANION_KEY),raw);assert.equal(f.writes.length,0);
 }
});

test('elephant quota retry and missing-lock or competing-tab failures preserve durable data',async()=>{
 const f=fixture(),raw=f.values.get(COMPANION_KEY),protectedRaw=untouched(f),r=make(f);f.failWrite=true;r.add(elephant);
 assert.equal(await r.flush(),false);assert.equal(r.reason,'storage-error');assert.equal(r.entries.length,7);assert.equal(f.values.get(COMPANION_KEY),raw);
 f.failWrite=false;assert.equal(await r.flush(),true);assert.deepEqual(make(f).entries,r.entries);assert.deepEqual(untouched(f),protectedRaw);
 const noLocks=fixture(),n=createCompanionRoster(noLocks.storage,{locks:null,now:noLocks.now});n.add(elephant);assert.equal(await n.flush(),false);assert.equal(n.reason,'missing-locks');assert.equal(noLocks.writes.length,0);
 const tabs=fixture(),a=make(tabs),b=make(tabs);a.add(elephant);b.add(elephant);
 assert.equal(await a.flush(),true);assert.equal(await b.flush(),false);assert.equal(b.reason,'conflict');const winning=tabs.values.get(COMPANION_KEY);
 b.add(elephant);await b.flush();assert.equal(tabs.values.get(COMPANION_KEY),winning);assert.deepEqual(make(tabs).entries,[...oldRoster,entry(elephant,1000)]);
});

test('24th journal entry retains all previous fields and optional notes without rewriting either legacy key',async()=>{
 const f=fixture(),protectedRaw=untouched(f),rosterRaw=f.values.get(COMPANION_KEY),j=createJournal(f.storage,f);
 assert.equal(JOURNAL_KEY,'mushi-journal-v2');assert.equal(JOURNAL_VERSION,2);assert.equal(NOTE_LIMIT,500);
 assert.deepEqual(j.entries,oldJournal);assert.equal(await j.flush(),true);assert.equal(f.writes.length,0);
 assert.equal(j.setNote('elephant','not caught'),null);
 const capture={species:'elephant',location:'熱帯林の倒木',x:14,z:-6};assert.equal(j.record(capture).note,'');
 const literal='<b>頭の角と毛</b> & 熱帯の木陰';assert.equal(j.setNote('elephant',literal).note,literal);assert.equal(await j.flush(),true);
 assert.equal(j.entries.length,24);assert.deepEqual(j.entries.slice(0,23),oldJournal);assert.deepEqual(createJournal(f.storage,f).entries,j.entries);
 assert.equal(j.setNote('elephant','角'.repeat(600)).note.length,500);assert.equal(await j.flush(),true);
 assert.equal(createJournal(f.storage,f).entries[23].note,'角'.repeat(500));
 assert.equal(j.record({species:'__proto__'}),null);assert.equal(j.record({species:'unknown'}),null);
 assert.equal(j.setNote('elephant','').note,'');assert.equal(await j.flush(),true);
 assert.deepEqual(untouched(f),protectedRaw);assert.equal(f.values.get(COMPANION_KEY),rosterRaw);
});

test('elephant journal edits keep quota and locked-conflict safeguards',async()=>{
 const f=fixture(),original=f.values.get(JOURNAL_KEY),j=createJournal(f.storage,f);f.failWrite=true;
 j.record({species:'elephant',location:'熱帯林',x:1,z:2});j.setNote('elephant','未保存のメモ');
 assert.equal(await j.flush(),false);assert.equal(j.saved,false);assert.equal(j.entries.length,24);assert.equal(f.values.get(JOURNAL_KEY),original);
 f.failWrite=false;assert.equal(await j.flush(),true);assert.deepEqual(createJournal(f.storage,f).entries,j.entries);
 const a=createJournal(f.storage,f),b=createJournal(f.storage,f);a.setNote('elephant','A');b.setNote('elephant','B');
 assert.equal(await a.flush(),true);assert.equal(await b.flush(),false);const winning=f.values.get(JOURNAL_KEY);
 assert.equal(await b.flush(),false);assert.equal(f.values.get(JOURNAL_KEY),winning);assert.equal(b.entries[23].note,'B');
});
