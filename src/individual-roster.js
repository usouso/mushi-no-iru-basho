/** Individually identified companions. v1 bytes are never changed or deleted.
 * A valid v2 store is authoritative: later captures made by an old v1 tab are
 * not imported again. Unknown data/conflicts stay read-only, with session edits
 * still available. Persistence needs Web Locks, not a promise of browser support.
 */
import { COMPANION_KEY as V1_KEY, COMPANION_SPECIES as V1_SPECIES } from './companion-roster.js?v=0.40.0&b=8b1b975eded1';
export const COMPANION_KEY = 'mushi-companions-v2';
export const COMPANION_VERSION = 2;
export const LEGACY_COMPANION_KEY = V1_KEY;
export const COMPANION_SPECIES = Object.freeze([...V1_SPECIES,'atlas','giantstag','elephant','goliath','fivehorn','miyama','euchirus','manticora','rainbowstag']);
const origins = Object.freeze({hercules:'tropical',rhino:'night',stag:'night',metallifer:'understory',atlas:'understory',giantstag:'night',elephant:'tropical',goliath:'forest',fivehorn:'understory',miyama:'meadow',euchirus:'understory',manticora:'savanna',rainbowstag:'australia'});
const legacyFields = ['id','species','originHabitat','originIndividualId','capturedAt'];
const entryFields = [...legacyFields,'originKind','originEncounterId','sizePermille','measureVersion'];
const copy = entries => entries.map(entry => ({...entry}));
const timestamp = value => Number.isSafeInteger(value) && value >= 0;
const own = (object,key) => Object.prototype.hasOwnProperty.call(object,key);
export function isCompanionSpecies(species){return typeof species === 'string' && own(origins,species);}
function fields(value,names){return value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === names.length && Object.keys(value).every(key=>names.includes(key));}
function originValid(entry){return isCompanionSpecies(entry?.species) && entry.originHabitat === origins[entry.species] && typeof entry.originIndividualId === 'string' && /^insect-[1-9]\d{0,5}$/.test(entry.originIndividualId) && (entry.species!=='atlas'||entry.originIndividualId==='insect-5') && (entry.species!=='giantstag'||entry.originIndividualId==='insect-6') && (entry.species!=='elephant'||entry.originIndividualId==='insect-11') && (entry.species!=='goliath'||['insect-1','insect-2'].includes(entry.originIndividualId)) && (entry.species!=='fivehorn'||entry.originIndividualId==='insect-6') && (entry.species!=='miyama'||entry.originIndividualId==='insect-30') && (entry.species!=='euchirus'||entry.originIndividualId==='insect-7') && (entry.species!=='manticora'||entry.originIndividualId==='insect-2') && (entry.species!=='rainbowstag'||entry.originIndividualId==='insect-1');}
function legacyValid(entry){return fields(entry,legacyFields) && V1_SPECIES.includes(entry.species) && originValid(entry) && entry.id === `${entry.originHabitat}/${entry.originIndividualId}` && timestamp(entry.capturedAt);}
function encounterValid(entry){
 if(typeof entry.originEncounterId!=='string')return false;
 if(entry.species==='manticora'){
  const manticora=/^g4-[0-9a-f]{8}-o([1-9][0-9]{0,15})-savanna-manticora$/.exec(entry.originEncounterId);
  return !!manticora&&Number.isSafeInteger(Number(manticora[1]))&&entry.originHabitat==='savanna';
 }
 if(entry.species==='atlas'){
  const atlas=/^g3-[0-9a-f]{8}-o([1-9][0-9]{0,15})-understory-atlas$/.exec(entry.originEncounterId);
  return !!atlas&&Number.isSafeInteger(Number(atlas[1]))&&entry.originHabitat==='understory';
 }
 if(entry.species==='giantstag'){
  const giant=/^g2-[0-9a-f]{8}-o([1-9][0-9]{0,15})-night-giantstag$/.exec(entry.originEncounterId);
  return !!giant&&Number.isSafeInteger(Number(giant[1]))&&entry.originHabitat==='night';
 }
 const match=/^g1-([0-9a-f]{8})-o([1-9][0-9]{0,15})-(tropical|night|understory)-(hercules-a|hercules-b|rhino|stag|metallifer)$/.exec(entry.originEncounterId);
 if(!match||!Number.isSafeInteger(Number(match[2]))||match[3]!==entry.originHabitat)return false;
 const species=match[4].startsWith('hercules-')?'hercules':match[4];
 return species===entry.species&&origins[species]===match[3];
}
function measurementValid(entry){return encounterValid(entry) && Number.isInteger(entry.sizePermille) && entry.sizePermille>=1000 && entry.sizePermille<=1150 && entry.measureVersion===1;}
function entryValid(entry){
 if(!fields(entry,entryFields)||!originValid(entry)||!timestamp(entry.capturedAt))return false;
 if(entry.originKind==='legacy')return entry.id===`${entry.originHabitat}/${entry.originIndividualId}` && entry.originEncounterId===null && entry.sizePermille===null && entry.measureVersion===null;
 return entry.originKind==='expedition' && measurementValid(entry) && entry.id===entry.originEncounterId;
}
const legacyEntry = entry => ({...entry,originKind:'legacy',originEncounterId:null,sizePermille:null,measureVersion:null});
function entriesValid(entries,valid,max=COMPANION_SPECIES.length){
 if(!Array.isArray(entries)||entries.length>max)return false;
 const ids=new Set(),species=new Set();
 return entries.every(entry=>{if(!valid(entry)||ids.has(entry.id)||species.has(entry.species))return false;ids.add(entry.id);species.add(entry.species);return true;});
}
function preview(entries,legacy){
 if(!Array.isArray(entries))return [];
 const accepted=[],ids=new Set(),species=new Set(),names=legacy?legacyFields:entryFields,valid=legacy?legacyValid:entryValid;
 for(const entry of entries){
  if(!entry||typeof entry!=='object')continue;
  const item=Object.fromEntries(names.map(key=>[key,entry[key]]));
  if(!valid(item)||ids.has(item.id)||species.has(item.species))continue;
  accepted.push(legacy?legacyEntry(item):item);ids.add(item.id);species.add(item.species);
  if(accepted.length===(legacy?V1_SPECIES.length:COMPANION_SPECIES.length))break;
 }
 return accepted;
}
function parse(raw,legacy=false){
 try{
  if(typeof raw!=='string'||raw.length>(legacy?8192:16384))return {valid:false,entries:[]};
  const value=JSON.parse(raw);
  if(value?.version!==(legacy?1:2)||!Array.isArray(value.entries))return {valid:false,entries:[]};
  const names=legacy?['version','entries']:['version','legacyImportDone','entries'];
  return {valid:fields(value,names)&&(legacy||value.legacyImportDone===true)&&entriesValid(value.entries,legacy?legacyValid:entryValid,legacy?V1_SPECIES.length:COMPANION_SPECIES.length),entries:preview(value.entries,legacy)};
 }catch{return {valid:false,entries:[]};}
}
function browserStorage(){try{return globalThis.localStorage??null;}catch{return null;}}
function browserLocks(){try{return globalThis.navigator?.locks??null;}catch{return null;}}
function hasLocks(locks){try{return typeof locks?.request==='function';}catch{return false;}}
function read(storage){
 try{
  if(!storage)return {kind:'unavailable',raw:undefined,entries:[]};
  const raw=storage.getItem(COMPANION_KEY);
  if(raw!==null){const result=parse(raw);return {mode:'v2',kind:result.valid?'valid':'invalid',raw,entries:result.entries};}
  const legacyRaw=storage.getItem(LEGACY_COMPANION_KEY);
  if(legacyRaw===null)return {mode:'legacy',kind:'empty',raw:null,legacyRaw:null,entries:[]};
  const result=parse(legacyRaw,true);
  return {mode:'legacy',kind:result.valid?'valid':'invalid',raw:null,legacyRaw,entries:result.entries};
 }catch{return {kind:'unavailable',raw:undefined,entries:[]};}
}
const serialize=entries=>JSON.stringify({version:COMPANION_VERSION,legacyImportDone:true,entries});

