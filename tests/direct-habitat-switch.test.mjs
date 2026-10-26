import {createTestLocks} from './fixtures/journal-locks.mjs';
/** Direct pause-menu habitat travel actual-main integration; self-contained Node standard-library test.
 * Run: node --test tests/direct-habitat-switch.test.mjs (also without package.json).
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
function resources(scene){const all=new Set(),worldMaps=new Set(),insectMaps=new Set(),privateInsectMaps=new Set(),instances=new Set();for(const root of scene.children){if(root.isCamera)continue;root.traverse(o=>{if(o.isInstancedMesh)instances.add(o);if(o.geometry)all.add(o.geometry);for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[]){all.add(m);for(const value of Object.values(m))if(value?.isTexture)(['divingbeetle','ladybird','swallowtail','longhorn'].includes(root.userData.species)?privateInsectMaps:root.userData.species?insectMaps:worldMaps).add(value);}});}return {all,worldMaps,insectMaps,privateInsectMaps,instances};}

const select=()=>elements.get('travel-habitat-select');
const travelButton=()=>elements.get('travel-button');
function selectDestination(id){select().value=id;select().dispatchEvent(new Event('change'));}
function travel(id){if(g.state.mode==='playing')g.pause({lock:false});assert.equal(g.state.mode,'paused');selectDestination(id);travelButton().click();frame(1);}

test('pause offers the same five destinations; selection alone and Escape cancel preserve the field and bait',()=>{
 choose('tropical');const options=select().children;
 assert.deepEqual(options.map(o=>o.value),['meadow','tropical','understory','night','savanna']);
 const titleOptions=[...html.matchAll(/<option value="([^"]+)"[^>]*>([^<]+)<\/option>/g)];
 assert.deepEqual(options.map(o=>[o.value,o.textContent]),titleOptions.map(m=>[m[1],m[2]]));
 assert.match(html,/入口へ移動します。置いた餌は片付きます。/);
 const station=g.world.baitStation;assert.ok(g.simulation.placeBait({type:station.type,...station.target}));
 g.setPose({x:3,y:2,z:9});g.pause({lock:false});const original=g.simulation,world=g.world,pose={...g.state.player},bait=g.simulation.bait;
 assert.equal(document.activeElement,elements.get('resume-button'));assert.equal(select().value,'tropical');assert.equal(travelButton().disabled,true);
 selectDestination('night');assert.equal(travelButton().disabled,false);frame(20);
 assert.equal(g.simulation,original);assert.equal(g.world,world);assert.deepEqual(g.state.player,pose);assert.deepEqual(g.simulation.bait,bait);
 key('keydown','Escape');key('keyup','Escape');assert.equal(g.state.mode,'playing');assert.equal(g.simulation,original);assert.deepEqual(g.simulation.bait,bait);
 g.pause({lock:false});assert.equal(select().value,'tropical');assert.equal(travelButton().disabled,true);elements.get('resume-button').click();
 assert.equal(g.simulation,original);assert.deepEqual(g.simulation.bait,bait);
});
test('same and invalid destinations are strict no-ops and off-menu activation is ignored',()=>{
 g.pause({lock:false});const simulation=g.simulation,world=g.world,pose={...g.state.player},locks=lockRequests;
 for(const id of ['tropical','invalid','__proto__']){selectDestination(id);assert.equal(travelButton().disabled,true);travelButton().click();assert.equal(g.state.mode,'paused');assert.equal(g.simulation,simulation);assert.equal(g.world,world);assert.deepEqual(g.state.player,pose);}
 assert.equal(lockRequests,locks);g.resume({lock:false});selectDestination('meadow');travelButton().click();assert.equal(g.state.habitat,'tropical');assert.equal(g.simulation,simulation);
});
test('travel during capture delay returns old held insect without phantom inspection and preserves its journal record',async()=>{
 g.restart();const caught=catchSpecies('morpho',{wait:false});g.journal.setNote('morpho','移動前の青い翅');await g.journal.flush();
 const old=g.simulation,journal=g.journal,entries=g.journal.entries,raw=savedSettings.get('mushi-journal-v2'),count=g.state.captures;
 assert.equal(old.caught,caught);g.pause({lock:false});const locks=lockRequests;selectDestination('night');travelButton().click();
 assert.equal(g.state.mode,'playing');assert.equal(g.state.habitat,'night');assert.equal(old.caught,null);assert.equal(g.simulation.caught,null);assert.equal(old.bait,null);
 assert.equal(g.journal,journal);assert.deepEqual(g.journal.entries,entries);assert.equal(savedSettings.get('mushi-journal-v2'),raw);assert.equal(g.state.captures,count);
 assert.equal(lockRequests,locks);assert.equal(document.pointerLockElement,null);assert.equal(document.activeElement,elements.get('game-canvas'));
 frame(40);assert.equal(g.state.mode,'playing');screen('start-screen',false);screen('inspect-screen',false);screen('look-resume-hint',true);
});
test('all five destinations can be revisited directly; each discarded scene releases resources, never passing through title',()=>{
 const types={tropical:11,understory:5,savanna:1,meadow:29,night:6};
 for(const id of ['tropical','understory','savanna','meadow','night','meadow']){
  frame(1);const old=renderedScene,owned=resources(old),disposed=new Set();for(const value of [...owned.all,...owned.worldMaps])value.addEventListener('dispose',()=>disposed.add(value));
  const captures=g.state.captures,entries=g.journal.entries;g.pause({lock:false});const locks=lockRequests;selectDestination(id);travelButton().click();
  assert.equal(g.state.mode,'playing');assert.equal(g.state.habitat,id);assert.equal(g.simulation.items.length,types[id]);assert.equal(g.state.player.x,g.world.spawn.x);assert.equal(g.state.player.z,g.world.spawn.z);
  assert.equal(elements.get('habitat-select').value,id);assert.equal(g.state.captures,captures);assert.deepEqual(g.journal.entries,entries);assert.equal(lockRequests,locks);
  screen('start-screen',false);screen('pause-screen',false);frame(1);assert.notEqual(renderedScene,old);assert.equal(old.children.length,0);
  for(const resource of [...owned.all,...owned.worldMaps])assert.ok(disposed.has(resource),'obsolete scene resource disposed');
 }
});
test('travel applies the same zero-volume/sensitivity recovery as resume and does not leak held movement',async()=>{
 g.pause({lock:false});elements.get('volume').value='0';elements.get('sensitivity').value='1.7';
 // A final range value must be applied even if the browser has not dispatched input/change.
 const contexts=audioContexts.length;selectDestination('tropical');travelButton().click();await settle();frame(1);
 assert.equal(g.state.volume,0);assert.equal(g.state.sensitivity,1.7);assert.equal(master().value,0);assert.equal(audioContexts.length,contexts);
 assert.deepEqual(JSON.parse(savedSettings.get('mushi-settings-v1')),{sensitivity:1.7,volume:0});
 key('keydown','KeyW');frame(2);g.pause({lock:false});selectDestination('night');travelButton().click();const z=g.state.player.z;frame(10);assert.equal(g.state.player.z,z);key('keyup','KeyW');
 key('keydown','KeyW');frame(5);key('keyup','KeyW');assert.notEqual(g.state.player.z,z,'fresh movement works');
 g.pause({lock:false});await settle();assert.equal(audioContext.state,'suspended');const pausedTime=g.simulation.time;frame(10);assert.equal(g.simulation.time,pausedTime);
 key('keydown','Escape');key('keyup','Escape');await settle();assert.equal(g.state.mode,'playing');assert.equal(master().value,0);
});
test('pad Start pause/resume and journal round-trip still work after travel',()=>{
 const pad={connected:true,axes:[0,0,0,0],buttons:Array.from({length:16},()=>({pressed:false}))};gamepads=[pad];frame(1);
 pad.buttons[9].pressed=true;frame(1);assert.equal(g.state.mode,'paused');pad.buttons[9].pressed=false;frame(1);
 selectDestination('meadow');travelButton().click();assert.equal(g.state.mode,'playing');frame(1);
 pad.buttons[8].pressed=true;frame(1);assert.equal(g.state.mode,'journal');pad.buttons[8].pressed=false;frame(1);pad.buttons[8].pressed=true;frame(1);assert.equal(g.state.mode,'playing');pad.buttons[8].pressed=false;frame(1);
 pad.buttons[9].pressed=true;frame(1);assert.equal(g.state.mode,'paused');pad.buttons[9].pressed=false;frame(1);pad.buttons[9].pressed=true;frame(1);assert.equal(g.state.mode,'playing');gamepads=[];
});
