/** Original atlas movement lab: CPU support/continuity, not measured animal behaviour. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createAtlasStudy,ATLAS_MOTION} from '../src/atlas-study.js';
import {ATLAS_DIMENSIONS as D,sampleAtlasPose} from '../src/atlas-kinematics.js';
const dt=1/120,TAU=Math.PI*2;
const support=()=>({position:{x:2,y:1.1+D.rootAboveSupport,z:-3},heading:.7});
const gap=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const world=(body,p)=>({x:body.position.x+Math.cos(body.heading)*p.x+Math.sin(body.heading)*p.z,y:body.position.y+p.y,z:body.position.z-Math.sin(body.heading)*p.x+Math.cos(body.heading)*p.z});
const step=(s,seconds)=>{for(let n=0;n<Math.round(seconds/dt);n++)s.update(dt);};
function until(s,predicate,seconds=30){for(let n=0;n<seconds/dt;n++){s.update(dt);if(predicate(s.state))return;}assert.fail(`atlas state not reached within ${seconds}s: ${s.state.phase}`);}
const along=(state,origin)=>((state.position.x-origin.x)*Math.sin(state.heading)+(state.position.z-origin.z)*Math.cos(state.heading));

test('ordinary signed gait stays on the finite connected plane, with both forward and backward contact phases',()=>{
 const s=createAtlasStudy(support()),initial=s.state,origin=initial.position;let before=initial,oldPose=sampleAtlasPose(initial);const directions=new Set();
 for(let n=0;n<40/dt;n++){
  s.update(dt);const a=s.state,p=sampleAtlasPose(a),travel=along(a,origin);
  assert.ok(travel>=-1e-8&&travel<=.12+1e-8);assert.equal(a.position.y,origin.y);assert.equal(a.heading,initial.heading);assert.ok(gap(a.position,before.position)<=.04*dt+1e-8);
  assert.ok([...Object.values(a.position),a.walkPhase,a.walkSpeed,a.time,a.headLift,a.warningBlend].every(Number.isFinite));if(a.walkSpeed)directions.add(Math.sign(a.walkSpeed));
  assert.ok(p.legs.filter(l=>l.contact).length>=3);
  for(let i=0;i<6;i++)if(oldPose.legs[i].contact&&p.legs[i].contact)assert.ok(gap(world(oldPose.body,oldPose.legs[i].foot),world(p.body,p.legs[i].foot))<1e-8,'stance skin anchor cannot slide');
  if(a.phase==='resting')assert.equal(p.legs.filter(l=>l.contact).length,6);
  before=a;oldPose=p;
 }
 assert.deepEqual(directions,new Set([1,-1]));assert.equal(s.state.caught,false);
});

test('warning is grounded and ramped before a visible backward retreat; no snapshot or phase jump at transitions',()=>{
 for(const endTime of [5.6999,6.1999,6.6999]){
  const edge=createAtlasStudy();let left=endTime;while(left>1e-14){const part=Math.min(left,dt);edge.update(part);left-=part;}const before=edge.state;edge.disturb();
  for(let n=0;n<8;n++){const previous=edge.state;edge.update(dt);assert.ok(Math.abs(edge.state.headLift-previous.headLift)<.08,'micrometres before half-stride must not compress the head preparation into one frame');}
  assert.ok(gap(edge.state.position,before.position)<.001);
 }
 for(const start of ['rest','mid-stride']){
  const s=createAtlasStudy(support()),origin=s.state.position;
  if(start==='mid-stride'){until(s,a=>a.phase==='walking');step(s,.113);}
  const before=s.state;assert.equal(s.disturb(),true);assert.equal(s.disturb(),false);assert.deepEqual(s.state.position,before.position);assert.equal(s.state.walkPhase,before.walkPhase);assert.equal(s.state.headLift,before.headLift,'warning entry preserves the current head pose');
  let old=s.state,warningStart=null,retreatStart=null,maxLift=0,finished=false,backwardDistance=0;
  for(let n=0;n<18/dt;n++){
   s.update(dt);const a=s.state;maxLift=Math.max(maxLift,a.headLift);assert.ok(gap(a.position,old.position)<=.18*dt+1e-8);assert.ok(Math.abs(a.headLift-old.headLift)<.08,'head preparation does not pop between phases');assert.ok(Math.abs(a.walkPhase-old.walkPhase)<=.18*dt/D.cycleDistance*TAU+1e-7);
   assert.ok(along(a,origin)>=-.7-1e-8&&along(a,origin)<=.12+1e-8);assert.equal(a.position.y,origin.y);
   if(a.phase==='warning'){warningStart??=a.time;assert.equal(sampleAtlasPose(a).legs.filter(l=>l.contact).length,6);}
   if(a.phase==='retreating'){retreatStart??=a.time;assert.ok(a.walkSpeed<=0);backwardDistance=Math.min(backwardDistance,along(a,origin));}
   if(retreatStart!==null&&a.phase==='resting'){finished=true;break;}
   old=a;
  }
  assert.ok(warningStart!==null&&retreatStart!==null);assert.ok(retreatStart-warningStart>=.25-dt-1e-8);assert.ok(maxLift>.05);assert.ok(backwardDistance<-.5,'retreat is not the old 12cm shuffle');assert.ok(finished);assert.equal(sampleAtlasPose(s.state).legs.filter(l=>l.contact).length,6);
 }
});

test('capture freezes every state clock and pose; release starts at the actual supported pose in all movement phases',()=>{
 for(const phase of ['resting','walking','warning','retreating','settling']){
  const s=createAtlasStudy(support());
  if(phase==='walking')until(s,a=>a.phase==='walking'&&a.walkSpeed>0);
  else if(phase!=='resting'){s.disturb();until(s,a=>a.phase===phase);}
  const before=s.state,pose=sampleAtlasPose(before);assert.equal(s.capture(),true);assert.equal(s.capture(),false);const held=s.state;assert.equal(s.disturb(),false);step(s,5);assert.deepEqual(s.state,held);assert.deepEqual(sampleAtlasPose(s.state),pose);
  assert.equal(s.release(),true);assert.equal(s.release(),false);assert.deepEqual(s.state.position,before.position);assert.equal(s.state.walkPhase,before.walkPhase);assert.deepEqual(sampleAtlasPose(s.state),pose);
  s.update(dt);assert.ok(gap(s.state.position,before.position)<=.18*dt+1e-8);assert.ok(Math.abs(s.state.headLift-before.headLift)<.08);
 }
});

test('repeated disturbances at either bound settle without leaving the connected retreat interval or losing capture/release',()=>{
 const s=createAtlasStudy(support()),origin=s.state.position;let captures=0,resting=0;
 for(let n=0;n<90/dt;n++){
  if(n%240===0)s.disturb();s.update(dt);const a=s.state;
  assert.ok(along(a,origin)>=-.7-1e-8&&along(a,origin)<=.12+1e-8);assert.equal(a.position.y,origin.y);assert.ok([a.walkPhase,a.headLift,a.warningBlend].every(Number.isFinite));
  if(a.phase==='resting')resting++;
  if(n%1200===600){const p=sampleAtlasPose(a);assert.equal(s.capture(),true);step(s,.5);assert.equal(s.release(),true);assert.deepEqual(sampleAtlasPose(s.state),p);captures++;}
 }
 assert.ok(captures>=8);assert.ok(resting>0,'bounded endpoint cannot remain in an infinite reaction phase');
});

test('support and snapshots are copied, invalid/zero dt is inert, clamped steps and reset are deterministic',()=>{
 const input=support(),s=createAtlasStudy(input),initial=s.state;input.position.x=500;const snapshot=s.state;snapshot.position.z=500;assert.deepEqual(s.state,initial);
 for(const value of [0,-1,NaN,Infinity])s.update(value);assert.deepEqual(s.state,initial);
 const a=createAtlasStudy(support()),b=createAtlasStudy(support());a.update(100);b.update(ATLAS_MOTION.maxStepSeconds);assert.ok(ATLAS_MOTION.maxStepSeconds<=.25);assert.deepEqual(a.state,b.state);
 s.disturb();step(s,4);s.capture();s.reset();assert.deepEqual(s.state,initial);
 for(const bad of [{position:{x:0,y:NaN,z:0}},{position:{x:0,y:0,z:0},heading:Infinity},{position:Object.create({x:0,y:0,z:0})}])assert.throws(()=>createAtlasStudy(bad),/Invalid atlas support/);
});


test('supported individual scale and motion seed remain deterministic, including reset and dt subdivision',()=>{
 for(const scale of [1,1.15])for(const motionSeed of [0,0xffffffff]){
  const a=createAtlasStudy({scale,motionSeed}),b=createAtlasStudy({scale,motionSeed});assert.equal(a.state.position.y,D.rootAboveSupport*scale);assert.equal(a.state.scale,scale);
  for(let i=0;i<150;i++){a.update(.1);for(let j=0;j<10;j++)b.update(.01);}
  assert.equal(a.state.phase,b.state.phase);assert.ok(gap(a.state.position,b.state.position)<1e-9);assert.ok(Math.abs(a.state.walkPhase-b.state.walkPhase)<1e-8);
  a.reset();b.reset();a.disturb();b.disturb();step(a,5);step(b,5);assert.deepEqual(a.state,b.state);assert.ok(a.state.distance>=-.70*scale-1e-9);assert.ok(a.state.distance<-.5*scale);
 }
 for(const bad of [{scale:.99},{scale:1.16},{scale:NaN},{motionSeed:-1},{motionSeed:1.5},{motionSeed:0x100000000}])assert.throws(()=>createAtlasStudy(bad),{name:'TypeError',message:/Invalid atlas/});
});
