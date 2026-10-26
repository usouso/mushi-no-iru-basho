/** Pure fixed-facet behaviour; game timing is not measured natural flight/escape. */
import test from 'node:test';import assert from 'node:assert/strict';
import {createMiyamaStudy,MIYAMA_MOTION as M} from '../src/miyama-study.js';
import {MIYAMA_DIMENSIONS as D,sampleMiyamaPose} from '../src/miyama-kinematics.js';
const support=()=>({position:{x:2,y:1,z:-3},orientation:{x:-Math.SQRT1_2,y:0,z:0,w:Math.SQRT1_2}}),gap=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z),step=(s,t,dt=1/120)=>{for(let i=0;i<Math.round(t/dt);i++)s.update(dt);};
function rotate(q,p){const x=2*(q.y*p.z-q.z*p.y),y=2*(q.z*p.x-q.x*p.z),z=2*(q.x*p.y-q.y*p.x);return{x:p.x+q.w*x+q.y*z-q.z*y,y:p.y+q.w*y+q.z*x-q.x*z,z:p.z+q.w*z+q.x*y-q.y*x};}
function world(s,p){const v=rotate(s.orientation,p);return{x:s.position.x+v.x,y:s.position.y+v.y,z:s.position.z+v.z};}

test('eight-centimetre climb/rest/descent keeps orientation, finite bounds, native bones and planted stance feet',()=>{
 const s=createMiyamaStudy(support()),origin=s.state.position,orientation=s.state.orientation;let before=s.state,old=sampleMiyamaPose(before),directions=new Set(),stops=0;
 for(let i=0;i<50*120;i++){s.update(1/120);const a=s.state,p=sampleMiyamaPose(a);if(a.walkSpeed)directions.add(Math.sign(a.walkSpeed));assert.ok(a.position.y>=origin.y-1e-12&&a.position.y<=origin.y+M.normalRange+1e-12);assert.deepEqual(a.orientation,orientation);assert.ok(gap(a.position,before.position)<=M.normalSpeed/120+1e-12);for(const n of[...Object.values(a.position),a.time,a.walkPhase,a.walkSpeed,a.jawOpen,a.warningBlend])assert.ok(Number.isFinite(n));assert.ok(p.legs.filter(l=>l.contact).length>=3);
  for(let j=0;j<6;j++){const l=p.legs[j];assert.ok(Math.abs(gap(l.hip,l.knee)-D.upperLegLength)<1e-12);assert.ok(Math.abs(gap(l.knee,l.foot)-D.lowerLegLength)<1e-12);if(l.contact&&old.legs[j].contact)assert.ok(gap(world(before,old.legs[j].foot),world(a,l.foot))<1e-10);}
  if(a.phase==='resting'){assert.equal(p.legs.filter(l=>l.contact).length,6);assert.ok(Math.abs(Math.sin(a.walkPhase))<1e-10);}if(before.phase==='walking'&&a.phase==='resting')stops++;before=a;old=p;
 }assert.deepEqual([...directions].sort(),[-1,1]);assert.ok(stops>=4);
});

test('warning is visible before short supported ascent; repeated threats, eye height and capture/release never reset the pose',()=>{
 const a=createMiyamaStudy(support()),b=createMiyamaStudy(support()),low={x:1,y:-100,z:-2},high={x:1,y:100,z:-2};assert.equal(a.disturb(low),true);assert.equal(b.disturb(high),true);const origin=a.state.position;step(a,M.warningSeconds-1/120);step(b,M.warningSeconds-1/120);assert.equal(a.state.phase,'warning');assert.deepEqual(a.state.position,origin);assert.ok(a.state.jawOpen>D.restJawOpen);assert.deepEqual(a.state,b.state);
 const seen=new Set();for(let n=0;n<6*120;n++){const before=a.state;a.disturb(low);b.disturb(high);a.update(1/120);b.update(1/120);assert.deepEqual(a.state,b.state);assert.ok(gap(a.state.position,before.position)<=M.retreatSpeed/120+1e-12);const state=a.state;seen.add(state.phase);if(['warning','retreating','settling','cornered'].includes(state.phase)&&!seen.has('caught-'+state.phase)){seen.add('caught-'+state.phase);assert.equal(a.capture(),true);const frozen=a.state;step(a,.4);assert.deepEqual(a.state,frozen);assert.equal(a.release(),true);assert.deepEqual(a.state.position,state.position);assert.deepEqual(a.state.orientation,state.orientation);assert.equal(a.state.walkPhase,state.walkPhase);assert.equal(a.state.jawOpen,state.jawOpen);}}
 assert.ok(seen.has('retreating'));assert.ok(seen.has('cornered'));assert.ok(Math.abs(a.state.position.y-origin.y-M.normalRange)<1e-10);assert.equal(a.capture(),true,'finite end is not invulnerable');assert.equal(a.release(),true);let returned=false;for(let n=0;n<15*120;n++){a.update(1/120);if(a.state.position.y<origin.y+M.normalRange-.01)returned=true;}assert.ok(returned,'no permanent refuge after threat leaves');
});

test('strict support input, detached snapshots, clamped time and deterministic reset preserve the original field contract',()=>{
 for(const bad of[{},null,{position:{x:0,y:1,z:2},orientation:{x:0,y:0,z:0,w:2}},{...support(),position:{x:0,y:NaN,z:0}},{...support(),orientation:{...support().orientation,extra:0}}])assert.throws(()=>createMiyamaStudy(bad),TypeError);
 let calls=0;assert.throws(()=>createMiyamaStudy({...support(),position:{get x(){calls++;return 0;},y:0,z:0}}),TypeError);assert.equal(calls,0);
 const a=createMiyamaStudy(support()),b=createMiyamaStudy(support()),initial=a.state;a.state.position.y=100;a.state.orientation.x=100;assert.deepEqual(a.state,initial);for(const t of[0,-1,NaN,Infinity])a.update(t);assert.deepEqual(a.state,initial);assert.equal(a.disturb({x:NaN,z:0}),false);assert.equal(a.disturb(null),false);a.update(100);b.update(.1);assert.deepEqual(a.state,b.state);a.reset();assert.deepEqual(a.state,initial);a.disturb({x:0,z:0});b.reset();b.disturb({x:0,z:0});step(a,3,1/60);step(b,3,1/120);assert.ok(gap(a.state.position,b.state.position)<1e-10);assert.ok(Math.abs(a.state.time-b.state.time)<1e-10);
});
