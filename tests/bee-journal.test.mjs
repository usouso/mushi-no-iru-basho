/** Map-only v2 compatibility; no user or browser storage access. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createJournal,JOURNAL_KEY,JOURNAL_VERSION} from '../src/journal.js';
import {createTestLocks} from './fixtures/journal-locks.mjs';
const oldIds=['butterfly','dragonfly','cicada','morpho','grasshopper','hercules','leafinsect','waterstrider','leafcutterant','firefly','dungbeetle','divingbeetle','mantis','ladybird','rhino','stag'];
const sixteen=oldIds.map((species,i)=>({species,firstSeen:10+i,lastSeen:20+i,location:'以前の場所',x:i,z:-i-1,note:`memo-${species}`}));
const source=await readFile(new URL('../src/journal.js',import.meta.url),'utf8');
const allowlist=/const speciesIds = new Set\(\[[^\n]*\]\);/;assert.equal(source.match(new RegExp(allowlist.source,'g'))?.length,1);
// Explicitly pin the old sixteen IDs; do not accidentally admit future species.
const oldSource=source.replace(allowlist,`const speciesIds = new Set(${JSON.stringify(oldIds)});`);
const {createJournal:createOld}=await import('data:text/javascript;base64,'+Buffer.from(oldSource).toString('base64'));
test('new client saves existing sixteen records then bee memo; old sixteen-species clients cannot erase seventeenth entry',async()=>{
 const legacy=JSON.stringify({version:1,entries:sixteen}),values=new Map([['mushi-journal-v1',legacy],[JOURNAL_KEY,JSON.stringify({version:2,legacyImportDone:true,entries:sixteen})]]);
 let writes=0;const storage={getItem:k=>values.get(k)??null,setItem(k,v){assert.equal(k,'mushi-journal-v2');writes++;values.set(k,v);}},options={locks:createTestLocks(),now:()=>100};
 const current=createJournal(storage,options);assert.equal(JOURNAL_VERSION,2);assert.equal(JOURNAL_KEY,'mushi-journal-v2');
 assert.deepEqual(current.entries,sixteen);current.setNote('waterstrider','新clientでも既存メモ保存');assert.equal(await current.flush(),true);
 const previous=current.entries;assert.equal(createJournal(storage,options).entries.length,16);
 const oldOpen=createOld(storage,options);assert.equal(oldOpen.saved,true);
 assert.equal(current.setNote('bee','未発見'),null);
 assert.equal(current.record({species:'bee',location:'温帯の草地・西の花群',x:2,z:-1}).note,'');
 current.setNote('bee','<後脚の花粉籠> の記録 j');assert.equal(await current.flush(),true);
 assert.deepEqual(current.entries.slice(0,16),previous);assert.equal(current.entries.length,17);
 const raw=values.get(JOURNAL_KEY),count=writes;
 oldOpen.setNote('butterfly','old tab');assert.equal(await oldOpen.flush(),false);
 const oldReload=createOld(storage,options);assert.equal(oldReload.saved,false);assert.equal(oldReload.entries.length,16);
 oldReload.setNote('waterstrider','old reload');assert.equal(await oldReload.flush(),false);
 assert.equal(writes,count);assert.equal(values.get(JOURNAL_KEY),raw);assert.equal(values.get('mushi-journal-v1'),legacy);
 const fresh=createJournal(storage,options);assert.deepEqual(fresh.entries,current.entries);fresh.setNote('bee','');await fresh.flush();assert.equal(createJournal(storage,options).entries[16].note,'');
});
