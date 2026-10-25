import {createTestLocks} from './fixtures/journal-locks.mjs';
/** Issue #1 actual-main integration; self-contained Node standard-library test.
 * Run: node --test tests/issue-1-journal-main.test.mjs (also without package.json).
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
const ctx2d={};for(const key of ['fillRect','clearRect','beginPath','moveTo','lineTo','bezierCurveTo','quadraticCurveTo','stroke','fill','save','restore','translate','rotate','ellipse','arc','drawImage','closePath'])ctx2d[key]=()=>{};ctx2d.createLinearGradient=()=>({addColorStop(){}});
let asynchronousLocks=false,lockRequests=0;const lockNotifications=[];
const notifyLockChange=()=>{const fire=()=>document.dispatchEvent(new Event('pointerlockchange'));if(asynchronousLocks)lockNotifications.push(fire);else fire();};
async function flushLockNotifications(){while(lockNotifications.length){const callbacks=lockNotifications.splice(0);await new Promise(resolve=>setImmediate(()=>{callbacks.forEach(fn=>fn());resolve();}));}}
class Element extends EventTarget {constructor(id,tagName='DIV'){super();this.id=id;this.tagName=tagName;this.children=[];this.attributes={};this.dataset={};this.selectionStart=0;this.selectionEnd=0;this.hidden=true;this.value='';this.textContent='';this.classes=new Set();this.classList={toggle:(c,on)=>on?this.classes.add(c):this.classes.delete(c)};}append(...children){this.children.push(...children);}replaceChildren(...children){this.children=children;}setAttribute(key,value){this.attributes[key]=value;}setSelectionRange(start,end){this.selectionStart=start;this.selectionEnd=end;}set innerHTML(value){throw Error('Unsafe innerHTML sink');}focus(){document.activeElement=this;}getContext(type){assert.equal(type,'2d');return ctx2d;}requestPointerLock(){lockRequests++;const acquire=()=>{document.pointerLockElement=this;notifyLockChange();};if(asynchronousLocks)lockNotifications.push(acquire);else acquire();return Promise.resolve();}click(){this.onclick?.({target:this});this.dispatchEvent(new Event('click'));}}
const elements=new Map();const html=fs.readFileSync(path.join(root,'index.html'),'utf8');for(const m of html.matchAll(/<(\w+)[^>]*\bid="([^"]+)"/g))elements.set(m[2],new Element(m[2],m[1].toUpperCase()));
const document=new EventTarget();document.getElementById=id=>{assert.ok(elements.has(id),`Unknown DOM id ${id}`);return elements.get(id);};document.body=new Element('','BODY');document.createElement=tag=>new Element('',tag.toUpperCase());document.exitPointerLock=()=>{document.pointerLockElement=null;notifyLockChange();};
const param=()=>({value:0,targets:[],setTargetAtTime(value){this.value=value;this.targets.push(value);},setValueAtTime(value){this.value=value;},exponentialRampToValueAtTime(value){this.value=value;}});const node=()=>({connect(){},start(){},stop(){},gain:param(),frequency:param(),Q:param(),pan:param()});
const audioContexts=[];let audioContext;class AudioContext {constructor(){audioContext=this;audioContexts.push(this);this.state='suspended';this.resumeCalls=0;this.suspendCalls=0;this.closeCalls=0;this.gains=[];this.sampleRate=100;this.currentTime=0;this.destination={};}createGain(){const gain=node();this.gains.push(gain);return gain;}createBufferSource(){return node();}createBiquadFilter(){return node();}createOscillator(){return node();}createStereoPanner(){return node();}createBuffer(channels,length){return {getChannelData:()=>new Float32Array(length)};}resume(){this.resumeCalls++;return Promise.resolve().then(()=>{if(this.state!=='closed')this.state='running';});}suspend(){this.suspendCalls++;return Promise.resolve().then(()=>{if(this.state!=='closed')this.state='suspended';});}close(){this.closeCalls++;this.state='closed';return Promise.resolve();}}
let rendererChecks=0;class Renderer {constructor(){this.shadowMap={};this.info={render:{calls:0,triangles:0,points:0,lines:0}};}setPixelRatio(){}setSize(){}render(scene,camera){scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);scene.traverse(obj=>{assert.ok(obj.matrixWorld.elements.every(Number.isFinite),`Nonfinite matrix ${obj.name}`);});this.info.render.calls++;rendererChecks++;}}
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
 if(name==='main.js')source+='\nexport {state,simulation,world,journal,start,restart,pause,resume,release,swing,openJournal,closeJournal};';
 const url='data:text/javascript;base64,'+Buffer.from(source).toString('base64');moduleURLs.set(name,url);return url;
}
const app=await import(moduleURL('main.js'));
const g={...app,setPose:pose=>Object.assign(app.state.player,pose)};
assert.equal(window.__insectGame,undefined,'public production path must not require debug globals');
const settle=async()=>{await new Promise(resolve=>setImmediate(resolve));};
const master=()=>audioContext.gains[0].gain;
const descendants=node=>[node,...node.children.flatMap(descendants)];
const find=cls=>descendants(document.body).find(node=>node.className?.split(' ').includes(cls));
const modal=()=>find('field-journal');
function keyFrom(target,code,repeat=false){const e=new Event('keydown',{cancelable:true});Object.defineProperties(e,{target:{value:target},code:{value:code},repeat:{value:repeat}});document.dispatchEvent(e);return e;}
function firstCatch(){g.restart();frame(60);const i=g.simulation.items[0];g.setPose({x:i.x,z:i.z+1.5,y:i.y+.5,yaw:0,pitch:-.3});const place={x:Math.round(i.x*10)/10,z:Math.round(i.z*10)/10};g.swing();assert.ok(g.simulation.caught);frame(22);assert.equal(g.state.mode,'inspect');return place;}
function inert(expected){assert.equal(elements.get('app-shell').inert,expected);assert.equal(elements.get('game-canvas').inert,expected);}
// Explicit activeElement targets reproduce native focus routing; dispatching only at
// document would conceal the issue's focused-BUTTON shortcut regression.
test('issue #1: immediate focused-close-button J toggle and walking survive 20 cycles',()=>{
 g.restart();frame(1);
 for(let cycle=0;cycle<20;cycle++){
  key('keydown','KeyJ');key('keyup','KeyJ');assert.equal(g.state.mode,'journal');
  assert.equal(document.activeElement,find('fj-close'));assert.equal(document.activeElement.tagName,'BUTTON');
  key('keydown','KeyJ',true);assert.equal(g.state.mode,'journal','held repeat must not close');
  key('keydown','KeyJ');key('keyup','KeyJ');assert.equal(g.state.mode,'playing',`immediate J close cycle ${cycle}`);
  assert.equal(document.activeElement,elements.get('game-canvas'));inert(false);assert.equal(modal().hidden,true);
  const before={x:g.state.player.x,z:g.state.player.z};key('keydown','KeyW');frame(6);key('keyup','KeyW');
  assert.ok(Math.hypot(g.state.player.x-before.x,g.state.player.z-before.z)>.1,`walk after cycle ${cycle}`);
  frame(2);assert.equal(g.state.player.speed,0);assert.equal(g.state.player.quiet,false);assert.equal(g.state.player.running,false);
 }
});
test('issue #1: memo j remains editable and Escape closes from its actual focus',()=>{
 firstCatch();g.release({lock:false});g.openJournal('butterfly');const note=find('fj-note');
 assert.equal(document.activeElement,note);assert.equal(note.tagName,'TEXTAREA');
 const event=key('keydown','KeyJ');assert.equal(event.defaultPrevented,false);assert.equal(g.state.mode,'journal');
 // DOM double has no browser editing default; explicitly apply only that default.
 note.value+='j';note.dispatchEvent(new Event('input'));key('keyup','KeyJ');
 assert.ok(g.journal.entries[0].note.endsWith('j'));assert.equal(g.state.mode,'journal');
 key('keydown','Escape');key('keyup','Escape');assert.equal(g.state.mode,'playing');
 assert.equal(document.activeElement,elements.get('game-canvas'));inert(false);
 const before=g.state.player.z;key('keydown','KeyW');frame(6);key('keyup','KeyW');assert.ok(g.state.player.z<before);
});
test('issue #1: View edges toggle while close button focused, then physical-key movement resumes',()=>{
 g.restart();const pad={connected:true,axes:[0,0,0,0],buttons:Array.from({length:16},()=>({pressed:false}))};gamepads=[pad];frame(1);
 pad.buttons[8].pressed=true;frame(1);assert.equal(g.state.mode,'journal');assert.equal(document.activeElement,find('fj-close'));
 frame(5);assert.equal(g.state.mode,'journal');pad.buttons[8].pressed=false;frame(1);pad.buttons[8].pressed=true;frame(1);
 assert.equal(g.state.mode,'playing');assert.equal(document.activeElement,elements.get('game-canvas'));frame(5);assert.equal(g.state.mode,'playing');
 pad.buttons[8].pressed=false;gamepads=[];frame(1);const before=g.state.player.z;
 key('keydown','KeyW');frame(6);key('keyup','KeyW');assert.ok(g.state.player.z<before);frame(2);assert.equal(g.state.player.speed,0);
});
test('issue #1: close-button click and Escape restore the proper gameplay focus',()=>{
 g.restart();key('keydown','KeyJ');key('keyup','KeyJ');assert.equal(document.activeElement,find('fj-close'));
 find('fj-close').click();assert.equal(g.state.mode,'playing');assert.equal(document.activeElement,elements.get('game-canvas'));
 key('keydown','KeyJ');key('keyup','KeyJ');key('keydown','Escape');key('keyup','Escape');
 assert.equal(g.state.mode,'playing');assert.equal(document.activeElement,elements.get('game-canvas'));inert(false);
});
test('issue #1: J from paused journal restores paused state rather than starting movement',()=>{
 g.restart();g.pause();elements.get('pause-journal-button').click();assert.equal(document.activeElement,find('fj-close'));
 key('keydown','KeyJ');key('keyup','KeyJ');assert.equal(g.state.mode,'paused');assert.equal(document.activeElement,elements.get('resume-button'));
 g.resume({lock:false});assert.equal(g.state.mode,'playing');
});
test('issue #1: J closes an inspection journal without releasing the captured insect',()=>{
 firstCatch();const held=g.simulation.caught.id;g.openJournal();assert.equal(document.activeElement,find('fj-close'));
 key('keydown','KeyJ');key('keyup','KeyJ');assert.equal(g.state.mode,'inspect');assert.equal(g.simulation.caught.id,held);
 assert.equal(document.activeElement,elements.get('release-button'));g.release({lock:false});assert.equal(g.state.mode,'playing');
});
