/** Browser-local outings. This key is independent of journals and companions:
 * no migration, deletion, reset, network, natural millimetres or battle stats.
 * Generation happens only for initial persistence or an explicit next outing.
 * A changed outing is exposed only after its complete write/readback succeeds.
 */
export const EXPEDITION_KEY='mushi-expedition-v1';
export const EXPEDITION_VERSION=1;
export const EXPEDITION_SLOTS=Object.freeze([
 {populationSlotId:'hercules-a',species:'hercules',habitat:'tropical',runtimeSlotId:'insect-5'},
 {populationSlotId:'hercules-b',species:'hercules',habitat:'tropical',runtimeSlotId:'insect-6'},
 {populationSlotId:'rhino',species:'rhino',habitat:'night',runtimeSlotId:'insect-4'},
 {populationSlotId:'stag',species:'stag',habitat:'night',runtimeSlotId:'insect-5'},
 {populationSlotId:'metallifer',species:'metallifer',habitat:'understory',runtimeSlotId:'insect-4'}
].map(Object.freeze));
const species=new Set(EXPEDITION_SLOTS.map(s=>s.species));
const topFields=['version','generatorVersion','worldSeed','outingCounter','encounters','measuredEncounterIds','best'];
const encounterFields=['encounterId','species','habitat','runtimeSlotId','populationSlotId','sizePermille','motionSeed','siteIndex','measureVersion'];
const bestFields=['species','sizePermille','encounterId','capturedAt','measureVersion'];
const clone=value=>value===null?null:JSON.parse(JSON.stringify(value));
const integer=(n,min,max=Number.MAX_SAFE_INTEGER)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
const uint=n=>integer(n,0,0xffffffff);
const size=n=>integer(n,1000,1150);
function fields(v,names){return v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===names.length&&Object.keys(v).every(k=>names.includes(k));}
function browserStorage(){try{return globalThis.localStorage??null;}catch{return null;}}
function browserLocks(){try{return globalThis.navigator?.locks??null;}catch{return null;}}
function hasLocks(locks){try{return typeof locks?.request==='function';}catch{return false;}}
function browserSeed(){const bytes=new Uint32Array(1);globalThis.crypto.getRandomValues(bytes);return bytes[0];}
const seedHex=seed=>seed.toString(16).padStart(8,'0');
function idFor(seed,counter,slot){return`g1-${seedHex(seed)}-o${counter}-${slot.habitat}-${slot.populationSlotId}`;}
function idValid(id,seed,counter,speciesId){
 if(typeof id!=='string')return false;
 const match=/^g1-([0-9a-f]{8})-o([1-9][0-9]{0,15})-(tropical|night|understory)-(hercules-a|hercules-b|rhino|stag|metallifer)$/.exec(id);
 if(!match||match[1]!==seedHex(seed)||!integer(Number(match[2]),1,counter))return false;
 return EXPEDITION_SLOTS.some(slot=>slot.species===speciesId&&slot.habitat===match[3]&&slot.populationSlotId===match[4]);
}
// Explicit purpose strings isolate site, size band/value, and motion. A change
// in how many values rendering consumes cannot consume another purpose's draw.
function draw(seed,counter,slot,purpose){
 const input=`g1/${seedHex(seed)}/${counter}/${slot}/${purpose}`;let h=0x811c9dc5;
 for(let i=0;i<input.length;i++){h^=input.charCodeAt(i);h=Math.imul(h,0x01000193);}
 h^=h>>>16;h=Math.imul(h,0x7feb352d);h^=h>>>15;h=Math.imul(h,0x846ca68b);return(h^(h>>>16))>>>0;
}
function generate(seed,counter,best=[]){
 const encounters=EXPEDITION_SLOTS.map(slot=>{
  // Approximately 10% above 1125 is game tuning, NOT a natural distribution.
  const tail=draw(seed,counter,slot.populationSlotId,'size-band')%10===0;
  const n=draw(seed,counter,slot.populationSlotId,'size-value');
  return{encounterId:idFor(seed,counter,slot),species:slot.species,habitat:slot.habitat,runtimeSlotId:slot.runtimeSlotId,populationSlotId:slot.populationSlotId,sizePermille:tail?1126+n%25:1000+n%126,motionSeed:draw(seed,counter,slot.populationSlotId,'motion'),siteIndex:draw(seed,counter,slot.populationSlotId,'site')%3,measureVersion:1};
 });
 return{version:1,generatorVersion:1,worldSeed:seed,outingCounter:counter,encounters,measuredEncounterIds:[],best:clone(best)};
}
function valid(data){
 if(!fields(data,topFields)||data.version!==1||data.generatorVersion!==1||!uint(data.worldSeed)||!integer(data.outingCounter,1)||!Array.isArray(data.encounters)||data.encounters.length!==5||!Array.isArray(data.measuredEncounterIds)||data.measuredEncounterIds.length>5||!Array.isArray(data.best)||data.best.length>4)return false;
 if(!data.encounters.every((entry,i)=>{
  const slot=EXPEDITION_SLOTS[i];return fields(entry,encounterFields)&&Object.keys(slot).every(k=>entry[k]===slot[k])&&entry.encounterId===idFor(data.worldSeed,data.outingCounter,slot)&&size(entry.sizePermille)&&uint(entry.motionSeed)&&integer(entry.siteIndex,0,2)&&entry.measureVersion===1;
 }))return false;
 const measured=new Set(data.measuredEncounterIds);
 if(measured.size!==data.measuredEncounterIds.length||data.measuredEncounterIds.some(id=>!data.encounters.some(e=>e.encounterId===id)))return false;
 const seen=new Set();
 if(!data.best.every(record=>{
  if(!fields(record,bestFields)||!species.has(record.species)||seen.has(record.species)||!size(record.sizePermille)||!integer(record.capturedAt,0)||record.measureVersion!==1||!idValid(record.encounterId,data.worldSeed,data.outingCounter,record.species))return false;
  seen.add(record.species);const current=data.encounters.find(e=>e.encounterId===record.encounterId);
  return !current||(current.sizePermille===record.sizePermille&&measured.has(current.encounterId));
 }))return false;
 // A measured current individual cannot have disappeared from the maximum.
 return data.encounters.filter(e=>measured.has(e.encounterId)).every(e=>data.best.some(b=>b.species===e.species&&b.sizePermille>=e.sizePermille));
}
function parse(raw){try{if(typeof raw!=='string'||raw.length>16384)return null;const data=JSON.parse(raw);return valid(data)?data:null;}catch{return null;}}
function read(storage){try{if(!storage)return{kind:'unavailable',raw:undefined,data:null};const raw=storage.getItem(EXPEDITION_KEY);if(raw===null)return{kind:'empty',raw,data:null};const data=parse(raw);return{kind:data?'valid':'invalid',raw,data};}catch{return{kind:'unavailable',raw:undefined,data:null};}}

