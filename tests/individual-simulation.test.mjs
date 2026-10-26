/** Real Three.js geometry/rays/projection; canvas is a double, no WebGL/fun claim. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
const sandbox={console};vm.runInNewContext(fs.readFileSync(new URL('../assets/vendor/three.min.js',import.meta.url),'utf8'),sandbox);
const T=sandbox.THREE,context={};
for(const method of ['fillRect','clearRect','beginPath','moveTo','lineTo','bezierCurveTo','quadraticCurveTo','stroke','fill','save','restore','translate','rotate','ellipse','arc','drawImage','closePath','clip'])context[method]=()=>{};
context.createLinearGradient=()=>({addColorStop(){}});
globalThis.window={THREE:T};globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>context})};
const {createInsectModel,updateInsectModel}=await import('../src/insect-models.js');
const {createBattleView}=await import('../src/battle-view.js');
const {individualHabitatOptions}=await import('../src/individual-layout.js');
const {createTropicalWorld}=await import('../src/world-tropical.js');
const {createNightWorld}=await import('../src/world-night.js');
const {createUnderstoryWorld}=await import('../src/world-understory.js');
const {createRhinoHabitat}=await import('../src/rhino-habitat.js');
const {createStagHabitat}=await import('../src/stag-habitat.js');
const {createMetalliferHabitat}=await import('../src/metallifer-habitat.js');
const species=['hercules','rhino','stag','metallifer'],height={hercules:.06,rhino:.05,stag:.045,metallifer:0};
const v=p=>new T.Vector3(p.x,p.y,p.z);
function dispose(model){const g=new Set(),m=new Set();model.traverse(n=>{if(n.geometry)g.add(n.geometry);if(n.material)for(const x of Array.isArray(n.material)?n.material:[n.material])m.add(x);});for(const x of[...g,...m])x.dispose();}
function signature(model){const hash=createHash('sha256');model.traverse(n=>{for(const key of Object.keys(n.geometry?.attributes||{}).sort()){const a=n.geometry.attributes[key].array;hash.update(key);hash.update(Buffer.from(a.buffer,a.byteOffset,a.byteLength));}if(n.geometry?.index){const a=n.geometry.index.array;hash.update(Buffer.from(a.buffer,a.byteOffset,a.byteLength));}});return hash.digest('hex');}
function rig(model){return model.userData.species==='hercules'?model.userData.visual.userData.legs:model.userData.legs;}
function feet(model){return rig(model).map(leg=>({leg,local:leg.foot||leg.mesh.userData.foot,mesh:leg.mesh}));}
function localFootOnSkin(foot){const p=foot.mesh.geometry.attributes.position,point=v(foot.local).applyMatrix4(foot.mesh.matrixWorld);let gap=Infinity;for(let k=0;k<p.count;k++)gap=Math.min(gap,new T.Vector3().fromBufferAttribute(p,k).applyMatrix4(foot.mesh.matrixWorld).distanceTo(point));assert.ok(gap<2e-6,'foot metadata touches the actual rendered skin');return point;}

function habitats(){
 const tropicalScene=new T.Scene(),tropical=createTropicalWorld(tropicalScene),nightScene=new T.Scene(),night=createNightWorld(nightScene),rhino=createRhinoHabitat(night,nightScene),stag=createStagHabitat(night,nightScene),understoryScene=new T.Scene(),understory=createUnderstoryWorld(understoryScene),metallifer=createMetalliferHabitat(understory,understoryScene);
 for(const scene of[tropicalScene,nightScene,understoryScene])scene.updateMatrixWorld(true);
 return[
  {habitat:'tropical',world:tropical,scene:tropicalScene,wood:tropicalScene.getObjectByName('tropical-beetle-logs'),options:{homes:tropical.insectHomes,extraHomes:tropical.herculesHomes,herculesSupports:tropical.herculesSupports},slots:[['hercules','hercules-a','insect-5'],['hercules','hercules-b','insect-6']]},
  {habitat:'night',world:night,scene:nightScene,wood:null,woods:{rhino:rhino.captureOccluders[0],stag:stag.captureOccluders[0]},options:{homes:night.insectHomes,extraHomes:[...rhino.homes,...stag.homes],rhinoSupports:rhino.rhinoSupports,stagSupports:stag.stagSupports},slots:[['rhino','rhino','insect-4'],['stag','stag','insect-5']]},
  {habitat:'understory',world:understory,scene:understoryScene,wood:metallifer.captureOccluders[0],options:{homes:understory.insectHomes,extraHomes:metallifer.homes,metalliferSupports:metallifer.metalliferSupports},slots:[['metallifer','metallifer','insect-4']]}
 ];
}

const {createInsects}=await import('../src/insects.js');
const {createLogFruitHabitat}=await import('../src/log-fruit-habitat.js');
const far={x:20,y:1.65,z:20,speed:0,quiet:true};
function profile(f,sizePermille,siteIndex){return f.slots.map(([species,populationSlotId,runtimeSlotId],i)=>({species,populationSlotId,runtimeSlotId,habitat:f.habitat,siteIndex,sizePermille,motionSeed:1234+i,measureVersion:1,encounterId:`g1-00000001-o1-${f.habitat}-${populationSlotId}`}));}
function configured(f,size,site){const options={...f.options,bounds:f.world.bounds};if(f.world.leafSupports)options.leafSupports=f.world.leafSupports;if(f.world.fireflySupports)options.fireflySupports=f.world.fireflySupports;return individualHabitatOptions(f.habitat,options,{encounters:profile(f,size,site)},f.world.heightAt);}
function advance(sim,n){for(let i=0;i<n;i++)sim.update(1/60,far);}

test('real supported simulation keeps seeded identity/size across reset, stays on wood while walking, and freezes capture without reroll',()=>{
 for(const f of habitats())for(const size of[1000,1150])for(const site of[0,1,2]){
  const options=configured(f,size,site),sim=createInsects(f.world.heightAt,options),again=createInsects(f.world.heightAt,options),records=profile(f,size,site),models=new Map(records.map(e=>[e.runtimeSlotId,createInsectModel(e.species,{sizePermille:size})])),ray=new T.Raycaster();let moving=false;
  for(let frame=0;frame<60*24;frame++){
   sim.update(1/60,far);again.update(1/60,far);
   for(const record of records){const item=sim.items.find(i=>i.id===record.runtimeSlotId),twin=again.items.find(i=>i.id===record.runtimeSlotId);assert.equal(item.encounterId,record.encounterId);assert.equal(item.sizePermille,size);assert.equal(item.x,twin.x);assert.equal(item.z,twin.z);moving||=Math.abs(item.walkSpeed)>0;
    if(frame%60!==0)continue;const model=models.get(item.id);updateInsectModel(model,item,sim.time,item.species==='hercules'?f.world.herculesSupportAt(item):null);model.updateMatrixWorld(true);const wood=f.wood||f.woods[item.species];
    for(const foot of feet(model)){if(item.species==='hercules'?foot.leg.wasSwing:Math.abs(foot.local.y+height[item.species])>1e-7)continue;const point=localFootOnSkin(foot);ray.set(point.clone().add(new T.Vector3(0,.03,0)),new T.Vector3(0,-1,0));ray.far=.06;const hit=ray.intersectObject(wood,false)[0];assert.ok(hit,`${item.species} real walk retains wood support`);assert.ok(Math.abs(point.y-hit.point.y)<2e-6,`${item.species} size${size} site${site} frame${frame} gap${point.y-hit.point.y} phase${item.walkPhase} foot${JSON.stringify(foot.local)}`);}
   }
  }
  assert.ok(moving);const item=sim.items.find(i=>i.id===records[0].runtimeSlotId),p={x:item.x+1.4,y:item.y+.25,z:item.z,quiet:true,speed:0},aim={x:item.x-p.x,y:item.y-p.y,z:item.z-p.z};assert.ok(sim.swing(p,aim).ok);const pose=({age,...rest})=>rest,frozen=JSON.stringify(pose(item));advance(sim,60);assert.equal(JSON.stringify(pose(item)),frozen);assert.equal(sim.release(p),item);assert.equal(item.sizePermille,size);assert.equal(item.encounterId,records[0].encounterId);sim.reset();assert.deepEqual(sim.items.filter(i=>i.encounterId).map(i=>[i.id,i.encounterId,i.sizePermille]),records.map(e=>[e.runtimeSlotId,e.encounterId,size]));for(const model of models.values())dispose(model);
 }
});

test('scaled/moved first log preserves fruit support binding and feeding approach instead of creating an invalid station',()=>{
 const f=habitats()[0],fruit=createLogFruitHabitat(f.world,f.scene);f.options.logFruitStation=fruit.simulationStation;
 for(const size of[1000,1150])for(const site of[0,1,2]){
  const sim=createInsects(f.world.heightAt,configured(f,size,site));assert.ok(sim.placeLogFruit({type:'fermented-fruit'}));let visitor=false;
  for(let i=0;i<60*60;i++){sim.update(1/60,far);visitor ||= sim.logFruit?.visitorId==='insect-5';const item=sim.items.find(i=>i.id==='insect-5');assert.ok([item.x,item.y,item.z,item.walkPhase].every(Number.isFinite));}
  assert.ok(visitor,'existing visitor can still approach fruit');assert.ok(sim.removeLogFruit());
 }
});

test('profile-free legacy/default habitat path is unchanged and malformed profiles cannot attach to another insect',()=>{
 const baseline=createInsects(()=>0),adapted=createInsects(()=>0,individualHabitatOptions('meadow',{}, {encounters:[]},()=>0));assert.deepEqual(adapted.items,baseline.items);
 const f=habitats()[1],options=configured(f,1150,1);assert.throws(()=>createInsects(f.world.heightAt,{...options,individuals:[{...options.individuals[0],runtimeSlotId:'insect-1'}]}),/Individual profile/);assert.throws(()=>createInsects(f.world.heightAt,{...options,individuals:[{...options.individuals[0],sizePermille:999}]}),/Individual profile/);
});
