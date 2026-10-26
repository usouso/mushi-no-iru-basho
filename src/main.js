import { createWorld } from './world.js?v=0.15.1&b=a70f15b11632';
import { createTropicalWorld } from './world-tropical.js?v=0.15.1&b=a70f15b11632';
import { createUnderstoryWorld } from './world-understory.js?v=0.15.1&b=a70f15b11632';
import { createNightWorld } from './world-night.js?v=0.15.1&b=a70f15b11632';
import { createSavannaWorld } from './world-savanna.js?v=0.15.1&b=a70f15b11632';
import { createWaterHabitat } from './water-habitat.js?v=0.15.1&b=a70f15b11632';
import { createDivingHabitat } from './diving-habitat.js?v=0.15.1&b=a70f15b11632';
import { createMantisHabitat } from './mantis-habitat.js?v=0.15.1&b=a70f15b11632';
import { createLadybirdHabitat } from './ladybird-habitat.js?v=0.15.1&b=a70f15b11632';
import { createBeeHabitat } from './bee-habitat.js?v=0.15.1&b=a70f15b11632';
import { createSwallowtailHabitat } from './swallowtail-habitat.js?v=0.15.1&b=a70f15b11632';
import { createJewelHabitat } from './jewel-habitat.js?v=0.15.1&b=a70f15b11632';
import { createLonghornHabitat } from './longhorn-habitat.js?v=0.15.1&b=a70f15b11632';
import { createRhinoHabitat } from './rhino-habitat.js?v=0.15.1&b=a70f15b11632';
import { createStagHabitat } from './stag-habitat.js?v=0.15.1&b=a70f15b11632';
import { createAntHabitat } from './ant-habitat.js?v=0.15.1&b=a70f15b11632';
import { createLogFruitHabitat } from './log-fruit-habitat.js?v=0.15.1&b=a70f15b11632';
import { createInsects, SPECIES } from './insects.js?v=0.15.1&b=a70f15b11632';
import { createInsectModel, updateInsectModel } from './insect-models.js?v=0.15.1&b=a70f15b11632';
import { createInput } from './input.js?v=0.15.1&b=a70f15b11632';
import { createAudio } from './audio.js?v=0.15.1&b=a70f15b11632';
import { createNet } from './net.js?v=0.15.1&b=a70f15b11632';
import { createJournal } from './journal.js?v=0.15.1&b=a70f15b11632';
import { createJournalUI } from './journal-ui.js?v=0.15.1&b=a70f15b11632';
import { createCaptureVisibility } from './capture-visibility.js?v=0.15.1&b=a70f15b11632';

