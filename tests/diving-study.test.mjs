/** Numeric shallow-water continuity only; no rendered visibility or ecology claim. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createDivingStudy} from '../src/diving-study.js';
import {DIVING_DIMENSIONS as D,sampleDivingPose} from '../src/diving-kinematics.js';
const close=(a,b,e=1e-10)=>assert.ok(Math.abs(a-b)<=e,`${a} != ${b}`),positionDelta=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const advance=(s,seconds)=>{for(let n=0;n<Math.round(seconds*120);n++)s.update(1/120);};
const frozen=s=>{const{caught,speed,...pose}=s;return pose;};

test('surface tail meets the water from the shared model reference, while the body stays below it',()=>{
 const s=createDivingStudy({center:{x:2,z:-3},waterY:.4}),state=s.state,tail=D.tailBreathingPoint;
 close(state.position.y-Math.sin(state.pitch)*tail.z+Math.cos(state.pitch)*tail.y,.4);assert.ok(state.position.y<.4);assert.equal(state.phase,'surface');assert.equal(state.strokePhase,0);assert.equal(D.bodyLength,.14);const start=state.position;advance(s,3.9);assert.deepEqual(s.state.position,start);assert.equal(s.state.strokePhase,0);
 const pose=sampleDivingPose(state);assert.deepEqual(pose.body.position,state.position);assert.equal(pose.legs.length,6);
 const beforeDive=sampleDivingPose(s.state);assert.equal(s.dive(),true);assert.deepEqual(sampleDivingPose(s.state),beforeDive);assert.equal(s.state.phase,'diving');assert.equal(s.dive(),false);
});

test('continuous repeated surface/dive/swim/rise stays in its shallow ellipse with finite heading and synchronized strokes',()=>{
 const s=createDivingStudy(),phases=new Set();let before=s.state,surfaces=0;
 for(let n=0;n<36*120;n++){
  s.update(1/120);const a=s.state;phases.add(a.phase);
  for(const value of [...Object.values(a.position),a.heading,a.pitch,a.strokePhase,a.speed,a.time])assert.ok(Number.isFinite(value));
  assert.ok((a.position.x/.30)**2+(a.position.z/.15)**2<=1+1e-12);assert.ok(a.position.y>=D.deepRootY-1e-12&&a.position.y<=-.02);assert.ok(a.strokePhase>=0&&a.strokePhase<1);assert.ok(positionDelta(a.position,before.position)<.005);assert.ok(Math.abs(a.heading-before.heading)<.05);assert.ok(Math.abs(a.pitch-before.pitch)<.02);
  if(a.phase==='swimming'){close(a.position.y,D.deepRootY);assert.equal(a.pitch,0);}
  if(a.phase==='surface'){assert.equal(a.strokePhase,0);if(before.phase==='rising')surfaces++;}
  const pose=sampleDivingPose(a),hind=pose.legs.filter(l=>l.role==='hind');assert.equal(hind.length,2);close(hind[0].foot.x,-hind[1].foot.x);close(hind[0].foot.y,hind[1].foot.y);close(hind[0].foot.z,hind[1].foot.z);
  before=a;
 }
 assert.deepEqual(phases,new Set(['surface','diving','swimming','rising']));assert.ok(surfaces>=2);
});

test('capture at every phase freezes position, rotation and stroke; release retains pose and ramps motion without a snap',()=>{
 for(const at of [2.3,5.13,8.21,11.17]){
  const s=createDivingStudy();advance(s,at);const before=s.state;assert.equal(s.capture(),true);assert.equal(s.capture(),false);assert.equal(s.dive(),false);advance(s,2);assert.deepEqual(frozen(s.state),frozen(before));assert.equal(s.state.caught,true);assert.equal(s.state.speed,0);
  assert.equal(s.release(),true);assert.equal(s.release(),false);assert.deepEqual(frozen(s.state),frozen(before));s.update(1/120);assert.ok(positionDelta(s.state.position,before.position)<.00001);assert.ok(Math.abs(s.state.heading-before.heading)<.0001);assert.ok(Math.abs(s.state.pitch-before.pitch)<.0001);assert.ok(Math.abs(s.state.strokePhase-before.strokePhase)<.0001);
  advance(s,.7);assert.ok(s.state.time>before.time+.3);assert.equal(s.state.caught,false);
 }
});

test('dt zero/invalid and reset are deterministic, snapshots are detached, and large steps are bounded',()=>{
 const s=createDivingStudy(),initial=s.state;for(const dt of [0,-1,NaN,Infinity])s.update(dt);assert.deepEqual(s.state,initial);const leaked=s.state;leaked.position.y=99;assert.deepEqual(s.state,initial);
 const t=createDivingStudy();s.update(100);t.update(.1);assert.deepEqual(s.state,t.state);advance(s,7);s.capture();s.reset();assert.deepEqual(s.state,initial);
 const a=createDivingStudy(),b=createDivingStudy();for(let n=0;n<100;n++){a.update(.1);b.update(.1);assert.deepEqual(a.state,b.state);}
});
