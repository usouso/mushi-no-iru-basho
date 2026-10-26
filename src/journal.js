/** Browser-local field notes. No accounts, network, game-state effects or deletion.
 * v1 is read once for migration and is NEVER changed. Once v2 exists, later edits
 * made by an old client remain in v1; they are deliberately not auto-merged.
 * Render plain text with textContent/value, never HTML.
 */
export const JOURNAL_KEY = 'mushi-journal-v2';
export const LEGACY_JOURNAL_KEY = 'mushi-journal-v1';
export const JOURNAL_VERSION = 2;
export const NOTE_LIMIT = 500;
const speciesIds = new Set(['butterfly', 'dragonfly', 'cicada', 'morpho', 'grasshopper', 'hercules', 'leafinsect', 'waterstrider', 'leafcutterant', 'firefly', 'dungbeetle', 'divingbeetle', 'mantis', 'ladybird', 'rhino', 'stag', 'bee', 'swallowtail', 'jewel', 'longhorn', 'metallifer', 'atlas', 'giantstag']);
const entryFields = ['species','firstSeen','lastSeen','location','x','z','note'];
const text = (value, limit) => typeof value === 'string' ? value.slice(0, limit) : '';
const timestamp = value => Number.isSafeInteger(value) && value >= 0;
const coordinate = value => Number.isFinite(value) ? value : null;
const copyEntries = entries => entries.map(entry => ({ ...entry }));
function browserStorage(){try{return globalThis.localStorage??null;}catch{return null;}}
function browserLocks(){try{return globalThis.navigator?.locks??null;}catch{return null;}}
function hasLocks(locks){try{return typeof locks?.request==='function';}catch{return false;}}
function fields(value,names){return value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===names.length&&Object.keys(value).every(key=>names.includes(key));}
// A safe read-only preview is distinct from lossless acceptance for writing.
function normalizeEntries(entries){
 if(!Array.isArray(entries))return [];
 const result=[],seen=new Set();
 for(const entry of entries){
  if(!entry||!speciesIds.has(entry.species)||seen.has(entry.species)||!timestamp(entry.firstSeen)||!timestamp(entry.lastSeen)||entry.lastSeen<entry.firstSeen)continue;
  seen.add(entry.species);result.push({species:entry.species,firstSeen:entry.firstSeen,lastSeen:entry.lastSeen,location:text(entry.location,120),x:coordinate(entry.x),z:coordinate(entry.z),note:text(entry.note,NOTE_LIMIT)});
  if(result.length===speciesIds.size)break;
 }
 return result;
}
function validEntries(entries){
 if(!Array.isArray(entries)||entries.length>speciesIds.size)return false;
 const seen=new Set();
 return entries.every(entry=>{
  if(!fields(entry,entryFields)||!speciesIds.has(entry.species)||seen.has(entry.species)||!timestamp(entry.firstSeen)||!timestamp(entry.lastSeen)||entry.lastSeen<entry.firstSeen||typeof entry.location!=='string'||entry.location.length>120||typeof entry.note!=='string'||entry.note.length>NOTE_LIMIT||!(entry.x===null||Number.isFinite(entry.x))||!(entry.z===null||Number.isFinite(entry.z)))return false;
  seen.add(entry.species);return true;
 });
}
function parse(raw,legacy=false){
 try{
  if(typeof raw!=='string'||raw.length>20000)return {valid:false,entries:[]};
  const data=JSON.parse(raw),version=legacy?1:JOURNAL_VERSION;
  if(!data||data.version!==version||!Array.isArray(data.entries))return {valid:false,entries:[]};
  return {entries:normalizeEntries(data.entries),valid:fields(data,legacy?['version','entries']:['version','legacyImportDone','entries'])&&(legacy||data.legacyImportDone===true)&&validEntries(data.entries)};
 }catch{return {valid:false,entries:[]};}
}
function readState(storage){
 try{
  if(!storage)return {kind:'unavailable',entries:[],saved:false};
  const raw=storage.getItem(JOURNAL_KEY);
  // Presence, including corrupt/future data, forbids fallback to the old key.
  if(raw!==null){const data=parse(raw);return {...data,kind:data.valid?'new':'invalid',newRaw:raw,entries:data.entries,saved:data.valid};}
  const legacyRaw=storage.getItem(LEGACY_JOURNAL_KEY);
  if(legacyRaw===null)return {kind:'empty',newRaw:null,legacyRaw:null,entries:[],saved:true};
  const data=parse(legacyRaw,true);return {...data,kind:data.valid?'legacy':'invalid',newRaw:null,legacyRaw,entries:data.entries,saved:false};
 }catch{return {kind:'unavailable',entries:[],saved:false};}
}
const payload=entries=>JSON.stringify({version:JOURNAL_VERSION,legacyImportDone:true,entries});
/** Reading never writes, including legacy migration. */
export function loadJournal(storage=browserStorage()){
 const result=readState(storage);return {entries:copyEntries(result.entries),saved:result.saved};
}
/** Explicit full-snapshot persistence also requires the same exclusive lock.
 * Returns Promise<boolean>; never falls back to an unsafe synchronous write.
 * Omitting an existing species is rejected: this module has no delete operation.
 */
