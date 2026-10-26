/** Portable pure-simulation checks: synthetic log supports, no private git history. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createInsects} from '../src/insects.js';
const far={x:20,y:1.65,z:20,speed:0,quiet:true},position=i=>({x:i.x,y:i.y,z:i.z}),gap=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
function config(){const herculesSupports=[-5,-7].map((x,n)=>({home:{x,y:.9,z:n?2.8:5.5},axis:[{x:x-.6,y:.9,z:n?2.8:5.5},{x:x+.6,y:.9,z:n?2.8:5.5}]}));return{homes:herculesSupports.map(({home:h})=>['hercules',h.x,h.z,h.y]),herculesSupports,logFruitStation:{supportHome:{...herculesSupports[0].home},target:{...herculesSupports[0].axis[1]},heading:Math.PI/2}};}
const make=(opts={})=>createInsects(()=>0,{...config(),...opts});
function step(sim,seconds,p=far){for(let n=0;n<Math.round(seconds*120);n++)sim.update(1/120,p);}
function until(sim,check,max=50,p=far){for(let n=0;n<max*120;n++){sim.update(1/120,p);if(check())return;}assert.fail('expected log visit transition');}
function capture(sim,item=sim.items[0]){const p={x:item.x,y:item.y+.5,z:item.z+.8,speed:0,quiet:true};assert.equal(sim.swing(p,{x:0,y:-.5,z:-.8}).item?.id,item.id);return p;}
const place=sim=>assert.equal(sim.placeLogFruit({type:'fermented-fruit'}),true);
function supported(item){assert.ok(item.x>=-5.6-1e-9&&item.x<=-4.4+1e-9);assert.equal(item.y,.9);assert.equal(item.z,5.5);assert.equal(item.flightBlend,0);assert.equal(item.excursion,null);for(const key of ['x','y','z','heading','walkPhase','walkSpeed','turnProgress'])assert.ok(Number.isFinite(item[key]));}

test('fixed optional station has strict copied inputs, one live slot and detached status; pause/reset leave no stale visit',()=>{
 assert.equal(make({logFruitStation:null}).placeLogFruit({type:'fermented-fruit'}),false);
 for(const change of [s=>s.target.x+=.1,s=>s.target.y+=.1,s=>s.heading=NaN,s=>s.heading=0,s=>s.extra=true,s=>s.supportHome.x=99]){const cfg=config();change(cfg.logFruitStation);assert.throws(()=>createInsects(()=>0,cfg),/Invalid log fruit station/);}
 const cfg=config(),sim=createInsects(()=>0,cfg);cfg.logFruitStation.target.x=99;
 for(const value of [null,{}, {type:'other'},{type:'fermented-fruit',x:0},Object.create({type:'fermented-fruit'})])assert.equal(sim.placeLogFruit(value),false);
 place(sim);assert.equal(sim.placeLogFruit({type:'fermented-fruit'}),false);const snapshot=sim.logFruit;snapshot.remaining=0;snapshot.visitorId='fake';assert.equal(sim.logFruit.remaining,90);assert.equal(sim.logFruit.visitorId,null);
 const before=structuredClone(sim.items);for(const dt of [0,-1,NaN,Infinity])sim.update(dt,far);assert.deepEqual(sim.items,before);assert.equal(sim.logFruit.remaining,90);
 until(sim,()=>sim.logFruit?.status==='approaching');sim.reset();assert.equal(sim.logFruit,null);assert.deepEqual(sim.items,make().items);step(sim,5);assert.equal(sim.logFruit,null);assert.equal(sim.items.length,2);assert.equal(sim.removeLogFruit(),false);
});

test('one supported beetle approaches, rests near fruit without feeding claims, returns and can revisit; phase never snaps',()=>{
 const sim=make(),item=sim.items[0],start=position(item);place(sim);const states=new Set();let previous=position(item),returned=false,visits=0,lastStatus='waiting',anchor=start;
 for(let n=0;n<89*120;n++){
  const before=previous;sim.update(1/120,far);supported(item);assert.ok(gap(position(item),previous)<=.18/120+1e-9);previous=position(item);const food=sim.logFruit;states.add(food.status);
  if(food.visitorId)assert.equal(food.visitorId,item.id);if(food.status==='approaching'&&lastStatus==='waiting')anchor=before;
  if(food.status==='resting'){
   assert.equal(item.state,'resting');assert.ok(-4.4-item.x>=-1e-8&&-4.4-item.x<.025+1e-8);assert.ok(Math.abs(Math.sin(item.walkPhase))<1e-8);assert.ok(Math.abs(item.heading-Math.PI/2)<.01);if(lastStatus!=='resting')visits++;
  }
  if(lastStatus==='returning'&&food.status==='waiting'){returned=true;assert.ok(gap(position(item),anchor)<.025+1e-8);}
  lastStatus=food.status;
 }
 // Already within the arrival tolerance but facing away: a finite in-place turn,
 // never a zero-distance interpolation or a permanent approaching state.
 const cfg=config();cfg.logFruitStation.target.x=cfg.herculesSupports[0].home.x+.02;cfg.logFruitStation.heading=-Math.PI/2;
 const closeGoal=createInsects(()=>0,cfg),root=position(closeGoal.items[0]);place(closeGoal);until(closeGoal,()=>closeGoal.items[0].state==='turning');let last=closeGoal.items[0].heading;
 until(closeGoal,()=>{const i=closeGoal.items[0];assert.deepEqual(position(i),root);assert.ok(Math.abs(i.heading-last)<.05);last=i.heading;return closeGoal.logFruit.status==='resting';});assert.ok(Math.abs(closeGoal.items[0].heading+Math.PI/2)<.01);
 assert.deepEqual(states,new Set(['waiting','approaching','resting','returning']));assert.ok(returned);assert.ok(visits>=2);step(sim,1.1);assert.equal(sim.logFruit,null);assert.equal(sim.items.length,2);
});

test('withdrawal and expiry stop at a grounded phase before return, including turning; replacing food does not duplicate a reservation',()=>{
 for(const phase of ['walking','turning','resting']){
  const sim=make(),item=sim.items[0];
  // Face the far end first through ordinary movement, without mutating pose fields.
  if(phase==='turning'){const p=capture(sim);sim.release({...p,x:item.x+1,z:item.z});until(sim,()=>item.state==='resting');}
  place(sim);until(sim,()=>sim.logFruit?.visitorId&&item.state===phase);
  const before=position(item);assert.equal(sim.removeLogFruit(),true);assert.deepEqual(position(item),before);assert.equal(sim.logFruit,null);place(sim);assert.equal(sim.logFruit.visitorId,item.id);assert.equal(sim.logFruit.status,'returning');
  let previous=position(item);until(sim,()=>{supported(item);assert.ok(gap(position(item),previous)<=.18/120+1e-9);previous=position(item);return sim.logFruit.status==='waiting';});assert.ok(Math.abs(Math.sin(item.walkPhase))<1e-8);assert.equal(sim.logFruit.visitorId,null);
 }
 const sim=make();place(sim);const near={x:-4.4,y:1.65,z:7.5,speed:0,quiet:true};step(sim,85,near);assert.equal(sim.logFruit.status,'waiting');until(sim,()=>sim.logFruit?.status==='approaching',5,far);until(sim,()=>sim.logFruit===null,5,far);step(sim,12);supported(sim.items[0]);assert.equal(sim.logFruit,null);
});

test('capture/near interruption preserves real pose and old release priority, including off-grid re-approach and held expiry',()=>{
 const sim=make(),item=sim.items[0];place(sim);until(sim,()=>item.state==='walking'&&item.walkPhase>.13);const before={position:position(item),phase:item.walkPhase,heading:item.heading},p=capture(sim);
 assert.equal(sim.logFruit.visitorId,null);step(sim,100);assert.equal(sim.logFruit,null);assert.deepEqual(position(item),before.position);assert.equal(item.walkPhase,before.phase);assert.equal(item.heading,before.heading);sim.release({...p,x:item.x-1,z:item.z});assert.deepEqual(position(item),before.position);assert.equal(item.walkPhase,before.phase);until(sim,()=>item.state==='resting');
 place(sim);until(sim,()=>sim.logFruit?.status==='resting',60);assert.ok(-4.4-item.x<.025+1e-8);assert.ok(Math.abs(Math.sin(item.walkPhase))<1e-8);
 const quiet={x:item.x,y:1.65,z:item.z+1.2,speed:0,quiet:true};step(sim,.2,quiet);assert.equal(sim.logFruit.status,'resting');const close={...quiet,quiet:false};until(sim,()=>sim.logFruit.visitorId===null,5,close);supported(item);step(sim,15,close);assert.equal(sim.logFruit.visitorId,null);assert.equal(sim.items.length,2);
 const paused=make();place(paused);until(paused,()=>paused.logFruit?.status==='resting');const q=capture(paused),held=position(paused.caught);assert.equal(paused.removeLogFruit(),true);step(paused,2);assert.deepEqual(position(paused.caught),held);paused.release(q);assert.deepEqual(position(paused.items[0]),held);
});

test('log fruit and the unchanged morpho slot coexist and are independently removable',()=>{
 const cfg=config();cfg.homes.push(['morpho',0,7,1.15],['morpho',-6,0,1.3],['morpho',6,-8,1.2],['morpho',-3,-17,1.35]);const sim=createInsects(()=>0,cfg);
 assert.equal(sim.placeBait({type:'fermented-fruit',x:-3,y:.8,z:2}),true);place(sim);step(sim,8);assert.ok(sim.bait?.active);assert.ok(sim.logFruit?.active);assert.equal(sim.logFruit.visitorId,'insect-1');if(sim.bait.visitorId)assert.equal(sim.items.find(i=>i.id===sim.bait.visitorId).species,'morpho');
 const oldBait=sim.bait;sim.removeLogFruit();assert.deepEqual(sim.bait,oldBait);place(sim);const log=sim.logFruit;sim.removeBait();assert.deepEqual(sim.logFruit,log);assert.equal(sim.bait,null);sim.reset();assert.equal(sim.logFruit,null);assert.equal(sim.bait,null);assert.equal(sim.items.length,6);
});
