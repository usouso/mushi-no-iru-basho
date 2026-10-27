/** Map storage and exclusive queue doubles only; no browser durability/playtest claim. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createCompanionRoster,COMPANION_KEY,COMPANION_VERSION,LEGACY_COMPANION_KEY,COMPANION_SPECIES,isCompanionSpecies} from '../src/individual-roster.js';
import {COMPANION_SPECIES as V1_SPECIES} from '../src/companion-roster.js';
import {createJournal,JOURNAL_KEY,JOURNAL_VERSION,LEGACY_JOURNAL_KEY,NOTE_LIMIT} from '../src/journal.js';
import {EXPEDITION_KEY,EXPEDITION_SLOTS} from '../src/expedition.js';
import {createBattle,advanceBattle,cancelBattle} from '../src/beetle-battle.js';

const giant={species:'giantstag',originHabitat:'night',originIndividualId:'insect-6',originKind:'legacy',originEncounterId:null,sizePermille:null,measureVersion:null};
const entry=(capture,capturedAt=100)=>({id:capture.originKind==='legacy'?`${capture.originHabitat}/${capture.originIndividualId}`:capture.originEncounterId,...capture,capturedAt});
const oldRoster=EXPEDITION_SLOTS.slice(0,5).filter(s=>s.populationSlotId!=='hercules-b').map((s,i)=>entry({species:s.species,originHabitat:s.habitat,originIndividualId:s.runtimeSlotId,originKind:'expedition',originEncounterId:`g1-1234abcd-o1-${s.habitat}-${s.populationSlotId}`,sizePermille:1050+i,measureVersion:1},100+i));
oldRoster.push(entry({species:'atlas',originHabitat:'understory',originIndividualId:'insect-5',originKind:'legacy',originEncounterId:null,sizePermille:null,measureVersion:null},104));
const oldSpecies=['butterfly','dragonfly','cicada','morpho','grasshopper','hercules','leafinsect','waterstrider','leafcutterant','firefly','dungbeetle','divingbeetle','mantis','ladybird','rhino','stag','bee','swallowtail','jewel','longhorn','metallifer','atlas'];
const oldJournal=oldSpecies.map((species,i)=>({species,firstSeen:100+i,lastSeen:200+i,location:`場所${i}`,x:i,z:-5-i,note:`残すメモ${species}`}));
const modern=entries=>JSON.stringify({version:2,legacyImportDone:true,entries});
function fixture(){
 const values=new Map([[COMPANION_KEY,modern(oldRoster)],[JOURNAL_KEY,modern(oldJournal)],
  [LEGACY_COMPANION_KEY,'  {"version":1,"entries":[]}\n'],[LEGACY_JOURNAL_KEY,' {"version":1,"entries":[]}\n'],[EXPEDITION_KEY,'unchanged five-slot raw']]);
 const writes=[],tails=new Map(),active=new Set();
 const f={values,writes,failWrite:false,now:()=>1000,locks:{request(key,options,fn){
  assert.equal(options.mode,'exclusive');
  const task=(tails.get(key)||Promise.resolve()).then(async()=>{assert.equal(active.has(key),false);active.add(key);try{return await fn();}finally{active.delete(key);}});
  tails.set(key,task.catch(()=>{}));return task;
 }},storage:{getItem:key=>values.get(key)??null,setItem(key,value){
  assert.ok([COMPANION_KEY,JOURNAL_KEY].includes(key),'only current requested store may be written');
  assert.ok(active.has(key),'writes require the matching exclusive lock');
  if(f.failWrite)throw Error('quota');writes.push(key);values.set(key,value);
 }}};return f;
}
const make=f=>createCompanionRoster(f.storage,f);
const untouched=f=>[LEGACY_COMPANION_KEY,LEGACY_JOURNAL_KEY,EXPEDITION_KEY].map(key=>[key,f.values.get(key)]);

test('sixth companion is exactly fixed night/insect-6, preserves five prior entries, and releases only explicitly',async()=>{
 const f=fixture(),raw=f.values.get(COMPANION_KEY),protectedRaw=untouched(f),journalRaw=f.values.get(JOURNAL_KEY),r=make(f);
 assert.equal(COMPANION_KEY,'mushi-companions-v2');assert.equal(COMPANION_VERSION,2);
 assert.deepEqual(COMPANION_SPECIES,['hercules','rhino','stag','metallifer','atlas','giantstag','elephant','goliath','fivehorn','miyama','euchirus','manticora','rainbowstag','europestag']);
 assert.deepEqual(V1_SPECIES,['hercules','rhino','stag','metallifer']);assert.equal(isCompanionSpecies('giantstag'),true);
 assert.deepEqual(r.entries,oldRoster);assert.equal(await r.flush(),true);assert.equal(f.writes.length,0);assert.equal(f.values.get(COMPANION_KEY),raw);
 const result=r.add(giant);assert.deepEqual(result,{ok:true,entry:entry(giant,1000)});assert.equal(r.entries.length,6);
 assert.deepEqual(r.add(giant),{ok:false,reason:'already-owned'});assert.deepEqual(r.replace(result.entry.id,giant),{ok:false,reason:'same-individual'});
 assert.equal(await r.flush(),true);assert.deepEqual(make(f).entries,[...oldRoster,entry(giant,1000)]);
 const before=f.values.get(COMPANION_KEY),cancelled=cancelBattle(advanceBattle(createBattle({playerSpecies:'rhino',opponentSpecies:'stag',seed:1}),8));
 assert.equal(cancelled.phase,'cancelled');assert.equal(f.values.get(COMPANION_KEY),before);assert.deepEqual(r.entries.slice(0,5),oldRoster);
 assert.equal(r.release('night/insect-6').ok,true);assert.equal(await r.flush(),true);assert.deepEqual(make(f).entries,oldRoster);
 assert.deepEqual(r.release('night/insect-6'),{ok:false,reason:'not-owned'});
 assert.deepEqual(untouched(f),protectedRaw);assert.equal(f.values.get(JOURNAL_KEY),journalRaw);
});

test('giantstag is never adopted from v1 and cannot borrow older fixed IDs or any measured encounter',async()=>{
 const f=fixture(),fake={id:'night/insect-6',species:'giantstag',originHabitat:'night',originIndividualId:'insect-6',capturedAt:50};
 const legacyRaw=JSON.stringify({version:1,entries:[fake]});f.values.delete(COMPANION_KEY);f.values.set(LEGACY_COMPANION_KEY,legacyRaw);
 const r=make(f);assert.equal(r.reason,'invalid-data');assert.deepEqual(r.entries,[]);assert.equal(r.add(giant).ok,true);assert.equal(await r.flush(),false);
 assert.equal(f.values.get(LEGACY_COMPANION_KEY),legacyRaw);assert.equal(f.values.has(COMPANION_KEY),false);assert.equal(f.writes.length,0);
 const good=fixture(),q=make(good);
 for(const bad of [{...giant,species:'__proto__'},{...giant,species:'constructor'},
  ...['insect-4','insect-5','insect-7'].map(originIndividualId=>({...giant,originIndividualId})),
  {...giant,originHabitat:'understory'},{...giant,sizePermille:1000},{...giant,measureVersion:1},{...giant,originKind:undefined},
  ...['giantstag','stag','rhino'].map(slot=>({...giant,originKind:'expedition',originEncounterId:`g1-1234abcd-o1-night-${slot}`,sizePermille:1100,measureVersion:1}))]){
  assert.deepEqual(q.add(bad),{ok:false,reason:'invalid-capture'});
 }
 assert.deepEqual(q.entries,oldRoster);assert.equal(good.writes.length,0);
 assert.deepEqual(EXPEDITION_SLOTS.slice(0,5).map(s=>[s.populationSlotId,s.habitat,s.runtimeSlotId]),[
  ['hercules-a','tropical','insect-5'],['hercules-b','tropical','insect-6'],['rhino','night','insect-4'],['stag','night','insect-5'],['metallifer','understory','insect-4']]);
});

test('invalid six-companion payloads remain read-only without overwriting their raw bytes',async()=>{
 const giantEntry=entry(giant);
 for(const raw of ['{',JSON.stringify({version:3,legacyImportDone:true,entries:oldRoster}),modern([...oldRoster,giantEntry,giantEntry]),
  modern([...oldRoster,{...giantEntry,extra:'keep'}]),modern([...oldRoster,{...giantEntry,originIndividualId:'insect-5'}]),modern([...oldRoster,{...giantEntry,sizePermille:1000}])]){
  const f=fixture();f.values.set(COMPANION_KEY,raw);const r=make(f);assert.equal(r.reason,'invalid-data');r.add(giant);r.release('night/insect-6');
  assert.equal(await r.flush(),false);assert.equal(f.values.get(COMPANION_KEY),raw);assert.equal(f.writes.length,0);
 }
});

test('giantstag quota retry and missing-lock or competing-tab failures preserve durable data',async()=>{
 const f=fixture(),raw=f.values.get(COMPANION_KEY),protectedRaw=untouched(f),r=make(f);f.failWrite=true;r.add(giant);
 assert.equal(await r.flush(),false);assert.equal(r.reason,'storage-error');assert.equal(r.entries.length,6);assert.equal(f.values.get(COMPANION_KEY),raw);
 f.failWrite=false;assert.equal(await r.flush(),true);assert.deepEqual(make(f).entries,r.entries);assert.deepEqual(untouched(f),protectedRaw);
 const noLocks=fixture(),n=createCompanionRoster(noLocks.storage,{locks:null,now:noLocks.now});n.add(giant);assert.equal(await n.flush(),false);assert.equal(n.reason,'missing-locks');assert.equal(noLocks.writes.length,0);
 const tabs=fixture(),a=make(tabs),b=make(tabs);a.add(giant);b.release(oldRoster[0].id);
 assert.equal(await a.flush(),true);assert.equal(await b.flush(),false);assert.equal(b.reason,'conflict');const winning=tabs.values.get(COMPANION_KEY);
 b.add(giant);await b.flush();assert.equal(tabs.values.get(COMPANION_KEY),winning);assert.deepEqual(make(tabs).entries,[...oldRoster,entry(giant,1000)]);
});

test('23rd journal entry retains all previous fields and optional notes without rewriting either legacy key',async()=>{
 const f=fixture(),protectedRaw=untouched(f),rosterRaw=f.values.get(COMPANION_KEY),j=createJournal(f.storage,f);
 assert.equal(JOURNAL_KEY,'mushi-journal-v2');assert.equal(JOURNAL_VERSION,2);assert.equal(NOTE_LIMIT,500);
 assert.deepEqual(j.entries,oldJournal);assert.equal(await j.flush(),true);assert.equal(f.writes.length,0);
 assert.equal(j.setNote('giantstag','not caught'),null);
 const capture={species:'giantstag',location:'夜の雑木林',x:14,z:-6};assert.equal(j.record(capture).note,'');
 const literal='<b>大きなあご</b> & 夜の木陰';assert.equal(j.setNote('giantstag',literal).note,literal);assert.equal(await j.flush(),true);
 assert.equal(j.entries.length,23);assert.deepEqual(j.entries.slice(0,22),oldJournal);assert.deepEqual(createJournal(f.storage,f).entries,j.entries);
 assert.equal(j.setNote('giantstag','角'.repeat(600)).note.length,500);assert.equal(await j.flush(),true);
 assert.equal(createJournal(f.storage,f).entries[22].note,'角'.repeat(500));
 assert.equal(j.record({species:'__proto__'}),null);assert.equal(j.record({species:'unknown'}),null);
 assert.equal(j.setNote('giantstag','').note,'');assert.equal(await j.flush(),true);
 assert.deepEqual(untouched(f),protectedRaw);assert.equal(f.values.get(COMPANION_KEY),rosterRaw);
});

test('giantstag journal edits keep quota and locked-conflict safeguards',async()=>{
 const f=fixture(),original=f.values.get(JOURNAL_KEY),j=createJournal(f.storage,f);f.failWrite=true;
 j.record({species:'giantstag',location:'夜の林',x:1,z:2});j.setNote('giantstag','未保存のメモ');
 assert.equal(await j.flush(),false);assert.equal(j.saved,false);assert.equal(j.entries.length,23);assert.equal(f.values.get(JOURNAL_KEY),original);
 f.failWrite=false;assert.equal(await j.flush(),true);assert.deepEqual(createJournal(f.storage,f).entries,j.entries);
 const a=createJournal(f.storage,f),b=createJournal(f.storage,f);a.setNote('giantstag','A');b.setNote('giantstag','B');
 assert.equal(await a.flush(),true);assert.equal(await b.flush(),false);const winning=f.values.get(JOURNAL_KEY);
 assert.equal(await b.flush(),false);assert.equal(f.values.get(JOURNAL_KEY),winning);assert.equal(b.entries[22].note,'B');
});