export async function saveJournal(entries,storage=browserStorage(),{locks=browserLocks()}={}){
 try{
  if(!storage||!hasLocks(locks)||!validEntries(entries))return false;
  const snapshot=copyEntries(entries),baseline=readState(storage);
  if(!['new','legacy','empty'].includes(baseline.kind)||baseline.entries.some(old=>!snapshot.some(entry=>entry.species===old.species)))return false;
  return await locks.request(JOURNAL_KEY,{mode:'exclusive'},()=>{
   if(storage.getItem(JOURNAL_KEY)!==baseline.newRaw)return false;
   if(baseline.newRaw===null&&storage.getItem(LEGACY_JOURNAL_KEY)!==baseline.legacyRaw)return false;
   storage.setItem(JOURNAL_KEY,payload(snapshot));return true;
  })===true;
 }catch{return false;}
}
/**
 * record/setNote mutate detached in-memory notes synchronously. Persistence is
 * asynchronous and coalesced. flush() waits for completion (or retries failure);
 * subscribe(listener) returns an unsubscribe function and reports status only.
 * No pending write is reported as saved, including at page close. Web Locks is
 * mandatory: unsupported/blocked environments stay usable in memory only.
 */
export function createJournal(storage=browserStorage(),{now=Date.now,locks=browserLocks()}={}){
 let baseline=readState(storage),entries=copyEntries(baseline.entries),revision=0,persistedRevision=baseline.kind==='new'||baseline.kind==='empty'?0:-1;
 let trusted=['new','legacy','empty'].includes(baseline.kind),readOnly=baseline.kind==='invalid',needsMigration=baseline.kind==='legacy';
 let saved=baseline.saved&&hasLocks(locks),pending=false,task=null,requested=false,lastSuccess=false;
 const listeners=new Set();
 function notify(){for(const listener of [...listeners]){try{listener({saved,pending});}catch{/* A view cannot defeat persistence. */}}}
 function adopt(state){baseline=state;trusted=true;entries=copyEntries(state.entries);needsMigration=state.kind==='legacy';if(state.kind==='new'||state.kind==='empty')persistedRevision=revision;}
 // Entire critical section is synchronous. Every cooperating v2 writer uses
 // the same lock; no network/decode/UI callback or nested await is held inside.
 function attempt(){
  if(readOnly||!storage)return {ok:false};
  if(!trusted){
   const state=readState(storage);
   if(state.kind==='invalid'){readOnly=true;return {ok:false};}
   if(!['new','legacy','empty'].includes(state.kind))return {ok:false};
   // A failed initial read is NOT proof that storage was empty. Never replace
   // recovered notes with the user's unrelated in-memory edits.
   if(revision>0&&state.kind!=='empty')return {ok:false};
   if(revision===0)adopt(state);else{baseline=state;trusted=true;}
  }
  const raw=storage.getItem(JOURNAL_KEY);
  if(raw!==baseline.newRaw){
   // Another tab may have finished the same migration while this one waited.
   // Adopting is safe only before this instance has any local edits.
   if(needsMigration&&revision===0&&raw!==null){const data=parse(raw);if(data.valid){adopt({...data,kind:'new',newRaw:raw,saved:true});return {ok:true,revision};}}
   return {ok:false};
  }
  if(raw===null){
   const legacyRaw=storage.getItem(LEGACY_JOURNAL_KEY);
   if(legacyRaw!==baseline.legacyRaw){
    // Old clients do not take our lock. Re-read immediately before migration;
    // only an untouched instance may adopt their newer, valid legacy snapshot.
    const data=needsMigration&&revision===0?parse(legacyRaw,true):null;
    if(!data?.valid)return {ok:false};
    adopt({...data,kind:'legacy',newRaw:null,legacyRaw,saved:false});
   }
  }
  if(!needsMigration&&persistedRevision===revision)return {ok:true,revision};
  const atRevision=revision,serialized=payload(entries);
  storage.setItem(JOURNAL_KEY,serialized);
  baseline={kind:'new',newRaw:serialized,entries:copyEntries(entries),saved:true};trusted=true;needsMigration=false;
  return {ok:true,revision:atRevision};
 }
 function schedule(){
  saved=false;requested=true;
  if(task){notify();return task;}
  if(readOnly||!storage||!hasLocks(locks)){requested=false;notify();return Promise.resolve(false);}
  pending=true;
  task=Promise.resolve().then(async()=>{
   do{
    requested=false;let result;
    try{result=await locks.request(JOURNAL_KEY,{mode:'exclusive'},attempt);}catch{result={ok:false};}
    if(result?.ok)persistedRevision=result.revision;
    lastSuccess=!!result?.ok;
    // The current lock promise must settle before announcing success.
    // Edits made while waiting request one further pass with the latest snapshot.
   }while(requested&&!readOnly);
  }).catch(()=>{lastSuccess=false;}).finally(()=>{
   task=null;pending=false;
   // An edit can arrive between the drain's last continuation and this finally.
   // Do not drop that request or announce a stale snapshot as saved.
   if(requested&&!readOnly){schedule();return;}
   saved=lastSuccess&&persistedRevision===revision;notify();
  });
  notify();return task;
 }
 function changed(entry){revision++;schedule();return {...entry};}
 const journal={
  get entries(){return copyEntries(entries);},get saved(){return saved;},get pending(){return pending;},
  async flush(){if(!task&&!saved)schedule();while(task)await task;return saved;},
  subscribe(listener){if(typeof listener!=='function')throw new TypeError('Journal listener must be a function');listeners.add(listener);try{listener({saved,pending});}catch{}return ()=>listeners.delete(listener);},
  record({species,location,x,z}={}){
   if(!speciesIds.has(species))return null;const time=now();if(!timestamp(time))return null;
   let entry=entries.find(item=>item.species===species);
   if(!entry){entry={species,firstSeen:time,lastSeen:time,location:'',x:null,z:null,note:''};entries.push(entry);}
   entry.lastSeen=Math.max(entry.lastSeen,time);entry.location=text(location,120);entry.x=coordinate(x);entry.z=coordinate(z);return changed(entry);
  },
  setNote(species,note){const entry=entries.find(item=>item.species===species);if(!entry||typeof note!=='string')return null;entry.note=text(note,NOTE_LIMIT);return changed(entry);}
 };
 if(needsMigration)schedule();return journal;
}
