/** Signed native gait math only. Field geometry/LOS/rendered realism are separate. */
import test from 'node:test';import assert from 'node:assert/strict';
import {createWetapungaStudy as create,WETAPUNGA_MOTION as M} from '../src/wetapunga-study.js';
import {sampleWetapungaPose as sample,WETAPUNGA_DIMENSIONS as D} from '../src/wetapunga-kinematics.js';
const C=D.cycleDistance,H=C/2,TAU=Math.PI*2,close=(a,b,e=1e-9)=>assert.ok(Math.abs(a-b)<=e,`${a} != ${b}`),gap=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const cfg=(yaw=0)=>({position:{x:0,y:.94+D.rootAboveSupport,z:0},orientation:{x:0,y:Math.sin(yaw/2),z:0,w:Math.cos(yaw/2)},retreatBounds:{min:-.24,max:.24},motionSeed:1729});
const rotate=(p,q)=>{const tx=2*(q.y*p.z-q.z*p.y),ty=2*(q.z*p.x-q.x*p.z),tz=2*(q.x*p.y-q.y*p.x);return{x:p.x+q.w*tx+q.y*tz-q.z*ty,y:p.y+q.w*ty+q.z*tx-q.x*tz,z:p.z+q.w*tz+q.x*ty-q.y*tx};};
const axis=s=>rotate({x:0,y:0,z:1},s.orientation),world=(p,s)=>{const r=rotate(p,s.orientation);return{x:r.x+s.position.x,y:r.y+s.position.y,z:r.z+s.position.z};};
const feet=s=>sample(s).legs.map(l=>({point:world(l.foot,s),contact:l.contact}));
const observer=(s,sign)=>{const a=axis(s);return{x:s.position.x+sign*a.x,z:s.position.z+sign*a.z};};
const advance=(s,seconds,hz=120)=>{let left=seconds;while(left>1e-12){const dt=Math.min(1/hz,left);s.update(dt);left-=dt;}};
const until=(s,phase)=>{for(let n=0;n<4000;n++){if(s.state.phase===phase)return;s.update(1/120);}assert.fail(`Missing ${phase}`);};
const pose=s=>sample(s);

test('finite copied horizontal support, inward half-step bounds, invalid inputs/dt and reset are deterministic',()=>{
 for(const change of [{position:{x:NaN,y:1,z:0}},{position:{x:1e6,y:1,z:0}},{orientation:{x:0,y:0,z:0,w:2}},{orientation:{x:.1,y:0,z:0,w:Math.sqrt(.99)}},{orientation:{x:0,y:0,z:1,w:0}},{retreatBounds:{min:0,max:.001}},{retreatBounds:{min:1,max:2}},{retreatBounds:{min:-2,max:2}},{motionSeed:-1},{motionSeed:2**32},{motionSeed:NaN}])assert.throws(()=>create({...cfg(),...change}),TypeError);
 let reads=0;assert.throws(()=>create({...cfg(),position:{get x(){reads++;return 0;},y:1,z:0}}),TypeError);assert.equal(reads,0);
 const input=cfg(Math.PI/2),s=create(input),initial=s.state;input.position.x=99;input.orientation.w=0;input.retreatBounds.min=-1;s.state.position.x=77;s.state.orientation.y=9;assert.deepEqual(s.state,initial);
 for(const dt of [0,-1,NaN,Infinity,undefined])s.update(dt);assert.deepEqual(s.state,initial);assert.equal(s.disturb({get x(){reads++;return 0;},z:0}),false);assert.equal(reads,0);assert.equal(s.disturb({x:0,z:Infinity}),false);
 const a=create(cfg()),b=create(cfg());a.update(99);b.update(.1);assert.deepEqual(a.state,b.state);advance(a,20);a.capture();a.reset();assert.deepEqual(a.state,create(cfg()).state);
 assert.deepEqual(create({...cfg(),retreatBounds:{min:-.239,max:.239}}).effectiveBounds,{min:-.22,max:.22});assert.equal(D.cycleDistance,.04);assert.equal(D.rootAboveSupport,.065);
});

