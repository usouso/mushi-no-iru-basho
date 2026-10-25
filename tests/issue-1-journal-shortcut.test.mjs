/** Issue #1: actual input + journal UI, minimal DOM; not browser/WebGL QA.
 * Self-contained: node --test tests/issue-1-journal-shortcut.test.mjs
 * Data-URL imports also work in the published runtime checkout without package.json.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const moduleURL=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
const source=name=>readFile(new URL(`../src/${name}`,import.meta.url),'utf8');
const journalURL=moduleURL(await source('journal.js'));
const {createJournal}=await import(journalURL);
const {createJournalUI}=await import(moduleURL((await source('journal-ui.js')).replace("'./journal.js'",JSON.stringify(journalURL))));
const {createInput}=await import(moduleURL(await source('input.js')));
class Element extends EventTarget {
 constructor(tagName,doc){super();this.tagName=tagName.toUpperCase();this.doc=doc;this.children=[];this.dataset={};this.value='';}
 append(...nodes){this.children.push(...nodes);for(const n of nodes)n.parentElement=this;}
 replaceChildren(...nodes){this.children=[];this.append(...nodes);}
 setAttribute(key,value){this[key]=value;}focus(){this.doc.activeElement=this;}
 setSelectionRange(){}
 closest(selector){if(selector==='input, textarea, select')for(let node=this;node;node=node.parentElement)if(/^(INPUT|TEXTAREA|SELECT)$/.test(node.tagName))return node;return null;}
}
function fixture(t){
 const document=new EventTarget(),window=new EventTarget();let pads=[],mode='playing',toggles=0,pauseOptions=[];
 document.createElement=tag=>new Element(tag,document);document.body=document.createElement('body');const canvas=document.createElement('canvas');document.body.append(canvas);canvas.focus();
 for(const [key,value]of Object.entries({document,window,navigator:{getGamepads:()=>pads}})){
  const old=Object.getOwnPropertyDescriptor(globalThis,key);Object.defineProperty(globalThis,key,{configurable:true,value});t.after(()=>{if(old)Object.defineProperty(globalThis,key,old);else delete globalThis[key];});
 }
 const journal=createJournal({getItem:()=>null,setItem(){}});journal.record({species:'butterfly',location:'野原'});
 let input;const close=()=>{ui.close();mode='playing';input.clear();canvas.focus();};
 const toggle=()=>{toggles++;if(mode==='journal')close();else{mode='journal';input.clear();ui.open();}};
 const ui=createJournalUI({journal,onClose:close});
 input=createInput(canvas,{mode:()=>mode,journal:toggle,pause(options){pauseOptions.push(options);if(mode==='journal')close();},action(){},back(){if(mode==='journal')close();},blur(){input.clear();},lock(){}});
 const emit=(type,code,props={})=>{const event=new Event(type,{cancelable:true});for(const[k,v]of Object.entries({code,repeat:false,target:document.activeElement,...props}))Object.defineProperty(event,k,{value:v});document.dispatchEvent(event);return event;};
 const key=(code,props)=>emit('keydown',code,props),up=code=>emit('keyup',code);
 const descendants=node=>[node,...node.children.flatMap(descendants)];
 return {document,canvas,input,ui,journal,key,up,get mode(){return mode;},get toggles(){return toggles;},pauseOptions,setPads(value){pads=value;},find:cls=>descendants(ui.element).find(n=>n.className===cls)};
}
test('J opens the actual journal UI and closes it with its close BUTTON focused',t=>{
 const f=fixture(t);assert.equal(f.key('KeyJ').defaultPrevented,true);assert.equal(f.mode,'journal');
 assert.equal(f.document.activeElement,f.find('fj-close'));assert.equal(f.document.activeElement.tagName,'BUTTON');
 f.up('KeyJ');const closing=f.key('KeyJ');assert.equal(f.mode,'playing');assert.equal(closing.defaultPrevented,true);assert.equal(f.ui.element.hidden,true);assert.equal(f.document.activeElement,f.canvas);
});
test('typing j in actual journal textarea stays native and saves the note',t=>{
 const f=fixture(t);f.key('KeyJ');const note=f.find('fj-note');note.focus();
 const typing=f.key('KeyJ');assert.equal(typing.defaultPrevented,false);assert.equal(f.mode,'journal');
 // Emulate the browser default text insertion only after checking it is allowed.
 note.value+='j';note.dispatchEvent(new Event('input'));assert.equal(f.journal.entries[0].note,'j');assert.equal(f.toggles,1);
});
test('input, select/option and inherited contenteditable retain native J typing',t=>{
 const f=fixture(t);f.key('KeyJ');
 const input=f.document.createElement('input'),select=f.document.createElement('select'),option=f.document.createElement('option');select.append(option);
 const editable=f.document.createElement('div'),child=f.document.createElement('span');editable.isContentEditable=child.isContentEditable=true;editable.append(child);
 for(const target of [input,select,option,editable,child]){target.focus();assert.equal(f.key('KeyJ').defaultPrevented,false);assert.equal(f.mode,'journal');}
 assert.equal(f.toggles,1);
});
test('held J repeat cannot close/reopen the journal across focus and mode changes',t=>{
 const f=fixture(t);f.key('KeyJ');for(let i=0;i<4;i++)f.key('KeyJ',{repeat:true});assert.equal(f.mode,'journal');assert.equal(f.toggles,1);
 f.up('KeyJ');f.key('KeyJ');assert.equal(f.mode,'playing');for(let i=0;i<4;i++)f.key('KeyJ',{repeat:true});assert.equal(f.mode,'playing');assert.equal(f.toggles,2);
});
test('IME composition and Ctrl/Alt/Meta J shortcuts are neither intercepted nor toggled',t=>{
 const f=fixture(t);f.key('KeyJ');
 for(const props of [{isComposing:true},{keyCode:229},{ctrlKey:true},{altKey:true},{metaKey:true},{ctrlKey:true,shiftKey:true}]){
  assert.equal(f.key('KeyJ',props).defaultPrevented,false);assert.equal(f.mode,'journal');
 }
 assert.equal(f.toggles,1);
});
test('Esc still closes from the focused close button or memo with no relock option',t=>{
 const f=fixture(t);
 for(const focusMemo of [false,true]){
  f.key('KeyJ');if(focusMemo)f.find('fj-note').focus();
  assert.equal(f.key('Escape').defaultPrevented,true);assert.equal(f.mode,'playing');assert.deepEqual(f.pauseOptions.at(-1),{lock:false});
 }
 assert.equal(f.pauseOptions.length,2);
});
test('gamepad View opens and closes on fresh edges while its held state never loops',t=>{
 const f=fixture(t),pad={connected:true,axes:[0,0,0,0],buttons:Array.from({length:16},()=>({pressed:false}))};f.setPads([pad]);f.input.read(.016);
 pad.buttons[8].pressed=true;f.input.read(.016);assert.equal(f.mode,'journal');assert.equal(f.document.activeElement.tagName,'BUTTON');
 for(let i=0;i<4;i++)f.input.read(.016);assert.equal(f.toggles,1);
 pad.buttons[8].pressed=false;f.input.read(.016);pad.buttons[8].pressed=true;f.input.read(.016);assert.equal(f.mode,'playing');assert.equal(f.toggles,2);
});
test('closing with focused-button J permits fresh walking without stale held movement',t=>{
 const f=fixture(t);f.key('KeyW');assert.equal(f.input.read(.016).z,1);f.key('KeyJ');assert.equal(f.input.read(.016).z,0);
 f.up('KeyJ');f.key('KeyJ');assert.equal(f.mode,'playing');assert.equal(f.input.read(.016).z,0);
 f.up('KeyW');f.key('KeyW');assert.equal(f.input.read(.016).z,1);f.up('KeyW');assert.equal(f.input.read(.016).z,0);
});
