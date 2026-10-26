import test from 'node:test';
import assert from 'node:assert/strict';
import {createLonghornStudy} from '../src/longhorn-study.js';
import {LONGHORN_DIMENSIONS as D,sampleLonghornPose} from '../src/longhorn-kinematics.js';
const support=(angle=-Math.PI/2)=>({position:{x:2,y:1.1,z:-3},orientation:{x:Math.sin(angle/2),y:0,z:0,w:Math.cos(angle/2)}}),gap=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
function rotate(q,v){const x=2*(q.y*v.z-q.z*v.y),y=2*(q.z*v.x-q.x*v.z),z=2*(q.x*v.y-q.y*v.x);return{x:v.x+q.w*x+q.y*z-q.z*y,y:v.y+q.w*y+q.z*x-q.x*z,z:v.z+q.w*z+q.x*y-q.y*x};}
const world=(s,p)=>{const v=rotate(s.orientation,p);return{x:s.position.x+v.x,y:s.position.y+v.y,z:s.position.z+v.z};};
function step(s,t){for(let n=0;n<Math.round(t*120);n++)s.update(1/120);}
function until(s,check,max=30){for(let n=0;n<max*120;n++){s.update(1/120);if(check(s.state))return;}assert.fail('expected longhorn state');}

test('finite vertical bark ascent/rest/descent/rest repeats without position, phase or quaternion reset',()=>{
 const s=createLonghornStudy(support()),origin=s.state.position,q=s.state.orientation;let before=s.state,stops=0,back=false,forwardAgain=false;
 for(let n=0;n<70*120;n++){
  s.update(1/120);const a=s.state,p=sampleLonghornPose(a),d=gap(a.position,origin);
  assert.ok(d<=.06+1e-12);assert.equal(a.position.x,origin.x);assert.ok(Math.abs(a.position.z-origin.z)<1e-12);assert.ok(a.position.y>=origin.y-1e-12);assert.deepEqual(a.orientation,q);assert.ok(Math.abs(Math.hypot(...Object.values(a.orientation))-1)<1e-12);assert.ok(gap(a.position,before.position)<=.018/120+1e-12);assert.ok(Math.abs(a.walkPhase-before.walkPhase)<=.018/120/D.cycleDistance*2*Math.PI+1e-10);
  for(const v of [...Object.values(a.position),a.walkPhase,a.walkSpeed,a.time])assert.ok(Number.isFinite(v));
  if(a.walkSpeed<0)back=true;if(back&&a.walkSpeed>0)forwardAgain=true;
  if(a.phase==='resting'){assert.equal(p.legs.filter(l=>l.contact).length,6);assert.ok(Math.abs(Math.sin(a.walkPhase))<1e-10);}
  if(before.phase==='walking'&&a.phase==='resting'){stops++;assert.ok(Math.abs(d)<1e-10||Math.abs(d-.06)<1e-10);assert.ok(Math.abs(a.walkPhase)<1e-10||Math.abs(a.walkPhase-4*Math.PI)<1e-10);}
  before=a;
 }
 assert.ok(stops>=4);assert.ok(forwardAgain);assert.equal(s.state.caught,false);
});

test('signed distance phase keeps both forward and reverse stance feet world-fixed with fixed bones',()=>{
 const s=createLonghornStudy(support(-1.1));let before=s.state,old=sampleLonghornPose(before),directions=new Set();
 for(let n=0;n<30*120;n++){
  s.update(1/120);const a=s.state,p=sampleLonghornPose(a);if(a.walkSpeed)directions.add(Math.sign(a.walkSpeed));assert.ok(p.legs.filter(l=>l.contact).length>=3);
  for(let j=0;j<6;j++){
   const l=p.legs[j];if(old.legs[j].contact&&l.contact)assert.ok(gap(world(before,old.legs[j].foot),world(a,l.foot))<1e-10);
   assert.ok(Math.abs(gap(l.hip,l.knee)-D.upperLegLength)<1e-12);assert.ok(Math.abs(gap(l.knee,l.foot)-D.lowerLegLength)<1e-12);
   if(l.contact)assert.ok(Math.abs(l.foot.y+D.rootAboveSupport)<1e-12);
  }
  before=a;old=p;
 }
 assert.deepEqual(directions,new Set([1,-1]));
});

