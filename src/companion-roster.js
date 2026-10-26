/** Browser-local companions, deliberately separate from the encounter journal.
 * No journal migration, automatic ownership, deletion/reset API, or battle stats.
 * The caller must only add the currently captured insect after explicit Keep.
 * Persistence requires Web Locks; failures retain session ownership, never claim
 * durability, and never overwrite unknown/corrupt/conflicting original bytes.
 */
export const COMPANION_KEY = 'mushi-companions-v1';
export const COMPANION_VERSION = 1;
export const COMPANION_SPECIES = Object.freeze(['hercules', 'rhino', 'stag']);
const origins = Object.freeze({hercules:'tropical',rhino:'night',stag:'night'});
const entryFields = ['id','species','originHabitat','originIndividualId','capturedAt'];
const copy = entries => entries.map(entry => ({...entry}));
const timestamp = value => Number.isSafeInteger(value) && value >= 0;
function own(object,key){return Object.prototype.hasOwnProperty.call(object,key);}
export function isCompanionSpecies(species){return typeof species === 'string' && own(origins,species);}
function fields(value,names){return value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === names.length && Object.keys(value).every(key=>names.includes(key));}
function originValid(entry){return isCompanionSpecies(entry?.species) && entry.originHabitat === origins[entry.species] && typeof entry.originIndividualId === 'string' && /^insect-[1-9]\d{0,5}$/.test(entry.originIndividualId);}
function entryValid(entry){return fields(entry,entryFields) && originValid(entry) && entry.id === `${entry.originHabitat}/${entry.originIndividualId}` && timestamp(entry.capturedAt);}
function entriesValid(entries){
 if(!Array.isArray(entries) || entries.length > COMPANION_SPECIES.length)return false;
 const ids=new Set(),species=new Set();
 return entries.every(entry=>{if(!entryValid(entry)||ids.has(entry.id)||species.has(entry.species))return false;ids.add(entry.id);species.add(entry.species);return true;});
}
function preview(entries){
 if(!Array.isArray(entries))return [];
 const accepted=[],ids=new Set(),species=new Set();
 for(const entry of entries){
  if(!entry || typeof entry !== 'object')continue;
  const item=Object.fromEntries(entryFields.map(key=>[key,entry[key]]));
  if(!entryValid(item)||ids.has(item.id)||species.has(item.species))continue;
  accepted.push(item);ids.add(item.id);species.add(item.species);
  if(accepted.length===COMPANION_SPECIES.length)break;
 }
 return accepted;
}
function parse(raw){
 try{
  if(typeof raw !== 'string' || raw.length>8192)return {valid:false,entries:[]};
  const value=JSON.parse(raw);
  if(value?.version!==COMPANION_VERSION || !Array.isArray(value.entries))return {valid:false,entries:[]};
  return {valid:fields(value,['version','entries']) && entriesValid(value.entries),entries:preview(value.entries)};
 }catch{return {valid:false,entries:[]};}
}
function browserStorage(){try{return globalThis.localStorage??null;}catch{return null;}}
function browserLocks(){try{return globalThis.navigator?.locks??null;}catch{return null;}}
function hasLocks(locks){try{return typeof locks?.request==='function';}catch{return false;}}
function read(storage){
 try{
  if(!storage)return {kind:'unavailable',raw:undefined,entries:[]};
  const raw=storage.getItem(COMPANION_KEY);
  if(raw===null)return {kind:'empty',raw:null,entries:[]};
  const result=parse(raw);return {kind:result.valid?'valid':'invalid',raw,entries:result.entries};
 }catch{return {kind:'unavailable',raw:undefined,entries:[]};}
}
const serialize=entries=>JSON.stringify({version:COMPANION_VERSION,entries});

/**
 * createCompanionRoster(storage?, {now?, locks?})
 * - entries: detached records; at most one per eligible species (3 slots).
 * - add({species, originHabitat, originIndividualId}) / release(id):
 *   {ok:true, entry} or {ok:false, reason}; session state changes synchronously.
 * - saved, pending, reason: persistent status, not acceptance of a Keep click.
 * - subscribe(listener): immediate status plus future changes; returns unsubscribe.
 * - flush(): waits for pending work, or retries a recoverable failed write.
 * Existing raw bytes are compared under one exclusive lock before replacement.
 * Raw conflicts and unknown data stay read-only for this instance. Reloading is
 * not requested automatically, because it would discard session-only changes.
 */
