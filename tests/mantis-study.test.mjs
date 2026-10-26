/** Direct CPU pose/state evidence; no claims about actual rendered naturalness. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createMantisStudy} from '../src/mantis-study.js';
import {MANTIS_DIMENSIONS as D,sampleMantisPose} from '../src/mantis-kinematics.js';
const supports=()=>[{position:{x:8,y:1.218371471+D.rootAboveSupport,z:-4.2},heading:Math.PI},{position:{x:9.3,y:1.301363621+D.rootAboveSupport,z:-4.7},heading:Math.PI}];
const gap=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z),close=(a,b,e=1e-10)=>assert.ok(Math.abs(a-b)<e,`${a} != ${b}`);
function step(s,seconds){for(let n=0;n<Math.round(seconds*120);n++)s.update(1/120);}
function until(s,predicate,seconds=20){for(let n=0;n<seconds*120;n++){s.update(1/120);if(predicate(s.state))return;}assert.fail('expected phase');}

test('two horizontal supports cycle through closed/open/flight/land/closed with four supported feet and finite continuous pose',()=>{
 const perches=supports(),s=createMantisStudy(perches),phases=new Set();let before=s.state,landings=0;
 for(let n=0;n<70*120;n++){
  s.update(1/120);const a=s.state;phases.add(a.phase);const pose=sampleMantisPose(a);
  for(const value of [...Object.values(a.position),a.heading,a.pitch,a.wingOpen,a.wingPhase,a.legTuck,a.headYaw,a.time])assert.ok(Number.isFinite(value));
  for(const key of ['wingOpen','legTuck'])assert.ok(a[key]>=0&&a[key]<=1);assert.ok(Math.abs(a.headYaw)<=.12+1e-12);assert.equal(a.pitch,0);assert.ok(gap(a.position,before.position)<.006);assert.ok(Math.abs(a.heading-before.heading)<.07);assert.ok(Math.abs(a.wingOpen-before.wingOpen)<.02);assert.ok(Math.abs(a.legTuck-before.legTuck)<.025);
  if(a.phase!=='flying'){
   const support=perches.find(p=>gap(p.position,a.position)<1e-9);assert.ok(support);assert.equal(a.legTuck,0);const feet=pose.legs.filter(l=>l.support);assert.equal(feet.length,4);for(const leg of feet)close(a.position.y+leg.foot.y,support.position.y-D.rootAboveSupport);assert.equal(pose.legs.filter(l=>l.role==='raptorial'&&l.support).length,0);
  }else{assert.equal(a.wingOpen,1);assert.equal(a.headYaw,0);assert.ok(a.position.y>=Math.min(...perches.map(p=>p.position.y)));assert.ok(a.position.y<=Math.max(...perches.map(p=>p.position.y))+.263);}
  if(before.phase==='closing'&&a.phase==='resting'){landings++;assert.equal(a.wingOpen,0);assert.equal(a.legTuck,0);}
  before=a;
 }
 assert.deepEqual(phases,new Set(['resting','opening','flying','closing']));assert.ok(landings>=2);
});

test('capture freezes all clock and pose channels; release keeps exact geometry during rest, opening, flight and closing',()=>{
 for(const phase of ['resting','opening','flying','closing']){
  const s=createMantisStudy(supports());if(phase==='resting')step(s,3.7);else{s.depart();if(phase!=='opening')until(s,a=>a.phase===phase);step(s,phase==='flying'?1.23:.37);}
  assert.equal(s.state.phase,phase);const before=s.state,geometry=sampleMantisPose(before);assert.equal(s.capture(),true);assert.equal(s.capture(),false);assert.equal(s.depart(),false);step(s,2);assert.deepEqual({...s.state,caught:false},before);assert.equal(s.release(),true);assert.equal(s.release(),false);assert.deepEqual(sampleMantisPose(s.state),geometry);assert.equal(s.state.time,before.time);assert.equal(s.state.phase,phase==='resting'?'opening':phase);
  s.update(1/120);assert.ok(gap(s.state.position,before.position)<.00001);assert.ok(Math.abs(s.state.heading-before.heading)<.0001);assert.ok(Math.abs(s.state.wingOpen-before.wingOpen)<.0001);assert.ok(Math.abs(s.state.legTuck-before.legTuck)<.0001);until(s,a=>a.phase==='resting');assert.equal(s.state.wingOpen,0);
 }
});

test('depart chooses only a copied legal support, optionally away from a finite nearby player; no camera-facing head follow',()=>{
 const list=supports();list.push({position:{x:7.2,y:1.3,z:-4},heading:.4});const s=createMantisStudy(list),target={...list[2].position};assert.equal(s.depart({x:9.3,z:-4.7}),true);assert.equal(s.depart(),false);list[2].position.x=99;until(s,a=>a.phase==='resting');assert.deepEqual(s.state.position,target);
 const a=createMantisStudy(supports()),b=createMantisStudy(supports());step(a,3.7);step(b,3.7);assert.deepEqual(a.state,b.state);const copied=a.state;copied.position.y=99;assert.notEqual(a.state.position.y,99);assert.equal(a.depart({x:NaN,z:0}),true);until(a,p=>p.phase==='resting');assert.deepEqual(a.state.position,supports()[1].position);
});

test('zero/negative/nonfinite dt freezes state, large dt clamps, and malformed supports fail without hidden renderer dependencies',()=>{
 const a=createMantisStudy(supports()),b=createMantisStudy(supports()),initial=a.state;for(const dt of [0,-1,NaN,Infinity])a.update(dt);assert.deepEqual(a.state,initial);a.update(100);b.update(.1);assert.deepEqual(a.state,b.state);
 for(const invalid of [[],[supports()[0]],[supports()[0],supports()[0]],[...supports(),{position:{x:100,y:1,z:0},heading:0}]])assert.throws(()=>createMantisStudy(invalid),/Invalid mantis supports/);
 const bad=supports();bad[0].position.y=NaN;assert.throws(()=>createMantisStudy(bad),/Invalid mantis supports/);const extra=supports();extra[0].extra=true;assert.throws(()=>createMantisStudy(extra),/Invalid mantis supports/);
});