test('both signed directions and yaw bases keep planted feet fixed, finite bones and six-foot stopped poses within bounds',t=>{
 let maxSlip=0,maxBoneError=0,maxSpeed=0;const phases=new Set();
 for(const yaw of [0,Math.PI/2]){
  const s=create(cfg(yaw));let before=s.state,prior=feet(before);
  for(let n=0;n<36*120;n++){
   if(n===8*120||n===24*120)s.disturb(observer(s.state,n===8*120?1:-1));s.update(1/120);const a=s.state,f=feet(a),p=pose(a);phases.add(a.phase);
   for(const value of [...Object.values(a.position),...Object.values(a.orientation),a.walkPhase,a.walkSpeed,a.time])assert.ok(Number.isFinite(value));assert.ok(a.distance>=-.24-1e-10&&a.distance<=.24+1e-10);assert.ok(Math.abs(a.walkSpeed)<=.12+1e-10);maxSpeed=Math.max(maxSpeed,Math.abs(a.walkSpeed));close(a.walkPhase,a.distance/C*TAU);assert.deepEqual(a.orientation,before.orientation);assert.equal(a.position.y,before.position.y);assert.ok(gap(a.position,before.position)<.00101);
   for(let i=0;i<6;i++){
    if(prior[i].contact&&f[i].contact){const slip=gap(prior[i].point,f[i].point);maxSlip=Math.max(maxSlip,slip);assert.ok(slip<2e-10);}
    assert.ok(f[i].point.y>=.94-1e-10);if(f[i].contact)close(f[i].point.y,.94);
    const l=p.legs[i];for(const [u,v,L] of [[l.hip,l.knee,l.boneLengths[0]],[l.knee,l.foot,l.boneLengths[1]]]){const error=Math.abs(gap(u,v)-L);maxBoneError=Math.max(maxBoneError,error);assert.ok(error<1e-12);}
   }
   if(a.phase==='resting'){assert.equal(f.filter(v=>v.contact).length,6);close(a.walkPhase/Math.PI,Math.round(a.walkPhase/Math.PI));assert.equal(a.walkSpeed,0);}
   prior=f;before=a;
  }
 }
 for(const phase of ['resting','walking','finishing','retreating'])assert.ok(phases.has(phase),phase);t.diagnostic(JSON.stringify({maxSlip,maxBoneError,maxSpeed}));
});

