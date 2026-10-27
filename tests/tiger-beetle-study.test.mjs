/** Numeric authored flight sequence, not observed biology or a native triangle audit. */
import test from 'node:test';import assert from 'node:assert/strict';import {createTigerBeetleStudy as create,TIGER_BEETLE_TIMING as M}from '../src/tiger-beetle-study.js';import {TIGER_BEETLE_STOPS as STOPS}from '../src/tiger-beetle-layout.js';
const clone=structuredClone,make=(extra={})=>create({stops:STOPS,...extra}),close=(a,b,e=1e-9)=>assert.ok(Math.abs(a-b)<e,`${a} != ${b}`),advance=(s,n,dt=1/120)=>{for(let k=0;k<Math.round(n/dt);k++)s.update(dt);},physical=s=>({position:s.position,orientation:s.orientation,walkPhase:s.walkPhase,flightPose:s.flightPose}),PHASES=['resting','warning','opening','unfolding','takeoff','flying','landing','folding','closing'];

test('only owned finite three-stop data and uint32 seeds are accepted and copied',()=>{
 for(const value of[undefined,null,{}, {stops:[]},{stops:[...STOPS,...STOPS]},{stops:STOPS,motionSeed:-1},{stops:STOPS,motionSeed:4294967296},{stops:STOPS,motionSeed:.2},{stops:STOPS,extra:1}])assert.throws(()=>create(value),TypeError);
 for(const change of[s=>s[0].position.x=NaN,s=>s[0].position.y=10001,s=>s[1].position=clone(s[0].position),s=>s[2].position.x+=4,s=>s[1].position.y+=.3,s=>s[0].orientation.w=2,s=>s[0].orientation={x:1,y:0,z:0,w:0},s=>s[0].extra=1]){const stops=clone(STOPS);change(stops);assert.throws(()=>create({stops}));}
 let reads=0;for(const key of['position','orientation']){const stops=clone(STOPS);Object.defineProperty(stops[0],key,{get(){reads++;return STOPS[0][key];},enumerable:true});assert.throws(()=>create({stops}));}const options={};Object.defineProperty(options,'stops',{get(){reads++;return STOPS;},enumerable:true});assert.throws(()=>create(options));const sparse=new Array(3);assert.throws(()=>create({stops:sparse}));assert.equal(reads,0);
 const stops=clone(STOPS),a=create({stops,motionSeed:0xffffffff}),b=make({motionSeed:0xffffffff});stops[0].position.x=0;stops[1].orientation.y=0;const returned=a.state;returned.position.x=0;returned.orientation.w=0;returned.flightPose.unfold=9;advance(a,20);advance(b,20);assert.deepEqual(a.state,b.state);a.reset();b.reset();assert.deepEqual(a.state,b.state);
 for(const v of[null,{}, {x:NaN,z:0},{x:0,z:Infinity}])assert.equal(a.disturb(v),false);
});

test('nine phases preserve ordered wings, grounded root/quaternion and finite bounded adjacent arcs without teleport',()=>{
 const s=make(),seen=new Set(),stops=new Set(),routes=new Set();let previous=s.state,maxStep=0;
 for(let n=0;n<60*120;n++){s.update(1/120);const a=s.state,f=a.flightPose;seen.add(a.phase);if(a.phase==='resting')stops.add(a.stopIndex);else routes.add(`${a.stopIndex}->${a.targetIndex}`);assert.ok(Object.values(a.position).every(Number.isFinite));close(Math.hypot(...Object.values(a.orientation)),1);for(const k of['elytra','unfold','flapAmplitude','tuck'])assert.ok(f[k]>=0&&f[k]<=1);assert.equal(a.walkPhase,0);
  if(f.unfold>0)close(f.elytra,1);if(f.flapAmplitude>0||f.tuck>0){close(f.unfold,1);close(f.elytra,1);assert.ok(['takeoff','flying','landing'].includes(a.phase));}
  const on=['resting','warning','opening','unfolding'].includes(a.phase)?a.stopIndex:['folding','closing'].includes(a.phase)?a.targetIndex:null;if(on!==null){assert.deepEqual(a.position,STOPS[on].position);assert.deepEqual(a.orientation,STOPS[on].orientation);assert.equal(f.tuck,0);assert.equal(f.flapAmplitude,0);}
  const d=Math.hypot(...['x','y','z'].map(k=>a.position[k]-previous.position[k]));maxStep=Math.max(maxStep,d);assert.ok(d<.011);const dot=['x','y','z','w'].reduce((v,k)=>v+a.orientation[k]*previous.orientation[k],0);assert.ok(dot>.995,'continuous signed quaternion');previous=a;
 }
 assert.deepEqual([...seen].sort(),[...PHASES].sort());assert.deepEqual([...stops].sort(),[0,1,2]);assert.deepEqual([...routes].sort(),['0->1','1->0','1->2','2->1']);console.log('Tiger study max120Hz root step',maxStep);
});

test('dt clamps and seeded waits are deterministic at 30/60/120Hz and exact phase boundaries',()=>{
 const states=[];for(const dt of[1/30,1/60,1/120,.1]){const s=make({motionSeed:0});s.disturb({x:28,z:-10});advance(s,20,dt);states.push(s.state);}for(const s of states.slice(1)){assert.equal(s.phase,states[0].phase);close(s.time,states[0].time,1e-10);for(const k of['x','y','z'])close(s.position[k],states[0].position[k],1e-9);for(const k of['elytra','unfold','flapPhase','flapAmplitude','tuck'])close(s.flightPose[k],states[0].flightPose[k],1e-8);}
 const a=make(),b=make();for(const dt of[0,-1,NaN,Infinity,undefined])a.update(dt);assert.deepEqual(a.state,b.state);a.update(20);b.update(.1);assert.deepEqual(a.state,b.state);
 const c=make({motionSeed:0}),d=make({motionSeed:0xffffffff});advance(c,3.1);advance(d,3.1);assert.notEqual(c.state.phase,d.state.phase);
 const boundary=make();boundary.disturb();for(const phase of PHASES.slice(1)){assert.equal(boundary.state.phase,phase);const duration=M[phase];const steps=Math.floor(duration/.1);for(let k=0;k<steps;k++)boundary.update(.1);boundary.update(duration-steps*.1);}assert.equal(boundary.state.phase,'resting');assert.deepEqual(boundary.state.position,STOPS[1].position);
});

test('every phase catches with frozen clocks, resumes the same pose, rest release departs, reset replays seed',()=>{
 for(const phase of PHASES){const s=make();for(let n=0;n<1200&&s.state.phase!==phase;n++)s.update(1/120);assert.equal(s.state.phase,phase);if(phase!=='resting')s.update(.03);const before=s.state,shape=physical(before);assert.equal(s.capture(),true);assert.equal(s.capture(),false);assert.equal(s.disturb(),false);advance(s,3);assert.deepEqual(s.state,{...before,caught:true});assert.equal(s.release(),true);assert.equal(s.release(),false);assert.deepEqual(physical(s.state),shape);s.update(1/120);assert.ok(Math.hypot(...['x','y','z'].map(k=>s.state.position[k]-before.position[k]))<.011);if(phase==='resting')assert.equal(s.state.phase,'warning');s.reset();assert.deepEqual(s.state,make().state);}
 // Middle stop chooses the farther verified neighbour, not an unbounded extrapolation.
 for(const observer of[{x:28,z:-10},{x:34,z:-15}]){const s=make();s.disturb();while(s.state.phase!=='resting')s.update(.1);assert.equal(s.state.stopIndex,1);s.disturb(observer);assert.equal(s.state.targetIndex,observer.x<30?2:0);}
});
