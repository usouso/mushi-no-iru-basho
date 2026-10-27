import {inverseEuropeIndividuals} from './fixtures/europe-individual-field-prior.mjs';
/** Bounded CPU tests only: six meadow dragonflies; no GPU/natural-behaviour claim. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dragonflyAmbientProfiles} from '../src/dragonfly-ambient.js';
import {createInsects} from '../src/insects.js';
import {createExpedition,EXPEDITION_KEY} from '../src/expedition.js';
const sourceURL = new URL('../src/insects.js',import.meta.url);
const ids = Array.from({length:6},(_,i)=>`insect-${i+8}`);
const position = i => ({x:i.x,y:i.y,z:i.z});
const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const rows = (restSeconds=9,offsetSeconds=0) => ids.map(runtimeSlotId=>({runtimeSlotId,restSeconds,offsetSeconds}));
const flies = sim => sim.items.filter(i=>i.species==='dragonfly');
const advance = (sim,seconds,dt=1/60) => {const end=sim.time+seconds;while(sim.time<end-1e-12)sim.update(Math.min(dt,end-sim.time));};
const snapshot = (worldSeed=123,outingCounter=1) => ({worldSeed,outingCounter});
async function expeditionFixture() {
 const values = new Map(), writes = [];
 let fail = false;
 const storage = {getItem:key=>values.get(key)??null,setItem:(key,value)=>{if(fail)throw Error('fixture write failure');writes.push([key,value]);values.set(key,value);}};
 const locks = {request:async(_key,_options,callback)=>callback()};
 const expedition = createExpedition(storage,{locks,seedSource:()=>123,now:()=>500});
 assert.equal(await expedition.flush(),true);
 return {expedition,storage,locks,values,writes,setFail:value=>{fail=value;}};
}

test('pure frozen six-slot fixture; full safe counters, seed bounds and separate purpose draws',()=>{
 const expected = [[8,11.082425583153963],[10,13.148311909288168],[9,11.000511583406478],[10,2.4088407941162586],[10,9.826165474951267],[9,2.317563450196758]];
 const result=dragonflyAmbientProfiles(snapshot());
 assert.deepEqual(result.map(p=>[p.restSeconds,p.offsetSeconds]),expected);
 assert.deepEqual(result.map(p=>p.runtimeSlotId),ids);assert.ok(Object.isFrozen(result));assert.ok(result.every(Object.isFrozen));
 for(const seed of [0,1,123,0xffffffff])for(const counter of [1,2,4294967296,4294967297,Number.MAX_SAFE_INTEGER]){
  const value=dragonflyAmbientProfiles(snapshot(seed,counter));assert.deepEqual(value,dragonflyAmbientProfiles(snapshot(seed,counter)));
  assert.ok(value.every(p=>Number.isInteger(p.restSeconds)&&p.restSeconds>=8&&p.restSeconds<=12&&p.offsetSeconds>=0&&p.offsetSeconds<p.restSeconds+6));
 }
 assert.notDeepEqual(result,dragonflyAmbientProfiles(snapshot(124,1)));assert.notDeepEqual(result,dragonflyAmbientProfiles(snapshot(123,2)));
 assert.notDeepEqual(result,dragonflyAmbientProfiles(snapshot(123,4294967297)),'counter is not truncated modulo uint32');
 assert.deepEqual(dragonflyAmbientProfiles(null),[]);assert.ok(Object.isFrozen(dragonflyAmbientProfiles(null)));
 const text=readFileSync(new URL('../src/dragonfly-ambient.js',import.meta.url),'utf8');
 assert.doesNotMatch(text,/Math\.random|Date\.|crypto|localStorage|sessionStorage/);
});

test('snapshot accepts owned scalar fields only and does not read unrelated snapshot data',()=>{
 let invoked=0;
 const getter={get worldSeed(){invoked++;return 123;},outingCounter:1};
 for(const invalid of [undefined,false,[],new Date(),{},Object.create(snapshot()),getter,{worldSeed:1,get outingCounter(){invoked++;return 1;}}])assert.throws(()=>dragonflyAmbientProfiles(invalid),TypeError);
 for(const worldSeed of [-1,1.1,0x100000000,NaN,Infinity,'123',null])assert.throws(()=>dragonflyAmbientProfiles(snapshot(worldSeed)),TypeError);
 for(const outingCounter of [0,-1,1.1,Number.MAX_SAFE_INTEGER+1,NaN,Infinity,'1',null])assert.throws(()=>dragonflyAmbientProfiles(snapshot(1,outingCounter)),TypeError);
 const valid=snapshot();Object.defineProperty(valid,'encounters',{get(){invoked++;throw Error('unrelated data read');}});
 assert.deepEqual(dragonflyAmbientProfiles(valid),dragonflyAmbientProfiles(snapshot()));assert.equal(invoked,0);
 assert.deepEqual(dragonflyAmbientProfiles(Object.assign(Object.create(null),snapshot())),dragonflyAmbientProfiles(snapshot()));
});

test('real expedition.snapshot yields stable settings across reload/travel/reset without storage writes; failed next outing preserves settings',async()=>{
 const f=await expeditionFixture(),initial=f.expedition.snapshot,raw=f.values.get(EXPEDITION_KEY),count=f.writes.length;
 assert.equal(initial.encounters.length,8);
 const profiles=dragonflyAmbientProfiles(initial),sim=createInsects(()=>0,{dragonflyAmbient:profiles});
 advance(sim,2);const frame=structuredClone(sim.items);sim.reset();assert.equal(sim.time,0);advance(sim,2);assert.deepEqual(sim.items,frame);
 const travel=createInsects(()=>0,{dragonflyAmbient:dragonflyAmbientProfiles(f.expedition.snapshot)});advance(travel,2);assert.deepEqual(travel.items,frame);
 const reload=createExpedition(f.storage,{locks:f.locks,seedSource:()=>{throw Error('must not redraw');}});
 assert.deepEqual(dragonflyAmbientProfiles(reload.snapshot),profiles);assert.equal(f.values.get(EXPEDITION_KEY),raw);assert.equal(f.writes.length,count);assert.deepEqual(f.expedition.snapshot,initial);
 f.setFail(true);assert.equal((await f.expedition.beginNextOuting(1)).ok,false);assert.deepEqual(dragonflyAmbientProfiles(f.expedition.snapshot),profiles);assert.equal(f.values.get(EXPEDITION_KEY),raw);
 f.setFail(false);assert.equal((await f.expedition.beginNextOuting(1)).ok,true);assert.notDeepEqual(dragonflyAmbientProfiles(f.expedition.snapshot),profiles);
 const unavailable=createExpedition(null,{locks:f.locks,seedSource:()=>{throw Error('must not seed');}});await unavailable.flush();assert.deepEqual(dragonflyAmbientProfiles(unavailable.snapshot),[]);
});

test('profile adapter rejects malformed arrays, accessors, duplicates, wrong ID/species/home and invalid ranges without invoking getters',()=>{
 let invoked=0;const accessor={runtimeSlotId:'insect-8',get restSeconds(){invoked++;return 9;},offsetSeconds:0};
 const arrayGetter=[];Object.defineProperty(arrayGetter,'0',{get(){invoked++;return rows()[0];}});
 const extra=rows();extra.extra=1;
 const bad=[null,{},new Array(1),arrayGetter,extra,[accessor],rows().concat(rows()[0]),[rows()[0],rows()[0]],[{...rows()[0],extra:1}], [Object.create(rows()[0])]];
 for(const runtimeSlotId of ['insect-7','insect-14','insect-08',8,null])bad.push([{...rows()[0],runtimeSlotId}]);
 for(const restSeconds of [7,13,8.5,NaN,Infinity,'9'])bad.push([{...rows()[0],restSeconds}]);
 for(const offsetSeconds of [-.001,15,NaN,Infinity,'0'])bad.push([{...rows()[0],offsetSeconds}]);
 for(const dragonflyAmbient of bad)assert.throws(()=>createInsects(()=>0,{dragonflyAmbient}),TypeError);
 assert.equal(invoked,0);
 const homes=createInsects().items.map(i=>[i.species,i.home.x,i.home.z,i.home.y]);
 homes[7][0]='butterfly';assert.throws(()=>createInsects(()=>0,{homes,dragonflyAmbient:rows()}),TypeError);
 homes[7][0]='dragonfly';homes[7][1]+=.1;assert.throws(()=>createInsects(()=>0,{homes,dragonflyAmbient:rows()}),TypeError);
 assert.throws(()=>createInsects(()=>0,{homes:[['dragonfly',0,0,1]],dragonflyAmbient:rows()}),TypeError);
});

test('input profiles are copied privately and reset does not reread caller mutations or alter phase/home/size',()=>{
 const input=rows(8,9),sim=createInsects(()=>0,{dragonflyAmbient:input}),control=createInsects(()=>0,{dragonflyAmbient:rows(8,9)}),baseline=createInsects();
 assert.deepEqual(sim.items,baseline.items);
 input[0].restSeconds=12;input[0].offsetSeconds=0;input.splice(1);input.push({});
 for(let n=0;n<200;n++){sim.update(.1);control.update(.1);}assert.deepEqual(sim.items,control.items);
 sim.reset();control.reset();for(let n=0;n<200;n++){sim.update(.1);control.update(.1);}assert.deepEqual(sim.items,control.items);
 for(const item of flies(sim)){const old=baseline.items.find(i=>i.id===item.id);assert.equal(item.phase,old.phase);assert.deepEqual(item.home,old.home);assert.equal(item.sizePermille,old.sizePermille);}
});

test('all six IDs × five rest choices × four frame steps obey flight/rest boundary and identical geometric target with finite smoothing',()=>{
 let samples=0;
 for(const rest of [8,9,10,11,12])for(const dt of [1/30,1/60,1/120,.1]){
  const offset=rest-.05,sim=createInsects(()=>0,{dragonflyAmbient:rows(rest,offset)});
  for(let n=0;n<Math.ceil((rest+6+2)/dt);n++){
   const before=flies(sim).map(position);sim.update(dt);
   const cycle=(sim.time+offset)%(rest+6),flying=cycle>rest;
   for(const [index,item] of flies(sim).entries()){
    samples++;assert.equal(item.state,flying?'flying':'resting');assert.equal(item.resting,!flying);
    const u=(cycle-rest)/6,envelope=Math.sin(u*Math.PI),target={...item.home};
    if(flying){target.x+=Math.cos(u*Math.PI*2+item.phase)*2.2*envelope;target.z+=Math.sin(u*Math.PI*2+item.phase)*2.2*envelope;target.y+=envelope*(.35+.14*Math.sin(u*Math.PI*4));}
    const smoothing=1-Math.exp(-dt*5);
    for(const axis of ['x','y','z']){assert.ok(Number.isFinite(item[axis]));assert.ok(Math.abs(item[axis]-(before[index][axis]+(target[axis]-before[index][axis])*smoothing))<1e-12);}
    if(!flying&&cycle>3&&sim.time>7)assert.ok(distance(item,item.home)<1e-5,'resting residual converges; not instantaneous contact');
   }
  }
 }
 assert.ok(samples>100000);
});

test('exact boundary and dt clamp: cycle === rest is resting, above is flying, period wrap returns; invalid/large dt preserves existing clamp',()=>{
 for(const rest of [8,9,10,11,12])for(const offset of [0,rest,rest+3,rest+6-1e-6]){
  const sim=createInsects(()=>0,{dragonflyAmbient:rows(rest,offset)});sim.update(0);
  assert.ok(flies(sim).every(i=>i.resting===(offset<=rest)));
  sim.update(.001);const cycle=(.001+offset)%(rest+6);assert.ok(flies(sim).every(i=>i.resting===(cycle<=rest)));
 }
 const a=createInsects(()=>0,{dragonflyAmbient:rows(8,9)}),b=createInsects(()=>0,{dragonflyAmbient:rows(8,9)});
 for(const dt of [NaN,Infinity,-1,0,1,100]){a.update(dt);b.update(Number.isFinite(dt)?Math.max(0,Math.min(.1,dt)):0);assert.deepEqual(a.items,b.items);}
});

test('all six airborne captures keep position frozen; release is continuous and excursion/settling outrank ambient',()=>{
 for(const id of ids)for(const dt of [1/30,1/60,1/120,.1]){
  const sim=createInsects(()=>0,{dragonflyAmbient:rows(8,10)});advance(sim,.5,dt);const item=sim.items.find(i=>i.id===id);
  assert.equal(item.state,'flying');const p={x:item.x,y:item.y,z:item.z+1,speed:0,quiet:true},aim={x:0,y:0,z:-1};
  assert.equal(sim.swing(p,aim).item.id,id);const held=position(item);advance(sim,7,dt);assert.deepEqual(position(item),held);
  assert.equal(sim.release(p).id,id);assert.deepEqual(position(item),held);assert.equal(item.state,'released');assert.ok(item.excursion);
  let ended=false,settlingObserved=false,ambientDuringSettling=false,settledNear=false;
  for(let n=0;n<Math.ceil(16/dt);n++){
   const previous=position(item);sim.update(dt);assert.ok(distance(item,previous)<(item.excursion||item.settleUntil>sim.time?.6:1),'bounded smoothed motion; ambient may resume mid-loop after settling');assert.ok(Object.values(position(item)).every(Number.isFinite));
   if(item.excursion)assert.ok(['released','landing'].includes(item.state));
   else if(item.settleUntil>sim.time){ended=true;settlingObserved=true;settledNear ||= distance(item,item.home)<.055;assert.ok(['resting','landing'].includes(item.state));const cycle=(sim.time+10)%14;if(cycle>8)ambientDuringSettling=true;}
   if(ended&&sim.time>=item.settleUntil){assert.ok(settledNear);break;}
  }
  assert.ok(ended&&settlingObserved);assert.ok(ambientDuringSettling,'priority checked while ambient would be in flight');
 }
});

test('profiled dragonflies still warn, depart and settle before resuming ambient; no geometry phase writes',()=>{
 for(const id of ids){
  const sim=createInsects(()=>0,{dragonflyAmbient:rows(12,0)}),item=sim.items.find(i=>i.id===id),phase=item.phase;
  let warned=false,fled=false;
  for(let n=0;n<180;n++){
   const p={x:item.home.x,y:item.home.y,z:item.home.z+Math.max(.2,6-n/60*5.4),speed:5.4,quiet:false};sim.update(1/60,p);
   warned ||= item.awarenessStage==='warning';if(item.excursion){fled=true;assert.ok(warned);assert.equal(item.excursion.reason,'startled');break;}
  }
  assert.ok(warned&&fled);assert.equal(item.departures,1);assert.equal(item.phase,phase);
 }
});

function inverseWetapunga(source) {
 const marker=/^[ \t]*\/\/ WETAPUNGA_BEGIN\n[\s\S]*?^[ \t]*\/\/ WETAPUNGA_END\n/gm,blocks=source.match(marker)||[];
 assert.equal(blocks.length,10,'only ten identified 0.47 additions');
 const normalized=blocks.join('').replace(/(from\s*['"]\.\/[^'"?\n]+)(?:\?[^'"\n]*)?(['"])/g,'$1$2');
 assert.equal(createHash('sha256').update(normalized).digest('hex'),'7d41ae436f3546d99692bf5c487e0c3ab654b416b8b93438f9ea4fd2d381a04d','exact wetapunga-only blocks');
 source=source.replace(marker,'');
 for(const added of [' wetapungaSupports = [],',"|| (item.species==='wetapunga'&&!['finishing','retreating'].includes(item.wetapungaPhase)) "]){assert.equal(source.split(added).length-1,1);source=source.replace(added,'');}
 return source;
}

function inverseDragonflyLanding(source) {
 const marker=/^[ \t]*\/\/ DRAGONFLY_LANDING_BEGIN\n[\s\S]*?^[ \t]*\/\/ DRAGONFLY_LANDING_END\n/gm,blocks=source.match(marker)||[];
 assert.equal(blocks.length,2,'only two identified 0.46 render-only additions');
 assert.equal(createHash('sha256').update(blocks.join('')).digest('hex'),'fc12f729a856a1543b31a5e7c60f402616aba8f3008ac8056a2238b765c0172d','exact 0.46 render-only blocks');
 return source.replace(marker,'');
}

function inverseGiantWaterbug(source) {
 const marker=/^[ \t]*\/\/ GIANT_WATERBUG_BEGIN\n[\s\S]*?^[ \t]*\/\/ GIANT_WATERBUG_END\n/gm,blocks=source.match(marker)||[];
 assert.equal(blocks.length,10,'only ten identified 0.45 additions');
 assert.equal(createHash('sha256').update(blocks.join('').replace(/\?v=[^'"\s]+/g,'')).digest('hex'),'ab8672fea6e4443af29a4a8e051ec669ea05b1215d9df6db3f520f2d4ca4138d','literal new waterbug blocks remain exact');
 source=source.replace(marker,'');
 for(const added of [' giantWaterbugSupports = [],',"|| (item.species==='giantwaterbug'&&item.giantWaterbugPhase==='resting') "]){assert.equal(source.split(added).length-1,1);source=source.replace(added,'');}
 return source;
}

function inverseDragonflyAmbient(source) {
 const replacements = [
  ['individuals = [], dragonflyAmbient = [],', 'individuals = [],'],
  ["  // A timing-only sidecar. Copy owned data; never change identity, size or phase.\n  const dragonflyTimings = new Map();\n  try {\n    if (!Array.isArray(dragonflyAmbient) || Object.getPrototypeOf(dragonflyAmbient) !== Array.prototype || dragonflyAmbient.length > 6 || Reflect.ownKeys(dragonflyAmbient).length !== dragonflyAmbient.length + 1) throw new Error();\n    for (let i = 0; i < dragonflyAmbient.length; i++) {\n      const entry = Object.getOwnPropertyDescriptor(dragonflyAmbient, String(i));\n      if (!entry || !('value' in entry)) throw new Error();\n      const value = entry.value, keys = ['runtimeSlotId','restSeconds','offsetSeconds'];\n      if (!value || ![Object.prototype,null].includes(Object.getPrototypeOf(value)) || Reflect.ownKeys(value).length !== keys.length || !keys.every(key => Object.getOwnPropertyDescriptor(value,key) && 'value' in Object.getOwnPropertyDescriptor(value,key))) throw new Error();\n      const {runtimeSlotId,restSeconds,offsetSeconds} = value;\n      if (typeof runtimeSlotId !== 'string' || !/^insect-(8|9|10|11|12|13)$/.test(runtimeSlotId) || dragonflyTimings.has(runtimeSlotId) || !Number.isInteger(restSeconds) || restSeconds < 8 || restSeconds > 12 || !Number.isFinite(offsetSeconds) || offsetSeconds < 0 || offsetSeconds >= restSeconds + 6) throw new Error();\n      const index = Number(runtimeSlotId.slice(7)) - 1;\n      if (!initialHomes[index] || !homes[index].every((part,j) => initialHomes[index][j] === part)) throw new Error();\n      dragonflyTimings.set(runtimeSlotId, Object.freeze({restSeconds,offsetSeconds}));\n    }\n  } catch { throw new TypeError('Invalid dragonfly ambient profiles'); }\n", ''],
  ["          // Only the six meadow dragonflies may use the timing-only sidecar.\n          const ambient = item.species === 'dragonfly' ? dragonflyTimings.get(item.id) : null;\n          const period = ambient ? ambient.restSeconds + 6 : item.species === 'morpho' ? 22 : item.species === 'butterfly' ? 17 : 15;\n          const cycle = ambient ? (time + ambient.offsetSeconds) % period : (time + (item.beginner ? 0 : item.phase * 2)) % period;\n          const restTime = ambient ? ambient.restSeconds : item.species === 'morpho' ? 13 : item.species === 'butterfly' ? 11 : 9;", "          // Ordinary unprovoked perch / loop timing stays the same as v0.1.5.\n          const period = item.species === 'morpho' ? 22 : item.species === 'butterfly' ? 17 : 15;\n          const cycle = (time + (item.beginner ? 0 : item.phase * 2)) % period;\n          const restTime = item.species === 'morpho' ? 13 : item.species === 'butterfly' ? 11 : 9;"]
 ];
 for (const [added, original] of replacements) {
  assert.equal(source.split(added).length - 1, 1, 'exactly one literal 0.44 timing addition');
  source = source.replace(added, original);
 }
 return source;
}

// Only the two documented render-only fields are excluded from old control-state equality.
function controlState(items) {return items.map(item=>{const copy={...item};if(item.species==='dragonfly'){delete copy.dragonflyArriving;delete copy.dragonflyWingBlend;}return copy;});}

test('literal inverse is frozen 0.43 insects source after import-token normalization; profileless full states match representative old timelines',async()=>{
 // Self-contained archive check: this hash was measured once from frozen
 // 043 3e9ba0b:src/insects.js after removing ONLY relative-import query tokens.
 // No local git history or subprocess is required by the delivered test.
 const current=readFileSync(sourceURL,'utf8'),old=inverseDragonflyAmbient(inverseGiantWaterbug(inverseDragonflyLanding(inverseWetapunga(inverseEuropeIndividuals(current))))).replace(/(from\s*['"]\.\/[^'"?\n]+)(?:\?[^'"\n]*)?(['"])/g,'$1$2');
 assert.equal(createHash('sha256').update(old).digest('hex'),'62787d16ebf04b8fbb7aff63eb87a4a456e07c06c38b1f7c1b756634cbaa2bad','frozen043 source remains exact except import query tokens');
 const rewritten=old.replace(/from\s*(['"])(\.\/[^'"]+)\1/g,(_all,q,path)=>`from ${q}${new URL(path,sourceURL).href}${q}`);
 const {createInsects:oldCreate}=await import(`data:text/javascript;base64,${Buffer.from(rewritten).toString('base64')}`);
 for(const dt of [1/30,1/60,1/120,.1]){
  const modern=createInsects(),legacy=oldCreate();
  for(let n=0;n<Math.ceil(20/dt);n++){
   const player=n*dt<4?{x:18,y:1.4,z:-14+Math.max(.4,6-n*dt*5.4),speed:5.4,quiet:false}:undefined;
   modern.update(dt,player);legacy.update(dt,player);assert.deepEqual(controlState(modern.items),legacy.items);
   if(n===Math.floor(6/dt)){
    for(const sim of [modern,legacy]){const i=sim.items[7],p={x:i.x,y:i.y,z:i.z+1,speed:0,quiet:true};assert.equal(sim.swing(p,{x:0,y:0,z:-1}).ok,true);}
   }
   if(n===Math.floor(7/dt)){modern.release();legacy.release();assert.deepEqual(controlState(modern.items),legacy.items);}
  }
  modern.reset();legacy.reset();assert.deepEqual(controlState(modern.items),legacy.items);
 }
});
