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
 Object.defineProperty(globalThis,'__fireflyAudioTest',{configurable:true,value:audio});t.after(()=>delete globalThis.__fireflyAudioTest);
 const existing=fs.readFileSync(path.join(root,'tests/hercules-main.test.mjs'),'utf8'),marker='\nconst beetles=()=>';assert.ok(existing.includes(marker));
 let source=existing.slice(0,existing.indexOf(marker));
 source=source.replace("from './fixtures/journal-locks.mjs'",`from ${JSON.stringify(pathToFileURL(path.join(root,'tests/fixtures/journal-locks.mjs')).href)}`).replace("const root=path.resolve(import.meta.dirname,'..');",`const root=${JSON.stringify(root)};`);
 source=source.replace('window.AudioContext=AudioContext;',"window.AudioContext=globalThis.__fireflyAudioTest.AudioContext;window.fetch=globalThis.__fireflyAudioTest.fetch;window.location={href:'https://game.invalid/play/index.html',origin:'https://game.invalid'};");
 const read="let source=fs.readFileSync(path.join(root,'src',name),'utf8');";assert.ok(source.includes(read));source=source.replace(read,read+"\n if(name==='audio.js')source=source.replaceAll('import.meta.url',JSON.stringify('https://game.invalid/play/src/audio.js?v=0.5.0&b=123456abcdef'));");
 source=source.replace('export {state,simulation,world,journal,','export {state,simulation,world,antHabitat,models,journal,');
 source=source.replace('let renderedScene;let rendererChecks','let renderedScene,renderedCamera;let rendererChecks').replace('renderedScene=scene;scene.updateMatrixWorld','renderedScene=scene;renderedCamera=camera;scene.updateMatrixWorld');
 source+='\nexport {g,frame,elements,key,choose,find,modal,descendants,renderedScene,renderedCamera,moduleURL};';
 return import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
}
const point=i=>({x:i.x,y:i.y,z:i.z});
test('night selection, leaf and flight encounters, journal return and four-habitat audio gates',async t=>{
 const a=createIntegratedAudioMock(t),h=await app(t,a),{g,elements,key,choose,find}=h;
 const step=n=>{for(let i=0;i<n;i++){a.advance(1/60);h.frame(1);}};
 const bgm=()=>a.liveAssets().filter(n=>n.buffer.file==='bgm_temperate_preview_01.ogg');
 t.after(()=>window.dispatchEvent(new Event('pagehide')));
 const initial=g.world;elements.get('habitat-select').value='night';elements.get('habitat-select').dispatchEvent(new Event('change'));
 assert.equal(g.world,initial,'selection alone must not instantiate or travel');assert.equal(g.state.mode,'title');
 elements.get('start-button').click();step(1);await a.flush();assert.equal(g.state.habitat,'night');assert.equal(g.simulation.items.length,5);assert.deepEqual(g.simulation.items.map(i=>i.species),['firefly','firefly','firefly','rhino','stag']);assert.deepEqual(g.simulation.items.slice(0,4).map(i=>i.id),['insect-1','insect-2','insect-3','insect-4']);assert.equal(bgm().length,0);assert.equal(a.requests.length,13);
 for(const phase of['resting','flying']){
  g.restart();const item=g.simulation.items[0];
  const beforeAudio=a.assetSources().length;
  if(phase==='flying')for(let n=0;n<60*45&&!(item.state==='flying'&&item.flightProgress>=.3);n++)step(1);
  assert.equal(item.state,phase);assert.ok(Number.isFinite(item.airBlend));if(phase==='flying')assert.ok(item.airBlend>.9);assert.equal(a.assetSources().length,beforeAudio,'night insect movement creates no species samples or BGM');
  const x=item.x,z=item.z+1.3,y=g.world.heightAt(x,z)+1.65;
  g.setPose({x,y,z,yaw:0,pitch:Math.atan2(item.y-y,1.3)});
  assert.ok(Math.hypot(item.x-x,item.y-y,item.z-z)<2.6,'actual terrain eye in existing net range');
  key('keydown','Space');key('keyup','Space');assert.equal(g.simulation.caught?.id,item.id);
  const at=point(item),airBlend=item.airBlend;step(22);assert.equal(g.state.mode,'inspect');assert.deepEqual(point(item),at);
  assert.ok(a.assetSources().some(n=>n.buffer.file.startsWith('sfx_net_swing_')));assert.ok(a.assetSources().some(n=>n.buffer.file==='sfx_capture_01.ogg'));assert.equal(bgm().length,0);
  const specimen=h.renderedScene.children.find(n=>n.userData.species==='firefly');assert.ok(specimen);
  if(phase==='resting'){
   const metrics=[];for(const[width,height]of[[320,720],[375,812]]){
    innerWidth=width;innerHeight=height;window.dispatchEvent(new Event('resize'));step(1);let maxX=0,maxY=0;const v=new window.THREE.Vector3();
    for(const tilt of[-1.2,.3,1.2])for(let n=0;n<32;n++){specimen.rotation.set(tilt,n*Math.PI/16,0);specimen.updateMatrixWorld(true);specimen.traverseVisible(o=>{const p=o.geometry?.attributes.position;if(p)for(let k=0;k<p.count;k++){v.fromBufferAttribute(p,k).applyMatrix4(o.matrixWorld).project(h.renderedCamera);maxX=Math.max(maxX,Math.abs(v.x));maxY=Math.max(maxY,Math.abs(v.y));}});}
    assert.ok(maxX<1&&maxY<1);metrics.push({width,height,scale:specimen.scale.x,maxX,maxY,margin:1-Math.max(maxX,maxY)});
   }console.log('Firefly inspection CPU sampled projection; not visual/all-angle certification:',JSON.stringify(metrics));innerWidth=1280;innerHeight=800;window.dispatchEvent(new Event('resize'));step(1);
  }
  elements.get('inspect-journal-button').click();assert.equal(g.state.mode,'journal');const note=find('fj-note');note.value='湿地の小さな光 j';note.dispatchEvent(new Event('input'));note.focus();key('keydown','KeyJ');key('keyup','KeyJ');assert.equal(g.state.mode,'journal','J inside memo must remain an editing key');
  const time=g.simulation.time;step(8);assert.equal(g.simulation.time,time);key('keydown','Escape');key('keyup','Escape');assert.equal(g.state.mode,'inspect');
  g.release({lock:false});assert.equal(g.state.mode,'playing');assert.deepEqual(point(item),at);assert.equal(item.airBlend,airBlend,'release preserves the caught air/support blend');assert.match(elements.get('toast').textContent,/夜の湿地へそっと返し/);step(2);
  assert.ok(Math.hypot(item.x-at.x,item.y-at.y,item.z-at.z)<.1,'continuous short-flight release, not teleport');
 }
 await g.journal.flush();const saved=g.journal.entries.find(e=>e.species==='firefly');assert.equal(saved.note,'湿地の小さな光 j');assert.ok(saved.location);
 key('keydown','KeyJ');key('keyup','KeyJ');assert.equal(g.state.mode,'journal');key('keydown','Escape');key('keyup','Escape');assert.equal(g.state.mode,'playing');
 g.pause();assert.equal(g.state.mode,'paused');const paused=g.simulation.time;step(15);assert.equal(g.simulation.time,paused);key('keydown','Escape');key('keyup','Escape');assert.equal(g.state.mode,'playing');
 for(const[id,count]of[['tropical',10],['meadow',29],['understory',3],['night',5]]){choose(id);await a.flush();assert.equal(g.simulation.items.length,count);assert.equal(bgm().length,id==='meadow'?1:0);assert.deepEqual(g.journal.entries.find(e=>e.species==='firefly'),saved);}
 const{createJournal}=await import(h.moduleURL('journal.js'));assert.deepEqual(createJournal(localStorage).entries.find(e=>e.species==='firefly'),saved);
});
