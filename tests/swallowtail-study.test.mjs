import test from 'node:test';
import assert from 'node:assert/strict';
import {createSwallowtailStudy} from '../src/swallowtail-study.js';
import {SWALLOWTAIL_DIMENSIONS as D,sampleSwallowtailPose} from '../src/swallowtail-kinematics.js';
// Two existing slope roots, copied as portable numbers; no private site file dependency.
const fixture=[{"position":{"x":14.316593324833962,"y":-0.07507616916723875,"z":-21.255112345757876},"orientation":{"x":0.006312727232688419,"y":-0.0004975046574198374,"z":-0.07856459801386723,"w":0.9968889135219234}},{"position":{"x":14.316593324833962,"y":-0.08277037462535031,"z":-20.655112345757875},"orientation":{"x":0.07856459801386725,"y":0.9968889135219234,"z":0.006312727232688422,"w":0.0004975046574198376}}];
const supports=()=>structuredClone(fixture),gap=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z),qdot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z+a.w*b.w;
function rotate(q,v){const x=2*(q.y*v.z-q.z*v.y),y=2*(q.z*v.x-q.x*v.z),z=2*(q.x*v.y-q.y*v.x);return{x:v.x+q.w*x+q.y*z-q.z*y,y:v.y+q.w*y+q.z*x-q.x*z,z:v.z+q.w*z+q.x*y-q.y*x};}
const n=rotate(fixture[0].orientation,{x:0,y:1,z:0}),root=fixture[0].position;
const clearance=p=>(p.x-root.x)*n.x+(p.y-root.y)*n.y+(p.z-root.z)*n.z+D.rootAboveSupport;
function step(s,t){for(let k=0;k<Math.round(t*120);k++)s.update(1/120);}
function until(s,check,max=20){for(let k=0;k<max*120;k++){s.update(1/120);if(check(s.state))return;}assert.fail('expected swallowtail phase');}

test('slope-to-air shortest quaternion interpolation is finite, unit and sign-continuous through two return visits',()=>{
 const s=createSwallowtailStudy(supports()),phases=new Set();let before=s.state,landings=0;
 for(let k=0;k<40*120;k++){
  s.update(1/120);const a=s.state;phases.add(a.phase);for(const v of [...Object.values(a.position),...Object.values(a.orientation),a.wingOpen,a.wingPhase,a.flapBlend,a.legTuck,a.flightProgress,a.supportClearance,a.time])assert.ok(Number.isFinite(v));
  assert.ok(Math.abs(Math.hypot(...Object.values(a.orientation))-1)<1e-12);assert.ok(qdot(a.orientation,before.orientation)>.999);assert.ok(gap(a.position,before.position)<.006);assert.ok(a.wingPhase>=before.wingPhase);assert.ok(a.wingPhase-before.wingPhase<.7);
  for(const key of ['wingOpen','flapBlend','legTuck','flightProgress'])assert.ok(a[key]>=0&&a[key]<=1);
  if(a.phase!=='flying'){const support=fixture.find(p=>gap(p.position,a.position)<1e-12);assert.ok(support);assert.ok(Math.abs(qdot(a.orientation,support.orientation))>1-1e-12);assert.equal(a.legTuck,0);assert.equal(a.flapBlend,0);}
  if(before.phase==='closing'&&a.phase==='resting')landings++;before=a;
 }
 assert.deepEqual(phases,new Set(['resting','opening','flying','closing']));assert.ok(landings>=2);
});

