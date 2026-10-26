/** Fixed-axis thirty-degree support; pure timing is game tuning, not measured
 * wild climbing/defence. No actual renderer or human motion approval. */
import test from 'node:test';import assert from 'node:assert/strict';
import {createFiveHornStudy,FIVE_HORN_MOTION as M} from '../src/five-horn-study.js';
import {FIVE_HORN_DIMENSIONS as D} from '../src/five-horn-kinematics.js';
const rise=Math.tan(Math.PI/6)/2,home={x:5.75,y:1,z:6},axis=[{x:5.25,y:1-rise,z:6},{x:6.25,y:1+rise,z:6}],low={x:3,y:1.65,z:6},high={x:8,y:1.65,z:6},make=o=>createFiveHornStudy({home,axis,...o}),distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z),near=(a,b,e=1e-8)=>assert.ok(Math.abs(a-b)<e,`${a} != ${b}`),appearance=s=>({position:s.position,heading:s.heading,pitch:s.pitch,walkPhase:s.walkPhase,warningBlend:s.warningBlend,headLift:s.headLift});
function advance(s,n,source=null,dt=.01){for(let i=0;i<n;i++){if(source)s.disturb(source);s.update(dt);}}

test('finite detached midpoint/axis support accepts thirty degrees, rejects unsafe slopes and ignores invalid time/source',()=>{
 const s=make(),initial=s.state;assert.equal(initial.id,'fivehorn-study-1');near(initial.pitch,-Math.PI/6);near(initial.heading,Math.PI/2);near(Math.hypot(...Object.values(initial.normal)),1);for(const key of['sizePermille','encounterId','motionSeed'])assert.equal(initial[key],undefined);s.state.position.x=999;s.state.normal.y=0;assert.deepEqual(s.state,initial);
 for(const dt of[0,-1,NaN,Infinity,undefined])s.update(dt);assert.deepEqual(s.state,initial);
 for(const v of[null,{}, {x:NaN,z:6},{x:1e10,z:6},{get x(){assert.fail('getter must not execute');},z:6}])assert.equal(s.disturb(v),false);
 for(const o of[{home:null},{home:{...home,y:Infinity}},{home:{...home,z:6.1}},{home:{...home,extra:1}},{axis:[]},{axis:[axis[0],axis[0]]},{axis:[...axis].reverse()},{axis:[{...axis[0],y:0},{...axis[1],y:2}]},{axis:[axis[0],axis[1],axis[1]]},{axis:[axis[0],{...axis[1],get x(){assert.fail('getter must not execute');}}]}])assert.throws(()=>make(o),/Invalid fivehorn slope support/);
});

test('warn then bounded uphill/downhill movement uses signed arc gait without rotation, jump or permanent retreat',()=>{
 for(const source of[low,high]){const s=make(),sign=source===low?1:-1;s.disturb(source);let previous=s.state,firstMove=null,peak=0;
  for(let i=0;i<1300;i++){s.disturb(source);s.update(.01);const a=s.state,step=distance(a.position,previous.position);if(step>1e-9&&firstMove===null)firstMove=a.time;assert.ok(step<=M.retreatSpeed*.01+1e-9);assert.ok(sign*(a.position.x-previous.position.x)>=-1e-10);assert.ok(a.position.x>=axis[0].x&&a.position.x<=axis[1].x);near(a.position.y-home.y,(a.position.x-home.x)*Math.tan(Math.PI/6));near(a.walkPhase,Math.sign(a.position.x-home.x)*distance(a.position,home)/D.cycleDistance*Math.PI*2);assert.equal(a.heading,previous.heading);assert.equal(a.pitch,previous.pitch);peak=Math.max(peak,Math.abs(a.walkSpeed));previous=a;}
  assert.ok(firstMove>=M.warningSeconds);assert.ok(peak>.1&&peak<=M.retreatSpeed+1e-10);assert.equal(s.state.phase,'cornered');near(s.state.walkPhase/Math.PI,Math.round(s.state.walkPhase/Math.PI));const end=s.state;advance(s,400,source===low?high:low);assert.ok(sign*(s.state.position.x-end.position.x)<-.1,'circling the threat opens the opposite supported direction');advance(s,4500);assert.ok(['resting','walking'].includes(s.state.phase));assert.ok(s.state.position.x>=home.x-1e-8&&s.state.position.x<=home.x+.12*Math.cos(Math.PI/6)+1e-8);
 }
 const a=make(),b=make();a.disturb({...low,y:1000});b.disturb({...low,y:-1000});advance(a,250);advance(b,250);assert.deepEqual(a.state,b.state,'eye height does not reverse the horizontal threat');
});

test('capture/release is continuous in each phase; subdivision, cap and reset consume no random values',t=>{
 t.mock.method(Math,'random',()=>{throw Error('no frame randomness');});
 for(const phase of['resting','walking','warning','retreating','cornered']){const s=make();if(!['resting','walking'].includes(phase))s.disturb(high);let steps=0;while(s.state.phase!==phase&&steps++<1800){if(phase==='cornered')s.disturb(high);s.update(.01);}assert.ok(steps<1800);if(['walking','retreating'].includes(phase))s.update(.07);const before=appearance(s.state);assert.equal(s.capture(),true);const frozen=s.state;for(let i=0;i<10;i++){s.update(.1);assert.equal(s.disturb(low),false);}assert.deepEqual(s.state,frozen);assert.equal(s.release(),true);assert.deepEqual(appearance(s.state),before);s.update(.01);assert.ok(distance(s.state.position,before.position)<=M.retreatSpeed*.01+1e-9);}
 const a=make(),b=make();a.disturb(high);b.disturb(high);for(let n=0;n<140;n++){a.update(.1);advance(b,10);near(distance(a.state.position,b.state.position),0);near(a.state.warningBlend,b.state.warningBlend);assert.equal(a.state.phase,b.state.phase);}a.reset();assert.deepEqual(a.state,make().state);const c=make(),d=make();c.update(1e300);d.update(.1);assert.deepEqual(c.state,d.state);
});