/** snapshot is detached; null means caller must use the legacy fixed world.
 * measure(id) changes memory once; flush() waits/retries safe persistence only.
 * beginNextOuting(expectedCounter?) is async and cannot discard unsaved measures.
 * No storage event automatically changes the currently visible outing.
 */
export function createExpedition(storage=browserStorage(),{locks=browserLocks(),seedSource=browserSeed,now=Date.now}={}){
 const initial=read(storage);let data=clone(initial.data),baselineRaw=initial.raw,initialCandidate=null;
 let revision=0,persistedRevision=0,readOnly=initial.kind==='invalid';
 let saved=initial.kind==='valid'&&hasLocks(locks),reason=initial.kind==='invalid'?'invalid-data':initial.kind==='unavailable'?'storage-unavailable':!hasLocks(locks)?'missing-locks':saved?null:'pending';
 let task=null,transitionTask=null,transitioning=false,requested=false,lastResult={ok:saved,reason,revision:0};
 const listeners=new Set();
 const pending=()=>!!task||transitioning;
 const status=()=>({saved:saved&&!pending(),pending:pending(),reason});
 function notify(){for(const fn of [...listeners])try{fn(status());}catch{/* Views cannot change commit results. */}}
 function blocked(){return readOnly?reason==='invalid-data'?'invalid-data':reason==='storage-uncertain'?'storage-uncertain':'conflict':!storage?'storage-unavailable':!hasLocks(locks)?'missing-locks':null;}
 function protection(why){if(['invalid-data','conflict','storage-uncertain'].includes(why))readOnly=true;reason=why;return{ok:false,reason:why};}
 // Native localStorage replaces a whole value atomically. Check raw bytes inside
 // the Web Lock, and check outcome even if an instrumented setItem throws after
 // writing. An unreadable/foreign outcome is never blindly retried or rolled back.
 function write(candidate){
  const raw=JSON.stringify(candidate);let thrown=false;
  try{storage.setItem(EXPEDITION_KEY,raw);}catch{thrown=true;}
  let observed;try{observed=storage.getItem(EXPEDITION_KEY);}catch{return protection('storage-uncertain');}
  if(observed===raw)return{ok:true,raw};
  if(observed===baselineRaw)return{ok:false,reason:'storage-error'};
  return protection(thrown?'storage-uncertain':'conflict');
 }
 function attempt(){
  const why=blocked();if(why)return{ok:false,reason:why};
  let found;try{found=storage.getItem(EXPEDITION_KEY);}catch{return{ok:false,reason:'storage-unavailable'};}
  if(data===null){
   // Only an unexposed initial instance can adopt an already-saved other tab.
   if(found!==null){const accepted=parse(found);if(!accepted)return protection('invalid-data');return{ok:true,revision,initialData:clone(accepted),raw:found};}
   if(baselineRaw!==null&&baselineRaw!==undefined)return protection('conflict');
   baselineRaw=null;
   if(!initialCandidate){let seed;try{seed=seedSource();}catch{return{ok:false,reason:'seed-unavailable'};}if(!uint(seed))return{ok:false,reason:'seed-unavailable'};initialCandidate=generate(seed,1);}
   const result=write(initialCandidate);if(!result.ok)return result;
   return{ok:true,revision,initialData:clone(initialCandidate),raw:result.raw};
  }
  if(found!==baselineRaw)return protection('conflict');
  if(revision===persistedRevision)return{ok:true,revision};
  const atRevision=revision,candidate=clone(data),result=write(candidate);
  if(result.ok)baselineRaw=result.raw;
  return result.ok?{ok:true,revision:atRevision}:result;
 }
 function schedule(){
  saved=false;requested=true;
  if(task){notify();return task;}
  const why=blocked();if(why){requested=false;reason=why;notify();return Promise.resolve(false);}
  reason='pending';
  task=Promise.resolve().then(async()=>{
   do{
    requested=false;
    try{lastResult=await locks.request(EXPEDITION_KEY,{mode:'exclusive'},attempt);if(!lastResult||typeof lastResult.ok!=='boolean')lastResult={ok:false,reason:'lock-error'};}
    catch{lastResult={ok:false,reason:'lock-error'};}
    if(lastResult.ok){if(lastResult.initialData){data=lastResult.initialData;baselineRaw=lastResult.raw;initialCandidate=null;}persistedRevision=lastResult.revision;}
   }while(requested&&!readOnly);
  }).catch(()=>{lastResult={ok:false,reason:'storage-error'};}).finally(()=>{
   task=null;
   if(requested&&!readOnly){schedule();return;}
   saved=!!lastResult.ok&&data!==null&&persistedRevision===revision;reason=saved?null:lastResult.reason||'pending';notify();
  });
  notify();return task;
 }
 async function flushMeasurements(){if(!task&&!saved)schedule();while(task)await task;return saved;}
 const api={
  get snapshot(){return clone(data);},get saved(){return saved&&!pending();},get pending(){return pending();},get reason(){return reason;},
  subscribe(fn){if(typeof fn!=='function')throw new TypeError('Expedition listener must be a function');listeners.add(fn);try{fn(status());}catch{}return()=>listeners.delete(fn);},
  async flush(){if(transitionTask){await transitionTask;return saved;}return flushMeasurements();},
  measure(encounterId){
   if(transitioning)return{ok:false,reason:'busy'};
   const entry=data?.encounters.find(e=>e.encounterId===encounterId);
   if(!entry)return{ok:false,reason:data?'invalid-encounter':'not-ready'};
   const previous=data.best.find(b=>b.species===entry.species);
   if(data.measuredEncounterIds.includes(encounterId))return{ok:true,alreadyMeasured:true,newRecord:false,entry:clone(entry),best:clone(previous),saved};
   let time;try{time=now();}catch{return{ok:false,reason:'invalid-time'};}if(!integer(time,0))return{ok:false,reason:'invalid-time'};
   const newRecord=!previous||entry.sizePermille>previous.sizePermille;
   data.measuredEncounterIds.push(encounterId);
   if(newRecord){const record={species:entry.species,sizePermille:entry.sizePermille,encounterId,capturedAt:time,measureVersion:1};if(previous)data.best[data.best.indexOf(previous)]=record;else data.best.push(record);}
   revision++;schedule();return{ok:true,alreadyMeasured:false,newRecord,entry:clone(entry),best:clone(data.best.find(b=>b.species===entry.species)),saved:false};
  },
  beginNextOuting(expectedCounter=data?.outingCounter){
   if(transitioning)return Promise.resolve({ok:false,reason:'busy',snapshot:clone(data)});
   if(!data)return Promise.resolve({ok:false,reason:'not-ready',snapshot:null});
   if(!integer(expectedCounter,1)||expectedCounter!==data.outingCounter)return Promise.resolve({ok:false,reason:'invalid-counter',snapshot:clone(data)});
   if(expectedCounter===Number.MAX_SAFE_INTEGER)return Promise.resolve({ok:false,reason:'counter-limit',snapshot:clone(data)});
   const why=blocked();if(why)return Promise.resolve({ok:false,reason:why,snapshot:clone(data)});
   transitioning=true;reason='pending';
   transitionTask=Promise.resolve().then(async()=>{
    if(!await flushMeasurements())return{ok:false,reason:reason||'storage-error',snapshot:clone(data)};
    saved=false;reason='pending';notify();
    let result,writeVerified=false;
    try{result=await locks.request(EXPEDITION_KEY,{mode:'exclusive'},()=>{
     if(data.outingCounter!==expectedCounter)return{ok:false,reason:'invalid-counter'};
     let raw;try{raw=storage.getItem(EXPEDITION_KEY);}catch{return{ok:false,reason:'storage-unavailable'};}
     if(raw!==baselineRaw)return protection('conflict');
     const candidate=generate(data.worldSeed,expectedCounter+1,data.best),committed=write(candidate);
     if(!committed.ok)return committed;
     writeVerified=true;return{ok:true,candidate,raw:committed.raw};
    });if(!result||typeof result.ok!=='boolean'||result.ok&&!result.candidate)result=writeVerified?protection('storage-uncertain'):{ok:false,reason:'lock-error'};}
    catch{result=writeVerified?protection('storage-uncertain'):{ok:false,reason:'lock-error'};}
    if(result.ok){data=result.candidate;baselineRaw=result.raw;revision++;persistedRevision=revision;}
    saved=!!result.ok;reason=saved?null:result.reason||'storage-error';return{ok:!!result.ok,reason,snapshot:clone(data)};
   }).finally(()=>{transitionTask=null;transitioning=false;notify();});
   notify();
   return transitionTask;
  }
 };
 if(initial.kind==='empty'&&storage&&hasLocks(locks))schedule();
 return api;
}