test('disturbance completes the current half-stride, waits grounded then reverses within the short segment',()=>{
 for(const direction of [1,-1]){
  const s=createLonghornStudy(support());until(s,a=>a.phase==='walking'&&a.direction===direction);step(s,1.13);const before=s.state,p=sampleLonghornPose(before);assert.equal(s.disturb(),true);assert.deepEqual(sampleLonghornPose(s.state),p);assert.equal(s.disturb(),false);
  until(s,a=>a.phase==='resting',2);assert.ok(gap(before.position,s.state.position)<=D.cycleDistance/2+1e-10);assert.equal(sampleLonghornPose(s.state).legs.filter(l=>l.contact).length,6);assert.equal(s.disturb(),false);
  const stopped=s.state;step(s,1);assert.deepEqual(s.state.position,stopped.position);until(s,a=>a.phase==='walking',2);assert.equal(s.state.direction,-direction);step(s,.2);assert.equal(Math.sign(s.state.walkSpeed),-direction);
 }
 const rest=createLonghornStudy(support());assert.equal(rest.disturb(),true);assert.equal(rest.disturb(),false);until(rest,a=>a.phase==='walking',3);assert.equal(rest.state.direction,1);
});

test('capture freezes every pose and clock; return keeps exact pose and ramps forward or reverse speed',()=>{
 for(const mode of ['initial','forward','end','backward','stopping','near-rest']){
  const s=createLonghornStudy(support());if(mode==='forward'){until(s,a=>a.phase==='walking');step(s,1.13);}if(mode==='end')until(s,a=>a.phase==='resting'&&a.direction===-1);if(mode==='backward'){until(s,a=>a.phase==='walking'&&a.direction===-1);step(s,1.13);}
  if(mode==='stopping'||mode==='near-rest'){until(s,a=>a.phase==='walking');step(s,1.13);s.disturb();if(mode==='near-rest')until(s,a=>a.phase==='resting',2);}
  const before=s.state,p=sampleLonghornPose(before);assert.equal(s.capture(),true);assert.equal(s.capture(),false);assert.equal(s.disturb(),false);const held=s.state;step(s,5);assert.deepEqual(s.state,held);assert.deepEqual(sampleLonghornPose(s.state),p);assert.equal(s.release(),true);assert.equal(s.release(),false);assert.deepEqual(sampleLonghornPose(s.state),p);assert.equal(s.state.walkPhase,before.walkPhase);assert.equal(s.state.walkSpeed,0);assert.equal(s.state.phase,'walking');assert.equal(s.state.direction,before.direction);
  s.update(1/120);assert.ok(gap(s.state.position,before.position)<1e-6);assert.ok(Math.abs(s.state.walkSpeed)<.001);step(s,.1);assert.equal(Math.sign(s.state.walkSpeed),before.direction);assert.ok(gap(s.state.position,before.position)>0);
 }
});

test('copied support and snapshots, finite bounded dt and reset are deterministic',()=>{
 const input=support(),s=createLonghornStudy(input),initial=s.state;input.position.x=100;input.orientation.w=0;const snapshot=s.state;snapshot.position.z=100;snapshot.orientation.x=9;assert.deepEqual(s.state,initial);
 for(const dt of [0,-1,NaN,Infinity])s.update(dt);assert.deepEqual(s.state,initial);const a=createLonghornStudy(support()),b=createLonghornStudy(support());a.update(100);b.update(.1);assert.deepEqual(a.state,b.state);
 step(s,18);s.capture();s.reset();assert.deepEqual(s.state,initial);
 const positive=support(),negative=support();for(const k of ['x','y','z','w'])negative.orientation[k]*=-1;const c=createLonghornStudy(positive),d=createLonghornStudy(negative);step(c,12);step(d,12);assert.deepEqual(c.state.position,d.state.position);for(const k of ['x','y','z','w'])assert.equal(c.state.orientation[k],-d.state.orientation[k]);
 for(const bad of [undefined,{...support(),position:{x:0,y:NaN,z:0}},{...support(),orientation:{x:0,y:0,z:0,w:2}},{...support(),extra:true},{...support(),position:Object.create({x:0,y:0,z:0})}])assert.throws(()=>createLonghornStudy(bad),/Invalid longhorn support/);
});
