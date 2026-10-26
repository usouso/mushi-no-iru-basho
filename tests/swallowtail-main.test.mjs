/** Actual-main/geometry/audio-control CPU integration, not browser rendering or
 * real codec/listening QA. Reuses existing DOM harness and asset-audio double. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createIntegratedAudioMock} from './fixtures/integrated-audio-mock.mjs';
const root=path.resolve(import.meta.dirname,'..');
async function app(t,audio){
 Object.defineProperty(globalThis,'__swallowtailAudioTest',{configurable:true,value:audio});t.after(()=>delete globalThis.__swallowtailAudioTest);
 const existing=fs.readFileSync(path.join(root,'tests/hercules-main.test.mjs'),'utf8'),marker='\nconst beetles=()=>';assert.ok(existing.includes(marker));
 let source=existing.slice(0,existing.indexOf(marker));
 source=source.replace('const ctx2d={};','const ctx2d={clip(){}};');
 source=source.replace("from './fixtures/journal-locks.mjs'",`from ${JSON.stringify(pathToFileURL(path.join(root,'tests/fixtures/journal-locks.mjs')).href)}`).replace("const root=path.resolve(import.meta.dirname,'..');",`const root=${JSON.stringify(root)};`);
 source=source.replace('window.AudioContext=AudioContext;',"window.AudioContext=globalThis.__swallowtailAudioTest.AudioContext;window.fetch=globalThis.__swallowtailAudioTest.fetch;window.location={href:'https://game.invalid/play/index.html',origin:'https://game.invalid'};");
 const read="let source=fs.readFileSync(path.join(root,'src',name),'utf8');";assert.ok(source.includes(read));source=source.replace(read,read+"\n if(name==='audio.js')source=source.replaceAll('import.meta.url',JSON.stringify('https://game.invalid/play/src/audio.js?v=0.9.0&b=123456abcdef'));");
 source=source.replace('export {state,simulation,world,journal,','export {state,simulation,world,swallowtailHabitat,models,journal,');
 source=source.replace('let renderedScene;let rendererChecks','let renderedScene,renderedCamera;let rendererChecks').replace('renderedScene=scene;scene.updateMatrixWorld','renderedScene=scene;renderedCamera=camera;scene.updateMatrixWorld');
 source+='\nexport {g,frame,elements,key,choose,find,modal,descendants,renderedScene,renderedCamera,moduleURL};';
 return import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
}
const point=i=>({x:i.x,y:i.y,z:i.z});
test('swallowtail sloped-bank and flight capture, rotatable notes, same-pose return and five-habitat cleanup',async t=>{
 const a=createIntegratedAudioMock(t),h=await app(t,a),{g,elements,key,choose,find}=h;
 const step=n=>{for(let k=0;k<n;k++){a.advance(1/60);h.frame(1);}};
 const bgm=()=>a.liveAssets().filter(n=>n.buffer.file==='bgm_temperate_preview_01.ogg');
 const mouse=(type,button,x=0,y=0)=>{const target=elements.get('game-canvas'),e=new Event(type,{cancelable:true});Object.defineProperties(e,{target:{value:target},button:{value:button},clientX:{value:x},clientY:{value:y}});(type==='mousedown'?target:document).dispatchEvent(e);};
 const pose=i=>({...point(i),orientation:{...i.orientation},wingOpen:i.wingOpen,wingPhase:i.wingPhase,flapBlend:i.flapBlend,legTuck:i.legTuck});
 const sameOrientation=(model,i)=>{const q=i.orientation;assert.ok(q&&[q.x,q.y,q.z,q.w].every(Number.isFinite));assert.ok(Math.abs(Math.abs(model.quaternion.x*q.x+model.quaternion.y*q.y+model.quaternion.z*q.z+model.quaternion.w*q.w)-1)<1e-9,'field root applies the orientation once');};
 t.after(()=>window.dispatchEvent(new Event('pagehide')));
 choose('meadow');await a.flush();assert.equal(g.simulation.items.length,30);assert.equal(g.simulation.items[26].species,'swallowtail','new encounter is appended after all previous residents');assert.equal(g.simulation.items.filter(i=>i.species!=='swallowtail'&&i.species!=='jewel'&&i.species!=='longhorn'&&i.species!=='miyama').length,26);assert.equal(bgm().length,1);assert.equal(a.requests.length,13);
 const oldOrder=[...Array(7).fill('butterfly'),...Array(6).fill('dragonfly'),...Array(4).fill('cicada'),'butterfly',...Array(3).fill('grasshopper'),'waterstrider','divingbeetle','mantis','ladybird','bee'];assert.deepEqual(g.simulation.items.slice(0,26).map(i=>i.species),oldOrder);assert.deepEqual(g.simulation.items.slice(0,27).map(i=>i.id),Array.from({length:27},(_,n)=>`insect-${n+1}`));
 const ownedMaps=new Map(),inspectionMaps=[];const trackMaps=model=>{const maps=new Set();model.traverse(o=>{for(const m of(Array.isArray(o.material)?o.material:[o.material]))if(m?.map)maps.add(m.map);});assert.equal(maps.size,2);for(const map of maps)if(!ownedMaps.has(map)){ownedMaps.set(map,0);map.addEventListener('dispose',()=>ownedMaps.set(map,ownedMaps.get(map)+1));}return[...maps];};const fieldMaps=trackMaps(g.models.get(g.simulation.items[26].id));
 const disposed=new Map();assert.equal(g.swallowtailHabitat.stats.addedMeshes,0);assert.deepEqual(g.swallowtailHabitat.captureOccluders,[]);
 g.models.get(g.simulation.items[26].id).traverse(o=>{for(const resource of[o.geometry,...(Array.isArray(o.material)?o.material:[o.material])].filter(Boolean)){if(disposed.has(resource))continue;disposed.set(resource,0);resource.addEventListener('dispose',()=>disposed.set(resource,disposed.get(resource)+1));}});
 for(const phase of['resting','flying']){
  g.restart();await a.flush();const i=g.simulation.items.find(i=>i.species==='swallowtail'),quiet=phase==='flying';
  const x=i.home.x,z=i.home.z-1.4,y=g.world.heightAt(x,z)+(quiet?1.28:1.65);g.setPose({x,z,y,speed:0});if(quiet)mouse('mousedown',2);
  if(phase==='flying')for(let n=0;n<60*35&&!(i.swallowtailPhase==='flying'&&i.legTuck>.9);n++)step(1);
  assert.equal(i.swallowtailPhase,phase);g.setPose({yaw:Math.atan2(x-i.x,z-i.z),pitch:Math.atan2(i.y-y,Math.hypot(i.x-x,i.z-z))});step(1);
  if(phase==='resting')assert.ok(Math.hypot(i.orientation.x,i.orientation.z)>1e-4,'bank rest is sloped, not an upright proxy');sameOrientation(g.models.get(i.id),i);
  assert.ok(Math.abs(g.state.player.y-y)<1e-9);assert.ok(Math.hypot(i.x-x,i.y-y,i.z-z)<2.6);assert.match(elements.get('target-hint').textContent,/網が届く/);
  key('keydown','Space');key('keyup','Space');mouse('mouseup',2);assert.equal(g.simulation.caught?.id,i.id);const at=pose(i);step(22);assert.equal(g.state.mode,'inspect');assert.deepEqual(pose(i),at);assert.equal(g.models.get(i.id).visible,false);
  const specimen=h.renderedScene.children.find(o=>o.userData.species==='swallowtail');assert.ok(specimen);inspectionMaps.push(trackMaps(specimen));if(phase==='resting')specimen.traverse(o=>{if(o.geometry&&!disposed.has(o.geometry)){const resource=o.geometry;disposed.set(resource,0);resource.addEventListener('dispose',()=>disposed.set(resource,disposed.get(resource)+1));}});assert.equal(specimen.scale.x,4,'new species uses scale 4');const rotation=specimen.rotation.y;mouse('mousedown',0,10,10);mouse('mousemove',0,55,25);step(1);mouse('mouseup',0,55,25);assert.ok(Math.abs(specimen.rotation.y-rotation)>.2);
  if(phase==='resting'){
   const metrics=[];for(const[width,height]of[[320,720],[375,812],[1280,800]]){
    innerWidth=width;innerHeight=height;window.dispatchEvent(new Event('resize'));step(1);let maxX=0,maxY=0,minProjectedX=Infinity,maxProjectedX=-Infinity,minProjectedY=Infinity,maxProjectedY=-Infinity;const v=new window.THREE.Vector3();
    for(const tilt of[-1.2,.3,1.2])for(let n=0;n<32;n++){specimen.rotation.set(tilt,n*Math.PI/16,0);specimen.updateMatrixWorld(true);specimen.traverseVisible(o=>{const p=o.geometry?.attributes.position;if(p)for(let k=0;k<p.count;k++){v.fromBufferAttribute(p,k).applyMatrix4(o.matrixWorld).project(h.renderedCamera);maxX=Math.max(maxX,Math.abs(v.x));maxY=Math.max(maxY,Math.abs(v.y));minProjectedX=Math.min(minProjectedX,v.x);maxProjectedX=Math.max(maxProjectedX,v.x);minProjectedY=Math.min(minProjectedY,v.y);maxProjectedY=Math.max(maxProjectedY,v.y);}});}
    metrics.push({width,height,scale:specimen.scale.x,maxX,maxY,sampledNdcBounds:{left:minProjectedX,right:maxProjectedX,bottom:minProjectedY,top:maxProjectedY},margin:1-Math.max(maxX,maxY)});
   }console.log('Swallowtail inspection CPU sampled projection, not visual/all-angle certification:',JSON.stringify(metrics));assert.ok(metrics.every(m=>m.maxX<1&&m.maxY<1));innerWidth=1280;innerHeight=800;window.dispatchEvent(new Event('resize'));step(1);assert.equal(specimen.scale.x,4,'returning from portrait restores desktop scale');
  }
  elements.get('inspect-journal-button').click();assert.equal(g.state.mode,'journal');assert.equal(h.descendants(h.modal()).filter(n=>String(n.className).split(/\s+/).includes('fj-card')).length,27);const note=find('fj-note');note.value='四枚の翅と尾状突起 j';note.dispatchEvent(new Event('input'));note.focus();key('keydown','KeyJ');key('keyup','KeyJ');assert.equal(g.state.mode,'journal');step(15);assert.deepEqual(pose(i),at);
  key('keydown','Escape');key('keyup','Escape');assert.equal(g.state.mode,'inspect');g.release({lock:false});assert.deepEqual(pose(i),at);assert.match(elements.get('toast').textContent,/池岸へそっと返し/);step(2);assert.ok(Math.hypot(i.x-at.x,i.y-at.y,i.z-at.z)<.01);sameOrientation(g.models.get(i.id),i);
  g.pause();const frozen=pose(i),time=g.simulation.time;step(20);assert.deepEqual(pose(i),frozen);assert.equal(g.simulation.time,time);g.resume({lock:false});step(2);
  document.hidden=true;document.dispatchEvent(new Event('visibilitychange'));await a.flush();assert.equal(g.state.mode,'paused');const hidden=pose(i);step(20);assert.deepEqual(pose(i),hidden);assert.equal(a.liveAssets().length,0);document.hidden=false;document.dispatchEvent(new Event('visibilitychange'));assert.equal(g.state.mode,'paused');g.resume({lock:false});await a.flush();
 }
 assert.ok(!a.requests.some(r=>/(?:^|_)swallowtail(?:_|\.)/.test(r.file)));assert.ok(!a.assetSources().some(n=>/insect_beetle_walk/.test(n.buffer.file)),'swallowtail does not inherit walking beetle audio');
 await g.journal.flush();const saved=g.journal.entries.find(e=>e.species==='swallowtail');assert.equal(saved.note,'四枚の翅と尾状突起 j');assert.equal(saved.location,'温帯の草地・池岸');
 for(const[id,count]of[['tropical',11],['understory',6],['night',6],['savanna',1],['meadow',30]]){choose(id);await a.flush();assert.equal(g.simulation.items.length,count);assert.equal(!!g.swallowtailHabitat,id==='meadow');assert.equal(bgm().length,id==='meadow'?1:0);assert.deepEqual(g.journal.entries.find(e=>e.species==='swallowtail'),saved);}
 for(const map of fieldMaps)assert.equal(ownedMaps.get(map),1,'field-owned wing texture disposed once');for(const map of inspectionMaps[0])assert.equal(ownedMaps.get(map),1,'replaced specimen texture disposed once');for(const map of inspectionMaps[1])assert.equal(ownedMaps.get(map),0,'one latest specimen remains intentionally retained');
 for(const count of disposed.values())assert.equal(count,1);const{createJournal}=await import(h.moduleURL('journal.js'));assert.deepEqual(createJournal(localStorage).entries.find(e=>e.species==='swallowtail'),saved);
});
