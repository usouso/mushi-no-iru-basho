/** Narrow Hercules response wiring; synthetic horizontal supports, no visual claim. */
import test from 'node:test';import assert from 'node:assert/strict';
import {createInsects} from '../src/insects.js';
const far={x:20,y:1.65,z:20,speed:0,quiet:true};
function setup(extra={}){const herculesSupports=[[-5,5.5],[-7,2.8]].map(([x,z])=>({home:{x,y:.9,z},axis:[{x:x-.6,y:.9,z},{x:x+.6,y:.9,z}]}));return createInsects(()=>0,{homes:herculesSupports.map(({home:h})=>['hercules',h.x,h.z,h.y]),herculesSupports,logFruitStation:{supportHome:{...herculesSupports[0].home},target:{...herculesSupports[0].axis[1]},heading:Math.PI/2},...extra});}
const step=(s,t,p=far)=>{for(let n=0;n<Math.round(t*120);n++)s.update(1/120,p);};
const until=(s,f,p=far,max=45)=>{for(let n=0;n<max*120;n++){s.update(1/120,p);if(f())return;}assert.fail('transition not reached');};
const aim=(p,i)=>({x:i.x-p.x,y:i.y-p.y,z:i.z-p.z});
const side=i=>({x:i.x-.1,y:1.65,z:i.z+2,speed:0,quiet:false});
const off=(p,i)=>{const d=aim(p,i),a=.85;return{x:d.x*Math.cos(a)+d.z*Math.sin(a),y:d.y,z:-d.x*Math.sin(a)+d.z*Math.cos(a)};};
const pose=i=>[i.x,i.y,i.z,i.heading,i.walkPhase,i.turnProgress];
function supported(i){const x=i.id==='insect-1'?-5:-7;assert.ok(i.x>=x-.60000001&&i.x<=x+.60000001);assert.equal(i.y,.9);assert.equal(i.z,i.id==='insect-1'?5.5:2.8);assert.ok(pose(i).every(Number.isFinite));assert.equal(i.flightBlend,0);}

test('a real failed aim can start either Hercules; range, cone and solid LOS remain shared gates',()=>{
 for(const index of[0,1]){const s=setup(),i=s.items[index],p=side(i),d=off(p,i);assert.equal(s.swing(p,d).ok,false);assert.equal(s.startleFromNet(p,d),i);assert.equal(i.departures,1);const before=structuredClone(i);assert.equal(s.startleFromNet(p,d),null);assert.deepEqual(i,before);step(s,.7,p);supported(i);assert.ok(i.x>before.x);assert.equal(s.swing(p,aim(p,i)).item,i,'moving target stays catchable');}
 for(const extra of[{hasLineOfSight:()=>false},{hasLineOfSight:()=>undefined}]){const s=setup(extra),i=s.items[0],p=side(i);assert.equal(s.startleFromNet(p,off(p,i)),null);assert.equal(i.departures,0);}
 for(const mode of['range','cone']){const s=setup(),i=s.items[0],p=mode==='range'?{...side(i),z:i.z+3.3}:side(i);assert.equal(s.startleFromNet(p,mode==='cone'?{x:0,y:0,z:1}:aim(p,i)),null);assert.equal(i.departures,0);}
});

test('normal/dash thresholds stay equal; quiet retains its smaller approach radius',()=>{
 const result=[];for(const [speed,quiet,z]of[[2.7,false,1.4],[5.4,false,1.4],[1.05,true,1.4],[1.05,true,.7]]){const s=setup(),i=s.items[0],p={x:i.x-.1,y:1.65,z:i.z+z,speed,quiet};step(s,.7,p);result.push({pose:pose(i),departures:i.departures});}
 assert.deepEqual(result[0],result[1]);assert.equal(result[0].departures,1);assert.equal(result[2].departures,0);assert.equal(result[3].departures,1);
});

test('a near entry during recovery is reconsidered once after ten seconds, and leaving cancels it',()=>{
 for(const leave of[false,true]){const s=setup(),i=s.items[0],p=side(i);s.startleFromNet(p,off(p,i));until(s,()=>i.state==='resting');const stopped=s.time,departures=i.departures,near={...side(i),z:i.z+1.2,speed:2.7};step(s,1,near);assert.equal(i.departures,departures);if(leave){step(s,.1,far);step(s,10,far);assert.equal(i.departures,departures);}else{step(s,8.8,near);assert.equal(i.departures,departures);until(s,()=>i.departures>departures,near,1);assert.ok(s.time-stopped>=10);assert.equal(i.departures,departures+1);until(s,()=>i.state==='resting',near);step(s,11,near);assert.equal(i.departures,departures+1,'same observer is not an automatic periodic retreat');}supported(i);}
});

test('held response is ignored, release preserves real pose, and an exhausted endpoint never teleports or becomes immune',()=>{
 const s=setup(),i=s.items[0],p=side(i);s.startleFromNet(p,off(p,i));step(s,.5,p);assert.equal(s.swing(p,aim(p,i)).item,i);const at=pose(i);assert.equal(s.startleFromNet(p,off(p,i)),null);step(s,2,p);assert.deepEqual(pose(i),at);s.release(p);assert.deepEqual(pose(i),at);step(s,.1,p);supported(i);
 until(s,()=>i.state==='resting');for(let k=0;k<4;k++){const eye=side(i);s.startleFromNet(eye,off(eye,i));until(s,()=>i.state==='resting');supported(i);}const edge=pose(i),eye=side(i);assert.equal(s.startleFromNet(eye,off(eye,i)),null);assert.deepEqual(pose(i),edge);assert.equal(s.swing(eye,aim(eye,i)).item,i);
});

test('a fruit visitor miss uses the existing grounded return, never a second move or feeding pose',()=>{
 for(const stage of['approaching','resting']){const s=setup(),i=s.items[0];assert.equal(s.placeLogFruit({type:'fermented-fruit'}),true);until(s,()=>s.logFruit.status===stage);if(stage==='approaching')step(s,.25);const p=side(i),at=pose(i);assert.equal(s.swing(p,off(p,i)).ok,false);assert.equal(s.startleFromNet(p,off(p,i)),i);assert.deepEqual(pose(i),at);assert.equal(s.logFruit.status,'returning');assert.equal(s.startleFromNet(p,off(p,i)),null);let prior=pose(i);until(s,()=>{supported(i);assert.notEqual(i.state,'feeding');assert.ok(Math.hypot(i.x-prior[0],i.z-prior[2])<.002);prior=pose(i);return s.logFruit.visitorId===null;},far);assert.equal(s.logFruit.active,true);assert.equal(s.logFruit.status,'waiting');assert.ok(Math.abs(i.x+5)<.02500001);}
});
