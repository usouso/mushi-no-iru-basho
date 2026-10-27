import {priorJournal,priorBattle} from './fixtures/giraffe-stag-prior.mjs';
import {priorExpedition,priorRoster} from './fixtures/europe-individual-prior.mjs';
/** In-memory storage / lock doubles, not browser quota or GPU evidence. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {createJournal,loadJournal,saveJournal,JOURNAL_KEY,LEGACY_JOURNAL_KEY,JOURNAL_VERSION,NOTE_LIMIT,JOURNAL_RAW_LIMIT} from '../src/journal.js';
import {createCompanionRoster,COMPANION_KEY,LEGACY_COMPANION_KEY,COMPANION_SPECIES,isCompanionSpecies} from '../src/individual-roster.js';
import {createExpedition,EXPEDITION_KEY,LEGACY_EXPEDITION_KEY,EXPEDITION_SLOTS} from '../src/expedition.js';
import {BATTLE_SPECIES,createBattle} from '../src/beetle-battle.js';
import {createTestLocks,createHeldLocks,flushMicrotasks} from './fixtures/journal-locks.mjs';
const old31=['butterfly','dragonfly','cicada','morpho','grasshopper','hercules','leafinsect','waterstrider','leafcutterant','firefly','dungbeetle','divingbeetle','mantis','ladybird','rhino','stag','bee','swallowtail','jewel','longhorn','metallifer','atlas','giantstag','elephant','goliath','fivehorn','miyama','euchirus','manticora','rainbowstag','europestag'];
const current32=[...old31,'giantwaterbug'];
const capacitySpecies=[...current32,'wetapunga','giraffestag'];
const hash=s=>createHash('sha256').update(s).digest('hex'),read=f=>fs.readFileSync(new URL('../src/'+f,import.meta.url),'utf8'),semantic=s=>s.replace(/\?v=[0-9.]+&b=[a-f0-9]+/g,'');
// Reversing the later wetapunga token and original waterbug addition reconstructs the frozen044 file,
// verified against its pre-change SHA256, not an inferred mock old parser.
const source=read('journal.js'),oldSource=priorJournal(source).replace(", 'wetapunga'",'').replace(", 'giantwaterbug'",'');
assert.equal(hash(oldSource),'c5f38d126a7835ed46aa0096ac9db069821602e814e58b8ff7e48833043667de');
const old044=await import('data:text/javascript;base64,'+Buffer.from(oldSource).toString('base64'));
const modern=entries=>JSON.stringify({version:2,legacyImportDone:true,entries});
const notes=(character='字',ids=old31)=>ids.map((species,i)=>({species,firstSeen:100+i,lastSeen:200+i,location:character.repeat(120),x:i%2?-Number.MAX_VALUE:Number.MIN_VALUE,z:1.2345678901234567e30,note:character.repeat(500)}));
const capture={species:'giantwaterbug',location:'浅い池・水草',x:25.7,z:-15.7};
const old14=[['hercules','tropical','insect-5'],['rhino','night','insect-4'],['stag','night','insect-5'],['metallifer','understory','insect-4'],['atlas','understory','insect-5'],['giantstag','night','insect-6'],['elephant','tropical','insect-11'],['goliath','forest','insect-1'],['fivehorn','understory','insect-6'],['miyama','meadow','insect-30'],['euchirus','understory','insect-7'],['manticora','savanna','insect-2'],['rainbowstag','australia','insect-1'],['europestag','europe','insect-1']].map(([species,originHabitat,originIndividualId],i)=>({id:`${originHabitat}/${originIndividualId}`,species,originHabitat,originIndividualId,capturedAt:100+i,originKind:'legacy',originEncounterId:null,sizePermille:null,measureVersion:null}));
// Fixed old gen5 values, including the original eight encounter slots and best.
const oldOuting={version:2,legacyImportDone:true,generatorVersion:5,worldSeed:123,outingCounter:1,encounters:[
 ['hercules-a','hercules','tropical','insect-5',1112,3861188688,1,1],['hercules-b','hercules','tropical','insect-6',1050,3063116229,2,1],['rhino','rhino','night','insect-4',1143,521847916,1,1],['stag','stag','night','insect-5',1119,3322267620,2,1],['metallifer','metallifer','understory','insect-4',1116,3957564467,0,1],['giantstag','giantstag','night','insect-6',1079,3446211130,0,2],['atlas','atlas','understory','insect-5',1003,1562026934,0,3],['manticora','manticora','savanna','insect-2',1101,2942249987,0,4]
].map(([populationSlotId,species,habitat,runtimeSlotId,sizePermille,motionSeed,siteIndex,g])=>({encounterId:`g${g}-0000007b-o1-${habitat}-${populationSlotId}`,species,habitat,runtimeSlotId,populationSlotId,sizePermille,motionSeed,siteIndex,measureVersion:1})),measuredEncounterIds:['g1-0000007b-o1-night-rhino','g3-0000007b-o1-understory-atlas'],best:[{species:'rhino',sizePermille:1143,encounterId:'g1-0000007b-o1-night-rhino',capturedAt:777,measureVersion:1},{species:'atlas',sizePermille:1003,encounterId:'g3-0000007b-o1-understory-atlas',capturedAt:777,measureVersion:1}]};
const protectedKeys=[COMPANION_KEY,LEGACY_COMPANION_KEY,EXPEDITION_KEY,LEGACY_EXPEDITION_KEY,LEGACY_JOURNAL_KEY];
function fixture(rows=notes()){
 const values=new Map([[JOURNAL_KEY,modern(rows)],[COMPANION_KEY,modern(old14)],[LEGACY_COMPANION_KEY,'old v1 roster bytes'],[EXPEDITION_KEY,JSON.stringify(oldOuting)],[LEGACY_EXPEDITION_KEY,'old v1 outing bytes'],[LEGACY_JOURNAL_KEY,JSON.stringify({version:1,entries:notes('葉')})]]),writes=[];
 const f={values,writes,quota:false,readFail:false,afterWrite:false,locks:createTestLocks(),now:()=>1000,storage:{getItem(k){if(f.readFail&&k===JOURNAL_KEY)throw Error('read failure');return values.get(k)??null;},setItem(k,v){assert.equal(k,JOURNAL_KEY);if(f.quota)throw Error('quota');values.set(k,v);writes.push(k);if(f.afterWrite)throw Error('after write');},removeItem(){assert.fail('no deletion');}}};return f;
}
const protectedBytes=f=>protectedKeys.map(k=>[k,f.values.get(k)]);

test('only whitelist changes: 32 journal rows, unchanged schema/formula/keys and frozen044 roster/battle/gen5 sources; waterbug is not companion or sumo',()=>{
 assert.equal(old31.length,31);assert.equal(current32.length,32);assert.equal(source.split(", 'giantwaterbug'").length-1,1);
 assert.equal(JOURNAL_KEY,'mushi-journal-v2');assert.equal(LEGACY_JOURNAL_KEY,'mushi-journal-v1');assert.equal(JOURNAL_VERSION,2);assert.equal(NOTE_LIMIT,500);
 assert.equal(JOURNAL_RAW_LIMIT,128+capacitySpecies.reduce((n,s)=>n+6*(500+120+s.length)+256,0));
 assert.equal(hash(priorRoster(read('individual-roster.js'))),'9fdc0290dfe6df55dbf6eec32eaf97ba8f4317d35b2ca4076977659856680d2a');assert.equal(hash(priorBattle(read('beetle-battle.js'))),'adb94de9eaf4e7c4e60c573cd4d1fbac0a6a451e05c749c0d97db9c4f28bb0cd');assert.equal(hash(priorExpedition(read('expedition.js'))),'0b4e27a91eed5b3bf943ef0931eb4ef3f932a59d083bb909988c88f22bfe0fce');
 assert.equal(COMPANION_SPECIES.length,15);assert.equal(Object.keys(BATTLE_SPECIES).length,15);assert.equal(isCompanionSpecies('giantwaterbug'),false);assert.equal(Object.hasOwn(BATTLE_SPECIES,'giantwaterbug'),false);assert.throws(()=>createBattle({playerSpecies:'giantwaterbug',opponentSpecies:'rhino'}),TypeError);
 assert.equal(EXPEDITION_SLOTS.length,9);assert.ok(EXPEDITION_SLOTS.every(e=>e.species!=='giantwaterbug'));
 assert.equal(hash(JSON.stringify(oldOuting)),'8fa71e768ccb5f950feade0f23144a9cf35f6ae8590ca9d15dedcdb6a6222f84');
});

test('old31 max500 notes/max120 locations retain every field; both writers round-trip all32 escaped payloads without touching old14/gen5/best/v1 bytes',async()=>{
 const metrics=[];
 for(const c of ['字','\u0000','\ud800'])for(const writer of ['session','snapshot']){
  const old=notes(c),f=fixture(old),before=protectedBytes(f),j=createJournal(f.storage,f);assert.deepEqual(j.entries,old);assert.equal(await j.flush(),true);assert.equal(f.writes.length,0);
  const expected=[...old,{species:'giantwaterbug',firstSeen:1000,lastSeen:1000,location:c.repeat(120),x:-Number.MAX_VALUE,z:Number.MIN_VALUE,note:c.repeat(500)}];
  if(writer==='session'){j.record({...capture,location:c.repeat(120),x:-Number.MAX_VALUE,z:Number.MIN_VALUE});j.setNote('giantwaterbug',c.repeat(500));assert.equal(await j.flush(),true);}else assert.equal(await saveJournal(expected,f.storage,f),true);
  const raw=f.values.get(JOURNAL_KEY),count=f.writes.length;assert.ok(raw.length<=JOURNAL_RAW_LIMIT);assert.deepEqual(loadJournal(f.storage),{entries:expected,saved:true});const fresh=createJournal(f.storage,f);assert.equal(await fresh.flush(),true);assert.equal(f.writes.length,count);assert.deepEqual(fresh.entries,expected);assert.deepEqual(fresh.entries.slice(0,31),old);assert.deepEqual(protectedBytes(f),before);assert.deepEqual([...f.values.keys()].sort(),[JOURNAL_KEY,...protectedKeys].sort());
  const locks={request:async(k,o,fn)=>fn()},r=createCompanionRoster(f.storage,{locks,now:f.now}),e=createExpedition(f.storage,{locks,now:f.now});assert.deepEqual(r.entries,old14);assert.equal(await r.flush(),true);assert.deepEqual(e.snapshot,oldOuting);assert.equal(await e.flush(),true);assert.deepEqual(r.add({...capture,originHabitat:'meadow',originIndividualId:'giantwaterbug-study-1',originKind:'legacy',originEncounterId:null,sizePermille:null,measureVersion:null}),{ok:false,reason:'invalid-capture'});assert.deepEqual(protectedBytes(f),before);assert.equal(f.writes.length,count);
  metrics.push({writer,escaped:c!=='字',length:raw.length,rows:expected.length});
 }
 console.log('045 journal capacity',JSON.stringify({limit:JOURNAL_RAW_LIMIT,metrics}));
});

test('actual frozen044 fresh and stale clients fail safe on a new32 raw, preserving new record and old31 with zero auto-writes',async()=>{
 const f=fixture(),stale=old044.createJournal(f.storage,f),current=createJournal(f.storage,f);current.record(capture);current.setNote('giantwaterbug','<b>水草の支持を観察</b>&');assert.equal(await current.flush(),true);const newRaw=f.values.get(JOURNAL_KEY),count=f.writes.length;
 const fresh=old044.createJournal(f.storage,f);assert.equal(fresh.saved,false);assert.equal(fresh.entries.length,31);assert.equal(fresh.record(capture),null);fresh.setNote('rhino','old client session');assert.equal(await fresh.flush(),false);assert.equal(await old044.saveJournal(fresh.entries,f.storage,f),false);
 stale.setNote('rhino','stale client session');assert.equal(await stale.flush(),false);assert.equal(await stale.flush(),false);assert.equal(f.values.get(JOURNAL_KEY),newRaw);assert.equal(f.writes.length,count);assert.equal(loadJournal(f.storage).entries.at(-1).note,'<b>水草の支持を観察</b>&');
 const max=modern(notes('\u0000',current32));f.values.set(JOURNAL_KEY,max);const oldMax=old044.createJournal(f.storage,f);assert.equal(oldMax.saved,false);assert.equal(await oldMax.flush(),false);assert.equal(f.values.get(JOURNAL_KEY),max);assert.equal(f.writes.length,count);
});

test('quota, unavailable reads, uncertain after-write and held-lock CAS preserve raw and fail closed without changing journal policy',async()=>{
 const f=fixture(),j=createJournal(f.storage,f),raw=f.values.get(JOURNAL_KEY);f.quota=true;j.record(capture);assert.equal(await j.flush(),false);assert.equal(j.entries.length,32);assert.equal(f.values.get(JOURNAL_KEY),raw);f.quota=false;assert.equal(await j.flush(),true);
 // Journal has no post-write readback/adoption policy: a thrown-after-write is
 // conservatively unsaved, and CAS prevents blind retry. Do not claim otherwise.
 f.afterWrite=true;j.setNote('giantwaterbug','uncertain');assert.equal(await j.flush(),false);const written=f.values.get(JOURNAL_KEY),count=f.writes.length;f.afterWrite=false;assert.equal(await j.flush(),false);assert.equal(f.values.get(JOURNAL_KEY),written);assert.equal(f.writes.length,count);assert.equal(createJournal(f.storage,f).entries.at(-1).note,'uncertain');
 f.readFail=true;assert.deepEqual(loadJournal(f.storage),{entries:[],saved:false});const unknown=createJournal(f.storage,f);unknown.record(capture);f.readFail=false;assert.equal(await unknown.flush(),false);assert.equal(f.values.get(JOURNAL_KEY),written);
 const held=createHeldLocks(),stale=createJournal(f.storage,{locks:held,now:f.now});stale.setNote('giantwaterbug','losing edit');await flushMicrotasks();const winner=modern(notes('葉',current32));f.values.set(JOURNAL_KEY,winner);await held.releaseNext();assert.equal(await stale.flush(),false);assert.equal(f.values.get(JOURNAL_KEY),winner);assert.equal(f.writes.length,count);
 const no=createJournal(f.storage,{locks:null,now:f.now});no.setNote('giantwaterbug','memory only');assert.equal(await no.flush(),false);assert.equal(await saveJournal(no.entries,f.storage,{locks:null}),false);assert.equal(f.values.get(JOURNAL_KEY),winner);
});

test('legacy31 migration leaves source bytes unchanged and new unknown/future/extra measurement fields remain read-only',async()=>{
 const f=fixture(),legacy=f.values.get(LEGACY_JOURNAL_KEY);f.values.delete(JOURNAL_KEY);const migrated=createJournal(f.storage,f);assert.equal(await migrated.flush(),true);assert.equal(f.values.get(LEGACY_JOURNAL_KEY),legacy);assert.deepEqual(migrated.entries,notes('葉'));migrated.record(capture);assert.equal(await migrated.flush(),true);assert.equal(migrated.entries.length,32);
 for(const raw of [modern([...notes(),{...notes()[0],species:'future-waterbug'}]),JSON.stringify({version:3,legacyImportDone:true,entries:notes()}),modern([...notes(),{species:'giantwaterbug',firstSeen:1,lastSeen:1,location:'池',x:0,z:0,note:'',sizePermille:1000}])]){
  const bad=fixture();bad.values.set(JOURNAL_KEY,raw);const j=createJournal(bad.storage,bad);j.record(capture);assert.equal(await j.flush(),false);assert.equal(await saveJournal(j.entries,bad.storage,bad),false);assert.equal(bad.values.get(JOURNAL_KEY),raw);assert.equal(bad.writes.length,0);
 }
});
