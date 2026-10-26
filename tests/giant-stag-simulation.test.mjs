/** Actual supported simulation and capture rays; CPU geometry, not rendered QA. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createInsects,SPECIES} from '../src/insects.js';
import {GIANT_STAG_MOTION as M} from '../src/giant-stag-study.js';
import {individualHabitatOptions} from '../src/individual-layout.js';
const sandbox={console};vm.runInNewContext(fs.readFileSync(new URL('../assets/vendor/three.min.js',import.meta.url),'utf8'),sandbox);const T=sandbox.THREE;globalThis.window={THREE:T};
const {createNightWorld}=await import('../src/world-night.js'),{createRhinoHabitat}=await import('../src/rhino-habitat.js'),{createStagHabitat}=await import('../src/stag-habitat.js'),{createGiantStagHabitat}=await import('../src/giant-stag-habitat.js'),{createCaptureVisibility}=await import('../src/capture-visibility.js');
const dt=1/120,far={x:20,y:1.65,z:20,speed:0},aim=(p,i)=>({x:i.x-p.x,y:i.y-p.y,z:i.z-p.z}),pose=i=>({x:i.x,y:i.y,z:i.z,heading:i.heading,phase:i.giantStagPhase,walkPhase:i.walkPhase,jawOpen:i.jawOpen,warningBlend:i.warningBlend});
function fixture(t){
 const scene=new T.Scene(),world=createNightWorld(scene),rhino=createRhinoHabitat(world,scene),stag=createStagHabitat(world,scene),giant=createGiantStagHabitat(world,scene);scene.updateMatrixWorld(true);
 const old={homes:world.insectHomes,fireflySupports:world.fireflySupports,extraHomes:[...rhino.homes,...stag.homes],rhinoSupports:rhino.rhinoSupports,stagSupports:stag.stagSupports,bounds:world.bounds};
 const los=createCaptureVisibility([...world.captureOccluders,...rhino.captureOccluders,...stag.captureOccluders,...giant.captureOccluders]),options={...old,extraHomes:[...old.extraHomes,...giant.homes],giantStagSupports:giant.giantStagSupports,hasLineOfSight:los};
 const sim=createInsects(world.heightAt,options),item=sim.items[5];
 t.after(()=>{const resources=new Set();scene.traverse(m=>{if(m.geometry)resources.add(m.geometry);for(const mat of m.material?(Array.isArray(m.material)?m.material:[m.material]):[])resources.add(mat);});for(const r of resources)r.dispose();});
 return{world,old,options,sim,item,los,front:{x:-7.95,y:world.heightAt(-7.95,2)+1.65,z:2,speed:3},side:{x:-5.55,y:world.heightAt(-5.55,-.3)+1.28,z:-.3,speed:1.05,quiet:true}};
}
function tick(sim,n,p=far){for(let i=0;i<n;i++)sim.update(dt,p);}

test('night appends only insect-6; old five runtime IDs, measurements and deterministic motion remain identical',t=>{
 const f=fixture(t),records=['rhino','stag'].map((species,n)=>({species,populationSlotId:species,runtimeSlotId:'insect-'+(n+4),habitat:'night',siteIndex:2,sizePermille:1150,motionSeed:30+n,measureVersion:1,encounterId:`g1-1234abcd-o1-night-${species}`})),snapshot={encounters:records};
 const before=createInsects(f.world.heightAt,individualHabitatOptions('night',f.old,snapshot,f.world.heightAt)),after=createInsects(f.world.heightAt,individualHabitatOptions('night',f.options,snapshot,f.world.heightAt));
 assert.deepEqual(after.items.map(i=>[i.id,i.species]),[['insect-1','firefly'],['insect-2','firefly'],['insect-3','firefly'],['insect-4','rhino'],['insect-5','stag'],['insect-6','giantstag']]);
 for(let n=0;n<600;n++){before.update(dt,far);after.update(dt,far);if(n%60===0)assert.deepEqual(after.items.slice(0,5),before.items);}
 const giant=after.items[5];for(const k of['encounterId','sizePermille','motionSeed','measureVersion'])assert.equal(giant[k],undefined);assert.match(SPECIES.giantstag.size,/未計測/);assert.equal(snapshot.encounters.length,2);assert.deepEqual(snapshot.encounters,records);
});

test('ordinary approach warns outside net reach, retreats behind real bark, and remains capturable from a quiet side approach',t=>{
 const f=fixture(t),{sim,item,front,side,los}=f;const p={...front,x:-8.65};sim.update(dt,p);assert.equal(item.giantStagPhase,'warning');assert.ok(Math.hypot(item.x-p.x,item.y-p.y,item.z-p.z)>2.6);assert.ok(item.warningBlend>0);
 let warned=0,blocked=false,previous={...item};for(let n=0;n<600;n++){const was=item.giantStagPhase;sim.update(dt,front);if(was==='warning')warned+=dt;if(item.giantStagPhase==='retreating')assert.ok(warned>=M.warningSeconds-dt-1e-8);assert.ok(Math.hypot(item.x-previous.x,item.z-previous.z)<=M.retreatSpeed*dt+1e-9);previous={...item};if(los(front,item)===false){blocked=true;break;}}
 assert.ok(blocked,'the actual roof, not a species immunity flag, stops the forward ray');assert.ok(Math.hypot(item.x-front.x,item.y-front.y)<2.6);const miss=sim.swing(front,aim(front,item));assert.equal(miss.ok,false);assert.match(miss.reason,/遮る/);assert.equal(sim.startleFromNet(front,aim(front,item)),null);
 assert.equal(los(side,item),true);assert.equal(sim.swing(side,aim(side,item)).item,item);assert.equal(sim.caught,item);
 const quiet=fixture(t),q={...quiet.front,y:quiet.world.heightAt(-7.95,2)+1.28,speed:1.05,quiet:true};tick(quiet.sim,60,q);assert.equal(quiet.item.warningBlend,0);assert.equal(quiet.item.giantStagPhase,'resting');assert.equal(quiet.sim.swing(q,aim(q,quiet.item)).item,quiet.item);
});

test('visible off-axis miss warns once; invalid LOS, stillness, height, held and behind cases cannot spuriously restart it',()=>{
 const home={x:-5.75,y:.9,z:2},support={home,heading:-Math.PI/2,retreatBounds:{min:-.26,max:.18}},make=(los=()=>true)=>createInsects(()=>0,{homes:[['giantstag',home.x,home.z,home.y]],giantStagSupports:[support],hasLineOfSight:los}),p={x:-7.95,y:.9,z:2,speed:0},off={x:.6,y:0,z:.8};
 const s=make(),i=s.items[0];assert.equal(s.swing(p,off).ok,false);assert.equal(s.startleFromNet(p,off),i);assert.equal(i.giantStagPhase,'warning');for(let n=0;n<20;n++){assert.equal(s.startleFromNet(p,off),null);s.update(dt,p);}assert.equal(i.giantStagPhase,'warning');
 for(const los of[()=>false,()=>null,()=>undefined,()=>1]){const b=make(los);tick(b,120,{...p,speed:5.4});assert.equal(b.items[0].warningBlend,0);assert.equal(b.startleFromNet(p,off),null);}
 for(const eye of[p,{...p,y:4,speed:5.4}]){const b=make();tick(b,120,eye);assert.equal(b.items[0].giantStagPhase,'resting');}
 const b=make();assert.equal(b.startleFromNet(p,{x:-1,y:0,z:0}),null);assert.equal(b.swing(p,aim(p,b.items[0])).ok,true);assert.equal(b.startleFromNet(p,off),null);
});

test('capture freezes the warning/retreat pose, release preserves the individual, retention survives reset, and unsafe support records fail closed',t=>{
 for(const phase of['warning','retreating']){const f=fixture(t),{sim,item}=f;for(let n=0;n<1000&&item.giantStagPhase!==phase;n++)sim.update(dt,f.front);assert.equal(item.giantStagPhase,phase);const at=pose(item);assert.equal(sim.swing(f.side,aim(f.side,item)).item,item);assert.equal(item.walkSpeed,0,'captured locomotion stops, including signed zero');tick(sim,300,f.front);assert.deepEqual(pose(item),at);assert.equal(sim.release(f.side),item);assert.deepEqual(pose(item),at);sim.update(dt,far);assert.ok(Math.hypot(item.x-at.x,item.z-at.z)<=M.retreatSpeed*dt+1e-9);assert.equal(item.id,'insect-6');assert.equal(item.encounterId,undefined);assert.equal(sim.swing(f.side,aim(f.side,item)).item,item);assert.equal(sim.retain(),item);sim.reset();assert.equal(sim.items[5].companion,true);assert.equal(sim.items[5].caught,true);assert.notEqual(sim.findTarget(f.side,aim(f.side,sim.items[5]))?.item,sim.items[5]);sim.setCompanions([],f.side);assert.equal(sim.items[5].companion,false);assert.equal(sim.items[5].caught,false);assert.equal(sim.swing(f.side,aim(f.side,sim.items[5])).item,sim.items[5]);}
 const p={home:{x:0,y:.9,z:0},heading:0,retreatBounds:{min:-.26,max:.18}},make=s=>createInsects(()=>0,{homes:[['giantstag',0,0,.9]],giantStagSupports:s});
 for(const bad of[[],[p,p],[{...p,home:{...p.home,y:NaN}}],[{...p,home:{...p.home,x:1}}],[{...p,heading:Infinity}],[{...p,retreatBounds:{min:.01,max:.2}}],[Object.create(p)],[{...p,get heading(){throw Error('getter must not run');}}]])assert.throws(()=>make(bad),/Invalid giant stag supports/);
 const edge={...p,home:{x:0,y:.9,z:74.95}};assert.throws(()=>createInsects(()=>0,{homes:[['giantstag',0,74.95,.9]],giantStagSupports:[edge]}),/Invalid giant stag supports/);
});
