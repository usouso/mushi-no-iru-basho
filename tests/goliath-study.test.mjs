/** Fixed branch behaviour: game adjustment values, not field measurements. */
import test from 'node:test';import assert from 'node:assert/strict';
import{createGoliathStudy,GOLIATH_MOTION as M}from'../src/goliath-study.js';
import{GOLIATH_DIMENSIONS as D}from'../src/goliath-kinematics.js';
const position={x:-2.15,y:1.155,z:3},heading=Math.PI/2,bounds={min:-.24,max:.24},front={x:-.5,z:3},behind={x:-3.8,z:3},make=o=>createGoliathStudy({position,heading,retreatBounds:bounds,...o}),near=(a,b,e=1e-8)=>assert.ok(Math.abs(a-b)<e,`${a} != ${b}`);
function step(s,seconds,source=null,dt=.01){for(let n=0;n<Math.round(seconds/dt);n++){if(source)s.disturb(source);s.update(dt);}}

test('fixed branch inputs are finite, detached and bounded, with no fabricated measurement metadata',()=>{
 const s=make(),a=s.state;assert.equal(a.id,'goliath-study-1');assert.equal(a.phase,'resting');assert.equal(D.rootAboveSupport,.055);assert.equal(D.cycleDistance,.04);s.state.position.x=999;assert.deepEqual(s.state,a);for(const k of['encounterId','sizePermille','motionSeed','measureVersion'])assert.equal(a[k],undefined);
 for(const dt of[0,-1,NaN,Infinity,undefined])s.update(dt);assert.deepEqual(s.state,a);for(const p of[null,{}, {x:NaN,z:0},{x:1e10,z:0}])assert.equal(s.disturb(p),false);
 for(const p of[null,{x:0,z:0},{x:0,y:Infinity,z:0},{x:0,y:0,z:0,extra:1}])assert.throws(()=>make({position:p}),TypeError);for(const b of[undefined,null,{}, {min:.1,max:.2},{min:-.3,max:-.1},{min:-4,max:.2},{min:-.2,max:.2,extra:1}])assert.throws(()=>make({retreatBounds:b}),TypeError);
 let invoked=false;assert.throws(()=>make({position:{get x(){invoked=true;return 0;},y:0,z:0}}),TypeError);assert.equal(invoked,false);
});

test('a visible warning precedes bounded retreat away from either axis threat; sustained pressure never resets the pose or exits wood',()=>{
 for(const threat of[front,behind]){
  const s=make(),sign=threat===front?-1:1;assert.equal(s.disturb(threat),true);let warning=0,retreated=false,peak=0,previous=s.state;
  for(let n=0;n<700;n++){s.disturb(threat);s.update(.01);const now=s.state;if(previous.phase==='warning')warning+=.01;if(now.phase==='retreating'){retreated=true;assert.ok(warning>=M.warningSeconds-1e-8);assert.ok(sign*(now.position.x-previous.position.x)>=-1e-10);}assert.ok(now.position.x>=position.x-.24-1e-9&&now.position.x<=position.x+.24+1e-9);assert.ok(Math.abs(now.position.x-previous.position.x)<=M.retreatSpeed*.01+1e-9);near(now.position.y,position.y);near(now.position.z,position.z);assert.ok(now.warningBlend>=0&&now.warningBlend<=1);peak=Math.max(peak,Math.abs(now.walkSpeed));previous=now;}
  assert.ok(retreated&&peak>.09);assert.equal(s.state.phase,'cornered');near(s.state.position.x,position.x+sign*.24);near(s.state.walkPhase/Math.PI,Math.round(s.state.walkPhase/Math.PI));
  const endpoint={...s.state.position};for(let n=0;n<20;n++){s.disturb(threat);s.update(.05);assert.deepEqual(s.state.position,endpoint);}
  let last=s.state;for(let n=0;n<2500;n++){s.update(.01);const now=s.state;assert.ok(Math.abs(now.position.x-last.position.x)<.0011);last=now;}assert.ok(['walking','resting'].includes(last.phase));assert.ok(last.position.x>=position.x-1e-8&&last.position.x<=position.x+.12+1e-8,'threat removal permits the ordinary supported walk');
 }
});

test('capture and release preserve exact walking/warning/retreat/corner poses; moving reaction stops on a supported half-step',()=>{
 for(const phase of['walking','warning','retreating','cornered']){
  const s=make();if(phase!=='walking')s.disturb(front);let n=0;while(s.state.phase!==phase&&n++<2500){if(phase==='cornered')s.disturb(front);s.update(.01);}assert.ok(n<2500);const old=s.state;assert.equal(s.capture(),true);const frozen=s.state;for(let k=0;k<10;k++){assert.equal(s.disturb(behind),false);s.update(.1);}assert.deepEqual(s.state,frozen);assert.equal(s.release(),true);assert.deepEqual(s.state.position,old.position);assert.equal(s.state.heading,old.heading);assert.equal(s.state.walkPhase,old.walkPhase);near(s.state.warningBlend,old.warningBlend);s.update(.01);assert.ok(Math.abs(s.state.position.x-old.position.x)<.0011);
 }
 const s=make();while(s.state.phase!=='walking'||Math.abs(s.state.walkSpeed)<.019)s.update(.01);s.update(.07);const old=s.state;s.disturb(front);assert.deepEqual(s.state.position,old.position);near(s.state.walkSpeed,old.walkSpeed);let n=0;while(s.state.phase!=='warning'&&n++<150)s.update(.01);assert.ok(n<150);near(s.state.walkPhase/Math.PI,Math.round(s.state.walkPhase/Math.PI));near(s.state.walkSpeed,0);
});

test('dt subdivision, capped time and reset stay deterministic without random draws',t=>{
 t.mock.method(Math,'random',()=>{throw Error('No per-frame random draws');});const a=make(),b=make();a.disturb(front);b.disturb(front);for(let n=0;n<150;n++){a.update(.1);for(let k=0;k<10;k++)b.update(.01);near(a.state.position.x,b.state.position.x);near(a.state.warningBlend,b.state.warningBlend);assert.equal(a.state.phase,b.state.phase);}const c=make(),d=make();c.update(1e300);d.update(.1);assert.deepEqual(c.state,d.state);a.reset();assert.deepEqual(a.state,make().state);
});
