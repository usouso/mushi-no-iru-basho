/** Actual-module CPU flow only. Reuse the established DOM/THREE/audio harness;
 * no WebGL/browser/physical-input or perceived-visibility claim. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve(import.meta.dirname,'..');
const existing=fs.readFileSync(path.join(root,'tests/hercules-main.test.mjs'),'utf8');
const marker='\nconst beetles=()=>';
assert.ok(existing.includes(marker),'shared harness boundary remains explicit');
let harness=existing.slice(0,existing.indexOf(marker));
harness=harness.replace("from './fixtures/journal-locks.mjs'",`from ${JSON.stringify(pathToFileURL(path.join(root,'tests/fixtures/journal-locks.mjs')).href)}`);
const rootDeclaration="const root=path.resolve(import.meta.dirname,'..');";
assert.ok(harness.includes(rootDeclaration));harness=harness.replace(rootDeclaration,`const root=${JSON.stringify(root)};`);
harness=harness.replace('export {state,simulation,world,journal,','export {state,simulation,world,waterHabitat,journal,');
harness=harness.replace('let renderedScene;let rendererChecks','let renderedScene,renderedCamera;let rendererChecks').replace('renderedScene=scene;scene.updateMatrixWorld','renderedScene=scene;renderedCamera=camera;scene.updateMatrixWorld');
assert.ok(harness.includes('let renderedScene,renderedCamera;'));
harness+='\nexport {g,frame,elements,key,find,modal,descendants,choose,renderedScene,renderedCamera,moduleURL};';
const h=await import('data:text/javascript;base64,'+Buffer.from(harness).toString('base64'));
const {g,frame,elements,key,find,modal,descendants,choose}=h;
const point=i=>({x:i.x,y:i.y,z:i.z});

function mouse(type,button){const target=elements.get('game-canvas'),event=new Event(type,{cancelable:true});Object.defineProperties(event,{target:{value:target},button:{value:button}});(type==='mousedown'?target:document).dispatchEvent(event);}
const ripples=()=>g.waterHabitat.meshes.map(m=>({visible:m.visible,position:m.position.toArray(),scale:m.scale.toArray(),opacity:m.material.opacity}));

test('shore-height downward capture, inspection memo, water release and paused cues survive habitat round-trip',async()=>{
 choose('meadow');assert.equal(g.simulation.items.length,29);assert.equal(g.simulation.items.filter(i=>i.species!=='waterstrider'&&i.species!=='divingbeetle'&&i.species!=='mantis'&&i.species!=='ladybird'&&i.species!=='bee'&&i.species!=='swallowtail'&&i.species!=='jewel'&&i.species!=='longhorn').length,21);
 assert.equal(g.simulation.items.filter(i=>i.species==='waterstrider').length,1);
 const note='水面をすべった j';
 for(const quiet of [false,true]){
  g.restart();const i=g.simulation.items.find(i=>i.species==='waterstrider');
  const x=19.5,z=-14.4,y=g.world.heightAt(x,z)+(quiet?1.28:1.65);
  g.setPose({x,y,z,yaw:Math.atan2(x-i.x,z-i.z),pitch:Math.atan2(i.y-y,Math.hypot(i.x-x,i.z-z))});
  if(quiet)mouse('mousedown',2);frame(1);
  assert.ok(Math.abs(g.state.player.y-y)<1e-9,'actual normal/quiet ground eye height');
  assert.ok(g.state.player.pitch<0&&g.state.player.pitch>=-1.35,'look down from bank');
  assert.ok(Math.hypot(i.x-x,i.y-y,i.z-z)<=2.6,'within unchanged capture distance');
  assert.match(elements.get('target-hint').textContent,/網が届く/);
  key('keydown','Space');key('keyup','Space');mouse('mouseup',2);assert.equal(g.simulation.caught,i);
  const caughtAt=point(i);frame(22);assert.equal(g.state.mode,'inspect');assert.deepEqual(point(i),caughtAt);
  assert.ok(g.waterHabitat.meshes.every(m=>!m.visible),'held insect has no water-stroke cue');
  assert.match(elements.get('insect-name').textContent,/アメンボ/);
  const specimen=h.renderedScene.children.find(n=>n.userData.species==='waterstrider');assert.equal(specimen.scale.x,4);
  if(!quiet){
   const projections=[];
   for(const[width,height]of[[320,720],[375,812]]){
    innerWidth=width;innerHeight=height;window.dispatchEvent(new Event('resize'));frame(1);
    assert.ok(specimen.scale.x<4);const point3=new window.THREE.Vector3();let maxX=0,maxY=0;
    for(const tilt of[-1.2,.3,1.2])for(let n=0;n<32;n++){
     specimen.rotation.set(tilt,n*Math.PI/16,0);specimen.updateMatrixWorld(true);
     specimen.traverse(o=>{const positions=o.geometry?.attributes.position;if(positions)for(let k=0;k<positions.count;k++){point3.fromBufferAttribute(positions,k).applyMatrix4(o.matrixWorld).project(h.renderedCamera);maxX=Math.max(maxX,Math.abs(point3.x));maxY=Math.max(maxY,Math.abs(point3.y));}});
    }
    assert.ok(maxX<1&&maxY<1,'CPU projection fits the viewport at sampled angles, not a rendered-appearance verdict');
    projections.push({width,height,scale:specimen.scale.x,maxAbsNdcX:maxX,maxAbsNdcY:maxY,minNdcMargin:1-Math.max(maxX,maxY),yawSamples:32,tilts:[-1.2,.3,1.2]});
   }
   console.log('Water-strider observation CPU projection (sampled, not all-angle or visual certification):',JSON.stringify(projections));
   innerWidth=1280;innerHeight=800;window.dispatchEvent(new Event('resize'));frame(1);assert.equal(specimen.scale.x,4);
  }
  elements.get('inspect-journal-button').click();assert.equal(g.state.mode,'journal');
  const editor=find('fj-note');assert.equal(document.activeElement,editor);editor.value=note;editor.dispatchEvent(new Event('input'));
  assert.equal(descendants(modal()).filter(n=>n.className?.split(' ').includes('fj-card')).length,24);
  const heldTime=g.simulation.time;frame(20);assert.equal(g.simulation.time,heldTime);assert.deepEqual(point(i),caughtAt);
  key('keydown','Escape');key('keyup','Escape');assert.equal(g.state.mode,'inspect');
  g.release({lock:false});assert.equal(g.state.mode,'playing');assert.equal(g.simulation.caught,null);assert.deepEqual(point(i),caughtAt);
  assert.match(elements.get('toast').textContent,/水面へそっと返し/);assert.doesNotMatch(elements.get('toast').textContent,/飛び/);
  frame(8);g.pause();const frozen={time:g.simulation.time,pos:point(i),ripples:ripples()};frame(40);
  assert.equal(g.state.mode,'paused');assert.equal(g.simulation.time,frozen.time);assert.deepEqual(point(i),frozen.pos);assert.deepEqual(ripples(),frozen.ripples);
  g.resume({lock:false});frame(2);assert.ok(g.simulation.time>frozen.time);
 }
 await g.journal.flush();
 const oldRipples=[...g.waterHabitat.meshes];let disposedGeometry=0;
 for(const geometry of new Set(oldRipples.map(m=>m.geometry)))geometry.addEventListener('dispose',()=>disposedGeometry++);
 for(const [id,count]of [['tropical',11],['understory',5],['meadow',29]]){
  choose(id);assert.equal(g.simulation.items.length,count);assert.equal(g.simulation.items.filter(i=>i.species==='waterstrider').length,id==='meadow'?1:0);
  assert.equal(!!g.waterHabitat,id==='meadow');assert.equal(g.journal.entries.find(e=>e.species==='waterstrider').note,note);
 }
 assert.ok(oldRipples.every(m=>m.parent===null),'old water roots are removed by existing habitat disposal');
 assert.ok(disposedGeometry>=1,'old ripple geometry is disposed');
 const {createJournal}=await import(h.moduleURL('journal.js'));
 assert.equal(createJournal(localStorage).entries.find(e=>e.species==='waterstrider').note,note);
});
