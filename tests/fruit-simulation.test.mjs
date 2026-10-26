/** Pure simulation: no rendered, audible, or browser-behaviour claims. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createInsects} from '../src/insects.js';
import {TROPICAL_HOMES,TROPICAL_BOUNDS} from '../src/tropical-layout.js';
const far={x:30,y:1.65,z:30,speed:0,quiet:false};
const target={type:'fermented-fruit',x:0,y:.81,z:0};
const four=[['morpho',10,0,1.2],['morpho',-8,4,1.2],['morpho',8,8,1.2],['morpho',-12,-5,1.2]];
const make=(homes=four)=>createInsects(()=>0,{homes,bounds:32});
const position=i=>({x:i.x,y:i.y,z:i.z});
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
function step(sim,seconds,player=far){for(let i=0;i<Math.round(seconds*60);i++)sim.update(1/60,player);}
function until(sim,predicate,seconds=40,player=far){for(let i=0;i<seconds*60;i++){sim.update(1/60,player);if(predicate())return;}assert.fail('Expected condition not reached');}
function feeding(sim){assert.equal(sim.placeBait({...target}),true);until(sim,()=>sim.bait?.status==='feeding');return sim.items.find(i=>i.id===sim.bait.visitorId);}
function catchItem(sim,item){const p={x:item.x,y:item.y,z:item.z+.5,speed:0,quiet:true},result=sim.swing(p,{x:0,y:0,z:-1});assert.equal(result.ok,true);assert.equal(result.item.id,item.id);return p;}

test('bait API is explicit, single-instance, detached and game-time based',()=>{
 const sim=make();assert.equal(sim.bait,null);assert.equal(sim.removeBait(),false);assert.equal(sim.placeBait(target),true);
 assert.deepEqual(sim.bait,{active:true,...target,remaining:90,visitorId:null,status:'waiting'});assert.equal(sim.placeBait({...target,x:1}),false);
 const snapshot=sim.bait;snapshot.x=999;snapshot.remaining=0;snapshot.visitorId='fake';assert.equal(sim.bait.x,0);assert.equal(sim.bait.remaining,90);assert.equal(sim.bait.visitorId,null);
 const paused=JSON.stringify(sim.bait);for(let i=0;i<100;i++)void sim.bait;assert.equal(JSON.stringify(sim.bait),paused);
 step(sim,1);assert.ok(Math.abs(sim.bait.remaining-89)<1e-9);assert.equal(sim.removeBait(),true);assert.equal(sim.bait,null);assert.equal(sim.removeBait(),false);
});
test('placement rejects wrong species/type, nonfinite/out-of-field/vertical and prototype/accessor payloads',()=>{
 const sim=make();let read=false;const getter={...target};Object.defineProperty(getter,'x',{get(){read=true;return 0;}});
 const proto=Object.create(target),ownProto={...target};Object.defineProperty(ownProto,'__proto__',{value:{},enumerable:true});
 for(const value of [null,undefined,[],42,'fruit',{},proto,getter,ownProto,{...target,type:'butterfly'}, {...target,x:NaN},{...target,z:Infinity},{...target,y:-Infinity},{...target,x:33},{...target,z:-33},{...target,y:.1},{...target,y:4},{...target,x:'0'},{...target,extra:true}])assert.equal(sim.placeBait(value),false);
 assert.equal(read,false);assert.equal(sim.bait,null);assert.equal(sim.placeBait(Object.assign(Object.create(null),target)),true);
});
test('there is an initial delay, a single reserved morpho, and no instant position/home change',()=>{
 const sim=make(),homes=sim.items.map(i=>({...i.home}));sim.placeBait(target);step(sim,3.9);assert.equal(sim.bait.visitorId,null);
 let before;until(sim,()=>sim.bait.visitorId!==null,20,{...far});const item=sim.items.find(i=>i.id===sim.bait.visitorId);
 assert.equal(item.species,'morpho');assert.equal(sim.bait.status,'approaching');assert.equal(sim.items.filter(i=>i.excursion?.reason==='bait-approach').length,1);
 assert.deepEqual(sim.items.map(i=>i.home),homes);assert.equal(sim.items.length,4);
 assert.ok(distance(item,item.excursion.start)<1e-9);assert.deepEqual(item.excursion.end,{x:0,y:.81,z:0});
});
test('watching from inside or exactly at 2.8 metres prevents new attraction',()=>{
 for(const x of [0,2.8]){const sim=make();sim.placeBait(target);step(sim,35,{...far,x,z:0});assert.equal(sim.bait.status,'waiting');assert.equal(sim.bait.visitorId,null);}
 const sim=make();sim.placeBait(target);step(sim,10,{...far,x:0,z:0});until(sim,()=>sim.bait.visitorId!==null,30,far);assert.equal(sim.bait.status,'approaching');
});
test('no resting visitor or no morpho within 14 metres means no guaranteed arrival',()=>{
 const distant=make([['morpho',25,25,1.2],['morpho',-25,25,1.2],['morpho',25,-25,1.2],['morpho',-25,-25,1.2]]);distant.placeBait(target);step(distant,40);assert.equal(distant.bait.visitorId,null);
 const moving=make();moving.placeBait(target);for(let frame=0;frame<10*60;frame++){for(const item of moving.items){item.resting=false;item.state='flying';}moving.update(1/60,far);}assert.equal(moving.bait.visitorId,null);
});
test('old three species retain byte-for-byte simulation state with and without bait',()=>{
 const baseline=createInsects(),baited=createInsects();baited.placeBait(target);
 for(let frame=0;frame<95*60;frame++){const p=frame<200?{x:0,y:1.65,z:5.6,speed:5.4,quiet:false}:far;baseline.update(1/60,p);baited.update(1/60,p);if(frame%120===0)assert.deepEqual(baited.items,baseline.items);}
 assert.deepEqual(baited.items,baseline.items);assert.equal(baited.bait,null);assert.equal(baited.items.length,18);
});
test('same input sequence gives identical visits and coordinates without random state',()=>{
 const a=make(),b=make();a.placeBait(target);b.placeBait(target);for(let i=0;i<90*60;i++){a.update(1/60,far);b.update(1/60,far);if(i%60===0){assert.deepEqual(a.bait,b.bait);assert.deepEqual(a.items,b.items);}}
});
test('long approach uses a curved bait endpoint beyond 5.5m and feeds at the requested support height',()=>{
 const sim=make();sim.placeBait(target);until(sim,()=>sim.bait.visitorId!==null);const visitor=sim.items.find(i=>i.id===sim.bait.visitorId),home={...visitor.home};assert.ok(distance(home,target)>5.5);
 let lateral=0;until(sim,()=>{lateral=Math.max(lateral,Math.abs(visitor.z));return sim.bait.status==='feeding';});assert.ok(lateral>.05);
 assert.ok(distance(visitor,target)<.035);assert.equal(visitor.resting,true);assert.equal(visitor.state,'feeding');assert.deepEqual(visitor.home,home);
 step(sim,3);assert.ok(distance(visitor,target)<1e-6);assert.ok(Math.abs(Math.sin(visitor.heading))<.001);
});
test('feeding lasts several seconds then returns home without changing individual identity',()=>{
 const sim=make(),item=feeding(sim),id=item.id,home={...item.home};step(sim,5);assert.equal(sim.bait.status,'feeding');
 until(sim,()=>sim.bait.visitorId===null,5);assert.equal(item.state,'returning');until(sim,()=>item.state==='resting'&&distance(item,home)<.055,15);
 assert.equal(item.id,id);assert.deepEqual(item.home,home);assert.equal(sim.items.length,4);
});
test('90-second exposure permits sequential but never overlapping visits, respecting per-insect cooldown',()=>{
 const sim=make();sim.placeBait(target);const visits=[],finished=new Map();let previous=null;
 for(let i=0;i<90*60;i++){sim.update(1/60,far);const current=sim.bait?.visitorId||null;if(current!==previous){if(previous)finished.set(previous,sim.time);if(current){if(finished.has(current))assert.ok(sim.time-finished.get(current)>=39.9);visits.push({id:current,time:sim.time});}previous=current;}
  assert.ok(sim.items.filter(item=>item.excursion?.reason==='bait-approach'||item.state==='feeding').length<=1);
 }
 assert.ok(visits.length>=2,'Waiting must not become permanently spent');assert.equal(sim.bait,null);assert.equal(sim.items.length,4);
});
test('all flight phases remain spatially continuous with bounded frame displacement',()=>{
 const sim=make(),homes=sim.items.map(i=>({...i.home})),ids=sim.items.map(i=>i.id);sim.placeBait(target);let maxStep=0;
 for(let frame=0;frame<100*60;frame++){const before=sim.items.map(position);sim.update(1/60,far);sim.items.forEach((item,i)=>{maxStep=Math.max(maxStep,distance(item,before[i]));assert.ok([item.x,item.y,item.z].every(Number.isFinite));});}
 assert.ok(maxStep<.2,`Maximum frame displacement ${maxStep}`);assert.deepEqual(sim.items.map(i=>i.home),homes);assert.deepEqual(sim.items.map(i=>i.id),ids);
});
test('remove during approach or feeding routes home continuously and permits a later placement',()=>{
 for(const stage of ['approaching','feeding']){const sim=make();sim.placeBait(target);until(sim,()=>sim.bait.status===stage);const item=sim.items.find(i=>i.id===sim.bait.visitorId),before=position(item);assert.equal(sim.removeBait(),true);assert.deepEqual(position(item),before);assert.equal(item.state,'returning');sim.update(1/60,far);assert.ok(distance(item,before)<.1);assert.equal(sim.bait,null);assert.equal(sim.placeBait(target),true);assert.equal(sim.bait.visitorId,null);}
});
test('expiry during an approach or feeding detaches the visitor and routes home without a teleport',()=>{
 for(const stage of ['approaching','feeding']){const sim=make();sim.placeBait(target);step(sim,stage==='approaching'?85:75,{...far,x:0,z:0});until(sim,()=>sim.bait?.status===stage,14,far);const item=sim.items.find(i=>i.id===sim.bait.visitorId);let prior;
  while(sim.bait){prior=position(item);sim.update(1/60,far);}assert.ok(distance(item,prior)<.2);assert.equal(item.state,'returning');
 }
});
test('capture during approach or feeding clears reservation; release starts at actual capture position',()=>{
 for(const stage of ['approaching','feeding']){const sim=make();sim.placeBait(target);until(sim,()=>sim.bait.status===stage);if(stage==='approaching')step(sim,2);const item=sim.items.find(i=>i.id===sim.bait.visitorId),before=position(item),home={...item.home};const p=catchItem(sim,item);
  assert.equal(sim.bait.visitorId,null);assert.equal(sim.bait.status,'waiting');assert.deepEqual(position(item),before);step(sim,1);assert.deepEqual(position(item),before);
  sim.release(p);assert.equal(item.state,'released');assert.deepEqual(position(item),before);sim.update(1/60,p);assert.ok(distance(item,before)<.1);assert.deepEqual(item.home,home);assert.equal(sim.items.length,4);
 }
});
test('close intrusion startles a visitor, clears reservation and keeps existing escape behaviour',()=>{
 const sim=make(),item=feeding(sim),home={...item.home};const intruder={x:item.x+.1,y:item.y,z:item.z,speed:0,quiet:true};let prior;
 for(let i=0;i<20&&sim.bait.visitorId;i++){prior=position(item);sim.update(1/60,intruder);}assert.equal(sim.bait.visitorId,null);assert.equal(item.state,'startled');assert.ok(distance(item,prior)<.1);
 step(sim,16);assert.deepEqual(item.home,home);assert.ok(distance(item,home)<.1);assert.equal(sim.items.length,4);
});
test('individual cooldown survives remove/reinstall and reset clears both exposure and cooldown',()=>{
 const sim=make(),item=feeding(sim);sim.removeBait();sim.placeBait(target);step(sim,5);assert.notEqual(sim.bait.visitorId,item.id);
 sim.reset();assert.equal(sim.bait,null);assert.equal(sim.time,0);assert.equal(sim.caught,null);assert.equal(sim.items.length,4);assert.deepEqual(sim.items.map(i=>i.home),four.map(([,x,z,y])=>({x,y,z})));
 assert.equal(sim.placeBait(target),true);until(sim,()=>sim.bait.visitorId!==null);assert.equal(sim.bait.visitorId,'insect-1');
});
test('canonical four-morpho tropical homes can visit the actual station vicinity without adding insects',()=>{
 const sim=createInsects(()=>0,{homes:TROPICAL_HOMES,bounds:TROPICAL_BOUNDS});assert.equal(sim.placeBait({type:'fermented-fruit',x:-3,y:.80875,z:2}),true);
 until(sim,()=>sim.bait.status==='feeding',55,{x:-1,y:1.65,z:5,speed:0,quiet:true});assert.equal(sim.items.length,4);assert.ok(sim.items.every(i=>i.species==='morpho'));
});
test('expiry/removal while a visitor is held never releases or moves the captured insect',()=>{
 for(const end of ['expiry','remove']){const sim=make(),item=feeding(sim),p=catchItem(sim,item),before=position(item);if(end==='expiry')step(sim,91);else sim.removeBait();
  assert.equal(sim.bait,null);assert.equal(sim.caught,item);assert.equal(item.caught,true);assert.deepEqual(position(item),before);
  sim.release(p);assert.equal(sim.caught,null);assert.equal(item.state,'released');assert.deepEqual(position(item),before);sim.update(1/60,far);assert.ok(distance(item,before)<.1);
 }
});
test('invalid/zero deltas cannot consume exposure time; reset during a visit discards reservation safely',()=>{
 const sim=make();sim.placeBait(target);step(sim,2);const remaining=sim.bait.remaining;
 for(const dt of [0,-1,NaN,Infinity,undefined])sim.update(dt,far);assert.equal(sim.bait.remaining,remaining);
 until(sim,()=>sim.bait.visitorId!==null);sim.reset();assert.equal(sim.bait,null);assert.equal(sim.time,0);assert.equal(sim.items.length,4);assert.ok(sim.items.every(i=>i.state==='resting'&&i.excursion===null&&distance(i,i.home)===0));
});
test('a finished visitor cannot be rebooked until both station delay and individual cooldown expire',()=>{
 const sim=make();sim.placeBait(target);const visits=[];let prior=null,endedAt=null;
 for(let frame=0;frame<90*60;frame++){
  sim.update(1/60,far);const current=sim.bait?.visitorId||null;
  if(current!==prior){if(prior)endedAt=sim.time;if(current){if(endedAt!==null)assert.ok(sim.time-endedAt>=17.9);visits.push(current);}prior=current;}
 }
 assert.ok(visits.length>=2);assert.notEqual(visits[0],visits[1],'Another existing rested individual can visit while the first cools down');
});
