/** Current064 aggregate: explicit 39 species / 16 battle species / 68 field individuals.
 * Three current-inventory entry points, not a full-browser release verdict.
 * Real main/modules/Three geometry; DOM/WebGL/MapStorage/Web Locks/WebAudio doubles.
 * Registration uses successful-swing stubs (NOT 39 physical captures). Audio
 * decode is a scheduling double (NOT a codec, actual listening or autoplay test).
 * Kept separate from historical 29/30/7-count tests; no old golden is weakened.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createIntegratedAudioMock} from './fixtures/integrated-audio-mock.mjs';
const root=path.resolve(import.meta.dirname,'..');
const SPECIES_37=Object.freeze(['butterfly','dragonfly','cicada','morpho','grasshopper','hercules','leafinsect','waterstrider','leafcutterant','firefly','dungbeetle','divingbeetle','mantis','ladybird','rhino','stag','bee','swallowtail','jewel','longhorn','metallifer','atlas','giantstag','elephant','goliath','fivehorn','miyama','euchirus','manticora','rainbowstag','europestag','giantwaterbug','wetapunga','giraffestag','tigerbeetle','orchidmantis','xylotrupes']);
const SPECIES_38=Object.freeze([...SPECIES_37,'anax']);
const SPECIES_39=Object.freeze([...SPECIES_38,'moonmoth']);
const BATTLE_16=Object.freeze(['hercules','rhino','stag','metallifer','atlas','giantstag','elephant','goliath','fivehorn','miyama','euchirus','manticora','rainbowstag','europestag','giraffestag','xylotrupes']);
const POPULATION_10=Object.freeze({meadow:33,tropical:11,understory:8,night:7,savanna:2,forest:2,australia:2,newzealand:1,europe:1,flores:1});
const HABITATS_10=Object.freeze(['meadow','tropical','understory','night','savanna','forest','australia','newzealand','europe','flores']);
const AUDIO_13=Object.freeze(['bgm_temperate_preview_01.ogg','insect_aburazemi_call_01.ogg','insect_grasshopper_takeoff_01.ogg','insect_grasshopper_takeoff_02.ogg','insect_grasshopper_landing_01.ogg','insect_grasshopper_landing_02.ogg','insect_beetle_walk_01.ogg','insect_beetle_walk_02.ogg','insect_beetle_walk_03.ogg','sfx_net_swing_01.ogg','sfx_net_swing_02.ogg','sfx_net_swing_03.ogg','sfx_capture_01.ogg']);
const JOURNAL='mushi-journal-v2',LEGACY_JOURNAL='mushi-journal-v1',EXPEDITION='mushi-expedition-v2',ROSTER='mushi-companions-v2',modern=entries=>JSON.stringify({version:2,legacyImportDone:true,entries}),sorted=a=>[...a].sort();

// Reuse only the existing helper prefix; its historical tests never execute.
const original=fs.readFileSync(path.join(root,'tests/companions-main.test.mjs'),'utf8'),marker='\nconst legacy=';
assert.equal(original.split(marker).length-1,1,'known companion helper boundary');
let factory=original.slice(0,original.indexOf(marker)).replace("const root=path.resolve(import.meta.dirname,'..');",`const root=${JSON.stringify(root)};`);
const beforeImport=" const h=await import('data:text/javascript;base64,'";
assert.equal(factory.split(beforeImport).length-1,1);
const audioHook=`
 const audioAnchor='window.AudioContext=AudioContext;';assert.equal(source.split(audioAnchor).length-1,1);
 source=source.replace(audioAnchor,"if(globalThis.__aggregateAudioTest){window.AudioContext=globalThis.__aggregateAudioTest.AudioContext;window.fetch=globalThis.__aggregateAudioTest.fetch;window.location={href:'https://game.invalid/play/index.html',origin:'https://game.invalid'};}else window.AudioContext=AudioContext;");
 const readAnchor="let source=fs.readFileSync(path.join(root,'src',name),'utf8');";assert.equal(source.split(readAnchor).length-1,1);
 source=source.replace(readAnchor,readAnchor+"\\n if(name==='audio.js'&&globalThis.__aggregateAudioTest)source=source.replaceAll('import.meta.url',JSON.stringify('https://game.invalid/play/src/audio.js?v=0.4.0&b=123456abcdef'));");
`;
factory=factory.replace(beforeImport,audioHook+beforeImport);
const exportAnchor='moduleURL,savedSettings,settle,master};';assert.equal(factory.split(exportAnchor).length-1,1);
factory=factory.replace(exportAnchor,'moduleURL,savedSettings,settle,master,resources,audioContexts,catchSpecies};');
factory+='\nexport {app};';
const {app}=await import('data:text/javascript;base64,'+Buffer.from(factory).toString('base64'));
const extraExports='roster,battle,models,scene,audio,HABITATS';
async function ready(t,{audio=null}={}){
 const previous=Object.getOwnPropertyDescriptor(globalThis,'__aggregateAudioTest');
 Object.defineProperty(globalThis,'__aggregateAudioTest',{configurable:true,value:audio});
 t.after(()=>{if(previous)Object.defineProperty(globalThis,'__aggregateAudioTest',previous);else delete globalThis.__aggregateAudioTest;});
 const h=await app(t,{expeditionEnabled:true,battleSeed:717,extraExports,entries:[[JOURNAL,modern([])],[ROSTER,modern([])],[LEGACY_JOURNAL,JSON.stringify({version:1,entries:[]})]]});
 await h.g.expedition.flush();await h.g.roster.flush();await h.g.journal.flush();
 assert.equal(h.g.expedition.snapshot.generatorVersion,10);assert.equal(h.g.expedition.snapshot.encounters.length,14);
 return h;
}
function disposeModel(model){if(typeof model.userData.dispose==='function'){model.userData.dispose();return;}const geometries=new Set(),materials=new Set();model.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[])materials.add(m);});for(const g of geometries)g.dispose();for(const m of materials)m.dispose();}

// ① Explicit registry/factory/journal/companion/battle correspondence. The
// simulation result alone is stubbed, so main registration is isolated honestly.
test('aggregate 39 species register/re-register/reload and match factories plus exactly 16 battle species',async t=>{
 const h=await ready(t),{g}=h;
 const {SPECIES}=await import(h.moduleURL('insects.js')),{createInsectModel}=await import(h.moduleURL('insect-models.js')),{BATTLE_SPECIES}=await import(h.moduleURL('beetle-battle.js')),{COMPANION_SPECIES,isCompanionSpecies}=await import(h.moduleURL('individual-roster.js')),{createJournal}=await import(h.moduleURL('journal.js'));
 assert.deepEqual(SPECIES_38.slice(0,37),SPECIES_37);assert.deepEqual(SPECIES_39.slice(0,38),SPECIES_38);assert.equal(SPECIES_39.length,39);assert.equal(new Set(SPECIES_39).size,39);assert.deepEqual(sorted(Object.keys(SPECIES)),sorted(SPECIES_39));
 assert.deepEqual(sorted(Object.keys(BATTLE_SPECIES)),sorted(BATTLE_16));assert.deepEqual(sorted(COMPANION_SPECIES),sorted(BATTLE_16));
 for(const species of SPECIES_39){assert.equal(isCompanionSpecies(species),BATTLE_16.includes(species));const model=createInsectModel(species,{inspection:true});assert.equal(model.userData.species,species);model.updateMatrixWorld(true);let meshes=0;model.traverse(o=>{assert.ok(o.matrixWorld.elements.every(Number.isFinite));if(o.isMesh){meshes++;assert.ok(o.geometry.attributes.position.count>0);}});assert.ok(meshes>0,`${species} actual factory`);disposeModel(model);}
 h.choose('meadow');assert.equal(g.simulation.items.length,33);assert.equal(g.journal.entries.length,0);
 const sim=g.simulation,actualSwing=sim.swing,actualStartle=sim.startleFromNet;t.after(()=>{sim.swing=actualSwing;sim.startleFromNet=actualStartle;});
 // A miss may alert an insect; suppress that unrelated motion in this wiring test.
 sim.startleFromNet=()=>null;const firstSeen=new Map();
 for(const [index,species]of SPECIES_39.entries()){
  const before=g.journal.entries;g.state.cooldown=0;sim.swing=()=>({ok:false,reason:'aggregate miss/obstruction'});g.swing();assert.deepEqual(g.journal.entries,before,`${species}: failure never registers`);
  g.state.cooldown=0;sim.swing=()=>({ok:true,item:{species,x:index+.04,z:-index-.04}});g.swing();
  assert.equal(g.state.mode,'playing','journal registration precedes delayed inspection');assert.equal(g.journal.entries.length,index+1);
  const record=g.journal.entries.find(e=>e.species===species);assert.ok(record);assert.equal(record.note,'');firstSeen.set(species,record.firstSeen);g.journal.setNote(species,`aggregate ${species} <b>plain text</b>`);
 }
 assert.equal(g.journal.entries.length,39);
 for(const [index,species]of SPECIES_39.entries()){
  g.state.cooldown=0;sim.swing=()=>({ok:true,item:{species,x:index+.3,z:-index-.3}});g.swing();const record=g.journal.entries.find(e=>e.species===species);
  assert.equal(record.note,`aggregate ${species} <b>plain text</b>`);assert.equal(record.firstSeen,firstSeen.get(species));assert.ok(record.lastSeen>=record.firstSeen);
 }
 const all=g.journal.entries;g.state.cooldown=0;sim.swing=()=>({ok:false,reason:'miss'});g.swing();assert.deepEqual(g.journal.entries,all);assert.equal(g.journal.record({species:'not-a-species'}),null);
 assert.equal(await g.journal.flush(),true);const raw=h.savedSettings.get(JOURNAL),reloaded=createJournal(localStorage,{locks:h.config.locks});assert.deepEqual(reloaded.entries,all);assert.equal(reloaded.entries.length,39);assert.equal(h.savedSettings.get(JOURNAL),raw);assert.equal(h.savedSettings.get(LEGACY_JOURNAL),JSON.stringify({version:1,entries:[]}));
 assert.equal(g.roster.entries.length,0,'registration alone does not retain a companion');assert.equal(g.expedition.snapshot.measuredEncounterIds.length,0,'unidentified swing stubs do not fabricate measured encounters');
});

// Actual disposal works per top-level root. Shared material/geometry references
// may have multiple owning roots; count those explicit disposal boundaries, not
// an invented once-per-world requirement. Cached insect textures are not owned
// by this boundary and are deliberately outside this test.
function watchDisposed(h,scene){
 const expected=new Map(),counts=new Map(),add=r=>expected.set(r,(expected.get(r)||0)+1);
 for(const root of scene.children){if(root.isCamera)continue;const own=new Set();root.traverse(o=>{if(o.isInstancedMesh)own.add(o);if(o.geometry)own.add(o.geometry);for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[]){own.add(m);if(!root.userData.species)for(const v of Object.values(m))if(v?.isTexture)own.add(v);}});for(const r of own)add(r);}
 assert.ok(expected.size>0);for(const r of expected.keys()){counts.set(r,0);r.addEventListener('dispose',()=>counts.set(r,counts.get(r)+1));}
 return()=>{for(const[r,n]of expected)assert.equal(counts.get(r),n,'obsolete root resource disposal count');};
}
function fieldIdentity(g){return g.simulation.items.map(i=>({id:i.id,species:i.species,home:{...i.home},encounterId:i.encounterId,sizePermille:i.sizePermille,motionSeed:i.motionSeed,measureVersion:i.measureVersion,populationSlotId:i.populationSlotId}));}
function checkPopulation(g,habitat,outing){
 assert.equal(g.state.habitat,habitat);assert.equal(g.simulation.items.length,POPULATION_10[habitat]);
 assert.deepEqual(g.simulation.items.map(i=>i.id),Array.from({length:POPULATION_10[habitat]},(_,i)=>`insect-${i+1}`));assert.ok(g.simulation.items.every(i=>!i.companion&&!i.caught));
 const profiles=outing.encounters.filter(e=>e.habitat===habitat);assert.equal(g.simulation.items.filter(i=>i.encounterId).length,profiles.length);
 for(const p of profiles){const i=g.simulation.items.find(i=>i.id===p.runtimeSlotId);assert.ok(i);for(const k of['species','encounterId','sizePermille','motionSeed','measureVersion','populationSlotId'])assert.equal(i[k],p[k],`${habitat}/${p.runtimeSlotId}/${k}`);}
}

// ② Explicit current populations, actual all-ten travel and stable identities.
test('aggregate all 10 habitats preserve gen10 profiles and release old scenes/resources with one audio owner',async t=>{
 const h=await ready(t),{g}=h;h.choose('meadow');await h.settle();
 assert.deepEqual(Object.keys(g.HABITATS),HABITATS_10);assert.deepEqual(h.elements.get('travel-habitat-select').children.map(e=>e.value),HABITATS_10);
 const outing=structuredClone(g.activeOuting),raw=h.savedSettings.get(EXPEDITION),audio=g.audio,contexts=h.audioContexts.length,homes=new Map(),seen=new Set(),retired=[];
 assert.equal(contexts,1);assert.equal(outing.generatorVersion,10);assert.equal(outing.encounters.length,14);assert.equal(Object.values(POPULATION_10).reduce((a,b)=>a+b,0),68);
 function inspect(id){checkPopulation(g,id,outing);const identity=fieldIdentity(g);if(homes.has(id))assert.deepEqual(identity,homes.get(id),`${id} return homes/profiles`);else homes.set(id,identity);for(const i of g.simulation.items)seen.add(i.species);assert.deepEqual(g.activeOuting,outing);assert.equal(h.savedSettings.get(EXPEDITION),raw);assert.equal(g.audio,audio);assert.equal(h.audioContexts.length,contexts);}
 function travel(id){const oldScene=g.scene,oldSim=g.simulation,oldTime=oldSim.time,check=watchDisposed(h,oldScene);h.travel(id);assert.notEqual(g.scene,oldScene);assert.notEqual(g.simulation,oldSim);assert.equal(oldScene.children.length,0);check();h.frame(2);assert.equal(oldSim.time,oldTime);retired.push({oldSim,oldTime,check});inspect(id);}
 inspect('meadow');for(const id of HABITATS_10.slice(1))travel(id);travel('meadow');for(const id of HABITATS_10.slice(1))travel(id);travel('meadow');
 assert.equal(homes.size,10);assert.deepEqual(sorted(seen),sorted(SPECIES_39));for(const r of retired){assert.equal(r.oldSim.time,r.oldTime);r.check();}assert.equal(g.journal.entries.length,0);assert.equal(g.roster.entries.length,0);
});

// ③ Thirteen adopted samples, only one BGM loop, and real-main lifecycle gates.
test('aggregate 13 sample paths keep observation continuous and pause/hidden/mute/quit/restore bounded',async t=>{
 const a=createIntegratedAudioMock(t),h=await ready(t,{audio:a}),{g,elements}=h,step=n=>{for(let i=0;i<n;i++){a.advance(1/60);h.frame(1);}};
 const bgm=()=>a.liveAssets().filter(n=>n.buffer.file==='bgm_temperate_preview_01.ogg'),master=()=>a.ctx.gains[0].gain.value,volume=v=>{elements.get('volume').value=String(v);elements.get('volume').dispatchEvent(new Event('input'));},page=(type,persisted=false)=>{const e=new Event(type);Object.defineProperty(e,'persisted',{value:persisted});window.dispatchEvent(e);};
 const stopped=()=>{assert.equal(a.liveAssets().length,0);assert.ok(a.assetSources().every(n=>n.ended&&n.disconnected));};
 assert.equal(a.contexts.length,0);assert.equal(a.requests.length,0);h.choose('meadow');await a.flush();assert.equal(g.simulation.items.length,33);
 assert.deepEqual(sorted(a.requests.map(r=>r.file)),sorted(AUDIO_13));assert.deepEqual(sorted(a.decoded),sorted(AUDIO_13));assert.equal(a.contexts.length,1);
 for(const r of a.requests){assert.ok(fs.existsSync(path.join(root,'assets/audio',r.file)));assert.equal(new URL(r.url).search,'?v=0.4.0&b=123456abcdef');}
 assert.equal(bgm().length,1);assert.equal(a.liveAssets().filter(n=>n.loop).length,1);assert.equal(bgm()[0].loopStart,0);assert.equal(bgm()[0].loopEnd,36.36);
 volume(0);await a.flush();assert.equal(master(),0);stopped();step(20);stopped();volume(.25);await a.flush();assert.equal(bgm().length,1);
 g.pause({lock:false});await a.flush();assert.equal(g.state.mode,'paused');assert.equal(a.ctx.state,'suspended');assert.equal(master(),0);stopped();g.resume({lock:false});await a.flush();assert.equal(bgm().length,1);
 document.hidden=true;document.dispatchEvent(new Event('visibilitychange'));await a.flush();assert.equal(g.state.mode,'paused');assert.equal(master(),0);stopped();document.hidden=false;document.dispatchEvent(new Event('visibilitychange'));await a.flush();assert.equal(g.state.mode,'paused');stopped();g.resume({lock:false});await a.flush();
 g.restart();await a.flush();const at=a.assetSources().length;h.catchSpecies('butterfly',{wait:false});const observation=bgm()[0];step(22);await a.flush();assert.equal(g.state.mode,'inspect');assert.equal(bgm().length,1);assert.equal(bgm()[0],observation);
 assert.ok(a.assetSources().slice(at).some(n=>/^sfx_net_swing_0[123]\.ogg$/.test(n.buffer.file)));assert.ok(a.assetSources().slice(at).some(n=>n.buffer.file==='sfx_capture_01.ogg'));assert.ok(a.liveAssets().some(n=>n.buffer.file==='sfx_capture_01.ogg'));
 step(55);await a.flush();assert.deepEqual(a.liveAssets().map(n=>n.buffer.file),['bgm_temperate_preview_01.ogg']);assert.equal(bgm()[0],observation);assert.equal(master(),.25);assert.equal(a.timers.size,0);
 const releaseAt=a.ctx.sources.length;g.release({lock:false});await a.flush();assert.equal(g.state.mode,'playing');assert.ok(a.ctx.sources.slice(releaseAt).some(n=>n.kind==='oscillator'&&n.started));step(30);await a.flush();
 const owner=g.audio;for(const id of HABITATS_10.slice(1)){h.travel(id);await a.flush();assert.equal(g.simulation.items.length,POPULATION_10[id]);assert.equal(bgm().length,0);stopped();assert.equal(g.audio,owner);assert.equal(a.contexts.length,1);}
 h.travel('meadow');await a.flush();assert.equal(bgm().length,1);assert.equal(a.requests.length,13);
 g.title();await a.flush();assert.equal(g.state.mode,'title');assert.equal(master(),0);stopped();assert.equal(a.ctx.state,'suspended');g.start();await a.flush();assert.equal(bgm().length,1);assert.equal(a.contexts.length,1);
 const old=a.ctx;page('pagehide');await a.flush();assert.equal(g.state.mode,'paused');assert.equal(old.state,'closed');assert.equal(old.gains[0].gain.value,0);stopped();assert.equal(a.timers.size,0);
 page('pageshow',true);await a.flush();assert.equal(g.state.mode,'paused');assert.notEqual(g.audio,owner);assert.equal(a.contexts.length,1,'bfcache restore waits for explicit resume');assert.equal(bgm().length,0);
 g.resume({lock:false});await a.flush();assert.equal(a.contexts.length,2);assert.equal(bgm().length,1);assert.equal(a.liveAssets().filter(n=>n.loop).length,1);assert.equal(a.requests.length,26);assert.deepEqual(sorted(a.requests.slice(13).map(r=>r.file)),sorted(AUDIO_13));assert.deepEqual(sorted(a.decoded.slice(13)),sorted(AUDIO_13));assert.ok(old.sources.every(n=>n.ended&&n.disconnected));
 page('pagehide');await a.flush();stopped();assert.equal(a.timers.size,0);assert.ok(a.contexts.every(c=>c.state==='closed'));
});
