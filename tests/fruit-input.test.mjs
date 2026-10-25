import test from 'node:test';
import assert from 'node:assert/strict';
import { createInput } from '../src/input.js';

function fixture(initial='playing') {
  const document=new EventTarget(),window=new EventTarget(),canvas=new EventTarget();
  let mode=initial,pads=[];
  for(const [key,value] of Object.entries({document,window,navigator:{getGamepads:()=>pads}}))Object.defineProperty(globalThis,key,{configurable:true,value});
  const calls={interact:0,action:0,pause:0,journal:0,back:0,blur:0,lock:0};
  const callbacks={mode:()=>mode,...Object.fromEntries(Object.keys(calls).map(key=>[key,()=>calls[key]++]))};
  const input=createInput(canvas,callbacks);
  const emit=(target,type,props={})=>{const e=new Event(type,{cancelable:true});for(const[k,v]of Object.entries(props))Object.defineProperty(e,k,{value:v});target.dispatchEvent(e);return e;};
  const pad={connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false}))};
  return {input,document,window,canvas,calls,callbacks,pad,emit,setMode:m=>mode=m,connect:()=>pads=[pad],key:(props={})=>emit(document,'keydown',{code:'KeyE',repeat:false,...props}),up:()=>emit(document,'keyup',{code:'KeyE'}),press:i=>pad.buttons[i].pressed=true,release:i=>pad.buttons[i].pressed=false};
}

test('E is one fresh gameplay edge; repeats and duplicate down are ignored until release',()=>{
  const f=fixture();assert.equal(f.key().defaultPrevented,true);f.key({repeat:true});f.key();assert.equal(f.calls.interact,1);
  f.up();f.key();assert.equal(f.calls.interact,2);assert.equal(f.calls.action,0);
  f.input.clear();f.key({repeat:true});assert.equal(f.calls.interact,2);
});

test('E is inert in title, paused, journal and inspect; editing, IME and browser shortcuts stay untouched',()=>{
  for(const mode of ['title','paused','journal','inspect']){const f=fixture(mode);assert.equal(f.key().defaultPrevented,false);assert.equal(f.calls.interact,0);}
  for(const target of [{tagName:'TEXTAREA'},{tagName:'INPUT'},{tagName:'SELECT'},{tagName:'BUTTON'},{tagName:'DIV',isContentEditable:true},{tagName:'SPAN',closest:()=>({tagName:'TEXTAREA'})}]){const f=fixture();assert.equal(f.key({target}).defaultPrevented,false);assert.equal(f.calls.interact,0);}
  for(const props of [{isComposing:true},{keyCode:229},{ctrlKey:true},{altKey:true},{metaKey:true}]){const f=fixture();assert.equal(f.key(props).defaultPrevented,false);assert.equal(f.calls.interact,0);}
});

test('standard X/square is a fresh edge, not A/RT net, Start/View/B or held modifier replacement',()=>{
  const f=fixture();f.connect();f.input.read(.016);
  f.press(2);f.input.read(.016);f.input.read(.016);assert.equal(f.calls.interact,1);assert.equal(f.calls.action,0);
  f.release(2);f.input.read(.016);f.press(2);f.input.read(.016);assert.equal(f.calls.interact,2);
  for(const [button,callback] of [[0,'action'],[7,'action'],[9,'pause'],[8,'journal'],[1,'back']]){const before=f.calls[callback];f.press(button);f.input.read(.016);assert.equal(f.calls[callback],before+1);f.release(button);f.input.read(.016);}
  f.press(5);assert.equal(f.input.read(.016).run,true);f.press(4);const state=f.input.read(.016);assert.equal(state.quiet,true);assert.equal(state.run,false);
  f.release(4);f.release(5);f.input.read(.016);f.emit(f.document,'keydown',{code:'ShiftLeft'});assert.equal(f.input.read(.016).run,true);
  f.emit(f.canvas,'mousedown',{button:2});assert.equal(f.input.read(.016).quiet,true);
});

test('gamepad X does not interact in non-playing modes and must release after mode resume',()=>{
  for(const mode of ['title','paused','journal','inspect']){
    const f=fixture(mode);f.connect();f.input.read(.016);f.press(2);f.input.read(.016);assert.equal(f.calls.interact,0);
    f.setMode('playing');f.input.read(.016);f.input.read(.016);assert.equal(f.calls.interact,0);
    f.release(2);f.input.read(.016);f.press(2);f.input.read(.016);assert.equal(f.calls.interact,1);
  }
});

test('clear, blur and visibility boundaries do not re-arm a held gamepad X',()=>{
  for(const boundary of ['clear','blur','visibility']){
    const f=fixture();f.connect();f.input.read(.016);f.press(2);f.input.read(.016);assert.equal(f.calls.interact,1);
    if(boundary==='clear')f.input.clear();
    if(boundary==='blur')f.emit(f.window,'blur');
    if(boundary==='visibility'){f.document.hidden=true;f.emit(f.document,'visibilitychange');f.document.hidden=false;}
    f.input.read(.016);assert.equal(f.calls.interact,1);
    f.release(2);f.input.read(.016);f.press(2);f.input.read(.016);assert.equal(f.calls.interact,2);
  }
});

test('a prior action callback clearing or changing mode suppresses same-frame X and held next frame',()=>{
  for(const change of ['clear','inspect']){
    const f=fixture();f.connect();f.input.read(.016);
    f.callbacks.action=()=>{f.calls.action++;if(change==='clear')f.input.clear();else f.setMode('inspect');};
    f.press(0);f.press(2);f.input.read(.016);assert.equal(f.calls.action,1);assert.equal(f.calls.interact,0);
    f.setMode('playing');f.input.read(.016);assert.equal(f.calls.interact,0);
    f.release(0);f.release(2);f.input.read(.016);f.press(2);f.input.read(.016);assert.equal(f.calls.interact,1);
  }
});

test('interaction callback may clear input; continuous held X never repeats and stale movement is zeroed',()=>{
  const f=fixture();f.connect();f.input.read(.016);f.pad.axes[1]=-1;
  f.callbacks.interact=()=>{f.calls.interact++;f.input.clear();};
  f.press(2);const state=f.input.read(.016);assert.equal(f.calls.interact,1);assert.equal(state.z,0);
  f.input.read(.016);assert.equal(f.calls.interact,1);
  f.release(2);f.input.read(.016);f.press(2);f.input.read(.016);assert.equal(f.calls.interact,2);
});
