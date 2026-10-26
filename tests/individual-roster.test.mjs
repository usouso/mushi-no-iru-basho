/** In-memory storage and explicit Web Locks doubles, not actual browser storage. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {COMPANION_KEY,COMPANION_VERSION,LEGACY_COMPANION_KEY,COMPANION_SPECIES,isCompanionSpecies,createCompanionRoster} from '../src/individual-roster.js';
const habitats={hercules:'tropical',rhino:'night',stag:'night',metallifer:'understory'};
const capture=(species='rhino',outing=1,sizePermille=1000)=>({species,originHabitat:habitats[species],originIndividualId:'insect-4',originKind:'expedition',originEncounterId:`g1-1234abcd-o${outing}-${habitats[species]}-${species==='hercules'?'hercules-a':species}`,sizePermille,measureVersion:1});
const payload=entries=>JSON.stringify({version:2,legacyImportDone:true,entries});
const microtasks=async()=>{for(let i=0;i<18;i++)await Promise.resolve();};
function locks(){const tails=new Map(),requests=[];return {requests,request(key,options,callback){assert.ok([COMPANION_KEY,LEGACY_COMPANION_KEY].includes(key));assert.equal(options.mode,'exclusive');requests.push(key);const task=(tails.get(key)||Promise.resolve()).then(callback);tails.set(key,task.catch(()=>{}));return task;}};}
function fixture(raw=payload([])){
 const values=new Map([['mushi-journal-v2','journal untouched']]);if(raw!==null)values.set(COMPANION_KEY,raw);
 const writes=[];let failWrite=false,dropWrite=false,readAfterWrite=false;
 return {values,writes,locks:locks(),now:()=>200,set failWrite(v){failWrite=v;},set dropWrite(v){dropWrite=v;},set readAfterWrite(v){readAfterWrite=v;},storage:{getItem(key){assert.ok([COMPANION_KEY,LEGACY_COMPANION_KEY].includes(key));if(readAfterWrite&&writes.length)throw Error('readback unavailable');return values.get(key)??null;},setItem(key,value){assert.equal(key,COMPANION_KEY);if(failWrite)throw Error('quota');writes.push([key,value]);if(!dropWrite)values.set(key,value);}}};
}
const make=f=>createCompanionRoster(f.storage,f);

test('v2 four-species API keeps individual measurements and detached copies; only explicit release removes one',async()=>{
 const f=fixture(),r=make(f);assert.equal(COMPANION_KEY,'mushi-companions-v2');assert.equal(COMPANION_VERSION,2);assert.equal(r.saved,true);assert.equal(f.writes.length,0);
 for(const species of COMPANION_SPECIES){assert.ok(isCompanionSpecies(species));const result=r.add(capture(species));assert.equal(result.ok,true);assert.equal(result.entry.id,result.entry.originEncounterId);result.entry.sizePermille=9999;}
 assert.equal(r.entries.length,4);assert.equal(r.pending,true);assert.equal(r.saved,false);r.entries.pop();assert.equal(r.entries.length,4);assert.equal(r.entries[0].sizePermille,1000);
 assert.equal(await r.flush(),true);assert.deepEqual(make(f).entries,r.entries);assert.equal(JSON.parse(f.values.get(COMPANION_KEY)).legacyImportDone,true);
 assert.deepEqual(r.add(capture('rhino',2)),{ok:false,reason:'already-owned'});
 const removed=r.release(capture('rhino').originEncounterId);assert.equal(removed.ok,true);assert.equal(await r.flush(),true);assert.equal(r.entries.length,3);assert.equal(make(f).entries.some(e=>e.species==='rhino'),false);
 assert.deepEqual(r.release(removed.entry.id),{ok:false,reason:'not-owned'});assert.equal('clear' in r,false);assert.equal('reset' in r,false);assert.equal(f.values.get('mushi-journal-v2'),'journal untouched');
});

test('invalid measurements, identity, species, origin and clock never create guessed-size companions',async()=>{
 const f=fixture(),r=make(f);
 for(const bad of [null,{}, {...capture(),species:'__proto__'},{...capture(),originHabitat:'tropical'},{...capture(),originIndividualId:'insect-0'},{...capture(),originEncounterId:'../bad'},...['g1-ABCDEF00-o1-night-rhino','g1-1234abcd-o0-night-rhino','g1-1234abcd-o9007199254740992-night-rhino','g1-1234abcd-o1-tropical-rhino','g1-1234abcd-o1-night-stag'].map(originEncounterId=>({...capture(),originEncounterId})),...[-1,999,1151,NaN,Infinity,1000.5,null].map(sizePermille=>({...capture(),sizePermille})),{...capture(),measureVersion:2},{...capture(),originKind:'legacy'},{species:'rhino',originHabitat:'night',originIndividualId:'insect-4'}])assert.deepEqual(r.add(bad),{ok:false,reason:'invalid-capture'});
 assert.equal(isCompanionSpecies('constructor'),false);assert.equal(isCompanionSpecies(null),false);assert.deepEqual(r.entries,[]);assert.equal(f.writes.length,0);
 for(const now of [()=>NaN,()=>-1,()=>1.5,()=>{throw Error('clock');}])assert.deepEqual(createCompanionRoster(f.storage,{locks:f.locks,now}).add(capture()),{ok:false,reason:'invalid-time'});
 const legacy={...capture(),originKind:'legacy',originEncounterId:null,sizePermille:null,measureVersion:null};assert.equal(r.add(legacy).ok,true);assert.equal(r.entries[0].id,'night/insect-4');assert.equal(r.entries[0].sizePermille,null);assert.equal(await r.flush(),true);
});

test('explicit same-species replacement is one atomic revision, guards stale/double requests, and returns the old individual',async()=>{
 const f=fixture(),r=make(f);const first=r.add(capture('rhino'));r.add(capture('stag'));await r.flush();const writes=f.writes.length,oldRaw=f.values.get(COMPANION_KEY),statuses=[];
 r.subscribe(()=>statuses.push(r.entries.map(e=>e.id)));
 assert.deepEqual(r.replace(first.entry.id,capture()),{ok:false,reason:'same-individual'});
 assert.deepEqual(r.replace(first.entry.id,capture('stag',2)),{ok:false,reason:'species-mismatch'});
 assert.deepEqual(r.replace('unknown',capture('rhino',2)),{ok:false,reason:'not-owned'});
 assert.equal(f.values.get(COMPANION_KEY),oldRaw);
 const result=r.replace(first.entry.id,capture('rhino',2,1150));assert.equal(result.ok,true);assert.deepEqual(result.replacedEntry,first.entry);assert.equal(r.entries.length,2);assert.equal(r.entries[0].sizePermille,1150);result.replacedEntry.species='tampered';result.entry.sizePermille=1;
 assert.deepEqual(r.replace(first.entry.id,capture('rhino',3)),{ok:false,reason:'not-owned'});assert.equal(await r.flush(),true);assert.equal(f.writes.length,writes+1);
 assert.ok(statuses.every(ids=>ids.length===2&&ids.includes(capture('stag').originEncounterId)));assert.equal(make(f).entries[0].id,capture('rhino',2).originEncounterId);
});

test('quota failure on replacement leaves durable old bytes while session replacement remains clearly unsaved; retry is atomic',async()=>{
 const f=fixture(),r=make(f);r.add(capture());await r.flush();const old=f.values.get(COMPANION_KEY);f.failWrite=true;
 const result=r.replace(capture().originEncounterId,capture('rhino',2,1100));assert.equal(result.ok,true);assert.equal(await r.flush(),false);assert.equal(r.saved,false);assert.equal(r.reason,'storage-error');assert.equal(f.values.get(COMPANION_KEY),old);assert.equal(r.entries[0].id,result.entry.id);assert.equal(make(f).entries[0].id,result.replacedEntry.id);
 f.failWrite=false;assert.equal(await r.flush(),true);assert.equal(make(f).entries[0].sizePermille,1100);
});

test('missing locks, failed locks, dropped writes and uncertain successful writes never claim persistence prematurely',async()=>{
 const f=fixture(),r=createCompanionRoster(f.storage,{locks:null,now:f.now});r.add(capture());assert.equal(await r.flush(),false);assert.equal(r.reason,'missing-locks');assert.equal(f.writes.length,0);r.release(capture().originEncounterId);assert.deepEqual(r.entries,[]);
 const denied=fixture();let reject=true;denied.locks={request:async(_key,_options,callback)=>{if(reject)throw Error('lock refused');return callback();}};const d=make(denied);d.add(capture());assert.equal(await d.flush(),false);assert.equal(d.reason,'lock-error');reject=false;assert.equal(await d.flush(),true);
 const dropped=fixture();dropped.dropWrite=true;const q=make(dropped);q.add(capture());assert.equal(await q.flush(),false);assert.equal(q.reason,'storage-error');dropped.dropWrite=false;assert.equal(await q.flush(),true);
 const uncertain=fixture();uncertain.readAfterWrite=true;const u=make(uncertain);u.add(capture());assert.equal(await u.flush(),false);assert.equal(u.reason,'storage-error');assert.equal(u.saved,false);assert.equal(uncertain.writes.length,1);uncertain.readAfterWrite=false;assert.equal(await u.flush(),true);assert.equal(uncertain.writes.length,1,'verify prior write rather than send it again');
});

test('two v2 tabs cannot overwrite one another; even later release/replace/flush preserves the winning bytes',async()=>{
 const f=fixture(),seed=make(f);seed.add(capture());await seed.flush();const a=make(f),b=make(f);
 a.replace(capture().originEncounterId,capture('rhino',2));b.replace(capture().originEncounterId,capture('rhino',3));assert.equal(await a.flush(),true);assert.equal(await b.flush(),false);const winner=f.values.get(COMPANION_KEY);
 assert.equal(b.reason,'conflict');assert.equal(b.entries[0].id,capture('rhino',3).originEncounterId);b.release(capture('rhino',3).originEncounterId);assert.equal(await b.flush(),false);assert.equal(b.reason,'conflict');assert.equal(f.values.get(COMPANION_KEY),winner);assert.equal(await b.flush(),false);assert.equal(f.values.get(COMPANION_KEY),winner);
});

test('listener edits at async completion boundaries drain newer revisions and never announce stale saved data',async()=>{
 for(const depth of [0,3,7]){
  const f=fixture(),write=f.storage.setItem;let r,once=false;
  f.storage.setItem=(key,value)=>{write(key,value);if(!once){once=true;const later=n=>queueMicrotask(()=>n?later(n-1):r.add(capture('stag')));later(depth);}};
  r=make(f);const statuses=[];const off=r.subscribe(s=>{statuses.push({...s});if(s.saved)assert.deepEqual(JSON.parse(f.values.get(COMPANION_KEY)).entries,r.entries);s.saved='tampered';});r.subscribe(()=>{throw Error('view');});r.add(capture());await r.flush();await microtasks();assert.equal(r.saved,true);assert.equal(r.pending,false);assert.equal(r.entries.length,2);assert.deepEqual(make(f).entries,r.entries);assert.ok(statuses.some(s=>s.pending&&!s.saved));off();const count=statuses.length;r.release(capture('stag').originEncounterId);await r.flush();assert.equal(statuses.length,count);
 }
});
