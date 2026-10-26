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
 Object.defineProperty(globalThis,'__dungAudioTest',{configurable:true,value:audio});t.after(()=>delete globalThis.__dungAudioTest);
 const existing=fs.readFileSync(path.join(root,'tests/hercules-main.test.mjs'),'utf8'),marker='\nconst beetles=()=>';assert.ok(existing.includes(marker));
 let source=existing.slice(0,existing.indexOf(marker));
 source=source.replace("from './fixtures/journal-locks.mjs'",`from ${JSON.stringify(pathToFileURL(path.join(root,'tests/fixtures/journal-locks.mjs')).href)}`).replace("const root=path.resolve(import.meta.dirname,'..');",`const root=${JSON.stringify(root)};`);
 source=source.replace('window.AudioContext=AudioContext;',"window.AudioContext=globalThis.__dungAudioTest.AudioContext;window.fetch=globalThis.__dungAudioTest.fetch;window.location={href:'https://game.invalid/play/index.html',origin:'https://game.invalid'};");
 const read="let source=fs.readFileSync(path.join(root,'src',name),'utf8');";assert.ok(source.includes(read));source=source.replace(read,read+"\n if(name==='audio.js')source=source.replaceAll('import.meta.url',JSON.stringify('https://game.invalid/play/src/audio.js?v=0.5.0&b=123456abcdef'));");
 source=source.replace('export {state,simulation,world,journal,','export {state,simulation,world,antHabitat,models,journal,');
 source=source.replace('let renderedScene;let rendererChecks','let renderedScene,renderedCamera;let rendererChecks').replace('renderedScene=scene;scene.updateMatrixWorld','renderedScene=scene;renderedCamera=camera;scene.updateMatrixWorld');
 source+='\nexport {g,frame,elements,key,choose,find,modal,descendants,renderedScene,renderedCamera,moduleURL};';
 return import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
}
const point=i=>({x:i.x,y:i.y,z:i.z});
test('savanna rolling, ball occlusion/reset sync, beetle-only inspection and same-ball return',async t=>{
 const a=createIntegratedAudioMock(t),h=await app(t,a),{g,elements,key,choose,find}=h;
 const step=n=>{for(let k=0;k<n;k++){a.advance(1/60);h.frame(1);}};
 const bgm=()=>a.liveAssets().filter(n=>n.buffer.file==='bgm_temperate_preview_01.ogg');
 const swing=()=>{key('keydown','Space');key('keyup','Space');};
 t.after(()=>window.dispatchEvent(new Event('pagehide')));
 const original=g.world;elements.get('habitat-select').value='savanna';elements.get('habitat-select').dispatchEvent(new Event('change'));assert.equal(g.world,original);
 elements.get('start-button').click();step(1);await a.flush();assert.equal(g.state.habitat,'savanna');assert.equal(g.simulation.items.length,1);assert.equal(bgm().length,0);assert.equal(a.requests.length,13);
 const ballMesh=g.world.meshes.find(o=>o.userData.isDungBall);assert.ok(ballMesh);assert.ok(g.world.captureOccluders.includes(ballMesh));
 let item=g.simulation.items[0];assert.equal(item.species,'dungbeetle');const firstBall=g.simulation.dungBall;
 const findTarget=g.simulation.findTarget,queryPositions=[];g.simulation.findTarget=(...args)=>{queryPositions.push([ballMesh.matrixWorld.elements[14],g.simulation.dungBall.position.z]);return findTarget(...args);};
 step(60);g.simulation.findTarget=findTarget;assert.equal(queryPositions.length,60);assert.ok(queryPositions.every(([shown,current])=>shown===current),'HUD LOS must use the current simulation ball matrix');assert.ok(item.dungDistance>0);assert.equal(g.simulation.dungBall.id,firstBall.id);assert.equal(a.assetSources().length,0,'rolling does not reuse beetle sounds or add BGM');
 const blockedPose=()=>{item=g.simulation.items[0];const z=item.z+2.2;g.setPose({x:item.x,z,y:g.world.heightAt(item.x,z)+1.28,yaw:0,pitch:Math.atan2(item.y-1.28,2.2)});assert.ok(Math.hypot(item.y-1.28,2.2)<2.6);};
 blockedPose();swing();assert.equal(g.simulation.caught,null,'real ball blocks an otherwise in-range low-eye root aim');
 assert.equal(elements.get('toast').textContent,'空振り。遮るもののない角度から、あみを構えてみよう');
 assert.doesNotMatch(elements.get('toast').textContent,/近く|近づ/,'in-range ball occlusion must not tell the player to move closer');
 assert.equal(g.simulation.findTarget(g.state.player,{x:0,y:item.y-g.state.player.y,z:item.z-g.state.player.z}),null,'occluded insect is not exposed as a HUD target');
 step(45);item=g.simulation.items[0];g.setPose({x:item.x+1.3,z:item.z,y:1.65,yaw:Math.PI/2,pitch:Math.atan2(item.y-1.65,1.3)});swing();assert.equal(g.simulation.caught?.id,item.id);
 const at=point(item),heldBall=g.simulation.dungBall;step(22);assert.equal(g.state.mode,'inspect');assert.deepEqual(point(item),at);assert.deepEqual(g.simulation.dungBall,heldBall);
 assert.equal(g.models.get(item.id).visible,false);assert.equal(ballMesh.visible,true);assert.deepEqual({x:ballMesh.position.x,y:ballMesh.position.y,z:ballMesh.position.z},heldBall.position);
 const specimen=h.renderedScene.children.find(o=>o.userData.species==='dungbeetle');assert.ok(specimen);assert.equal(specimen.userData.containsDungBall,false);specimen.traverse(o=>assert.notEqual(o.userData.isDungBall,true));
 // Actual drag input must rotate the specimen; its own update must not reset it.
 const mouse=(type,x,y)=>{const target=elements.get('game-canvas'),e=new Event(type,{cancelable:true});Object.defineProperties(e,{target:{value:target},button:{value:0},clientX:{value:x},clientY:{value:y}});(type==='mousedown'?target:document).dispatchEvent(e);};
 const rotation=specimen.rotation.y;mouse('mousedown',20,20);mouse('mousemove',65,35);step(1);mouse('mouseup',65,35);assert.ok(Math.abs(specimen.rotation.y-rotation)>.2);
 const metrics=[];for(const[width,height]of[[320,720],[375,812]]){
  innerWidth=width;innerHeight=height;window.dispatchEvent(new Event('resize'));step(1);let maxX=0,maxY=0;const v=new window.THREE.Vector3();
  for(const tilt of[-1.2,.3,1.2])for(let n=0;n<32;n++){specimen.rotation.set(tilt,n*Math.PI/16,0);specimen.updateMatrixWorld(true);specimen.traverseVisible(o=>{const p=o.geometry?.attributes.position;if(p)for(let k=0;k<p.count;k++){v.fromBufferAttribute(p,k).applyMatrix4(o.matrixWorld).project(h.renderedCamera);maxX=Math.max(maxX,Math.abs(v.x));maxY=Math.max(maxY,Math.abs(v.y));}});}
  assert.ok(maxX<1&&maxY<1);metrics.push({width,height,scale:specimen.scale.x,maxX,maxY,margin:1-Math.max(maxX,maxY)});
 }console.log('Dung beetle inspection CPU sampled projection, not visual/all-angle certification:',JSON.stringify(metrics));innerWidth=1280;innerHeight=800;window.dispatchEvent(new Event('resize'));step(1);
 elements.get('inspect-journal-button').click();assert.equal(g.state.mode,'journal');const note=find('fj-note');note.value='球は地面に残った j';note.dispatchEvent(new Event('input'));note.focus();key('keydown','KeyJ');key('keyup','KeyJ');assert.equal(g.state.mode,'journal');step(30);assert.deepEqual(g.simulation.dungBall,heldBall);
 key('keydown','Escape');key('keyup','Escape');assert.equal(g.state.mode,'inspect');g.release({lock:false});assert.deepEqual(point(item),at);assert.deepEqual(g.simulation.dungBall,heldBall);assert.match(elements.get('toast').textContent,/球のそばへそっと返し/);step(2);assert.ok(Math.hypot(item.x-at.x,item.y-at.y,item.z-at.z)<.01);assert.equal(ballMesh.visible,true);assert.equal(g.models.get(item.id).visible,true);
 await g.journal.flush();const saved=g.journal.entries.find(e=>e.species==='dungbeetle');assert.equal(saved.note,'球は地面に残った j');assert.equal(saved.location,'露出した土の転がし道');
 // No frame between reset and swing: the old rendered ball must not remain the
 // LOS occluder at its previous location. Repeat for title -> same habitat start.
 step(60);const oldZ=ballMesh.position.z;g.restart();assert.notEqual(oldZ,g.simulation.dungBall.position.z);blockedPose();swing();assert.equal(g.simulation.caught,null);assert.equal(ballMesh.position.z,g.simulation.dungBall.position.z);
 for(let n=0;n<60*85&&g.simulation.items[0].state!=='resting';n++)step(1);
 item=g.simulation.items[0];assert.equal(item.state,'resting');assert.equal(item.dungDistance,1.8);const ended=g.simulation.dungBall;step(60);assert.deepEqual(g.simulation.dungBall,ended,'finite route stays at the end instead of looping or spawning another ball');
 g.title();g.start();assert.equal(g.simulation.items[0].dungDistance,0);assert.equal(ballMesh.position.z,ended.position.z);blockedPose();swing();assert.equal(g.simulation.caught,null);assert.equal(ballMesh.position.z,g.simulation.dungBall.position.z);
 let disposedBall=0,disposedMap=0;ballMesh.geometry.addEventListener('dispose',()=>disposedBall++);ballMesh.material.map.addEventListener('dispose',()=>disposedMap++);
 for(const[id,count]of[['meadow',29],['tropical',11],['understory',5],['night',6],['savanna',1]]){choose(id);await a.flush();assert.equal(g.simulation.items.length,count);assert.equal(bgm().length,id==='meadow'?1:0);assert.deepEqual(g.journal.entries.find(e=>e.species==='dungbeetle'),saved);assert.equal(g.simulation.dungBall!==null,id==='savanna');}
 assert.equal(disposedBall,1);assert.equal(disposedMap,1,'scene-owned ball texture is not an insect texture cache');
 const{createJournal}=await import(h.moduleURL('journal.js'));assert.deepEqual(createJournal(localStorage).entries.find(e=>e.species==='dungbeetle'),saved);
});