const HABITATS={
 meadow:{create:createWorld,hint:'白い翅が、草花の上でひと休み。近づいてみよう。'},
 tropical:{create:createTropicalWorld,hint:'木陰に青い翅。止まると、茶色の裏が見えます。'},
 understory:{create:createUnderstoryWorld,hint:'葉の形と、ゆっくりした揺れに目をこらしてみよう。'},
 night:{create:createNightWorld,hint:'湿地の葉先に、小さな光。そっと近づいてみよう。'},
 savanna:{create:createSavannaWorld,hint:'地面の球を押す小さな虫。横から、そっと近づいてみよう。'}
};
function habitatId(id){return Object.prototype.hasOwnProperty.call(HABITATS,id)?id:'meadow';}
const THREE=window.THREE;
const $=id=>document.getElementById(id);
const canvas=$('game-canvas');
const state={mode:'title',habitat:'meadow',time:0,elapsed:0,captures:0,seen:[],sensitivity:1,volume:.25,player:{x:0,y:1.65,z:10,yaw:0,pitch:-.03,speed:0,quiet:false,running:false},swing:0,cooldown:0};
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
let renderer,scene,camera,world,waterHabitat,divingHabitat,mantisHabitat,ladybirdHabitat,beeHabitat,swallowtailHabitat,jewelHabitat,longhornHabitat,rhinoHabitat,stagHabitat,antHabitat,logFruitHabitat,simulation,input,audio,net,models=new Map(),inspectScene,inspectCamera,inspectModel,inspectTurn=0,inspectTilt=.2;
let toastTime=0,captureDelay=0,lastTime=0,accumulator=0,frames=0,disposed=false;
const insectStates=new Map();
// Own the lock transition explicitly; browsers may queue duplicate unlock events.
let pointerOwned=false;
let journal,journalUI,journalReturn='playing';
const forward=new THREE.Vector3();
function fatal(message){state.mode='error';$('error-message').textContent=message;$('error-screen').hidden=false;$('start-screen').hidden=true;$('hud').hidden=true;audio?.pause();audio?.dispose?.();journalUI?.close();$('app-shell').inert=false;canvas.inert=false;}
function toast(text,duration=3){$('toast').textContent=text;toastTime=duration;}
function direction(){return {x:-Math.sin(state.player.yaw)*Math.cos(state.player.pitch),y:Math.sin(state.player.pitch),z:-Math.cos(state.player.yaw)*Math.cos(state.player.pitch)};}
function syncScreens(){
 $('start-screen').hidden=state.mode!=='title';$('hud').hidden=state.mode!=='playing';$('pause-screen').hidden=state.mode!=='paused';$('inspect-screen').hidden=state.mode!=='inspect';
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
// Habitat selection is a title-screen comparison entry, not a committed fast-travel system.
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
 rhinoHabitat=next==='night'?createRhinoHabitat(world,scene):null;
 stagHabitat=next==='night'?createStagHabitat(world,scene):null;
 antHabitat=next==='tropical'?createAntHabitat(world,scene):null;
 logFruitHabitat=next==='tropical'?createLogFruitHabitat(world,scene):null;
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
 if(beeHabitat){habitatOptions.extraHomes=[...(habitatOptions.extraHomes||[]),...beeHabitat.homes];habitatOptions.beeSupports=beeHabitat.beeSupports;}
 if(swallowtailHabitat){const[,x,z,altitude]=swallowtailHabitat.homes[0];habitatOptions.extraHomes=[...(habitatOptions.extraHomes||[]),...swallowtailHabitat.homes];habitatOptions.swallowtailSupports=[{home:{x,y:world.heightAt(x,z)+altitude,z},perches:swallowtailHabitat.swallowtailSupports}];}
 if(jewelHabitat){habitatOptions.extraHomes=[...(habitatOptions.extraHomes||[]),...jewelHabitat.homes];habitatOptions.jewelSupports=jewelHabitat.jewelSupports;}
 if(longhornHabitat){habitatOptions.extraHomes=[...(habitatOptions.extraHomes||[]),...longhornHabitat.homes];habitatOptions.longhornSupports=longhornHabitat.longhornSupports;}
 const captureOccluders=[...(world.captureOccluders||[]),...(antHabitat?.captureOccluders||[]),...(mantisHabitat?.captureOccluders||[]),...(ladybirdHabitat?.captureOccluders||[]),...(rhinoHabitat?.captureOccluders||[]),...(stagHabitat?.captureOccluders||[]),...(beeHabitat?.captureOccluders||[]),...(swallowtailHabitat?.captureOccluders||[]),...(jewelHabitat?.captureOccluders||[])];
 habitatOptions.hasLineOfSight=createCaptureVisibility(captureOccluders);
 simulation=createInsects(world.heightAt,habitatOptions);
 models=new Map();for(const item of simulation.items){const model=createInsectModel(item.species);models.set(item.id,model);scene.add(model);}
 state.habitat=next;insectStates.clear();captureDelay=0;state.swing=0;state.cooldown=0;
}
function resetPlayer(){
 const p=state.player;p.x=world.spawn.x;p.z=world.spawn.z;p.y=world.heightAt(p.x,p.z)+1.65;p.yaw=0;p.pitch=-.07;p.speed=0;p.quiet=false;p.running=false;
}
function start(){
 if(state.mode==='error')return;
 if(state.mode==='title'){const selected=habitatId($('habitat-select')?.value);if(selected!==state.habitat)activateHabitat(selected);simulation.reset();audio.resetField(state.habitat);state.captures=0;state.seen=[];state.elapsed=0;resetPlayer();}
 state.mode='playing';syncScreens();input.clear();audio.start();requestLock();toast(HABITATS[state.habitat].hint,6);
}
function pause({lock=true}={}){
 if(state.mode==='journal'){closeJournal({lock});return;}
 if(state.mode==='paused'){resume({lock});return;}
 if(state.mode==='inspect'){release({lock});return;}
 if(state.mode!=='playing')return;
 state.mode='paused';state.player.speed=0;input.clear();unlock();audio.pause();syncScreens();$('resume-button').focus({preventScroll:true});
}
function resume({lock=true}={}){if(state.mode!=='paused')return;applySettings();state.mode='playing';syncScreens();input.clear();audio.start();restoreControl(lock);}
function title(){
 state.mode='title';simulation.release();simulation.removeBait?.();simulation.removeLogFruit?.();captureDelay=0;state.swing=0;state.cooldown=0;input.clear();unlock();audio.pause();resetPlayer();syncScreens();$('start-button').focus({preventScroll:true});
}
function restart(){
 simulation.reset();audio.resetField(state.habitat);state.captures=0;state.seen=[];state.elapsed=0;state.cooldown=0;captureDelay=0;state.swing=0;resetPlayer();state.mode='playing';syncScreens();input.clear();audio.start();requestLock();toast('風の通る入り口から、もう一度。');
}
function showInspection(item){
 state.mode='inspect';state.player.speed=0;unlock();input.clear();audio.inspect();
 if(inspectModel){inspectScene.remove(inspectModel);inspectModel.traverse(o=>{o.geometry?.dispose();if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose());}});}
 inspectModel=createInsectModel(item.species,{inspection:true});
 const scales={butterfly:5.1,dragonfly:4.7,cicada:6.1,morpho:3.4,grasshopper:4.4,hercules:3.8,leafinsect:4,waterstrider:4,leafcutterant:4,firefly:4,dungbeetle:4,divingbeetle:4,mantis:4,ladybird:12,rhino:4,stag:4,bee:8,swallowtail:4,jewel:6,longhorn:6};inspectModel.scale.setScalar(scales[item.species]||5);inspectScene.add(inspectModel);
 inspectTurn=-.45;inspectTilt=.3;positionInspector();
 const data=SPECIES[item.species];$('insect-name').textContent=data.name||data.label;$('insect-size').textContent=data.size||'';$('insect-description').textContent=data.observation||data.description||'';$('insect-hint').textContent=data.hint||'';
 syncScreens();$('release-button').focus({preventScroll:true});
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
  state.captures++;if(!state.seen.includes(result.item.species))state.seen.push(result.item.species);
  journal.record({species:result.item.species,location:result.item.species==='longhorn'?'温帯の林縁・太い幹':result.item.species==='jewel'?'温帯の草地・若木の葉':result.item.species==='swallowtail'?'温帯の草地・池岸':result.item.species==='bee'?'温帯の草地・西の花群':['rhino','stag'].includes(result.item.species)?'夜の林縁・樹液のある木':locationLabel(result.item.x,result.item.z),x:Math.round(result.item.x*10)/10,z:Math.round(result.item.z*10)/10});
  captureDelay=.28;audio.capture();toast('そっと、つかまえた。',.6);
 }else toast(result.reason,2.4);
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
 const item=simulation.release(state.player);state.mode='playing';state.cooldown=.8;state.swing=0;input.clear();audio.start();audio.release();syncScreens();restoreControl(lock);toast(item?.species==='longhorn'?`${SPECIES.longhorn.name}を、太い幹へそっと返しました。`:item?.species==='jewel'?`${SPECIES.jewel.name}を、若木の葉へそっと返しました。`:item?.species==='swallowtail'?`${SPECIES.swallowtail.name}を、池岸へそっと返しました。`:item?.species==='bee'?`${SPECIES.bee.name}を、花のそばへそっと返しました。`:item?.species==='stag'?`${SPECIES.stag.name}を、樹液のある木へそっと返しました。`:item?.species==='rhino'?`${SPECIES.rhino.name}を、樹液のある木へそっと返しました。`:item?.species==='ladybird'?`${SPECIES.ladybird.name}を、草むらへそっと返しました。`:item?.species==='mantis'?`${SPECIES.mantis.name}を、草葉へそっと返しました。`:item?.species==='divingbeetle'?`${SPECIES.divingbeetle.name}を、池へそっと返しました。`:item?.species==='dungbeetle'?`${SPECIES.dungbeetle.name}を、球のそばへそっと返しました。`:item?.species==='firefly'?`${SPECIES.firefly.name}を、夜の湿地へそっと返しました。`:item?.species==='leafcutterant'?`${SPECIES.leafcutterant.name}を、地面へそっと返しました。`:item?.species==='waterstrider'?`${SPECIES.waterstrider.name}を、水面へそっと返しました。`:item?.species==='leafinsect'?`${SPECIES.leafinsect.name}を、葉の上へそっと返しました。`:item?.species==='grasshopper'?'ショウリョウバッタが、草むらへ跳んでいきました。':item?.species==='hercules'?'ヘラクレスオオカブトが、木陰へ歩いていきました。':`${SPECIES[item?.species]?.name||'虫'}が、野原へ飛び立ちました。`,3.8);
}
function locationLabel(x,z){if(world.locationLabel)return world.locationLabel(x,z);return Math.hypot(x-24,z+20)<16?'水辺の草むら':Math.hypot(x+10,z+8)<10?'大きな木の下':z<-32?'森の入り口':'風の通る野原';}
function openJournal(speciesId){
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
 else $('release-button').focus({preventScroll:true});
}
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
  if(inspectModel.userData.species==='stag')inspectModel.scale.setScalar(Math.min(4,inspectCamera.aspect*5.2));
  if(inspectModel.userData.species==='rhino')inspectModel.scale.setScalar(Math.min(4,inspectCamera.aspect*5.2));
 }
}
function resize(){if(!renderer)return;renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6));renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();positionInspector();}
function collides(x,z){for(const c of [...(world.colliders||[]),...(rhinoHabitat?.colliders||[]),...(stagHabitat?.colliders||[]),...(jewelHabitat?.colliders||[])])if(Math.hypot(x-c.x,z-c.z)<c.r+.28)return true;return false;}
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
 $('controls-hint').textContent='WASD 歩く · Shift 走る · 右クリック そっと · マウス 見回す · Space 網（見回し中は左クリックも）';
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
 if(state.mode==='playing'){
  state.elapsed+=dt;updatePlayer(dt,actions);simulation.update(dt,state.player);
  for(const item of simulation.items){if(item.state==='startled'&&insectStates.get(item.id)!=='startled'&&Math.hypot(item.x-state.player.x,item.z-state.player.z)<7)toast(state.player.quiet||state.player.speed<.12?'近づきすぎたようだ。少し離れて見守ろう。':'足音に気づいたようだ。右クリック / LB で、そっと近づこう。',4);insectStates.set(item.id,item.state);}
  world.update(state.time,dt);audio.update(dt,state.player,simulation.items,state.time);
  state.cooldown=Math.max(0,state.cooldown-dt);if(state.swing>0){state.swing+=dt/.48;if(state.swing>=1)state.swing=0;}
  if(captureDelay>0){captureDelay-=dt;if(captureDelay<=0&&simulation.caught)showInspection(simulation.caught);}
  if(toastTime>0){toastTime-=dt;if(toastTime<=0)$('toast').textContent='';}
  updateHUD();
 }else if(state.mode==='title'){world.update(state.time,dt);simulation.update(dt,null);}
 else if(state.mode==='inspect'){inspectTurn+=actions.yaw*.007;inspectTilt=Math.max(-1.2,Math.min(1.2,inspectTilt+actions.pitch*.005));}
 render(state.time,dt);
}
try{
 renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
 renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 camera=new THREE.PerspectiveCamera(66,innerWidth/innerHeight,.04,240);activateHabitat('meadow');
 net=createNet();camera.add(net.group);
 inspectScene=new THREE.Scene();inspectScene.background=new THREE.Color(0x748678);inspectScene.add(new THREE.HemisphereLight(0xf8f4da,0x344635,1.05));
 const key=new THREE.DirectionalLight(0xffedcc,1.2);key.position.set(-3,5,4);inspectScene.add(key);const fill=new THREE.DirectionalLight(0xd2e7f2,.65);fill.position.set(3,1,-2);inspectScene.add(fill);
 inspectCamera=new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.05,20);inspectCamera.position.set(0,1.35,3.4);inspectCamera.lookAt(0,0,0);
 audio=createAudio();audio.resetField(state.habitat);journal=createJournal();journalUI=createJournalUI({journal,species:SPECIES,onClose:()=>closeJournal()});
 input=createInput(canvas,{action:swing,interact,pause,journal:()=>openJournal(),back:()=>{if(state.mode==='inspect')release();else pause();},blur:()=>{if(state.mode==='playing')pause();else audio.pause();},mode:()=>state.mode,lock:requestLock});
 try{const saved=JSON.parse(localStorage.getItem('mushi-settings-v1')||'null');if(saved){state.sensitivity=Math.max(.3,Math.min(2,Number(saved.sensitivity)||1));state.volume=Math.max(0,Math.min(1,Number(saved.volume)||0));}}catch{}
 $('sensitivity').value=state.sensitivity;$('volume').value=state.volume;audio.setVolume(state.volume);
 $('sensitivity').addEventListener('input',applySettings);$('volume').addEventListener('input',applySettings);
 $('sensitivity').addEventListener('change',applySettings);$('volume').addEventListener('change',applySettings);
 $('start-button').onclick=start;$('pause-button').onclick=pause;$('resume-button').onclick=resume;$('restart-button').onclick=restart;$('title-button').onclick=title;$('release-button').onclick=release;
 $('journal-button').onclick=()=>openJournal();$('pause-journal-button').onclick=()=>openJournal();$('inspect-journal-button').onclick=()=>openJournal(simulation.caught?.species);
 document.addEventListener('pointerlockchange',()=>{const locked=document.pointerLockElement===canvas;const lost=pointerOwned&&!locked;pointerOwned=locked;if(lost&&state.mode==='playing'&&!simulation.caught)pause();});
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();fatal('3D表示が中断されました。ページを再読み込みすると、野原の入り口から再開できます。');disposed=true;});
 window.addEventListener('pagehide',()=>{if(state.mode==='playing')pause();else audio.pause();input.clear();audio.dispose?.();});
 window.addEventListener('pageshow',event=>{if(event.persisted){audio=createAudio();audio.setVolume(state.volume);audio.resetField(state.habitat);}});
 window.addEventListener('resize',resize);resetPlayer();resize();syncScreens();requestAnimationFrame(frame);
 
}catch(error){console.error(error);fatal('3D表示を開始できませんでした。Chrome / Edge のハードウェア アクセラレーションを有効にして、ページを再読み込みしてください。');}
