/** Pure state only. No renderer, net integration, saves, real observer UX or biological timing claim. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRhinoFlightStudy,RHINO_FLIGHT_TIMING as T} from '../src/rhino-flight-study.js';
import {createRhinoStudy} from '../src/rhino-study.js';
const options={position:{x:2,y:.8,z:3},heading:Math.PI/2,retreatBounds:{min:-.4,max:.4},motionSeed:42};
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z),angle=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
const near=(a,b,tolerance=1e-9)=>assert.ok(Math.abs(a-b)<=tolerance,`${a} ≈ ${b} (±${tolerance})`);
const airborne=s=>['preparing-flight','flying','landing'].includes(s.phase);
function finite(s){for(const k of ['time','heading','pitch','walkPhase','walkSpeed'])assert.ok(Number.isFinite(s[k]),k);for(const k of ['x','y','z'])assert.ok(Number.isFinite(s.position[k]));if(s.flightPose)for(const value of Object.values(s.flightPose))assert.ok(Number.isFinite(value));}
function launch(model,source={x:1,z:4},dt=.01){assert.equal(model.disturb(source),true);let previous=model.state;for(let i=0;i<200;i++){model.update(dt);const s=model.state;if(s.phase==='preparing-flight')return {before:previous,start:s};previous=s;}assert.fail('warning must reach preparation');}

test('supported warning overlaps stationary opening; bounded flight and landing restore exact support/walk phase',()=>{
 assert.deepEqual(T,{prepare:.65,flight:5.7,landing:.65,cooldown:8});assert.ok(Object.isFrozen(T));
 for(const scale of [1,1.15]){
  const model=createRhinoFlightStudy({...options,scale}),{before,start}=launch(model);assert.equal(before.phase,'warning');near(start.time,.3);const origin=start.position,phase=start.walkPhase;
  let prior=start,ended=false,seen=new Set([start.phase]),maxHeight=0;
  for(let i=0;i<720;i++){
   model.update(.01);const s=model.state;finite(s);seen.add(s.phase);assert.ok(distance(s.position,prior.position)<.04,'continuous position');assert.ok(Math.abs(angle(s.heading,prior.heading))<.06,'continuous physical heading, modulo full turns');assert.ok(Math.abs(s.warningBlend-prior.warningBlend)<.07,'continuous warning handoff');
   if(airborne(s)){near(s.walkPhase,phase);assert.equal(s.walkSpeed,0);if(s.phase==='preparing-flight'){assert.deepEqual(s.position,origin);near(s.heading,start.heading);}maxHeight=Math.max(maxHeight,s.position.y-origin.y);}
   else{assert.deepEqual(s.position,origin);near(s.walkPhase,phase);near(s.time-start.time,T.prepare+T.flight+T.landing-.3,1e-8);ended=true;break;}
   prior=s;
  }
  assert.equal(ended,true);for(const phase of ['preparing-flight','flying','landing'])assert.ok(seen.has(phase));assert.ok(maxHeight>=.8&&maxHeight<1,'bounded vertical departure');
 }
});

test('flight departs from multiple fixed observer positions rather than hovering at the branch',()=>{
 const observations=[];
 for(const observer of [{x:1,y:.8,z:3},{x:3,y:.8,z:3},{x:2,y:.8,z:2},{x:2,y:.8,z:4},{x:1,y:.8,z:4}]){
  const model=createRhinoFlightStudy(options);launch(model,observer);const origin=model.state.position,initial=distance(origin,observer);let maxDistance=initial,maxDeparture=0,farSeconds=0;
  for(let i=0;i<700;i++){model.update(.01);const s=model.state;finite(s);if(s.phase==='flying'){const d=distance(s.position,observer);maxDistance=Math.max(maxDistance,d);maxDeparture=Math.max(maxDeparture,distance(s.position,origin));if(d>initial+.75)farSeconds+=.01;}}
  assert.ok(maxDistance>initial+.8,'clear increase in observer distance');assert.ok(maxDeparture>2.2&&maxDeparture<2.7,'bounded flight arc');assert.ok(farSeconds>.7,'departure lasts longer than an instantaneous position jump');observations.push({observer,initial,maxDistance,maxDeparture,farSeconds});
 }
 // Distances are world-space state evidence, not screen framing/readability.
 assert.equal(observations.length,5);
});

test('capture/release and retained-equivalent freeze pause every flight channel; repeated calls and reset stay deterministic',()=>{
 for(const delay of [0,.4,2,6.5]){
  const model=createRhinoFlightStudy(options);launch(model);for(let i=0;i<Math.round(delay/.01);i++)model.update(.01);assert.ok(airborne(model.state));
  assert.equal(model.capture(),true);assert.equal(model.capture(),false);const frozen=model.state;for(let i=0;i<100;i++){model.update(.1);assert.equal(model.disturb({x:1,z:4}),false);}assert.deepEqual(model.state,frozen);
  assert.equal(model.release(),true);assert.equal(model.release(),false);assert.equal(model.state.caught,false);near(model.state.time,frozen.time);assert.deepEqual(model.state.position,frozen.position);model.update(.01);near(model.state.time,frozen.time+.01);
  model.capture();model.reset();assert.deepEqual(model.state,createRhinoFlightStudy(options).state);const a=launch(model).start,b=launch(createRhinoFlightStudy(options)).start;assert.deepEqual(a,b);
 }
});

test('invalid dt/options and disturbances are safe; large dt clamps to .1 and detached state cannot corrupt the study',()=>{
 const a=createRhinoFlightStudy(options),b=createRhinoFlightStudy(options);launch(a);launch(b);const before=a.state;
 for(const dt of [NaN,Infinity,-Infinity,-1,0,undefined,null,'0.1'])a.update(dt);assert.deepEqual(a.state,before);a.update(99);b.update(.1);assert.deepEqual(a.state,b.state);
 const detached=a.state;detached.position.x=999;detached.flightPose.unfold=99;assert.notEqual(a.state.position.x,999);assert.notEqual(a.state.flightPose.unfold,99);
 for(const source of [null,undefined,{}, {x:NaN,z:0},{x:0,z:Infinity},{x:10001,z:0}]){const model=createRhinoFlightStudy(options),prior=model.state;assert.equal(model.disturb(source),false);assert.deepEqual(model.state,prior);}
 for(const bad of [{scale:.99},{scale:1.151},{heading:NaN},{motionSeed:-1},{position:{x:0,y:0,z:Infinity}},{retreatBounds:null},{retreatBounds:{min:0,max:0}}])assert.throws(()=>createRhinoFlightStudy({...options,...bad}),TypeError);
});

test('without supported retreat bounds every original study state and interaction remains unchanged',()=>{
 for(const scale of [1,1.15]){
  const plain={position:options.position,heading:options.heading,scale,motionSeed:42},base=createRhinoStudy(plain),wrapped=createRhinoFlightStudy(plain);
  for(let i=0;i<600;i++){
   if([30,230].includes(i))assert.equal(wrapped.disturb({x:1,z:4}),base.disturb({x:1,z:4}));if(i===90){assert.equal(wrapped.capture(),base.capture());}if(i===110){assert.equal(wrapped.release(),base.release());}if(i===400){base.reset();wrapped.reset();}
   base.update(.05);wrapped.update(.05);const original=base.state,actual=wrapped.state;near(actual.time,original.time);delete actual.time;delete original.time;assert.deepEqual(actual,original);assert.equal(actual.flightPose,undefined);
  }
 }
});

test('cooldown blocks immediate retrigger; after pressure withdraws a new warning can launch a second complete flight',()=>{
 const model=createRhinoFlightStudy(options),first=launch(model).start;let ended=null,second=null;
 for(let i=0;i<2400;i++){
  // First departure completes; withdraw until well after the 8-second cooldown.
  if(model.state.time>=18)model.disturb({x:1,z:4});const prior=model.state;model.update(.01);const s=model.state;
  if(airborne(prior)&&!airborne(s)&&ended===null)ended=s.time;
  if(!airborne(prior)&&s.phase==='preparing-flight'){assert.ok(ended!==null);assert.ok(s.time>=ended+T.cooldown);second=s.time;break;}
 }
 assert.ok(second!==null,'new pressure must not leave flight permanently stuck');assert.ok(second>first.time+T.prepare+T.flight+T.landing+T.cooldown);
 for(let i=0;i<700;i++)model.update(.01);assert.equal(airborne(model.state),false);
});

test('sustained pressure at a bounded corner relaunches only after cooldown and a full visible warning overlapping staged opening',()=>{
 const model=createRhinoFlightStudy(options),source={x:1,z:4};let prior=model.state,starts=0,firstEnd=null,renewedWarning=null,secondStart=null;
 for(let i=0;i<2200;i++){
  model.disturb(source);model.update(.01);const s=model.state;finite(s);
  assert.ok(Math.abs(s.warningBlend-prior.warningBlend)<.07,'head warning stays continuous');
  if(airborne(prior)&&!airborne(s)&&s.phase!=='warning'&&firstEnd===null)firstEnd=s.time;
  if(firstEnd!==null&&s.phase==='warning'&&s.flightPose){
   renewedWarning??=s.time;assert.ok(s.time>=firstEnd+T.cooldown-1e-8);assert.ok(s.flightPose.elytra>=0&&s.flightPose.elytra<=1);assert.ok(s.flightPose.unfold>=0&&s.flightPose.unfold<=1);if(s.flightPose.elytra<1-1e-10)assert.equal(s.flightPose.unfold,0,'membrane waits for full shell opening');if(prior.phase==='warning'&&prior.flightPose){assert.ok(s.flightPose.elytra>=prior.flightPose.elytra);assert.ok(s.flightPose.unfold>=prior.flightPose.unfold);}assert.equal(s.flightPose.flapAmplitude,0);assert.equal(s.walkSpeed,0);
  }
  if(prior.phase!=='preparing-flight'&&s.phase==='preparing-flight'){
   starts++;if(starts===2){secondStart=s.time;assert.ok(renewedWarning!==null,'second flight cannot skip warning');near(secondStart-renewedWarning,.3,1e-8);assert.ok(s.warningBlend>.99);break;}
  }
  prior=s;
 }
 assert.equal(starts,2,'continued corner pressure must not permanently stick after the first flight');assert.ok(secondStart>firstEnd+T.cooldown);
});

test('one isolated stimulus cannot trigger an automatic second flight after cooldown',()=>{
 const model=createRhinoFlightStudy(options);launch(model);let newStarts=0,prior=model.state;
 for(let i=0;i<3000;i++){model.update(.01);const s=model.state;if(prior.phase!=='preparing-flight'&&s.phase==='preparing-flight')newStarts++;finite(s);prior=s;}
 assert.equal(newStarts,0);assert.equal(airborne(model.state),false);
});
