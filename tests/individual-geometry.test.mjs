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
function minimumSkinY(root){let y=Infinity;const p=new T.Vector3();root.traverse(n=>{const a=n.geometry?.attributes.position;if(!a)return;for(let i=0;i<a.count;i++)y=Math.min(y,p.fromBufferAttribute(a,i).applyMatrix4(n.matrixWorld).y);});return y;}
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
function selected(f,sizePermille,siteIndex){
 const encounters=f.slots.map(([species,populationSlotId,runtimeSlotId])=>({species,populationSlotId,runtimeSlotId,habitat:f.habitat,siteIndex,sizePermille}));
 const options=individualHabitatOptions(f.habitat,f.options,{encounters},f.world.heightAt),rows=[...options.homes,...options.extraHomes];
 return encounters.map(e=>{const row=rows[Number(e.runtimeSlotId.slice(7))-1],support=options[e.species+'Supports'].find(s=>Math.abs(s.home.x-row[1])<1e-8&&Math.abs(s.home.z-row[2])<1e-8);return{...e,home:support.home,heading:support.axis?Math.atan2(support.axis[1].x-support.axis[0].x,support.axis[1].z-support.axis[0].z):support.heading};});
}

test('the original four measured species retain scaling, native geometry/defaults and external inspection framing',()=>{
 for(const id of species)for(const inspection of[false,true]){
  const normal=createInsectModel(id,{inspection}),reference=signature(normal),base=new T.Box3().setFromObject(normal).getSize(new T.Vector3());
  for(const sizePermille of[null,undefined,999,1151,NaN,Infinity,1000,1075,1150]){
   const model=createInsectModel(id,{inspection,sizePermille}),factor=Number.isInteger(sizePermille)&&sizePermille>=1000&&sizePermille<=1150?sizePermille/1000:1;
   assert.equal(signature(model),reference);assert.equal(model.userData.individualScale,factor);assert.deepEqual(Array.from(model.scale.toArray()),[factor,factor,factor]);
   const bounds=new T.Box3().setFromObject(model).getSize(new T.Vector3());assert.ok(bounds.distanceTo(base.clone().multiplyScalar(factor))<1e-8,'geometry scaled once');
   if(inspection)model.scale.setScalar(3.5*factor);
   for(let frame=0;frame<3;frame++)updateInsectModel(model,{x:0,y:height[id]*factor,z:0,heading:0,walkPhase:0,walkSpeed:0,jawOpen:.15,caught:false,state:'resting'},frame/60);
   assert.equal(model.scale.x,(inspection?3.5:1)*factor);dispose(model);
  }
  dispose(normal);
 }
 for(const id of['butterfly','dragonfly','cicada','morpho','grasshopper','leafinsect','waterstrider','leafcutterant','firefly','dungbeetle','divingbeetle','mantis','ladybird','bee','swallowtail','jewel','longhorn']){const model=createInsectModel(id,{sizePermille:1150});assert.equal(model.scale.x,1,id+' unchanged');dispose(model);}
});

test('all three support sites at minimum and maximum size have actual skin feet on existing wood throughout short forward/reverse poses',()=>{
 const ray=new T.Raycaster();let contacts=0;
 for(const f of habitats())for(const sizePermille of[1000,1150])for(const site of[0,1,2])for(const record of selected(f,sizePermille,site)){
  const factor=sizePermille/1000,model=createInsectModel(record.species,{sizePermille}),wood=f.wood||f.woods[record.species];f.scene.add(model);
  for(const distance of[0,.005,.01,.02,.06,.12,-.12]){
   const d=distance*factor,cycle=record.species==='hercules'?.05:.04;
   updateInsectModel(model,{x:record.home.x+Math.sin(record.heading)*d,y:record.home.y,z:record.home.z+Math.cos(record.heading)*d,heading:record.heading,walkPhase:distance/cycle*Math.PI*2,walkSpeed:distance===0?0:.02*factor,jawOpen:.7,caught:false,state:distance===0?'resting':'walking'});
   model.updateMatrixWorld(true);let planted=0;
   for(const foot of feet(model)){
    if(Math.abs(foot.local.y+height[record.species])>1e-7)continue;
    const point=localFootOnSkin(foot);ray.set(point.clone().add(new T.Vector3(0,.03,0)),new T.Vector3(0,-1,0));ray.far=.06;const hit=ray.intersectObject(wood,false)[0];assert.ok(hit,`${record.species} site${site} size${sizePermille} foot has wood`);assert.ok(Math.abs(hit.point.y-point.y)<2e-6,`${record.species} support gap ${hit.point.y-point.y}`);planted++;contacts++;
   }
   assert.ok(planted>=3,record.species+' has a support tripod');
  }
  f.scene.remove(model);dispose(model);
 }
 assert.ok(contacts>500);
});