export function createCompanionRoster(storage=browserStorage(),{now=Date.now,locks=browserLocks()}={}){
 let baseline=read(storage),entries=copy(baseline.entries),revision=0,persistedRevision=0;
 let readOnly=baseline.kind==='invalid',trusted=['valid','empty'].includes(baseline.kind);
 let saved=trusted&&hasLocks(locks),pending=false,reason=saved?null:readOnly?'invalid-data':!trusted?'storage-unavailable':'missing-locks';
 let task=null,requested=false,lastResult={ok:saved,revision:0,reason};
 const listeners=new Set();
 const status=()=>({saved,pending,reason});
 function notify(){for(const listener of [...listeners]){try{listener(status());}catch{/* View errors cannot break persistence. */}}}
 function attempt(){
  if(readOnly)return {ok:false,reason:'invalid-data'};
  if(!storage)return {ok:false,reason:'storage-unavailable'};
  if(!trusted){
   const found=read(storage);
   if(found.kind==='invalid'){readOnly=true;return {ok:false,reason:'invalid-data'};}
   if(!['valid','empty'].includes(found.kind))return {ok:false,reason:'storage-unavailable'};
   // A failed initial read does not prove an empty store. Never replace recovered
   // existing companions with unrelated edits made in this session.
   if(revision>0 && found.kind!=='empty')return {ok:false,reason:'conflict'};
   baseline=found;trusted=true;
   if(revision===0){entries=copy(found.entries);persistedRevision=revision;}
  }
  if(storage.getItem(COMPANION_KEY)!==baseline.raw)return {ok:false,reason:'conflict'};
  if(persistedRevision===revision)return {ok:true,revision};
  const atRevision=revision,raw=serialize(entries);
  storage.setItem(COMPANION_KEY,raw);
  if(storage.getItem(COMPANION_KEY)!==raw)return {ok:false,reason:'storage-error'};
  baseline={kind:'valid',raw,entries:copy(entries)};
  return {ok:true,revision:atRevision};
 }
 function schedule(){
  saved=false;requested=true;
  if(task){notify();return task;}
  if(readOnly||!storage||!hasLocks(locks)){
   requested=false;reason=readOnly?'invalid-data':!storage?'storage-unavailable':'missing-locks';notify();return Promise.resolve(false);
  }
  pending=true;reason='pending';
  task=Promise.resolve().then(async()=>{
   do{
    requested=false;
    try{
     lastResult=await locks.request(COMPANION_KEY,{mode:'exclusive'},()=>{
      try{return attempt();}catch{return {ok:false,reason:'storage-error'};}
     });
     if(!lastResult || typeof lastResult.ok!=='boolean')lastResult={ok:false,reason:'lock-error'};
    }catch{lastResult={ok:false,reason:'lock-error'};}
    if(lastResult.ok)persistedRevision=lastResult.revision;
   }while(requested&&!readOnly);
  }).catch(()=>{lastResult={ok:false,reason:'storage-error'};}).finally(()=>{
   task=null;pending=false;
   // An edit can arrive after the drain but before this final continuation.
   if(requested&&!readOnly){schedule();return;}
   saved=lastResult.ok&&persistedRevision===revision;
   reason=saved?null:lastResult.reason||'pending';notify();
  });
  notify();return task;
 }
 function changed(){revision++;schedule();}
 return {
  get entries(){return copy(entries);},get saved(){return saved;},get pending(){return pending;},get reason(){return reason;},
  subscribe(listener){if(typeof listener!=='function')throw new TypeError('Companion listener must be a function');listeners.add(listener);try{listener(status());}catch{}return ()=>listeners.delete(listener);},
  async flush(){if(!task&&!saved)schedule();while(task)await task;return saved;},
  add({species,originHabitat,originIndividualId}={}){
   const origin={species,originHabitat,originIndividualId};
   if(!originValid(origin))return {ok:false,reason:'invalid-capture'};
   if(entries.some(entry=>entry.species===species))return {ok:false,reason:'already-owned'};
   const id=`${originHabitat}/${originIndividualId}`;
   if(entries.some(entry=>entry.id===id))return {ok:false,reason:'origin-owned'};
   let capturedAt;try{capturedAt=now();}catch{return {ok:false,reason:'invalid-time'};}
   if(!timestamp(capturedAt))return {ok:false,reason:'invalid-time'};
   const entry={id,species,originHabitat,originIndividualId,capturedAt};entries.push(entry);changed();return {ok:true,entry:{...entry}};
  },
  release(id){
   const index=entries.findIndex(entry=>entry.id===id);
   if(index<0)return {ok:false,reason:'not-owned'};
   const [entry]=entries.splice(index,1);changed();return {ok:true,entry:{...entry}};
  }
 };
}
