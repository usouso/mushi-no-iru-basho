/** Parallel supported warning/opening: game timings, not measured flight. */
import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs';import{createHash}from'node:crypto';
import{createRhinoFlightStudy as create,RHINO_FLIGHT_TIMING as T}from'../src/rhino-flight-study.js';import{createRhinoStudy}from'../src/rhino-study.js';import{sampleRhinoPose}from'../src/rhino-kinematics.js';
const read=n=>fs.readFileSync(new URL('../src/'+n+'.js',import.meta.url),'utf8').replace(/\?v=[^'"\s]+/g,''),hash=s=>createHash('sha256').update(s).digest('hex'),data=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
function oldCore(){return read('branch-retreat-study').replace(',exposeTransitions=false','').replace(" if(typeof exposeTransitions!=='boolean')throw new TypeError('Invalid transition exposure');\n",'').replace(' const api={update,disturb,capture(){',' return{update,disturb,capture(){').replace(/\n \/\/ Opt-in timing metadata only:[\s\S]*?\n return api;/,'');}
function oldRhino(){return read('rhino-study').replace(',exposeTransitions=false','').replace(" if(typeof exposeTransitions!=='boolean')throw new TypeError('Invalid transition exposure');\n",'').replace('createBranchRetreatStudy({exposeTransitions,','createBranchRetreatStudy({');}
const oldFactory=await import(data(oldRhino().replace("'./branch-retreat-study.js'",JSON.stringify(data(oldCore()))).replace("'./rhino-kinematics.js'",JSON.stringify(new URL('../src/rhino-kinematics.js',import.meta.url).href))));
const options={position:{x:2,y:.8,z:3},heading:Math.PI/2,scale:1.15,retreatBounds:{min:-.4,max:.4},motionSeed:42},source={x:3,z:4},distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z),advance=(s,seconds,dt=.1)=>{const end=s.state.time+seconds;while(end-s.state.time>1e-11)s.update(Math.min(dt,end-s.state.time));},feet=s=>sampleRhinoPose(s).legs.filter(l=>l.contact).length;
const near=(a,b,e=1e-9)=>assert.ok(Math.abs(a-b)<e,`${a} != ${b}`);

test('opt-in metadata is detached and read-only; default/false API, states and exact old source stay unchanged',()=>{
 assert.equal(hash(oldCore()),'2ec571824c46b7bacd31d712863042a2a605a0adcaf8a1f8ee2d3589859a7564');assert.equal(hash(oldRhino()),'352cc9f04ff8893f7034b667d7c1dc01e680a8be697d149c05ee40024569ff88');
 for(const cfg of[options,{position:options.position,heading:options.heading,scale:1.15,motionSeed:42}]){
  const old=oldFactory.createRhinoStudy(cfg),a=createRhinoStudy(cfg),b=createRhinoStudy({...cfg,exposeTransitions:false}),meta=createRhinoStudy({...cfg,exposeTransitions:true});assert.deepEqual(Object.keys(a),Object.keys(old));assert.deepEqual(Object.keys(b),Object.keys(old));assert.equal('transitionInfo'in a,false);assert.equal('transitionInfo'in b,false);
  for(let i=0;i<600;i++){for(const s of[old,a,b,meta]){if([20,250].includes(i))s.disturb(source);if(i===60)s.capture();if(i===70)s.release();s.update(.07);}assert.deepEqual(a.state,old.state);assert.deepEqual(b.state,old.state);assert.deepEqual(meta.state,old.state);if(meta.transitionInfo){const d=meta.transitionInfo;for(const v of Object.values(d))assert.ok(v===null||Number.isFinite(v)&&v>=0);d.remaining=999;assert.notEqual(meta.transitionInfo.remaining,999);}}
 }
 const s=createRhinoStudy({...options,exposeTransitions:true});assert.throws(()=>s.transitionInfo={},TypeError);assert.throws(()=>createRhinoStudy({...options,exposeTransitions:1}),TypeError);
});

test('one unchanged wing clock overlaps .30 warning: .25 shell, .65 launch, original flight and landing durations',()=>{
 assert.deepEqual(T,{prepare:.65,flight:5.7,landing:.65,cooldown:8});const results=[];
 for(const dt of[.01,1/60,.07,.1]){const s=create(options);assert.equal(s.disturb(source),true);const origin={...s.state.position};assert.equal(s.state.phase,'warning');assert.equal(s.state.flightPose.elytra,0);
  advance(s,.125,dt);near(s.state.flightPose.elytra,.5);assert.equal(s.state.flightPose.unfold,0);assert.equal(feet(s.state),6);advance(s,.125,dt);near(s.state.flightPose.elytra,1);near(s.state.flightPose.unfold,0);assert.deepEqual(s.state.position,origin);advance(s,.05,dt);assert.equal(s.state.phase,'preparing-flight');near(s.state.warningBlend,1);near(s.state.flightPose.unfold,.04296875);
  advance(s,.35,dt);assert.equal(s.state.phase,'flying');near(s.state.flightPose.unfold,1);near(distance(s.state.position,origin),0);advance(s,.05,dt);assert.ok(distance(s.state.position,origin)>.003);results.push({dt,atPoint7:distance(s.state.position,origin)});
  advance(s,5.65,dt);assert.equal(s.state.phase,'landing');near(distance(s.state.position,origin),0);advance(s,.65,dt);assert.equal(s.state.flightPose,undefined);assert.deepEqual(s.state.position,origin);assert.equal(feet(s.state),6);assert.ok(Math.abs(s.state.walkSpeed)<1e-12);near(s.state.time,7);
 }for(const r of results)near(r.atPoint7,results[0].atPoint7,1e-12);console.log('Rhino parallel timing',JSON.stringify(results));
});

test('non-aligned walking brake reaches the same six-foot boundary before any shell opening; no foot or root jump at warning handoff',()=>{
 const observations=[];for(const dt of[1/60,.07,.1]){const s=create(options);for(let n=0;s.state.phase!=='walking'&&n<1200;n++)s.update(1/60);assert.equal(s.state.phase,'walking');s.update(.001);const before=s.state;assert.ok(Math.abs(before.walkSpeed)>0);assert.equal(s.disturb(source),true);assert.equal(s.state.flightPose,undefined);let elapsed=0,origin=null,phase=null;
  for(let n=0;n<40;n++){const a=s.state;s.update(dt);elapsed+=dt;const b=s.state;assert.ok(distance(a.position,b.position)<=.06*dt+1e-9);if(b.flightPose){origin={...b.position};phase=b.walkPhase;assert.equal(feet(b),6);assert.equal(b.walkSpeed,0);assert.ok(Math.abs(b.walkPhase/Math.PI-Math.round(b.walkPhase/Math.PI))<1e-9);break;}assert.equal(b.phase,'walking');}
  assert.ok(origin&&elapsed<=.6+dt+1e-9);for(let n=0;s.state.phase!=='flying'&&n<80;n++){assert.deepEqual(s.state.position,origin);assert.equal(s.state.walkPhase,phase);assert.equal(feet(s.state),6);s.update(.01);}assert.equal(s.state.phase,'flying');observations.push({dt,warningSeenAfter:elapsed,stopDistance:distance(before.position,origin),phase});
 }console.log('Rhino grounded handoff',JSON.stringify(observations));
});

test('capture and pause freeze every overlapping channel; release is exact and repeated pressure never restarts the active clock',()=>{
 for(const age of[.10,.40,1.0,6.6]){const s=create(options),twin=create(options);s.disturb(source);twin.disturb(source);advance(s,age,.01);advance(twin,age,.01);const before=s.state;assert.equal(s.capture(),true);assert.equal(s.capture(),false);const held=s.state;for(const dt of[0,-1,NaN,Infinity,.1,99])s.update(dt);assert.deepEqual(s.state,held);assert.equal(s.disturb({x:-1,z:2}),false);assert.equal(s.release(),true);assert.deepEqual(s.state,before);for(let i=0;i<8;i++){assert.equal(s.disturb({x:-1,z:2}),false);s.update(.01);twin.update(.01);assert.deepEqual(s.state,twin.state);}const detached=s.state;detached.flightPose.elytra=99;assert.notEqual(s.state.flightPose.elytra,99);s.reset();assert.deepEqual(s.state,create(options).state);}
});

test('sustained corner pressure observes eight-second cooldown then the same overlapping sequence; isolated stimuli do not relaunch',()=>{
 const s=create(options);let prior=s.state,starts=[],ends=[],previousBlend=0;
 for(let n=0;n<1800;n++){s.disturb(source);const immediate=s.state;if(immediate.flightPose&&!prior.flightPose)starts.push({time:immediate.time,pose:immediate.flightPose});s.update(.02);const b=s.state;if(b.flightPose&&!immediate.flightPose)starts.push({time:b.time,pose:b.flightPose});if(immediate.flightPose&&!b.flightPose)ends.push(b.time);assert.ok(Math.abs(b.warningBlend-previousBlend)<.13);previousBlend=b.warningBlend;prior=b;if(starts.length===2&&b.phase==='flying')break;}
 assert.equal(starts.length,2);assert.equal(ends.length,1);assert.ok(starts[1].time>=ends[0]+8-1e-8);assert.ok(starts[1].pose.elytra<.03);assert.equal(starts[1].pose.unfold,0);assert.equal(feet(s.state),6);
 const solo=create(options);solo.disturb(source);let newFlights=0,had=true;for(let n=0;n<1500;n++){solo.update(.02);const now=!!solo.state.flightPose;if(now&&!had)newFlights++;had=now;}assert.equal(newFlights,0);
 const plain={position:options.position,heading:options.heading,scale:1.15,motionSeed:42},a=create(plain),b=createRhinoStudy(plain);for(let n=0;n<300;n++){if(n===20){a.disturb(source);b.disturb(source);}a.update(.05);b.update(.05);assert.deepEqual(a.state,b.state);assert.equal(a.state.flightPose,undefined);}
});
