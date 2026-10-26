/** Supported beetle encounter QA: real simulation/stores, explicit flat-world
 * LOS and in-memory storage doubles. Geometry support rays belong to a separate
 * focused test; none of these checks certifies rendered tension or visibility. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createInsects} from '../src/insects.js';
import {individualHabitatOptions} from '../src/individual-layout.js';
import {createCompanionRoster,COMPANION_KEY,LEGACY_COMPANION_KEY} from '../src/individual-roster.js';
const dt=1/120,species=['rhino','stag'];
const definitions={rhino:{home:{x:-3.65,y:1.25,z:2},heading:Math.PI/2,limits:{min:-4.10,max:-3.36},slot:'insect-4',warning:.30},stag:{home:{x:-4.8,y:1.445,z:3.15},heading:0,limits:{min:2.58,max:3.43},slot:'insect-5',warning:.40}};
const position=i=>({x:i.x,y:i.y,z:i.z}),distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z),aim=(p,i)=>({x:i.x-p.x,y:i.y-p.y,z:i.z-p.z}),axis=(i,kind)=>i.x*Math.sin(definitions[kind].heading)+i.z*Math.cos(definitions[kind].heading);
const phase=i=>i[i.species+'Phase'];
function make({los=()=>true,measured=false,size=1000,site=1,reactive=true}={}){
 const options={homes:[['butterfly',20,20,1.15],['butterfly',23,20,1.15],['butterfly',26,20,1.15]],extraHomes:[],hasLineOfSight:los};
 for(const kind of species){const d=definitions[kind];options.extraHomes.push([kind,d.home.x,d.home.z,d.home.y]);options[kind+'Supports']=[{home:{...d.home},heading:d.heading,...(reactive?{retreatLimits:{...d.limits}}:{})}];}
 const records=species.map((kind,n)=>({species:kind,populationSlotId:kind,runtimeSlotId:definitions[kind].slot,habitat:'night',siteIndex:site,sizePermille:size,motionSeed:50+n,measureVersion:1,encounterId:`g1-1234abcd-o1-night-${kind}`}));
 const configured=measured?individualHabitatOptions('night',options,{encounters:records},()=>0):options,bytes=JSON.stringify(configured),sim=createInsects(()=>0,configured);
 return{sim,get(kind){return sim.items.find(i=>i.species===kind);},configured,bytes,records};
}
function observer(item,kind,offset,{side=0,speed=5.4,quiet=false}={}){const h=definitions[kind].heading;return{x:item.x+Math.sin(h)*offset+Math.cos(h)*side,y:quiet?1.28:1.65,z:item.z+Math.cos(h)*offset-Math.sin(h)*side,speed,quiet};}
function until(sim,p,predicate,limit=4800){for(let n=0;n<limit&&!predicate();n++)sim.update(dt,p);assert.ok(predicate(),'bounded supported reaction/return');}
function snapshot(item){return{...position(item),heading:item.heading,walkPhase:item.walkPhase,walkSpeed:item.walkSpeed,phase:phase(item),warningBlend:item.warningBlend,jawOpen:item.jawOpen};}

test('both supported beetles warn a fast approach outside net range while the same quiet approach permits capture',()=>{
 const metrics=[];
 for(const kind of species){
  const f=make(),item=f.get(kind),home={...item};let warning=null,retreat=null;
  for(let n=1;n<210;n++){const offset=Math.max(.7,6-n*dt*5.4),p=observer(home,kind,offset);f.sim.update(dt,p);if(!warning&&phase(item)==='warning')warning={time:f.sim.time,distance:distance(p,item),blend:item.warningBlend};if(!retreat&&phase(item)==='retreating')retreat={time:f.sim.time,distance:distance(p,item)};}
  assert.ok(warning?.distance>2.6&&warning.blend>0,kind+' warns before the unchanged net range');assert.ok(retreat);assert.ok(retreat.time-warning.time>=definitions[kind].warning-dt-1e-9);assert.ok(distance(item,home)>.02,'warning leads to observable continuous retreat');metrics.push({kind,warning,retreat});
  const quiet=make(),target=quiet.get(kind),origin={...target};let caught=false;
  for(let n=1;n<700;n++){const p=observer(origin,kind,6-n*dt*1.05,{speed:1.05,quiet:true});quiet.sim.update(dt,p);if(quiet.sim.findTarget(p,aim(p,target))?.catchable){assert.equal(target.warningBlend,0);assert.notEqual(phase(target),'retreating');assert.equal(quiet.sim.swing(p,aim(p,target)).item,target);caught=true;break;}}
  assert.ok(caught,kind+' has a fair quiet capture');
 }
 console.log('Supported beetle CPU fast/quiet timing, not visual playtest:',JSON.stringify(metrics));
});

test('front and rear threats move away along the supported branch; a side approach chooses available space deterministically',()=>{
 for(const kind of species)for(const source of['front','rear','side']){
  const f=make(),i=f.get(kind),start=axis(i,kind),p=observer(i,kind,source==='front'?2.3:source==='rear'?-2.3:0,{side:source==='side'?2.3:0});
  until(f.sim,p,()=>phase(i)==='retreating');for(let n=0;n<80;n++)f.sim.update(dt,p);const moved=axis(i,kind)-start;
  if(source==='front')assert.ok(moved<-.01,kind+' retreats from its front');else if(source==='rear')assert.ok(moved>.01,kind+' retreats from its rear');else{const expected=start-definitions[kind].limits.min>definitions[kind].limits.max-start?-1:1;assert.equal(Math.sign(moved),expected,'side escape uses the longer safe branch segment');const twin=make(),j=twin.get(kind);for(let n=0;n<Math.round(f.sim.time/dt);n++)twin.sim.update(dt,p);assert.ok(distance(i,j)<1e-8);}
  const h=definitions[kind].heading;assert.ok(Math.abs((i.x-i.home.x)*Math.cos(h)-(i.z-i.home.z)*Math.sin(h))<1e-8,'no unsupported sidestep');assert.equal(i.y,i.home.y);assert.equal(i.heading,i.homeHeading);
 }
});

test('real off-axis net misses affect one nearest visible branch insect, and LOS/height/stillness prevent false fear',()=>{
 for(const kind of species){
  const f=make(),item=f.get(kind),p=observer(item,kind,2.3,{speed:0});p.y=item.y;const h=definitions[kind].heading,off={x:-.6*Math.sin(h)+.8*Math.cos(h),y:0,z:-.6*Math.cos(h)-.8*Math.sin(h)};
  assert.equal(f.sim.swing(p,off).ok,false);assert.equal(f.sim.startleFromNet(p,off),item);assert.equal(phase(item),'warning');assert.equal(f.sim.items.filter(i=>phase(i)==='warning').length,1);const start=position(item);for(let n=0;n<20;n++){assert.equal(f.sim.startleFromNet(p,off),null,'repeated miss never restarts the warning');f.sim.update(dt,p);}assert.deepEqual(position(item),start);
  for(const los of[()=>false,()=>undefined,()=>null,()=>1]){const blocked=make({los}),i=blocked.get(kind),q=observer(i,kind,2.3);q.y=i.y;assert.equal(blocked.sim.startleFromNet(q,off),null);for(let n=0;n<120;n++)blocked.sim.update(dt,q);assert.equal(i.warningBlend,0);assert.equal(phase(i),'resting');}
  for(const q of[observer(item,kind,2.3,{speed:0}),{...observer(item,kind,2.3),y:item.y+2.51},observer(item,kind,4.1)]){const untouched=make(),j=untouched.get(kind);for(let n=0;n<100;n++)untouched.sim.update(dt,q);assert.equal(j.warningBlend,0);assert.equal(phase(j),'resting');}
 }
});

test('maximum-size edge-site individuals reach a safe corner without restart, then retreat from a new side and return continuously when given space',()=>{
 for(const kind of species){const f=make({measured:true,size:1150,site:2}),i=f.get(kind),bounds=definitions[kind].limits,p=observer(i,kind,-1.5),identity=[i.id,i.encounterId,i.sizePermille];let previous=position(i),maxSpeed=0;
  until(f.sim,p,()=>phase(i)==='cornered',2400);const corner=position(i);assert.ok(axis(i,kind)<=bounds.max&&axis(i,kind)>=bounds.min);for(let n=0;n<180;n++){f.sim.update(dt,p);assert.deepEqual(position(i),corner,'constant pressure cannot snap/restart through the branch edge');}
  const frozen=snapshot(i),time=f.sim.time;for(let n=0;n<10;n++)f.sim.update(0,p);assert.deepEqual(snapshot(i),frozen);assert.equal(f.sim.time,time);
  const around=observer(i,kind,1.5);until(f.sim,around,()=>phase(i)==='retreating');assert.equal(i.direction,-1,'moving around opens the opposite safe route');const far={x:30,y:1.65,z:30,speed:0};
  previous=position(i);let returned=false;for(let n=0;n<4800;n++){f.sim.update(dt,far);const now=position(i);assert.ok(Object.values(now).every(Number.isFinite));assert.ok(axis(i,kind)>=bounds.min-1e-8&&axis(i,kind)<=bounds.max+1e-8);assert.ok(distance(now,previous)<.02,'retreat/return never teleport');previous=now;maxSpeed=Math.max(maxSpeed,Math.abs(i.walkSpeed));if(axis(i,kind)>=axis(i.home,kind)-1e-7&&axis(i,kind)<=axis(i.home,kind)+.12*1.15+1e-7&&!['warning','retreating','cornered','settling'].includes(phase(i))){returned=true;break;}}
  assert.ok(returned&&maxSpeed>0);assert.deepEqual([i.id,i.encounterId,i.sizePermille],identity);assert.equal(JSON.stringify(f.configured),f.bytes,'support limits are not moved or mutated with the individual');const quiet=observer(i,kind,2.2,{speed:1.05,quiet:true});assert.equal(f.sim.swing(quiet,aim(quiet,i)).item,i,'the returned insect remains capturable');
 }
});

test('capture freezes warning and retreat, release continues the exact same individual, and retention/reset never duplicates measured origins',async()=>{
 for(const kind of species)for(const targetPhase of['warning','retreating']){
  const f=make({measured:true,size:1150}),i=f.get(kind),threat=observer(i,kind,2.3),identity=[i.id,i.encounterId,i.sizePermille,i.measureVersion];until(f.sim,threat,()=>phase(i)===targetPhase);const p=observer(i,kind,2.2,{speed:1.05,quiet:true}),at=position(i);assert.equal(f.sim.swing(p,aim(p,i)).item,i);const caught=snapshot(i);for(let n=0;n<120;n++)f.sim.update(dt,threat);assert.deepEqual(snapshot(i),caught);assert.equal(f.sim.startleFromNet(threat,aim(threat,i)),null);
  assert.equal(f.sim.release(p),i);assert.deepEqual(position(i),at);assert.equal(phase(i),targetPhase);f.sim.update(dt,p);assert.ok(distance(i,at)<.01);assert.deepEqual([i.id,i.encounterId,i.sizePermille,i.measureVersion],identity);
  assert.equal(f.sim.swing(p,aim(p,i)).item,i);const values=new Map([[LEGACY_COMPANION_KEY,JSON.stringify({version:1,entries:[]})],['mushi-journal-v2','old notes']]),old=values.get(LEGACY_COMPANION_KEY),storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)},locks={request:async(key,options,callback)=>callback()},roster=createCompanionRoster(storage,{locks,now:()=>100});await roster.flush();
  assert.equal(roster.add({species:kind,originHabitat:'night',originIndividualId:i.id,originKind:'expedition',originEncounterId:i.encounterId,sizePermille:i.sizePermille,measureVersion:i.measureVersion}).ok,true);assert.equal(f.sim.retain(),i);await roster.flush();const raw=values.get(COMPANION_KEY);assert.equal(values.get(LEGACY_COMPANION_KEY),old);assert.equal(values.get('mushi-journal-v2'),'old notes');assert.equal(roster.entries[0].id,identity[1]);f.sim.reset();const restored=f.get(kind);assert.equal(restored.companion,true);assert.equal(restored.caught,true);assert.deepEqual([restored.id,restored.encounterId,restored.sizePermille,restored.measureVersion],identity);assert.notEqual(f.sim.findTarget(p,aim(p,restored))?.item,restored);assert.equal(values.get(COMPANION_KEY),raw);
  assert.equal(roster.release(identity[1]).ok,true);await roster.flush();f.sim.setCompanions([],p);assert.equal(restored.companion,false);assert.equal(restored.caught,false);assert.equal(f.sim.swing(p,aim(p,restored)).item,restored);
 }
});