test('scaled Hercules planted feet stay fixed in world space, swing lift scales, and repeated capture/inspection never stretches feet',()=>{
 for(const factor of[1,1.075,1.15]){
  const model=createInsectModel('hercules',{sizePermille:factor*1000}),home={x:2,y:1+.06*factor,z:3},oldFeet=new Map();let maxLift=0;
  for(let frame=0;frame<=100;frame++){
   const distance=frame*.001*factor,item={x:home.x+distance,y:home.y,z:home.z,heading:Math.PI/2,walkPhase:distance/(.05*factor)*Math.PI*2,walkSpeed:.02*factor,caught:false,state:'walking'};
   updateInsectModel(model,item);model.updateMatrixWorld(true);
   for(const foot of feet(model)){
    const point=localFootOnSkin(foot),q=((item.walkPhase/(2*Math.PI)+foot.leg.offset)%1+1)%1,planted=q<=.6;
    assert.ok(point.y>=1-1e-7);maxLift=Math.max(maxLift,point.y-1);
    if(planted&&oldFeet.get(foot.leg)?.planted)assert.ok(point.distanceTo(oldFeet.get(foot.leg).point)<1e-7,'consecutive planted frames must not slide');
    oldFeet.set(foot.leg,{point,planted});
   }
  }
  assert.ok(Math.abs(maxLift-.012*factor)<1e-6);
  updateInsectModel(model,{x:home.x,y:home.y,z:home.z,heading:0,walkPhase:0,caught:true,state:'resting'});assert.equal(model.visible,false);updateInsectModel(model,{x:home.x,y:home.y,z:home.z,heading:0,walkPhase:0,caught:false,state:'resting'});model.updateMatrixWorld(true);for(const foot of feet(model))assert.ok(Math.abs(localFootOnSkin(foot).y-1)<1e-7);dispose(model);
 }
});

test('all 4x4 battle pairings with mixed/maximum sizes keep support, permitted weapon contact, framing and the unchanged final ring position',()=>{
 const point=new T.Vector3();
 for(const playerSpecies of species)for(const opponentSpecies of species)for(const[playerSizePermille,opponentSizePermille]of[[1000,1150],[1150,1000],[1150,1150]]){
  const view=createBattleView({playerSpecies,opponentSpecies,playerSizePermille,opponentSizePermille}),player=view.scene.getObjectByName('battle-player'),opponent=view.scene.getObjectByName('battle-opponent'),radius=view.scene.getObjectByName('battle-stump').geometry.parameters.radiusTop;
  assert.equal(player.children[0].scale.x,playerSizePermille/1000);assert.equal(opponent.children[0].scale.x,opponentSizePermille/1000);
  for(const aspect of[.45,16/9])for(const position of[-4,0,4]){
   view.resize(aspect);
   for(const action of['push','evade','brace']){
    const delta=(Math.sign(position)||1)*.35,before=position-delta;view.update({phase:'watching',position:before,exchanges:0,lastExchange:null},0,{reducedMotion:true});
    const state={phase:'finished',position,exchanges:action==='push'?1:action==='evade'?2:3,lastExchange:{playerAction:action,opponentAction:action==='push'?'brace':'push',positionBefore:before,positionAfter:position,delta}},bytes=JSON.stringify(state);
    for(let frame=0;frame<16;frame++){
     view.update(state,.1);assert.equal(JSON.stringify(state),bytes,'view cannot change strength/outcome');view.scene.updateMatrixWorld(true);
     const a=new T.Box3().setFromObject(player),b=new T.Box3().setFromObject(opponent),presentation=view.getPresentation();if(presentation.settled)assert.ok(b.min.x-a.max.x>=.004-1e-10);if(presentation.contactActive)assert.ok(view.scene.userData.battleContact.distance<.006);
     for(const body of[player,opponent])assert.ok(Math.abs(minimumSkinY(body))<2e-5,'actual feet, not rotated empty bbox corners, touch the table');
     for(const box of[a,b]){for(const x of[box.min.x,box.max.x])for(const y of[box.min.y,box.max.y])for(const z of[box.min.z,box.max.z]){assert.ok(Math.hypot(x,z)<radius);point.set(x,y,z).project(view.camera);assert.ok(point.x>=-.881&&point.x<=.881&&point.y>=-.581&&point.y<=.581&&point.z>=-1&&point.z<=1,`${playerSpecies}/${opponentSpecies} scaled pose outside frame`);}}
    }
   }
   if(position!==0){const losing=(position>0?opponent:player).children[0],body=losing.userData.visual?.userData.bodyBounds;if(body)body.getCenter(point).applyMatrix4(losing.matrixWorld);else new T.Box3().setFromObject(losing.userData.bodyMesh).getCenter(point);const ring=view.scene.getObjectByName('battle-ring').geometry.parameters.radius;assert.ok(Math.abs(point.x-Math.sign(position)*ring)<1e-10,'size must transform body centre exactly once');}
  }
  view.dispose();
 }
});
