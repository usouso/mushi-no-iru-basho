/** Pure simulation assertions. Not a browser, perceived naturalness or rendering test. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createInsects,SPECIES} from '../src/insects.js';
import {createStagStudy} from '../src/stag-study.js';
import {createMetalliferStudy,METALLIFER_MOTION as D} from '../src/metallifer-study.js';
const support=()=>({home:{x:-1.45,y:1.16,z:7.55},heading:0});
const setup=(options={})=>{const s=support();return createInsects(()=>0,{homes:[['metallifer',s.home.x,s.home.z,s.home.y]],metalliferSupports:[s],...options});};
const pose=i=>({x:i.x,y:i.y,z:i.z,heading:i.heading,pitch:i.pitch,jawOpen:i.jawOpen,walkPhase:i.walkPhase,walkSpeed:i.walkSpeed,direction:i.direction});
const eye=i=>({x:i.x+1.4,y:1.65,z:i.z+.4,quiet:true,speed:0});
const aim=(p,i)=>({x:i.x-p.x,y:i.y-p.y,z:i.z-p.z});
const far={x:12,y:1.65,z:12,speed:0};
function advance(s,seconds,player=far){for(let n=0;n<Math.round(seconds*120);n++)s.update(1/120,player);}

test('metallifer reuses existing finite stag timing, signed gait and bounded reaction with only rest jaw remapped',()=>{
 const input={position:{x:1,y:2,z:3},heading:.4},a=createMetalliferStudy(input),b=createStagStudy(input);let back=false;
 for(let n=0;n<65*120;n++){
  if(n===1700||n===4500){assert.equal(a.disturb(),b.disturb());}
  a.update(1/120);b.update(1/120);const x=a.state,y=b.state;
  assert.deepEqual(x.position,y.position);for(const k of ['heading','walkPhase','walkSpeed','phase','direction','time'])assert.equal(x[k],y[k]);
  assert.ok(Math.abs(x.jawOpen-(.15+(y.jawOpen-.25)*.55/.45))<1e-12);
  assert.ok(x.jawOpen>=.15-1e-12&&x.jawOpen<=.7+1e-12);assert.ok(Math.abs(x.walkSpeed)<=D.speed);assert.ok(Math.hypot(x.position.x-1,x.position.z-3)<=D.range+1e-12);back ||= x.walkSpeed<0;
 }
 assert.ok(back);assert.equal(D.cycleDistance,.04);a.reset();assert.equal(a.state.jawOpen,.15);
 for(const dt of [NaN,Infinity,-1,0])a.update(dt);assert.equal(a.state.time,0);
});

test('support binding rejects missing, mismatched, duplicate, inherited, accessor and out-of-bounds inputs',()=>{
 assert.equal(setup().items[0].metalliferPhase,'resting');
 const s=support();
 for(const bad of [[],[s,s],[{...s,home:{...s.home,y:NaN}}],[{...s,home:{...s.home,x:76}}],[{...s,heading:Infinity}],[{...s,home:{...s.home,z:7.6}}],[Object.create(s)],[{...s,get heading(){throw Error('must not execute');}}]])assert.throws(()=>setup({metalliferSupports:bad}),/Invalid metallifer supports/);
 assert.throws(()=>setup({homes:[['metallifer',s.home.x,s.home.z,s.home.y],['metallifer',s.home.x,s.home.z,s.home.y]]}),/Invalid metallifer supports/);
 assert.equal(Object.keys(SPECIES).length,25);assert.match(SPECIES.metallifer.observation,/観察用.*ゲーム上/);assert.match(SPECIES.metallifer.size,/実物の寸法ではありません/);
});

test('rest, walking and jaw-reaction captures freeze, then return continuously from the exact support pose',()=>{
 for(const mode of ['resting','walking','reacting']){
  const s=setup(),i=s.items[0];if(mode==='walking')advance(s,11);if(mode==='reacting')advance(s,.3,{x:i.x+.6,y:1.65,z:i.z,speed:0,quiet:false});
  assert.equal(i.metalliferPhase,mode);const p=eye(i),before=pose(i);assert.equal(s.swing(p,aim(p,i)).ok,true);advance(s,2);assert.deepEqual(pose(i),{...before,walkSpeed:0});assert.equal(s.caught,i);
  assert.equal(s.release(p),i);assert.deepEqual(pose(i),{...before,walkSpeed:0});assert.equal(i.metalliferPhase,'walking');const at=pose(i);s.update(1/120,far);assert.ok(Math.hypot(i.x-at.x,i.z-at.z)<1e-6);advance(s,1);assert.ok(Math.hypot(i.x-at.x,i.z-at.z)>.005);
 }
});

test('retained origin stays absent across updates/reset/recreated simulation, explicit release restores only the same individual',()=>{
 const s=setup(),i=s.items[0],p=eye(i);assert.ok(s.swing(p,aim(p,i)).ok);assert.equal(s.retain(),i);assert.equal(s.retain(),null);assert.equal(s.caught,null);assert.equal(i.companion,true);
 const at=pose(i);advance(s,2);assert.deepEqual(pose(i),at);assert.equal(s.findTarget(p,aim(p,i)),null);s.reset();assert.equal(s.items.length,1);assert.equal(s.items[0].caught,true);assert.equal(s.items[0].companion,true);
 const origins=[{id:i.id,species:i.species}],recreated=setup();recreated.setCompanions(origins);recreated.setCompanions(origins);assert.equal(recreated.items.filter(x=>!x.caught).length,0);assert.equal(recreated.caught,null);
 recreated.setCompanions([]);assert.equal(recreated.items.length,1);assert.equal(recreated.items[0].caught,false);assert.equal(recreated.items[0].companion,false);assert.equal(recreated.items[0].metalliferPhase,'walking');advance(recreated,1);assert.ok(recreated.items[0].z>7.55);recreated.setCompanions([]);assert.equal(recreated.items.length,1);
 // Another habitat may have the same numerical id but must not hide a different species.
 const elsewhere=createInsects(()=>0,{homes:[['butterfly',0,0,1]]});elsewhere.setCompanions(origins);assert.equal(elsewhere.items[0].caught,false);
});
