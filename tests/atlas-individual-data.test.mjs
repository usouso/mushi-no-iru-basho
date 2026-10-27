/** Atlas gen3 data only. MapStorage and explicit locks; no network/browser/local-git dependency. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createExpedition,EXPEDITION_KEY,LEGACY_EXPEDITION_KEY,EXPEDITION_VERSION,EXPEDITION_SLOTS} from '../src/expedition.js';
import {createCompanionRoster,COMPANION_KEY} from '../src/individual-roster.js';
const clone=x=>JSON.parse(JSON.stringify(x));
// Frozen 0.33 136f18b, seed123/counter1; preserve loaded values, not regenerate them.
const oldSix=()=>({version:2,legacyImportDone:true,generatorVersion:2,worldSeed:123,outingCounter:1,encounters:EXPEDITION_SLOTS.slice(0,6).map((s,i)=>({encounterId:`g${i===5?2:1}-0000007b-o1-${s.habitat}-${s.populationSlotId}`,...s,sizePermille:[1112,1050,1143,1119,1116,1079][i],motionSeed:[3861188688,3063116229,521847916,3322267620,3957564467,3446211130][i],siteIndex:[1,2,1,2,0,0][i],measureVersion:1})),measuredEncounterIds:['g1-0000007b-o1-tropical-hercules-a','g2-0000007b-o1-night-giantstag'],best:[{species:'hercules',sizePermille:1112,encounterId:'g1-0000007b-o1-tropical-hercules-a',capturedAt:42,measureVersion:1},{species:'giantstag',sizePermille:1079,encounterId:'g2-0000007b-o1-night-giantstag',capturedAt:42,measureVersion:1}]});
const oldFive=()=>{const x=oldSix();x.generatorVersion=1;x.encounters.pop();x.measuredEncounterIds.pop();x.best.pop();return x;};
function fixture(current=null,legacy=null){
 const values=new Map([['mushi-journal-v1','journal untouched'],['mushi-companions-v1','legacy companions untouched'],[COMPANION_KEY,JSON.stringify({version:2,legacyImportDone:true,entries:[]})]]);if(current!==null)values.set(EXPEDITION_KEY,current);if(legacy!==null)values.set(LEGACY_EXPEDITION_KEY,legacy);
 const writes=[],reads=[],requests=[];let seedCalls=0;
 const f={values,writes,reads,requests,quota:false,throwAfter:false,failReadback:false,written:false,deny:false,
 seedSource(){seedCalls++;return 123;},get seedCalls(){return seedCalls;},now:()=>100,
 locks:{async request(key,options,fn){requests.push(key);assert.deepEqual(options,{mode:'exclusive'});if(f.deny)throw Error('lock');const result=fn();if(key===EXPEDITION_KEY||key===COMPANION_KEY)assert.ok(!(result instanceof Promise),'write section is synchronous');return result;}},
 storage:{getItem(key){reads.push(key);if(f.failReadback&&f.written)throw Error('readback');return values.get(key)??null;},setItem(key,value){assert.ok([EXPEDITION_KEY,COMPANION_KEY].includes(key));if(f.quota)throw Error('quota');writes.push([key,value]);values.set(key,value);f.written=true;if(f.throwAfter)throw Error('after write');},removeItem(){assert.fail('old stores are never deleted');}}};return f;
}
const make=f=>createExpedition(f.storage,f);
const raw=f=>f.values.get(EXPEDITION_KEY);
async function ready(seed=123){const f=fixture();f.seedSource=()=>seed;const e=make(f);assert.equal(await e.flush(),true);return{f,e};}
const capture=e=>({species:e.species,originHabitat:e.habitat,originIndividualId:e.runtimeSlotId,originKind:'expedition',originEncounterId:e.encounterId,sizePermille:e.sizePermille,measureVersion:e.measureVersion});
const fixedAtlas={species:'atlas',originHabitat:'understory',originIndividualId:'insect-5',originKind:'legacy',originEncounterId:null,sizePermille:null,measureVersion:null};

test('existing v2 gen1/gen2 outings retain exact five/six encounters, measurements and best without a load write',async()=>{
 for(const old of [oldFive(),oldSix()]){
  const bytes=JSON.stringify(old,null,2),f=fixture(bytes),e=make(f);assert.deepEqual(e.snapshot,old);assert.equal(await e.flush(),true);assert.equal(f.writes.length,0);assert.equal(raw(f),bytes);assert.equal(f.seedCalls,0);
  assert.equal(e.measure(old.encounters[2].encounterId).ok,true);assert.equal(await e.flush(),true);
  assert.deepEqual(e.snapshot.encounters,old.encounters);assert.equal(e.snapshot.generatorVersion,old.generatorVersion);assert.deepEqual(e.snapshot.best.slice(0,old.best.length),old.best);assert.deepEqual(e.snapshot.measuredEncounterIds.slice(0,old.measuredEncounterIds.length),old.measuredEncounterIds);
  assert.deepEqual(make(f).snapshot,e.snapshot);assert.equal(f.values.get('mushi-journal-v1'),'journal untouched');assert.equal(f.values.get('mushi-companions-v1'),'legacy companions untouched');
 }
});

test('v1 protected copy remains gen1, v2 stays authoritative, and explicit next alone upgrades old outings to gen6',async()=>{
 const old=oldFive();old.version=1;delete old.legacyImportDone;const bytes=JSON.stringify(old,null,2),f=fixture(null,bytes),e=make(f);
 assert.equal(EXPEDITION_KEY,'mushi-expedition-v2');assert.equal(EXPEDITION_VERSION,2);assert.equal(e.snapshot.generatorVersion,1);assert.equal(await e.flush(),true);
 assert.deepEqual(f.requests,[LEGACY_EXPEDITION_KEY,EXPEDITION_KEY]);assert.deepEqual(e.snapshot,{...old,version:2,legacyImportDone:true});assert.equal(f.values.get(LEGACY_EXPEDITION_KEY),bytes);assert.equal(f.seedCalls,0);
 f.values.set(LEGACY_EXPEDITION_KEY,'later old-tab raw');f.reads.length=0;assert.deepEqual(make(f).snapshot,e.snapshot);assert.ok(!f.reads.includes(LEGACY_EXPEDITION_KEY));
 for(const source of [e.snapshot,oldSix()]){
  const x=fixture(JSON.stringify(source)),r=make(x),before=r.snapshot,result=await r.beginNextOuting(before.outingCounter);
  assert.equal(result.ok,true);assert.equal(r.snapshot.generatorVersion,6);assert.equal(r.snapshot.encounters.length,9);assert.equal(r.snapshot.outingCounter,2);assert.deepEqual(r.snapshot.best,before.best);assert.deepEqual(r.snapshot.measuredEncounterIds,[]);assert.equal(x.seedCalls,0);
  const atlas=r.snapshot.encounters[6];assert.equal(atlas.encounterId,'g3-0000007b-o2-understory-atlas');assert.equal(atlas.runtimeSlotId,'insect-5');assert.deepEqual(make(x).snapshot,r.snapshot);
 }
 assert.equal(f.values.get(LEGACY_EXPEDITION_KEY),'later old-tab raw');
});

test('new users get nine; old six g1/g2 draws remain byte-identical at bounded seeds/counters',async()=>{
 const rows=[];
 for(const seed of [0,123,0xffffffff]){
  const {f,e}=await ready(seed);assert.equal(e.snapshot.generatorVersion,6);assert.equal(e.snapshot.encounters.length,9);assert.equal(EXPEDITION_SLOTS.length,9);assert.ok(EXPEDITION_SLOTS.every(Object.isFrozen));
  for(const counter of [1,2,Number.MAX_SAFE_INTEGER]){
   if(counter===2)assert.equal((await e.beginNextOuting()).ok,true);
   let s=e.snapshot;
   if(counter===Number.MAX_SAFE_INTEGER){const hi=clone(s);hi.outingCounter=counter-1;hi.measuredEncounterIds=[];hi.best=[];for(const x of hi.encounters)x.encounterId=x.encounterId.replace(/-o\d+-/,'-o'+hi.outingCounter+'-');const x=fixture(JSON.stringify(hi)),r=make(x);assert.equal((await r.beginNextOuting()).ok,true);s=r.snapshot;assert.equal((await r.beginNextOuting()).reason,'counter-limit');}
   rows.push(s.encounters.slice(0,6));const a=s.encounters[6];assert.equal(a.encounterId,`g3-${seed.toString(16).padStart(8,'0')}-o${counter}-understory-atlas`);assert.equal(a.species,'atlas');assert.equal(a.habitat,'understory');assert.equal(a.populationSlotId,'atlas');assert.equal(a.runtimeSlotId,'insect-5');assert.ok(Number.isInteger(a.sizePermille)&&a.sizePermille>=1000&&a.sizePermille<=1150);assert.ok(Number.isInteger(a.motionSeed)&&a.motionSeed>=0&&a.motionSeed<=0xffffffff);assert.ok([0,1,2].includes(a.siteIndex));assert.equal(a.measureVersion,1);
  }
  const saved=raw(f),count=f.writes.length;assert.deepEqual(make(f).snapshot,e.snapshot);assert.equal(await e.flush(),true);assert.equal(raw(f),saved);assert.equal(f.writes.length,count);
 }
 // Acquired privately from frozen 0.33; no git/source-history lookup at test time.
 assert.equal(createHash('sha256').update(JSON.stringify(rows)).digest('hex'),'d1292994e0a7c685e4ebbbc165b5966985f1bd4280e0338d0823ba0e62701b0e');
});

test('Atlas measurements reload once, preserve older maxima and never rewrite an old fixed companion',async()=>{
 const {f,e}=await ready(),r=createCompanionRoster(f.storage,f);assert.equal(await r.flush(),true);assert.equal(r.add(fixedAtlas).ok,true);assert.equal(await r.flush(),true);const companionBytes=f.values.get(COMPANION_KEY);
 for(const x of e.snapshot.encounters)assert.equal(e.measure(x.encounterId).ok,true);assert.equal(await e.flush(),true);assert.equal(e.snapshot.measuredEncounterIds.length,9);assert.equal(e.snapshot.best.length,8);const measured=e.snapshot,atlas=measured.encounters[6];assert.equal(e.measure(atlas.encounterId).alreadyMeasured,true);assert.deepEqual(make(f).snapshot,measured);
 assert.equal((await e.beginNextOuting()).ok,true);assert.deepEqual(e.snapshot.best,measured.best);assert.equal(e.measure(atlas.encounterId).reason,'invalid-encounter');
 // A valid saved current size is authoritative, not regenerated at load.
 const next=e.snapshot,oldBest=measured.best.find(b=>b.species==='atlas');next.encounters[6].sizePermille=1000;f.values.set(EXPEDITION_KEY,JSON.stringify(next));const loaded=make(f);assert.equal(loaded.measure(next.encounters[6].encounterId).newRecord,false);assert.equal(await loaded.flush(),true);assert.deepEqual(loaded.snapshot.best.find(b=>b.species==='atlas'),oldBest);
 assert.equal(f.values.get(COMPANION_KEY),companionBytes);assert.deepEqual(r.entries[0],{id:'understory/insect-5',...fixedAtlas,capturedAt:100});
});

test('initial/transition failures preserve the visible old outing; verified throw-after-write is successful',async()=>{
 const first=fixture();first.quota=true;const initial=make(first);assert.equal(await initial.flush(),false);assert.equal(initial.snapshot,null);assert.equal(first.seedCalls,1);first.quota=false;assert.equal(await initial.flush(),true);assert.equal(first.seedCalls,1);assert.equal(initial.snapshot.encounters.length,9);
 for(const mode of ['quota','deny','failReadback','foreign','missingLocks']){
  const bytes=JSON.stringify(oldSix()),f=fixture(bytes),e=mode==='missingLocks'?createExpedition(f.storage,{...f,locks:null}):make(f),before=e.snapshot;
  if(mode==='foreign')f.values.set(EXPEDITION_KEY,'foreign winner');else if(mode!=='missingLocks')f[mode]=true;
  const result=await e.beginNextOuting();assert.equal(result.ok,false,mode);assert.deepEqual(e.snapshot,before,mode);assert.equal(e.snapshot.encounters.length,6);
  if(mode==='failReadback'){assert.equal(e.reason,'storage-uncertain');const n=f.writes.length;f.failReadback=false;assert.equal(await e.flush(),false);assert.equal(f.writes.length,n);assert.equal(JSON.parse(raw(f)).generatorVersion,6,'uncertain outcome is not rolled back');}
  else assert.equal(raw(f),mode==='foreign'?'foreign winner':bytes);
 }
 const f=fixture(JSON.stringify(oldSix())),e=make(f);f.quota=true;assert.equal(e.measure(e.snapshot.encounters[2].encounterId).ok,true);const pending=e.snapshot;assert.equal((await e.beginNextOuting()).ok,false);assert.deepEqual(e.snapshot,pending);assert.equal(JSON.parse(raw(f)).measuredEncounterIds.length,2);f.quota=false;assert.equal((await e.beginNextOuting()).ok,true);assert.deepEqual(e.snapshot.best,pending.best);
 const after=fixture(JSON.stringify(oldSix())),a=make(after);after.throwAfter=true;assert.equal((await a.beginNextOuting()).ok,true);assert.equal(a.snapshot.generatorVersion,6);assert.deepEqual(JSON.parse(raw(after)),a.snapshot);
});

test('future/malformed generations and mismatched g3 namespace remain read-only without fallback',async()=>{
 const {e}=await ready(),good=e.snapshot,variants=[{...good,version:3},{...good,generatorVersion:7},{...good,generatorVersion:2},{...good,legacyImportDone:false},{...good,unknown:1},{...good,encounters:good.encounters.slice(0,6)}];
 for(const patch of [{encounterId:good.encounters[6].encounterId.replace('g3-','g2-')},{species:'__proto__'},{runtimeSlotId:'insect-6'},{habitat:'night'},{sizePermille:1151},{measureVersion:2},{siteIndex:3}]){const x=clone(good);Object.assign(x.encounters[6],patch);variants.push(x);}
 const duplicate=clone(good);duplicate.measuredEncounterIds=[good.encounters[6].encounterId,good.encounters[6].encounterId];variants.push(duplicate);
 const wrongBest=clone(good);wrongBest.best=[{species:'atlas',sizePermille:1150,encounterId:'g2-0000007b-o1-understory-atlas',capturedAt:1,measureVersion:1}];variants.push(wrongBest);
 for(const data of variants){const bytes=JSON.stringify(data),f=fixture(bytes,'validity is never inferred from fallback'),r=make(f);assert.equal(r.snapshot,null);assert.equal(r.reason,'invalid-data');assert.equal(await r.flush(),false);assert.equal((await r.beginNextOuting()).ok,false);assert.equal(f.writes.length,0);assert.equal(f.seedCalls,0);assert.equal(raw(f),bytes);assert.ok(!f.reads.includes(LEGACY_EXPEDITION_KEY));}
});

test('roster accepts only Atlas g3 with its fixed origin, explicit replacement and safe quota recovery',async()=>{
 const {f,e}=await ready(),r=createCompanionRoster(f.storage,f);await r.flush();r.add(fixedAtlas);for(const index of [0,5])assert.equal(r.add(capture(e.snapshot.encounters[index])).ok,true);await r.flush();const original=r.entries,oldRaw=f.values.get(COMPANION_KEY),a=capture(e.snapshot.encounters[6]);assert.equal(r.add(a).reason,'already-owned');
 for(const bad of [{originEncounterId:a.originEncounterId.replace('g3-','g1-')},{originEncounterId:a.originEncounterId.replace('g3-','g2-')},{originEncounterId:'g3-0000007b-o0-understory-atlas'},{originEncounterId:'g3-0000007b-o9007199254740992-understory-atlas'},{originEncounterId:'g3-0000007b-o1-night-atlas'},{originIndividualId:'insect-6'},{originHabitat:'night'},{sizePermille:999},{measureVersion:2}])assert.equal(r.replace(original[0].id,{...a,...bad}).reason,'invalid-capture');
 assert.deepEqual(r.entries,original);assert.equal(f.values.get(COMPANION_KEY),oldRaw);const n=f.writes.length;assert.equal(r.replace(original[0].id,a).ok,true);assert.equal(await r.flush(),true);assert.equal(f.writes.length,n+1);assert.deepEqual(r.entries.slice(1),original.slice(1));assert.deepEqual(createCompanionRoster(f.storage,f).entries,r.entries);
 const before=f.values.get(COMPANION_KEY),next={...a,originEncounterId:a.originEncounterId.replace('-o1-','-o2-')};f.quota=true;assert.equal(r.replace(a.originEncounterId,next).ok,true);assert.equal(await r.flush(),false);assert.equal(f.values.get(COMPANION_KEY),before);f.quota=false;assert.equal(await r.flush(),true);assert.equal(r.entries[0].originEncounterId,next.originEncounterId);assert.equal(r.entries.length,3);
 assert.equal(r.release(next.originEncounterId).ok,true);assert.equal(await r.flush(),true);assert.deepEqual(r.entries,original.slice(1));
});
