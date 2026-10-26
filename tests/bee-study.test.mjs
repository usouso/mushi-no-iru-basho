import test from 'node:test';
import assert from 'node:assert/strict';
import {createBeeStudy} from '../src/bee-study.js';
import {BEE_DIMENSIONS as D,sampleBeePose} from '../src/bee-kinematics.js';
const supports=()=>[{position:{x:0,y:1+D.rootAboveSupport,z:0},heading:.4},{position:{x:1.2,y:1.08+D.rootAboveSupport,z:-.5},heading:-1}],gap=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
function step(s,t){for(let n=0;n<Math.round(t*120);n++)s.update(1/120);}
function until(s,check,max=15){for(let n=0;n<max*120;n++){s.update(1/120);if(check(s.state))return;}assert.fail('expected bee phase');}

test('two flower visits have finite continuous root/yaw/pitch and wing clocks through all four phases',()=>{
 const s=createBeeStudy(supports()),phases=new Set();let before=s.state,landings=0;
 step(s,6.9);assert.equal(s.state.phase,'resting');assert.deepEqual(s.state.position,supports()[0].position);before=s.state;
 for(let n=0;n<29*120;n++){
  s.update(1/120);const a=s.state;phases.add(a.phase);
  for(const v of [...Object.values(a.position),a.heading,a.pitch,a.wingOpen,a.wingPhase,a.legTuck,a.time])assert.ok(Number.isFinite(v));
  assert.ok(gap(a.position,before.position)<.01);assert.ok(Math.abs(a.heading-before.heading)<.08);assert.ok(Math.abs(a.pitch-before.pitch)<.01);assert.ok(Math.abs(a.wingOpen-before.wingOpen)<.03);assert.ok(a.wingPhase>=before.wingPhase);assert.ok(a.wingPhase-before.wingPhase<.7);
  for(const key of ['wingOpen','legTuck'])assert.ok(a[key]>=0&&a[key]<=1);
  if(a.phase!=='flying'){assert.equal(a.pitch,0);assert.equal(a.legTuck,0);assert.ok(supports().some(p=>gap(p.position,a.position)<1e-12));}
  if(before.phase==='closing'&&a.phase==='resting')landings++;before=a;
 }
 assert.deepEqual(phases,new Set(['resting','opening','flying','closing']));assert.ok(landings>=2);
});

test('six feet support opening/closing; lift and landing stay above each horizontal flower, with four coupled wings and rigid bones',()=>{
 const s=createBeeStudy(supports());let from=0,seenFlight=false;
 for(let n=0;n<27*120;n++){
  const before=s.state;s.update(1/120);const a=s.state,p=sampleBeePose(a);
  assert.equal(p.legs.length,6);assert.equal(p.wings.length,4);for(const side of [-1,1]){const wings=p.wings.filter(w=>w.side===side);assert.equal(wings[0].sweep,wings[1].sweep);assert.equal(wings[0].flap,wings[1].flap);}
  for(const l of p.legs){assert.ok(Math.abs(gap(l.hip,l.knee)-D.upperLegLength)<1e-12);assert.ok(Math.abs(gap(l.knee,l.foot)-D.lowerLegLength)<1e-12);}
  if(a.phase!=='flying'){assert.equal(p.legs.filter(l=>l.contact).length,6);for(const l of p.legs)assert.ok(Math.abs(l.foot.y+D.rootAboveSupport)<1e-12);}
  else{
   seenFlight=true;const destination=1-from,start=supports()[from].position,end=supports()[destination].position,nearStart=gap(a.position,start)<gap(a.position,end),plane=(nearStart?start.y:end.y)-D.rootAboveSupport;
   for(const l of p.legs){const worldY=a.position.y+Math.cos(a.pitch)*l.foot.y-Math.sin(a.pitch)*l.foot.z;assert.ok(worldY>=plane-1e-12);}
  }
  if(before.phase==='flying'&&a.phase==='closing')from=1-from;
 }
 assert.ok(seenFlight);
});

test('early departure only shortens a rest, never changes heading or destination during flight',()=>{
 const s=createBeeStudy(supports()),rest=sampleBeePose(s.state);assert.equal(s.depart(),true);assert.deepEqual(sampleBeePose(s.state),rest);assert.equal(s.depart(),false);until(s,a=>a.phase==='flying');step(s,.83);const before=s.state;assert.equal(s.depart(),false);assert.deepEqual(s.state,before);until(s,a=>a.phase==='resting');assert.deepEqual(s.state.position,supports()[1].position);assert.equal(s.depart(),true);
});

test('capture freezes every clock and pose during support, opening, takeoff, cruise, landing and closing; release is exact and ramped',()=>{
 for(const [phase,offset]of [['resting',.3],['opening',.17],['flying',.09],['flying',1.2],['flying',2.4],['closing',.17]]){
  const s=createBeeStudy(supports());if(phase!=='resting'){s.depart();if(phase!=='opening')until(s,a=>a.phase===phase);}step(s,offset);assert.equal(s.state.phase,phase);
  const before=s.state,p=sampleBeePose(before);assert.equal(s.capture(),true);assert.equal(s.capture(),false);assert.equal(s.depart(),false);const held=s.state;step(s,3);assert.deepEqual(s.state,held);assert.deepEqual(sampleBeePose(s.state),p);assert.equal(s.release(),true);assert.equal(s.release(),false);assert.deepEqual(sampleBeePose(s.state),p);assert.equal(s.state.phase,phase==='resting'?'opening':phase);s.update(1/120);assert.ok(gap(s.state.position,before.position)<.00001);assert.ok(Math.abs(s.state.wingPhase-before.wingPhase)<.001);assert.ok(Math.abs(s.state.pitch-before.pitch)<.00001);
 }
});

test('copied supports/snapshots and bounded invalid dt preserve deterministic finite state',()=>{
 const input=supports(),s=createBeeStudy(input),initial=s.state;input[0].position.x=100;s.state.position.x=100;assert.deepEqual(s.state,initial);for(const dt of [0,-1,NaN,Infinity])s.update(dt);assert.deepEqual(s.state,initial);
 const a=createBeeStudy(supports()),b=createBeeStudy(supports());a.update(100);b.update(.1);assert.deepEqual(a.state,b.state);step(a,35);step(b,35);assert.deepEqual(a.state,b.state);
 for(const change of [p=>p.pop(),p=>p[1].position.x=3,p=>p[0].position.y=NaN,p=>p[1].position.y+=1,p=>p[0].extra=true]){const p=supports();change(p);assert.throws(()=>createBeeStudy(p),/Invalid bee supports/);}
});