test('six slope-supported feet, rigid tuck and normal-height flap gate keep contact before lift and after landing',()=>{
 const s=createSwallowtailStudy(supports());let full=false,safeMin=Infinity,safeMax=-Infinity;
 for(let k=0;k<30*120;k++){
  s.update(1/120);const a=s.state,p=sampleSwallowtailPose(a);assert.equal(p.legs.length,6);assert.equal(p.wings.length,4);assert.ok(Math.abs(a.supportClearance-clearance(a.position))<1e-12);
  if(a.supportClearance<=D.rootAboveSupport+.14+1e-12){assert.equal(a.flapBlend,0);for(const w of p.wings)assert.ok(w.angle*w.side>=D.safeWingAngle-1e-12);if(a.phase==='flying'){const angle=p.wings[0].angle*p.wings[0].side;safeMin=Math.min(safeMin,angle);safeMax=Math.max(safeMax,angle);}}
  if(a.flapBlend===1){full=true;assert.ok(a.supportClearance>=D.rootAboveSupport+.20-1e-12);}
  if(a.phase!=='flying')assert.equal(p.legs.filter(l=>l.contact).length,6);
  for(const l of p.legs){assert.ok(Math.abs(gap(l.hip,l.knee)-D.upperLegLength)<1e-12);assert.ok(Math.abs(gap(l.knee,l.foot)-D.lowerLegLength)<1e-12);const f=rotate(a.orientation,l.foot),point={x:a.position.x+f.x,y:a.position.y+f.y,z:a.position.z+f.z};assert.ok(clearance(point)>=-1e-12);if(a.phase!=='flying')assert.ok(Math.abs(clearance(point))<1e-12);}
 }
 assert.ok(full);assert.ok(safeMax-safeMin>.05,'low-clearance flight must stroke upward, not hover with frozen wings');
});

test('early departure shortens rest only; air direction and pose are not reset or retargeted',()=>{
 const s=createSwallowtailStudy(supports()),p=sampleSwallowtailPose(s.state);assert.equal(s.depart(),true);assert.deepEqual(sampleSwallowtailPose(s.state),p);assert.equal(s.depart(),false);until(s,a=>a.phase==='flying');step(s,1);const before=s.state;assert.equal(s.depart(),false);assert.deepEqual(s.state,before);until(s,a=>a.phase==='resting');assert.deepEqual(s.state.position,fixture[1].position);
});

test('all clocks/quaternion signs and body pose survive capture and ramped release during opening, lift, flight and landing',()=>{
 for(const [phase,offset]of [['resting',.3],['opening',.23],['flying',.08],['flying',.4],['flying',1.4],['flying',2.8],['flying',3.1],['closing',.23]]){
  const s=createSwallowtailStudy(supports());if(phase!=='resting'){s.depart();if(phase!=='opening')until(s,a=>a.phase===phase);}step(s,offset);assert.equal(s.state.phase,phase);const before=s.state,p=sampleSwallowtailPose(before);
  assert.equal(s.capture(),true);assert.equal(s.capture(),false);assert.equal(s.depart(),false);const held=s.state;step(s,3);assert.deepEqual(s.state,held);assert.deepEqual(sampleSwallowtailPose(s.state),p);assert.equal(s.release(),true);assert.equal(s.release(),false);assert.deepEqual(sampleSwallowtailPose(s.state),p);assert.deepEqual(s.state.orientation,before.orientation);assert.equal(s.state.wingPhase,before.wingPhase);assert.equal(s.state.flightProgress,before.flightProgress);s.update(1/120);assert.ok(gap(s.state.position,before.position)<.00001);assert.ok(qdot(s.state.orientation,before.orientation)>1-1e-9);assert.ok(Math.abs(s.state.wingPhase-before.wingPhase)<.001);
 }
});

test('strict copied unit-quaternion same-plane supports, q/-q equivalence and bounded dt are deterministic',()=>{
 const input=supports(),s=createSwallowtailStudy(input),initial=s.state;input[0].position.x=100;input[0].orientation.w=0;const copy=s.state;copy.position.z=100;copy.orientation.x=10;assert.deepEqual(s.state,initial);
 for(const dt of [0,-1,NaN,Infinity])s.update(dt);assert.deepEqual(s.state,initial);const a=createSwallowtailStudy(supports()),b=createSwallowtailStudy(supports());a.update(100);b.update(.1);assert.deepEqual(a.state,b.state);
 const sign=supports();for(const key of ['x','y','z','w'])sign[1].orientation[key]*=-1;const c=createSwallowtailStudy(sign),d=createSwallowtailStudy(supports());step(c,30);step(d,30);assert.deepEqual(c.state,d.state);
 for(const change of [p=>p.pop(),p=>p[0].extra=true,p=>p[1].position.y+=.01,p=>p[0].position.x=NaN,p=>p[0].orientation.w=2,p=>p[1].orientation={x:0,y:0,z:0,w:1},p=>Object.setPrototypeOf(p[0],{bad:true})]){const p=supports();change(p);assert.throws(()=>createSwallowtailStudy(p),/Invalid swallowtail supports/);}
});
