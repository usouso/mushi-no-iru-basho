import test from 'node:test';
import assert from 'node:assert/strict';
import {createStagStudy} from '../src/stag-study.js';
import {STAG_DIMENSIONS as D,sampleStagPose} from '../src/stag-kinematics.js';
const support=()=>({position:{x:2,y:1.1,z:-3},heading:.7}),gap=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const world=(s,p)=>({x:s.position.x+Math.cos(s.heading)*p.x+Math.sin(s.heading)*p.z,y:s.position.y+p.y,z:s.position.z-Math.sin(s.heading)*p.x+Math.cos(s.heading)*p.z});
function step(s,t){for(let n=0;n<Math.round(t*120);n++)s.update(1/120);}
function until(s,check,max=30){for(let n=0;n<max*120;n++){s.update(1/120);if(check(s.state))return;}assert.fail('expected stag state');}

test('finite horizontal forward/rest/back/rest repeats without position, phase or heading reset',()=>{
 const s=createStagStudy(support()),origin=s.state.position;let before=s.state,stops=0,back=false,forwardAgain=false;
 for(let n=0;n<70*120;n++){
  s.update(1/120);const a=s.state,p=sampleStagPose(a),d=gap(a.position,origin);
  assert.ok(d<=.12+1e-12);assert.equal(a.position.y,origin.y);assert.equal(a.heading,.7);assert.equal(a.pitch,0);assert.equal(a.jawOpen,D.restJawOpen);assert.ok(gap(a.position,before.position)<=.02/120+1e-12);assert.ok(Math.abs(a.walkPhase-before.walkPhase)<=.02/120/D.cycleDistance*2*Math.PI+1e-10);
  for(const v of [...Object.values(a.position),a.walkPhase,a.walkSpeed,a.time])assert.ok(Number.isFinite(v));
  if(a.walkSpeed<0)back=true;if(back&&a.walkSpeed>0)forwardAgain=true;
  if(a.phase==='resting'){assert.equal(p.legs.filter(l=>l.contact).length,6);assert.ok(Math.abs(Math.sin(a.walkPhase))<1e-10);}
  if(before.phase==='walking'&&a.phase==='resting'){stops++;assert.ok(Math.abs(d)<1e-10||Math.abs(d-.12)<1e-10);assert.ok(Math.abs(a.walkPhase)<1e-10||Math.abs(a.walkPhase-6*Math.PI)<1e-10);}
  before=a;
 }
 assert.ok(stops>=4);assert.ok(forwardAgain);assert.equal(s.state.caught,false);
});

test('signed distance phase keeps both forward and reverse stance feet world-fixed with fixed bones',()=>{
 const s=createStagStudy(support());let before=s.state,old=sampleStagPose(before),directions=new Set();
 for(let n=0;n<30*120;n++){
  s.update(1/120);const a=s.state,p=sampleStagPose(a);if(a.walkSpeed)directions.add(Math.sign(a.walkSpeed));assert.ok(p.legs.filter(l=>l.contact).length>=3);
  for(let j=0;j<6;j++){
   const l=p.legs[j];if(old.legs[j].contact&&l.contact)assert.ok(gap(world(before,old.legs[j].foot),world(a,l.foot))<1e-10);
   assert.ok(Math.abs(gap(l.hip,l.knee)-D.upperLegLength)<1e-12);assert.ok(Math.abs(gap(l.knee,l.foot)-D.lowerLegLength)<1e-12);
   if(l.contact)assert.ok(Math.abs(l.foot.y+D.rootAboveSupport)<1e-12);
  }
  before=a;old=p;
 }
 assert.deepEqual(directions,new Set([1,-1]));
});

