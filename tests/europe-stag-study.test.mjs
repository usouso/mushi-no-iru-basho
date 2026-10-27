/** Pure supported poses and native geometry math. No browser/GPU or measured
 * biological timing; approach eligibility remains the production field caller. */
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createHash} from 'node:crypto';
import {createEuropeStagStudy as create,EUROPE_STAG_MOTION as M} from '../src/europe-stag-study.js';
import {sampleEuropeStagPose as sample,EUROPE_STAG_DIMENSIONS as D} from '../src/europe-stag-kinematics.js';
const cfg=(yaw=0)=>({position:{x:0,y:.535,z:.08},orientation:{x:0,y:Math.sin(yaw/2),z:0,w:Math.cos(yaw/2)},retreatBounds:{min:-.34,max:.34},motionSeed:1729});
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z),rot=(p,q)=>{const tx=2*(q.y*p.z-q.z*p.y),ty=2*(q.z*p.x-q.x*p.z),tz=2*(q.x*p.y-q.y*p.x);return{x:p.x+q.w*tx+q.y*tz-q.z*ty,y:p.y+q.w*ty+q.z*tx-q.x*tz,z:p.z+q.w*tz+q.x*ty-q.y*tx};};
const axis=q=>rot({x:0,y:0,z:1},q),world=(p,s)=>{const r=rot(p,s.orientation);return{x:r.x+s.position.x,y:r.y+s.position.y,z:r.z+s.position.z};},feet=s=>sample(s).legs.map(l=>({point:world(l.foot,s),contact:l.contact}));
function eye(s,sign){const a=axis(s.orientation);return{x:s.position.x+a.x*sign*2,z:s.position.z+a.z*sign*2};}
function advance(s,seconds){let left=seconds;while(left>1e-12){const dt=Math.min(left,1/120);s.update(dt);left-=dt;}}
function until(s,predicate,limit=20){let elapsed=0;while(!predicate(s.state)&&elapsed<limit){s.update(1/120);elapsed+=1/120;}assert.ok(predicate(s.state),'bounded phase reached');return elapsed;}
const pose=s=>sample(s);

test('strict finite horizontal support, detached state/reset and unchanged shared branch core',()=>{
 assert.equal(createHash('sha256').update(fs.readFileSync(new URL('../src/branch-retreat-study.js',import.meta.url))).digest('hex'),'c193f8de36e93a2af5b89c1bbe6d6d263b99258ce14a859c91f20b0d223516a7');
 for(const change of[{position:{x:NaN,y:1,z:0}},{position:{x:0,y:1,z:Infinity}},{orientation:{x:0,y:0,z:0,w:2}},{orientation:{x:.1,y:0,z:0,w:Math.sqrt(.99)}},{motionSeed:-1},{motionSeed:2**32},{retreatBounds:{min:1,max:2}},{retreatBounds:{min:-.001,max:.001}}])assert.throws(()=>create({...cfg(),...change}),TypeError);
 let reads=0;assert.throws(()=>create({...cfg(),position:{get x(){reads++;return 0;},y:1,z:0}}),TypeError);assert.equal(reads,0);const input=cfg(Math.PI/2),s=create(input),initial=s.state;input.position.x=99;input.orientation.w=0;input.retreatBounds.min=-2;const out=s.state;out.position.x=22;out.orientation.w=0;assert.deepEqual(s.state,initial);assert.equal(s.disturb({get x(){reads++;return 0;},z:0}),false);assert.equal(reads,0);s.update(NaN);s.update(-1);assert.deepEqual(s.state,initial);advance(s,1);s.reset();assert.deepEqual(s.state,initial);
 assert.equal(D.cycleDistance,.04);assert.equal(D.rootAboveSupport,.055);assert.equal(M.warningSeconds,.22);assert.equal(M.retreatDistance,.18);assert.equal(M.retreatSpeed,.14);assert.equal(s.state.id,'europestag-study-1');assert.equal('heading'in s.state,false);assert.equal('pitch'in s.state,false);
});

test('identity/yaw signed native gait keeps stance feet fixed, six stopped feet and constant bone lengths',t=>{
 let samples=0,maxSlip=0,maxBone=0,minPlane=Infinity;const phases=new Set();
 for(const yaw of[0,Math.PI/2]){const input=cfg(yaw),s=create(input),a=axis(input.orientation);let prev=null;for(let n=0;n<18*120;n++){
  if(n===8*120)s.disturb(eye(s.state,1));if(n===13*120)s.disturb(eye(s.state,-1));s.update(1/120);const state=s.state,p=sample(state),f=feet(state);phases.add(state.phase);const along=(state.position.x-input.position.x)*a.x+(state.position.z-input.position.z)*a.z;assert.ok(along>=-.34-1e-10&&along<=.34+1e-10);assert.deepEqual(state.orientation,input.orientation);assert.equal(state.position.y,input.position.y);
  if(prev)for(let i=0;i<6;i++)if(prev[i].contact&&f[i].contact){const d=distance(prev[i].point,f[i].point);maxSlip=Math.max(maxSlip,d);assert.ok(d<2e-10,'native stance foot does not slide in either signed direction');}prev=f;
  for(let i=0;i<6;i++){const l=p.legs[i];for(const[a,b,L]of[[l.hip,l.knee,D.upperLegLength],[l.knee,l.foot,D.lowerLegLength]]){const e=Math.abs(distance(a,b)-L);maxBone=Math.max(maxBone,e);assert.ok(e<1e-12);}const gap=f[i].point.y-(input.position.y-D.rootAboveSupport);minPlane=Math.min(minPlane,gap);assert.ok(gap>=-2e-12);if(l.contact)assert.ok(Math.abs(gap)<2e-12);}
  if(['resting','warning','settling','cornered'].includes(state.phase)){assert.equal(f.filter(l=>l.contact).length,6);assert.equal(state.walkSpeed,0);assert.ok(Math.abs(state.walkPhase/Math.PI-Math.round(state.walkPhase/Math.PI))<1e-9);}samples++;
 }}for(const phase of['resting','walking','warning','retreating','settling'])assert.ok(phases.has(phase),phase);t.diagnostic(JSON.stringify({samples,maxSlip,maxBone,minPlane,gameCycleHzAtRetreat:M.retreatSpeed/D.cycleDistance}));
});

