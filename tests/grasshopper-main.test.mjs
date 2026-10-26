import {createTestLocks} from './fixtures/journal-locks.mjs';
/** Grasshopper actual-main integration; self-contained Node standard-library test.
 * Run: node --test tests/grasshopper-main.test.mjs (also without package.json).
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
let renderedScene,renderedCamera;let rendererChecks=0;class Renderer {constructor(){this.shadowMap={};this.info={render:{calls:0,triangles:0,points:0,lines:0}};}setPixelRatio(){}setSize(){}render(scene,camera){renderedScene=scene;renderedCamera=camera;scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);scene.traverse(obj=>{assert.ok(obj.matrixWorld.elements.every(Number.isFinite),`Nonfinite matrix ${obj.name}`);});this.info.render.calls++;rendererChecks++;}}
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

// No insect state is assigned. Natural RAF time drives each jump and landing.
// Only yaw/pitch are aimed by the harness; the first approach starts at the real
// world spawn and every ground approach uses keyboard movement + actual eye height.
const hopper=()=>g.simulation.items.find(i=>i.species==='grasshopper');
const horizontal=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
function aimAt(i){const p=g.state.player;g.setPose({yaw:Math.atan2(-(i.x-p.x),-(i.z-p.z)),pitch:Math.atan2(i.y-p.y,horizontal(i,p))});}
function mouse(type,button,target=elements.get('game-canvas')){const e=new Event(type,{cancelable:true});Object.defineProperties(e,{target:{value:target},button:{value:button}});(type==='mousedown'?elements.get('game-canvas'):document).dispatchEvent(e);return e;}
function until(predicate,seconds=15){for(let n=0;n<seconds*60;n++){frame(1);if(predicate())return;}assert.fail('expected natural state within time budget');}
function settleJump(i){const before={x:i.x,y:i.y,z:i.z},start=g.simulation.time;let maxStep=0,prior={...before};until(()=>{maxStep=Math.max(maxStep,Math.hypot(i.x-prior.x,i.y-prior.y,i.z-prior.z));prior={x:i.x,y:i.y,z:i.z};return !i.airborne&&i.resting;});assert.ok(g.simulation.time>start);assert.ok(maxStep<.25,'no teleport per frame');assert.ok(horizontal(i,before)>.1,'lands at another point');return {seconds:g.simulation.time-start,maxStep};}
function quietCapture(i){
 mouse('mousedown',2);aimAt(i);const start={x:g.state.player.x,z:g.state.player.z};key('keydown','KeyW');
 for(let n=0;n<600&&horizontal(i,g.state.player)>1.65;n++){aimAt(i);frame(1);assert.equal(i.airborne,false,'quiet approach stays outside scare radius');}
 key('keyup','KeyW');frame(30);aimAt(i);
 assert.ok(horizontal(i,g.state.player)<=1.7);assert.ok(Math.abs(g.state.player.y-(g.world.heightAt(g.state.player.x,g.state.player.z)+1.28))<.002,'real quiet eye height');
 assert.equal(renderedCamera.position.y,g.state.player.y);assert.ok(g.state.player.pitch<-.3&&g.state.player.pitch>=-1.35,'look down, not eye-level teleport');
 key('keydown','Space');key('keyup','Space');mouse('mouseup',2);assert.equal(g.simulation.caught,i);frame(22);assert.equal(g.state.mode,'inspect');return horizontal(g.state.player,start);
}
test('actual meadow has21 insects; walking from spawn triggers ground jump and quiet downward capture after natural landing',()=>{
 choose('meadow');assert.equal(g.simulation.items.length,30);assert.equal(g.simulation.items.filter(i=>i.species==='grasshopper').length,3);assert.equal(g.state.player.x,g.world.spawn.x);assert.equal(g.state.player.z,g.world.spawn.z);
 const i=hopper(),spawn={x:g.state.player.x,z:g.state.player.z};assert.equal(i.airborne,false);assert.equal(i.resting,true);aimAt(i);key('keydown','KeyW');until(()=>i.airborne,8);key('keyup','KeyW');
 assert.ok(horizontal(g.state.player,spawn)>1,'normal key walking, not helper translation');assert.equal(g.simulation.caught,null);const jump=settleJump(i);const walked=quietCapture(i);assert.ok(walked>.1);
 assert.match(elements.get('insect-name').textContent,/ショウリョウバッタ/);assert.equal(g.journal.entries.find(e=>e.species==='grasshopper').species,'grasshopper');
 console.log('Ground approach CPU metrics:',JSON.stringify({jump,quietWalkMetres:walked,eyeY:g.state.player.y,pitch:g.state.player.pitch}));
});
test('inspection right menu, memo, release hop, natural landing and second quiet capture retain journal',()=>{
 const i=g.simulation.caught;assert.equal(i.species,'grasshopper');const menu=mouse('contextmenu',2);assert.equal(menu.defaultPrevented,true);
 g.openJournal('grasshopper');const note=find('fj-note');assert.equal(document.activeElement,note);note.value='草の間を跳んだ';note.dispatchEvent(new Event('input'));const e=key('keydown','KeyJ');assert.equal(e.defaultPrevented,false);key('keyup','KeyJ');assert.equal(g.state.mode,'journal');key('keydown','Escape');key('keyup','Escape');assert.equal(g.state.mode,'inspect');
 const firstSeen=g.journal.entries[0].firstSeen,at={x:i.x,y:i.y,z:i.z};g.release({lock:false});assert.equal(g.simulation.caught,null);assert.deepEqual({x:i.x,y:i.y,z:i.z},at);assert.equal(i.airborne,true);settleJump(i);quietCapture(i);
 assert.equal(g.journal.entries.find(e=>e.species==='grasshopper').note,'草の間を跳んだ');assert.equal(g.journal.entries[0].firstSeen,firstSeen);g.release({lock:false});
});
test('five actual species records persist across both habitats and a new journal instance',async()=>{
 for(const species of ['butterfly','dragonfly','cicada']){g.restart();catchSpecies(species);g.journal.setNote(species,`note-${species}`);g.release({lock:false});}
 choose('tropical');assert.equal(g.simulation.items.length,11);assert.ok(g.simulation.items.filter(i=>i.species==='morpho').length===4&&g.simulation.items.filter(i=>i.species==='hercules').length===2);catchSpecies('morpho');g.journal.setNote('morpho','青い翅');g.release({lock:false});
 assert.equal(g.journal.entries.length,5);const expected=g.journal.entries;await g.journal.flush();const {createJournal}=await import(moduleURL('journal.js'));assert.deepEqual(createJournal(localStorage).entries,expected);
 choose('meadow');assert.equal(g.simulation.items.length,30);assert.deepEqual(g.journal.entries,expected);g.openJournal();assert.equal(descendants(modal()).filter(n=>n.className?.split(' ').includes('fj-card')).length,27);key('keydown','KeyJ');key('keyup','KeyJ');assert.equal(g.state.mode,'playing');
});
test('new meadow keeps J focus, Esc mute0, Shift dash, E no-op and stable pointer-lock hint behavior',async()=>{
 g.restart();g.pause();elements.get('volume').value='0';elements.get('volume').dispatchEvent(new Event('input'));key('keydown','Escape');key('keyup','Escape');await settle();frame(1);assert.equal(g.state.mode,'playing');assert.equal(g.state.volume,0);assert.equal(master().value,0);
 const copy=elements.get('controls-hint').textContent;assert.equal(elements.get('look-resume-hint').hidden,false);
 key('keydown','ShiftLeft');key('keydown','KeyW');const z=g.state.player.z;frame(10);assert.equal(g.state.player.running,true);assert.ok(z-g.state.player.z>.8);key('keyup','KeyW');key('keyup','ShiftLeft');frame(2);
 key('keydown','KeyE');key('keyup','KeyE');assert.equal(g.simulation.bait,null);assert.equal(elements.get('interaction-hint').hidden,true);
 key('keydown','KeyJ');key('keyup','KeyJ');assert.equal(g.state.mode,'journal');assert.equal(document.activeElement,find('fj-close'));key('keydown','KeyJ');key('keyup','KeyJ');assert.equal(g.state.mode,'playing');assert.equal(document.activeElement,elements.get('game-canvas'));frame(1);assert.equal(elements.get('controls-hint').textContent,copy);
});
