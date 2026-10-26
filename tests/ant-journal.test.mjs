/** Map-only v2 compatibility; no user or browser storage access. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createJournal,JOURNAL_KEY,JOURNAL_VERSION} from '../src/journal.js';
import {createTestLocks} from './fixtures/journal-locks.mjs';
const oldIds=['butterfly','dragonfly','cicada','morpho','grasshopper','hercules','leafinsect','waterstrider'];
const eight=oldIds.map((species,i)=>({species,firstSeen:10+i,lastSeen:20+i,location:'以前の場所',x:i,z:-i-1,note:`memo-${species}`}));
const source=await readFile(new URL('../src/journal.js',import.meta.url),'utf8');
const allowlist=/const speciesIds = new Set\(\[[^\n]*\]\);/;assert.equal(source.match(new RegExp(allowlist.source,'g'))?.length,1);
// Explicitly pin the old eight IDs; do not accidentally admit future species.
const oldSource=source.replace(allowlist,`const speciesIds = new Set(${JSON.stringify(oldIds)});`);
const {createJournal:createOld}=await import('data:text/javascript;base64,'+Buffer.from(oldSource).toString('base64'));
test('new client saves existing eight records then ant memo; old eight-species clients cannot erase ninth entry',async()=>{
 const legacy=JSON.stringify({version:1,entries:eight}),values=new Map([['mushi-journal-v1',legacy],[JOURNAL_KEY,JSON.stringify({version:2,legacyImportDone:true,entries:eight})]]);
 let writes=0;const storage={getItem:k=>values.get(k)??null,setItem(k,v){assert.equal(k,'mushi-journal-v2');writes++;values.set(k,v);}},options={locks:createTestLocks(),now:()=>100};
 const current=createJournal(storage,options);assert.equal(JOURNAL_VERSION,2);assert.equal(JOURNAL_KEY,'mushi-journal-v2');
 assert.deepEqual(current.entries,eight);current.setNote('waterstrider','新clientでも既存メモ保存');assert.equal(await current.flush(),true);
 const previous=current.entries;assert.equal(createJournal(storage,options).entries.length,8);
 const oldOpen=createOld(storage,options);assert.equal(oldOpen.saved,true);
 assert.equal(current.setNote('leafcutterant','未発見'),null);
 assert.equal(current.record({species:'leafcutterant',location:'熱帯の落ち葉の道',x:2,z:-1}).note,'');
 current.setNote('leafcutterant','<葉> を運ぶ worker j');assert.equal(await current.flush(),true);
 assert.deepEqual(current.entries.slice(0,8),previous);assert.equal(current.entries.length,9);
 const raw=values.get(JOURNAL_KEY),count=writes;
 oldOpen.setNote('butterfly','old tab');assert.equal(await oldOpen.flush(),false);
 const oldReload=createOld(storage,options);assert.equal(oldReload.saved,false);assert.equal(oldReload.entries.length,8);
 oldReload.setNote('waterstrider','old reload');assert.equal(await oldReload.flush(),false);
 assert.equal(writes,count);assert.equal(values.get(JOURNAL_KEY),raw);assert.equal(values.get('mushi-journal-v1'),legacy);
 const fresh=createJournal(storage,options);assert.deepEqual(fresh.entries,current.entries);fresh.setNote('leafcutterant','');await fresh.flush();assert.equal(createJournal(storage,options).entries[8].note,'');
});
