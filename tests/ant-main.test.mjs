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
 Object.defineProperty(globalThis,'__antAudioTest',{configurable:true,value:audio});t.after(()=>delete globalThis.__antAudioTest);
 const existing=fs.readFileSync(path.join(root,'tests/hercules-main.test.mjs'),'utf8'),marker='\nconst beetles=()=>';assert.ok(existing.includes(marker));
 let source=existing.slice(0,existing.indexOf(marker));
 source=source.replace("from './fixtures/journal-locks.mjs'",`from ${JSON.stringify(pathToFileURL(path.join(root,'tests/fixtures/journal-locks.mjs')).href)}`).replace("const root=path.resolve(import.meta.dirname,'..');",`const root=${JSON.stringify(root)};`);
 source=source.replace('window.AudioContext=AudioContext;',"window.AudioContext=globalThis.__antAudioTest.AudioContext;window.fetch=globalThis.__antAudioTest.fetch;window.location={href:'https://game.invalid/play/index.html',origin:'https://game.invalid'};");
 const read="let source=fs.readFileSync(path.join(root,'src',name),'utf8');";assert.ok(source.includes(read));source=source.replace(read,read+"\n if(name==='audio.js')source=source.replaceAll('import.meta.url',JSON.stringify('https://game.invalid/play/src/audio.js?v=0.4.1&b=123456abcdef'));");
 source=source.replace('export {state,simulation,world,journal,','export {state,simulation,world,antHabitat,models,journal,');
 source=source.replace('let renderedScene;let rendererChecks','let renderedScene,renderedCamera;let rendererChecks').replace('renderedScene=scene;scene.updateMatrixWorld','renderedScene=scene;renderedCamera=camera;scene.updateMatrixWorld');
 source+='\nexport {g,frame,elements,key,choose,find,modal,descendants,renderedScene,renderedCamera,moduleURL};';
 return import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
}
const point=i=>({x:i.x,y:i.y,z:i.z});
test('stationary observation spans two circuits with fixed cargo, then both roles survive capture, notes and release',async t=>{
 const a=createIntegratedAudioMock(t),h=await app(t,a),{g,elements,key,choose,find}=h;
 const step=n=>{for(let i=0;i<n;i++){a.advance(1/60);h.frame(1);}};
 const mouse=(type,button)=>{const target=elements.get('game-canvas'),e=new Event(type,{cancelable:true});Object.defineProperties(e,{target:{value:target},button:{value:button}});(type==='mousedown'?target:document).dispatchEvent(e);};
 const bgm=()=>a.liveAssets().filter(n=>n.buffer.file==='bgm_temperate_preview_01.ogg');
 t.after(()=>window.dispatchEvent(new Event('pagehide')));
 choose('tropical');await a.flush();assert.equal(g.simulation.items.length,11);assert.equal(bgm().length,0);
 assert.equal(g.simulation.items.filter(i=>i.species==='morpho').length,4);assert.equal(g.simulation.items.filter(i=>i.species==='hercules').length,2);
 assert.equal(g.simulation.items.filter(i=>i.species==='leafcutterant').length,4);assert.equal(a.requests.length,13);assert.ok(!a.requests.some(r=>/ant|leafcutter/.test(r.file)));
 // Keep the actual main player stationary while all four workers complete
 // two full circuits. No head-turn/view-gate action is supplied to unlock them.
 const workers=g.simulation.items.filter(i=>i.species==='leafcutterant');
 assert.deepEqual(workers.map(i=>i.carryingLeaf),[true,true,false,false]);
 const observed=new Map(workers.map(i=>[i.id,{cargo:i.carryingLeaf,previous:i.routePhase,cycles:0}])),observer={...g.state.player};
 for(let n=0;n<60*300&&[...observed.values()].some(o=>o.cycles<2);n++){
  step(1);for(const i of workers){const o=observed.get(i.id),delta=i.routePhase-o.previous;o.cycles+=delta<-.5?delta+1:delta;o.previous=i.routePhase;assert.equal(i.carryingLeaf,o.cargo,'cargo is individual-fixed throughout every lap');}
 }
 assert.deepEqual(g.state.player,observer,'stationary view requires no look-away handoff');
 for(const i of workers){assert.ok(observed.get(i.id).cycles>=2,`worker ${i.id} completes two full circuits`);assert.equal(g.models.get(i.id).getObjectByName('ant-carried-leaf').visible,observed.get(i.id).cargo);}
 console.log('Actual-main stationary circuits:',JSON.stringify(workers.map(i=>({id:i.id,cargo:i.carryingLeaf,cycles:observed.get(i.id).cycles}))));
 for(const cargo of[true,false]){
  g.restart();await a.flush();
  const candidate=()=>g.simulation.items.find(i=>i.species==='leafcutterant'&&i.carryingLeaf===cargo&&i.routePhase>.25&&i.routePhase<.8);
  const i=candidate();assert.ok(i,`exposed cargo=${cargo} worker on initial foraging lane`);
  // Approach each lane from outside at a normal 1.3 m horizontal distance.
  // The ant-only route offset avoids the original nearby morpho conflict.
  const start={x:i.x+(cargo?2.1:-2.1),z:i.z};
  g.setPose({...start,y:g.world.heightAt(start.x,start.z)+1.28});
  const aim=()=>g.setPose({yaw:Math.atan2(g.state.player.x-i.x,g.state.player.z-i.z),pitch:Math.atan2(i.y-g.state.player.y,Math.hypot(i.x-g.state.player.x,i.z-g.state.player.z))});
  const beforeAudio=a.assetSources().length;mouse('mousedown',2);key('keydown','KeyW');
  for(let n=0;n<120&&Math.hypot(i.x-g.state.player.x,i.z-g.state.player.z)>1.3;n++){aim();step(1);}
  key('keyup','KeyW');step(1);aim();
  assert.ok(Math.hypot(g.state.player.x-start.x,g.state.player.z-start.z)>.2,'actual quiet key walking, not insect-height camera teleport');
  assert.ok(Math.abs(g.state.player.y-(g.world.heightAt(g.state.player.x,g.state.player.z)+1.28))<.03);
  assert.ok(g.state.player.pitch<-.3&&g.state.player.pitch>=-1.35);
  assert.ok(Math.hypot(i.x-g.state.player.x,i.y-g.state.player.y,i.z-g.state.player.z)<2.6);
  assert.equal(a.assetSources().length,beforeAudio,'worker gait must not reuse beetle or other asset audio');
  key('keydown','Space');key('keyup','Space');mouse('mouseup',2);assert.equal(g.simulation.caught?.id,i.id,'capture the intended individual, not a nearby worker');
  const at=point(i),carrying=i.carryingLeaf,phase=i.routePhase;assert.equal(carrying,cargo);step(22);assert.equal(g.state.mode,'inspect');assert.deepEqual(point(i),at);assert.equal(i.routePhase,phase);
  const specimen=h.renderedScene.children.find(n=>n.userData.species==='leafcutterant');assert.ok(specimen);assert.equal(specimen.getObjectByName('ant-carried-leaf').visible,cargo);
  if(cargo){
   const metrics=[];for(const[width,height]of[[320,720],[375,812]]){
    innerWidth=width;innerHeight=height;window.dispatchEvent(new Event('resize'));step(1);let maxX=0,maxY=0;const v=new window.THREE.Vector3();
    for(const tilt of[-1.2,.3,1.2])for(let n=0;n<32;n++){specimen.rotation.set(tilt,n*Math.PI/16,0);specimen.updateMatrixWorld(true);specimen.traverseVisible(o=>{const p=o.geometry?.attributes.position;if(p)for(let k=0;k<p.count;k++){v.fromBufferAttribute(p,k).applyMatrix4(o.matrixWorld).project(h.renderedCamera);maxX=Math.max(maxX,Math.abs(v.x));maxY=Math.max(maxY,Math.abs(v.y));}});}
    assert.ok(maxX<1&&maxY<1,'visible leaf, antennae and feet fit at sampled CPU projection angles');metrics.push({width,height,scale:specimen.scale.x,maxX,maxY,margin:1-Math.max(maxX,maxY)});
   }console.log('Ant inspection CPU projection, yaw32/tilt[-1.2,.3,1.2], not visual/all-angle certification:',JSON.stringify(metrics));
   innerWidth=1280;innerHeight=800;window.dispatchEvent(new Event('resize'));step(1);
  }
  elements.get('inspect-journal-button').click();assert.equal(g.state.mode,'journal');const input=find('fj-note');input.value='葉を運ぶ働きアリ j';input.dispatchEvent(new Event('input'));key('keydown','Escape');key('keyup','Escape');assert.equal(g.state.mode,'inspect');
  g.release({lock:false});assert.deepEqual(point(i),at);assert.equal(i.carryingLeaf,cargo);assert.equal(i.routePhase,phase);assert.match(elements.get('toast').textContent,/地面へそっと返し/);assert.doesNotMatch(elements.get('toast').textContent,/飛び/);
  step(1);assert.equal(g.models.get(i.id).getObjectByName('ant-carried-leaf').visible,i.carryingLeaf);assert.equal(i.carryingLeaf,cargo);
 }
 await g.journal.flush();const note=g.journal.entries.find(e=>e.species==='leafcutterant').note;
 for(const[id,count]of[['meadow',29],['understory',5],['tropical',11]]){choose(id);await a.flush();assert.equal(g.simulation.items.length,count);assert.equal(!!g.antHabitat,id==='tropical');assert.equal(bgm().length,id==='meadow'?1:0);assert.equal(g.journal.entries.find(e=>e.species==='leafcutterant').note,note);}
 const{createJournal}=await import(h.moduleURL('journal.js'));assert.equal(createJournal(localStorage).entries.find(e=>e.species==='leafcutterant').note,note);
});