/** Same synchronous session API as companion-roster.js, plus replace(id,capture).
 * New captures require originEncounterId, sizePermille (1000..1150), measureVersion:1.
 * Fixed-world fallback captures must explicitly pass originKind:'legacy' and all
 * three measurement fields null; missing measurements never imply a legacy record.
 * replace is one array/revision update, never release-then-add. Old size stays unknown.
 * Initial migration takes v1 then v2 locks, compares both exact source strings,
 * and writes the marker and entries together. Subsequent writes lock only v2.
 */
export function createCompanionRoster(storage=browserStorage(),{now=Date.now,locks=browserLocks()}={}){
 let baseline=read(storage),entries=copy(baseline.entries),revision=0,persistedRevision=0;
 let readOnly=baseline.kind==='invalid'?'invalid-data':null,trusted=['valid','empty'].includes(baseline.kind);
 let saved=trusted&&baseline.mode==='v2'&&hasLocks(locks),pending=false;
 let reason=saved?null:readOnly||(!trusted?'storage-unavailable':!hasLocks(locks)?'missing-locks':'pending');
 let task=null,requested=false,lastResult={ok:saved,revision:0,reason},unverifiedWrite=null;
 const listeners=new Set();
 const status=()=>({saved,pending,reason});
 function notify(){for(const listener of [...listeners]){try{listener(status());}catch{/* View errors cannot break persistence. */}}}
 function conflict(){readOnly='conflict';return {ok:false,reason:readOnly};}
 function attempt(){
  if(readOnly)return {ok:false,reason:readOnly};
  if(!storage)return {ok:false,reason:'storage-unavailable'};
  if(!trusted){
   const found=read(storage);
   if(found.kind==='invalid'){readOnly='invalid-data';if(revision===0)entries=copy(found.entries);return {ok:false,reason:readOnly};}
   if(!['valid','empty'].includes(found.kind))return {ok:false,reason:'storage-unavailable'};
   // Unknown initial state is not evidence of emptiness. Never replace recovered
   // records with unrelated edits made while the first read was blocked.
   if(revision>0&&found.kind!=='empty')return conflict();
   baseline=found;trusted=true;
   if(revision===0){entries=copy(found.entries);persistedRevision=0;}
  }
  const current=storage.getItem(COMPANION_KEY);
  if(unverifiedWrite){
   if(current===unverifiedWrite.raw){
    baseline={mode:'v2',kind:'valid',raw:current,entries:copy(unverifiedWrite.entries)};
    persistedRevision=unverifiedWrite.revision;unverifiedWrite=null;
   }else if(current===baseline.raw){unverifiedWrite=null;}else return conflict();
  }
  if(current!==baseline.raw)return conflict();
  if(baseline.mode==='legacy'&&storage.getItem(LEGACY_COMPANION_KEY)!==baseline.legacyRaw)return conflict();
  if(baseline.mode==='v2'&&persistedRevision===revision)return {ok:true,revision};
  const atRevision=revision,snapshot=copy(entries),raw=serialize(snapshot);
  // A throw after a successful setItem/readback failure has an uncertain outcome.
  // Retain the intended bytes so flush can verify that write before any retry.
  unverifiedWrite={raw,revision:atRevision,entries:snapshot};
  storage.setItem(COMPANION_KEY,raw);
  if(storage.getItem(COMPANION_KEY)!==raw)return {ok:false,reason:'storage-error'};
  baseline={mode:'v2',kind:'valid',raw,entries:snapshot};unverifiedWrite=null;
  return {ok:true,revision:atRevision};
 }
 function schedule(){
  saved=false;requested=true;
  if(task){notify();return task;}
  if(readOnly||!storage||!hasLocks(locks)){
   requested=false;reason=readOnly||(!storage?'storage-unavailable':'missing-locks');notify();return Promise.resolve(false);
  }
  pending=true;reason='pending';
  task=Promise.resolve().then(async()=>{
   do{
    requested=false;
    try{
     const locked=()=>locks.request(COMPANION_KEY,{mode:'exclusive'},()=>{
      try{return attempt();}catch{return {ok:false,reason:'storage-error'};}
     });
     lastResult=baseline.mode==='v2'&&trusted?await locked():await locks.request(LEGACY_COMPANION_KEY,{mode:'exclusive'},locked);
     if(!lastResult||typeof lastResult.ok!=='boolean')lastResult={ok:false,reason:'lock-error'};
    }catch{lastResult={ok:false,reason:'lock-error'};}
    if(lastResult.ok)persistedRevision=lastResult.revision;
   }while(requested&&!readOnly);
  }).catch(()=>{lastResult={ok:false,reason:'storage-error'};}).finally(()=>{
   task=null;pending=false;
   if(requested&&!readOnly){schedule();return;}
   saved=lastResult.ok&&persistedRevision===revision;
   reason=saved?null:lastResult.reason||'pending';notify();
  });
  notify();return task;
 }
 function changed(){revision++;schedule();}
 function captureEntry(capture){
  if(!capture||!originValid(capture))return {ok:false,reason:'invalid-capture'};
  const legacy=capture.originKind==='legacy';
  if(legacy?!(capture.originEncounterId===null&&capture.sizePermille===null&&capture.measureVersion===null):(!measurementValid(capture)||(own(capture,'originKind')&&capture.originKind!=='expedition')))return {ok:false,reason:'invalid-capture'};
  let capturedAt;try{capturedAt=now();}catch{return {ok:false,reason:'invalid-time'};}
  if(!timestamp(capturedAt))return {ok:false,reason:'invalid-time'};
  const {species,originHabitat,originIndividualId,originEncounterId,sizePermille,measureVersion}=capture;
  return {ok:true,entry:{id:legacy?`${originHabitat}/${originIndividualId}`:originEncounterId,species,originHabitat,originIndividualId,capturedAt,originKind:legacy?'legacy':'expedition',originEncounterId,sizePermille,measureVersion}};
 }
 const api={
  get entries(){return copy(entries);},get saved(){return saved;},get pending(){return pending;},get reason(){return reason;},
  subscribe(listener){if(typeof listener!=='function')throw new TypeError('Companion listener must be a function');listeners.add(listener);try{listener(status());}catch{}return ()=>listeners.delete(listener);},
  async flush(){if(!task&&!saved)schedule();while(task)await task;return saved;},
  add(capture){
   const result=captureEntry(capture);if(!result.ok)return result;
   if(entries.some(entry=>entry.species===result.entry.species))return {ok:false,reason:'already-owned'};
   if(entries.some(entry=>entry.id===result.entry.id))return {ok:false,reason:'origin-owned'};
   entries.push(result.entry);changed();return {ok:true,entry:{...result.entry}};
  },
  replace(id,capture){
   const index=entries.findIndex(entry=>entry.id===id);
   if(index<0)return {ok:false,reason:'not-owned'};
   const result=captureEntry(capture);if(!result.ok)return result;
   if(result.entry.species!==entries[index].species)return {ok:false,reason:'species-mismatch'};
   if(result.entry.id===id)return {ok:false,reason:'same-individual'};
   if(entries.some(entry=>entry.id===result.entry.id))return {ok:false,reason:'origin-owned'};
   const replacedEntry=entries[index];entries[index]=result.entry;changed();
   return {ok:true,entry:{...result.entry},replacedEntry:{...replacedEntry}};
  },
  release(id){
   const index=entries.findIndex(entry=>entry.id===id);
   if(index<0)return {ok:false,reason:'not-owned'};
   const [entry]=entries.splice(index,1);changed();return {ok:true,entry:{...entry}};
  }
 };
 if(trusted&&!readOnly&&baseline.mode==='legacy'&&hasLocks(locks))schedule();
 return api;
}
