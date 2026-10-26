/** Pure Map/explicit-lock-double tests. No user storage, browser or network. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {COMPANION_KEY,COMPANION_VERSION,COMPANION_SPECIES,createCompanionRoster,isCompanionSpecies} from '../src/companion-roster.js';
const captures={hercules:{species:'hercules',originHabitat:'tropical',originIndividualId:'insect-5'},rhino:{species:'rhino',originHabitat:'night',originIndividualId:'insect-4'},stag:{species:'stag',originHabitat:'night',originIndividualId:'insect-5'}};
const entry=(species='hercules')=>({id:`${captures[species].originHabitat}/${captures[species].originIndividualId}`,...captures[species],capturedAt:100});
const payload=entries=>JSON.stringify({version:1,entries});
const microtasks=async()=>{for(let i=0;i<14;i++)await Promise.resolve();};
function locks(){const requests=[],tails=new Map();return {requests,request(key,options,callback){assert.equal(key,COMPANION_KEY);assert.equal(options.mode,'exclusive');requests.push(key);const operation=(tails.get(key)||Promise.resolve()).then(callback);tails.set(key,operation.catch(()=>{}));return operation;}};}
function heldLocks(){const requests=[];return {requests,request(key,options,callback){assert.equal(key,COMPANION_KEY);assert.equal(options.mode,'exclusive');return new Promise((resolve,reject)=>requests.push({callback,resolve,reject}));},async next(){const r=requests.shift();assert.ok(r);try{r.resolve(await r.callback());}catch(e){r.reject(e);}await microtasks();}};}
function fixture(raw=null){
 const values=new Map([['mushi-journal-v1','untouched legacy journal'],['mushi-journal-v2','untouched current journal']]);if(raw!==null)values.set(COMPANION_KEY,raw);
 const reads=[],writes=[];let failRead=false,failWrite=false,dropWrite=false;
 return {values,reads,writes,locks:locks(),now:()=>200,get failRead(){return failRead;},set failRead(v){failRead=v;},set failWrite(v){failWrite=v;},set dropWrite(v){dropWrite=v;},storage:{getItem(key){assert.equal(key,COMPANION_KEY,'never read an encounter journal');reads.push(key);if(failRead)throw Error('blocked');return values.get(key)??null;},setItem(key,value){assert.equal(key,COMPANION_KEY,'never mutate an encounter journal');if(failWrite)throw Error('quota');writes.push([key,value]);if(!dropWrite)values.set(key,value);}}};
}
const make=f=>createCompanionRoster(f.storage,f);
function journalUnchanged(f){assert.equal(f.values.get('mushi-journal-v1'),'untouched legacy journal');assert.equal(f.values.get('mushi-journal-v2'),'untouched current journal');}

test('three explicit captures persist, one specimen per species, detached values, and only explicit release removes ownership',async()=>{
 const f=fixture(),r=make(f);assert.equal(COMPANION_KEY,'mushi-companions-v1');assert.equal(COMPANION_VERSION,1);assert.deepEqual(COMPANION_SPECIES,['hercules','rhino','stag']);assert.deepEqual(r.entries,[]);assert.equal(f.writes.length,0,'a journal does not invent companions');
 assert.equal(r.saved,true);
 for(const species of COMPANION_SPECIES){assert.equal(isCompanionSpecies(species),true);const result=r.add(captures[species]);assert.equal(result.ok,true);result.entry.species='altered externally';}
 assert.equal(r.pending,true);assert.equal(r.saved,false);assert.equal(r.entries.length,3);const copy=r.entries;copy[0].capturedAt=0;copy.pop();assert.equal(r.entries.length,3);assert.equal(r.entries[0].capturedAt,200);
 assert.equal(await r.flush(),true);const stored=f.values.get(COMPANION_KEY);assert.deepEqual(make(f).entries,r.entries);
 assert.deepEqual(r.add({...captures.hercules,originIndividualId:'insect-6'}),{ok:false,reason:'already-owned'});assert.equal(f.values.get(COMPANION_KEY),stored);
 const result=r.release('night/insect-4');assert.equal(result.ok,true);assert.equal(result.entry.species,'rhino');assert.equal(await r.flush(),true);assert.deepEqual(make(f).entries.map(e=>e.species),['hercules','stag']);
 assert.deepEqual(r.release('night/insect-4'),{ok:false,reason:'not-owned'});assert.equal('reset' in r,false);assert.equal('clear' in r,false);journalUnchanged(f);
});

test('unsupported species, invalid origins, collisions and invalid clocks do not create ownership',async()=>{
 const f=fixture(),r=make(f);
 for(const candidate of [{species:'butterfly',originHabitat:'meadow',originIndividualId:'insect-1'},{species:'__proto__',originHabitat:'night',originIndividualId:'insect-1'},{...captures.rhino,originHabitat:'tropical'},{...captures.stag,originIndividualId:'insect-0'},{...captures.stag,originIndividualId:'../insect-1'},{}])assert.equal(r.add(candidate).ok,false);
 assert.equal(isCompanionSpecies('constructor'),false);assert.equal(isCompanionSpecies(null),false);assert.deepEqual(r.entries,[]);assert.equal(f.writes.length,0);
 assert.equal(r.add(captures.rhino).ok,true);assert.deepEqual(r.add({...captures.stag,originIndividualId:captures.rhino.originIndividualId}),{ok:false,reason:'origin-owned'});await r.flush();
 for(const now of [()=>NaN,()=>-1,()=>1.5,()=>{throw Error('clock');}]){const bad=createCompanionRoster(f.storage,{locks:f.locks,now});assert.deepEqual(bad.add(captures.hercules),{ok:false,reason:'invalid-time'});}
 journalUnchanged(f);
});

test('missing Web Locks retains session-only ownership and explicit release without changing original bytes',async()=>{
 for(const raw of [null,payload([entry()])]){
  const f=fixture(raw),r=createCompanionRoster(f.storage,{locks:null,now:f.now});assert.equal(r.saved,false);assert.equal(r.reason,'missing-locks');assert.equal(r.add(captures.stag).ok,true);assert.equal(r.entries.some(e=>e.species==='stag'),true);assert.equal(await r.flush(),false);assert.equal(r.pending,false);assert.equal(r.reason,'missing-locks');assert.equal(f.writes.length,0);assert.equal(f.values.get(COMPANION_KEY)??null,raw);
  assert.equal(make(f).entries.some(e=>e.species==='stag'),false);r.release('night/insect-5');assert.equal(r.entries.some(e=>e.species==='stag'),false);journalUnchanged(f);
 }
});

test('corrupt, future, unknown or lossy original data is never repaired or overwritten by add/release/flush',async()=>{
 const rawCases=['{','',JSON.stringify({version:2,entries:[entry()]}),JSON.stringify({version:1,entries:[entry()],future:'keep me'}),payload([entry(),entry()]),payload([{...entry(),species:'unknown'}]),payload([{...entry(),future:'keep me'}]),'x'.repeat(8193)];
 for(const raw of rawCases){const f=fixture(raw),r=make(f);assert.equal(r.saved,false);assert.equal(r.reason,'invalid-data');assert.equal(r.add(captures.stag).ok,true);if(r.entries.some(e=>e.id===entry().id))r.release(entry().id);assert.equal(await r.flush(),false);assert.equal(r.reason,'invalid-data');assert.equal(f.values.get(COMPANION_KEY),raw);assert.equal(f.writes.length,0);journalUnchanged(f);}
});

test('quota and lock failures preserve memory ownership, retry safely, and never report an unknown write as saved',async()=>{
 const f=fixture();f.failWrite=true;const r=make(f);r.add(captures.hercules);assert.equal(await r.flush(),false);assert.equal(r.reason,'storage-error');assert.equal(r.entries.length,1);assert.equal(f.values.has(COMPANION_KEY),false);f.failWrite=false;assert.equal(await r.flush(),true);assert.equal(make(f).entries.length,1);
 const denied=fixture();let reject=true;denied.locks={request:async(_key,_opts,callback)=>{if(reject)throw Error('denied');return callback();}};const d=make(denied);d.add(captures.stag);assert.equal(await d.flush(),false);assert.equal(d.reason,'lock-error');reject=false;assert.equal(await d.flush(),true);
 const dropped=fixture();dropped.dropWrite=true;const q=make(dropped);q.add(captures.rhino);assert.equal(await q.flush(),false);assert.equal(q.reason,'storage-error');assert.equal(dropped.values.has(COMPANION_KEY),false);dropped.dropWrite=false;assert.equal(await q.flush(),true);
 journalUnchanged(f);journalUnchanged(denied);journalUnchanged(dropped);
});

test('two tabs cannot overwrite each other, including repeat flush and an explicit local release',async()=>{
 const f=fixture();f.locks=heldLocks();const a=make(f),b=make(f);a.add(captures.hercules);b.add(captures.stag);await microtasks();assert.equal(f.locks.requests.length,2);await f.locks.next();assert.equal(await a.flush(),true);const winner=f.values.get(COMPANION_KEY);await f.locks.next();assert.equal(b.saved,false);assert.equal(b.reason,'conflict');assert.equal(b.entries[0].species,'stag');
 const retry=b.flush();await microtasks();await f.locks.next();assert.equal(await retry,false);assert.equal(f.values.get(COMPANION_KEY),winner);
 assert.equal(b.release('night/insect-5').ok,true);await microtasks();await f.locks.next();assert.equal(b.saved,false);assert.equal(f.values.get(COMPANION_KEY),winner);assert.equal(f.writes.length,1);journalUnchanged(f);
});

test('a blocked initial read may recover only into an empty store, not replace later-discovered companions',async()=>{
 for(const existing of [false,true]){
  const f=fixture();f.failRead=true;const r=make(f);r.add(captures.stag);assert.equal(await r.flush(),false);f.failRead=false;if(existing)f.values.set(COMPANION_KEY,payload([entry()]));const old=f.values.get(COMPANION_KEY);assert.equal(await r.flush(),!existing);assert.equal(r.entries[0].species,'stag');if(existing){assert.equal(r.reason,'conflict');assert.equal(f.values.get(COMPANION_KEY),old);}journalUnchanged(f);
 }
});

test('subscriptions are detached and edits at asynchronous completion boundaries cannot announce stale persistence',async()=>{
 for(let depth=0;depth<7;depth++){
  const f=fixture(),write=f.storage.setItem;let r,once=false;
  f.storage.setItem=(key,value)=>{write(key,value);if(!once){once=true;const later=n=>queueMicrotask(()=>n?later(n-1):r.add(captures.stag));later(depth);}};
  r=make(f);const statuses=[];const off=r.subscribe(status=>{statuses.push({...status});if(status.saved)assert.deepEqual(JSON.parse(f.values.get(COMPANION_KEY)||payload([])).entries,r.entries);status.saved='tampered';});r.subscribe(()=>{throw Error('view');});r.add(captures.hercules);await r.flush();await microtasks();await microtasks();assert.equal(r.saved,true);assert.equal(r.pending,false);assert.equal(r.reason,null);assert.equal(r.entries.length,2);assert.deepEqual(make(f).entries,r.entries);assert.ok(statuses.some(s=>s.pending&&!s.saved));off();const count=statuses.length;r.release('night/insect-5');await r.flush();assert.equal(statuses.length,count);journalUnchanged(f);
 }
});
