import { createWorld } from './world.js';
import { createInsects, SPECIES } from './insects.js';
import { createInsectModel, updateInsectModel } from './insect-models.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { createNet } from './net.js';
import { createJournal } from './journal.js';
import { createJournalUI } from './journal-ui.js';

const THREE=window.THREE;
const $=id=>document.getElementById(id);
const canvas=$('game-canvas');
const state={mode:'title',time:0,elapsed:0,captures:0,seen:[],sensitivity:1,volume:.25,player:{x:0,y:1.65,z:10,yaw:0,pitch:-.03,speed:0,quiet:false,running:false},swing:0,cooldown:0};
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
let renderer,scene,camera,world,simulation,input,audio,net,models=new Map(),inspectScene,inspectCamera,inspectModel,inspectTurn=0,inspectTilt=.2;
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
function resetPlayer(){
 const p=state.player;p.x=world.spawn.x;p.z=world.spawn.z;p.y=world.heightAt(p.x,p.z)+1.65;p.yaw=0;p.pitch=-.07;p.speed=0;p.quiet=false;p.running=false;
}
function start(){
 if(state.mode==='error')return;
 if(state.mode==='title'){simulation.reset();state.captures=0;state.seen=[];state.elapsed=0;resetPlayer();}
 state.mode='playing';syncScreens();input.clear();audio.start();requestLock();toast('白い翅が、草花の上でひと休み。近づいてみよう。',6);
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
 state.mode='title';simulation.release();captureDelay=0;state.swing=0;input.clear();unlock();audio.pause();resetPlayer();syncScreens();$('start-button').focus({preventScroll:true});
}
function restart(){
 simulation.reset();state.captures=0;state.seen=[];state.elapsed=0;state.cooldown=0;captureDelay=0;state.swing=0;resetPlayer();state.mode='playing';syncScreens();input.clear();audio.start();requestLock();toast('風の通る入り口から、もう一度。');
}
function showInspection(item){
 state.mode='inspect';state.player.speed=0;unlock();input.clear();audio.pause();
 if(inspectModel){inspectScene.remove(inspectModel);inspectModel.traverse(o=>{o.geometry?.dispose();if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose());}});}
 inspectModel=createInsectModel(item.species,{inspection:true});
 const scales={butterfly:5.1,dragonfly:4.7,cicada:6.1};inspectModel.scale.setScalar(scales[item.species]||5);inspectScene.add(inspectModel);
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
 const result=simulation.swing(state.player,direction());
 if(result.ok){
  state.captures++;if(!state.seen.includes(result.item.species))state.seen.push(result.item.species);
  journal.record({species:result.item.species,location:locationLabel(result.item.x,result.item.z),x:Math.round(result.item.x*10)/10,z:Math.round(result.item.z*10)/10});
  captureDelay=.28;audio.capture();toast('そっと、つかまえた。',.6);
 }else toast(result.reason,2.4);
}
function release({lock=true}={}){
 if(state.mode!=='inspect')return;
 const item=simulation.release(state.player);state.mode='playing';state.cooldown=.8;state.swing=0;input.clear();audio.start();audio.release();syncScreens();restoreControl(lock);toast(`${SPECIES[item?.species]?.name||'虫'}が、野原へ飛び立ちました。`,3.8);
}
function locationLabel(x,z){return Math.hypot(x-24,z+20)<16?'水辺の草むら':Math.hypot(x+10,z+8)<10?'大きな木の下':z<-32?'森の入り口':'風の通る野原';}
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
 if(inspectModel){inspectModel.position.set(innerWidth<=760?0:-.7,innerWidth<=760?.5:0,0);}
}
function resize(){if(!renderer)return;renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6));renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();positionInspector();}
function collides(x,z){for(const c of world.colliders||[])if(Math.hypot(x-c.x,z-c.z)<c.r+.28)return true;return false;}
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
 const p=state.player,t=simulation.findTarget(p,direction());
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
function render(time,dt){
 const p=state.player;camera.position.set(p.x,p.y,p.z);camera.rotation.set(p.pitch,p.yaw,0,'YXZ');
 for(const item of simulation.items){const group=models.get(item.id);if(group){group.visible=!item.caught;updateInsectModel(group,item,time);}}
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
 scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(66,innerWidth/innerHeight,.04,240);scene.add(camera);
 world=createWorld(scene);simulation=createInsects(world.heightAt);
 for(const item of simulation.items){const model=createInsectModel(item.species);models.set(item.id,model);scene.add(model);}
 net=createNet();camera.add(net.group);
 inspectScene=new THREE.Scene();inspectScene.background=new THREE.Color(0x748678);inspectScene.add(new THREE.HemisphereLight(0xf8f4da,0x344635,1.05));
 const key=new THREE.DirectionalLight(0xffedcc,1.2);key.position.set(-3,5,4);inspectScene.add(key);const fill=new THREE.DirectionalLight(0xd2e7f2,.65);fill.position.set(3,1,-2);inspectScene.add(fill);
 inspectCamera=new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.05,20);inspectCamera.position.set(0,1.35,3.4);inspectCamera.lookAt(0,0,0);
 audio=createAudio();journal=createJournal();journalUI=createJournalUI({journal,species:SPECIES,onClose:()=>closeJournal()});
 input=createInput(canvas,{action:swing,pause,journal:()=>openJournal(),back:()=>{if(state.mode==='inspect')release();else pause();},blur:()=>{if(state.mode==='playing')pause();else audio.pause();},mode:()=>state.mode,lock:requestLock});
 try{const saved=JSON.parse(localStorage.getItem('mushi-settings-v1')||'null');if(saved){state.sensitivity=Math.max(.3,Math.min(2,Number(saved.sensitivity)||1));state.volume=Math.max(0,Math.min(1,Number(saved.volume)||0));}}catch{}
 $('sensitivity').value=state.sensitivity;$('volume').value=state.volume;audio.setVolume(state.volume);
 $('sensitivity').addEventListener('input',applySettings);$('volume').addEventListener('input',applySettings);
 $('sensitivity').addEventListener('change',applySettings);$('volume').addEventListener('change',applySettings);
 $('start-button').onclick=start;$('pause-button').onclick=pause;$('resume-button').onclick=resume;$('restart-button').onclick=restart;$('title-button').onclick=title;$('release-button').onclick=release;
 $('journal-button').onclick=()=>openJournal();$('pause-journal-button').onclick=()=>openJournal();$('inspect-journal-button').onclick=()=>openJournal(simulation.caught?.species);
 document.addEventListener('pointerlockchange',()=>{const locked=document.pointerLockElement===canvas;const lost=pointerOwned&&!locked;pointerOwned=locked;if(lost&&state.mode==='playing'&&!simulation.caught)pause();});
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();fatal('3D表示が中断されました。ページを再読み込みすると、野原の入り口から再開できます。');disposed=true;});
 window.addEventListener('pagehide',()=>{if(state.mode==='playing')pause();else audio.pause();input.clear();audio.dispose?.();});
 window.addEventListener('pageshow',event=>{if(event.persisted){audio=createAudio();audio.setVolume(state.volume);}});
 window.addEventListener('resize',resize);resetPlayer();resize();syncScreens();requestAnimationFrame(frame);
 
}catch(error){console.error(error);fatal('3D表示を開始できませんでした。Chrome / Edge のハードウェア アクセラレーションを有効にして、ページを再読み込みしてください。');}
