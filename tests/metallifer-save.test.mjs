/** Exact old-client compatibility, Map only; no real browser storage touched. */
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {createJournal,JOURNAL_KEY} from '../src/journal.js';
import {createCompanionRoster,COMPANION_KEY} from '../src/companion-roster.js';
function createTestLocks(){const tails=new Map();return{request(name,options,callback){assert.ok(['mushi-journal-v2','mushi-companions-v1'].includes(name));assert.equal(options.mode,'exclusive');const next=(tails.get(name)||Promise.resolve()).then(callback);tails.set(name,next.catch(()=>{}));return next;}};}
const oldIds=['butterfly','dragonfly','cicada','morpho','grasshopper','hercules','leafinsect','waterstrider','leafcutterant','firefly','dungbeetle','divingbeetle','mantis','ladybird','rhino','stag','bee','swallowtail','jewel','longhorn'];
const loadSource=source=>import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const source=fs.readFileSync(new URL('../src/journal.js',import.meta.url),'utf8'),oldSource=source.replace(/const speciesIds = new Set\(\[[^\n]*\]\);/,`const speciesIds = new Set(${JSON.stringify(oldIds)});`);
const {createJournal:createOldJournal}=await loadSource(oldSource);
const rosterSource=fs.readFileSync(new URL('../src/companion-roster.js',import.meta.url),'utf8');
const {createCompanionRoster:createOldRoster}=await loadSource(rosterSource.replace(", 'metallifer'",'').replace(",metallifer:'understory'",''));
function fixture(entries){const values=new Map(entries),writes=[];return{values,writes,storage:{getItem:k=>values.get(k)??null,setItem(k,v){writes.push([k,v]);values.set(k,v);}},options:{locks:createTestLocks(),now:()=>1000}};}
test('twenty existing journal records survive the new species; old clients cannot erase the twenty-first',async()=>{
 const old=oldIds.map((species,i)=>({species,firstSeen:10+i,lastSeen:50+i,location:'旧記録',x:i,z:-i-1,note:'memo-'+species})),raw=JSON.stringify({version:2,legacyImportDone:true,entries:old}),f=fixture([[JOURNAL_KEY,raw],['mushi-journal-v1','old raw bytes']]);
 const current=createJournal(f.storage,f.options),older=createOldJournal(f.storage,f.options);assert.deepEqual(current.entries,old);assert.equal(current.saved,true);
 const found=current.record({species:'metallifer',location:'東南アジア林・低い観察枝',x:-2,z:7});assert.ok(found);current.setNote('metallifer','金褐色の長い顎 j');assert.equal(await current.flush(),true);assert.deepEqual(current.entries.slice(0,20),old);assert.equal(current.entries.length,21);
 const accepted=f.values.get(JOURNAL_KEY),writes=f.writes.length;older.setNote('stag','old-tab');assert.equal(await older.flush(),false);const reloaded=createOldJournal(f.storage,f.options);assert.equal(reloaded.saved,false);reloaded.setNote('stag','old-reload');assert.equal(await reloaded.flush(),false);assert.equal(f.writes.length,writes);assert.equal(f.values.get(JOURNAL_KEY),accepted);assert.equal(f.values.get('mushi-journal-v1'),'old raw bytes');assert.deepEqual(createJournal(f.storage,f.options).entries,current.entries);
});
test('old three companions are preserved; the additive fourth species is read-only to old clients, with no key migration',async()=>{
 const old=[['hercules','tropical','insect-5'],['rhino','night','insect-4'],['stag','night','insect-5']].map(([species,originHabitat,originIndividualId])=>({id:originHabitat+'/'+originIndividualId,species,originHabitat,originIndividualId,capturedAt:100}));
 const raw=JSON.stringify({version:1,entries:old}),f=fixture([[COMPANION_KEY,raw],[JOURNAL_KEY,'journal untouched']]),current=createCompanionRoster(f.storage,f.options),older=createOldRoster(f.storage,f.options);assert.deepEqual(current.entries,old);assert.equal(current.saved,true);assert.equal(f.writes.length,0);
 assert.equal(current.add({species:'metallifer',originHabitat:'understory',originIndividualId:'insect-4'}).ok,true);assert.equal(await current.flush(),true);assert.deepEqual(current.entries.slice(0,3),old);assert.equal(current.entries.length,4);
 const accepted=f.values.get(COMPANION_KEY),writes=f.writes.length;older.release(old[0].id);assert.equal(await older.flush(),false);const reloaded=createOldRoster(f.storage,f.options);assert.equal(reloaded.saved,false);assert.deepEqual(reloaded.entries,old);reloaded.release(old[1].id);assert.equal(await reloaded.flush(),false);assert.equal(f.writes.length,writes);assert.equal(f.values.get(COMPANION_KEY),accepted);assert.equal(f.values.get(JOURNAL_KEY),'journal untouched');assert.deepEqual(createCompanionRoster(f.storage,f.options).entries,current.entries);
});
