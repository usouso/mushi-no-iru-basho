/** Morpho-only encounter integration. CPU state, not GPU readability or biology. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createInsects} from '../src/insects.js';
import {CAPTURE_AWARENESS} from '../src/capture-awareness.js';
const dt=1/120,pos=i=>({x:i.x,y:i.y,z:i.z}),distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z),aim=(p,i)=>({x:i.x-p.x,y:i.y-p.y,z:i.z-p.z});
const far={x:30,y:1.65,z:30,speed:0,quiet:false};
const make=options=>createInsects(()=>0,{homes:[['morpho',0,0,1.15]],bounds:32,...options});
function until(sim,condition,seconds=15,player=far){for(let n=0;n<seconds/dt;n++){sim.update(dt,typeof player==='function'?player():player);if(condition())return;}assert.fail('Expected encounter state within bounded time');}
function advance(sim,seconds,player=far){for(let n=0;n<Math.round(seconds/dt);n++)sim.update(dt,typeof player==='function'?player():player);}
const miss={x:.8,y:0,z:-.6};

test('the first morpho gives an outside-net warning for walking and dash, with at least .18 seconds before dash flight',()=>{
 assert.deepEqual(CAPTURE_AWARENESS.morpho,{walkRadius:3.2,dashRadius:4.2,quietRadius:.9});
 for(const step of[dt,1/60,.06,.1])for(const speed of[2.7,5.4]){
  const sim=make(),i=sim.items[0];let warning=null,flight=null,previous=pos(i);
  for(let n=1;n*step<4;n++){
   const p={x:0,y:1.65,z:Math.max(.5,6-n*step*speed),speed,quiet:false};sim.update(step,p);
   if(!warning&&i.awarenessStage==='warning')warning={time:sim.time,distance:distance(p,i)};
   if(!flight&&i.excursion)flight={time:sim.time,distance:distance(p,i)};
   assert.ok(distance(i,previous)<step*7);previous=pos(i);
  }
  assert.equal(i.beginner,true);assert.ok(i.age<12);assert.ok(warning.distance>2.6);assert.ok(flight.time-warning.time>=.18-1e-9);
  if(speed>4)assert.ok(flight.distance>2.6,'dash departs before ordinary net reach');
  assert.equal(i.departures,1,'one continuous route rather than repeated startles');
 }
});

test('quiet approach allows the unchanged capture range; stopping a warning decays it instead of instantly jumping',()=>{
 const sim=make(),i=sim.items[0];let captured=false;
 for(let n=1;n<700;n++){const p={x:0,y:1.28,z:6-n*dt*1.05,speed:1.05,quiet:true};sim.update(dt,p);if(sim.findTarget(p,aim(p,i))?.catchable){assert.equal(i.awarenessStage,'calm');assert.equal(i.departures,0);assert.ok(distance(p,i)<=2.6);assert.equal(sim.swing(p,aim(p,i)).ok,true);captured=true;break;}}
 assert.ok(captured);
 const stopped=make(),q=stopped.items[0];let p;
 for(let n=1;n<240;n++){p={x:0,y:1.65,z:6-n*dt*5.4,speed:5.4,quiet:false};stopped.update(dt,p);if(q.awarenessStage==='warning')break;}
 assert.equal(q.awarenessStage,'warning');const alert=q.alert;p.speed=0;stopped.update(dt,p);assert.ok(q.alert>0&&q.alert<alert);advance(stopped,1.5,p);assert.equal(q.awarenessStage,'calm');assert.equal(q.departures,0);
 const crowded=make(),near={x:.1,y:1.15,z:0,speed:0,quiet:true};until(crowded,()=>crowded.items[0].excursion,.5,near);assert.equal(crowded.items[0].departures,1,'quiet does not hide physical intrusion');
});

test('a genuine nearby miss warns one nearest visible resting morpho, never an occluded, airborne, behind or held one',()=>{
 const p={x:0,y:1.15,z:2.3,speed:0},homes=[['morpho',0,.2,1.15],['morpho',0,-.2,1.15],['morpho',0,5,1.15]];
 const sim=make({homes}),nearest=sim.items[0];assert.equal(sim.swing(p,miss).ok,false);assert.equal(sim.startleFromNet(p,miss),nearest);assert.equal(sim.items.filter(i=>i.awarenessStage==='warning').length,1);advance(sim,.15,p);assert.equal(nearest.departures,0);until(sim,()=>nearest.excursion,.5,p);assert.equal(nearest.departures,1);assert.notEqual(sim.startleFromNet(p,miss),nearest,'active flight is excluded');
 const masked=make({homes,hasLineOfSight:(_,i)=>i.id!=='insect-1'});assert.equal(masked.startleFromNet(p,miss).id,'insect-2');
 for(const value of[false,null,undefined,1]){const hidden=make({hasLineOfSight:()=>value});assert.equal(hidden.startleFromNet(p,miss),null);advance(hidden,1,{...p,speed:5.4});assert.equal(hidden.items[0].departures,0);assert.equal(hidden.items[0].alert,0);}
 const isolated=make();assert.equal(isolated.startleFromNet({...p,z:3.21},miss),null);assert.equal(isolated.startleFromNet(p,{x:0,y:0,z:1}),null);assert.equal(isolated.swing(p,aim(p,isolated.items[0])).ok,true);const before=structuredClone(isolated.items);assert.equal(isolated.startleFromNet(p,miss),null);assert.deepEqual(isolated.items,before);
});

test('natural and startled flights cannot be restarted while followed; a settled perch permits a second warning and capture',()=>{
 const natural=make(),n=natural.items[0];advance(natural,14);assert.equal(n.state,'flying');assert.equal(n.excursion,null);
 for(let f=0;f<120;f++){const p={x:n.x+.1,y:n.y,z:n.z,speed:5.4,quiet:false};assert.equal(natural.startleFromNet(p,{x:-1,y:0,z:0}),null);natural.update(dt,p);assert.equal(n.excursion,null);assert.equal(n.departures,0);}
 const sim=make(),i=sim.items[0],p={x:0,y:1.15,z:2.3,speed:0};sim.startleFromNet(p,miss);until(sim,()=>i.excursion,1,p);const route=i.excursion,home={...i.home},id=i.id;let previous=pos(i);
 until(sim,()=>!i.excursion,10,()=>{assert.equal(i.excursion,route);assert.equal(sim.startleFromNet({x:i.x+.1,y:i.y,z:i.z,speed:5.4},{x:-1,y:0,z:0}),null);assert.ok(distance(i,previous)<.08);previous=pos(i);return{x:i.x+.1,y:i.y,z:i.z,speed:5.4};});
 assert.equal(i.departures,1);assert.equal(i.awarenessStage,'settling');assert.equal(sim.startleFromNet(p,miss),null);advance(sim,3.2);assert.equal(i.resting,true);assert.equal(i.id,id);assert.deepEqual(i.home,home);
 const q={x:i.x,y:i.y,z:i.z+2.3,speed:0,quiet:true};assert.equal(sim.startleFromNet(q,miss),i);assert.equal(i.awarenessStage,'warning');assert.equal(sim.swing(q,aim(q,i)).item,i);assert.equal(i.awarenessStage,'calm');const caught=pos(i);advance(sim,.5,q);assert.deepEqual(pos(i),caught);sim.release(q);assert.deepEqual(pos(i),caught);assert.equal(i.departures,2);assert.equal(i.state,'released');sim.update(dt,far);assert.ok(distance(i,caught)<.08);
});

test('a newly feeding visitor warns immediately, leaves continuously, preserves its reservation cooldown and can revisit',()=>{
 const sim=make({homes:[['morpho',10,0,1.2]]}),i=sim.items[0],home={...i.home},id=i.id;
 assert.equal(sim.placeBait({type:'fermented-fruit',x:0,y:.81,z:0}),true);until(sim,()=>sim.bait?.status==='feeding',30);assert.ok(sim.time<i.settleUntil,'arrival recovery timer is still active');
 const near={x:i.x+.1,y:i.y,z:i.z,speed:0,quiet:true};let warningAt=null,previous=pos(i),departAt=null;
 for(let n=0;n<60&&sim.bait.visitorId;n++){sim.update(dt,near);assert.ok(distance(i,previous)<.08);previous=pos(i);if(warningAt===null&&i.awarenessStage==='warning')warningAt=sim.time;if(i.excursion?.reason==='startled')departAt=sim.time;}
 assert.ok(warningAt!==null);assert.ok(departAt-warningAt>=.18-1e-9&&departAt-warningAt<.4);assert.equal(sim.bait.visitorId,null);assert.equal(sim.bait.status,'waiting');assert.equal(i.state,'startled');assert.equal(i.departures,1);
 while(sim.time<departAt+39.9){sim.update(dt,far);assert.notEqual(sim.bait?.visitorId,id);}
 until(sim,()=>sim.bait?.visitorId===id,35);assert.ok(sim.time-departAt>=40);assert.equal(sim.items.length,1);assert.equal(i.id,id);assert.deepEqual(i.home,home);
 until(sim,()=>sim.bait.status==='feeding',20);const p={x:i.x,y:i.y,z:i.z+1,speed:0,quiet:true},at=pos(i);assert.equal(sim.swing(p,aim(p,i)).item,i);assert.equal(sim.bait.visitorId,null);sim.release(p);assert.deepEqual(pos(i),at);assert.equal(i.state,'released');
});

test('zero time freezes warnings and flights, and reset clears only transient encounter state',()=>{
 const sim=make(),i=sim.items[0],p={x:0,y:1.15,z:2.3,speed:0};sim.startleFromNet(p,miss);const warn=structuredClone(i);for(let n=0;n<5;n++)sim.update(0,p);assert.deepEqual(i,warn);
 until(sim,()=>i.excursion,1,p);const flight=structuredClone(i);for(const invalid of[0,-1,NaN,Infinity,undefined])sim.update(invalid,p);assert.deepEqual(i,flight);
 sim.reset();const clean=make();assert.deepEqual(sim.items,clean.items);assert.equal(sim.time,0);assert.equal(sim.catches,0);assert.equal(sim.caught,null);
});

test('non-morpho white butterfly, dragonfly, cicada and ground hopper state histories remain byte-identical to the preceding baseline',()=>{
 const pts=[{x:5,y:.045,z:0},{x:6,y:.045,z:1},{x:4.5,y:.045,z:2}],sim=createInsects(()=>0,{homes:[['butterfly',0,0,1.15],['dragonfly',-3,0,1.2],['cicada',-10,-7.6,1.6],['grasshopper',5,0,.045]],grasshopperSupports:[{home:pts[0],points:pts}]}),rows=[];
 for(let n=0;n<600;n++){
  const p=n<120?{x:5,y:1.65,z:4-n/50,speed:5.4,quiet:false}:n<240?{x:0,y:1.28,z:2.3,speed:1.05,quiet:true}:n<360?{x:-3,y:1.65,z:2.8,speed:2.7,quiet:false}:null;
  if(n===245)sim.startleFromNet(p,{x:.8,y:0,z:-.6});if(n===420){const i=sim.items[3],q={x:i.x,y:i.y,z:i.z+1,speed:0,quiet:true};sim.swing(q,{x:0,y:0,z:-1});}if(n===450)sim.release({x:5,y:1.3,z:3,speed:0,quiet:true});sim.update(1/60,p);if(n%5===0)rows.push(structuredClone(sim.items));
 }
 // Golden was computed from the pre-change module, not from the implementation under test.
 assert.equal(createHash('sha256').update(JSON.stringify(rows)).digest('hex'),'c95aa9ce0bd08a89be2e4114bb981d6fb5369a3e5a5ad2d274a55afd5dbbc2e5');
});
