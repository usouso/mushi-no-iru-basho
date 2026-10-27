import {createManticoraHabitat} from './manticora-habitat.js?v=0.39.0&b=8a647322e77c';
import {createEuchirusHabitat} from './euchirus-habitat.js?v=0.39.0&b=8a647322e77c';
import {createMiyamaHabitat} from './miyama-habitat.js?v=0.39.0&b=8a647322e77c';
import {createFiveHornHabitat} from './five-horn-habitat.js?v=0.39.0&b=8a647322e77c';
import {createForestWorld} from './world-forest.js?v=0.39.0&b=8a647322e77c';
import {createGoliathHabitat} from './goliath-habitat.js?v=0.39.0&b=8a647322e77c';
import {createElephantHabitat} from './elephant-habitat.js?v=0.39.0&b=8a647322e77c';
import {createGiantStagHabitat} from './giant-stag-habitat.js?v=0.39.0&b=8a647322e77c';
import {createAtlasHabitat} from './atlas-habitat.js?v=0.39.0&b=8a647322e77c';
import { createWorld } from './world.js?v=0.39.0&b=8a647322e77c';
import { createTropicalWorld } from './world-tropical.js?v=0.39.0&b=8a647322e77c';
import { createUnderstoryWorld } from './world-understory.js?v=0.39.0&b=8a647322e77c';
import { createNightWorld } from './world-night.js?v=0.39.0&b=8a647322e77c';
import { createSavannaWorld } from './world-savanna.js?v=0.39.0&b=8a647322e77c';
import { createWaterHabitat } from './water-habitat.js?v=0.39.0&b=8a647322e77c';
import { createDivingHabitat } from './diving-habitat.js?v=0.39.0&b=8a647322e77c';
import { createMantisHabitat } from './mantis-habitat.js?v=0.39.0&b=8a647322e77c';
import { createLadybirdHabitat } from './ladybird-habitat.js?v=0.39.0&b=8a647322e77c';
import { createBeeHabitat } from './bee-habitat.js?v=0.39.0&b=8a647322e77c';
import { createSwallowtailHabitat } from './swallowtail-habitat.js?v=0.39.0&b=8a647322e77c';
import { createJewelHabitat } from './jewel-habitat.js?v=0.39.0&b=8a647322e77c';
import { createLonghornHabitat } from './longhorn-habitat.js?v=0.39.0&b=8a647322e77c';
import { createRhinoHabitat } from './rhino-habitat.js?v=0.39.0&b=8a647322e77c';
import { createStagHabitat } from './stag-habitat.js?v=0.39.0&b=8a647322e77c';
import { createMetalliferHabitat } from './metallifer-habitat.js?v=0.39.0&b=8a647322e77c';
import { createAntHabitat } from './ant-habitat.js?v=0.39.0&b=8a647322e77c';
import { createLogFruitHabitat } from './log-fruit-habitat.js?v=0.39.0&b=8a647322e77c';
import { createInsects, SPECIES } from './insects.js?v=0.39.0&b=8a647322e77c';
import { createInsectModel, updateInsectModel } from './insect-models.js?v=0.39.0&b=8a647322e77c';
import { createInput } from './input.js?v=0.39.0&b=8a647322e77c';
import { createAudio } from './audio.js?v=0.39.0&b=8a647322e77c';
import { createNet } from './net.js?v=0.39.0&b=8a647322e77c';
import { createJournal } from './journal.js?v=0.39.0&b=8a647322e77c';
import { createJournalUI } from './journal-ui.js?v=0.39.0&b=8a647322e77c';
import { createCaptureVisibility } from './capture-visibility.js?v=0.39.0&b=8a647322e77c';
import { createCompanionRoster, isCompanionSpecies } from './individual-roster.js?v=0.39.0&b=8a647322e77c';
import { createBattle, advanceBattle, cancelBattle, BATTLE_SPECIES } from './beetle-battle.js?v=0.39.0&b=8a647322e77c';
import { createBattleView } from './battle-view.js?v=0.39.0&b=8a647322e77c';
import { createExpedition } from './expedition.js?v=0.39.0&b=8a647322e77c';
import { individualHabitatOptions, individualScale, individualLabel } from './individual-layout.js?v=0.39.0&b=8a647322e77c';

