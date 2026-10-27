/** Pure numeric checks only: native skin/contact, real water/ground and visibility
 * are separate model/foundation/integration checks, not asserted by this suite. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createGiantWaterbugStudy} from '../src/giant-waterbug-study.js';
import {GIANT_WATERBUG_DIMENSIONS as D} from '../src/giant-waterbug-kinematics.js';
const close=(a,b,e=1e-10)=>assert.ok(Math.abs(a-b)<=e,`${a} != ${b}`);
const gap=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const advance=(s,seconds,hz=120)=>{let left=seconds;while(left>1e-12){const dt=Math.min(1/hz,left);s.update(dt);left-=dt;}};
const physical=s=>({position:s.position,orientation:s.orientation,heading:s.heading,pitch:s.pitch,grip:s.grip,stroke:s.stroke,strokeStrength:s.strokeStrength,forelegFold:s.forelegFold});
const until=(s,phase)=>{for(let n=0;n<3000;n++){if(s.state.phase===phase)return;s.update(1/120);}assert.fail(`Missing ${phase}`);};

test('actual D tail breathes and four support tips retain their fixed native axis; quiet approach does not disturb; warning folds before release',()=>{
 const s=createGiantWaterbugStudy({waterY:-.29}),rest=s.state;
 close(rest.position.y-Math.sin(rest.pitch)*D.tailBreathingPoint.z+Math.cos(rest.pitch)*D.tailBreathingPoint.y,-.29);
 assert.equal(D.supportContacts.length,4);
 for(const contact of D.supportContacts){close(Math.hypot(contact.position.x-D.supportAxis.origin.x,contact.position.y-D.supportAxis.origin.y),D.supportRadius);}
 advance(s,2);assert.deepEqual(physical(s.state),physical(rest));assert.equal(s.disturb('quiet'),false);assert.equal(s.state.phase,'resting');
 assert.equal(s.disturb('fast-approach'),true);assert.deepEqual(physical(s.state),physical(rest));advance(s,.35);
 assert.equal(s.state.phase,'warning');close(s.state.forelegFold,.5);assert.equal(s.state.grip,1);assert.deepEqual(s.state.position,rest.position);assert.deepEqual(s.state.orientation,rest.orientation);
 advance(s,.35);assert.equal(s.state.phase,'releasing');close(s.state.forelegFold,1);close(s.state.grip,1);advance(s,.275);close(s.state.grip,.5);assert.deepEqual(s.state.position,rest.position);assert.deepEqual(s.state.orientation,rest.orientation);
 advance(s,.275);assert.equal(s.state.phase,'diving');close(s.state.grip,0);assert.deepEqual(s.state.position,rest.position);
});

test('all phases stay finite and bounded, with root/angle/pose continuity at 30/60/120 Hz and exact segment boundaries',()=>{
 const ends=[];
 for(const hz of [30,60,120]){
  const s=createGiantWaterbugStudy(),home=s.state.position,phases=new Set();s.disturb();let before=s.state;
  for(let n=0;n<8*hz;n++){
   s.update(1/hz);const a=s.state;phases.add(a.phase);
   for(const v of [...Object.values(a.position),...Object.values(a.orientation),a.grip,a.stroke,a.strokeStrength,a.forelegFold,a.time])assert.ok(Number.isFinite(v));
   assert.ok(a.position.x>=-1e-12&&a.position.x<=.16+1e-12);assert.ok(a.position.z<=1e-12&&a.position.z>=-.20-1e-12);assert.ok(a.position.y<=home.y+1e-12&&a.position.y>=home.y-.04-1e-12);
   assert.ok(gap(a.position,before.position)<.012);assert.ok(Math.abs(a.heading-before.heading)<.14);assert.ok(Math.abs(a.pitch-before.pitch)<.028);assert.ok(a.stroke>=before.stroke-1e-12);assert.ok(a.stroke-before.stroke<TAU/hz*1.401);
   for(const k of ['grip','forelegFold','strokeStrength']){assert.ok(a[k]>=0&&a[k]<=1);assert.ok(Math.abs(a[k]-before[k])<.13);}
   if(a.grip>0){assert.deepEqual(a.position,home);close(a.heading,0);close(a.pitch,.95);}
   before=a;
  }
  assert.deepEqual(phases,new Set(['warning','releasing','diving','swimming','turning','returning','gripping','settling','resting']));
  assert.deepEqual(s.state.position,home);close(s.state.heading,0);assert.equal(s.state.grip,1);ends.push(s.state);
 }
 for(const state of ends.slice(1)){close(state.time,ends[0].time);close(state.stroke,ends[0].stroke);close(state.phaseTime,ends[0].phaseTime);}
 for(const [time,phase] of [[.7,'releasing'],[1.25,'diving'],[2.45,'swimming'],[3.65,'turning'],[4.85,'returning'],[6.85,'gripping'],[7.5,'settling'],[7.9,'resting']]){
  const s=createGiantWaterbugStudy();s.disturb();advance(s,time);assert.equal(s.state.phase,phase);close(s.state.phaseTime,0,1e-9);
 }
});
const TAU=2*Math.PI;

test('busy disturbances cannot reset a route; seeded ambient waits give bounded repeated loops',()=>{
 const a=createGiantWaterbugStudy({seed:219}),b=createGiantWaterbugStudy({seed:219}),c=createGiantWaterbugStudy({seed:72});
 assert.notEqual(a.state.restWait,c.state.restWait);const waits=new Set(),phases=new Set();
 for(let n=0;n<80*60;n++){
  a.update(1/60);b.update(1/60);const before=a.state;phases.add(before.phase);if(before.phase!=='resting'){assert.equal(a.disturb('net-miss'),false);assert.deepEqual(a.state,before);}
  else{assert.ok(before.restWait>=9&&before.restWait<=15);waits.add(before.restWait);}
  assert.deepEqual(a.state,b.state);
 }
 assert.ok(waits.size>=4);assert.ok(phases.has('returning'));
});

test('capture freezes every phase and every clock; release retains first pose and smoothly resumes; resting release departs',()=>{
 for(const phase of ['resting','warning','releasing','diving','swimming','turning','returning','gripping','settling']){
  const s=createGiantWaterbugStudy();if(phase!=='resting'){s.disturb();until(s,phase);}advance(s,.13);assert.equal(s.state.phase,phase);
  const before=s.state;assert.equal(s.capture(),true);assert.equal(s.capture(),false);const held=s.state;advance(s,3);assert.deepEqual(s.state,held);assert.equal(s.disturb(),false);
  assert.equal(s.release(),true);assert.equal(s.release(),false);assert.deepEqual(physical(s.state),physical(before));assert.equal(s.state.phase,phase==='resting'?'warning':phase);
  s.update(1/120);assert.ok(gap(s.state.position,before.position)<.000001);assert.ok(Math.abs(s.state.heading-before.heading)<.00001);assert.ok(Math.abs(s.state.stroke-before.stroke)<.00003);
  advance(s,.8);assert.ok(s.state.time>before.time+.5);assert.equal(s.state.captured,false);
  s.capture();s.reset();assert.deepEqual(s.state,createGiantWaterbugStudy().state);
 }
});

test('malformed support, retreat and seed inputs reject; invalid dt is inert, large dt clamps and snapshots do not alias inputs',()=>{
 for(const options of [null,[],{waterY:NaN},{waterY:Infinity},{orientation:{pitch:0,yaw:0,roll:0}},{orientation:{pitch:.95,yaw:0,roll:.1}},{orientation:{pitch:.95,yaw:NaN,roll:0}},{position:{x:0,y:0,z:0}},{position:{x:NaN,y:-.11910861437338695,z:0}},{envelope:{retreat:{x:0,y:-.04,z:0}}},{envelope:{retreat:{x:1,y:-.04,z:0}}},{envelope:{retreat:{x:0,y:.01,z:-.2}}},{envelope:{retreat:{x:0,y:-.1,z:-.2}}},{envelope:[]},{seed:0},{seed:1.2},{seed:Infinity}])assert.throws(()=>createGiantWaterbugStudy(options),/Invalid giant waterbug/);
 const orientation={pitch:.95,yaw:.2,roll:0},retreat={x:.16,y:-.04,z:-.2},s=createGiantWaterbugStudy({orientation,envelope:{retreat}}),initial=s.state;
 orientation.pitch=1;retreat.x=9;s.state.position.x=99;s.state.orientation.pitch=99;assert.deepEqual(s.state,initial);
 for(const dt of [0,-1,NaN,Infinity,undefined])s.update(dt);assert.deepEqual(s.state,initial);
 const a=createGiantWaterbugStudy(),b=createGiantWaterbugStudy();a.disturb();b.disturb();a.update(100);b.update(.1);assert.deepEqual(a.state,b.state);
});
