import {priorExpedition,priorAtlasSupport} from './fixtures/europe-individual-prior.mjs';
/** Isolated Map storage + exclusive lock doubles; no browser storage or external I/O. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {createCompanionRoster,COMPANION_KEY,COMPANION_VERSION,LEGACY_COMPANION_KEY,COMPANION_SPECIES} from '../src/individual-roster.js';
import {COMPANION_SPECIES as V1_SPECIES} from '../src/companion-roster.js';
import {createJournal,loadJournal,JOURNAL_KEY,JOURNAL_VERSION,LEGACY_JOURNAL_KEY,NOTE_LIMIT,JOURNAL_RAW_LIMIT,saveJournal} from '../src/journal.js';
import {createExpedition,EXPEDITION_KEY,LEGACY_EXPEDITION_KEY,EXPEDITION_SLOTS} from '../src/expedition.js';
import {atlasEncounterSupportKey} from '../src/atlas-encounter-layout.js';
const frozen047=await import('data:text/javascript;base64,'+Buffer.from(priorExpedition(fs.readFileSync(new URL('../src/expedition.js',import.meta.url),'utf8'))).toString('base64'));
const capture=(species,originHabitat,originIndividualId)=>({species,originHabitat,originIndividualId,originKind:'legacy',originEncounterId:null,sizePermille:null,measureVersion:null});
const europestag=()=>capture('europestag','europe','insect-1');
const entry=(c,time=100)=>({...c,id:c.originKind==='legacy'?`${c.originHabitat}/${c.originIndividualId}`:c.originEncounterId,capturedAt:time});
const oldRoster=[['hercules','tropical','insect-5','hercules-a'],['rhino','night','insect-4','rhino'],['stag','night','insect-5','stag'],['metallifer','understory','insect-4','metallifer']].map(([species,habitat,id,slot],i)=>entry({...capture(species,habitat,id),originKind:'expedition',originEncounterId:`g1-1234abcd-o1-${habitat}-${slot}`,sizePermille:1050+i,measureVersion:1},100+i));
oldRoster.push(entry({...capture('atlas','understory','insect-5'),originKind:'expedition',originEncounterId:'g3-1234abcd-o3-understory-atlas',sizePermille:1123,measureVersion:1},104),entry({...capture('giantstag','night','insect-6'),originKind:'expedition',originEncounterId:'g2-1234abcd-o2-night-giantstag',sizePermille:1150,measureVersion:1},105),entry(capture('elephant','tropical','insect-11'),106),entry(capture('goliath','forest','insect-1'),107),entry(capture('fivehorn','understory','insect-6'),108),entry(capture('miyama','meadow','insect-30'),109),entry(capture('euchirus','understory','insect-7'),110));
oldRoster.push(entry({...capture('manticora','savanna','insect-2'),originKind:'expedition',originEncounterId:'g4-1234abcd-o4-savanna-manticora',sizePermille:1150,measureVersion:1},111));
oldRoster.push(entry(capture('rainbowstag','australia','insect-1'),112));
const oldSpecies=['butterfly','dragonfly','cicada','morpho','grasshopper','hercules','leafinsect','waterstrider','leafcutterant','firefly','dungbeetle','divingbeetle','mantis','ladybird','rhino','stag','bee','swallowtail','jewel','longhorn','metallifer','atlas','giantstag','elephant','goliath','fivehorn','miyama','euchirus','manticora','rainbowstag'];
const oldJournal=oldSpecies.map((species,i)=>({species,firstSeen:100+i,lastSeen:200+i,location:(`元の場所${i}`).padEnd(120,'葉'),x:i,z:-5-i,note:(`保持 ${species} <b>文字</b>`).padEnd(500,'記')}));
const modern=entries=>JSON.stringify({version:2,legacyImportDone:true,entries});
function fixture(){
 const values=new Map([[COMPANION_KEY,modern(oldRoster)],[JOURNAL_KEY,modern(oldJournal)],...[[LEGACY_COMPANION_KEY,'v1 roster untouched'],[LEGACY_JOURNAL_KEY,'v1 notes untouched'],[EXPEDITION_KEY,'g1/g2/g3/g4 IDs; gen5 eight-slot raw untouched'],[LEGACY_EXPEDITION_KEY,'old five-slot raw untouched']]]),writes=[],tails=new Map(),active=new Set();
 const f={values,writes,quota:false,after:false,failReadback:false,written:false,now:()=>1000,locks:{request(key,opts,fn){assert.equal(opts.mode,'exclusive');const task=(tails.get(key)||Promise.resolve()).then(()=>{assert.ok(!active.has(key));active.add(key);try{return fn();}finally{active.delete(key);}});tails.set(key,task.catch(()=>{}));return task;}},storage:{getItem(k){if(f.failReadback&&f.written&&k===COMPANION_KEY)throw Error('readback');return values.get(k)??null;},setItem(k,v){assert.ok([COMPANION_KEY,JOURNAL_KEY].includes(k));assert.ok(active.has(k));if(f.quota)throw Error('quota');values.set(k,v);writes.push(k);f.written=true;if(f.after)throw Error('after-write');},removeItem(){assert.fail('no deletes');}}};return f;
}
const make=f=>createCompanionRoster(f.storage,f);
const protectedRaw=f=>[LEGACY_COMPANION_KEY,LEGACY_JOURNAL_KEY,EXPEDITION_KEY,LEGACY_EXPEDITION_KEY].map(k=>[k,f.values.get(k)]);

test('fourteenth fixed companion preserves all thirteen old g1/g2/g3/g4/legacy records, one-per-species and explicit release/replacement',async()=>{
 const f=fixture(),r=make(f),oldRaw=f.values.get(COMPANION_KEY),protectedBefore=protectedRaw(f),journalRaw=f.values.get(JOURNAL_KEY);
 assert.equal(COMPANION_KEY,'mushi-companions-v2');assert.equal(COMPANION_VERSION,2);
 assert.deepEqual(COMPANION_SPECIES,['hercules','rhino','stag','metallifer','atlas','giantstag','elephant','goliath','fivehorn','miyama','euchirus','manticora','rainbowstag','europestag','giraffestag']);assert.deepEqual(V1_SPECIES,['hercules','rhino','stag','metallifer']);
 const fixedM=fixture();fixedM.values.set(COMPANION_KEY,modern(oldRoster.map(e=>e.species==='manticora'?entry(capture('manticora','savanna','insect-2'),111):e)));const fixedMBytes=fixedM.values.get(COMPANION_KEY),fixedMStore=make(fixedM);assert.equal(fixedMStore.entries[11].sizePermille,null);assert.equal(await fixedMStore.flush(),true);assert.equal(fixedM.values.get(COMPANION_KEY),fixedMBytes);assert.equal(fixedMStore.add(europestag()).ok,true);assert.equal(await fixedMStore.flush(),true);assert.equal(fixedMStore.entries[11].originKind,'legacy');
 const fixed=fixture();fixed.values.set(COMPANION_KEY,modern(oldRoster.map(e=>e.species==='atlas'?entry(capture('atlas','understory','insect-5'),104):e)));const fixedStore=make(fixed);assert.equal(fixedStore.entries[4].sizePermille,null);assert.equal(await fixedStore.flush(),true);assert.equal(fixed.writes.length,0);
 assert.deepEqual(r.entries,oldRoster);assert.equal(await r.flush(),true);assert.equal(f.writes.length,0);assert.equal(f.values.get(COMPANION_KEY),oldRaw);
 assert.deepEqual(r.add(europestag()),{ok:true,entry:entry(europestag(),1000)});assert.equal(await r.flush(),true);assert.equal(r.entries.length,14);assert.ok(f.values.get(COMPANION_KEY).length<16384);
 assert.deepEqual(r.add(europestag()),{ok:false,reason:'already-owned'});assert.deepEqual(r.replace('europe/insect-1',europestag()),{ok:false,reason:'same-individual'});
 assert.deepEqual(make(f).entries,[...oldRoster,entry(europestag(),1000)]);assert.deepEqual(r.entries.slice(0,13),oldRoster);
 assert.deepEqual(r.replace(oldRoster[4].id,europestag()),{ok:false,reason:'species-mismatch'});
 // Existing same-species replacement still works; a new fixed species does not
 // acquire a fabricated second origin merely to exercise replace().
 const oldOther=r.replace('forest/insect-1',capture('goliath','forest','insect-2'));assert.equal(oldOther.ok,true);assert.equal(await r.flush(),true);assert.equal(r.entries.at(-1).id,'europe/insect-1');
 assert.equal(r.replace('forest/insect-2',capture('goliath','forest','insect-1')).ok,true);assert.equal(r.release('europe/insect-1').ok,true);assert.equal(await r.flush(),true);
 assert.equal(r.release('europe/insect-1').ok,false);assert.deepEqual(make(f).entries.filter(e=>e.species!=='goliath'),oldRoster.filter(e=>e.species!=='goliath'));assert.equal(make(f).entries[7].originIndividualId,'insect-1');
 assert.deepEqual(protectedRaw(f),protectedBefore);assert.equal(f.values.get(JOURNAL_KEY),journalRaw);
});

test('only europe/insect-1 is accepted and no old-generation europestag expedition or borrowed original habitat ID can become measured',()=>{
 const f=fixture(),r=make(f);
 const bad=[...['night','tropical','forest','meadow','understory','savanna','australia','africa','__proto__'].map(originHabitat=>({...europestag(),originHabitat})),...['insect-0','insect-01','insect-2','insect-4','insect-5','insect-6','insect-29','insect-30'].map(originIndividualId=>({...europestag(),originIndividualId})),{...europestag(),species:'__proto__'},{...europestag(),originKind:undefined},{...europestag(),sizePermille:1000},{...europestag(),measureVersion:1},{...europestag(),originEncounterId:'unknown'},...[1,2,3,4,5].map(g=>({...europestag(),originKind:'expedition',originEncounterId:`g${g}-1234abcd-o1-europe-europestag`,sizePermille:1100,measureVersion:1})),{...europestag(),originKind:'expedition',originEncounterId:'g1-1234abcd-o1-understory-metallifer',sizePermille:1100,measureVersion:1}];
 for(const c of bad)assert.deepEqual(r.add(c),{ok:false,reason:'invalid-capture'});
 assert.deepEqual(r.entries,oldRoster);assert.equal(f.writes.length,0);
 assert.deepEqual(EXPEDITION_SLOTS.slice(0,8).map(s=>[s.populationSlotId,s.habitat,s.runtimeSlotId]),[['hercules-a','tropical','insect-5'],['hercules-b','tropical','insect-6'],['rhino','night','insect-4'],['stag','night','insect-5'],['metallifer','understory','insect-4'],['giantstag','night','insect-6'],['atlas','understory','insect-5'],['manticora','savanna','insect-2']]);
});

test('unknown, duplicate and future roster payloads stay read-only, v2 wins and v1 cannot adopt europestag',async()=>{
 for(const raw of ['{',JSON.stringify({version:3,legacyImportDone:true,entries:oldRoster}),modern([...oldRoster,entry(europestag()),entry(europestag())]),modern([...oldRoster,{...entry(europestag()),originIndividualId:'insect-5'}]),modern([...oldRoster,{...entry(europestag()),extra:'unknown'}])]){
  const f=fixture();f.values.set(COMPANION_KEY,raw);const r=make(f);assert.equal(r.reason,'invalid-data');r.add(europestag());r.release('europe/insect-1');assert.equal(await r.flush(),false);assert.equal(f.values.get(COMPANION_KEY),raw);assert.equal(f.writes.length,0);
 }
 const f=fixture();f.values.delete(COMPANION_KEY);const {originKind,originEncounterId,sizePermille,measureVersion,...legacy}=entry(europestag());const raw=JSON.stringify({version:1,entries:[legacy]});f.values.set(LEGACY_COMPANION_KEY,raw);const r=make(f);assert.equal(r.reason,'invalid-data');r.add(europestag());assert.equal(await r.flush(),false);assert.equal(f.values.has(COMPANION_KEY),false);assert.equal(f.values.get(LEGACY_COMPANION_KEY),raw);
 const current=fixture();current.values.set(LEGACY_COMPANION_KEY,raw);const c=make(current);assert.deepEqual(c.entries,oldRoster);assert.equal(c.add(europestag()).ok,true);assert.equal(await c.flush(),true);assert.equal(current.values.get(LEGACY_COMPANION_KEY),raw);
});

test('quota retry, uncertain write, missing locks and competing-tab release keep the durable new fixed companion safe',async()=>{
 const f=fixture(),r=make(f),original=f.values.get(COMPANION_KEY);f.quota=true;r.add(europestag());assert.equal(await r.flush(),false);assert.equal(f.values.get(COMPANION_KEY),original);assert.equal(r.entries.length,14);
 f.quota=false;assert.equal(await r.flush(),true);assert.deepEqual(make(f).entries,r.entries);
 f.after=true;r.release('europe/insect-1');assert.equal(await r.flush(),false);const written=f.values.get(COMPANION_KEY),count=f.writes.length;assert.equal(await r.flush(),true);assert.equal(f.writes.length,count);assert.equal(f.values.get(COMPANION_KEY),written);f.after=false;
 const a=make(f),b=make(f);a.add(europestag());b.release('forest/insect-1');assert.equal(await a.flush(),true);const winner=f.values.get(COMPANION_KEY);assert.equal(await b.flush(),false);assert.equal(b.reason,'conflict');assert.equal(await b.flush(),false);assert.equal(f.values.get(COMPANION_KEY),winner);assert.equal(make(f).entries.at(-1).species,'europestag');
 const unreadable=fixture(),u=make(unreadable);unreadable.failReadback=true;u.add(europestag());assert.equal(await u.flush(),false);const uncertain=unreadable.values.get(COMPANION_KEY),uncertainWrites=unreadable.writes.length;assert.equal(JSON.parse(uncertain).entries.length,14);unreadable.failReadback=false;assert.equal(await u.flush(),true);assert.equal(unreadable.values.get(COMPANION_KEY),uncertain);assert.equal(unreadable.writes.length,uncertainWrites);
 const n=fixture(),q=createCompanionRoster(n.storage,{locks:null,now:n.now});q.add(europestag());assert.equal(await q.flush(),false);assert.equal(q.reason,'missing-locks');assert.equal(n.writes.length,0);
});

test('31st journal article retains all 30 notes/fields and optional 500-character memo through failure, retry, recapture and conflict',async()=>{
 const f=fixture(),protectedBefore=protectedRaw(f),rosterRaw=f.values.get(COMPANION_KEY),j=createJournal(f.storage,f),oldRaw=f.values.get(JOURNAL_KEY);
 assert.equal(JOURNAL_KEY,'mushi-journal-v2');assert.equal(JOURNAL_VERSION,2);assert.equal(NOTE_LIMIT,500);assert.deepEqual(loadJournal(f.storage).entries,oldJournal);assert.deepEqual(j.entries,oldJournal);assert.equal(await j.flush(),true);assert.equal(f.writes.length,0);
 assert.equal(j.setNote('europestag','not captured'),null);assert.equal(j.record({species:'__proto__'}),null);
 f.quota=true;assert.equal(j.record({species:'europestag',location:'南東イングランド参考・広葉樹林縁の倒木',x:1,z:-2}).note,'');const literal='<b>栗色の上翅と鹿角状の顎</b>&';j.setNote('europestag',literal+'角'.repeat(600));assert.equal(j.entries[30].note,(literal+'角'.repeat(600)).slice(0,500));assert.equal(await j.flush(),false);assert.equal(f.values.get(JOURNAL_KEY),oldRaw);
 f.quota=false;assert.equal(await j.flush(),true);assert.equal(j.entries.length,31);assert.deepEqual(j.entries.slice(0,30),oldJournal);assert.deepEqual(createJournal(f.storage,f).entries,j.entries);
 assert.equal(j.record({species:'europestag',location:'同じ地面',x:2,z:-3}).note,(literal+'角'.repeat(600)).slice(0,500));assert.equal(j.entries.length,31);assert.equal(await j.flush(),true);
 const a=createJournal(f.storage,f),b=createJournal(f.storage,f);a.setNote('europestag','');b.setNote('europestag','session only');assert.equal(await a.flush(),true);const winner=f.values.get(JOURNAL_KEY);assert.equal(await b.flush(),false);assert.equal(await b.flush(),false);assert.equal(f.values.get(JOURNAL_KEY),winner);
 // The species-derived finite JSON limit must grow with the 31st row.
 const allSpecies=[...oldSpecies,'europestag'],currentSpecies=[...allSpecies,'giantwaterbug','wetapunga','giraffestag'];assert.equal(allSpecies.length,31);assert.equal(currentSpecies.length,34);assert.equal(JOURNAL_RAW_LIMIT,128+currentSpecies.reduce((n,s)=>n+6*(500+120+s.length)+256,0));assert.ok(JOURNAL_RAW_LIMIT<200000);
 const metrics=[];for(const c of ['字','\u0000','\ud800']){
  const max=allSpecies.map(species=>({species,firstSeen:1000,lastSeen:1000,location:c.repeat(120),x:-Number.MAX_VALUE,z:Number.MIN_VALUE,note:c.repeat(500)}));
  for(const writer of ['snapshot','session']){const cap=fixture();cap.values.set(JOURNAL_KEY,modern([]));if(writer==='snapshot')assert.equal(await saveJournal(max,cap.storage,cap),true);else{const store=createJournal(cap.storage,cap);for(const e of max){store.record(e);store.setNote(e.species,e.note);}assert.equal(await store.flush(),true);}
   const raw=cap.values.get(JOURNAL_KEY);assert.ok(raw.length<=JOURNAL_RAW_LIMIT);assert.deepEqual(loadJournal(cap.storage).entries,max);const fresh=createJournal(cap.storage,cap),n=cap.writes.length;assert.equal(await fresh.flush(),true);assert.equal(cap.writes.length,n);assert.deepEqual(fresh.entries,max);metrics.push({writer,escaped:c!=='字',length:raw.length});}
 }
 // A future/overlimit row may be previewed, but never written back sanitized.
 for(const raw of [modern([...oldJournal,{...oldJournal[0],species:'future-beetle'}]),JSON.stringify({version:3,legacyImportDone:true,entries:oldJournal}),' '.repeat(JOURNAL_RAW_LIMIT+1)+modern([])]){const bad=fixture();bad.values.set(JOURNAL_KEY,raw);const locked=createJournal(bad.storage,bad);locked.setNote('rhino','session');assert.equal(await locked.flush(),false);assert.equal(await saveJournal(oldJournal,bad.storage,bad),false);assert.equal(bad.values.get(JOURNAL_KEY),raw);assert.equal(bad.writes.length,0);}
 console.log(JSON.stringify({journalSpecies:31,limit:JOURNAL_RAW_LIMIT,maximumPayloads:metrics}));
 assert.deepEqual(protectedRaw(f),protectedBefore);assert.equal(f.values.get(COMPANION_KEY),rosterRaw);
});


test('existing gen5 A/B outing bytes, all eight records and measured best survive new species saves unchanged',async()=>{
 const hash=s=>createHash('sha256').update(s).digest('hex');
 // Actual frozen042 source hashes, not regenerated after this addition.
 assert.equal(hash(priorExpedition(fs.readFileSync(new URL('../src/expedition.js',import.meta.url),'utf8'))),'0b4e27a91eed5b3bf943ef0931eb4ef3f932a59d083bb909988c88f22bfe0fce');
 assert.equal(hash(priorAtlasSupport(fs.readFileSync(new URL('../src/atlas-encounter-layout.js',import.meta.url),'utf8'))),'196d5e47437097a772e1e144b05c38845f54b15f2c18231312bd7c00bcfde52a');
 for(const [seed,key]of [[0,'A'],[1247,'B']]){
  const values=new Map(),storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)},locks={request:async(k,o,fn)=>fn()},e=frozen047.createExpedition(storage,{locks,seedSource:()=>seed,now:()=>999});assert.equal(await e.flush(),true);const a=e.snapshot.encounters[6];assert.equal(e.measure(a.encounterId).ok,true);assert.equal(await e.flush(),true);const before=e.snapshot,bytes=values.get(EXPEDITION_KEY);assert.equal(before.generatorVersion,5);assert.equal(before.encounters.length,8);assert.equal(atlasEncounterSupportKey(before),key);
  const f=fixture();f.values.set(EXPEDITION_KEY,bytes);const r=make(f),j=createJournal(f.storage,f);r.add(europestag());j.record({species:'europestag',location:'夕方の再現倒木',x:0,z:.08});j.setNote('europestag','固定・未計測');assert.equal(await r.flush(),true);assert.equal(await j.flush(),true);assert.equal(f.values.get(EXPEDITION_KEY),bytes);assert.ok(!f.writes.includes(EXPEDITION_KEY));const loaded=createExpedition(f.storage,f);assert.deepEqual(loaded.snapshot,before);assert.equal(await loaded.flush(),true);assert.equal(atlasEncounterSupportKey(loaded.snapshot),key);assert.equal(f.values.get(EXPEDITION_KEY),bytes);assert.deepEqual(loaded.snapshot.measuredEncounterIds,[a.encounterId]);assert.equal(loaded.measure(a.encounterId).alreadyMeasured,true);assert.equal(make(f).entries.at(-1).sizePermille,null);
 }
});