test('near response stops on the next support pose, opens jaws continuously then retreats within the segment',()=>{
 for(const direction of [1,-1]){
  const s=createStagStudy(support());until(s,a=>a.phase==='walking'&&a.direction===direction);step(s,1.13);const before=s.state,p=sampleStagPose(before);assert.equal(s.disturb(),true);assert.deepEqual(sampleStagPose(s.state),p);assert.equal(s.disturb(),false);
  until(s,a=>a.phase==='reacting',2);assert.ok(gap(before.position,s.state.position)<=D.cycleDistance/2+1e-10);assert.equal(sampleStagPose(s.state).legs.filter(l=>l.contact).length,6);assert.equal(s.disturb(),false);
  const stopped=s.state;let old=stopped.jawOpen;for(let n=0;n<119;n++){s.update(1/120);assert.deepEqual(s.state.position,stopped.position);assert.ok(s.state.jawOpen>=old);assert.ok(s.state.jawOpen-old<.007);old=s.state.jawOpen;}assert.ok(s.state.jawOpen>.69);
  until(s,a=>a.phase==='walking',1);assert.equal(s.state.direction,-1);old=s.state.jawOpen;for(let n=0;n<120;n++){s.update(1/120);assert.ok(s.state.jawOpen<=old+1e-12);assert.ok(old-s.state.jawOpen<.007);old=s.state.jawOpen;}assert.ok(Math.abs(s.state.jawOpen-D.restJawOpen)<1e-12);
 }
 // At the rear endpoint, staying in the supported interval takes priority over retreat.
 const rear=createStagStudy();assert.equal(rear.disturb(),true);assert.equal(rear.state.phase,'reacting');until(rear,a=>a.phase==='walking',2);assert.equal(rear.state.direction,1);
});

test('capture/release preserves all poses including opening and closing jaws, then immediately ramps walking',()=>{
 for(const mode of ['initial','forward','end','backward','opening-jaw','closing-jaw']){
  const s=createStagStudy(support());if(mode==='forward'){until(s,a=>a.phase==='walking');step(s,1.13);}if(mode==='end')until(s,a=>a.phase==='resting'&&a.direction===-1);if(mode==='backward'){until(s,a=>a.phase==='walking'&&a.direction===-1);step(s,1.13);}
  if(mode==='opening-jaw'||mode==='closing-jaw'){until(s,a=>a.phase==='walking');step(s,2.13);s.disturb();until(s,a=>a.phase==='reacting');if(mode==='closing-jaw')until(s,a=>a.phase==='walking');step(s,.37);assert.ok(s.state.jawOpen>D.restJawOpen&&s.state.jawOpen<.7);}
  const before=s.state,p=sampleStagPose(before);assert.equal(s.capture(),true);assert.equal(s.capture(),false);assert.equal(s.disturb(),false);const held=s.state;step(s,5);assert.deepEqual(s.state,held);assert.deepEqual(sampleStagPose(s.state),p);assert.equal(s.release(),true);assert.equal(s.release(),false);assert.deepEqual(sampleStagPose(s.state),p);assert.equal(s.state.walkPhase,before.walkPhase);assert.equal(s.state.jawOpen,before.jawOpen);assert.equal(s.state.walkSpeed,0);assert.equal(s.state.phase,'walking');assert.equal(s.state.direction,before.direction);
  s.update(1/120);assert.ok(gap(s.state.position,before.position)<1e-6);assert.ok(Math.abs(s.state.walkSpeed)<.001);assert.ok(Math.abs(s.state.jawOpen-before.jawOpen)<.007);step(s,.6);assert.equal(Math.sign(s.state.walkSpeed),before.direction);assert.ok(gap(s.state.position,before.position)>0);
 }
});

test('copied support and snapshots, finite bounded dt and reset are deterministic',()=>{
 const input=support(),s=createStagStudy(input),initial=s.state;input.position.x=100;const snapshot=s.state;snapshot.position.z=100;assert.deepEqual(s.state,initial);
 for(const dt of [0,-1,NaN,Infinity])s.update(dt);assert.deepEqual(s.state,initial);const a=createStagStudy(support()),b=createStagStudy(support());a.update(100);b.update(.1);assert.deepEqual(a.state,b.state);
 step(s,18);s.capture();s.reset();assert.deepEqual(s.state,initial);
 for(const bad of [{position:{x:0,y:NaN,z:0}},{position:{x:0,y:0,z:0},heading:Infinity},{position:Object.create({x:0,y:0,z:0})}])assert.throws(()=>createStagStudy(bad),/Invalid stag support/);
});
