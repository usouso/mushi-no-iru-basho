/** CPU encounter tests: reaction timing/continuity, not rendered readability or fun. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createInsects} from '../src/insects.js';
import {CAPTURE_AWARENESS,NET_STARTLE} from '../src/capture-awareness.js';
const species=['dragonfly','cicada'];
const dt=1/120;
const position=i=>({x:i.x,y:i.y,z:i.z});
const aim=(p,i)=>({x:i.x-p.x,y:i.y-p.y,z:i.z-p.z});
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const make=(kind,options={})=>createInsects(()=>0,{homes:[[kind,0,0,1.3]],...options});
const player=(z,speed=0,quiet=false)=>({x:0,y:quiet?1.28:1.65,z,speed,quiet});
function approach(kind,speed,step=dt){
 const sim=make(kind),item=sim.items[0],quiet=speed<2;let warning=null,departure=null,firstCatchable=null;
 for(let n=1;n*step<=3.4;n++){
  const p=player(Math.max(.5,6-n*step*speed),speed,quiet);sim.update(step,p);
  if(!warning&&item.awarenessStage==='warning')warning={time:sim.time,distance:distance(p,item),blend:item.alertBlend};
  if(!departure&&item.excursion)departure={time:sim.time,distance:distance(p,item),position:position(item)};
  if(!firstCatchable&&sim.findTarget(p,aim(p,item))?.catchable)firstCatchable={time:sim.time,state:item.state};
 }
 return {sim,item,warning,departure,firstCatchable};
}

test('dash warns outside net range for at least .18s before continuous flight; normal approach also warns before range',()=>{
 for(const kind of species)for(const step of [1/120,1/60,.1]){
  const fast=approach(kind,5.4,step);
  assert.ok(fast.warning.distance>2.6&&fast.warning.blend>0,`${kind}/${step} warning`);
  assert.ok(fast.departure.distance>2.6,`${kind}/${step} departure`);
  assert.ok(fast.departure.time-fast.warning.time>=.18-1e-9,`${kind}/${step} cue duration`);
  assert.equal(fast.item.departures,1,'an active flight cannot restart when followed');
 }
 for(const kind of species){const walk=approach(kind,2.7);assert.ok(walk.warning.distance>2.6);assert.ok(walk.firstCatchable,'good aim can still catch; no immunity gate');}
});

test('same path in quiet mode reaches the original capture range; proximity is not permanent quiet immunity',()=>{
 for(const kind of species){
  const sim=make(kind),item=sim.items[0];let captured=false;
  for(let n=1;n<500;n++){
   const p=player(6-n*dt*1.05,1.05,true);sim.update(dt,p);
   if(sim.findTarget(p,aim(p,item))?.catchable){assert.equal(item.awarenessStage,'calm');assert.equal(item.departures,0);assert.equal(sim.swing(p,aim(p,item)).ok,true);captured=true;break;}
  }
  assert.ok(captured);assert.equal(item.awarenessStage,'calm');
  const close=make(kind),p=player(.2,0,true);for(let n=0;n<80;n++)close.update(dt,p);
  assert.equal(close.items[0].departures,1,'physical intrusion still starts a visible departure');
 }
});

test('stopping at a warning lets it visibly decay without flight or a one-frame reset',()=>{
 for(const kind of species){const sim=make(kind),item=sim.items[0];let p;
  for(let n=1;n<200;n++){p=player(6-n*dt*5.4,5.4);sim.update(dt,p);if(item.awarenessStage==='warning')break;}
  const alert=item.alert;p.speed=0;sim.update(dt,p);assert.ok(item.alert>0&&item.alert<alert);
  for(let n=0;n<120;n++)sim.update(dt,p);
  assert.equal(item.awarenessStage,'calm');assert.equal(item.departures,0);assert.ok(item.alertBlend<.001);
 }
});

test('actual off-axis miss startles only the nearest eligible visible insect, then waits before takeoff',()=>{
 const homes=[['morpho',0,4,1.3],['dragonfly',0,0,1.3],['cicada',.1,-.2,1.3],['cicada',0,5,1.3],['dragonfly',0,-3,1.3]];
 const sim=createInsects(()=>0,{homes}),p={x:0,y:1.3,z:2.3,speed:0},direction={x:.8,y:0,z:-.6};
 assert.equal(sim.swing(p,direction).ok,false);const item=sim.startleFromNet(p,direction);
 assert.equal(item.id,'insect-2');assert.equal(item.awarenessStage,'warning');assert.equal(item.departures,0);
 assert.equal(sim.items.filter(i=>i.awarenessStage==='warning').length,1);
 assert.equal(sim.items[0].alert,0,'the morpho behind the swing stays calm');
 for(let n=0;n<18;n++)sim.update(dt,p);assert.equal(item.departures,0);
 for(let n=0;n<12;n++)sim.update(dt,p);assert.equal(item.departures,1);
 assert.equal(sim.items[2].departures,0);assert.equal(sim.items[3].departures,0);assert.equal(sim.items[4].departures,0);
 assert.equal(NET_STARTLE.range,3.2);assert.equal(NET_STARTLE.minDot,.5);
});

test('miss filtering rejects far/behind/held/invalid/opaque targets and preserves support-endpoint LOS tolerance',async()=>{
 const box={console};vm.runInNewContext(fs.readFileSync(new URL('../assets/vendor/three.min.js',import.meta.url),'utf8'),box);globalThis.window={THREE:box.THREE};
 const {createCaptureVisibility}=await import('../src/capture-visibility.js'),T=box.THREE;
 const p={x:0,y:1.3,z:2.3},direction={x:.8,y:0,z:-.6};
 for(const z of [1,.05]){
  const plane=new T.Mesh(new T.PlaneGeometry(2,3),new T.MeshBasicMaterial({side:T.DoubleSide}));plane.position.set(0,1.3,z);
  const sim=make('cicada',{hasLineOfSight:createCaptureVisibility([plane])});
  assert.equal(!!sim.startleFromNet(p,direction),z===.05,'only final support tolerance is transparent');
  if(z===1){for(let n=0;n<120;n++)sim.update(dt,{...p,speed:5.4});assert.equal(sim.items[0].alert,0);}
 }
 for(const answer of [false,undefined,null,1])assert.equal(make('dragonfly',{hasLineOfSight:()=>answer}).startleFromNet(p,direction),null);
 const sim=make('dragonfly');for(const [origin,dir]of [[{...p,z:3.201},direction],[p,{x:0,y:0,z:1}],[p,{x:0,y:0,z:0}],[null,direction],[{...p,x:NaN},direction],[p,{x:NaN,y:0,z:1}]])assert.equal(sim.startleFromNet(origin,dir),null);
 assert.equal(sim.swing(p,aim(p,sim.items[0])).ok,true);const before=structuredClone(sim.items);assert.equal(sim.startleFromNet(p,direction),null);assert.deepEqual(sim.items,before);
 sim.reset();assert.equal(sim.items[0].awarenessStage,'calm');assert.equal(sim.items[0].alertBlend,0);assert.equal(sim.items[0].netStartleOrigin,null);
});

test('one flight stays finite and continuous, returns to the support, permits a quiet retry and preserves release position',()=>{
 for(const kind of species){
  const sim=make(kind),item=sim.items[0],p={x:0,y:1.3,z:2.3,speed:0},direction={x:.8,y:0,z:-.6};
  sim.startleFromNet(p,direction);let previous=position(item),maxTravel=0,departed=false,landed=false;
  for(let n=0;n<1100;n++){
   sim.update(dt,p);const now=position(item);assert.ok(Object.values(now).every(Number.isFinite));assert.ok(distance(now,previous)<.06,'no teleport');previous=now;maxTravel=Math.max(maxTravel,distance(now,item.home));
   if(item.excursion){departed=true;assert.equal(item.departures,1);assert.equal(sim.startleFromNet(p,direction),null,'cannot rewind flight');}
   if(departed&&!item.excursion&&item.resting){landed=true;break;}
  }
  assert.ok(landed&&maxTravel>1);assert.ok(distance(item,item.home)<.055);assert.equal(item.awarenessStage,'settling');
  const quiet=player(2.3,1.05,true);assert.equal(sim.swing(quiet,aim(quiet,item)).ok,true);const caught=position(item);sim.update(.1,quiet);assert.deepEqual(position(item),caught);
  assert.equal(sim.release(quiet).id,item.id);assert.deepEqual(position(item),caught);assert.equal(item.state,'released');
  const start=structuredClone(item.excursion);sim.update(dt,quiet);assert.equal(item.excursion.startedAt,start.startedAt);assert.ok(distance(item,caught)<.06);
 }
});

test('zero-time updates freeze warning and flight; no RNG or repeated impulse is needed',()=>{
 for(const kind of species){const sim=make(kind),item=sim.items[0],p={x:0,y:1.3,z:2.3,speed:0};
  sim.startleFromNet(p,{x:.8,y:0,z:-.6});const before=structuredClone(item);
  for(let n=0;n<20;n++)sim.update(0,p);assert.deepEqual(item,before);assert.equal(sim.time,0);
  for(let n=0;n<40;n++)sim.update(dt,p);assert.ok(item.excursion);const flying=structuredClone(item),time=sim.time;
  for(let n=0;n<20;n++)sim.update(0,p);assert.deepEqual(item,flying);assert.equal(sim.time,time);
 }
 assert.deepEqual(Object.keys(CAPTURE_AWARENESS).sort(),['butterfly','morpho',...species].sort());
});

test('grasshopper remains outside wing-warning and net-startle changes, with its supported calm capture intact',()=>{
 const home={x:0,y:.05,z:0},points=[home,{x:1,y:.05,z:.3},{x:-.5,y:.05,z:.9}];
 const sim=createInsects(()=>0,{homes:[['grasshopper',0,0,.05]],grasshopperSupports:[{home,points}]}),item=sim.items[0],p={x:0,y:.55,z:2.3,speed:0,quiet:true},offAxis={x:.8,y:0,z:-.6};
 assert.equal(sim.swing(p,offAxis).ok,false);assert.equal(sim.startleFromNet(p,offAxis),null);
 for(let n=0;n<60;n++)sim.update(dt,p);assert.equal(item.departures,0);assert.equal(item.alert,0);assert.equal(item.awarenessStage,undefined);
 assert.equal(sim.swing(p,aim(p,item)).ok,true);
});
