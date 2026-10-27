/** Isolated in-memory stores only; no browser storage, network or local-git dependency. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createExpedition,EXPEDITION_KEY,LEGACY_EXPEDITION_KEY,EXPEDITION_VERSION,EXPEDITION_SLOTS} from '../src/expedition.js';
import {createCompanionRoster,COMPANION_KEY} from '../src/individual-roster.js';
const copy=x=>JSON.parse(JSON.stringify(x));
const legacy=()=>({version:1,generatorVersion:1,worldSeed:123,outingCounter:1,encounters:EXPEDITION_SLOTS.slice(0,5).map((s,i)=>({...s,encounterId:`g1-0000007b-o1-${s.habitat}-${s.populationSlotId}`,sizePermille:[1112,1050,1143,1119,1116][i],motionSeed:[3861188688,3063116229,521847916,3322267620,3957564467][i],siteIndex:[1,2,1,2,0][i],measureVersion:1})),measuredEncounterIds:['g1-0000007b-o1-night-rhino'],best:[{species:'rhino',sizePermille:1143,encounterId:'g1-0000007b-o1-night-rhino',capturedAt:42,measureVersion:1}]});
function fixture(old=null,current=null){
 const values=new Map();if(old!==null)values.set(LEGACY_EXPEDITION_KEY,old);if(current!==null)values.set(EXPEDITION_KEY,current);
 const requests=[],writes=[],reads=[],held=[];let seeds=0;
 const f={values,requests,writes,reads,held,quota:false,throwAfter:false,failRead:false,failReadback:false,foreign:false,hold:false,deny:false,drop:false,written:false,
 locks:{async request(key,options,fn){assert.deepEqual(options,{mode:'exclusive'});requests.push(key);if(f.deny)throw Error('lock');if(f.hold)await new Promise(resolve=>held.push(resolve));return fn();}},
 seedSource:()=>{seeds++;return 123;},now:()=>100,get seeds(){return seeds;},
 storage:{getItem(k){reads.push(k);if(f.failRead||(f.failReadback&&f.written))throw Error('read');return values.get(k)??null;},setItem(k,v){assert.ok([EXPEDITION_KEY,COMPANION_KEY].includes(k),'never write legacy or unrelated key');if(f.quota)throw Error('quota');writes.push([k,v]);if(!f.drop)values.set(k,f.foreign?'foreign':v);f.written=true;if(f.throwAfter)throw Error('after');},removeItem(){assert.fail('no removal');}}
 };return f;
}
const make=f=>createExpedition(f.storage,f);
const tick=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
const raw=f=>f.values.get(EXPEDITION_KEY);
async function ready(){const f=fixture(),e=make(f);assert.equal(await e.flush(),true);return {f,e};}

test('v1 protected copy retains every old encounter, measurement and best; next explicit outing alone adds giant, Atlas and Manticora',async()=>{
 const old=legacy(),bytes=JSON.stringify(old,null,2),f=fixture(bytes),e=make(f);
 assert.equal(EXPEDITION_KEY,'mushi-expedition-v2');assert.equal(EXPEDITION_VERSION,2);
 assert.equal(e.snapshot.generatorVersion,1);assert.equal(e.snapshot.encounters.length,5);assert.deepEqual(e.snapshot.encounters,old.encounters);assert.equal(e.saved,false);
 assert.equal(await e.flush(),true);assert.deepEqual(f.requests,[LEGACY_EXPEDITION_KEY,EXPEDITION_KEY]);assert.equal(f.seeds,0);
 assert.deepEqual(e.snapshot,{...old,version:2,legacyImportDone:true});assert.equal(f.values.get(LEGACY_EXPEDITION_KEY),bytes);
 const n=f.writes.length,reload=make(f);assert.equal(reload.saved,true);assert.equal(await reload.flush(),true);assert.equal(f.writes.length,n);
 assert.equal((await e.beginNextOuting(1)).ok,true);assert.equal(e.snapshot.generatorVersion,6);assert.equal(e.snapshot.encounters.length,9);assert.equal(e.snapshot.outingCounter,2);assert.deepEqual(e.snapshot.best,old.best);assert.deepEqual(e.snapshot.measuredEncounterIds,[]);
 const g=e.snapshot.encounters[5];assert.equal(g.encounterId,'g2-0000007b-o2-night-giantstag');assert.equal(g.runtimeSlotId,'insect-6');assert.equal(e.measure(g.encounterId).ok,true);assert.equal(await e.flush(),true);assert.deepEqual(make(f).snapshot,e.snapshot);assert.equal(f.values.get(LEGACY_EXPEDITION_KEY),bytes);
});

test('new users get nine; original five g1 draws/IDs match frozen 0.25 output, with bounded giant-only g2 draws',async()=>{
 // Frozen 0.25 8a51b5d source, seeds0..15, outings1..2, five encounters each.
 const rows=[];for(let seed=0;seed<16;seed++){
  const f=fixture();f.seedSource=()=>seed;const e=make(f);assert.equal(e.snapshot,null);assert.equal(await e.flush(),true);
  for(let outing=1;outing<=2;outing++){
   const s=e.snapshot;rows.push(s.encounters.slice(0,5));assert.equal(s.generatorVersion,6);assert.equal(s.legacyImportDone,true);
   const g=s.encounters[5];assert.equal(g.species,'giantstag');assert.match(g.encounterId,/^g2-[0-9a-f]{8}-o[12]-night-giantstag$/);assert.ok(g.sizePermille>=1000&&g.sizePermille<=1150);assert.ok(Number.isInteger(g.motionSeed)&&g.motionSeed>=0&&g.motionSeed<=0xffffffff);assert.ok([0,1,2].includes(g.siteIndex));assert.equal(g.measureVersion,1);
   if(outing===1)assert.equal((await e.beginNextOuting()).ok,true);
  }
 }
 assert.equal(createHash('sha256').update(JSON.stringify(rows)).digest('hex'),'00b2df9a714f8b3ea126a1a7d2cd9a5b7d0ac711c7cc0a397608553c02744169');
});

test('v2 is authoritative: late v1 writes are never reimported or read; invalid v2 blocks legacy fallback',async()=>{
 const f=fixture(JSON.stringify(legacy())),e=make(f);await e.flush();const current=raw(f);f.values.set(LEGACY_EXPEDITION_KEY,'old tab later writes');f.reads.length=0;
 const r=make(f);assert.deepEqual(r.snapshot,e.snapshot);assert.equal(await r.flush(),true);assert.equal(f.reads.includes(LEGACY_EXPEDITION_KEY),false);assert.equal(raw(f),current);
 f.values.set(EXPEDITION_KEY,'future/invalid');const bad=make(f);assert.equal(bad.snapshot,null);assert.equal(await bad.flush(),false);assert.equal(bad.reason,'invalid-data');assert.equal(raw(f),'future/invalid');
});

test('migration quota and unsaved measure flush failures retain the current five, then recover without reroll',async()=>{
 const bytes=JSON.stringify(legacy()),f=fixture(bytes);f.quota=true;const e=make(f);e.measure(e.snapshot.encounters[0].encounterId);assert.equal(await e.flush(),false);const before=e.snapshot;
 assert.equal((await e.beginNextOuting()).ok,false);assert.deepEqual(e.snapshot,before);assert.equal(raw(f),undefined);assert.equal(f.seeds,0);
 f.quota=false;assert.equal(await e.flush(),true);assert.deepEqual(e.snapshot,before);assert.equal(make(f).snapshot.measuredEncounterIds.length,2);
 f.quota=true;e.measure(e.snapshot.encounters[3].encounterId);const measured=e.snapshot;assert.equal((await e.beginNextOuting()).ok,false);assert.deepEqual(e.snapshot,measured);assert.equal(e.snapshot.generatorVersion,1);
 f.quota=false;assert.equal((await e.beginNextOuting()).ok,true);assert.deepEqual(e.snapshot.best,measured.best);assert.equal(e.snapshot.encounters.length,9);assert.equal(f.values.get(LEGACY_EXPEDITION_KEY),bytes);
});

test('missing locks, invalid/future legacy and unknown initial reads never overwrite or guess empty',async()=>{
 const bytes=JSON.stringify(legacy()),f=fixture(bytes);const e=createExpedition(f.storage,{locks:null});assert.equal(e.snapshot.encounters.length,5);assert.equal(e.measure(e.snapshot.encounters[0].encounterId).ok,true);assert.equal(await e.flush(),false);assert.equal((await e.beginNextOuting()).reason,'missing-locks');assert.equal(f.writes.length,0);
 for(const old of ['{',JSON.stringify({...legacy(),version:2}),JSON.stringify({...legacy(),generatorVersion:2}),JSON.stringify({...legacy(),unknown:1})]){const x=fixture(old),r=make(x);assert.equal(r.snapshot,null);assert.equal(await r.flush(),false);assert.equal(x.writes.length,0);assert.equal(x.seeds,0);assert.equal(x.values.get(LEGACY_EXPEDITION_KEY),old);}
 const unknown=fixture(bytes);unknown.failRead=true;const r=make(unknown);assert.equal(await r.flush(),false);assert.equal(r.snapshot,null);assert.equal(unknown.seeds,0);unknown.failRead=false;assert.equal(await r.flush(),true);assert.deepEqual(r.snapshot.encounters,legacy().encounters);assert.equal(unknown.seeds,0);
});

test('old/new raw races, concurrent tabs and denied locks preserve exact winning bytes and visible outing',async()=>{
 for(const key of [LEGACY_EXPEDITION_KEY,EXPEDITION_KEY]){
  const f=fixture(JSON.stringify(legacy()));f.hold=true;const e=make(f);await tick();f.values.set(key,'foreign bytes');f.hold=false;f.held.shift()();assert.equal(await e.flush(),false);assert.equal(e.reason,'conflict');assert.equal(e.snapshot.encounters.length,5);assert.equal(f.values.get(key),'foreign bytes');assert.equal(f.writes.length,0);
 }
 const f=fixture(),a=make(f),b=make(f);assert.equal(await a.flush(),true);assert.equal(await b.flush(),true);assert.equal(f.seeds,1);assert.equal(f.writes.length,1);assert.deepEqual(a.snapshot,b.snapshot);
 const before=b.snapshot;await a.beginNextOuting();const winner=raw(f);b.measure(before.encounters[5].encounterId);assert.equal(await b.flush(),false);assert.equal(b.reason,'conflict');assert.deepEqual(b.snapshot.encounters,before.encounters);assert.equal(raw(f),winner);
 const denied=fixture(JSON.stringify(legacy()));denied.deny=true;const d=make(denied);assert.equal(await d.flush(),false);assert.equal(d.reason,'lock-error');assert.equal(denied.writes.length,0);
});

test('readback verifies throw-after-write, retries dropped writes, but protects uncertain/foreign results',async()=>{
 const bytes=JSON.stringify(legacy());const f=fixture(bytes);f.throwAfter=true;const e=make(f);assert.equal(await e.flush(),true);assert.equal(e.snapshot.generatorVersion,1);assert.equal(f.values.get(LEGACY_EXPEDITION_KEY),bytes);
 const drop=fixture(bytes);drop.drop=true;const d=make(drop);assert.equal(await d.flush(),false);assert.equal(d.reason,'storage-error');drop.drop=false;assert.equal(await d.flush(),true);
 for(const kind of ['failReadback','foreign']){const x=fixture(bytes);x[kind]=true;const r=make(x);assert.equal(await r.flush(),false);assert.equal(r.reason,kind==='foreign'?'conflict':'storage-uncertain');const count=x.writes.length;x[kind]=false;assert.equal(await r.flush(),false);assert.equal((await r.beginNextOuting()).ok,false);assert.equal(x.writes.length,count);assert.equal(r.snapshot.encounters.length,5);assert.equal(x.values.get(LEGACY_EXPEDITION_KEY),bytes);}
});

test('strict v2 generator, marker, g2 namespace, duplicate IDs and bounds remain protected',async()=>{
 const {e}=await ready(),good=e.snapshot;
 const variants=[{...good,version:3},{...good,generatorVersion:7},{...good,generatorVersion:2},{...good,generatorVersion:1},{...good,legacyImportDone:false},{...good,extra:1},{...good,encounters:good.encounters.slice(0,5)}];
 for(const patch of [{encounterId:good.encounters[5].encounterId.replace('g2-','g1-')},{sizePermille:1151},{siteIndex:3},{species:'__proto__'},{measureVersion:2}]){const x=copy(good);Object.assign(x.encounters[5],patch);variants.push(x);}
 const dup=copy(good);dup.measuredEncounterIds=[dup.encounters[0].encounterId,dup.encounters[0].encounterId];variants.push(dup);
 for(const x of variants){const bytes=JSON.stringify(x),f=fixture(JSON.stringify(legacy()),bytes),r=make(f);assert.equal(r.snapshot,null);assert.equal(await r.flush(),false);assert.equal(f.writes.length,0);assert.equal(raw(f),bytes);}
});

const giantCapture=id=>({species:'giantstag',originHabitat:'night',originIndividualId:'insect-6',originKind:'expedition',originEncounterId:id,sizePermille:1150,measureVersion:1});
test('roster keeps legacy null; only giant g2 accepted; explicit replace is one write and old g1 species stay valid',async()=>{
 const f=fixture(),r=createCompanionRoster(f.storage,f);await r.flush();
 const fixed={species:'giantstag',originHabitat:'night',originIndividualId:'insect-6',originKind:'legacy',originEncounterId:null,sizePermille:null,measureVersion:null};assert.equal(r.add(fixed).ok,true);await r.flush();assert.equal(r.entries[0].sizePermille,null);
 const id='g2-0000007b-o2-night-giantstag',capture=giantCapture(id);assert.equal(r.add(capture).reason,'already-owned');
 for(const bad of ['g1-0000007b-o2-night-giantstag','g2-0000007b-o0-night-giantstag','g2-0000007b-o9007199254740992-night-giantstag','g2-0000007b-o2-understory-giantstag','g2-0000007b-o2-night-stag'])assert.equal(r.replace('night/insect-6',giantCapture(bad)).reason,'invalid-capture');
 const n=f.writes.length;assert.equal(r.replace('night/insect-6',capture).ok,true);await r.flush();assert.equal(f.writes.length,n+1);assert.deepEqual(createCompanionRoster(f.storage,f).entries,r.entries);
 assert.equal(r.add({species:'stag',originHabitat:'night',originIndividualId:'insect-5',originEncounterId:'g1-0000007b-o1-night-stag',sizePermille:1000,measureVersion:1}).ok,true);await r.flush();
 const saved=f.values.get(COMPANION_KEY);f.quota=true;assert.equal(r.replace(id,giantCapture('g2-0000007b-o3-night-giantstag')).ok,true);assert.equal(await r.flush(),false);assert.equal(f.values.get(COMPANION_KEY),saved);f.quota=false;assert.equal(await r.flush(),true);assert.equal(r.entries.length,2);
});

test('eight current measurements persist seven species maxima, duplicate capture is stable and snapshots stay detached',async()=>{
 const {f,e}=await ready(),s=e.snapshot;for(const entry of s.encounters)assert.equal(e.measure(entry.encounterId).ok,true);
 assert.equal(await e.flush(),true);assert.equal(e.snapshot.measuredEncounterIds.length,9);assert.equal(e.snapshot.best.length,8);assert.deepEqual(make(f).snapshot,e.snapshot);
 const g=s.encounters[5],prior=e.snapshot.best.find(x=>x.species==='giantstag');assert.equal(e.measure(g.encounterId).alreadyMeasured,true);assert.equal(prior.encounterId,g.encounterId);assert.equal(prior.capturedAt,100);
 s.encounters[5].sizePermille=0;assert.notEqual(e.snapshot.encounters[5].sizePermille,0);const before=e.snapshot;assert.equal((await e.beginNextOuting()).ok,true);assert.deepEqual(e.snapshot.best,before.best);assert.equal(e.measure(g.encounterId).reason,'invalid-encounter');
});

test('failed or uncertain transition never exposes eight; lost lock result and double-click preserve old scene',async()=>{
 for(const mode of ['quota','failReadback','lostLock']){
  const bytes=JSON.stringify(legacy()),f=fixture(bytes),e=make(f);await e.flush();const before=e.snapshot;
  if(mode==='lostLock'){const request=f.locks.request;f.locks.request=async(...args)=>{await request(...args);throw Error('lost result');};}else {f[mode]=true;f.written=false;}
  const running=e.beginNextOuting(1);assert.equal(e.measure(before.encounters[0].encounterId).reason,'busy');assert.equal((await e.beginNextOuting(1)).reason,'busy');assert.equal((await running).ok,false);assert.deepEqual(e.snapshot,before);assert.equal(f.values.get(LEGACY_EXPEDITION_KEY),bytes);
  if(mode==='quota'){f.quota=false;assert.equal((await e.beginNextOuting()).ok,true);assert.equal(e.snapshot.encounters.length,9);}else{assert.equal(e.reason,'storage-uncertain');f.failReadback=false;const n=f.writes.length;assert.equal(await e.flush(),false);assert.equal(f.writes.length,n);assert.equal(JSON.parse(raw(f)).generatorVersion,6);}
 }
});
