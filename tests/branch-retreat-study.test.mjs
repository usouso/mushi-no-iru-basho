/** Pure local branch response. No rendered screen, biological distances or save I/O. */
import test from 'node:test';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {createMetalliferStudy} from '../src/metallifer-study.js';
import {createRhinoStudy} from '../src/rhino-study.js';import {createStagStudy} from '../src/stag-study.js';
const specs=[{species:'rhino',create:createRhinoStudy,warning:.30,peak:.14,range:.40},{species:'stag',create:createStagStudy,warning:.40,peak:.18,range:.48}];
const position={x:0,y:1.3,z:0},bounds={min:-.60,max:.30},front={x:0,z:3},back={x:0,z:-3},near=(a,b,e=1e-9)=>assert.ok(Math.abs(a-b)<e,`${a} != ${b}`);
function build(spec,more={}){return spec.create({position,retreatBounds:bounds,...more});}
function frames(s,seconds,stimulus=null,dt=.02){for(let n=0;n<Math.round(seconds/dt);n++){if(stimulus)s.disturb(stimulus);s.update(dt);}}
function legacySeries(create){const result=[];for(const seed of[null,1234]){const s=create({motionSeed:seed,scale:1.15,position});for(let i=0;i<1600;i++){if([110,690,1190].includes(i))s.disturb();if(i===400)s.capture();if(i===450)s.release();if(i===1000)s.reset();s.update(.02);if(i%5===0)result.push(s.state);}}return createHash('sha256').update(JSON.stringify(result)).digest('hex');}

test('unspecified bounds keep exact pre-existing Rhino/Stag series, including the Stag path reused by Metallifer',()=>{
 assert.equal(legacySeries(createMetalliferStudy),'2e4c319b8c18586edde1bb452565a19d521d31ff3dd5a2e4755cc9d8b138ac05');assert.equal(legacySeries(createRhinoStudy),'80aa9d9052f7fb39f7bd9dde0c777b890bdeda32bb76dc2c0e5d17e318f434d8');assert.equal(legacySeries(createStagStudy),'83edb13caed22250ea1448762ee9c854c240196d78507f26709b30a15a2dc005');
});

test('bounded mode validates support limits, detaches snapshots and leaves invalid/zero time unchanged',()=>{
 for(const spec of specs){for(const bad of[null,{}, {min:1,max:2},{min:-1,max:-.1},{min:-4,max:.3},{min:0,max:0},{min:-.6,max:NaN},{min:-.6,max:.3,other:1}])assert.throws(()=>build(spec,{retreatBounds:bad}),TypeError);
  const s=build(spec),before=s.state;s.state.position.x=900;assert.deepEqual(s.state,before);for(const dt of[0,-1,NaN,Infinity])s.update(dt);assert.deepEqual(s.state,before);assert.equal(s.disturb({x:NaN,z:1}),false);assert.equal(s.disturb(null),false);assert.deepEqual(s.state,before);
 }
});

test('warning precedes a signed, accelerated retreat away from each side without resetting on repeated stimulation',()=>{
 for(const spec of specs)for(const scale of[1,1.15])for(const stimulus of[front,back]){
  const s=build(spec,{scale}),sign=stimulus===front?-1:1;assert.equal(s.disturb(stimulus),true);let previous=s.state,warningTime=0,sawRetreat=false,maxSpeed=0;
  for(let i=0;i<280;i++){assert.equal(s.disturb(stimulus),false);s.update(.02);const now=s.state;if(previous.phase==='warning')warningTime+=.02;if(now.phase==='retreating'){sawRetreat=true;assert.ok(warningTime>=spec.warning-1e-8);assert.equal(Math.sign(now.walkSpeed)||sign,sign);}assert.ok(now.position.z>=bounds.min-1e-8&&now.position.z<=bounds.max+1e-8);assert.ok(Math.abs(now.position.z-previous.position.z)<=spec.peak*scale*.02+1e-8);assert.ok(now.warningBlend>=0&&now.warningBlend<=1);maxSpeed=Math.max(maxSpeed,Math.abs(now.walkSpeed));previous=now;}
  assert.ok(sawRetreat);assert.ok(maxSpeed>.09);assert.ok(maxSpeed<=spec.peak*scale+1e-8);assert.ok(sign*s.state.position.z>.1);
 }
});

