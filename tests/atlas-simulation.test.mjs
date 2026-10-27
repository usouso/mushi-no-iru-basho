/** Actual Atlas simulation wrapper; no renderer, human stealth or natural-defense claim. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createInsects,SPECIES} from '../src/insects.js';
const support=()=>({home:{x:1.6,y:1.175,z:6.45},heading:0});
const setup=(extra={})=>{const p=support();return createInsects(()=>0,{homes:[['atlas',p.home.x,p.home.z,p.home.y]],atlasSupports:[p],...extra});};
const far={x:12,y:1.65,z:12,speed:0},aim=(p,i)=>({x:i.x-p.x,y:i.y-p.y,z:i.z-p.z});
const pose=i=>({x:i.x,y:i.y,z:i.z,heading:i.heading,walkPhase:i.walkPhase,headLift:i.headLift});
function step(s,seconds,p=far){for(let n=0;n<Math.round(seconds*120);n++)s.update(1/120,p);}

test('front dash warns before capture range and retreats on the supported branch while quiet and rear approaches remain fair',()=>{
 for(const mode of['dash','quiet','rear']){
  const s=setup(),i=s.items[0],home={...i.home},p={x:i.x,y:1.65,z:i.z+(mode==='rear'?-2.3:3.6),speed:mode==='dash'?5.4:1.05,quiet:mode==='quiet'};
  if(mode==='quiet')p.z=i.z+2.3;s.update(1/120,p);
  if(mode==='dash'){assert.equal(i.atlasPhase,'warning');assert.ok(Math.hypot(i.x-p.x,i.y-p.y,i.z-p.z)>2.6);p.speed=0;step(s,5,p);assert.ok(i.z<home.z-.5);assert.equal(i.y,home.y);assert.ok(i.headLift>=0&&i.headLift<=1);}
  else{assert.equal(i.atlasPhase,'resting');assert.equal(s.swing(p,aim(p,i)).ok,true);}
 }
 const s=setup();for(const p of[undefined,null])for(let n=0;n<60;n++)s.update(1/120,p);assert.ok(s.items.every(i=>[i.x,i.y,i.z,i.walkPhase].every(Number.isFinite)));
});

test('a near off-axis miss can trigger the visible reaction, but behind/trunk-veto/held cases cannot',()=>{
 const s=setup(),i=s.items[0],p={x:i.x,y:i.y,z:i.z+2.3,speed:0},off={x:.8,y:0,z:-.6};assert.equal(s.swing(p,off).ok,false);assert.equal(s.startleFromNet(p,off),i);assert.equal(i.atlasPhase,'warning');assert.equal(s.startleFromNet(p,off),null);step(s,.5,p);assert.equal(i.atlasPhase,'retreating');
 for(const los of[false,null,undefined]){const b=setup({hasLineOfSight:()=>los});assert.equal(b.startleFromNet(p,off),null);step(b,.5,{...p,speed:5.4});assert.equal(b.items[0].atlasPhase,'resting');}
 const behind=setup();assert.equal(behind.startleFromNet(p,{x:0,y:0,z:1}),null);assert.equal(behind.swing(p,aim(p,behind.items[0])).ok,true);assert.equal(behind.startleFromNet(p,off),null);
});

test('warning/retreat/ordinary poses freeze under capture and release continuously, then retained origin stays absent through reset',()=>{
 for(const mode of['resting','walking','warning','retreating']){
  const s=setup(),i=s.items[0];if(mode==='walking')step(s,6);if(mode==='warning'||mode==='retreating'){const p={x:i.x,y:i.y,z:i.z+3,speed:5.4};step(s,mode==='warning'?.1:.8,p);}assert.equal(i.atlasPhase,mode);
  const p={x:i.x+1.5,y:1.65,z:i.z,speed:0,quiet:true},before=pose(i);assert.equal(s.swing(p,aim(p,i)).ok,true);step(s,2);assert.deepEqual(pose(i),before);assert.equal(s.release(p),i);assert.deepEqual(pose(i),before);s.update(1/120,far);assert.ok(Math.hypot(i.x-before.x,i.z-before.z)<.002);assert.ok(Math.abs(i.headLift-before.headLift)<.08);
 }
 const s=setup(),i=s.items[0],p={x:i.x+1.5,y:1.65,z:i.z};s.swing(p,aim(p,i));assert.equal(s.retain(),i);const held=pose(i);step(s,3);assert.deepEqual(pose(i),held);assert.equal(s.caught,null);assert.equal(s.findTarget(p,aim(p,i)),null);s.reset();assert.equal(s.items[0].companion,true);assert.equal(s.items[0].caught,true);
 const fresh=setup();fresh.setCompanions([{id:i.id,species:'atlas'}]);assert.equal(fresh.items[0].caught,true);fresh.setCompanions([]);assert.equal(fresh.items[0].caught,false);assert.equal(fresh.items[0].companion,false);const before=pose(fresh.items[0]);step(fresh,.5);assert.ok(fresh.items[0].z<before.z);assert.equal(fresh.items.length,1);
});

test('support schema rejects unsafe/mismatched routes and fixed Atlas stays unmeasured while metadata distinguishes display indices from natural length',()=>{
 const p=support();for(const bad of[[],[p,p],[{...p,home:{...p.home,y:NaN}}],[{...p,home:{...p.home,z:7}}],[{...p,heading:Infinity}],[Object.create(p)],[{...p,get heading(){throw Error('must not execute');}}]])assert.throws(()=>setup({atlasSupports:bad}),/Invalid atlas supports/);
 const edge={home:{x:0,y:1.175,z:-74.9},heading:0};assert.throws(()=>createInsects(()=>0,{homes:[['atlas',0,-74.9,1.175]],atlasSupports:[edge]}),/Invalid atlas supports/);
 const s=setup(),before=structuredClone(s.items);for(const d of[0,-1,NaN,Infinity])s.update(d,far);assert.deepEqual(s.items,before);assert.equal(Object.keys(SPECIES).length,30);assert.match(SPECIES.atlas.size,/実物の寸法ではありません.*以前の固定個体の大きさは作り直しません/);assert.match(SPECIES.atlas.observation,/ゲーム上の近似/);
});
