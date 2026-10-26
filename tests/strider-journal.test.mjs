/** Map-only persistence compatibility; does not access user/browser storage. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createJournal,JOURNAL_KEY,JOURNAL_VERSION} from '../src/journal.js';
import {createTestLocks} from './fixtures/journal-locks.mjs';
const ids=['butterfly','dragonfly','cicada','morpho','grasshopper','hercules','leafinsect'];
const seven=ids.map((species,i)=>({species,firstSeen:10+i,lastSeen:20+i,location:'以前の場所',x:i,z:-i-1,note:`memo-${species}`}));
const source=await readFile(new URL('../src/journal.js',import.meta.url),'utf8');
const list="'leafinsect', 'waterstrider'";assert.equal(source.split(list).length,2);
// Only the allowlist changes in this feature; reconstruct the prior seven-species
// client with the same unchanged v2 algorithm, without a private git dependency.
const {createJournal:createOld}=await import('data:text/javascript;base64,'+Buffer.from(source.replace(list,"'leafinsect'")).toString('base64'));
test('eighth encounter persists with prior seven intact; old open/reloaded clients cannot overwrite it',async()=>{
 const legacy=JSON.stringify({version:1,entries:seven});
 const data=new Map([[JOURNAL_KEY,JSON.stringify({version:2,legacyImportDone:true,entries:seven})],['mushi-journal-v1',legacy]]);
 let writes=0;const storage={getItem:k=>data.get(k)??null,setItem(k,v){assert.equal(k,JOURNAL_KEY);writes++;data.set(k,v);}};
 const options={locks:createTestLocks(),now:()=>100},oldTab=createOld(storage,options),journal=createJournal(storage,options);
 assert.equal(JOURNAL_KEY,'mushi-journal-v2');assert.equal(JOURNAL_VERSION,2);
 assert.equal(journal.setNote('waterstrider','未発見'),null);
 assert.equal(journal.record({species:'waterstrider',location:'水辺の草むら',x:20,z:-15.9}).note,'');
 const note='<水面> 中脚でこいだ j';journal.setNote('waterstrider',note);assert.equal(await journal.flush(),true);
 assert.deepEqual(journal.entries.slice(0,7),seven);assert.equal(journal.entries.length,8);
 const expected=data.get(JOURNAL_KEY),count=writes;
 oldTab.setNote('leafinsect','old open tab');assert.equal(await oldTab.flush(),false);
 const oldReloaded=createOld(storage,options);assert.equal(oldReloaded.saved,false);assert.equal(oldReloaded.entries.length,7);
 oldReloaded.setNote('butterfly','old reload');assert.equal(await oldReloaded.flush(),false);
 assert.equal(data.get(JOURNAL_KEY),expected);assert.equal(writes,count);assert.equal(data.get('mushi-journal-v1'),legacy);
 const restored=createJournal(storage,options);assert.equal(restored.entries[7].note,note);assert.deepEqual(restored.entries.slice(0,7),seven);
 restored.setNote('waterstrider','');await restored.flush();assert.equal(createJournal(storage,options).entries[7].note,'','memo remains optional');
});