test('caller-filtered approach/miss uses one finite away response; either lane end stays capturable and busy calls cannot restart motion',()=>{
 // No automatic awareness in this support module: a quiet/no-stimulus interval
 // remains ordinary motion. Valid fast/near/failed-net inputs all use disturb;
 // their range/dot/LOS and quiet threshold must be tested by field integration.
 const quiet=create(cfg());advance(quiet,1);assert.equal(quiet.state.phase,'resting');assert.equal(quiet.state.jawOpen,D.restJawOpen);
 for(const yaw of[0,Math.PI/2])for(const sign of[-1,1]){
  const input=cfg(yaw),s=create(input),control=create(input),initial=s.state;assert.equal(s.disturb(eye(initial,sign)),true);assert.equal(control.disturb(eye(initial,sign)),true);advance(s,.11);advance(control,.11);assert.equal(s.state.phase,'warning');assert.deepEqual(s.state.position,initial.position);assert.ok(s.state.jawOpen>D.restJawOpen&&s.state.jawOpen<.65);assert.equal(s.state.walkSpeed,0);
  // Busy stimuli refresh pressure but may not reset this warning/retreat path.
  for(let n=0;n<100;n++){assert.equal(s.disturb(eye(s.state,sign)),false);s.update(1/120);control.update(1/120);assert.deepEqual(pose(s.state),pose(control.state));}
  for(let n=0;n<8*120;n++){s.disturb(eye(s.state,sign));s.update(1/120);}assert.equal(s.state.phase,'cornered');const a=axis(input.orientation),d=(s.state.position.x-initial.position.x)*a.x+(s.state.position.z-initial.position.z)*a.z;assert.ok(sign*d<-.30);assert.ok(Math.abs(d)<=.34+1e-10);assert.equal(feet(s.state).filter(f=>f.contact).length,6);
  const stopped=pose(s.state);assert.equal(s.capture(),true);assert.equal(s.capture(),false);advance(s,.5);assert.deepEqual(pose(s.state),stopped);assert.equal(s.disturb(eye(s.state,-sign)),false);assert.equal(s.release(),true);assert.deepEqual(pose(s.state),stopped);assert.equal(s.release(),false);s.update(.01);assert.deepEqual(s.state.position,stopped.body.position);
 }
});

test('capture/release retains every native pose phase; first slow-step stimulus stops on a half-cycle within .6 seconds',t=>{
 for(const phase of['resting','walking','warning','retreating','settling']){const s=create(cfg(Math.PI/2));if(phase==='walking'){until(s,x=>x.phase==='walking');advance(s,.1);}else if(phase!=='resting'){s.disturb(eye(s.state,1));until(s,x=>x.phase===phase);advance(s,.05);}assert.equal(s.state.phase,phase);const before=pose(s.state);assert.equal(s.capture(),true);advance(s,.5);assert.deepEqual(pose(s.state),before);assert.equal(s.release(),true);assert.deepEqual(pose(s.state),before);s.update(.00001);const after=pose(s.state);assert.ok(distance(before.body.position,after.body.position)<1e-5);}
 const s=create(cfg());until(s,x=>x.phase==='walking');s.update(.001);assert.ok(s.state.walkSpeed>0&&s.state.walkSpeed<.002);const initial=feet(s.state);assert.equal(s.disturb(eye(s.state,1)),true);let elapsed=0,previous=initial;while(s.state.phase!=='warning'&&elapsed<.61){s.update(.001);elapsed+=.001;const f=feet(s.state);for(let i=0;i<6;i++)if(previous[i].contact&&f[i].contact)assert.ok(distance(previous[i].point,f[i].point)<1e-10);previous=f;}assert.equal(s.state.phase,'warning');assert.ok(elapsed<=.601);assert.equal(feet(s.state).filter(f=>f.contact).length,6);assert.ok(Math.abs(s.state.walkPhase/Math.PI-Math.round(s.state.walkPhase/Math.PI))<1e-9);t.diagnostic(JSON.stringify({slowStepFinishSeconds:elapsed}));
});
