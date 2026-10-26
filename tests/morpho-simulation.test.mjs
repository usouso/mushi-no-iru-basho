/** New-species loop tests; tuning is gameplay, not measured natural flight timing. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createInsects,SPECIES} from '../src/insects.js';
import {TROPICAL_HOMES} from '../src/tropical-layout.js';
const make=()=>createInsects(()=>0,{homes:TROPICAL_HOMES,bounds:32});
const aim=(i,p)=>({x:i.x-p.x,y:i.y-p.y,z:i.z-p.z});
test('default meadow retains eighteen original insects; tropical config creates only four morphos',()=>{
 const meadow=createInsects();assert.equal(meadow.items.length,18);
 assert.deepEqual(meadow.items.reduce((m,i)=>(m[i.species]=(m[i.species]||0)+1,m),{}),{butterfly:8,dragonfly:6,cicada:4});
 const tropical=make();assert.equal(tropical.items.length,4);assert.ok(tropical.items.every(i=>i.species==='morpho'));
 assert.equal(SPECIES.morpho.scientificName,'Morpho helenor peleides');assert.match(SPECIES.morpho.size,/48cm/);
});
test('all tropical profiles stay finite across a minute of rest and flight, without leaving the small field',()=>{
 const sim=make(),states=new Set();
 for(let frame=0;frame<3600;frame++){
  sim.update(1/60,null);
  for(const i of sim.items){states.add(i.state);for(const key of ['x','y','z','heading','wingPhase','flightBlend','alert'])assert.ok(Number.isFinite(i[key]),key);assert.ok(Math.abs(i.x)<=32&&Math.abs(i.z)<=32);}
 }
 assert.ok(states.has('resting'));assert.ok(states.has('flying'));assert.equal(sim.items.length,4);
});
test('morpho capture, inspection hold, continuous release, return and repeat retain the existing rules',()=>{
 const sim=make(),i=sim.items[0],p={x:i.x,y:i.y,z:i.z+1.5,speed:0,quiet:true};
 assert.equal(sim.swing(p,aim(i,p)).item.id,i.id);assert.equal(sim.caught,i);
 assert.equal(sim.swing(p,aim(i,p)).ok,false,'a second insect cannot replace the held one');
 const atCapture={x:i.x,y:i.y,z:i.z};sim.update(.1,p);assert.deepEqual({x:i.x,y:i.y,z:i.z},atCapture);
 sim.release(p);assert.equal(sim.caught,null);assert.deepEqual({x:i.x,y:i.y,z:i.z},atCapture);
 let previous={...atCapture},departed=false,landed=false;
 for(let frame=0;frame<720;frame++){
  sim.update(1/60,null);assert.ok(Math.hypot(i.x-previous.x,i.y-previous.y,i.z-previous.z)<.15,'no teleport at release/return');previous={x:i.x,y:i.y,z:i.z};
  departed ||= Math.hypot(i.x-i.home.x,i.z-i.home.z)>.5;
  if(frame>120&&i.resting&&Math.hypot(i.x-i.home.x,i.y-i.home.y,i.z-i.home.z)<.02){landed=true;break;}
 }
 assert.ok(departed&&landed);assert.equal(sim.swing(p,aim(i,p)).item.id,i.id);assert.equal(sim.catches,2);
});
test('quiet approach is useful without granting immunity; noisy dash still startles the new species',()=>{
 for(const quiet of [true,false]){
  const sim=make(),i=sim.items[1];let startled=false;
  const p={x:i.x,y:i.y,z:i.z+1.2,speed:quiet?1.05:5.4,quiet};
  for(let frame=0;frame<60;frame++){sim.update(1/60,p);startled ||= ['startled','landing'].includes(i.state);}
  assert.equal(startled,!quiet);
 }
 const sim=make(),i=sim.items[0];let startled=false;
 for(let frame=0;frame<30;frame++){sim.update(1/60,{x:i.home.x,y:i.home.y,z:i.home.z+.1,speed:0,quiet:true});startled ||= i.state==='startled';}
 assert.ok(startled,'standing on an insect is not invisible even when quiet');
});
test('reset and invalid habitat inputs are bounded; old API remains usable',()=>{
 const sim=make();sim.update(.1,null);sim.reset();assert.equal(sim.time,0);assert.equal(sim.catches,0);assert.equal(sim.caught,null);assert.equal(sim.items.length,4);
 for(const homes of [[],[['unknown',0,0,1]],[['__proto__',0,0,1]],[['constructor',0,0,1]],[['morpho',,0,1]],[['morpho',NaN,0,1]],[['morpho',0,0]]])assert.throws(()=>createInsects(()=>0,{homes}),TypeError);
 assert.equal(createInsects().items.length,18);
});
