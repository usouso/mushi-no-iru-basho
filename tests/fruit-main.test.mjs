import {createTestLocks} from './fixtures/journal-locks.mjs';
/** Fermented fruit actual-main integration; self-contained Node standard-library test.
 * Run: node --test tests/fruit-main.test.mjs (also without package.json).
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

const station=()=>g.world.baitStation;
function near(){const s=station();g.setPose({x:s.x,y:g.world.heightAt(s.x,s.z+1.5)+1.65,z:s.z+1.5,yaw:0,pitch:-.2});frame(1);}
function watch(){const s=station();g.setPose({x:s.x+2,y:g.world.heightAt(s.x+2,s.z+3)+1.65,z:s.z+3});frame(1);}
function pressE(){key('keydown','KeyE');key('keyup','KeyE');}
function until(predicate,seconds=50){for(let n=0;n<seconds*60;n++){frame(1);if(predicate())return;}assert.fail('expected main state within time budget');}
const fruit=()=>renderedScene.getObjectByName('tropical-fermented-fruit');
test('E placement requires tropical table proximity, shows correct HUD, and held/repeat keys cannot double-toggle',()=>{
 choose('meadow');pressE();assert.equal(g.simulation.bait,null);assert.equal(elements.get('interaction-hint').hidden,true);
 choose('tropical');pressE();assert.equal(g.simulation.bait,null);near();assert.equal(elements.get('interaction-hint').hidden,false);assert.match(elements.get('interaction-hint').textContent,/発酵果実を置く/);
 key('keydown','KeyE');assert.equal(g.simulation.bait.active,true);key('keydown','KeyE',true);key('keydown','KeyE');assert.equal(g.simulation.bait.active,true);key('keyup','KeyE');frame(1);
 assert.equal(fruit().visible,true);assert.match(elements.get('interaction-hint').textContent,/片付ける/);frame(60*7);assert.equal(elements.get('toast').textContent,'');assert.equal(elements.get('interaction-hint').hidden,false);assert.match(elements.get('interaction-hint').textContent,/片付ける · 待つなら3mほど離れる/);pressE();frame(1);assert.equal(g.simulation.bait,null);assert.equal(fruit().visible,false);
});
test('gamepad X uses fresh edges, cannot re-toggle after held pause/resume, and removes fruit on a later fresh press',()=>{
 near();const pad={connected:true,axes:[0,0,0,0],buttons:Array.from({length:16},()=>({pressed:false}))};gamepads=[pad];frame(1);pad.buttons[2].pressed=true;frame(1);assert.equal(g.simulation.bait.active,true);frame(5);assert.equal(g.simulation.bait.active,true);
 g.pause();const remaining=g.simulation.bait.remaining;frame(30);assert.equal(g.simulation.bait.remaining,remaining);g.resume({lock:false});frame(3);assert.equal(g.simulation.bait.active,true);
 pad.buttons[2].pressed=false;frame(1);pad.buttons[2].pressed=true;frame(1);assert.equal(g.simulation.bait,null);gamepads=[];frame(1);
});
test('targeted observer position beyond three metres permits one existing visitor, continuous feeding capture, memo and release without pending-catch interaction',()=>{
 g.restart();near();pressE();frame(300);assert.equal(g.simulation.bait.visitorId,null,'standing close never reserves a visitor');watch();
 const ids=g.simulation.items.map(i=>i.id),homes=g.simulation.items.map(i=>({...i.home}));let maxStep=0,previous=g.simulation.items.map(i=>({x:i.x,y:i.y,z:i.z}));
 until(()=>{g.simulation.items.forEach((i,n)=>{maxStep=Math.max(maxStep,Math.hypot(i.x-previous[n].x,i.y-previous[n].y,i.z-previous[n].z));});previous=g.simulation.items.map(i=>({x:i.x,y:i.y,z:i.z}));assert.ok(g.simulation.items.filter(i=>i.state==='feeding'||i.state==='bait-approach').length<=1);return g.simulation.bait?.status==='feeding';});
 assert.ok(maxStep<.2);assert.deepEqual(g.simulation.items.map(i=>i.id),ids);assert.deepEqual(g.simulation.items.map(i=>i.home),homes);
 const visitor=g.simulation.items.find(i=>i.id===g.simulation.bait.visitorId);assert.equal(visitor.state,'feeding');const captured={x:visitor.x,y:visitor.y,z:visitor.z};
 g.setPose({x:visitor.x,y:visitor.y+.5,z:visitor.z+1.5,yaw:0,pitch:-.3});key('keydown','Space');key('keyup','Space');assert.equal(g.simulation.caught,visitor);assert.equal(g.state.mode,'playing');
 pressE();assert.equal(g.simulation.bait.active,true,'capture delay cannot place/remove');frame(22);assert.equal(g.state.mode,'inspect');assert.equal(g.journal.entries.find(e=>e.species==='morpho').location,'熱帯の果実台');
 g.openJournal('morpho');const note=find('fj-note');note.value='果実台に来た';note.dispatchEvent(new Event('input'));const time=g.simulation.time;frame(30);assert.equal(g.simulation.time,time);g.closeJournal({lock:false});
 const held=g.simulation.caught;g.release({lock:false});assert.equal(held.state,'released');assert.deepEqual({x:held.x,y:held.y,z:held.z},captured);assert.equal(g.simulation.caught,null);watch();
 frame(60*15);assert.equal(g.simulation.bait.visitorId,null,'18-second next reservation gap is retained through main loop');
 assert.equal(g.journal.entries.find(e=>e.species==='morpho').note,'果実台に来た');
});
test('explicit removal updates visibility; pause freezes exposure and ninety seconds of playing expires both bait and display',()=>{
 near();pressE();frame(1);assert.equal(g.simulation.bait,null);assert.equal(fruit().visible,false);pressE();assert.equal(g.simulation.bait.active,true);
 g.pause();const snapshot=g.simulation.bait;frame(120);assert.deepEqual(g.simulation.bait,snapshot);g.resume({lock:false});near();
 frame(60*90+2);assert.equal(g.simulation.bait,null);assert.equal(fruit().visible,false);assert.match(elements.get('interaction-hint').textContent,/発酵果実を置く/);
});
test('restart and title clear bait/visitors without clearing journal; changing back to meadow restores no interaction',()=>{
 near();pressE();watch();until(()=>!!g.simulation.bait.visitorId);g.restart();frame(1);assert.equal(g.simulation.bait,null);assert.equal(g.simulation.caught,null);assert.equal(fruit().visible,false);assert.ok(g.simulation.items.every(i=>!i.excursion));
 near();pressE();g.title();frame(1);assert.equal(g.simulation.bait,null);assert.equal(g.state.mode,'title');assert.equal(fruit().visible,false);assert.equal(g.journal.entries.find(e=>e.species==='morpho').note,'果実台に来た');
 elements.get('habitat-select').value='meadow';g.start();frame(1);pressE();assert.equal(g.simulation.items.length,30);assert.equal(g.simulation.bait,null);assert.equal(elements.get('interaction-hint').hidden,true);
});
