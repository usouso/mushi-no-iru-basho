/** Isolated Map storage + exclusive lock doubles; no browser storage or external I/O. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {BATTLE_SPECIES,createBattle,advanceBattle} from '../src/beetle-battle.js';
import {createCompanionRoster,COMPANION_KEY,COMPANION_VERSION,LEGACY_COMPANION_KEY,COMPANION_SPECIES} from '../src/individual-roster.js';
import {COMPANION_SPECIES as V1_SPECIES} from '../src/companion-roster.js';
import {createJournal,loadJournal,JOURNAL_KEY,JOURNAL_VERSION,LEGACY_JOURNAL_KEY,NOTE_LIMIT} from '../src/journal.js';
import {EXPEDITION_KEY,LEGACY_EXPEDITION_KEY,EXPEDITION_SLOTS} from '../src/expedition.js';
const capture=(species,originHabitat,originIndividualId)=>({species,originHabitat,originIndividualId,originKind:'legacy',originEncounterId:null,sizePermille:null,measureVersion:null});
const euchirus=()=>capture('euchirus','understory','insect-7');
const entry=(c,time=100)=>({...c,id:c.originKind==='legacy'?`${c.originHabitat}/${c.originIndividualId}`:c.originEncounterId,capturedAt:time});
const oldRoster=[['hercules','tropical','insect-5','hercules-a'],['rhino','night','insect-4','rhino'],['stag','night','insect-5','stag'],['metallifer','understory','insect-4','metallifer']].map(([species,habitat,id,slot],i)=>entry({...capture(species,habitat,id),originKind:'expedition',originEncounterId:`g1-1234abcd-o1-${habitat}-${slot}`,sizePermille:1050+i,measureVersion:1},100+i));
oldRoster.push(entry({...capture('atlas','understory','insect-5'),originKind:'expedition',originEncounterId:'g3-1234abcd-o3-understory-atlas',sizePermille:1123,measureVersion:1},104),entry({...capture('giantstag','night','insect-6'),originKind:'expedition',originEncounterId:'g2-1234abcd-o2-night-giantstag',sizePermille:1150,measureVersion:1},105),entry(capture('elephant','tropical','insect-11'),106),entry(capture('goliath','forest','insect-1'),107),entry(capture('fivehorn','understory','insect-6'),108),entry(capture('miyama','meadow','insect-30'),109));
const oldSpecies=['butterfly','dragonfly','cicada','morpho','grasshopper','hercules','leafinsect','waterstrider','leafcutterant','firefly','dungbeetle','divingbeetle','mantis','ladybird','rhino','stag','bee','swallowtail','jewel','longhorn','metallifer','atlas','giantstag','elephant','goliath','fivehorn','miyama'];
const oldJournal=oldSpecies.map((species,i)=>({species,firstSeen:100+i,lastSeen:200+i,location:`元の場所${i}`,x:i,z:-5-i,note:`保持 ${species} <b>文字</b>`}));
const modern=entries=>JSON.stringify({version:2,legacyImportDone:true,entries});
function fixture(){
 const values=new Map([[COMPANION_KEY,modern(oldRoster)],[JOURNAL_KEY,modern(oldJournal)],...[[LEGACY_COMPANION_KEY,'v1 roster untouched'],[LEGACY_JOURNAL_KEY,'v1 notes untouched'],[EXPEDITION_KEY,'g1/g2/g3 outing raw untouched'],[LEGACY_EXPEDITION_KEY,'old five-slot raw untouched']]]),writes=[],tails=new Map(),active=new Set();
 const f={values,writes,quota:false,after:false,now:()=>1000,locks:{request(key,opts,fn){assert.equal(opts.mode,'exclusive');const task=(tails.get(key)||Promise.resolve()).then(()=>{assert.ok(!active.has(key));active.add(key);try{return fn();}finally{active.delete(key);}});tails.set(key,task.catch(()=>{}));return task;}},storage:{getItem:k=>values.get(k)??null,setItem(k,v){assert.ok([COMPANION_KEY,JOURNAL_KEY].includes(k));assert.ok(active.has(k));if(f.quota)throw Error('quota');values.set(k,v);writes.push(k);if(f.after)throw Error('after-write');},removeItem(){assert.fail('no deletes');}}};return f;
}
const make=f=>createCompanionRoster(f.storage,f);
const protectedRaw=f=>[LEGACY_COMPANION_KEY,LEGACY_JOURNAL_KEY,EXPEDITION_KEY,LEGACY_EXPEDITION_KEY].map(k=>[k,f.values.get(k)]);

test('eleventh fixed companion preserves all ten old g1/g2/g3/legacy records, one-per-species and explicit release/replacement',async()=>{
 const f=fixture(),r=make(f),oldRaw=f.values.get(COMPANION_KEY),protectedBefore=protectedRaw(f),journalRaw=f.values.get(JOURNAL_KEY);
 assert.equal(COMPANION_KEY,'mushi-companions-v2');assert.equal(COMPANION_VERSION,2);
 assert.deepEqual(COMPANION_SPECIES,['hercules','rhino','stag','metallifer','atlas','giantstag','elephant','goliath','fivehorn','miyama','euchirus','manticora','rainbowstag']);assert.deepEqual(V1_SPECIES,['hercules','rhino','stag','metallifer']);
 const fixed=fixture();fixed.values.set(COMPANION_KEY,modern(oldRoster.map(e=>e.species==='atlas'?entry(capture('atlas','understory','insect-5'),104):e)));const fixedStore=make(fixed);assert.equal(fixedStore.entries[4].sizePermille,null);assert.equal(await fixedStore.flush(),true);assert.equal(fixed.writes.length,0);
 assert.deepEqual(r.entries,oldRoster);assert.equal(await r.flush(),true);assert.equal(f.writes.length,0);assert.equal(f.values.get(COMPANION_KEY),oldRaw);
 assert.deepEqual(r.add(euchirus()),{ok:true,entry:entry(euchirus(),1000)});assert.equal(await r.flush(),true);assert.equal(r.entries.length,11);
 assert.deepEqual(r.add(euchirus()),{ok:false,reason:'already-owned'});assert.deepEqual(r.replace('understory/insect-7',euchirus()),{ok:false,reason:'same-individual'});
 assert.deepEqual(make(f).entries,[...oldRoster,entry(euchirus(),1000)]);assert.deepEqual(r.entries.slice(0,10),oldRoster);
 assert.deepEqual(r.replace(oldRoster[4].id,euchirus()),{ok:false,reason:'species-mismatch'});
 // Existing same-species replacement still works; a new fixed species does not
 // acquire a fabricated second origin merely to exercise replace().
 const oldOther=r.replace('forest/insect-1',capture('goliath','forest','insect-2'));assert.equal(oldOther.ok,true);assert.equal(await r.flush(),true);assert.equal(r.entries.at(-1).id,'understory/insect-7');
 assert.equal(r.replace('forest/insect-2',capture('goliath','forest','insect-1')).ok,true);assert.equal(r.release('understory/insect-7').ok,true);assert.equal(await r.flush(),true);
 assert.equal(r.release('understory/insect-7').ok,false);assert.deepEqual(make(f).entries.filter(e=>e.species!=='goliath'),oldRoster.filter(e=>e.species!=='goliath'));assert.equal(make(f).entries[7].originIndividualId,'insect-1');
 assert.deepEqual(protectedRaw(f),protectedBefore);assert.equal(f.values.get(JOURNAL_KEY),journalRaw);
});

test('only understory/insect-7 is accepted and no euchirus expedition or borrowed original habitat ID can become measured',()=>{
 const f=fixture(),r=make(f);
 const bad=[...['night','tropical','forest','meadow','africa','__proto__'].map(originHabitat=>({...euchirus(),originHabitat})),...['insect-0','insect-01','insect-1','insect-4','insect-5','insect-6','insect-29','insect-30'].map(originIndividualId=>({...euchirus(),originIndividualId})),{...euchirus(),species:'__proto__'},{...euchirus(),originKind:undefined},{...euchirus(),sizePermille:1000},{...euchirus(),measureVersion:1},{...euchirus(),originEncounterId:'unknown'},...[1,2,3].map(g=>({...euchirus(),originKind:'expedition',originEncounterId:`g${g}-1234abcd-o1-understory-euchirus`,sizePermille:1100,measureVersion:1})),{...euchirus(),originKind:'expedition',originEncounterId:'g1-1234abcd-o1-understory-metallifer',sizePermille:1100,measureVersion:1}];
 for(const c of bad)assert.deepEqual(r.add(c),{ok:false,reason:'invalid-capture'});
 assert.deepEqual(r.entries,oldRoster);assert.equal(f.writes.length,0);
 assert.deepEqual(EXPEDITION_SLOTS.map(s=>[s.populationSlotId,s.habitat,s.runtimeSlotId]),[['hercules-a','tropical','insect-5'],['hercules-b','tropical','insect-6'],['rhino','night','insect-4'],['stag','night','insect-5'],['metallifer','understory','insect-4'],['giantstag','night','insect-6'],['atlas','understory','insect-5']]);
});

test('unknown, duplicate and future roster payloads stay read-only, v2 wins and v1 cannot adopt euchirus',async()=>{
 for(const raw of ['{',JSON.stringify({version:3,legacyImportDone:true,entries:oldRoster}),modern([...oldRoster,entry(euchirus()),entry(euchirus())]),modern([...oldRoster,{...entry(euchirus()),originIndividualId:'insect-5'}]),modern([...oldRoster,{...entry(euchirus()),extra:'unknown'}])]){
  const f=fixture();f.values.set(COMPANION_KEY,raw);const r=make(f);assert.equal(r.reason,'invalid-data');r.add(euchirus());r.release('understory/insect-7');assert.equal(await r.flush(),false);assert.equal(f.values.get(COMPANION_KEY),raw);assert.equal(f.writes.length,0);
 }
 const f=fixture();f.values.delete(COMPANION_KEY);const {originKind,originEncounterId,sizePermille,measureVersion,...legacy}=entry(euchirus());const raw=JSON.stringify({version:1,entries:[legacy]});f.values.set(LEGACY_COMPANION_KEY,raw);const r=make(f);assert.equal(r.reason,'invalid-data');r.add(euchirus());assert.equal(await r.flush(),false);assert.equal(f.values.has(COMPANION_KEY),false);assert.equal(f.values.get(LEGACY_COMPANION_KEY),raw);
 const current=fixture();current.values.set(LEGACY_COMPANION_KEY,raw);const c=make(current);assert.deepEqual(c.entries,oldRoster);assert.equal(c.add(euchirus()).ok,true);assert.equal(await c.flush(),true);assert.equal(current.values.get(LEGACY_COMPANION_KEY),raw);
});

test('quota retry, uncertain write, missing locks and competing-tab release keep the durable new fixed companion safe',async()=>{
 const f=fixture(),r=make(f),original=f.values.get(COMPANION_KEY);f.quota=true;r.add(euchirus());assert.equal(await r.flush(),false);assert.equal(f.values.get(COMPANION_KEY),original);assert.equal(r.entries.length,11);
 f.quota=false;assert.equal(await r.flush(),true);assert.deepEqual(make(f).entries,r.entries);
 f.after=true;r.release('understory/insect-7');assert.equal(await r.flush(),false);const written=f.values.get(COMPANION_KEY),count=f.writes.length;assert.equal(await r.flush(),true);assert.equal(f.writes.length,count);assert.equal(f.values.get(COMPANION_KEY),written);f.after=false;
 const a=make(f),b=make(f);a.add(euchirus());b.release('forest/insect-1');assert.equal(await a.flush(),true);const winner=f.values.get(COMPANION_KEY);assert.equal(await b.flush(),false);assert.equal(b.reason,'conflict');assert.equal(await b.flush(),false);assert.equal(f.values.get(COMPANION_KEY),winner);assert.equal(make(f).entries.at(-1).species,'euchirus');
 const n=fixture(),q=createCompanionRoster(n.storage,{locks:null,now:n.now});q.add(euchirus());assert.equal(await q.flush(),false);assert.equal(q.reason,'missing-locks');assert.equal(n.writes.length,0);
});

test('28th journal article retains all 27 notes/fields and optional 500-character memo through failure, retry, recapture and conflict',async()=>{
 const f=fixture(),protectedBefore=protectedRaw(f),rosterRaw=f.values.get(COMPANION_KEY),j=createJournal(f.storage,f),oldRaw=f.values.get(JOURNAL_KEY);
 assert.equal(JOURNAL_KEY,'mushi-journal-v2');assert.equal(JOURNAL_VERSION,2);assert.equal(NOTE_LIMIT,500);assert.deepEqual(loadJournal(f.storage).entries,oldJournal);assert.deepEqual(j.entries,oldJournal);assert.equal(await j.flush(),true);assert.equal(f.writes.length,0);
 assert.equal(j.setNote('euchirus','not captured'),null);assert.equal(j.record({species:'__proto__'}),null);
 f.quota=true;assert.equal(j.record({species:'euchirus',location:'東南アジア林の生木',x:1,z:-2}).note,'');const literal='<b>長い左右の前脚</b>&';j.setNote('euchirus',literal+'角'.repeat(600));assert.equal(j.entries[27].note,(literal+'角'.repeat(600)).slice(0,500));assert.equal(await j.flush(),false);assert.equal(f.values.get(JOURNAL_KEY),oldRaw);
 f.quota=false;assert.equal(await j.flush(),true);assert.equal(j.entries.length,28);assert.deepEqual(j.entries.slice(0,27),oldJournal);assert.deepEqual(createJournal(f.storage,f).entries,j.entries);
 assert.equal(j.record({species:'euchirus',location:'同じ枝',x:2,z:-3}).note,(literal+'角'.repeat(600)).slice(0,500));assert.equal(j.entries.length,28);assert.equal(await j.flush(),true);
 const a=createJournal(f.storage,f),b=createJournal(f.storage,f);a.setNote('euchirus','');b.setNote('euchirus','session only');assert.equal(await a.flush(),true);const winner=f.values.get(JOURNAL_KEY);assert.equal(await b.flush(),false);assert.equal(await b.flush(),false);assert.equal(f.values.get(JOURNAL_KEY),winner);
 assert.deepEqual(protectedRaw(f),protectedBefore);assert.equal(f.values.get(COMPANION_KEY),rosterRaw);
});


test('only eleventh battle eligibility extends; old ten profiles, every rule and gen3 source outside exact gen4 additions stay unchanged',()=>{
 const old=['hercules','rhino','stag','metallifer','atlas','giantstag','elephant','goliath','fivehorn','miyama'];
 assert.deepEqual(Object.keys(BATTLE_SPECIES),[...old,'euchirus','manticora','rainbowstag']);
 const hash=s=>createHash('sha256').update(s).digest('hex');
 assert.equal(hash(JSON.stringify(Object.fromEntries(old.map(s=>[s,BATTLE_SPECIES[s]])))),'a9d05d0b7c3a5c32382048d43db8b01d14ba44cf21b81936eb85c7f7ee1f3b2f');
 const source=fs.readFileSync(new URL('../src/beetle-battle.js',import.meta.url),'utf8');
 assert.equal(hash(source.replace(/export const BATTLE_SPECIES=freeze\(\{[\s\S]*?\n\}\);/,'export const BATTLE_SPECIES=<registry>;')),'bcb68d5024e7293e865e2ff9206ea5cbbe02e3cbe71769dfcaa1b3c1d46b5770');
 // Invert only the approved gen4 additions; retain the immutable frozen gen3 hash.
 let priorExpedition=fs.readFileSync(new URL('../src/expedition.js',import.meta.url),'utf8');
 const gen4Additions=[
  [
    "runtimeSlotId:'insect-5'},\n {populationSlotId:'manticora',species:'manticora',habitat:'savanna',runtimeSlotId:'insect-2'}\n].map",
    "runtimeSlotId:'insect-5'}\n].map"
  ],
  [
    "const generationThreeSlots=EXPEDITION_SLOTS.slice(0,7);\n",
    ""
  ],
  [
    "version===3?generationThreeSlots:version===4?EXPEDITION_SLOTS:null",
    "version===3?EXPEDITION_SLOTS:null"
  ],
  [
    "species==='atlas'?3:species==='manticora'?4:1",
    "species==='atlas'?3:1"
  ],
  [
    "g([1234])",
    "g([123])"
  ],
  [
    "(tropical|night|understory|savanna)-(hercules-a|hercules-b|rhino|stag|metallifer|giantstag|atlas|manticora)",
    "(tropical|night|understory)-(hercules-a|hercules-b|rhino|stag|metallifer|giantstag|atlas)"
  ],
  [
    "generatorVersion:4,worldSeed",
    "generatorVersion:3,worldSeed"
  ],
  [
    "![1,2,3,4].includes",
    "![1,2,3].includes"
  ]
];
 for(const [current,prior] of gen4Additions){assert.equal(priorExpedition.split(current).length-1,1,'each exact gen4 fragment occurs once');priorExpedition=priorExpedition.replace(current,prior);}
 assert.equal(hash(priorExpedition),'f50727a3d2d23a834778bd3cff46faed001735bfee4dce0efddddb38721b1445');
 assert.equal(BATTLE_SPECIES.euchirus.role,'長い前脚で押し合う');assert.match(BATTLE_SPECIES.euchirus.help,/Euchirus longimanus/);assert.match(BATTLE_SPECIES.euchirus.help,/ゲーム上/);
 for(const [playerSpecies,opponentSpecies]of [['euchirus','rhino'],['rhino','euchirus'],['euchirus','euchirus']])for(const seed of [0,17]){
  const config={playerSpecies,opponentSpecies,seed},result=advanceBattle(createBattle(config),100);assert.equal(result.phase,'finished');
  if(result.winner==='draw'){assert.equal(result.finishReason,'time-limit');assert.equal(result.elapsed,59.6);}else{assert.equal(result.finishReason,'ring-out');assert.equal(Math.abs(result.position),4);}
  assert.deepEqual(advanceBattle(createBattle({...config,playerSizePermille:1150,input:'push'}),100),result);
 }
 assert.throws(()=>createBattle({playerSpecies:'__proto__',opponentSpecies:'rhino',seed:0}),TypeError);
});
