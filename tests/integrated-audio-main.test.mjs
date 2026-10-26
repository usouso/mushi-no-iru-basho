/** Real main -> real audio -> fake same-origin fetch/decode -> BufferSource.
 * CPU scheduling/control integration ONLY: no real OGG codec, sound, browser,
 * WebGL, perceived loudness or release-readiness verdict. No production edits. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createIntegratedAudioMock} from './fixtures/integrated-audio-mock.mjs';
const root=path.resolve(import.meta.dirname,'..');
async function actualMain(t,audio){
 const previous=Object.getOwnPropertyDescriptor(globalThis,'__integratedAudioTest');
 Object.defineProperty(globalThis,'__integratedAudioTest',{configurable:true,value:audio});
 t.after(()=>{if(previous)Object.defineProperty(globalThis,'__integratedAudioTest',previous);else delete globalThis.__integratedAudioTest;});
 const source=fs.readFileSync(path.join(root,'tests/hercules-main.test.mjs'),'utf8'),marker='\nconst beetles=()=>';assert.ok(source.includes(marker));
 let harness=source.slice(0,source.indexOf(marker));
 harness=harness.replace("from './fixtures/journal-locks.mjs'",`from ${JSON.stringify(pathToFileURL(path.join(root,'tests/fixtures/journal-locks.mjs')).href)}`);
 harness=harness.replace("const root=path.resolve(import.meta.dirname,'..');",`const root=${JSON.stringify(root)};`);
 harness=harness.replace('window.AudioContext=AudioContext;',"window.AudioContext=globalThis.__integratedAudioTest.AudioContext;window.fetch=globalThis.__integratedAudioTest.fetch;window.location={href:'https://game.invalid/play/index.html',origin:'https://game.invalid'};");
 const read="let source=fs.readFileSync(path.join(root,'src',name),'utf8');";assert.ok(harness.includes(read));
 // A data: URL cannot supply an ordinary relative asset base. Only the audio
 // module's import.meta.url is replaced in this in-memory loader; its factory,
 // imports, options, URL construction, fetch, decode and playback stay real.
 harness=harness.replace(read,read+"\n if(name==='audio.js')source=source.replaceAll('import.meta.url',JSON.stringify('https://game.invalid/play/src/audio.js?v=0.4.0&b=123456abcdef'));");
 harness+='\nexport {g,frame,elements,key,choose,catchSpecies};';
 return import('data:text/javascript;base64,'+Buffer.from(harness).toString('base64'));
}

test('loaded sample path follows eight-species main across habitats, silence gates, capture tail and page restore',async t=>{
 const a=createIntegratedAudioMock(t),h=await actualMain(t,a),{g,elements,choose,catchSpecies}=h;
 const step=n=>{for(let i=0;i<n;i++){a.advance(1/60);h.frame(1);}};
 const bgm=()=>a.liveAssets().filter(n=>n.buffer.file==='bgm_temperate_preview_01.ogg');
 const master=()=>a.ctx.gains[0].gain.value;
 const volume=v=>{elements.get('volume').value=String(v);elements.get('volume').dispatchEvent(new Event('input'));};
 const assertStoppedAssets=()=>{assert.equal(a.liveAssets().length,0);assert.ok(a.assetSources().every(n=>n.ended&&n.disconnected));};
 const page=(type,persisted=false)=>{const e=new Event(type);Object.defineProperty(e,'persisted',{value:persisted});window.dispatchEvent(e);};
 t.after(()=>page('pagehide'));
 assert.equal(a.contexts.length,0);assert.equal(a.requests.length,0,'title creates no audio context/download');
 choose('meadow');await a.flush();assert.equal(g.simulation.items.length,30);
 assert.equal(a.requests.length,13);assert.equal(new Set(a.requests.map(r=>r.file)).size,13);assert.equal(a.decoded.length,13);
 for(const r of a.requests){assert.ok(fs.existsSync(path.join(root,'assets/audio',r.file)));assert.equal(new URL(r.url).search,'?v=0.4.0&b=123456abcdef');assert.doesNotMatch(r.file,/aburazemi_call_02|capture_02|leaf|strider/);}
 assert.equal(bgm().length,1);assert.equal(bgm()[0].loopStart,0);assert.equal(bgm()[0].loopEnd,36.36);
 volume(0);await a.flush();assert.equal(master(),0);assertStoppedAssets();step(20);assert.equal(a.liveAssets().length,0);
 volume(.25);await a.flush();assert.equal(bgm().length,1);
 g.pause();await a.flush();assert.equal(g.state.mode,'paused');assert.equal(a.ctx.state,'suspended');assert.equal(master(),0);assertStoppedAssets();
 g.resume();await a.flush();assert.equal(bgm().length,1);assert.equal(a.contexts.length,1,'pause/resume reuses one context');
 document.hidden=true;document.dispatchEvent(new Event('visibilitychange'));await a.flush();assert.equal(g.state.mode,'paused');assertStoppedAssets();assert.equal(master(),0);
 document.hidden=false;document.dispatchEvent(new Event('visibilitychange'));await a.flush();assert.equal(g.state.mode,'paused');assert.equal(bgm().length,0,'visibility alone must not restart');
 g.resume();await a.flush();g.restart();await a.flush();
 const shotStart=a.assetSources().length;catchSpecies('butterfly',{wait:false});
 assert.ok(a.assetSources().slice(shotStart).some(n=>/^sfx_net_swing_0[123]\.ogg$/.test(n.buffer.file)),'main swing uses a decoded net sample');
 assert.ok(a.assetSources().slice(shotStart).some(n=>n.buffer.file==='sfx_capture_01.ogg'),'main capture uses decoded success sample');
 const observationBGM=bgm()[0];step(22);await a.flush();assert.equal(g.state.mode,'inspect');assert.equal(bgm().length,1);assert.equal(bgm()[0],observationBGM);
 assert.ok(a.liveAssets().some(n=>n.buffer.file==='sfx_capture_01.ogg'),'capture tail continues alongside the existing background');assert.ok(a.liveAssets().every(n=>/^(bgm_temperate_preview_01|sfx_capture_01|sfx_net_swing_0[123])\.ogg$/.test(n.buffer.file)),'only background and already-started capture/net tails remain');
 step(55);await a.flush();assert.deepEqual(a.liveAssets().map(n=>n.buffer.file),['bgm_temperate_preview_01.ogg']);assert.equal(bgm()[0],observationBGM);assert.equal(master(),.25);assert.equal(a.ctx.state,'running');assert.equal(a.timers.size,0);
 const releaseStart=a.ctx.sources.length;g.release({lock:false});await a.flush();assert.equal(g.state.mode,'playing');assert.equal(bgm().length,1);
 assert.ok(a.ctx.sources.slice(releaseStart).some(n=>n.kind==='oscillator'&&n.started),'existing synthesized release is preserved');step(30);await a.flush();
 for(const id of ['tropical','understory']){choose(id);await a.flush();assert.equal(bgm().length,0,`${id} has no meadow BGM`);assert.equal(a.liveAssets().length,0);}
 const leaf=g.simulation.items[0];g.setPose({x:leaf.x+.5,y:g.world.heightAt(leaf.x+.5,leaf.z)+1.65,z:leaf.z,speed:0});
 const beforeLeaf=a.assetSources().length,leafStart={x:leaf.x,z:leaf.z};let leafMoved=false;
 for(let n=0;n<300;n++){step(1);leafMoved ||= Math.hypot(leaf.x-leafStart.x,leaf.z-leafStart.z)>.001;}
 await a.flush();assert.ok(leafMoved,'actual leaf walking was exercised');assert.equal(a.assetSources().length,beforeLeaf,'leaf behaviour invents no beetle/other asset cue');
 choose('meadow');await a.flush();assert.equal(bgm().length,1);
 g.setPose({x:19.5,y:g.world.heightAt(19.5,-14.4)+1.65,z:-14.4,speed:0});
 const strider=g.simulation.items.find(i=>i.species==='waterstrider'),striderStart={x:strider.x,z:strider.z},beforeStrider=a.assetSources().length;let striderMoved=false;
 for(let n=0;n<600;n++){step(1);striderMoved ||= Math.hypot(strider.x-striderStart.x,strider.z-striderStart.z)>.001;}
 await a.flush();assert.ok(striderMoved,'actual water-strider movement was exercised');assert.equal(a.assetSources().length,beforeStrider,'water-strider movement invents no insect asset cue');
 choose('understory');await a.flush();assert.equal(bgm().length,0);
 const old=a.ctx,contextCount=a.contexts.length;page('pagehide');await a.flush();assert.equal(old.state,'closed');assert.equal(old.gains[0].gain.value,0);assert.ok(old.sources.every(n=>n.ended));assertStoppedAssets();assert.equal(a.timers.size,0);
 page('pageshow',true);await a.flush();assert.equal(g.state.mode,'paused');assert.equal(a.contexts.length,contextCount,'persisted restore remains silent until resume');
 g.resume();await a.flush();assert.equal(a.contexts.length,contextCount+1);assert.equal(g.state.habitat,'understory');assert.equal(bgm().length,0,'new audio context keeps the non-meadow habitat');assert.equal(a.liveAssets().length,0);
 assert.ok(old.sources.every(n=>n.ended&&n.disconnected),'disposed context leaves no connected source');
 choose('meadow');await a.flush();assert.equal(bgm().length,1);assert.equal(a.liveAssets().filter(n=>n.loop).length,1,'restored meadow has only one asset loop');
 assert.equal(a.requests.length,26,'one bounded 13-file load per audio instance');
});