const HABITATS={
 meadow:{name:'温帯の草地・林縁',create:createWorld,hint:'白い翅が、草花の上でひと休み。近づいてみよう。'},
 tropical:{name:'中米熱帯林の再現区画',create:createTropicalWorld,hint:'木陰に青い翅。止まると、茶色の裏が見えます。'},
 understory:{name:'東南アジア林の観察区画',create:createUnderstoryWorld,hint:'葉の形と、ゆっくりした揺れ。入口の左右に、長い顎と三本の角。太い枝も見てみよう。'},
 night:{name:'東アジア湿地の夜',create:createNightWorld,hint:'湿地の葉先に、小さな光。そっと近づいてみよう。'},
 savanna:{name:'南部アフリカ草地の再現区画',create:createSavannaWorld,hint:'球を押す虫と、裸地を歩く黒い大顎。足元も見てみよう。'},
 forest:{name:'中部アフリカ森林縁の再現区画',create:createForestWorld,hint:'明るい道から、太い木の樹液跡へ。白黒の胸と短い角を探して。'}
};
function habitatId(id){return Object.prototype.hasOwnProperty.call(HABITATS,id)?id:'meadow';}
const THREE=window.THREE;
const $=id=>document.getElementById(id);
const canvas=$('game-canvas');
const state={mode:'title',habitat:'meadow',time:0,elapsed:0,captures:0,seen:[],sensitivity:1,volume:.25,player:{x:0,y:1.65,z:10,yaw:0,pitch:-.03,speed:0,quiet:false,running:false},swing:0,cooldown:0};
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
let renderer,scene,camera,world,waterHabitat,divingHabitat,mantisHabitat,ladybirdHabitat,beeHabitat,swallowtailHabitat,jewelHabitat,longhornHabitat,miyamaHabitat,euchirusHabitat,manticoraHabitat,rhinoHabitat,stagHabitat,giantStagHabitat,elephantHabitat,goliathHabitat,fiveHornHabitat,metalliferHabitat,atlasHabitat,antHabitat,logFruitHabitat,simulation,input,audio,net,models=new Map(),inspectScene,inspectCamera,inspectModel,inspectTurn=0,inspectTilt=.2;
let toastTime=0,captureDelay=0,lastTime=0,accumulator=0,frames=0,disposed=false;
const insectStates=new Map();
// Own the lock transition explicitly; browsers may queue duplicate unlock events.
let pointerOwned=false;
let journal,journalUI,journalReturn='playing';
let expedition,activeOuting=null,outingChanging=false,outingInterrupted=false,capturedMeasurement=null,replaceArmed=null;
let roster,companionReturn='playing',releaseArmed=null,battle,battleView,battleSuspended=false,battleAudioFresh=false,battlePresentationFinished=false,battlePresentationEvents=[],battleRingOutShown=false,companionEdited=false;
const forward=new THREE.Vector3();
function fatal(message){state.mode='error';$('error-message').textContent=message;$('error-screen').hidden=false;$('start-screen').hidden=true;$('hud').hidden=true;audio?.pause();audio?.dispose?.();journalUI?.close();$('app-shell').inert=false;canvas.inert=false;}
function toast(text,duration=3){$('toast').textContent=text;toastTime=duration;}
function direction(){return {x:-Math.sin(state.player.yaw)*Math.cos(state.player.pitch),y:Math.sin(state.player.pitch),z:-Math.cos(state.player.yaw)*Math.cos(state.player.pitch)};}
function syncScreens(){
 $('start-screen').hidden=state.mode!=='title';$('hud').hidden=state.mode!=='playing';$('pause-screen').hidden=state.mode!=='paused';$('inspect-screen').hidden=state.mode!=='inspect';
 $('companions-screen').hidden=state.mode!=='companions';$('battle-screen').hidden=state.mode!=='battle';
 net.group.visible=state.mode==='playing';
 $('app-shell').inert=state.mode==='journal';canvas.inert=state.mode==='journal';
 if(state.mode!=='journal')journalUI?.close();
}
function unlock(){pointerOwned=false;if(document.pointerLockElement===canvas)document.exitPointerLock();}
function applySettings(){
 const sensitivity=Number($('sensitivity').value),volume=Number($('volume').value);
 if(Number.isFinite(sensitivity))state.sensitivity=Math.max(.3,Math.min(2,sensitivity));
 if(Number.isFinite(volume))state.volume=Math.max(0,Math.min(1,volume));
 audio?.setVolume(state.volume);
 try{localStorage.setItem('mushi-settings-v1',JSON.stringify({sensitivity:state.sensitivity,volume:state.volume}));}catch{}
}
function restoreControl(lock){
 canvas.focus({preventScroll:true});
 if(lock)requestLock();else pointerOwned=false;
}
function requestLock(){
 if(state.mode!=='playing')return;
 canvas.focus({preventScroll:true});
 if(!canvas.requestPointerLock){toast('画面をドラッグして見回せます。網は Space キー');return;}
 try{const p=canvas.requestPointerLock();p?.catch(()=>{if(state.mode==='playing')toast('画面のドラッグで見回す · Space で網',5);});}catch{toast('画面のドラッグで見回す · Space で網',5);}
}
// Habitat changes reuse the same disposal boundary from title and paused travel.
function disposeSceneRoot(root, textures=true){
 const geometries=new Set(),materials=new Set(),maps=new Set();
 root.traverse(object=>{if(object.isInstancedMesh)object.dispose();if(object.geometry)geometries.add(object.geometry);if(object.material)for(const material of (Array.isArray(object.material)?object.material:[object.material])){materials.add(material);if(textures)for(const value of Object.values(material))if(value?.isTexture)maps.add(value);}object.shadow?.map?.dispose?.();});
 for(const geometry of geometries)geometry.dispose();for(const material of materials)material.dispose();for(const map of maps)map.dispose();root.parent?.remove(root);
}
function activateHabitat(id){
 const next=habitatId(id);
 if(scene){scene.remove(camera);for(const root of [...scene.children])disposeSceneRoot(root,!root.userData.species);}
 scene=new THREE.Scene();scene.add(camera);
 world=HABITATS[next].create(scene);
 waterHabitat=next==='meadow'?createWaterHabitat(world,scene):null;
 divingHabitat=next==='meadow'?createDivingHabitat(world,scene):null;
 mantisHabitat=next==='meadow'?createMantisHabitat(world,scene):null;
 ladybirdHabitat=next==='meadow'?createLadybirdHabitat(world,scene):null;
 beeHabitat=next==='meadow'?createBeeHabitat(world,scene):null;
 swallowtailHabitat=next==='meadow'?createSwallowtailHabitat(world,scene):null;
 jewelHabitat=next==='meadow'?createJewelHabitat(world,scene):null;
 longhornHabitat=next==='meadow'?createLonghornHabitat(world,scene):null;
 miyamaHabitat=next==='meadow'?createMiyamaHabitat(world,scene):null;
 rhinoHabitat=next==='night'?createRhinoHabitat(world,scene):null;
 stagHabitat=next==='night'?createStagHabitat(world,scene):null;
 giantStagHabitat=next==='night'?createGiantStagHabitat(world,scene):null;
 metalliferHabitat=next==='understory'?createMetalliferHabitat(world,scene):null;
 atlasHabitat=next==='understory'?createAtlasHabitat(world,scene):null;
 antHabitat=next==='tropical'?createAntHabitat(world,scene):null;
 logFruitHabitat=next==='tropical'?createLogFruitHabitat(world,scene):null;
 elephantHabitat=next==='tropical'?createElephantHabitat(world,scene):null;
 goliathHabitat=next==='forest'?createGoliathHabitat(world,scene):null;
 fiveHornHabitat=next==='understory'?createFiveHornHabitat(world,scene):null;
 euchirusHabitat=next==='understory'?createEuchirusHabitat(world,scene):null;
 manticoraHabitat=next==='savanna'?createManticoraHabitat(world,scene):null;
 const habitatOptions=world.insectHomes?{homes:world.insectHomes,bounds:world.bounds}:{};
 if(world.grasshopperHomes){habitatOptions.extraHomes=world.grasshopperHomes;habitatOptions.grasshopperSupports=world.grasshopperSupports;}
 if(world.herculesHomes){habitatOptions.extraHomes=[...(habitatOptions.extraHomes||[]),...world.herculesHomes];habitatOptions.herculesSupports=world.herculesSupports;}
 if(world.leafSupports)habitatOptions.leafSupports=world.leafSupports;
 if(world.fireflySupports)habitatOptions.fireflySupports=world.fireflySupports;
 if(world.dungSupports)habitatOptions.dungSupports=world.dungSupports;
 if(waterHabitat){habitatOptions.extraHomes=[...(habitatOptions.extraHomes||[]),...waterHabitat.homes];habitatOptions.striderSupports=waterHabitat.supports;}
 if(divingHabitat){habitatOptions.extraHomes=[...(habitatOptions.extraHomes||[]),...divingHabitat.homes];habitatOptions.divingSupports=divingHabitat.supports;}
 if(antHabitat){habitatOptions.extraHomes=[...(habitatOptions.extraHomes||[]),...antHabitat.homes];habitatOptions.antSupports=antHabitat.supports;}
 if(logFruitHabitat)habitatOptions.logFruitStation=logFruitHabitat.simulationStation;
 if(mantisHabitat){habitatOptions.extraHomes=[...(habitatOptions.extraHomes||[]),...mantisHabitat.homes];habitatOptions.mantisSupports=mantisHabitat.supports;}
 if(ladybirdHabitat){habitatOptions.extraHomes=[...(habitatOptions.extraHomes||[]),...ladybirdHabitat.homes];habitatOptions.ladybirdSupports=ladybirdHabitat.supports;}
 if(rhinoHabitat){habitatOptions.extraHomes=[...(habitatOptions.extraHomes||[]),...rhinoHabitat.homes];habitatOptions.rhinoSupports=rhinoHabitat.rhinoSupports;}
 if(stagHabitat){habitatOptions.extraHomes=[...(habitatOptions.extraHomes||[]),...stagHabitat.homes];habitatOptions.stagSupports=stagHabitat.stagSupports;}
 if(giantStagHabitat){habitatOptions.extraHomes=[...(habitatOptions.extraHomes||[]),...giantStagHabitat.homes];habitatOptions.giantStagSupports=giantStagHabitat.giantStagSupports;}
 if(metalliferHabitat){habitatOptions.extraHomes=[...(habitatOptions.extraHomes||[]),...metalliferHabitat.homes];habitatOptions.metalliferSupports=metalliferHabitat.metalliferSupports;}
 if(atlasHabitat){habitatOptions.extraHomes=[...(habitatOptions.extraHomes||[]),...atlasHabitat.homes];habitatOptions.atlasSupports=atlasHabitat.atlasSupports;}
 if(beeHabitat){habitatOptions.extraHomes=[...(habitatOptions.extraHomes||[]),...beeHabitat.homes];habitatOptions.beeSupports=beeHabitat.beeSupports;}
 if(swallowtailHabitat){const[,x,z,altitude]=swallowtailHabitat.homes[0];habitatOptions.extraHomes=[...(habitatOptions.extraHomes||[]),...swallowtailHabitat.homes];habitatOptions.swallowtailSupports=[{home:{x,y:world.heightAt(x,z)+altitude,z},perches:swallowtailHabitat.swallowtailSupports}];}
 if(jewelHabitat){habitatOptions.extraHomes=[...(habitatOptions.extraHomes||[]),...jewelHabitat.homes];habitatOptions.jewelSupports=jewelHabitat.jewelSupports;}
 if(longhornHabitat){habitatOptions.extraHomes=[...(habitatOptions.extraHomes||[]),...longhornHabitat.homes];habitatOptions.longhornSupports=longhornHabitat.longhornSupports;}
 // Append after the four morphos, two Hercules and four ants: stable insect-11.
 if(elephantHabitat){habitatOptions.extraHomes=[...(habitatOptions.extraHomes||[]),...elephantHabitat.homes];habitatOptions.elephantSupports=elephantHabitat.elephantSupports;}
 if(goliathHabitat){habitatOptions.extraHomes=[...(habitatOptions.extraHomes||[]),...goliathHabitat.homes];habitatOptions.goliathSupports=goliathHabitat.goliathSupports;}
 if(fiveHornHabitat){habitatOptions.extraHomes=[...(habitatOptions.extraHomes||[]),...fiveHornHabitat.homes];habitatOptions.fiveHornSupports=fiveHornHabitat.fiveHornSupports;}
 // Append after the six old understory origins; fixed insect-7.
 if(euchirusHabitat){habitatOptions.extraHomes=[...(habitatOptions.extraHomes||[]),...euchirusHabitat.homes];habitatOptions.euchirusSupports=euchirusHabitat.euchirusSupports;}
 // Append the fixed Miyama after the 29 old meadow origins.
 if(miyamaHabitat){habitatOptions.extraHomes=[...(habitatOptions.extraHomes||[]),...miyamaHabitat.homes];habitatOptions.miyamaSupports=miyamaHabitat.miyamaSupports;}
 // Preserve the old dung origin; append one fixed ground hunter.
 if(manticoraHabitat){habitatOptions.extraHomes=[...(habitatOptions.extraHomes||[]),...manticoraHabitat.homes];habitatOptions.manticoraSupports=manticoraHabitat.manticoraSupports;}
 const captureOccluders=[...(world.captureOccluders||[]),...(antHabitat?.captureOccluders||[]),...(mantisHabitat?.captureOccluders||[]),...(ladybirdHabitat?.captureOccluders||[]),...(rhinoHabitat?.captureOccluders||[]),...(stagHabitat?.captureOccluders||[]),...(giantStagHabitat?.captureOccluders||[]),...(elephantHabitat?.captureOccluders||[]),...(goliathHabitat?.captureOccluders||[]),...(fiveHornHabitat?.captureOccluders||[]),...(miyamaHabitat?.captureOccluders||[]),...(euchirusHabitat?.captureOccluders||[]),...(metalliferHabitat?.captureOccluders||[]),...(atlasHabitat?.captureOccluders||[]),...(beeHabitat?.captureOccluders||[]),...(swallowtailHabitat?.captureOccluders||[]),...(jewelHabitat?.captureOccluders||[])];
 habitatOptions.hasLineOfSight=createCaptureVisibility(captureOccluders);
 simulation=createInsects(world.heightAt,individualHabitatOptions(next,habitatOptions,activeOuting,world.heightAt));
 models=new Map();for(const item of simulation.items){const model=createInsectModel(item.species,{sizePermille:item.sizePermille,fieldFlight:item.rhinoFlightEnabled===true});models.set(item.id,model);scene.add(model);}
 state.habitat=next;insectStates.clear();captureDelay=0;state.swing=0;state.cooldown=0;applyCompanionPresence();
}
function resetPlayer(){
 const p=state.player;p.x=world.spawn.x;p.z=world.spawn.z;p.y=world.heightAt(p.x,p.z)+1.65;p.yaw=0;p.pitch=-.07;p.speed=0;p.quiet=false;p.running=false;
}
function start(){
 if(state.mode==='error'||outingChanging||expedition.pending&&!expedition.snapshot)return;
 if(state.mode==='title'){const selected=habitatId($('habitat-select')?.value);const nextOuting=expedition.snapshot,changedOuting=(activeOuting?.worldSeed??null)!==(nextOuting?.worldSeed??null)||(activeOuting?.outingCounter??null)!==(nextOuting?.outingCounter??null);activeOuting=nextOuting;if(selected!==state.habitat||changedOuting)activateHabitat(selected);simulation.reset();audio.resetField(state.habitat);state.captures=0;state.seen=[];state.elapsed=0;resetPlayer();}
 state.mode='playing';syncScreens();input.clear();audio.start();requestLock();toast(HABITATS[state.habitat].hint,6);
}
function pause({lock=true}={}){
 if(state.mode==='battle'){leaveBattle();return;}
 if(state.mode==='companions'){closeCompanions();return;}
 if(state.mode==='journal'){closeJournal({lock});return;}
 if(state.mode==='paused'){resume({lock});return;}
 if(state.mode==='inspect'){release({lock});return;}
 if(state.mode!=='playing')return;
 state.mode='paused';state.player.speed=0;input.clear();unlock();audio.pause();syncTravelChoice();syncScreens();$('resume-button').focus({preventScroll:true});
}
function resume({lock=true}={}){if(state.mode!=='paused'||outingChanging)return;applySettings();state.mode='playing';syncScreens();input.clear();audio.start();restoreControl(lock);companionStatus();}
function syncTravelChoice(){
 $('travel-habitat-select').value=state.habitat;$('travel-button').disabled=true;
}
function updateTravelChoice(){
 const selected=$('travel-habitat-select').value;
 $('travel-button').disabled=state.mode!=='paused'||!Object.prototype.hasOwnProperty.call(HABITATS,selected)||selected===state.habitat;
}
function travelHabitat(){
 if(state.mode!=='paused'||outingChanging)return;
 const selected=$('travel-habitat-select').value;
 if(!Object.prototype.hasOwnProperty.call(HABITATS,selected)||selected===state.habitat)return;
 // A catch can be paused during its short transition to inspection. Its journal
 // record already exists; return the insect before discarding the old scene.
 simulation.release(state.player);simulation.removeBait?.();simulation.removeLogFruit?.();
 activateHabitat(selected);resetPlayer();state.elapsed=0;
 audio.resetField(state.habitat);$('habitat-select').value=state.habitat;syncTravelChoice();
 // Reuse settings/input/audio recovery, but do not re-lock after a menu change.
 resume({lock:false});toast(`${HABITATS[selected].name}へ。${HABITATS[selected].hint}`,6);
}
function title(){
 if(outingChanging)return;
 state.mode='title';simulation.release();simulation.removeBait?.();simulation.removeLogFruit?.();captureDelay=0;state.swing=0;state.cooldown=0;input.clear();unlock();audio.pause();resetPlayer();syncScreens();$('start-button').focus({preventScroll:true});
}
function restart({resume:resumeWalking=true}={}){
 simulation.reset();audio.resetField(state.habitat);state.captures=0;state.seen=[];state.elapsed=0;state.cooldown=0;captureDelay=0;state.swing=0;resetPlayer();state.mode=resumeWalking?'playing':'paused';syncScreens();input.clear();if(resumeWalking){audio.start();requestLock();toast('風の通る入り口から、もう一度。');}else{audio.pause();unlock();syncTravelChoice();}
}
function expeditionStatus(){
 const label=$('expedition-status');if(!label)return;
 $('start-button').disabled=outingChanging||expedition.pending&&!expedition.snapshot;
 label.textContent=outingChanging?'新しい散策を準備しています…':!expedition.saved?'散策・大きさの変更は未保存です。今の散策は続けられます。':`散策 ${activeOuting?.outingCounter||expedition.snapshot?.outingCounter||1}`;
 for(const id of ['restart-button','resume-button','title-button','pause-journal-button','pause-companions-button'])$(id).disabled=outingChanging;
 if(outingChanging)$('travel-button').disabled=true;else updateTravelChoice();
 if(state.mode==='inspect')refreshIndividualSize();
}
async function newOuting(){
 if(state.mode!=='paused'||outingChanging)return;
 outingChanging=true;outingInterrupted=false;expeditionStatus();
 const result=await expedition.beginNextOuting(activeOuting?.outingCounter);
 outingChanging=false;
 if(result.ok){activeOuting=expedition.snapshot;activateHabitat(state.habitat);restart({resume:!outingInterrupted&&!document.hidden&&document.hasFocus?.()!==false});toast('新しい散策へ。対象の甲虫の顔ぶれと大きさが変わりました。',6);}
 else {$('expedition-status').textContent='新しい散策を保存できませんでした。今の散策と記録はそのままです。';}
 expeditionStatus();
 if(!result.ok)$('expedition-status').textContent='新しい散策を保存できませんでした。今の散策と記録はそのままです。';
}
function refreshIndividualSize(){
 const item=simulation.caught,label=$('insect-individual-size');
 label.hidden=!item||!isCompanionSpecies(item.species);
 if(label.hidden)return;
 const best=expedition.snapshot?.best.find(entry=>entry.species===item.species);
 label.textContent=individualLabel(item)+(capturedMeasurement?.newRecord?' · 自己最大を更新！':best?` · 自己最大 ${Math.round(best.sizePermille/10)}`:'')+(item.encounterId&&!expedition.saved?' · サイズ記録は未保存':'')+' · 表示サイズ（実寸・強さとは別）';
}
function showInspection(item){
 state.mode='inspect';replaceArmed=null;state.player.speed=0;unlock();input.clear();audio.inspect();
 if(inspectModel){inspectScene.remove(inspectModel);inspectModel.traverse(o=>{o.geometry?.dispose();if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose());}});}
 inspectModel=createInsectModel(item.species,{inspection:true,sizePermille:item.sizePermille});
 const scales={butterfly:5.1,dragonfly:4.7,cicada:6.1,morpho:3.4,grasshopper:4.4,hercules:3.8,leafinsect:4,waterstrider:4,leafcutterant:4,firefly:4,dungbeetle:4,divingbeetle:4,mantis:4,ladybird:12,rhino:4,stag:4,giantstag:4,elephant:3.4,goliath:3.6,fivehorn:3.4,miyama:4,euchirus:3,manticora:3.2,metallifer:3.4,atlas:3.4,bee:8,swallowtail:4,jewel:6,longhorn:6};inspectModel.scale.setScalar((scales[item.species]||5)*individualScale(item));inspectScene.add(inspectModel);
 inspectTurn=-.45;inspectTilt=.3;positionInspector();
 const data=SPECIES[item.species];$('insect-name').textContent=data.name||data.label;$('insect-size').textContent=(data.size||'').replace('試作表示は','基準模型の表示は');$('insect-description').textContent=data.observation||data.description||'';$('insect-hint').textContent=data.hint||'';
 refreshCapturedChoices(item);refreshIndividualSize();
 syncScreens();($('capture-battle-button').hidden||$('capture-battle-button').disabled?$('release-button'):$('capture-battle-button')).focus({preventScroll:true});
}
function swing(){
 if(state.mode==='title'){start();return;}
 if(state.mode==='paused'){resume();return;}
 if(state.mode==='inspect'){release();return;}
 if(state.mode!=='playing'||state.cooldown>0||simulation.caught)return;
 state.swing=.001;state.cooldown=.7;audio.swing();
 world.setDungBall?.(simulation.dungBall);
 const result=simulation.swing(state.player,direction());
 if(result.ok){
  capturedMeasurement=result.item.encounterId?expedition.measure(result.item.encounterId):null;
  state.captures++;if(!state.seen.includes(result.item.species))state.seen.push(result.item.species);
  journal.record({species:result.item.species,location:result.item.species==='manticora'?'南部アフリカ草地区画・露出した土':result.item.species==='euchirus'?'東南アジア林・生木の樹皮面':result.item.species==='miyama'?'温帯の林縁・生木の樹皮面':result.item.species==='fivehorn'?'東南アジア林・生木の斜め太枝':result.item.species==='goliath'?'中部アフリカ森林縁・生木の樹液跡':result.item.species==='elephant'?'中米熱帯林・低い傾斜枝':result.item.species==='giantstag'?'夜の林縁・樹皮の隙間':result.item.species==='atlas'?'東南アジア林・三本角の観察枝':result.item.species==='metallifer'?'東南アジア林・低い観察枝':result.item.species==='longhorn'?'温帯の林縁・太い幹':result.item.species==='jewel'?'温帯の草地・若木の葉':result.item.species==='swallowtail'?'温帯の草地・池岸':result.item.species==='bee'?'温帯の草地・西の花群':['rhino','stag'].includes(result.item.species)?'夜の林縁・樹液のある木':locationLabel(result.item.x,result.item.z),x:Math.round(result.item.x*10)/10,z:Math.round(result.item.z*10)/10});
  captureDelay=.28;audio.capture();toast('そっと、つかまえた。',.6);
 }else {simulation.startleFromNet?.(state.player,direction());toast(result.reason,2.4);}
}
function nearbyBaitStation(){
 const p=state.player;let nearest=null,distance=Infinity;
 // Old table comes first: exact-distance ties keep its established action.
 for(const station of[world?.baitStation,logFruitHabitat?.station]){
  if(!station)continue;const d=Math.hypot(p.x-station.x,p.z-station.z);
  if(d<=station.interactRadius&&Math.abs(p.y-station.topY)<3&&d<distance){nearest=station;distance=d;}
 }
 return nearest;
}
function interact(){
 if(state.mode!=='playing'||simulation.caught)return;
 const station=nearbyBaitStation();if(!station)return;
 if(station===logFruitHabitat?.station){
  if(simulation.logFruit?.active){simulation.removeLogFruit();toast('倒木の果実を片付けました。',4);}
  else if(simulation.placeLogFruit({type:station.type})){toast('倒木に発酵果実を置きました。3mほど離れ、果実のそばで休む姿を待ってみよう。',6);}
  logFruitHabitat.setActive(!!simulation.logFruit?.active);return;
 }
 if(simulation.bait?.active){simulation.removeBait();toast('果実を片付けました。寄っていた虫は、周りへ戻ります。',4);}
 else if(simulation.placeBait({type:station.type,...station.target})){toast('発酵果実を置きました。3mほど離れて、周りを見ながら待ってみよう。',6);}
 world.setBaitActive?.(!!simulation.bait?.active);
}
function release({lock=true}={}){
 if(state.mode!=='inspect')return;
 const item=simulation.release(state.player);state.mode='playing';state.cooldown=.8;state.swing=0;input.clear();audio.start();audio.release();syncScreens();restoreControl(lock);toast(item?.species==='manticora'?`${SPECIES.manticora.name}を、地面へそっと返しました。`:item?.species==='euchirus'?`${SPECIES.euchirus.name}を、樹皮の面へそっと返しました。`:item?.species==='miyama'?`${SPECIES.miyama.name}を、樹皮の面へそっと返しました。`:item?.species==='fivehorn'?`${SPECIES.fivehorn.name}を、斜めの太枝へそっと返しました。`:item?.species==='goliath'?`${SPECIES.goliath.name}を、森林縁の枝へそっと返しました。`:item?.species==='elephant'?`${SPECIES.elephant.name}を、傾斜枝へそっと返しました。`:item?.species==='giantstag'?`${SPECIES.giantstag.name}を、樹皮のそばへそっと返しました。`:item?.species==='atlas'?`${SPECIES.atlas.name}を、枝へそっと返しました。`:item?.species==='metallifer'?`${SPECIES.metallifer.name}を、東南アジア林の枝へそっと返しました。`:item?.species==='longhorn'?`${SPECIES.longhorn.name}を、太い幹へそっと返しました。`:item?.species==='jewel'?`${SPECIES.jewel.name}を、若木の葉へそっと返しました。`:item?.species==='swallowtail'?`${SPECIES.swallowtail.name}を、池岸へそっと返しました。`:item?.species==='bee'?`${SPECIES.bee.name}を、花のそばへそっと返しました。`:item?.species==='stag'?`${SPECIES.stag.name}を、樹液のある木へそっと返しました。`:item?.species==='rhino'?`${SPECIES.rhino.name}を、樹液のある木へそっと返しました。`:item?.species==='ladybird'?`${SPECIES.ladybird.name}を、草むらへそっと返しました。`:item?.species==='mantis'?`${SPECIES.mantis.name}を、草葉へそっと返しました。`:item?.species==='divingbeetle'?`${SPECIES.divingbeetle.name}を、池へそっと返しました。`:item?.species==='dungbeetle'?`${SPECIES.dungbeetle.name}を、球のそばへそっと返しました。`:item?.species==='firefly'?`${SPECIES.firefly.name}を、夜の湿地へそっと返しました。`:item?.species==='leafcutterant'?`${SPECIES.leafcutterant.name}を、地面へそっと返しました。`:item?.species==='waterstrider'?`${SPECIES.waterstrider.name}を、水面へそっと返しました。`:item?.species==='leafinsect'?`${SPECIES.leafinsect.name}を、葉の上へそっと返しました。`:item?.species==='grasshopper'?'ショウリョウバッタが、草むらへ跳んでいきました。':item?.species==='hercules'?'ヘラクレスオオカブトが、木陰へ歩いていきました。':`${SPECIES[item?.species]?.name||'虫'}が、野原へ飛び立ちました。`,3.8);
}
function locationLabel(x,z){if(world.locationLabel)return world.locationLabel(x,z);return Math.hypot(x-24,z+20)<16?'水辺の草むら':Math.hypot(x+10,z+8)<10?'大きな木の下':z<-32?'森の入り口':'風の通る野原';}
function openJournal(speciesId){
 if(outingChanging)return;
 if(state.mode==='journal'){closeJournal({lock:false});return;}
 if(!['playing','paused','inspect'].includes(state.mode))return;
 journalReturn=state.mode;state.mode='journal';state.player.speed=0;input.clear();unlock();audio.pause();syncScreens();
 journalUI.open(typeof speciesId==='string'?speciesId:undefined);
}
function closeJournal({lock=true}={}){
 if(state.mode!=='journal')return;
 journalUI.close();state.mode=journalReturn;syncScreens();input.clear();
 if(state.mode==='playing'){applySettings();audio.start();restoreControl(lock);}
 else if(state.mode==='paused')$('resume-button').focus({preventScroll:true});
 else {continueObservationAudio();$('release-button').focus({preventScroll:true});}
}
// Observation freezes the insect simulation, not the habitat soundscape.
// Actual menus, blur/hidden and pagehide still stop audio explicitly.
function continueObservationAudio(){
 if(state.mode==='inspect'&&!document.hidden&&document.hasFocus?.()!==false)audio.inspect();
}
function applyCompanionPresence(){
 if(!roster||!simulation)return;
 const origins=[];
 for(const entry of roster.entries){
  if(entry.originHabitat!==state.habitat)continue;
  const item=simulation.items.find(i=>i.species===entry.species&&(entry.originKind==='expedition'?i.encounterId===entry.originEncounterId:!i.encounterId&&i.id===entry.originIndividualId));
  if(item)origins.push({id:item.id,species:item.species});
 }
 simulation.setCompanions(origins,state.player);
}
function companionStatus(){
 const status=$('companion-save-status');
 status.dataset.unsaved=String(!roster.saved);
 $('battle-save-status').hidden=roster.saved;$('battle-save-status').textContent=roster.pending?'仲間を保存中…':'この仲間は未保存です。ページを閉じると失われます。';
 status.textContent=roster.pending?'仲間を保存中…':roster.saved?'仲間を保存済み':'仲間の変更を保存できません。このページ内では遊べますが、閉じると未保存の変更が失われます。';
 if(!roster.pending&&!roster.saved&&state.mode==='playing'&&companionEdited)toast('仲間の変更は未保存です。ページを閉じると失われます。',8);
}
function refreshCompanions(){
 const select=$('companion-select'),before=select.value;select.replaceChildren();
 for(const entry of roster.entries){const option=document.createElement('option');option.value=entry.id;option.textContent=SPECIES[entry.species].name+' · '+individualLabel(entry);select.append(option);}
 select.value=roster.entries.some(e=>e.id===before)?before:(roster.entries[0]?.id||'');
 const selected=roster.entries.find(e=>e.id===select.value);
 $('companion-empty').hidden=!!selected;select.disabled=!selected;$('battle-start-button').disabled=!selected;$('companion-release-button').disabled=!selected;
 $('companion-role').textContent=selected?BATTLE_SPECIES[selected.species].help:'';
 $('companion-release-button').textContent=releaseArmed===selected?.id?'もう一度押して元の生息地へ放す':'この仲間を放す';
 companionStatus();
}
function refreshCapturedChoices(item){
 const eligible=!!item&&isCompanionSpecies(item.species),owned=eligible?roster.entries.find(entry=>entry.species===item.species):null;
 $('keep-button').hidden=!eligible;$('keep-button').disabled=false;
 $('keep-button').textContent=owned?(replaceArmed===item.id?'今の仲間を返して、この虫を連れていく':'今の仲間と入れ替える'):'連れていくだけ';
 $('capture-battle-button').hidden=!eligible;$('capture-battle-button').disabled=!!owned;
 $('capture-battle-note').textContent=!eligible?'この虫は虫相撲の対象外です。':owned?`今の仲間：${individualLabel(owned)}。入れ替えると今の仲間を元の生息地へ返します。`:'仲間にしてCOMと対戦。勝敗でいなくなりません。';
}
function captureOwnership(item){return{species:item.species,originHabitat:state.habitat,originIndividualId:item.id,originKind:item.encounterId?'expedition':'legacy',originEncounterId:item.encounterId||null,sizePermille:item.encounterId?item.sizePermille:null,measureVersion:item.encounterId?1:null};}
function keepCaptured({resumeAudio=true}={}){
 const item=simulation.caught;if(state.mode!=='inspect'||!item||!isCompanionSpecies(item.species))return;
 const owned=roster.entries.find(entry=>entry.species===item.species);
 if(owned&&replaceArmed!==item.id){replaceArmed=item.id;refreshCapturedChoices(item);return;}
 // Retain must succeed before a replacement can alter the old roster. A store
 // rejection returns the new specimen safely; it cannot remove the old friend.
 if(!simulation.retain())return;
 const accepted=owned?roster.replace(owned.id,captureOwnership(item)):roster.add(captureOwnership(item));
 replaceArmed=null;applyCompanionPresence();state.mode='playing';state.cooldown=.8;captureDelay=0;state.swing=0;input.clear();syncScreens();
 if(!accepted.ok){audio.start();restoreControl(false);toast('仲間にできなかったため、この虫を野原へ返しました。元の仲間はそのままです。',7);return;}
 companionEdited=true;if(resumeAudio){audio.start();restoreControl(false);}
 toast(`${SPECIES[item.species].name}が仲間になりました。B「仲間・虫相撲」から対戦できます。`,6);companionStatus();return accepted.entry;
}
function battleCaptured(){
 // Keep this exact held individual, never substitute an already-owned namesake.
 const item=simulation.caught;if(state.mode!=='inspect'||!item||!isCompanionSpecies(item.species)||roster.entries.some(entry=>entry.species===item.species))return;
 const entry=keepCaptured({resumeAudio:false});if(!entry)return;
 openCompanions();if(state.mode!=='companions')return;
 $('companion-select').value=entry.id;$('battle-opponent-select').value='rhino';refreshCompanions();startBattle();
}
function toggleCompanions(){if(state.mode==='companions')closeCompanions();else openCompanions();}
function openCompanions(){
 if(outingChanging||!['playing','paused'].includes(state.mode)||simulation.caught)return;
 companionReturn=state.mode;state.mode='companions';releaseArmed=null;state.player.speed=0;input.clear();unlock();audio.pause();refreshCompanions();syncScreens();$('companions-close-button').focus({preventScroll:true});
}
function closeCompanions(){
 if(state.mode!=='companions')return;
 releaseArmed=null;state.mode=companionReturn;input.clear();syncScreens();
 if(state.mode==='playing'){applySettings();audio.start();restoreControl(false);companionStatus();}else $('resume-button').focus({preventScroll:true});
}
function releaseCompanion(){
 if(state.mode!=='companions')return;const id=$('companion-select').value;
 if(!roster.entries.some(e=>e.id===id))return;
 if(releaseArmed!==id){releaseArmed=id;refreshCompanions();return;}
 const result=roster.release(id);releaseArmed=null;if(result.ok){companionEdited=true;applyCompanionPresence();}refreshCompanions();
}
function battleSeed(){
 const value=new Uint32Array(1);
 if(globalThis.crypto?.getRandomValues){globalThis.crypto.getRandomValues(value);return value[0];}
 return Math.floor(Math.random()*4294967296)>>>0;
}
function startBattle(){
 if(state.mode!=='companions')return;
 const entry=roster.entries.find(e=>e.id===$('companion-select').value),opponentSpecies=$('battle-opponent-select').value;
 if(!entry||!Object.prototype.hasOwnProperty.call(BATTLE_SPECIES,opponentSpecies))return;
 battle=createBattle({playerSpecies:entry.species,opponentSpecies,seed:battleSeed()});battleView?.dispose();battleView=createBattleView({playerSpecies:entry.species,opponentSpecies,playerSizePermille:entry.sizePermille,aspect:innerWidth/innerHeight});battleSuspended=document.hidden||document.hasFocus?.()===false;
 releaseArmed=null;state.mode='battle';battleAudioFresh=true;battlePresentationFinished=false;battlePresentationEvents=[];battleRingOutShown=false;input.clear();if(battleSuspended)audio.pause();else resumeBattleAudio();syncScreens();refreshBattle();$('battle-exit-button').focus({preventScroll:true});
}
function battleMoveName(family){return family==='foreleg'?'長脚押し':family==='push'?'押し返し':family==='jaw'?'大あご崩し':'角すくい';}
function refreshBattle(){
 if(!battle)return;const watching=battle.phase==='watching'||(battle.phase==='finished'&&!battlePresentationFinished),last=battle.lastExchange;
 $('battle-heading').textContent=`自分：${BATTLE_SPECIES[battle.playerSpecies].label}　VS　COM：${BATTLE_SPECIES[battle.opponentSpecies].label}`;
 $('battle-state').textContent=watching?(battleSuspended?'一時停止中':'相手を線の外へ'):'取り組み終了';
 $('battle-position').textContent=watching&&!battleRingOutShown?(Math.abs(battle.position)>3?'土俵ぎわ':''):'';
 $('battle-cue').textContent=watching?(battleRingOutShown?'場外！':last?'':'見守ろう'):battle.winner==='player'?'自分の勝ち！':battle.winner==='opponent'?'COMの勝ち':battle.finishReason==='time-limit'?'時間切れ・引き分け':'引き分け';
 // The move call belongs over the arena, never in a small paragraph below it.
 const move=battleView?.getPresentation();
 $('battle-move-player').textContent=move?.exchangeNumber?move.actor==='player'?battleMoveName(move.family):'踏ん張る':'構え';
 $('battle-move-opponent').textContent=move?.exchangeNumber?move.actor==='opponent'?battleMoveName(move.family):'踏ん張る':'構え';
 $('battle-moves').hidden=!watching||battleSuspended||battleRingOutShown;
 $('battle-result').textContent=last?.reason||''; // optional accessible detail, not persistent visual prose
 $('battle-finish-button').hidden=watching;$('battle-exit-button').textContent=watching?'中止して仲間へ':'仲間へ';
 $('battle-screen').dataset.phase=watching?(battleRingOutShown?'ringout':'watching'):'finished';
}
function resumeBattleAudio(){audio.battle({fresh:battleAudioFresh});battleAudioFresh=false;}
function suspendBattle(){if(state.mode==='battle'){battleSuspended=true;audio.pause();refreshBattle();}}
function continueVisibleActivity(){
 continueObservationAudio();
 if(state.mode==='battle'&&!document.hidden&&document.hasFocus?.()!==false){battleSuspended=false;resumeBattleAudio();refreshBattle();}
}
function advanceVisibleBattle(dt){
 if(state.mode!=='battle'||!battle||battleSuspended||document.hidden||document.hasFocus?.()===false)return;
 const previous=battle;battle=advanceBattle(battle,dt);
 if(previous.exchanges!==battle.exchanges||previous.phase!==battle.phase)refreshBattle();
}
function leaveBattle(){
 if(state.mode!=='battle')return;
 if(battle.phase==='watching')battle=cancelBattle(battle);
 audio.pause();battlePresentationEvents=[];battleRingOutShown=false;battleView?.dispose();battleView=null;state.mode='companions';input.clear();refreshCompanions();syncScreens();$('companions-close-button').focus({preventScroll:true});
}
function returnFromBattle(){leaveBattle();companionReturn='playing';closeCompanions();}
function positionInspector(){
 if(!inspectCamera)return;
 inspectCamera.aspect=innerWidth/innerHeight;inspectCamera.updateProjectionMatrix();
 if(inspectModel){
  inspectModel.position.set(innerWidth<=760?0:-.7,innerWidth<=760?.5:0,0);
  // Its wide legs must remain in-frame on tall, narrow observation screens.
  if(inspectModel.userData.species==='waterstrider')inspectModel.scale.setScalar(Math.min(4,inspectCamera.aspect*7.3));
  if(inspectModel.userData.species==='mantis')inspectModel.scale.setScalar(Math.min(4,inspectCamera.aspect*7.4));
  if(inspectModel.userData.species==='longhorn')inspectModel.scale.setScalar(Math.min(6,inspectCamera.aspect*10.7));
  if(inspectModel.userData.species==='swallowtail')inspectModel.scale.setScalar(Math.min(4,inspectCamera.aspect*6.2));
  if(inspectModel.userData.species==='bee')inspectModel.scale.setScalar(Math.min(8,inspectCamera.aspect*16));
  if(inspectModel.userData.species==='manticora')inspectModel.scale.setScalar(Math.min(3.2*(inspectModel.userData.individualScale||1),inspectCamera.aspect*5));
  if(inspectModel.userData.species==='euchirus')inspectModel.scale.setScalar(Math.min(2.8,inspectCamera.aspect*3.2));
  if(['metallifer','atlas','elephant','goliath','fivehorn','miyama'].includes(inspectModel.userData.species))inspectModel.scale.setScalar(Math.min(3.4*(inspectModel.userData.individualScale||1),inspectCamera.aspect*(inspectModel.userData.species==='atlas'?4.2:4.5)));
  if(['stag','giantstag'].includes(inspectModel.userData.species))inspectModel.scale.setScalar(Math.min(4*(inspectModel.userData.individualScale||1),inspectCamera.aspect*5.2));
  if(inspectModel.userData.species==='rhino')inspectModel.scale.setScalar(Math.min(4*(inspectModel.userData.individualScale||1),inspectCamera.aspect*5.2));
 }
}
function resize(){if(!renderer)return;renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6));renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();positionInspector();}
function collides(x,z){for(const c of [...(world.colliders||[]),...(rhinoHabitat?.colliders||[]),...(stagHabitat?.colliders||[]),...(giantStagHabitat?.colliders||[]),...(elephantHabitat?.colliders||[]),...(goliathHabitat?.colliders||[]),...(fiveHornHabitat?.colliders||[]),...(miyamaHabitat?.colliders||[]),...(metalliferHabitat?.colliders||[]),...(atlasHabitat?.colliders||[]),...(jewelHabitat?.colliders||[])])if(Math.hypot(x-c.x,z-c.z)<c.r+.28)return true;return false;}
function updatePlayer(dt,actions){
 const p=state.player;
 p.yaw-=actions.yaw*.0022*state.sensitivity;p.pitch=Math.max(-1.35,Math.min(1.32,p.pitch-actions.pitch*.0022*state.sensitivity));p.quiet=actions.quiet;
 p.running=!!actions.run&&!p.quiet;
 const speed=p.quiet?1.05:p.running?5.4:2.7;
 const dx=(Math.cos(p.yaw)*actions.x-Math.sin(p.yaw)*actions.z)*speed*dt,dz=(-Math.sin(p.yaw)*actions.x-Math.cos(p.yaw)*actions.z)*speed*dt;
 const ox=p.x,oz=p.z,bound=world.bounds||85;
 const nx=Math.max(-bound,Math.min(bound,p.x+dx)),nz=Math.max(-bound,Math.min(bound,p.z+dz));
 if(!collides(nx,p.z))p.x=nx;if(!collides(p.x,nz))p.z=nz;
 p.speed=Math.hypot(p.x-ox,p.z-oz)/dt;
 const targetY=world.heightAt(p.x,p.z)+(p.quiet?1.28:1.65);p.y+=(targetY-p.y)*Math.min(1,dt*12);
 if((Math.abs(p.x)>bound-.3||Math.abs(p.z)>bound-.3)&&toastTime<=0)toast('この先は、まだ歩けない森。草地へ戻ろう。',4);
}
function updateHUD(){
 world.setDungBall?.(simulation.dungBall);
 const p=state.player,t=simulation.findTarget(p,direction());
 const station=nearbyBaitStation(),interaction=$('interaction-hint');
 interaction.hidden=!station||!!simulation.caught;
 interaction.textContent=station===logFruitHabitat?.station?(simulation.logFruit?.active?`E / X（□） 倒木の果実を片付ける · ${simulation.logFruit.status==='resting'?'果実のそばで休止中':'待つなら3mほど離れる'}`:'E / X（□） 倒木に発酵果実を置く'):station?(simulation.bait?.active?'E / X（□） 果実を片付ける · 待つなら3mほど離れる':'E / X（□） 発酵果実を置く'):'';
 $('count-label').textContent=`図鑑の記録 ${journal.entries.length} 種`;
 $('location-label').textContent=locationLabel(p.x,p.z);
 $('quiet-label').hidden=!p.quiet&&!p.running;
 $('quiet-label').textContent=p.quiet?'そっと歩行中':p.running?'ダッシュ中':'';
 $('crosshair').classList.toggle('near',!!t);$('crosshair').classList.toggle('ready',!!t?.catchable);
 const unlocked=document.pointerLockElement!==canvas;
 $('target-hint').textContent=t?(t.catchable?(unlocked?'網が届く · Space':'網が届く · 左クリック / Space'):t.reason):'';
 $('controls-hint').textContent='WASD 移動 · Shift 走る · 右クリック そっと · Space 網';
 $('controls-hint').hidden=!unlocked&&state.elapsed>24;
 $('look-resume-hint').hidden=!unlocked;
}
function insectSupport(item){
 if(item.species==='cicada')return world.barkSupportAt(item.home);
 if(item.species==='grasshopper')return world.grasshopperSupportAt?.(item.airborne?(item.jumpProgress<.5?item.jumpStart:item.jumpEnd):item);
 if(item.species==='hercules')return world.herculesSupportAt?.(item);
 if(item.species==='leafinsect')return world.leafSupportAt?.(item);
 if(item.species==='waterstrider')return waterHabitat?.supportAt(item);
 if(item.species==='leafcutterant')return antHabitat?.supportAt(item);
 if(item.species==='firefly')return world.fireflySupportAt?.(item);
 return null;
}
function render(time,dt){
 if(state.mode==='battle'&&battleView){
  const visible=!battleSuspended&&!document.hidden&&document.hasFocus?.()!==false,step=visible&&Number.isFinite(dt)&&dt>0?dt:0;
  const presentation=battleView.update(battle,step,{reducedMotion});
  // A transient failed frame may recover this move's edges, never a backlog
  // of older exchanges. Effects also expire with their visible motion phase.
  if(presentation?.events?.length)battlePresentationEvents.push(...presentation.events);
  battlePresentationEvents=battlePresentationEvents.filter(event=>event.exchange?.number===presentation?.exchangeNumber);
  renderer.render(battleView.scene,battleView.camera);
  if(step>0){
   for(const event of battlePresentationEvents){
    if(event.type==='started'){audio.battleWindup(event.exchange,{silent:presentation.stage!=='prepare'});refreshBattle();}
    else if(event.type==='contact'&&presentation.stage==='contact')audio.battleContact(event.exchange);
   }
   battlePresentationEvents=[];
   if(presentation?.ringOutVisible&&!battleRingOutShown){battleRingOutShown=true;refreshBattle();}
   if(presentation?.finished&&!battlePresentationFinished){battlePresentationFinished=true;audio.battleResult(battle.winner);refreshBattle();}
  }
  return;
 }
 logFruitHabitat?.setActive(!!simulation.logFruit?.active);
 world.setDungBall?.(simulation.dungBall);
 // Water cues use simulation time: pause/inspection/journal must not advance them.
 waterHabitat?.update(simulation.items,simulation.time);
 world.setBaitActive?.(!!simulation.bait?.active);
 const p=state.player;camera.position.set(p.x,p.y,p.z);camera.rotation.set(p.pitch,p.yaw,0,'YXZ');
 for(const item of simulation.items){const group=models.get(item.id);if(group){group.visible=!item.caught;updateInsectModel(group,item,time,insectSupport(item));}}
 if(state.mode==='inspect'&&inspectModel){
  const item=simulation.caught;const fake={...item,x:0,y:0,z:0,heading:0,resting:true,flightBlend:0,wingPhase:time*2};
  updateInsectModel(inspectModel,fake,time);
  positionInspector();inspectModel.rotation.y=inspectTurn;inspectModel.rotation.x=inspectTilt;
  if(!reducedMotion)inspectTurn+=dt*.12;
  renderer.render(inspectScene,inspectCamera);
 }else {net.update(time,state.swing,p.speed);renderer.render(scene,camera);}
}
function frame(ms){
 if(disposed)return;
 requestAnimationFrame(frame);
 const dt=Math.min(.06,lastTime?(ms-lastTime)/1000:1/60);lastTime=ms;state.time+=dt;frames++;
 const actions=input.read(dt);
 advanceVisibleBattle(dt);
 if(state.mode==='playing'){
  state.elapsed+=dt;updatePlayer(dt,actions);simulation.update(dt,state.player);
  for(const item of simulation.items){if(item.state==='startled'&&insectStates.get(item.id)!=='startled'&&Math.hypot(item.x-state.player.x,item.z-state.player.z)<7)toast(state.player.quiet||state.player.speed<.12?'近づきすぎたようだ。少し離れて見守ろう。':'足音に気づいたようだ。右クリック / LB で、そっと近づこう。',4);insectStates.set(item.id,item.state);}
  world.update(state.time,dt);audio.update(dt,state.player,simulation.items,state.time);
  state.cooldown=Math.max(0,state.cooldown-dt);if(state.swing>0){state.swing+=dt/.48;if(state.swing>=1)state.swing=0;}
  if(captureDelay>0){captureDelay-=dt;if(captureDelay<=0&&simulation.caught)showInspection(simulation.caught);}
  if(toastTime>0){toastTime-=dt;if(toastTime<=0)$('toast').textContent='';}
  updateHUD();
 }else if(state.mode==='title'){world.update(state.time,dt);simulation.update(dt,null);}
 else if(state.mode==='inspect'){inspectTurn+=actions.yaw*.007;inspectTilt=Math.max(-1.2,Math.min(1.2,inspectTilt+actions.pitch*.005));if(!document.hidden)audio.update(dt,state.player,simulation.items,state.time);}
 render(state.time,dt);
}
try{
 roster=createCompanionRoster();expedition=createExpedition();
 renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
 renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 camera=new THREE.PerspectiveCamera(66,innerWidth/innerHeight,.04,240);activateHabitat('meadow');
 net=createNet();camera.add(net.group);
 inspectScene=new THREE.Scene();inspectScene.background=new THREE.Color(0x748678);inspectScene.add(new THREE.HemisphereLight(0xf8f4da,0x344635,1.05));
 const key=new THREE.DirectionalLight(0xffedcc,1.2);key.position.set(-3,5,4);inspectScene.add(key);const fill=new THREE.DirectionalLight(0xd2e7f2,.65);fill.position.set(3,1,-2);inspectScene.add(fill);
 inspectCamera=new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.05,20);inspectCamera.position.set(0,1.35,3.4);inspectCamera.lookAt(0,0,0);
 audio=createAudio();audio.resetField(state.habitat);journal=createJournal();journalUI=createJournalUI({journal,species:SPECIES,onClose:()=>closeJournal()});
 input=createInput(canvas,{action:swing,interact,pause,journal:()=>openJournal(),companions:toggleCompanions,back:()=>{if(state.mode==='inspect')release();else pause();},blur:()=>{if(outingChanging)outingInterrupted=true;suspendBattle();if(state.mode==='playing')pause();else audio.pause();},mode:()=>state.mode,lock:requestLock});
 try{const saved=JSON.parse(localStorage.getItem('mushi-settings-v1')||'null');if(saved){state.sensitivity=Math.max(.3,Math.min(2,Number(saved.sensitivity)||1));state.volume=Math.max(0,Math.min(1,Number(saved.volume)||0));}}catch{}
 for(const [id,habitat] of Object.entries(HABITATS)){const option=document.createElement('option');option.value=id;option.textContent=habitat.name;$('travel-habitat-select').append(option);}
 syncTravelChoice();$('travel-habitat-select').addEventListener('change',updateTravelChoice);$('travel-button').onclick=travelHabitat;
 for(const [id,species] of Object.entries(BATTLE_SPECIES)){const option=document.createElement('option');option.value=id;option.textContent=species.label;$('battle-opponent-select').append(option);}
 $('battle-opponent-select').value='rhino';
 $('capture-battle-button').onclick=battleCaptured;$('keep-button').onclick=keepCaptured;$('companions-button').onclick=openCompanions;$('pause-companions-button').onclick=openCompanions;
 $('companions-close-button').onclick=closeCompanions;$('companion-release-button').onclick=releaseCompanion;
 $('companion-select').addEventListener('change',()=>{releaseArmed=null;refreshCompanions();});
 $('battle-start-button').onclick=startBattle;$('battle-exit-button').onclick=leaveBattle;$('battle-finish-button').onclick=returnFromBattle;
 roster.subscribe(companionStatus);expedition.subscribe(expeditionStatus);
 $('sensitivity').value=state.sensitivity;$('volume').value=state.volume;audio.setVolume(state.volume);
 $('sensitivity').addEventListener('input',applySettings);$('volume').addEventListener('input',applySettings);
 $('sensitivity').addEventListener('change',applySettings);$('volume').addEventListener('change',applySettings);
 $('start-button').onclick=start;$('pause-button').onclick=pause;$('resume-button').onclick=resume;$('restart-button').onclick=newOuting;$('title-button').onclick=title;$('release-button').onclick=release;
 $('journal-button').onclick=()=>openJournal();$('pause-journal-button').onclick=()=>openJournal();$('inspect-journal-button').onclick=()=>openJournal(simulation.caught?.species);
 document.addEventListener('pointerlockchange',()=>{const locked=document.pointerLockElement===canvas;const lost=pointerOwned&&!locked;pointerOwned=locked;if(lost&&state.mode==='playing'&&!simulation.caught)pause();});
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();fatal('3D表示が中断されました。ページを再読み込みすると、野原の入り口から再開できます。');disposed=true;});
 window.addEventListener('focus',continueVisibleActivity);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){if(outingChanging)outingInterrupted=true;suspendBattle();}else continueVisibleActivity();});
 window.addEventListener('pagehide',()=>{if(outingChanging)outingInterrupted=true;suspendBattle();if(state.mode==='playing')pause();else audio.pause();input.clear();audio.dispose?.();});
 window.addEventListener('pageshow',event=>{if(event.persisted){audio=createAudio();audio.setVolume(state.volume);audio.resetField(state.habitat);continueVisibleActivity();}});
 window.addEventListener('resize',()=>{resize();battleView?.resize(innerWidth/innerHeight);});resetPlayer();resize();syncScreens();requestAnimationFrame(frame);
 
}catch(error){console.error(error);fatal('3D表示を開始できませんでした。Chrome / Edge のハードウェア アクセラレーションを有効にして、ページを再読み込みしてください。');}
