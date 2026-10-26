/** Storage Maps and explicit Web Locks doubles only; not browser storage/device QA. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createJournal,loadJournal,saveJournal,JOURNAL_KEY,LEGACY_JOURNAL_KEY,JOURNAL_VERSION} from '../src/journal.js';
import {createTestLocks,createHeldLocks,flushMicrotasks} from './fixtures/journal-locks.mjs';
const entry=(species='butterfly',note='残すメモ')=>({species,firstSeen:100,lastSeen:200,location:'草原',x:1,z:2,note});
const legacy=entries=>JSON.stringify({version:1,entries});
const modern=entries=>JSON.stringify({version:2,legacyImportDone:true,entries});
function store(initial={}){const values=new Map(Object.entries(initial)),writes=[];let failRead=false,failWrite=false;return {values,writes,get failRead(){return failRead;},set failRead(v){failRead=v;},set failWrite(v){failWrite=v;},storage:{getItem(key){if(failRead)throw Error('read blocked');return values.get(key)??null;},setItem(key,value){if(failWrite)throw Error('quota');writes.push([key,value]);values.set(key,value);}},locks:createTestLocks(),now:()=>300};}
const create=f=>createJournal(f.storage,f);
test('lossless v1 migration preserves the old bytes and marks success atomically inside the v2 payload',async()=>{
 assert.equal(JOURNAL_KEY,'mushi-journal-v2');assert.equal(LEGACY_JOURNAL_KEY,'mushi-journal-v1');assert.equal(JOURNAL_VERSION,2);
 const raw=legacy([entry(),entry('hercules','新種の古いメモ')]),f=store({[LEGACY_JOURNAL_KEY]:raw});assert.deepEqual(loadJournal(f.storage).entries,[entry(),entry('hercules','新種の古いメモ')]);assert.equal(f.writes.length,0,'loadJournal is read-only');
 const j=create(f);assert.equal(j.saved,false);assert.equal(j.pending,true);assert.equal(f.writes.length,0);assert.equal(await j.flush(),true);assert.equal(j.pending,false);assert.equal(f.values.get(LEGACY_JOURNAL_KEY),raw);assert.deepEqual(JSON.parse(f.values.get(JOURNAL_KEY)),{version:2,legacyImportDone:true,entries:j.entries});assert.equal(f.writes.length,1);const reloaded=create(f);await reloaded.flush();assert.equal(f.writes.length,1);
});
test('existing v2 wins; later old-client edits stay only in v1 and never replace newer notes or species',async()=>{
 const newRaw=modern([entry('hercules','v2独自メモ')]),f=store({[JOURNAL_KEY]:newRaw,[LEGACY_JOURNAL_KEY]:legacy([entry()])}),j=create(f);assert.equal(j.saved,true);assert.equal(j.pending,false);assert.equal(f.writes.length,0);f.values.set(LEGACY_JOURNAL_KEY,legacy([entry('dragonfly','旧版追記')]));j.record({species:'morpho',location:'林'});await j.flush();assert.equal(j.entries[0].note,'v2独自メモ');assert.equal(j.entries.some(e=>e.species==='dragonfly'),false);const oldRaw=f.values.get(LEGACY_JOURNAL_KEY);assert.deepEqual(create(f).entries,j.entries);assert.equal(f.values.get(LEGACY_JOURNAL_KEY),oldRaw);
});
test('corrupt, unknown, oversized or lossy raw payloads are never overwritten, nor bypassed via legacy fallback',async()=>{
 const invalid=['{','null',JSON.stringify({version:3,entries:[]}),modern([entry('unknown')]),modern([entry(),entry()]),modern([{...entry(),note:'x'.repeat(501)}]),JSON.stringify({version:2,legacyImportDone:true,entries:[entry()],future:'data'}),'x'.repeat(20001)];
 for(const key of [JOURNAL_KEY,LEGACY_JOURNAL_KEY])for(const raw0 of invalid){const raw=key===LEGACY_JOURNAL_KEY?raw0.replace('"version":2','"version":1'):raw0;const f=store({[LEGACY_JOURNAL_KEY]:legacy([entry('cicada')]),[key]:raw}),j=create(f);j.record({species:'morpho',location:'memory only'});j.setNote('morpho','守る');assert.equal(await j.flush(),false);assert.equal(f.values.get(key),raw);assert.equal(f.writes.length,0);assert.equal(j.entries.find(e=>e.species==='morpho').note,'守る');if(key===JOURNAL_KEY)assert.equal(j.entries.some(e=>e.species==='cicada'),false);}
});
test('missing Web Locks is explicit memory-only, even with valid persisted v2 or valid legacy data',async()=>{
 for(const raw of [null,modern([entry()]),legacy([entry()])]){const key=raw?.includes('"version":1')?LEGACY_JOURNAL_KEY:JOURNAL_KEY,f=store(raw?{[key]:raw}:{}),j=createJournal(f.storage,{locks:null,now:f.now});j.record({species:'hercules'});assert.equal(j.saved,false);assert.equal(await j.flush(),false);assert.equal(f.writes.length,0);assert.equal(j.entries.some(e=>e.species==='hercules'),true);assert.equal(await saveJournal(j.entries,f.storage,{locks:null}),false);}
});
test('quota/lock rejection cannot install a success marker; flush retries atomically with all local notes and safe status notifications',async()=>{
 const raw=legacy([entry()]),f=store({[LEGACY_JOURNAL_KEY]:raw});f.failWrite=true;const j=create(f),statuses=[];const off=j.subscribe(s=>{statuses.push({...s});s.saved='external';});j.subscribe(()=>{throw Error('listener must not defeat saving');});j.setNote('butterfly','編集保持');assert.equal(await j.flush(),false);assert.equal(f.values.has(JOURNAL_KEY),false);assert.equal(j.pending,false);assert.equal(j.saved,false);f.failWrite=false;assert.equal(await j.flush(),true);assert.equal(f.values.get(LEGACY_JOURNAL_KEY),raw);assert.equal(JSON.parse(f.values.get(JOURNAL_KEY)).legacyImportDone,true);assert.equal(j.entries[0].note,'編集保持');assert.ok(statuses.some(s=>s.pending&&!s.saved));assert.deepEqual(statuses.at(-1),{saved:true,pending:false});off();const n=statuses.length;j.setNote('butterfly','後の編集');await j.flush();assert.equal(statuses.length,n);
 const denied=store();let reject=true;denied.locks={request:async(_n,_o,callback)=>{if(reject)throw Error('lock unavailable');return callback();}};const d=create(denied);d.record({species:'cicada'});assert.equal(await d.flush(),false);reject=false;assert.equal(await d.flush(),true);
});
test('failed initial read is not assumed empty: recover only into confirmed empty storage, never overwrite newly found data',async()=>{
 for(const existing of [false,true]){const f=store();f.failRead=true;const j=create(f);j.record({species:'morpho'});j.setNote('morpho','未保存');assert.equal(await j.flush(),false);f.failRead=false;if(existing)f.values.set(JOURNAL_KEY,modern([entry('cicada','別タブ')]));const before=f.values.get(JOURNAL_KEY);assert.equal(await j.flush(),!existing);if(existing){assert.equal(f.values.get(JOURNAL_KEY),before);assert.equal(j.entries[0].note,'未保存');}else assert.equal(JSON.parse(f.values.get(JOURNAL_KEY)).entries[0].note,'未保存');}
});
test('two queued migrations serialize: untouched follower may adopt valid v2, edited follower cannot overwrite the winner',async()=>{
 for(const edited of [false,true]){const f=store({[LEGACY_JOURNAL_KEY]:legacy([entry()])});f.locks=createHeldLocks();const a=create(f),b=create(f);if(edited)b.setNote('butterfly','未保存の別編集');await flushMicrotasks();assert.equal(f.locks.requests.length,2);await f.locks.releaseNext();assert.equal(await a.flush(),true);const winning=f.values.get(JOURNAL_KEY);await f.locks.releaseNext();assert.equal(await b.flush(),!edited);assert.equal(f.values.get(JOURNAL_KEY),winning);assert.equal(f.writes.length,1);assert.equal(b.entries[0].note,edited?'未保存の別編集':'残すメモ');}
});
test('concurrent v2 editors fail closed on raw conflict and retry cannot silently advance the losing baseline',async()=>{
 const f=store({[JOURNAL_KEY]:modern([entry()])});f.locks=createHeldLocks();const a=create(f),b=create(f);a.setNote('butterfly','A');b.setNote('butterfly','B');await flushMicrotasks();await f.locks.releaseNext();await a.flush();const winner=f.values.get(JOURNAL_KEY);await f.locks.releaseNext();await flushMicrotasks();assert.equal(b.saved,false);assert.equal(b.entries[0].note,'B');assert.equal(f.values.get(JOURNAL_KEY),winner);const retry=b.flush();await flushMicrotasks();await f.locks.releaseNext();assert.equal(await retry,false);assert.equal(f.values.get(JOURNAL_KEY),winner);
});
test('changed legacy while waiting is adopted only by an untouched migration instance; dirty local edits remain memory-only',async()=>{
 for(const dirty of [false,true]){const f=store({[LEGACY_JOURNAL_KEY]:legacy([entry()])});f.locks=createHeldLocks();const j=create(f);if(dirty)j.setNote('butterfly','自分の未保存編集');await flushMicrotasks();const changed=legacy([entry('dragonfly','旧版が更新')]);f.values.set(LEGACY_JOURNAL_KEY,changed);await f.locks.releaseNext();await flushMicrotasks();assert.equal(j.saved,!dirty);assert.equal(f.values.has(JOURNAL_KEY),!dirty);assert.equal(f.values.get(LEGACY_JOURNAL_KEY),changed);assert.equal(j.entries[0].species,dirty?'butterfly':'dragonfly');assert.equal(j.entries[0].note,dirty?'自分の未保存編集':'旧版が更新');}
});
test('explicit saveJournal is asynchronous, exclusive, preserves old species, and refuses destructive or conflicting snapshots',async()=>{
 const f=store({[JOURNAL_KEY]:modern([entry()])});f.locks=createHeldLocks();const saving=saveJournal([entry('butterfly','編集'),entry('hercules')],f.storage,{locks:f.locks});assert.equal(typeof saving.then,'function');assert.equal(f.writes.length,0);await flushMicrotasks();await f.locks.releaseNext();assert.equal(await saving,true);assert.equal(await saveJournal([entry('hercules')],f.storage,{locks:f.locks}),false,'no implicit deletion');const competing=saveJournal([entry('butterfly','上書き'),entry('hercules')],f.storage,{locks:f.locks});await flushMicrotasks();const other=modern([entry('butterfly','他の更新'),entry('hercules')]);f.values.set(JOURNAL_KEY,other);await f.locks.releaseNext();assert.equal(await competing,false);assert.equal(f.values.get(JOURNAL_KEY),other);
});

test('edits at lock-completion microtask boundaries are automatically drained without stale saved notifications',async()=>{
 for(let depth=0;depth<9;depth++){
  const f=store({[JOURNAL_KEY]:modern([entry()])}),write=f.storage.setItem;let j,once=false;
  f.storage.setItem=(key,value)=>{write(key,value);if(!once){once=true;const later=n=>queueMicrotask(()=>n?later(n-1):j.setNote('butterfly','最新'+depth));later(depth);}};
  const reports=[];j=create(f);j.subscribe(status=>{if(status.saved)reports.push([JSON.stringify(JSON.parse(f.values.get(JOURNAL_KEY)).entries),JSON.stringify(j.entries)]);});j.setNote('butterfly','第一編集');await j.flush();await flushMicrotasks();await flushMicrotasks();assert.equal(j.pending,false);assert.equal(j.saved,true);assert.ok(reports.every(([stored,memory])=>stored===memory),'no stale saved notification');assert.equal(JSON.parse(f.values.get(JOURNAL_KEY)).entries[0].note,'最新'+depth);
 }
});
