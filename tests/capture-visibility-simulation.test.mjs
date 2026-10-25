/** Visibility is a small injected geometry contract; no renderer is read by simulation. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createInsects} from '../src/insects.js';
const homes=[['butterfly',0,0,1.15],['butterfly',.4,-.3,1.15]];
const eye={x:0,y:1.65,z:2},aim={x:0,y:-.5,z:-2};

test('the same visibility veto excludes an occluded target from hints and capture without changing its state',()=>{
 const calls=[],sim=createInsects(()=>0,{homes,hasLineOfSight:(from,item)=>{calls.push({from:{...from},id:item.id});return false;}}),before=structuredClone(sim.items);
 assert.equal(sim.findTarget(eye,aim),null);assert.equal(sim.swing(eye,aim).ok,false);assert.equal(sim.caught,null);assert.equal(sim.catches,0);assert.deepEqual(sim.items,before);
 assert.ok(calls.length>=2);assert.ok(calls.every(c=>c.from.x===eye.x&&c.from.y===eye.y&&c.from.z===eye.z));
});
test('a blocked nearer candidate cannot hide a clear capturable candidate; the adapter survives reset',()=>{
 const sim=createInsects(()=>0,{homes,hasLineOfSight:(_eye,item)=>item.id==='insect-2'});
 for(let round=0;round<2;round++){
  assert.equal(sim.findTarget(eye,aim)?.item.id,'insect-2');assert.equal(sim.swing(eye,aim).item.id,'insect-2');assert.equal(sim.catches,1);sim.reset();
 }
});
test('visibility is optional, strict-true, and never extends the existing distance or aim thresholds',()=>{
 const one=[homes[0]];
 for(const hasLineOfSight of [undefined,()=>true]){
  const sim=createInsects(()=>0,{homes:one,...(hasLineOfSight?{hasLineOfSight}:{})});
  assert.equal(sim.swing({x:0,y:1.15,z:2.599},{x:0,y:0,z:-1}).ok,true);sim.reset();
  assert.equal(sim.swing({x:0,y:1.15,z:2.601},{x:0,y:0,z:-1}).ok,false);
  assert.equal(sim.swing({x:0,y:1.15,z:2},{x:0,y:0,z:1}).ok,false);
 }
 for(const answer of [false,undefined,null,1])assert.equal(createInsects(()=>0,{homes:one,hasLineOfSight:()=>answer}).swing(eye,aim).ok,false);
 assert.throws(()=>createInsects(()=>0,{hasLineOfSight:null}),/line-of-sight/);
});
