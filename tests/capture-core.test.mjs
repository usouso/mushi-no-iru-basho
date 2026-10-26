/** First-encounter reaction timing and real model transforms. CPU only: not
 * rendered warning readability, acoustic QA or a human capture-fun assessment. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createInsects} from '../src/insects.js';
import {CAPTURE_AWARENESS,NET_STARTLE} from '../src/capture-awareness.js';
const step=1/120,position=i=>({x:i.x,y:i.y,z:i.z}),distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z),aim=(p,i)=>({x:i.x-p.x,y:i.y-p.y,z:i.z-p.z});
const make=options=>createInsects(()=>0,{homes:[['butterfly',0,0,1.15]],...options});
const player=(z,speed=0,quiet=false)=>({x:0,y:quiet?1.28:1.65,z,speed,quiet});
function approach(speed,dt=step){const sim=make(),item=sim.items[0],quiet=speed<2;let warning=null,departure=null,firstCatchable=null,previous=position(item),maxFrameTravel=0;
 for(let n=1;n*dt<4;n++){
  const p=player(Math.max(.5,6-n*dt*speed),speed,quiet);sim.update(dt,p);const now=position(item);maxFrameTravel=Math.max(maxFrameTravel,distance(now,previous));previous=now;
  if(!warning&&item.awarenessStage==='warning')warning={time:sim.time,distance:distance(p,item),blend:item.alertBlend};
  if(!departure&&item.excursion)departure={time:sim.time,distance:distance(p,item)};
  if(!firstCatchable&&sim.findTarget(p,aim(p,item))?.catchable)firstCatchable={time:sim.time,stage:item.awarenessStage};
 }
 return{sim,item,warning,departure,firstCatchable,maxFrameTravel};
}

test('first twelve seconds already warn a dashing player before net range, then show at least .18s warning before continuous takeoff',()=>{
 assert.deepEqual(CAPTURE_AWARENESS.dragonfly,{walkRadius:3.3,dashRadius:4.4,quietRadius:1.05});assert.deepEqual(CAPTURE_AWARENESS.cicada,{walkRadius:3.5,dashRadius:4.6,quietRadius:1.15});assert.deepEqual(NET_STARTLE,{range:3.2,minDot:.5});
 const rows=[];for(const dt of[1/120,1/60,.06,.1]){
  const f=approach(5.4,dt);assert.equal(f.item.beginner,true);assert.ok(f.item.age<12);assert.ok(f.warning?.distance>2.6&&f.warning.blend>0,'warning starts outside the unchanged capture range');assert.ok(f.departure?.distance>2.6,'fast approach has a visible departure before ordinary net reach');assert.ok(f.departure.time-f.warning.time>=.18-1e-9);assert.equal(f.item.departures,1,'following does not restart its route');assert.ok(f.maxFrameTravel<=dt*7,'finite continuous flight, not an instant relocation');rows.push({dt,warning:f.warning,departure:f.departure});
 }
 console.log('First white-butterfly CPU encounter timing, not a visual playtest:',JSON.stringify(rows));
});

test('the same quiet path allows capture at 2.6m without a warning, but physically crowding still starts an escape',()=>{
 const sim=make(),item=sim.items[0];let caught=false;
 for(let n=1;n<700;n++){const p=player(6-n*step*1.05,1.05,true);sim.update(step,p);if(sim.findTarget(p,aim(p,item))?.catchable){assert.equal(item.awarenessStage,'calm');assert.equal(item.departures,0);assert.ok(distance(p,item)<=2.6);assert.equal(sim.swing(p,aim(p,item)).ok,true);caught=true;break;}}
 assert.ok(caught);assert.equal(item.awarenessStage,'calm');
 const crowded=make(),near=player(.2,0,true);let seenWarning=false;for(let n=0;n<100;n++){crowded.update(step,near);seenWarning||=crowded.items[0].awarenessStage==='warning';}assert.ok(seenWarning);assert.equal(crowded.items[0].departures,1,'quiet is not close-contact immunity');
});

test('stopping during the white butterfly warning decays the cue gradually and avoids takeoff',()=>{
 const sim=make(),item=sim.items[0];let p;for(let n=1;n<250;n++){p=player(6-n*step*5.4,5.4);sim.update(step,p);if(item.awarenessStage==='warning')break;}
 assert.equal(item.awarenessStage,'warning');const alert=item.alert;p.speed=0;sim.update(step,p);assert.ok(item.alert>0&&item.alert<alert);
 for(let n=0;n<130;n++)sim.update(step,p);assert.equal(item.departures,0);assert.equal(item.awarenessStage,'calm');assert.ok(item.alertBlend<.001);
});

test('a real off-axis miss startles the nearest visible butterfly only; opaque, far, behind and held targets remain excluded',()=>{
 // Morpho is also reactive now; this first insect is behind the missed swing.
 const homes=[['morpho',0,4,1.15],['butterfly',0,0,1.15],['butterfly',.1,-.25,1.15],['dragonfly',0,-.7,1.15],['butterfly',0,5,1.15]],p={x:0,y:1.15,z:2.3,speed:0},off={x:.8,y:0,z:-.6};
 const sim=createInsects(()=>0,{homes});assert.equal(sim.swing(p,off).ok,false);const target=sim.startleFromNet(p,off);assert.equal(target.id,'insect-2');assert.equal(sim.items.filter(i=>i.awarenessStage==='warning').length,1);assert.equal(sim.items[0].alert,0);assert.equal(target.departures,0);for(let n=0;n<18;n++)sim.update(step,p);assert.equal(target.departures,0);
 for(const value of[false,null,undefined,1]){const blocked=make({hasLineOfSight:()=>value});assert.equal(blocked.startleFromNet(p,off),null);for(let n=0;n<120;n++)blocked.update(step,{...p,speed:5.4});assert.equal(blocked.items[0].alert,0);assert.equal(blocked.items[0].departures,0);}
 const other=make();assert.equal(other.startleFromNet({...p,z:3.201},off),null);assert.equal(other.startleFromNet(p,{x:0,y:0,z:1}),null);assert.equal(other.swing(p,aim(p,other.items[0])).ok,true);const before=structuredClone(other.items);assert.equal(other.startleFromNet(p,off),null);assert.deepEqual(other.items,before);
});

test('white butterfly flight returns continuously to its perch for a quiet retry, and capture/release preserves the exact launch point',()=>{
 const sim=make(),item=sim.items[0],p={x:0,y:1.15,z:2.3,speed:0},off={x:.8,y:0,z:-.6};sim.startleFromNet(p,off);let previous=position(item),departed=false,landed=false,maxRange=0;
 for(let n=0;n<1100;n++){sim.update(step,p);const current=position(item);assert.ok(Object.values(current).every(Number.isFinite));assert.ok(distance(current,previous)<.06);previous=current;maxRange=Math.max(maxRange,distance(current,item.home));if(item.excursion){departed=true;assert.equal(sim.startleFromNet(p,off),null);assert.equal(item.departures,1);}if(departed&&!item.excursion&&item.resting){landed=true;break;}}
 assert.ok(landed&&maxRange>1);assert.ok(distance(item,item.home)<.055);assert.equal(item.awarenessStage,'settling');const quiet=player(2.3,1.05,true);assert.equal(sim.swing(quiet,aim(quiet,item)).ok,true);const caught=position(item);sim.update(.1,quiet);assert.deepEqual(position(item),caught);assert.equal(item.awarenessStage,'calm');assert.equal(sim.release(quiet).id,item.id);assert.deepEqual(position(item),caught);assert.equal(item.state,'released');sim.update(step,quiet);assert.ok(distance(item,caught)<.06);assert.equal(item.departures,2);
});

test('zero time freezes both warning and flight; deterministic escape needs no per-frame random source',t=>{
 const sim=make(),item=sim.items[0],p={x:0,y:1.15,z:2.3,speed:0};sim.startleFromNet(p,{x:.8,y:0,z:-.6});t.mock.method(Math,'random',()=>{throw Error('escape must not sample per frame');});const warning=structuredClone(item);for(let n=0;n<10;n++)sim.update(0,p);assert.deepEqual(item,warning);assert.equal(sim.time,0);for(let n=0;n<40;n++)sim.update(step,p);assert.ok(item.excursion);const flight=structuredClone(item),time=sim.time;for(let n=0;n<10;n++)sim.update(0,p);assert.deepEqual(item,flight);assert.equal(sim.time,time);
});

test('the warning changes only perched field wing hinges, not support/body, inspection, caught poses or existing flight',async()=>{
 const sandbox={console};vm.runInNewContext(fs.readFileSync(new URL('../assets/vendor/three.min.js',import.meta.url),'utf8'),sandbox);const T=sandbox.THREE,context={};for(const name of['fillRect','clearRect','beginPath','moveTo','lineTo','bezierCurveTo','quadraticCurveTo','stroke','fill','save','restore','translate','rotate','ellipse','arc','drawImage','closePath','clip'])context[name]=()=>{};context.createLinearGradient=()=>({addColorStop(){}});globalThis.window={THREE:T};globalThis.document={createElement:()=>({getContext:()=>context})};
 const {createInsectModel,updateInsectModel}=await import('../src/insect-models.js');const base={species:'butterfly',x:2,y:1.15,z:3,heading:.3,phase:.2,wingPhase:1.4,resting:true,flightBlend:0,caught:false,alertBlend:.8};
 const pose=m=>{m.updateMatrixWorld(true);const rows=[];m.traverse(n=>rows.push([n.name,n.visible,...n.matrixWorld.elements]));return rows;};
 for(const scenario of[{inspection:false,change:{},active:true},{inspection:true,change:{},active:false},{inspection:false,change:{caught:true},active:false},{inspection:false,change:{resting:false,flightBlend:.6},active:false},{inspection:false,change:{resting:false},active:false}]){
  const calm=createInsectModel('butterfly',{inspection:scenario.inspection}),warn=createInsectModel('butterfly',{inspection:scenario.inspection});const item={...base,...scenario.change};updateInsectModel(calm,{...item,awarenessStage:'calm'},1);updateInsectModel(warn,{...item,awarenessStage:'warning'},1);
  if(scenario.active){assert.notDeepEqual(pose(calm),pose(warn));for(let i=0;i<calm.userData.wings.length;i++)assert.ok(Math.abs(calm.userData.wings[i].rotation.z-warn.userData.wings[i].rotation.z)>.15);assert.deepEqual(calm.position.toArray(),warn.position.toArray());assert.deepEqual(calm.quaternion.toArray(),warn.quaternion.toArray());assert.deepEqual(calm.scale.toArray(),warn.scale.toArray());const skip=new Set();for(const wing of warn.userData.wings)wing.traverse(n=>skip.add(n));const a=[],b=[],calmSkip=new Set();for(const wing of calm.userData.wings)wing.traverse(n=>calmSkip.add(n));calm.traverse(n=>{if(!calmSkip.has(n))a.push([...n.matrixWorld.elements]);});warn.traverse(n=>{if(!skip.has(n))b.push([...n.matrixWorld.elements]);});assert.deepEqual(a,b,'non-wing body and support geometry stays fixed');}
  else assert.deepEqual(pose(calm),pose(warn),'warning field cannot leak into another pose');
  const dispose=m=>{const resources=new Set();m.traverse(n=>{if(n.geometry)resources.add(n.geometry);if(n.material)resources.add(n.material);});for(const resource of resources)resource.dispose();};dispose(calm);dispose(warn);
 }
});
