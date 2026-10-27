/** MapStorage only: capacity agreement is about JSON UTF-16 length, not browser quota. */
import test from 'node:test';import assert from 'node:assert/strict';
import {createJournal,loadJournal,saveJournal,JOURNAL_KEY,LEGACY_JOURNAL_KEY,JOURNAL_VERSION,NOTE_LIMIT,JOURNAL_RAW_LIMIT} from '../src/journal.js';
const species=['butterfly','dragonfly','cicada','morpho','grasshopper','hercules','leafinsect','waterstrider','leafcutterant','firefly','dungbeetle','divingbeetle','mantis','ladybird','rhino','stag','bee','swallowtail','jewel','longhorn','metallifer','atlas','giantstag','elephant','goliath','fivehorn','miyama','euchirus'];
const currentSpecies=[...species,'manticora','rainbowstag','europestag','giantwaterbug','wetapunga','giraffestag','tigerbeetle','orchidmantis','xylotrupes','anax','moonmoth'];
const entries=(character,ids=species)=>ids.map((s,i)=>({species:s,firstSeen:Number.MAX_SAFE_INTEGER,lastSeen:Number.MAX_SAFE_INTEGER,location:character.repeat(120),x:i%2?-Number.MAX_VALUE:Number.MIN_VALUE,z:i%2?-0.0000012345678901234567:1.2345678901234567e+30,note:character.repeat(NOTE_LIMIT)}));
const payload=rows=>JSON.stringify({version:2,legacyImportDone:true,entries:rows});
function fixture(raw=null,legacy='untouched legacy bytes'){
 const values=new Map([[LEGACY_JOURNAL_KEY,legacy],['mushi-companions-v2','companions untouched'],['mushi-expedition-v2','outing untouched']]);if(raw!==null)values.set(JOURNAL_KEY,raw);const writes=[],reads=[],tails=new Map();
 const f={values,writes,reads,quota:false,now:()=>Number.MAX_SAFE_INTEGER,locks:{request(key,options,fn){assert.equal(key,JOURNAL_KEY);assert.deepEqual(options,{mode:'exclusive'});const task=(tails.get(key)||Promise.resolve()).then(()=>{const result=fn();assert.ok(!(result instanceof Promise));return result;});tails.set(key,task.catch(()=>{}));return task;}},storage:{getItem(key){reads.push(key);return values.get(key)??null;},setItem(key,value){assert.equal(key,JOURNAL_KEY);assert.equal(typeof value,'string');assert.ok(value.length<=JOURNAL_RAW_LIMIT,'both writers preflight before setItem');if(f.quota)throw Error('quota');writes.push(value);values.set(key,value);},removeItem(){assert.fail('no delete');}}};return f;
}
const empty=()=>fixture(payload([]));

test('both journal writers round-trip all 39 maximum notes/locations, including six-character JSON escapes and lone UTF-16 surrogates',async()=>{
 assert.equal(NOTE_LIMIT,500);assert.equal(JOURNAL_VERSION,2);assert.equal(JOURNAL_RAW_LIMIT,128+currentSpecies.reduce((n,s)=>n+6*(500+120+s.length)+256,0));assert.ok(Number.isSafeInteger(JOURNAL_RAW_LIMIT)&&JOURNAL_RAW_LIMIT<200000);
 const metrics=[];
 for(const [kind,character]of [['normal','字'],['control','\u0000'],['lone-surrogate','\ud800']]){
  const expected=entries(character,currentSpecies);
  for(const writer of ['session','snapshot']){
   const f=empty();
   if(writer==='snapshot')assert.equal(await saveJournal(expected,f.storage,f),true);
   else{const j=createJournal(f.storage,f);for(const e of expected){j.record({species:e.species,location:e.location,x:e.x,z:e.z});j.setNote(e.species,e.note);}assert.equal(await j.flush(),true);assert.equal(j.saved,true);assert.deepEqual(j.entries,expected);}
   const raw=f.values.get(JOURNAL_KEY);assert.ok(raw.length>20000);assert.ok(raw.length<=JOURNAL_RAW_LIMIT);assert.deepEqual(loadJournal(f.storage),{entries:expected,saved:true});const fresh=createJournal(f.storage,f);assert.deepEqual(fresh.entries,expected);const count=f.writes.length;assert.equal(await fresh.flush(),true);assert.equal(f.writes.length,count);assert.equal(f.values.get(LEGACY_JOURNAL_KEY),'untouched legacy bytes');metrics.push({kind,writer,serializedLength:raw.length,entries:expected.length});
  }
 }
 console.log('Maximum journal capacity:',JSON.stringify({limit:JOURNAL_RAW_LIMIT,rows:metrics}));
});