test('reaction finishes the present half-step within .5s then moves away promptly; busy calls do not reset routes and blocked end never moves toward observer',t=>{
 let maxFinish=0,maxAwayVelocity=0,maxBeyondStart=0;
 for(const yaw of [0,Math.PI/2])for(const motionSeed of [1729,7])for(const offset of [0,.001,.01,.05,.10,.20,.25,.40,.50,.65,.90,1.1]){
  const s=create({...cfg(yaw),motionSeed});until(s,'walking');advance(s,offset);if(s.state.phase!=='walking')continue;
  const before=s.state,sign=Math.sign(before.walkSpeed)||1,source=observer(before,sign),initialDistance=before.distance,initialSpeed=before.walkSpeed,initialPose=pose(before);
  assert.equal(s.disturb(source),true);assert.deepEqual(pose(s.state),initialPose);if(s.state.phase==='finishing')close(s.state.walkSpeed,initialSpeed);
  let elapsed=0,finish=null,away=null,beyond=null;
  while(elapsed<1.3){
   const snapshot=s.state;assert.equal(s.disturb(observer(snapshot,-sign)),false);assert.deepEqual(s.state,snapshot);s.update(.001);elapsed+=.001;const a=s.state;
   if(a.phase!=='finishing'&&finish===null){finish=elapsed;assert.equal(feet(a).filter(f=>f.contact).length===6||a.phase==='retreating',true);}
   if(sign*a.walkSpeed<-1e-6&&away===null)away=elapsed;
   if(sign*(a.distance-initialDistance)<-.001&&beyond===null)beyond=elapsed;
   if(beyond!==null)break;
  }
  assert.ok(finish<=.501);assert.ok(away<=.51);assert.ok(beyond<.9);maxFinish=Math.max(maxFinish,finish);maxAwayVelocity=Math.max(maxAwayVelocity,away);maxBeyondStart=Math.max(maxBeyondStart,beyond);
 }
 const boundary=create(cfg());until(boundary,'walking');advance(boundary,.001);boundary.disturb(observer(boundary.state,1));advance(boundary,.5);assert.equal(boundary.state.phase,'retreating');assert.equal(feet(boundary.state).filter(f=>f.contact).length,6);close(boundary.state.walkSpeed,0);
 const end=create({...cfg(),retreatBounds:{min:0,max:.12}}),at=end.state;assert.equal(end.disturb(observer(at,1)),true);assert.deepEqual(pose(end.state),pose(at));assert.equal(end.state.phase,'resting');assert.equal(feet(end.state).filter(f=>f.contact).length,6);advance(end,.8);assert.deepEqual(pose(end.state),pose(at));
 t.diagnostic(JSON.stringify({maxFinishSeconds:maxFinish,maxFirstAwayVelocitySeconds:maxAwayVelocity,maxBeyondInitialPositionBy1mmSeconds:maxBeyondStart,scope:'normal walking disturbance, 1ms sampling; no field LOS/catch guarantee'}));
});

test('capture freezes each phase and all pose clocks; first release pose is exact with eased resumption and all resets deterministic',()=>{
 for(const phase of ['resting','walking','finishing','retreating']){
  const s=create(cfg(Math.PI/2));if(phase!=='resting'){until(s,'walking');advance(s,.15);if(phase==='finishing'||phase==='retreating'){s.disturb(observer(s.state,1));if(phase==='retreating')until(s,'retreating');}}advance(s,.025);assert.equal(s.state.phase,phase);
  const before=s.state,physical=pose(before);assert.equal(s.capture(),true);assert.equal(s.capture(),false);const held=s.state;advance(s,3);assert.deepEqual(s.state,held);assert.deepEqual(pose(s.state),physical);assert.equal(s.disturb(observer(s.state,1)),false);
  assert.equal(s.release(),true);assert.equal(s.release(),false);assert.deepEqual(pose(s.state),physical);s.update(1/120);assert.ok(gap(s.state.position,before.position)<1e-6);assert.ok(Math.abs(s.state.walkPhase-before.walkPhase)<.0001);advance(s,.5);assert.ok(s.state.time>before.time+.3);s.reset();assert.deepEqual(s.state,create(cfg(Math.PI/2)).state);
 }
});

test('30/60/120Hz produce matching segment states; no-stimulus seeded waits remain ordinary bounded walks without hidden threat response',()=>{
 const final=[];
 for(const hz of [30,60,120]){const s=create(cfg());advance(s,8.2,hz);s.disturb(observer(s.state,1));advance(s,30,hz);final.push(s.state);}
 for(const a of final.slice(1)){assert.equal(a.phase,final[0].phase);close(a.time,final[0].time);close(a.distance,final[0].distance);close(a.walkPhase,final[0].walkPhase);close(a.wait,final[0].wait);}
 const a=create(cfg()),b=create(cfg()),c=create({...cfg(),motionSeed:7});assert.notEqual(a.state.wait,c.state.wait);
 for(let n=0;n<60*60;n++){a.update(1/60);b.update(1/60);assert.deepEqual(a.state,b.state);assert.ok(['resting','walking'].includes(a.state.phase));assert.ok(Math.abs(a.state.distance)<=M.normalDistance+1e-10);}
});
