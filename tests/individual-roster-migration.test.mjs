/** Migration uses only Maps and exclusive queue doubles; no user data is touched. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {COMPANION_KEY,LEGACY_COMPANION_KEY,createCompanionRoster} from '../src/individual-roster.js';
const legacy=(species='rhino')=>({id:`night/insect-${species==='rhino'?4:5}`,species,originHabitat:'night',originIndividualId:`insect-${species==='rhino'?4:5}`,capturedAt:100});
const migrated=e=>({...e,originKind:'legacy',originEncounterId:null,sizePermille:null,measureVersion:null});
const oldPayload=entries=>JSON.stringify({version:1,entries});
const newPayload=entries=>JSON.stringify({version:2,legacyImportDone:true,entries});
const capture=(species='metallifer')=>({species,originHabitat:species==='metallifer'?'understory':'night',originIndividualId:'insect-4',originKind:'expedition',originEncounterId:`g1-1234abcd-o1-${species==='metallifer'?'understory':'night'}-${species}`,sizePermille:1100,measureVersion:1});
const tick=async()=>{for(let i=0;i<18;i++)await Promise.resolve();};
function locks(){const requests=[],active=new Set(),tails=new Map();return {requests,active,request(key,options,callback){assert.equal(options.mode,'exclusive');requests.push(key);const task=(tails.get(key)||Promise.resolve()).then(async()=>{assert.equal(active.has(key),false);active.add(key);try{return await callback();}finally{active.delete(key);}});tails.set(key,task.catch(()=>{}));return task;}};}
function fixture(oldRaw=oldPayload([legacy()]),newRaw=null){
 const values=new Map([['mushi-journal-v2','never touched']]);if(oldRaw!==null)values.set(LEGACY_COMPANION_KEY,oldRaw);if(newRaw!==null)values.set(COMPANION_KEY,newRaw);
 const reads=[],writes=[];let failRead=false,failWrite=false;
 const f={values,reads,writes,locks:locks(),now:()=>200,set failRead(v){failRead=v;},set failWrite(v){failWrite=v;},storage:{getItem(key){assert.ok([COMPANION_KEY,LEGACY_COMPANION_KEY].includes(key));reads.push(key);if(failRead)throw Error('read unavailable');return values.get(key)??null;},setItem(key,value){assert.equal(key,COMPANION_KEY,'old bytes must not be written');assert.ok(f.locks.active.has(COMPANION_KEY));if(!values.has(COMPANION_KEY))assert.ok(f.locks.active.has(LEGACY_COMPANION_KEY),'initial migration holds both locks');if(failWrite)throw Error('quota');writes.push([key,value]);values.set(key,value);}}};return f;
}
const make=f=>createCompanionRoster(f.storage,f);

test('one-time initial migration preserves old exact bytes and unknown sizes, with marker and all entries in one new-key write',async()=>{
 const raw='  '+oldPayload([legacy(),legacy('stag')])+'\n',f=fixture(raw),r=make(f);
 assert.deepEqual(r.entries,[migrated(legacy()),migrated(legacy('stag'))]);assert.equal(r.saved,false);assert.equal(r.pending,true);assert.equal(r.reason,'pending');assert.equal(f.writes.length,0);
 assert.equal(await r.flush(),true);assert.equal(f.values.get(LEGACY_COMPANION_KEY),raw);assert.deepEqual(f.locks.requests,[LEGACY_COMPANION_KEY,COMPANION_KEY]);assert.equal(f.writes.length,1);assert.deepEqual(JSON.parse(f.writes[0][1]),{version:2,legacyImportDone:true,entries:r.entries});assert.equal(f.values.get('mushi-journal-v2'),'never touched');
 const reloaded=make(f);assert.equal(reloaded.saved,true);assert.deepEqual(reloaded.entries,r.entries);await reloaded.flush();assert.equal(f.writes.length,1);
 const replacement=reloaded.replace(legacy().id,capture('rhino'));assert.equal(replacement.ok,true);assert.equal(replacement.replacedEntry.sizePermille,null);assert.equal(replacement.replacedEntry.capturedAt,100);assert.equal(replacement.entry.sizePermille,1100);assert.equal(await reloaded.flush(),true);assert.equal(f.values.get(LEGACY_COMPANION_KEY),raw);assert.equal(make(f).entries[0].originKind,'expedition');
});

test('valid new key wins without reading old key; later old-tab captures never resurrect a released or replaced v2 individual',async()=>{
 const current=newPayload([]),f=fixture(oldPayload([legacy()]),current),r=make(f);assert.deepEqual(r.entries,[]);assert.deepEqual(f.reads,[COMPANION_KEY]);assert.equal(r.saved,true);
 f.values.set(LEGACY_COMPANION_KEY,oldPayload([legacy(),legacy('stag')]));assert.deepEqual(make(f).entries,[]);r.add(capture());await r.flush();const old=f.values.get(LEGACY_COMPANION_KEY);r.release(capture().originEncounterId);await r.flush();assert.deepEqual(make(f).entries,[]);assert.equal(f.values.get(LEGACY_COMPANION_KEY),old);
 assert.ok(f.locks.requests.every(key=>key===COMPANION_KEY));
});

test('corrupt/future/unknown-field/duplicate new data never falls back to valid legacy or overwrites original bytes',async()=>{
 const entry=migrated(legacy());
 for(const raw of ['{','',JSON.stringify({version:3,legacyImportDone:true,entries:[entry]}),JSON.stringify({version:2,legacyImportDone:false,entries:[entry]}),JSON.stringify({version:2,legacyImportDone:true,entries:[entry],extra:'preserve'}),newPayload([entry,entry]),newPayload([{...entry,sizePermille:1000}]),newPayload([{...entry,extra:'preserve'}]),'x'.repeat(16385)]){
  const f=fixture(oldPayload([legacy('stag')]),raw),r=make(f);assert.equal(r.saved,false);assert.equal(r.reason,'invalid-data');assert.deepEqual(f.reads,[COMPANION_KEY]);assert.equal(r.entries.some(e=>e.species==='stag'),false);r.add(capture());assert.equal(await r.flush(),false);assert.equal(f.values.get(COMPANION_KEY),raw);assert.equal(f.values.get(LEGACY_COMPANION_KEY),oldPayload([legacy('stag')]));assert.equal(f.writes.length,0);
 }
});

test('invalid legacy is preview-only, missing locks never writes migration, and no size is invented for readable old entries',async()=>{
 for(const raw of ['{',JSON.stringify({version:2,entries:[legacy()]}),JSON.stringify({version:1,entries:[legacy()],extra:'keep'}),oldPayload([legacy(),legacy()]),oldPayload([{...legacy(),extra:'keep'}]),' '.repeat(8193)]){
  const f=fixture(raw),r=make(f);assert.equal(r.reason,'invalid-data');for(const entry of r.entries)assert.equal(entry.sizePermille,null);r.add(capture());assert.equal(await r.flush(),false);assert.equal(f.values.has(COMPANION_KEY),false);assert.equal(f.values.get(LEGACY_COMPANION_KEY),raw);assert.equal(f.writes.length,0);
 }
 for(const raw of [null,oldPayload([legacy()])]){
  const f=fixture(raw),r=createCompanionRoster(f.storage,{now:f.now,locks:null});assert.equal(r.reason,'missing-locks');assert.equal(r.pending,false);assert.equal(r.add(capture()).ok,true);assert.equal(await r.flush(),false);assert.equal(f.writes.length,0);assert.equal(f.values.has(COMPANION_KEY),false);assert.equal(f.values.get(LEGACY_COMPANION_KEY)??null,raw);
 }
});

test('migration quota failure retains legacy and session edits; successful retry writes one combined payload and marker',async()=>{
 const raw=oldPayload([legacy()]),f=fixture(raw);f.failWrite=true;const r=make(f);r.add(capture());assert.equal(await r.flush(),false);assert.equal(r.reason,'storage-error');assert.equal(r.entries.length,2);assert.equal(f.values.get(LEGACY_COMPANION_KEY),raw);assert.equal(f.values.has(COMPANION_KEY),false);
 f.failWrite=false;assert.equal(await r.flush(),true);assert.equal(f.writes.length,1);assert.equal(r.entries.length,2);assert.equal(JSON.parse(f.values.get(COMPANION_KEY)).legacyImportDone,true);assert.equal(f.values.get(LEGACY_COMPANION_KEY),raw);
});

test('competing migrations and changed v1/new bytes become permanent read-only conflicts, never last-writer-wins',async()=>{
 const f=fixture(),a=make(f),b=make(f);a.add(capture());assert.equal(await a.flush(),true);assert.equal(await b.flush(),false);const winner=f.values.get(COMPANION_KEY);assert.equal(b.reason,'conflict');assert.deepEqual(b.entries,[migrated(legacy())]);assert.equal(await b.flush(),false);assert.equal(f.values.get(COMPANION_KEY),winner);assert.equal(f.writes.length,1);
 const changed=fixture(),r=make(changed);const newer=oldPayload([legacy(),legacy('stag')]);changed.values.set(LEGACY_COMPANION_KEY,newer);assert.equal(await r.flush(),false);assert.equal(r.reason,'conflict');assert.equal(changed.values.has(COMPANION_KEY),false);assert.equal(changed.values.get(LEGACY_COMPANION_KEY),newer);assert.equal(await r.flush(),false);
 const fresh=fixture(),q=make(fresh),other=newPayload([]);fresh.values.set(COMPANION_KEY,other);assert.equal(await q.flush(),false);assert.equal(q.reason,'conflict');assert.equal(fresh.values.get(COMPANION_KEY),other);assert.equal(fresh.writes.length,0);
});

test('read failures do not imply empty data: recovery preserves discovered stores and can adopt them only before session edits',async()=>{
 for(const existing of ['old','new','empty']){
  const f=fixture(existing==='old'?oldPayload([legacy()]):null,existing==='new'?newPayload([migrated(legacy())]):null);f.failRead=true;const r=make(f);assert.equal(r.reason,'storage-unavailable');r.add(capture());assert.equal(await r.flush(),false);assert.equal(r.reason,'storage-unavailable');const originals=new Map(f.values);f.failRead=false;
  assert.equal(await r.flush(),existing==='empty');assert.equal(r.entries[0].species,'metallifer');if(existing!=='empty'){assert.equal(r.reason,'conflict');assert.deepEqual(f.values,originals);assert.equal(f.writes.length,0);}
 }
 const f=fixture();f.failRead=true;const r=make(f);f.failRead=false;assert.equal(await r.flush(),true);assert.deepEqual(r.entries,[migrated(legacy())]);assert.equal(f.writes.length,1);
 const invalid=fixture('{');invalid.failRead=true;const q=make(invalid);invalid.failRead=false;assert.equal(await q.flush(),false);assert.equal(q.reason,'invalid-data');assert.equal(invalid.writes.length,0);await tick();
});