test('walking disturbance brakes at the next supported half-step before warning with no positional or velocity reset',()=>{
 for(const spec of specs){const s=build(spec);while(s.state.phase!=='walking'||Math.abs(s.state.walkSpeed)<.019)s.update(.02);s.update(.13);const before=s.state;assert.equal(s.disturb(front),true);near(s.state.position.z,before.position.z);near(s.state.walkSpeed,before.walkSpeed);let previous=s.state,steps=0;while(s.state.phase!=='warning'&&steps++<150){s.update(.01);const now=s.state;assert.ok(now.position.z>=previous.position.z-1e-10);assert.ok(Math.abs(now.walkSpeed)<=Math.abs(previous.walkSpeed)+1e-9);previous=now;}assert.ok(steps<150);near(s.state.walkPhase/Math.PI,Math.round(s.state.walkPhase/Math.PI));near(s.state.walkSpeed,0);}
});

test('fresh threat holds a corner safely; circling opens the opposite route and ending stimulus allows a continuous return',()=>{
 for(const spec of specs){const s=build(spec,{retreatBounds:{min:-.08,max:.16}});frames(s,5,front);assert.equal(s.state.phase,'cornered');near(s.state.position.z,-.08);const stopped=s.state.position.z;frames(s,2,front);near(s.state.position.z,stopped);
  frames(s,3,back);assert.ok(s.state.position.z>stopped+.05,'new threat direction permits escape along the existing axis');let prev=s.state.position.z;for(let i=0;i<1400;i++){s.update(.02);const now=s.state;assert.ok(Math.abs(now.position.z-prev)<.0043);assert.ok(now.position.z>=-.08-1e-9&&now.position.z<=.16+1e-9);prev=now.position.z;}assert.ok(s.state.position.z>=0&&s.state.position.z<=.12+1e-9);
 }
});

test('capture freezes walking, warning, retreat and corner states; release continues the same identity and position',()=>{
 for(const spec of specs)for(const target of['walking','warning','retreating','cornered']){
  const s=build(spec,{retreatBounds:{min:-.08,max:.16}});if(target!=='walking')s.disturb(front);let limit=0;while(s.state.phase!==target&&limit++<2000){if(target==='cornered')s.disturb(front);s.update(.02);}assert.ok(limit<2000);const old=s.state;assert.equal(s.capture(),true);assert.equal(s.capture(),false);const captured=s.state;for(let i=0;i<100;i++){assert.equal(s.disturb(back),false);s.update(.1);}assert.deepEqual(s.state,captured);assert.equal(s.release(),true);near(s.state.position.z,old.position.z);assert.equal(s.state.phase,old.phase);assert.equal(s.state.id,old.id);s.update(.01);assert.ok(Math.abs(s.state.position.z-old.position.z)<.0021);
 }
});

test('analytic fixed-seed progression agrees under dt splitting and reset without frame random draws',()=>{
 for(const spec of specs){const a=build(spec,{motionSeed:987}),b=build(spec,{motionSeed:987});a.disturb(front);b.disturb(front);for(let i=0;i<100;i++){a.update(.1);for(let k=0;k<10;k++)b.update(.01);near(a.state.position.z,b.state.position.z,1e-8);near(a.state.warningBlend,b.state.warningBlend,1e-8);assert.equal(a.state.phase,b.state.phase);}a.reset();const c=build(spec,{motionSeed:987});assert.deepEqual(a.state,c.state);frames(a,20);frames(c,20);assert.deepEqual(a.state,c.state);}
});
