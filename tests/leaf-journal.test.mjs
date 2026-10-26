/** CPU/Map-only journal compatibility. No real browser storage is accessed. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createJournal,JOURNAL_KEY,JOURNAL_VERSION,NOTE_LIMIT} from '../src/journal.js';
import {createTestLocks} from './fixtures/journal-locks.mjs';

const oldIds=['butterfly','dragonfly','cicada','morpho','grasshopper','hercules'];
const six=oldIds.map((species,i)=>({species,firstSeen:10+i,lastSeen:20+i,location:'以前の区画',x:i,z:-i-1,note:`memo-${species}`}));
function fixture(){
 const legacy=JSON.stringify({version:1,entries:six}),data=new Map([[JOURNAL_KEY,JSON.stringify({version:2,legacyImportDone:true,entries:six})],['mushi-journal-v1',legacy]]);
 const locks=createTestLocks();let writes=0;
 const storage={getItem:key=>data.get(key)??null,setItem(key,value){assert.equal(key,JOURNAL_KEY);writes++;data.set(key,value);}};
 return {data,storage,locks,legacy,now:()=>100,get writes(){return writes;}};
}
// The runtime change is ONLY the allowlist addition. Reuse the unchanged v2
// algorithm with the pre-leaf six-species allowlist to emulate a 0.2.8 tab.
// No private git revision or duplicate persistence implementation is required.
const source=await readFile(new URL('../src/journal.js',import.meta.url),'utf8');
const allowlist=/const speciesIds = new Set\(\[[^\n]+\]\);/g;
assert.equal([...source.matchAll(allowlist)].length,1);
const oldSource=source.replace(allowlist,`const speciesIds = new Set([${oldIds.map(id=>`'${id}'`).join(', ')}]);`);
const {createJournal:createOldJournal}=await import('data:text/javascript;base64,'+Buffer.from(oldSource).toString('base64'));

test('leaf capture adds seventh optional memo without changing v2 protocol or earlier six records',async()=>{
 const f=fixture(),j=createJournal(f.storage,f);
 assert.equal(JOURNAL_KEY,'mushi-journal-v2');assert.equal(JOURNAL_VERSION,2);
 assert.equal(j.setNote('leafinsect','not encountered'),null);
 const entry=j.record({species:'leafinsect',location:'林の観察枝',x:2,z:3});
 assert.equal(entry.note,'');
 const note='<葉> ゆっくり揺れる & j';j.setNote('leafinsect',note);
 assert.equal(await j.flush(),true);
 assert.deepEqual(j.entries.slice(0,6),six);assert.equal(j.entries.length,7);
 assert.equal(createJournal(f.storage,f).entries[6].note,note);
 assert.equal(f.data.get('mushi-journal-v1'),f.legacy);
 assert.equal(j.setNote('leafinsect','葉'.repeat(600)).note,'葉'.repeat(NOTE_LIMIT));
 j.setNote('leafinsect','');await j.flush();
 assert.equal(createJournal(f.storage,f).entries[6].note,'');
 assert.deepEqual(JSON.parse(f.data.get(JOURNAL_KEY)),{version:2,legacyImportDone:true,entries:j.entries});
});

test('old six-species tabs cannot overwrite a seven-species v2 journal before or after reload',async()=>{
 const f=fixture(),oldOpenTab=createOldJournal(f.storage,f),current=createJournal(f.storage,f);
 current.record({species:'leafinsect',location:'観察枝',x:1,z:2});current.setNote('leafinsect','葉の形のメモ');await current.flush();
 const protectedRaw=f.data.get(JOURNAL_KEY),writes=f.writes;
 oldOpenTab.setNote('butterfly','old tab edit');assert.equal(await oldOpenTab.flush(),false);
 assert.equal(f.data.get(JOURNAL_KEY),protectedRaw);assert.equal(f.writes,writes);
 const oldReloaded=createOldJournal(f.storage,f);
 assert.equal(oldReloaded.saved,false);assert.equal(oldReloaded.entries.length,6,'read-only preview remains usable');
 oldReloaded.setNote('hercules','unknown species must not disappear');assert.equal(await oldReloaded.flush(),false);
 assert.equal(f.data.get(JOURNAL_KEY),protectedRaw);assert.equal(f.writes,writes);
 const reloaded=createJournal(f.storage,f);assert.equal(reloaded.entries.length,7);assert.equal(reloaded.entries[6].note,'葉の形のメモ');
 assert.deepEqual(reloaded.entries.slice(0,6),six);assert.equal(f.data.get('mushi-journal-v1'),f.legacy);
});
