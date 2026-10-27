/** Map storage + explicit Web-Lock doubles only. No user storage or browser. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createExpedition,EXPEDITION_KEY,LEGACY_EXPEDITION_KEY,EXPEDITION_VERSION,EXPEDITION_SLOTS} from '../src/expedition.js';
const microtasks=async()=>{for(let i=0;i<16;i++)await Promise.resolve();};
function lockRequest(key,options){assert.ok([LEGACY_EXPEDITION_KEY,EXPEDITION_KEY].includes(key));assert.deepEqual(options,{mode:'exclusive'});}
function atomic(key,callback){const result=callback();if(key===EXPEDITION_KEY)assert.ok(!(result instanceof Promise),'no await inside the v2 atomic storage section');return result;}
function locks(){const tails=new Map(),requests=[];return{requests,request(key,options,callback){lockRequest(key,options);requests.push(key);const task=(tails.get(key)||Promise.resolve()).then(()=>atomic(key,callback));tails.set(key,task.catch(()=>{}));return task;}};}
function heldLocks(){
 const queue=[],active=new Set(),requests=[];
 return{queue,requests,request(key,options,callback){lockRequest(key,options);requests.push(key);return new Promise((resolve,reject)=>queue.push({key,callback,resolve,reject}));},async next(){
  const index=queue.findIndex(r=>!active.has(r.key));assert.ok(index>=0,'an eligible queued lock exists');const [r]=queue.splice(index,1);active.add(r.key);
  try{Promise.resolve(atomic(r.key,r.callback)).then(r.resolve,r.reject).finally(()=>active.delete(r.key));}catch(e){active.delete(r.key);r.reject(e);}await microtasks();
 }};
}
function fixture(raw=null){
 const values=new Map([['mushi-journal-v1','old journal'],['mushi-journal-v2','current journal'],['mushi-companions-v1','old companions'],['mushi-companions-v2','current companions']]);if(raw!==null)values.set(EXPEDITION_KEY,raw);
 const reads=[],writes=[];let failRead=false,failWrite=false,dropWrite=false,throwAfterWrite=false,readbackFail=false,justWritten=false,seedCalls=0;
 return{values,reads,writes,locks:locks(),seedSource:()=>{seedCalls++;return 123;},now:()=>500,get seedCalls(){return seedCalls;},set failRead(v){failRead=v;},set failWrite(v){failWrite=v;},set dropWrite(v){dropWrite=v;},set throwAfterWrite(v){throwAfterWrite=v;},set readbackFail(v){readbackFail=v;justWritten=false;},storage:{getItem(key){assert.ok([EXPEDITION_KEY,LEGACY_EXPEDITION_KEY].includes(key),'only current/legacy expedition keys may be read; journal/companion keys are untouched');reads.push(key);if(failRead||(readbackFail&&justWritten))throw Error('unavailable');return values.get(key)??null;},setItem(key,value){assert.equal(key,EXPEDITION_KEY);if(failWrite)throw Error('quota');writes.push([key,value]);if(!dropWrite){values.set(key,value);justWritten=true;}if(throwAfterWrite)throw Error('after-write');},removeItem(){assert.fail('no deletion or reset');}}};
}
const make=f=>createExpedition(f.storage,f);
const raw=f=>f.values.get(EXPEDITION_KEY)??null;
async function ready(seed=123){const f=fixture();f.seedSource=()=>seed;const e=make(f);assert.equal(await e.flush(),true);return{f,e};}
function oldKeysUntouched(f){assert.equal(f.values.has(LEGACY_EXPEDITION_KEY),false,'new-user legacy expedition key is never created');assert.equal(f.values.get('mushi-journal-v1'),'old journal');assert.equal(f.values.get('mushi-journal-v2'),'current journal');assert.equal(f.values.get('mushi-companions-v1'),'old companions');assert.equal(f.values.get('mushi-companions-v2'),'current companions');}

test('first initialization publishes exactly eight fixed slots only after locked readback; snapshots/status are detached',async()=>{
 const f=fixture();f.locks=heldLocks();const e=make(f);assert.equal(EXPEDITION_KEY,'mushi-expedition-v2');assert.equal(LEGACY_EXPEDITION_KEY,'mushi-expedition-v1');assert.equal(EXPEDITION_VERSION,2);assert.equal(e.snapshot,null);assert.equal(e.pending,true);assert.equal(e.saved,false);assert.equal(e.measure('anything').reason,'not-ready');
 await microtasks();assert.equal(f.locks.queue.length,1);assert.equal(f.seedCalls,0);assert.equal(f.locks.queue[0].key,LEGACY_EXPEDITION_KEY);await f.locks.next();assert.equal(f.seedCalls,0);assert.equal(e.snapshot,null);assert.equal(f.locks.queue[0].key,EXPEDITION_KEY);await f.locks.next();assert.deepEqual(f.locks.requests,[LEGACY_EXPEDITION_KEY,EXPEDITION_KEY]);assert.equal(await e.flush(),true);assert.equal(f.seedCalls,1);
 const s=e.snapshot;assert.equal(s.worldSeed,123);assert.equal(s.outingCounter,1);assert.equal(s.encounters.length,9);assert.equal(s.generatorVersion,6);assert.equal(s.legacyImportDone,true);assert.deepEqual(s.encounters.map(x=>[x.species,x.habitat,x.runtimeSlotId]),[['hercules','tropical','insect-5'],['hercules','tropical','insect-6'],['rhino','night','insect-4'],['stag','night','insect-5'],['metallifer','understory','insect-4'],['giantstag','night','insect-6'],['atlas','understory','insect-5'],['manticora','savanna','insect-2'],['europestag','europe','insect-1']]);
 assert.deepEqual(s.encounters.slice(0,5).map(x=>[x.sizePermille,x.motionSeed,x.siteIndex]),[[1112,3861188688,1],[1050,3063116229,2],[1143,521847916,1],[1119,3322267620,2],[1116,3957564467,0]]);
 s.encounters[0].sizePermille=9999;s.best.push({});assert.equal(e.snapshot.encounters[0].sizePermille,1112);assert.deepEqual(e.snapshot.best,[]);assert.deepEqual(JSON.parse(raw(f)),e.snapshot);assert.ok(EXPEDITION_SLOTS.every(Object.isFrozen));oldKeysUntouched(f);
});

test('reload/flush/read/measure never regenerate encounters; saved manifest is authoritative and no reset/delete API exists',async()=>{
 const {f,e}=await ready(),stored=e.snapshot;stored.encounters[0].siteIndex=0;stored.encounters[0].motionSeed=0;stored.encounters[0].sizePermille=1001;f.values.set(EXPEDITION_KEY,JSON.stringify(stored));
 let seedCalls=0;const reloaded=createExpedition(f.storage,{locks:f.locks,seedSource:()=>{seedCalls++;throw Error('must not generate');},now:()=>100});assert.deepEqual(reloaded.snapshot,stored);assert.equal(reloaded.saved,true);const count=f.writes.length;
 for(let i=0;i<3;i++){assert.deepEqual(reloaded.snapshot.encounters,stored.encounters);assert.equal(await reloaded.flush(),true);}assert.equal(seedCalls,0);assert.equal(f.writes.length,count);
 reloaded.measure(stored.encounters[0].encounterId);await reloaded.flush();assert.deepEqual(reloaded.snapshot.encounters,stored.encounters);assert.equal(reloaded.snapshot.outingCounter,1);for(const key of ['reset','clear','delete','travel','restart'])assert.equal(key in reloaded,false);oldKeysUntouched(f);
});

test('only a successful explicit new outing increments once, preserves maxima, and rejects double clicks/stale counters',async()=>{
 const {f,e}=await ready();e.measure(e.snapshot.encounters[0].encounterId);await e.flush();const before=e.snapshot;
 f.locks=undefined; // Existing instance retains its supplied lock manager.
 const next=e.beginNextOuting(1);assert.equal(e.pending,true);assert.equal(e.measure(before.encounters[1].encounterId).reason,'busy');assert.equal((await e.beginNextOuting(1)).reason,'busy');const result=await next;
 assert.equal(result.ok,true);assert.equal(e.snapshot.outingCounter,2);assert.equal(e.snapshot.worldSeed,before.worldSeed);assert.deepEqual(e.snapshot.best,before.best);assert.deepEqual(e.snapshot.measuredEncounterIds,[]);assert.ok(e.snapshot.encounters.every((x,i)=>x.encounterId!==before.encounters[i].encounterId));assert.deepEqual(JSON.parse(raw(f)),e.snapshot);
 assert.equal((await e.beginNextOuting(1)).reason,'invalid-counter');assert.equal((await e.beginNextOuting(NaN)).reason,'invalid-counter');assert.equal(e.snapshot.outingCounter,2);result.snapshot.encounters.length=0;assert.equal(e.snapshot.encounters.length,9);oldKeysUntouched(f);
});

test('deterministic purpose-separated generation stays within 1000–1150 and three sites, with a small tuned upper tail',async()=>{
 let tails=0,total=0,min=1150,max=1000;const sites=new Set(),motions=new Set();
 for(let seed=0;seed<512;seed++){const {e}=await ready(seed),s=e.snapshot;for(const x of s.encounters){assert.ok(Number.isInteger(x.sizePermille)&&x.sizePermille>=1000&&x.sizePermille<=1150);assert.ok(Number.isInteger(x.motionSeed)&&x.motionSeed>=0&&x.motionSeed<=0xffffffff);assert.ok(Number.isInteger(x.siteIndex)&&x.siteIndex>=0&&x.siteIndex<=2);assert.equal(x.measureVersion,1);assert.match(x.encounterId,x.species==='europestag'?/^g6-[0-9a-f]{8}-o1-europe-europestag$/:x.species==='manticora'?/^g4-[0-9a-f]{8}-o1-savanna-manticora$/:x.species==='atlas'?/^g3-[0-9a-f]{8}-o1-understory-atlas$/:x.species==='giantstag'?/^g2-[0-9a-f]{8}-o1-night-giantstag$/:/^g1-[0-9a-f]{8}-o1-(tropical|night|understory)-(hercules-a|hercules-b|rhino|stag|metallifer)$/);tails+=x.sizePermille>1125;total++;min=Math.min(min,x.sizePermille);max=Math.max(max,x.sizePermille);sites.add(x.siteIndex);motions.add(x.motionSeed);}}
 assert.equal(min,1000);assert.equal(max,1150);assert.equal(sites.size,3);assert.ok(motions.size>2500);assert.ok(tails/total>.07&&tails/total<.13,'coverage of a ~10% game-tuned tail, not biological frequency');
 const a=await ready(0xffffffff),b=await ready(0xffffffff);assert.deepEqual(a.e.snapshot,b.e.snapshot);await a.e.beginNextOuting();await b.e.beginNextOuting();assert.deepEqual(a.e.snapshot,b.e.snapshot);
});

test('measuring is stable once per current encounter; maxima include identity/size/time and lower or equal captures never reannounce a record',async()=>{
 const {f,e}=await ready(),s=e.snapshot,large=s.encounters[0],small=s.encounters[1];let result=e.measure(large.encounterId);assert.equal(result.ok,true);assert.equal(result.newRecord,true);assert.equal(result.best.encounterId,large.encounterId);assert.equal(result.best.capturedAt,500);assert.equal(result.saved,false);assert.equal(e.saved,false);
 result.best.sizePermille=0;result.entry.encounterId='changed';const again=e.measure(large.encounterId);assert.equal(again.alreadyMeasured,true);assert.equal(again.newRecord,false);assert.equal(again.best.sizePermille,1112);const lower=e.measure(small.encounterId);assert.equal(lower.newRecord,false);assert.equal(lower.best.encounterId,large.encounterId);
 for(const x of s.encounters.slice(2))e.measure(x.encounterId);assert.equal(await e.flush(),true);assert.equal(e.snapshot.best.length,8);assert.equal(e.snapshot.measuredEncounterIds.length,9);const loaded=make(f);assert.equal(loaded.measure(large.encounterId).alreadyMeasured,true);assert.deepEqual(loaded.snapshot,e.snapshot);
 const count=f.writes.length;assert.equal(e.measure('not-an-id').reason,'invalid-encounter');assert.equal(f.writes.length,count);await e.beginNextOuting();assert.equal(e.measure(large.encounterId).reason,'invalid-encounter');assert.equal(e.snapshot.best.find(b=>b.species==='hercules').encounterId,large.encounterId);oldKeysUntouched(f);
});

test('missing locks/unavailable storage use legacy-null when empty, but valid existing data can be measured only in memory',async()=>{
 for(const storage of [null,{getItem(){throw Error('blocked');},setItem(){assert.fail();}}]){const e=createExpedition(storage,{locks:null,seedSource:()=>1});assert.equal(e.snapshot,null);assert.equal(await e.flush(),false);assert.equal((await e.beginNextOuting()).ok,false);}
 const empty=fixture(),without=createExpedition(empty.storage,{locks:null,seedSource:()=>1});assert.equal(without.snapshot,null);assert.equal(await without.flush(),false);assert.equal(empty.writes.length,0);
 const {f}=await ready(),original=raw(f),e=createExpedition(f.storage,{locks:null,now:()=>100});assert.ok(e.snapshot);assert.equal(e.saved,false);assert.equal(e.measure(e.snapshot.encounters[0].encounterId).ok,true);assert.equal(await e.flush(),false);const before=e.snapshot;assert.equal((await e.beginNextOuting()).reason,'missing-locks');assert.deepEqual(e.snapshot,before);assert.equal(raw(f),original);oldKeysUntouched(f);
});

test('strict corrupt/future/extra-field data is read-only without guessing a seed, migration or overwriting original bytes',async()=>{
 const {e}=await ready(),good=e.snapshot,variants=['{','',JSON.stringify({...good,version:3}),JSON.stringify({...good,generatorVersion:7}),JSON.stringify({...good,extra:1}),JSON.stringify({...good,encounters:good.encounters.slice(1)}),JSON.stringify({...good,encounters:good.encounters.map((x,i)=>i?x:{...x,extra:1})}),JSON.stringify({...good,measuredEncounterIds:[good.encounters[0].encounterId]}),JSON.stringify({...good,best:[{species:'hercules',sizePermille:1112,encounterId:good.encounters[0].encounterId,capturedAt:1,measureVersion:1}]}),'x'.repeat(16385)];
 for(const original of variants){const f=fixture(original),r=make(f);assert.equal(r.snapshot,null);assert.equal(r.reason,'invalid-data');assert.equal(r.measure(good.encounters[0].encounterId).ok,false);assert.equal(await r.flush(),false);assert.equal((await r.beginNextOuting()).ok,false);assert.equal(raw(f),original);assert.equal(f.seedCalls,0);assert.equal(f.writes.length,0);oldKeysUntouched(f);}
});

test('quota failures retain candidate seed or measured memory and never switch outings until a complete retry succeeds',async()=>{
 const f=fixture();f.failWrite=true;const e=make(f);assert.equal(await e.flush(),false);assert.equal(e.snapshot,null);assert.equal(f.seedCalls,1);assert.equal(raw(f),null);assert.equal(await e.flush(),false);assert.equal(f.seedCalls,1);f.failWrite=false;assert.equal(await e.flush(),true);assert.equal(e.snapshot.worldSeed,123);
 const baseline=raw(f);f.failWrite=true;e.measure(e.snapshot.encounters[0].encounterId);assert.equal(await e.flush(),false);assert.equal(e.snapshot.best.length,1);assert.equal(raw(f),baseline);const before=e.snapshot;assert.equal((await e.beginNextOuting()).ok,false);assert.deepEqual(e.snapshot,before);assert.equal(raw(f),baseline);
 f.failWrite=false;await e.flush();const saved=raw(f);f.failWrite=true;const failed=await e.beginNextOuting();assert.equal(failed.ok,false);assert.equal(e.snapshot.outingCounter,1);assert.equal(raw(f),saved);assert.deepEqual(e.snapshot,before);f.failWrite=false;assert.equal((await e.beginNextOuting()).ok,true);assert.equal(e.snapshot.outingCounter,2);assert.deepEqual(e.snapshot.best,before.best);oldKeysUntouched(f);
});

test('cooperating initial tabs adopt one seed; stale measurement/outing writers cannot overwrite a newer tab or jump the current screen',async()=>{
 const f=fixture();f.locks=heldLocks();const a=make(f),b=make(f);await microtasks();assert.equal(f.locks.queue.length,2);await f.locks.next();await f.locks.next();await f.locks.next();await f.locks.next();assert.deepEqual(f.locks.requests,[LEGACY_EXPEDITION_KEY,LEGACY_EXPEDITION_KEY,EXPEDITION_KEY,EXPEDITION_KEY]);assert.equal(await a.flush(),true);assert.equal(await b.flush(),true);assert.equal(f.seedCalls,1);assert.equal(f.writes.length,1);assert.deepEqual(a.snapshot,b.snapshot);
 const beforeB=b.snapshot;const next=a.beginNextOuting();await microtasks();await f.locks.next();assert.equal((await next).ok,true);const winner=raw(f);assert.deepEqual(b.snapshot,beforeB,'no automatic population jump');b.measure(beforeB.encounters[0].encounterId);await microtasks();await f.locks.next();assert.equal(b.saved,false);assert.equal(b.reason,'conflict');assert.equal(await b.flush(),false);assert.equal((await b.beginNextOuting()).ok,false);assert.equal(raw(f),winner);assert.equal(b.snapshot.outingCounter,1);oldKeysUntouched(f);
});

test('readback distinguishes dropped writes, verified after-write errors and uncertain/foreign outcomes without blind retry',async()=>{
 const dropped=fixture();dropped.dropWrite=true;const d=make(dropped);assert.equal(await d.flush(),false);assert.equal(d.snapshot,null);assert.equal(d.reason,'storage-error');dropped.dropWrite=false;assert.equal(await d.flush(),true);
 const thrown=fixture();thrown.throwAfterWrite=true;const t=make(thrown);assert.equal(await t.flush(),true,'readback proves this write did occur');assert.ok(t.snapshot);
 const {f,e}=await ready(),before=e.snapshot;f.readbackFail=true;const changed=await e.beginNextOuting();assert.equal(changed.ok,false);assert.equal(e.reason,'storage-uncertain');assert.deepEqual(e.snapshot,before);const actual=raw(f),count=f.writes.length;f.readbackFail=false;assert.equal(await e.flush(),false);assert.equal((await e.beginNextOuting()).ok,false);assert.equal(raw(f),actual);assert.equal(f.writes.length,count);assert.equal(JSON.parse(actual).outingCounter,2,'uncertain outcome is not falsely called unexecuted');
 const denied=fixture();denied.locks={request:async()=>{throw Error('lock denied');}};const deniedStore=make(denied);assert.equal(await deniedStore.flush(),false);assert.equal(deniedStore.reason,'lock-error');assert.equal(deniedStore.snapshot,null);assert.equal(denied.seedCalls,0);
 const uncertain=await ready(),uncertainBefore=uncertain.e.snapshot;let failLock=false;const gate={request:async(_key,_opts,fn)=>{const result=fn();if(failLock)throw Error('lock result lost');return result;}};const uncertainStore=createExpedition(uncertain.f.storage,{locks:gate,now:()=>1});failLock=true;assert.equal((await uncertainStore.beginNextOuting()).ok,false);assert.equal(uncertainStore.reason,'storage-uncertain');assert.deepEqual(uncertainStore.snapshot,uncertainBefore);
 const foreign=await ready(),foreignBefore=foreign.e.snapshot;const set=foreign.f.storage.setItem;foreign.f.storage.setItem=(k,v)=>{set(k,v);foreign.f.values.set(k,'foreign bytes');};assert.equal((await foreign.e.beginNextOuting()).ok,false);assert.equal(foreign.e.reason,'conflict');assert.deepEqual(foreign.e.snapshot,foreignBefore);assert.equal(await foreign.e.flush(),false);assert.equal(raw(foreign.f),'foreign bytes');
});

test('failed initial read recovers by reading before generating; invalid clocks and counter overflow leave prior data unchanged',async()=>{
 const loaded=await ready(),existing=raw(loaded.f),f=fixture(existing);f.failRead=true;const e=make(f);assert.equal(e.snapshot,null);assert.equal(await e.flush(),false);f.failRead=false;assert.equal(await e.flush(),true);assert.equal(f.seedCalls,0);assert.equal(raw(f),existing);
 for(const seedSource of [()=>NaN,()=>-1,()=>1.2,()=>0x100000000,()=>{throw Error('seed');}]){const z=fixture(),r=createExpedition(z.storage,{locks:z.locks,seedSource});assert.equal(await r.flush(),false);assert.equal(r.reason,'seed-unavailable');assert.equal(r.snapshot,null);assert.equal(z.writes.length,0);}
 for(const now of [()=>NaN,()=>-1,()=>1.2,()=>{throw Error('clock');}]){const r=createExpedition(f.storage,{locks:f.locks,now}),before=r.snapshot;assert.equal(r.measure(before.encounters[0].encounterId).reason,'invalid-time');assert.deepEqual(r.snapshot,before);}
 const limit=JSON.parse(existing);limit.outingCounter=Number.MAX_SAFE_INTEGER;for(const x of limit.encounters)x.encounterId=x.encounterId.replace('-o1-','-o9007199254740991-');const z=fixture(JSON.stringify(limit)),r=make(z);assert.ok(r.snapshot);assert.equal((await r.beginNextOuting()).reason,'counter-limit');assert.equal(z.writes.length,0);
});

test('status listeners cannot mutate data, and a capture arriving during persistence is coalesced without false saved status',async()=>{
 for(let depth=0;depth<5;depth++){
  const {f,e}=await ready(),set=f.storage.setItem;let once=false;f.storage.setItem=(k,v)=>{set(k,v);if(!once){once=true;const later=n=>queueMicrotask(()=>n?later(n-1):e.measure(e.snapshot.encounters[2].encounterId));later(depth);}};
  const statuses=[],off=e.subscribe(s=>{statuses.push({...s});if(s.saved)assert.deepEqual(JSON.parse(raw(f)),e.snapshot);s.saved='tamper';});e.subscribe(()=>{throw Error('view');});e.measure(e.snapshot.encounters[0].encounterId);await e.flush();await microtasks();await e.flush();assert.equal(e.saved,true);assert.equal(e.snapshot.best.length,2);assert.deepEqual(JSON.parse(raw(f)),e.snapshot);assert.ok(statuses.some(s=>s.pending&&!s.saved));off();const count=statuses.length;e.measure(e.snapshot.encounters[3].encounterId);await e.flush();assert.equal(statuses.length,count);oldKeysUntouched(f);
 }
});

test('flush from a transition status listener waits for that transition and pending is never advertised as saved',async()=>{
 const {e}=await ready();let listenerFlush=null,observedPending=false;
 e.subscribe(status=>{if(status.pending){observedPending=true;assert.equal(status.saved,false);assert.equal(e.saved,false);listenerFlush??=e.flush();}});
 const next=e.beginNextOuting(1);assert.equal(e.snapshot.outingCounter,1);assert.equal(e.pending,true);assert.equal((await next).ok,true);assert.ok(observedPending);assert.equal(await listenerFlush,true);assert.equal(e.pending,false);assert.equal(e.saved,true);assert.equal(e.snapshot.outingCounter,2);
});
