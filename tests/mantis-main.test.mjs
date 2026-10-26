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
 Object.defineProperty(globalThis,'__mantisAudioTest',{configurable:true,value:audio});t.after(()=>delete globalThis.__mantisAudioTest);
 const existing=fs.readFileSync(path.join(root,'tests/hercules-main.test.mjs'),'utf8'),marker='\nconst beetles=()=>';assert.ok(existing.includes(marker));
 let source=existing.slice(0,existing.indexOf(marker));
 source=source.replace("from './fixtures/journal-locks.mjs'",`from ${JSON.stringify(pathToFileURL(path.join(root,'tests/fixtures/journal-locks.mjs')).href)}`).replace("const root=path.resolve(import.meta.dirname,'..');",`const root=${JSON.stringify(root)};`);
 source=source.replace('window.AudioContext=AudioContext;',"window.AudioContext=globalThis.__mantisAudioTest.AudioContext;window.fetch=globalThis.__mantisAudioTest.fetch;window.location={href:'https://game.invalid/play/index.html',origin:'https://game.invalid'};");
 const read="let source=fs.readFileSync(path.join(root,'src',name),'utf8');";assert.ok(source.includes(read));source=source.replace(read,read+"\n if(name==='audio.js')source=source.replaceAll('import.meta.url',JSON.stringify('https://game.invalid/play/src/audio.js?v=0.8.0&b=123456abcdef'));");
 source=source.replace('export {state,simulation,world,journal,','export {state,simulation,world,mantisHabitat,models,journal,');
 source=source.replace('let renderedScene;let rendererChecks','let renderedScene,renderedCamera;let rendererChecks').replace('renderedScene=scene;scene.updateMatrixWorld','renderedScene=scene;renderedCamera=camera;scene.updateMatrixWorld');
 source+='\nexport {g,frame,elements,key,choose,find,modal,descendants,renderedScene,renderedCamera,moduleURL};';
 return import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
}
const point=i=>({x:i.x,y:i.y,z:i.z});
test('mantis leaf and flight capture, rotatable notes, same-pose return and five-habitat cleanup',async t=>{
 const a=createIntegratedAudioMock(t),h=await app(t,a),{g,elements,key,choose,find}=h;
 const step=n=>{for(let k=0;k<n;k++){a.advance(1/60);h.frame(1);}};
 const bgm=()=>a.liveAssets().filter(n=>n.buffer.file==='bgm_temperate_preview_01.ogg');
 const mouse=(type,button,x=0,y=0)=>{const target=elements.get('game-canvas'),e=new Event(type,{cancelable:true});Object.defineProperties(e,{target:{value:target},button:{value:button},clientX:{value:x},clientY:{value:y}});(type==='mousedown'?target:document).dispatchEvent(e);};
 const pose=i=>({...point(i),heading:i.heading,pitch:i.pitch,wingOpen:i.wingOpen,wingPhase:i.wingPhase,legTuck:i.legTuck,headYaw:i.headYaw});
 t.after(()=>window.dispatchEvent(new Event('pagehide')));
 choose('meadow');await a.flush();assert.equal(g.simulation.items.length,29);assert.equal(g.simulation.items.at(-6).species,'mantis','mantis retains its original ID/order before appended ladybird, bee and swallowtail');assert.equal(g.simulation.items.filter(i=>i.species!=='mantis'&&i.species!=='ladybird'&&i.species!=='bee'&&i.species!=='swallowtail'&&i.species!=='jewel'&&i.species!=='longhorn').length,23);assert.equal(bgm().length,1);assert.equal(a.requests.length,13);
 const solids=[...g.mantisHabitat.captureOccluders],disposed=new Map();for(const mesh of solids)for(const resource of[mesh.geometry,mesh.material]){disposed.set(resource,0);resource.addEventListener('dispose',()=>disposed.set(resource,disposed.get(resource)+1));}
 for(const phase of['resting','flying']){
  g.restart();await a.flush();const i=g.simulation.items.find(i=>i.species==='mantis'),quiet=phase==='flying';
  if(phase==='resting'){
   // A deliberately under-leaf ray checks the added solid in the actual main
   // LOS union; the subsequent player capture uses real ground eye height.
   const eye={x:i.x,y:i.y-.4,z:i.z+1.2},direction={x:0,y:.4,z:-1.2};assert.notEqual(g.simulation.findTarget(eye,direction)?.item.id,i.id);
  }
  const x=8,z=-6,y=g.world.heightAt(x,z)+(quiet?1.28:1.65);g.setPose({x,z,y,speed:0});if(quiet)mouse('mousedown',2);
  if(phase==='flying')for(let n=0;n<60*35&&!(i.mantisPhase==='flying'&&i.legTuck>.9);n++)step(1);
  assert.equal(i.mantisPhase,phase);g.setPose({yaw:Math.atan2(x-i.x,z-i.z),pitch:Math.atan2(i.y-y,Math.hypot(i.x-x,i.z-z))});step(1);
  assert.ok(Math.abs(g.state.player.y-y)<1e-9);assert.ok(Math.hypot(i.x-x,i.y-y,i.z-z)<2.6);assert.match(elements.get('target-hint').textContent,/網が届く/);
  key('keydown','Space');key('keyup','Space');mouse('mouseup',2);assert.equal(g.simulation.caught?.id,i.id);const at=pose(i);step(22);assert.equal(g.state.mode,'inspect');assert.deepEqual(pose(i),at);assert.equal(g.models.get(i.id).visible,false);
  const specimen=h.renderedScene.children.find(o=>o.userData.species==='mantis');assert.ok(specimen);assert.equal(specimen.scale.x,4,'desktop retains scale 4');const rotation=specimen.rotation.y;mouse('mousedown',0,10,10);mouse('mousemove',0,55,25);step(1);mouse('mouseup',0,55,25);assert.ok(Math.abs(specimen.rotation.y-rotation)>.2);
  if(phase==='resting'){
   const metrics=[];for(const[width,height]of[[320,720],[375,812]]){
    innerWidth=width;innerHeight=height;window.dispatchEvent(new Event('resize'));step(1);let maxX=0,maxY=0;const v=new window.THREE.Vector3();
    for(const tilt of[-1.2,.3,1.2])for(let n=0;n<32;n++){specimen.rotation.set(tilt,n*Math.PI/16,0);specimen.updateMatrixWorld(true);specimen.traverseVisible(o=>{const p=o.geometry?.attributes.position;if(p)for(let k=0;k<p.count;k++){v.fromBufferAttribute(p,k).applyMatrix4(o.matrixWorld).project(h.renderedCamera);maxX=Math.max(maxX,Math.abs(v.x));maxY=Math.max(maxY,Math.abs(v.y));}});}
    metrics.push({width,height,scale:specimen.scale.x,maxX,maxY,margin:1-Math.max(maxX,maxY)});
   }console.log('Mantis inspection CPU sampled projection, not visual/all-angle certification:',JSON.stringify(metrics));assert.ok(metrics.every(m=>m.maxX<1&&m.maxY<1));innerWidth=1280;innerHeight=800;window.dispatchEvent(new Event('resize'));step(1);assert.equal(specimen.scale.x,4,'returning from portrait restores desktop scale');
  }
  elements.get('inspect-journal-button').click();assert.equal(g.state.mode,'journal');const note=find('fj-note');note.value='葉の上の四つの足 j';note.dispatchEvent(new Event('input'));note.focus();key('keydown','KeyJ');key('keyup','KeyJ');assert.equal(g.state.mode,'journal');step(15);assert.deepEqual(pose(i),at);
  key('keydown','Escape');key('keyup','Escape');assert.equal(g.state.mode,'inspect');g.release({lock:false});assert.deepEqual(pose(i),at);assert.match(elements.get('toast').textContent,/草葉へそっと返し/);step(2);assert.ok(Math.hypot(i.x-at.x,i.y-at.y,i.z-at.z)<.01);
  g.pause();const frozen=pose(i),time=g.simulation.time;step(20);assert.deepEqual(pose(i),frozen);assert.equal(g.simulation.time,time);g.resume({lock:false});step(2);
  document.hidden=true;document.dispatchEvent(new Event('visibilitychange'));await a.flush();assert.equal(g.state.mode,'paused');const hidden=pose(i);step(20);assert.deepEqual(pose(i),hidden);assert.equal(a.liveAssets().length,0);document.hidden=false;document.dispatchEvent(new Event('visibilitychange'));assert.equal(g.state.mode,'paused');g.resume({lock:false});await a.flush();
 }
 assert.ok(!a.requests.some(r=>/mantis/.test(r.file)));assert.ok(!a.assetSources().some(n=>/insect_beetle_walk/.test(n.buffer.file)),'mantis does not inherit walking beetle audio');
 await g.journal.flush();const saved=g.journal.entries.find(e=>e.species==='mantis');assert.equal(saved.note,'葉の上の四つの足 j');assert.ok(saved.location);
 for(const[id,count]of[['tropical',10],['understory',5],['night',5],['savanna',1],['meadow',29]]){choose(id);await a.flush();assert.equal(g.simulation.items.length,count);assert.equal(!!g.mantisHabitat,id==='meadow');assert.equal(bgm().length,id==='meadow'?1:0);assert.deepEqual(g.journal.entries.find(e=>e.species==='mantis'),saved);}
 for(const count of disposed.values())assert.equal(count,1);assert.ok(solids.every(m=>m.parent===null));assert.notEqual(g.mantisHabitat.captureOccluders[0],solids[0]);const{createJournal}=await import(h.moduleURL('journal.js'));assert.deepEqual(createJournal(localStorage).entries.find(e=>e.species==='mantis'),saved);
});
