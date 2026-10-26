import {createTestLocks} from './fixtures/journal-locks.mjs';
/** Tropical habitat switch actual-main integration; self-contained Node standard-library test.
 * Run: node --test tests/tropical-main.test.mjs (also without package.json).
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
test('title selector does not change live habitat until start; default meadow stays eighteen',()=>{
 assert.equal(g.state.mode,'title');assert.equal(g.state.habitat,'meadow');assert.equal(g.simulation.items.length,29);
 const original=g.world;elements.get('habitat-select').value='tropical';elements.get('habitat-select').dispatchEvent(new Event('change'));frame(3);
 assert.equal(g.state.mode,'title');assert.equal(g.world,original);assert.equal(g.simulation.items.length,29);
 elements.get('start-button').click();frame(1);assert.equal(g.state.habitat,'tropical');assert.equal(g.simulation.items.length,11);
 assert.deepEqual(g.simulation.items.map(i=>[i.id,i.species]),['morpho','morpho','morpho','morpho','hercules','hercules','leafcutterant','leafcutterant','leafcutterant','leafcutterant','elephant'].map((species,i)=>['insect-'+(i+1),species]),'old ten IDs/order remain; elephant is appended insect-11');
 assert.ok(g.simulation.items.filter(i=>i.species==='morpho').length===4&&g.simulation.items.every(i=>!i.caught));assert.equal(g.state.player.x,0);assert.equal(g.state.player.z,12);assert.equal(g.state.captures,0);
 const enteredWorld=g.world;g.swing();assert.equal(g.state.cooldown,.7);g.pause();g.title();assert.equal(g.state.cooldown,0);g.start();assert.equal(g.world,enteredWorld,'same-habitat entry reuses its world');
 g.swing();assert.equal(g.state.swing,.001,'net is immediately reusable after title re-entry');g.restart();
});
test('morpho actual capture, inspection, journal note, release and recapture complete one cycle',()=>{
 const item=catchSpecies('morpho');assert.match(elements.get('insect-name').textContent,/モルフォ/);assert.match(elements.get('insect-description').textContent,/果実/);
 assert.equal(g.journal.entries.length,1);assert.equal(g.journal.entries[0].species,'morpho');assert.equal(g.journal.entries[0].location,g.world.locationLabel(item.x,item.z));
 elements.get('inspect-journal-button').click();assert.equal(g.state.mode,'journal');const note=find('fj-note');assert.equal(document.activeElement,note);
 note.value='青い表と褐色の裏';note.dispatchEvent(new Event('input'));key('keydown','Escape');key('keyup','Escape');assert.equal(g.state.mode,'inspect');
 elements.get('release-button').click();assert.equal(g.state.mode,'playing');assert.equal(g.simulation.caught,null);assert.equal(item.state,'released');
 g.setPose({x:30,y:2,z:30});frame(75);catchSpecies('morpho');assert.equal(g.journal.entries[0].note,'青い表と褐色の裏');
});
test('restart retains selected habitat and notes but resets held catch, counters and modifier state',()=>{
 const journal=JSON.stringify(g.journal.entries);elements.get('habitat-select').value='meadow';g.restart();frame(1);
 assert.equal(g.state.habitat,'tropical');assert.equal(g.simulation.items.length,11);assert.equal(g.simulation.caught,null);assert.equal(g.state.captures,0);assert.deepEqual(g.state.seen,[]);
 assert.equal(g.state.player.z,12);assert.equal(g.state.player.running,false);assert.equal(g.state.player.quiet,false);assert.equal(JSON.stringify(g.journal.entries),journal);
 g.pause();const elapsed=g.state.elapsed;frame(10);assert.equal(g.state.elapsed,elapsed);g.resume({lock:false});assert.equal(g.state.habitat,'tropical');
});
test('switching during pending catch discards held state without phantom inspect and keeps settings/journal',async()=>{
 g.restart();catchSpecies('morpho',{wait:false});assert.equal(g.state.mode,'playing');
 elements.get('volume').value='0';elements.get('volume').dispatchEvent(new Event('input'));elements.get('sensitivity').value='1.4';elements.get('sensitivity').dispatchEvent(new Event('change'));
 const old=g.simulation;choose('meadow');frame(40);await settle();
 assert.notEqual(g.simulation,old);assert.equal(old.caught,null);assert.equal(g.simulation.caught,null);assert.equal(g.state.mode,'playing');assert.equal(g.simulation.items.length,29);
 assert.equal(g.state.captures,0);assert.deepEqual(g.state.seen,[]);assert.equal(g.state.volume,0);assert.equal(g.state.sensitivity,1.4);assert.equal(master().value,0);
 assert.equal(g.journal.entries.find(e=>e.species==='morpho').note,'青い表と褐色の裏');
 key('keydown','KeyW');const z=g.state.player.z;frame(10);key('keyup','KeyW');assert.ok(g.state.player.z<z);
});
test('four actual species records and notes survive habitat switching and fresh journal reload',async()=>{
 for(const species of ['butterfly','dragonfly','cicada']){g.restart();catchSpecies(species);g.journal.setNote(species,`memo-${species}`);g.release({lock:false});}
 assert.equal(g.journal.entries.length,4);const expected=g.journal.entries;
 await g.journal.flush();const {createJournal}=await import(moduleURL('journal.js'));assert.deepEqual(createJournal(localStorage).entries,expected);
 choose('tropical');assert.equal(g.simulation.caught,null);assert.deepEqual(g.journal.entries,expected);
 g.openJournal();assert.equal(descendants(modal()).filter(n=>n.className?.split(' ').includes('fj-card')).length,25);g.closeJournal({lock:false});
 choose('meadow');assert.deepEqual(g.journal.entries,expected);
});
test('repeated habitat switches dispose obsolete geometry/material/world textures while retaining cached insect maps',()=>{
 choose('meadow');const meshCounts=[];
 for(const habitat of ['tropical','understory','night','meadow']){
  frame(1);const from=g.state.habitat,oldScene=renderedScene,owned=resources(oldScene),disposed=new Set(),instanceDisposes=new Map();
  for(const mesh of owned.instances){instanceDisposes.set(mesh,0);mesh.addEventListener('dispose',()=>instanceDisposes.set(mesh,instanceDisposes.get(mesh)+1));}
  for(const r of [...owned.all,...owned.worldMaps,...owned.insectMaps,...owned.privateInsectMaps])r.addEventListener('dispose',()=>disposed.add(r));
  assert.ok(owned.all.size>10);assert.ok(owned.instances.size>0);if(['meadow','tropical'].includes(from))assert.ok(owned.worldMaps.size>0);choose(habitat);
  for(const count of instanceDisposes.values())assert.equal(count,1,'each old InstancedMesh releases its instance attributes exactly once');
  meshCounts.push({from,to:habitat,instances:owned.instances.size,disposeEvents:[...instanceDisposes.values()].reduce((a,b)=>a+b,0)});
  assert.notEqual(renderedScene,oldScene);for(const r of owned.all)assert.ok(disposed.has(r),'old geometry/material disposed');
  for(const r of owned.worldMaps)assert.ok(disposed.has(r),'old world texture disposed');
  for(const r of owned.insectMaps)assert.equal(disposed.has(r),false,'globally cached insect textures retained for reuse');
  for(const r of owned.privateInsectMaps)assert.equal(disposed.has(r),true,'diving/ladybird/swallowtail/longhorn instance-only maps are released rather than cached');
  assert.equal(oldScene.children.length,0);assert.equal(g.simulation.caught,null);assert.equal(g.state.mode,'playing');
 }
 console.log('CPU dispose-event counts, not GPU memory measurement:',JSON.stringify(meshCounts));
});
