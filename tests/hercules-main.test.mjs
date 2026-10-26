import {createTestLocks} from './fixtures/journal-locks.mjs';
/** Hercules walking actual-main integration; self-contained Node standard-library test.
 * Run: node --test tests/hercules-main.test.mjs (also without package.json).
 * In-memory test-only exports do not modify or ship a production debug API.
 * NOT visual/browser QA.
 * Real vendored THREE geometry/matrices and actual app modules;
 * fake DOM, canvas painting, WebAudio, pointer lock and WebGL renderer.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const sandbox={console};vm.runInNewContext(fs.readFileSync(path.join(root,'assets/vendor/three.min.js'),'utf8'),sandbox);const THREE=sandbox.THREE;
const ctx2d={};for(const key of ['fillRect','clearRect','beginPath','moveTo','lineTo','bezierCurveTo','quadraticCurveTo','stroke','fill','save','restore','translate','rotate','ellipse','arc','drawImage','closePath','clip'])ctx2d[key]=()=>{};ctx2d.createLinearGradient=()=>({addColorStop(){}});
let asynchronousLocks=false,lockRequests=0;const lockNotifications=[];
const notifyLockChange=()=>{const fire=()=>document.dispatchEvent(new Event('pointerlockchange'));if(asynchronousLocks)lockNotifications.push(fire);else fire();};
async function flushLockNotifications(){while(lockNotifications.length){const callbacks=lockNotifications.splice(0);await new Promise(resolve=>setImmediate(()=>{callbacks.forEach(fn=>fn());resolve();}));}}
class Element extends EventTarget {constructor(id,tagName='DIV'){super();this.id=id;this.tagName=tagName;this.children=[];this.attributes={};this.dataset={};this.selectionStart=0;this.selectionEnd=0;this.hidden=true;this.value='';this.textContent='';this.classes=new Set();this.classList={toggle:(c,on)=>on?this.classes.add(c):this.classes.delete(c)};}append(...children){this.children.push(...children);}replaceChildren(...children){this.children=children;}setAttribute(key,value){this.attributes[key]=value;}setSelectionRange(start,end){this.selectionStart=start;this.selectionEnd=end;}set innerHTML(value){throw Error('Unsafe innerHTML sink');}focus(){document.activeElement=this;}getContext(type){assert.equal(type,'2d');return ctx2d;}requestPointerLock(){lockRequests++;const acquire=()=>{document.pointerLockElement=this;notifyLockChange();};if(asynchronousLocks)lockNotifications.push(acquire);else acquire();return Promise.resolve();}click(){this.onclick?.({target:this});this.dispatchEvent(new Event('click'));}}
const elements=new Map();const html=fs.readFileSync(path.join(root,'index.html'),'utf8');for(const m of html.matchAll(/<(\w+)[^>]*\bid="([^"]+)"/g))elements.set(m[2],new Element(m[2],m[1].toUpperCase()));
const document=new EventTarget();document.getElementById=id=>{assert.ok(elements.has(id),`Unknown DOM id ${id}`);return elements.get(id);};document.body=new Element('','BODY');document.createElement=tag=>new Element('',tag.toUpperCase());document.exitPointerLock=()=>{document.pointerLockElement=null;notifyLockChange();};
const param=()=>({value:0,targets:[],setTargetAtTime(value){this.value=value;this.targets.push(value);},setValueAtTime(value){this.value=value;},exponentialRampToValueAtTime(value){this.value=value;}});const node=()=>({connect(){},start(){},stop(){},gain:param(),frequency:param(),Q:param(),pan:param()});
const audioContexts=[];let audioContext;class AudioContext {constructor(){audioContext=this;audioContexts.push(this);this.state='suspended';this.resumeCalls=0;this.suspendCalls=0;this.closeCalls=0;this.gains=[];this.sampleRate=100;this.currentTime=0;this.destination={};}createGain(){const gain=node();this.gains.push(gain);return gain;}createBufferSource(){return node();}createBiquadFilter(){return node();}createOscillator(){return node();}createStereoPanner(){return node();}createBuffer(channels,length){return {getChannelData:()=>new Float32Array(length)};}resume(){this.resumeCalls++;return Promise.resolve().then(()=>{if(this.state!=='closed')this.state='running';});}suspend(){this.suspendCalls++;return Promise.resolve().then(()=>{if(this.state!=='closed')this.state='suspended';});}close(){this.closeCalls++;this.state='closed';return Promise.resolve();}}
let renderedScene;let rendererChecks=0;class Renderer {constructor(){this.shadowMap={};this.info={render:{calls:0,triangles:0,points:0,lines:0}};}setPixelRatio(){}setSize(){}render(scene,camera){renderedScene=scene;scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);scene.traverse(obj=>{assert.ok(obj.matrixWorld.elements.every(Number.isFinite),`Nonfinite matrix ${obj.name}`);});this.info.render.calls++;rendererChecks++;}}
THREE.WebGLRenderer=Renderer;
const window=new EventTarget();window.THREE=THREE;window.AudioContext=AudioContext;
let blockStorage=false;const savedSettings=new Map();
let gamepads=[];let nextFrame,now=0;const globals={window,document,innerWidth:1280,innerHeight:800,devicePixelRatio:1,matchMedia:()=>({matches:false}),location:{search:''},localStorage:{getItem:key=>{if(blockStorage)throw Error('Storage blocked');return savedSettings.get(key)??null;},setItem:(key,value)=>{if(blockStorage)throw Error('Storage blocked');savedSettings.set(key,String(value));}},requestAnimationFrame:fn=>{nextFrame=fn;return 1;},navigator:{locks:createTestLocks(),getGamepads:()=>gamepads}};for(const[key,value]of Object.entries(globals))Object.defineProperty(globalThis,key,{value,configurable:true,writable:true});
function frame(n=1){for(let i=0;i<n;i++){now+=1000/60;assert.ok(nextFrame,'No animation callback scheduled');const fn=nextFrame;nextFrame=null;fn(now);}}
function key(type,code,repeat=false){const e=new Event(type,{cancelable:true});Object.defineProperties(e,{target:{value:document.activeElement||elements.get('game-canvas')},code:{value:code},repeat:{value:repeat}});document.dispatchEvent(e);return e;}
const screen=(id,visible)=>assert.equal(elements.get(id).hidden,!visible,`${id} visibility`);
// Load the production import graph as memory-only ES modules, without relying on
// package.json, a private git baseline, node_modules, or a production debug block.
const moduleURLs=new Map();
function moduleURL(name){
 // Emulate URL-to-file resolution only; published-graph.test checks every token before stripping.
 name=name.split('?',1)[0];
 if(moduleURLs.has(name))return moduleURLs.get(name);
 let source=fs.readFileSync(path.join(root,'src',name),'utf8');
 source=source.replace(/\/\* DEV-ONLY-START \*\/[\s\S]*?\/\* DEV-ONLY-END \*\//g,'');
 source=source.replace(/from\s*['"]\.\/([^'"]+)['"]/g,(_,dependency)=>`from ${JSON.stringify(moduleURL(dependency))}`);
 if(name==='main.js')source+='\nexport {state,simulation,world,journal,start,restart,pause,resume,release,swing,openJournal,closeJournal,title};';
 const url='data:text/javascript;base64,'+Buffer.from(source).toString('base64');moduleURLs.set(name,url);return url;
}
const app=await import(moduleURL('main.js'));
const g=new Proxy(app,{get:(target,key)=>key==='setPose'?pose=>Object.assign(app.state.player,pose):target[key]});
assert.equal(window.__insectGame,undefined,'public production path must not require debug globals');
const settle=async()=>{await new Promise(resolve=>setImmediate(resolve));};
const master=()=>audioContext.gains[0].gain;
const descendants=node=>[node,...node.children.flatMap(descendants)];
const find=cls=>descendants(document.body).find(node=>node.className?.split(' ').includes(cls));
const modal=()=>find('field-journal');
function keyFrom(target,code,repeat=false){const e=new Event('keydown',{cancelable:true});Object.defineProperties(e,{target:{value:target},code:{value:code},repeat:{value:repeat}});document.dispatchEvent(e);return e;}
function firstCatch(){g.restart();frame(60);const i=g.simulation.items[0];g.setPose({x:i.x,z:i.z+1.5,y:i.y+.5,yaw:0,pitch:-.3});const place={x:Math.round(i.x*10)/10,z:Math.round(i.z*10)/10};g.swing();assert.ok(g.simulation.caught);frame(22);assert.equal(g.state.mode,'inspect');return place;}
function inert(expected){assert.equal(elements.get('app-shell').inert,expected);assert.equal(elements.get('game-canvas').inert,expected);}

function choose(id){g.title();elements.get('habitat-select').value=id;elements.get('start-button').click();frame(1);assert.equal(g.state.mode,'playing');}
function catchSpecies(species,{wait=true}={}){const i=g.simulation.items.find(i=>i.species===species);assert.ok(i);g.setPose({x:i.x,y:i.y+.5,z:i.z+1.5,yaw:0,pitch:-.3});g.swing();assert.equal(g.simulation.caught?.species,species);if(wait){frame(22);assert.equal(g.state.mode,'inspect');}return i;}
function resources(scene){const all=new Set(),worldMaps=new Set(),insectMaps=new Set();for(const root of scene.children){if(root.isCamera)continue;root.traverse(o=>{if(o.geometry)all.add(o.geometry);for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[]){all.add(m);for(const value of Object.values(m))if(value?.isTexture)(root.userData.species?insectMaps:worldMaps).add(value);}});}return {all,worldMaps,insectMaps};}

const beetles=()=>g.simulation.items.filter(i=>i.species==='hercules');
const point=i=>({x:i.x,y:i.y,z:i.z});
function until(predicate,seconds=40){for(let n=0;n<seconds*60;n++){frame(1);if(predicate())return;}assert.fail('natural state not reached within time budget');}
function catchBeetle(i){
 // Targeted approach setup uses actual ground eye height, never insect-level y.
 const x=i.x,z=i.z+1.8,y=g.world.heightAt(x,z)+1.65;g.setPose({x,y,z,yaw:0,pitch:Math.atan2(i.y-y,1.8)});
 assert.ok(Math.hypot(i.x-x,i.y-y,i.z-z)<2.6);key('keydown','Space');key('keyup','Space');assert.equal(g.simulation.caught,i);return point(i);
}
test('tropical main adds two resting beetles without replacing morphos, then naturally walks and turns along each log',()=>{
 choose('tropical');assert.equal(g.simulation.items.length,10);assert.equal(g.simulation.items.filter(i=>i.species==='morpho').length,4);assert.equal(beetles().length,2);
 const initial=beetles().map(point),homes=beetles().map(i=>({...i.home})),seen=beetles().map(()=>new Set()),maxStep=[0,0];let prior=beetles().map(point);
 assert.ok(beetles().every(i=>i.resting&&!i.caught));frame(15);assert.deepEqual(beetles().map(point),initial,'initial resting interval');
 for(let n=0;n<60*120;n++){frame(1);beetles().forEach((i,k)=>{seen[k].add(i.state);assert.ok([i.x,i.y,i.z,i.heading].every(Number.isFinite));assert.ok(Math.abs(i.x-i.home.x)<=.600001);assert.equal(i.y,i.home.y);assert.equal(i.z,i.home.z);maxStep[k]=Math.max(maxStep[k],Math.hypot(i.x-prior[k].x,i.y-prior[k].y,i.z-prior[k].z));});prior=beetles().map(point);}
 for(let n=0;n<2;n++){for(const state of ['resting','walking','turning'])assert.ok(seen[n].has(state),state);assert.ok(maxStep[n]>.0001&&maxStep[n]<.02);}assert.deepEqual(beetles().map(i=>i.home),homes);
 console.log('Hercules main CPU path metrics:',JSON.stringify({maxStep,states:seen.map(s=>[...s])}));
});
test('walking capture freezes position, pending delay and inspection; journal note survives continuous release and recapture',()=>{
 const i=beetles()[0];until(()=>i.state==='walking');const at=catchBeetle(i);frame(10);assert.deepEqual(point(i),at);assert.equal(g.state.mode,'playing');frame(12);assert.equal(g.state.mode,'inspect');assert.match(elements.get('insect-name').textContent,/ヘラクレス/);
 const description=elements.get('insect-description').textContent;assert.ok(description.includes('この試作では低い倒木で日中の休止や歩行を観察でき、モルフォ用の果実台には移動せず、倒木上の果実のそばへ歩いて休む見本を観察できます。食べる口の動きは再現していません。'));
 const menu=new Event('contextmenu',{cancelable:true});Object.defineProperties(menu,{target:{value:elements.get('game-canvas')},button:{value:2}});document.dispatchEvent(menu);assert.equal(menu.defaultPrevented,true);
 frame(60);assert.deepEqual(point(i),at);g.openJournal('hercules');assert.ok(descendants(modal()).some(n=>n.className==='fj-observation'&&n.textContent===description),'inspection and journal use identical Hercules observation');const note=find('fj-note');note.value='倒木を歩いた';note.dispatchEvent(new Event('input'));const time=g.simulation.time;frame(60);assert.equal(g.simulation.time,time);key('keydown','Escape');key('keyup','Escape');assert.equal(g.state.mode,'inspect');
 g.release({lock:false});assert.equal(g.simulation.caught,null);assert.deepEqual(point(i),at);let prior=point(i),moved=false;
 for(let n=0;n<60*3;n++){frame(1);assert.ok(Math.hypot(i.x-prior.x,i.y-prior.y,i.z-prior.z)<.02);moved ||= Math.hypot(i.x-at.x,i.z-at.z)>.02;prior=point(i);}assert.ok(moved,'release walks away, not teleport or retained capture');
 catchBeetle(i);frame(22);assert.equal(g.state.mode,'inspect');assert.equal(g.journal.entries.find(e=>e.species==='hercules').note,'倒木を歩いた');g.release({lock:false});
});
test('fruit remains morpho-only while existing beetles continue log walking',()=>{
 g.restart();const station=g.world.baitStation;g.setPose({x:station.x,y:g.world.heightAt(station.x,station.z+1.5)+1.65,z:station.z+1.5,yaw:0,pitch:-.2});frame(1);key('keydown','KeyE');key('keyup','KeyE');assert.equal(g.simulation.bait.active,true);
 g.setPose({x:station.x+2,y:g.world.heightAt(station.x+2,station.z+3)+1.65,z:station.z+3});const homes=beetles().map(i=>({...i.home})),visitors=new Set();
 for(let n=0;n<60*60;n++){frame(1);const id=g.simulation.bait?.visitorId;if(id){const i=g.simulation.items.find(i=>i.id===id);assert.equal(i.species,'morpho');visitors.add(id);}assert.ok(beetles().every(i=>i.state!=='feeding'&&i.state!=='bait-approach'));}
 assert.ok(visitors.size>=1);assert.equal(g.simulation.items.length,10);assert.deepEqual(beetles().map(i=>i.home),homes);g.title();assert.equal(g.simulation.bait,null);
});
test('six actual capture records and notes reload; old J/Esc mute0 and habitat reset controls remain usable',async()=>{
 choose('meadow');assert.equal(g.simulation.items.length,29);for(const species of ['butterfly','dragonfly','cicada','grasshopper']){g.restart();catchSpecies(species);g.journal.setNote(species,`memo-${species}`);g.release({lock:false});}
 choose('tropical');catchSpecies('morpho');g.journal.setNote('morpho','青い翅');g.release({lock:false});assert.equal(g.journal.entries.length,6);
 await g.journal.flush();const expected=g.journal.entries,{createJournal}=await import(moduleURL('journal.js'));assert.deepEqual(createJournal(localStorage).entries,expected);
 g.openJournal();assert.equal(descendants(modal()).filter(n=>n.className?.split(' ').includes('fj-card')).length,23);key('keydown','KeyJ');key('keyup','KeyJ');assert.equal(g.state.mode,'playing');
 g.pause();elements.get('volume').value='0';elements.get('volume').dispatchEvent(new Event('input'));key('keydown','Escape');key('keyup','Escape');await settle();frame(1);assert.equal(g.state.mode,'playing');assert.equal(master().value,0);assert.equal(g.state.volume,0);
 g.restart();assert.equal(g.simulation.caught,null);assert.equal(g.simulation.items.length,10);assert.deepEqual(g.journal.entries,expected);assert.equal(document.activeElement,elements.get('game-canvas'));
});
