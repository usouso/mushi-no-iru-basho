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
 Object.defineProperty(globalThis,'__divingAudioTest',{configurable:true,value:audio});t.after(()=>delete globalThis.__divingAudioTest);
 const existing=fs.readFileSync(path.join(root,'tests/hercules-main.test.mjs'),'utf8'),marker='\nconst beetles=()=>';assert.ok(existing.includes(marker));
 let source=existing.slice(0,existing.indexOf(marker));
 source=source.replace("from './fixtures/journal-locks.mjs'",`from ${JSON.stringify(pathToFileURL(path.join(root,'tests/fixtures/journal-locks.mjs')).href)}`).replace("const root=path.resolve(import.meta.dirname,'..');",`const root=${JSON.stringify(root)};`);
 source=source.replace('window.AudioContext=AudioContext;',"window.AudioContext=globalThis.__divingAudioTest.AudioContext;window.fetch=globalThis.__divingAudioTest.fetch;window.location={href:'https://game.invalid/play/index.html',origin:'https://game.invalid'};");
 const read="let source=fs.readFileSync(path.join(root,'src',name),'utf8');";assert.ok(source.includes(read));source=source.replace(read,read+"\n if(name==='audio.js')source=source.replaceAll('import.meta.url',JSON.stringify('https://game.invalid/play/src/audio.js?v=0.6.0&b=123456abcdef'));");
 source=source.replace('export {state,simulation,world,journal,','export {state,simulation,world,divingHabitat,models,journal,');
 source=source.replace('let renderedScene;let rendererChecks','let renderedScene,renderedCamera;let rendererChecks').replace('renderedScene=scene;scene.updateMatrixWorld','renderedScene=scene;renderedCamera=camera;scene.updateMatrixWorld');
 source+='\nexport {g,frame,elements,key,choose,find,modal,descendants,renderedScene,renderedCamera,moduleURL};';
 return import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
}
const point=i=>({x:i.x,y:i.y,z:i.z});
test('surface and submerged shore catches, observation notes, continuous return and private resource disposal',async t=>{
 const a=createIntegratedAudioMock(t),h=await app(t,a),{g,elements,key,choose,find}=h;
 const step=n=>{for(let k=0;k<n;k++){a.advance(1/60);h.frame(1);}};
 const bgm=()=>a.liveAssets().filter(n=>n.buffer.file==='bgm_temperate_preview_01.ogg');
 const swing=()=>{key('keydown','Space');key('keyup','Space');};
 const mouse=(type,button,x=0,y=0)=>{const target=elements.get('game-canvas'),e=new Event(type,{cancelable:true});Object.defineProperties(e,{target:{value:target},button:{value:button},clientX:{value:x},clientY:{value:y}});(type==='mousedown'?target:document).dispatchEvent(e);};
 const shellMap=model=>model.getObjectByName('diving-elytron-1').material.map;
 const pose=i=>({...point(i),heading:i.heading,pitch:i.pitch,strokePhase:i.strokePhase,divingPhase:i.divingPhase});
 t.after(()=>window.dispatchEvent(new Event('pagehide')));
 choose('meadow');await a.flush();assert.equal(g.simulation.items.length,30);assert.equal(g.simulation.items.filter(i=>i.species==='divingbeetle').length,1);assert.equal(g.simulation.items.filter(i=>i.species!=='divingbeetle'&&i.species!=='mantis'&&i.species!=='ladybird'&&i.species!=='bee'&&i.species!=='swallowtail'&&i.species!=='jewel'&&i.species!=='longhorn'&&i.species!=='miyama').length,22);assert.equal(bgm().length,1);assert.equal(a.requests.length,13);
 const study=g.divingHabitat.waterStudy,oldWater=study.material,oldDepth=study.depthTexture,waterRoot=h.renderedScene.children.find(o=>o.material===oldWater);assert.ok(waterRoot);assert.ok(!g.world.captureOccluders.includes(waterRoot),'water remains transparent to capture LOS');
 const materialDisposes=[],dispose=window.THREE.Material.prototype.dispose;t.mock.method(window.THREE.Material.prototype,'dispose',function(){materialDisposes.push(this);return dispose.call(this);});
 const privateTextures=new Map();for(const map of[oldDepth,shellMap(g.models.get(g.simulation.items.find(i=>i.species==='divingbeetle').id))]){privateTextures.set(map,0);map.addEventListener('dispose',()=>privateTextures.set(map,privateTextures.get(map)+1));}
 const inspectionTextures=[];
 for(const phase of['surface','swimming']){
  g.restart();await a.flush();const i=g.simulation.items.find(i=>i.species==='divingbeetle'),quiet=phase==='swimming';
  const x=23.2,z=-14,y=g.world.heightAt(x,z)+(quiet?1.28:1.65);g.setPose({x,z,y,speed:0});if(quiet)mouse('mousedown',2);
  const beforeAudio=a.assetSources().length;for(let n=0;n<60*15&&i.divingPhase!==phase;n++)step(1);
  assert.equal(i.divingPhase,phase);assert.equal(a.assetSources().length,beforeAudio,'swimming creates no beetle walk sound');if(phase==='swimming')assert.ok(i.y<-.39,'actually submerged, not a surface-only catch');
  g.setPose({yaw:Math.atan2(x-i.x,z-i.z),pitch:Math.atan2(i.y-y,Math.hypot(i.x-x,i.z-z))});step(1);
  assert.ok(Math.abs(g.state.player.y-y)<1e-9);assert.ok(g.state.player.pitch>=-1.35&&g.state.player.pitch<0);assert.ok(Math.hypot(i.x-x,i.y-y,i.z-z)<2.6);assert.match(elements.get('target-hint').textContent,/網が届く/);
  swing();mouse('mouseup',2);assert.equal(g.simulation.caught?.id,i.id);const at=pose(i);step(22);assert.equal(g.state.mode,'inspect');assert.deepEqual(pose(i),at);assert.equal(g.models.get(i.id).visible,false);
  const specimen=h.renderedScene.children.find(o=>o.userData.species==='divingbeetle');assert.ok(specimen);assert.equal(specimen.userData.sex,'female');const texture=shellMap(specimen);inspectionTextures.push(texture);privateTextures.set(texture,0);texture.addEventListener('dispose',()=>privateTextures.set(texture,privateTextures.get(texture)+1));
  if(inspectionTextures.length===2){assert.notEqual(texture,inspectionTextures[0]);assert.equal(privateTextures.get(inspectionTextures[0]),1,'previous observation frees its instance-only shell map once');}
  const rotation=specimen.rotation.y;mouse('mousedown',0,10,10);mouse('mousemove',0,55,25);step(1);mouse('mouseup',0,55,25);assert.ok(Math.abs(specimen.rotation.y-rotation)>.2,'inspection update preserves caller drag rotation');
  if(phase==='surface'){
   const metrics=[];for(const[width,height]of[[320,720],[375,812]]){
    innerWidth=width;innerHeight=height;window.dispatchEvent(new Event('resize'));step(1);let maxX=0,maxY=0;const v=new window.THREE.Vector3();
    for(const tilt of[-1.2,.3,1.2])for(let n=0;n<32;n++){specimen.rotation.set(tilt,n*Math.PI/16,0);specimen.updateMatrixWorld(true);specimen.traverseVisible(o=>{const p=o.geometry?.attributes.position;if(p)for(let k=0;k<p.count;k++){v.fromBufferAttribute(p,k).applyMatrix4(o.matrixWorld).project(h.renderedCamera);maxX=Math.max(maxX,Math.abs(v.x));maxY=Math.max(maxY,Math.abs(v.y));}});}
    assert.ok(maxX<1&&maxY<1);metrics.push({width,height,scale:specimen.scale.x,maxX,maxY,margin:1-Math.max(maxX,maxY)});
   }console.log('Diving beetle inspection CPU sampled projection, not visual/all-angle certification:',JSON.stringify(metrics));innerWidth=1280;innerHeight=800;window.dispatchEvent(new Event('resize'));step(1);
  }
  elements.get('inspect-journal-button').click();assert.equal(g.state.mode,'journal');const note=find('fj-note');note.value='水面と水中の後脚 j';note.dispatchEvent(new Event('input'));note.focus();key('keydown','KeyJ');key('keyup','KeyJ');assert.equal(g.state.mode,'journal');step(15);assert.deepEqual(pose(i),at);
  key('keydown','Escape');key('keyup','Escape');assert.equal(g.state.mode,'inspect');g.release({lock:false});assert.deepEqual(pose(i),at);assert.match(elements.get('toast').textContent,/池へそっと返し/);step(2);assert.ok(Math.hypot(i.x-at.x,i.y-at.y,i.z-at.z)<.01);
  g.pause();const frozen=pose(i),time=g.simulation.time;step(20);assert.deepEqual(pose(i),frozen);assert.equal(g.simulation.time,time);g.resume({lock:false});step(2);
  document.hidden=true;document.dispatchEvent(new Event('visibilitychange'));await a.flush();assert.equal(g.state.mode,'paused');const hiddenPose=pose(i);step(20);assert.deepEqual(pose(i),hiddenPose);assert.equal(a.liveAssets().length,0);document.hidden=false;document.dispatchEvent(new Event('visibilitychange'));assert.equal(g.state.mode,'paused');g.resume({lock:false});await a.flush();
 }
 await g.journal.flush();const saved=g.journal.entries.find(e=>e.species==='divingbeetle');assert.equal(saved.note,'水面と水中の後脚 j');assert.equal(saved.location,'水辺の草むら');
 for(const[id,count]of[['tropical',11],['understory',6],['night',6],['savanna',1],['meadow',30]]){choose(id);await a.flush();assert.equal(g.simulation.items.length,count);assert.equal(!!g.divingHabitat,id==='meadow');assert.equal(bgm().length,id==='meadow'?1:0);assert.deepEqual(g.journal.entries.find(e=>e.species==='divingbeetle'),saved);}
 assert.equal(materialDisposes.filter(m=>m===oldWater).length,1);assert.equal(materialDisposes.filter(m=>m!==oldWater&&m.isShaderMaterial&&m.uniforms.uTime===oldWater.uniforms.uTime).length,1,'detached original water material is also disposed');
 assert.equal(privateTextures.get(oldDepth),1);const fieldMap=[...privateTextures.keys()].find(m=>m!==oldDepth&&!inspectionTextures.includes(m));assert.equal(privateTextures.get(fieldMap),1,'field beetle private map is freed despite the intentional old-species caches');assert.equal(privateTextures.get(inspectionTextures[1]),0,'only the latest reusable inspection specimen remains retained');
 assert.notEqual(g.divingHabitat.waterStudy.depthTexture,oldDepth);const{createJournal}=await import(h.moduleURL('journal.js'));assert.deepEqual(createJournal(localStorage).entries.find(e=>e.species==='divingbeetle'),saved);
});