test('existing valid oversized-vs-old-limit v2 and v1 raw recover losslessly without resetting notes or old source bytes',async()=>{
 const expected=entries('\u0001'),large=payload(expected),f=fixture(large),j=createJournal(f.storage,f);assert.ok(large.length>20000);assert.equal(j.saved,true);assert.deepEqual(j.entries,expected);assert.equal(await j.flush(),true);assert.equal(f.writes.length,0);assert.equal(f.values.get(JOURNAL_KEY),large);
 j.setNote('euchirus','recovered');assert.equal(await j.flush(),true);assert.deepEqual(createJournal(f.storage,f).entries.slice(0,27),expected.slice(0,27));assert.equal(loadJournal(f.storage).entries.at(-1).note,'recovered');
 const legacyRows=expected.slice(0,27),legacy=JSON.stringify({version:1,entries:legacyRows}),m=fixture(null,legacy);assert.deepEqual(loadJournal(m.storage),{entries:legacyRows,saved:false});assert.equal(m.writes.length,0);const migrated=createJournal(m.storage,m);assert.equal(await migrated.flush(),true);assert.deepEqual(loadJournal(m.storage).entries,legacyRows);assert.equal(m.values.get(LEGACY_JOURNAL_KEY),legacy);
 const protectedKeys=['mushi-companions-v2','mushi-expedition-v2'];for(const key of protectedKeys)assert.equal(m.values.get(key),f.values.get(key));
});

test('oversize/future/unknown schema remain read-only, with unchanged raw and no fallback or partial snapshot write',async()=>{
 const good=entries('字'),one=payload([good[0]]),over=' '.repeat(JOURNAL_RAW_LIMIT+1-one.length)+one;
 const variants=[over,JSON.stringify({version:3,legacyImportDone:true,entries:good}),JSON.stringify({version:2,legacyImportDone:true,extra:1,entries:good}),payload([...good,{...good[0],species:'future-insect'}]),payload(good.map((e,i)=>i?e:{...e,note:'x'.repeat(501)})),payload(good.map((e,i)=>i?e:{...e,location:'x'.repeat(121)}))];
 for(const raw of variants){const f=fixture(raw),j=createJournal(f.storage,f);assert.equal(j.saved,false);j.record({species:'rhino',location:'session only'});j.setNote('rhino','session edit');assert.equal(await j.flush(),false);assert.equal(await saveJournal(good,f.storage,f),false);assert.equal(f.writes.length,0);assert.equal(f.values.get(JOURNAL_KEY),raw);assert.ok(!f.reads.includes(LEGACY_JOURNAL_KEY),'present invalid v2 forbids legacy fallback');}
 const f=empty(),invalid=entries('字');invalid[0].note+='x';assert.equal(await saveJournal(invalid,f.storage,f),false);assert.equal(f.writes.length,0);
});

test('large-payload quota/retry, missing locks and stale CAS preserve durable bytes and in-memory edits',async()=>{
 const original=payload([{...entries('字')[0],note:'old'}]),f=fixture(original),j=createJournal(f.storage,f);f.quota=true;for(const e of entries('\u0002')){j.record({species:e.species,location:e.location,x:e.x,z:e.z});j.setNote(e.species,e.note);}assert.equal(await j.flush(),false);assert.equal(j.saved,false);assert.equal(j.entries.length,28);assert.equal(f.values.get(JOURNAL_KEY),original);assert.equal(await saveJournal(j.entries,f.storage,f),false);assert.equal(f.values.get(JOURNAL_KEY),original);f.quota=false;assert.equal(await j.flush(),true);assert.deepEqual(loadJournal(f.storage).entries,j.entries);
 const winner=payload(entries('\u0003')),a=createJournal(f.storage,f);f.values.set(JOURNAL_KEY,winner);a.setNote('rhino','old tab edit');assert.equal(await a.flush(),false);assert.equal(f.values.get(JOURNAL_KEY),winner);const n=f.writes.length;assert.equal(await a.flush(),false);assert.equal(f.writes.length,n);
 const no=createJournal(f.storage,{locks:null,now:f.now});no.setNote('rhino','offline');assert.equal(await no.flush(),false);assert.equal(await saveJournal(entries('字'),f.storage,{locks:null}),false);assert.equal(f.values.get(JOURNAL_KEY),winner);
 // Full-snapshot writer also compares raw after acquiring its lock.
 let invoke;const held={request:(_key,_options,fn)=>new Promise(resolve=>{invoke=()=>resolve(fn());})},pending=saveJournal(entries('字'),f.storage,{locks:held});assert.equal(typeof invoke,'function');f.values.set(JOURNAL_KEY,original);invoke();assert.equal(await pending,false);assert.equal(f.values.get(JOURNAL_KEY),original);
});
