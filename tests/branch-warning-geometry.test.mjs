/** CPU geometry and existing support rays; not a rendered or biological test. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
const sandbox={console};vm.runInNewContext(fs.readFileSync(new URL('../assets/vendor/three.min.js',import.meta.url),'utf8'),sandbox);
const T=sandbox.THREE,context={};
for(const method of ['fillRect','clearRect','beginPath','moveTo','lineTo','bezierCurveTo','quadraticCurveTo','stroke','fill','save','restore','translate','rotate','ellipse','arc','drawImage','closePath','clip'])context[method]=()=>{};
context.createLinearGradient=()=>({addColorStop(){}});
globalThis.window={THREE:T};globalThis.document={createElement:()=>({getContext:()=>context})};
const {createInsectModel,updateInsectModel}=await import('../src/insect-models.js');
const {createBattleView}=await import('../src/battle-view.js');
const vector=p=>new T.Vector3(p.x,p.y,p.z);
function signature(root,{matrices=false}={}){root.updateMatrixWorld(true);const hash=createHash('sha256');root.traverse(n=>{hash.update(n.name);if(matrices)hash.update(JSON.stringify(n.matrixWorld.toArray()));for(const key of Object.keys(n.geometry?.attributes||{}).sort()){const a=n.geometry.attributes[key].array;hash.update(key);hash.update(Buffer.from(a.buffer,a.byteOffset,a.byteLength));}});return hash.digest('hex');}
function positions(mesh){return new Float32Array(mesh.geometry.attributes.position.array);}
function dispose(root){const resources=new Set();root.traverse(n=>{if(n.geometry)resources.add(n.geometry);for(const m of n.material?(Array.isArray(n.material)?n.material:[n.material]):[])resources.add(m);});for(const resource of resources)resource.dispose();}
function insideConvex(mesh,start,count,p){const a=mesh.geometry.attributes.position,ab=new T.Vector3(),ac=new T.Vector3(),normal=new T.Vector3(),base=new T.Vector3();for(let i=start;i<start+count;i+=3){base.fromBufferAttribute(a,i);ab.fromBufferAttribute(a,i+1).sub(base);ac.fromBufferAttribute(a,i+2).sub(base);normal.crossVectors(ab,ac);if(normal.lengthSq()<1e-20)continue;normal.normalize();if(normal.dot(p.clone().sub(base))>2e-6)return false;}return true;}
function footSkin(leg){const p=vector(leg.foot||leg.mesh.userData.foot).applyMatrix4(leg.mesh.matrixWorld),a=leg.mesh.geometry.attributes.position,q=new T.Vector3();let distance=Infinity;for(let i=0;i<a.count;i++)distance=Math.min(distance,q.fromBufferAttribute(a,i).applyMatrix4(leg.mesh.matrixWorld).distanceTo(p));assert.ok(distance<2e-6,'foot metadata must coincide with actual skin');return p;}
const resting={x:0,y:.05,z:0,heading:0,walkPhase:0,walkSpeed:0,rhinoPhase:'resting',caught:false};

test('Rhino field warning is one connected head transform; thorax horn, body, supported leg skin and scale stay unchanged',()=>{
 const model=createInsectModel('rhino'),d=model.userData,range=d.bodyMesh.userData.battleHead,pivot=new T.Vector3(...range.pivot),parts=[[d.bodyMesh,range.start,range.count],[d.hornMesh,0,d.hornMesh.userData.headHornVertexCount],[model.getObjectByName('rhino-eyes'),0,null],[model.getObjectByName('rhino-two-short-antennae'),0,null]].map(([mesh,start,count])=>({mesh,start,count:count??mesh.geometry.attributes.position.count,p:positions(mesh),n:new Float32Array(mesh.geometry.attributes.normal.array)})),baseline=signature(model),legs=d.legs.map(l=>positions(l.mesh));let moved=false;
 const meshCount=(()=>{let n=0;model.traverse(m=>{if(m.isMesh)n++;});return n;})();
 for(const blend of [...Array.from({length:21},(_,i)=>i/20),.75,.5,.25,0]){
  updateInsectModel(model,{...resting,warningBlend:blend});const q=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),-.13*blend);
  for(const part of parts){const a=part.mesh.geometry.attributes.position,n=part.mesh.geometry.attributes.normal;for(let i=0;i<a.count;i++){
   const expected=new T.Vector3().fromArray(part.p,i*3),expectedNormal=new T.Vector3().fromArray(part.n,i*3),moving=i>=part.start&&i<part.start+part.count;
   if(moving){expected.sub(pivot).applyQuaternion(q).add(pivot);expectedNormal.applyQuaternion(q);}
   assert.ok(new T.Vector3().fromBufferAttribute(a,i).distanceTo(expected)<2e-8,'only specified head vertices rotate about the common neck');assert.ok(new T.Vector3().fromBufferAttribute(n,i).distanceTo(expectedNormal)<1e-7,'head normals follow the same transform');
   if(!moving){assert.equal(a.getX(i),part.p[i*3]);assert.equal(a.getY(i),part.p[i*3+1]);assert.equal(a.getZ(i),part.p[i*3+2]);}
  }}
  const hornRoot=new T.Vector3(...d.hornMesh.userData.headRoot).sub(pivot).applyQuaternion(q).add(pivot);assert.ok(insideConvex(d.bodyMesh,range.start,range.count,hornRoot),'head horn socket remains inside actual closed head skin');
  // The preceding same-resolution ellipsoid is the fixed pronotum. An actual
  // head-skin vertex stays inside it; mere nearby bounding boxes do not suffice.
  let joined=false;for(let i=range.start;i<range.start+range.count;i++)if(insideConvex(d.bodyMesh,range.start-range.count,range.count,new T.Vector3().fromBufferAttribute(d.bodyMesh.geometry.attributes.position,i))){joined=true;break;}
  assert.ok(joined,'moving head retains skin overlap with the fixed neck/pronotum');
  for(let i=0;i<6;i++){assert.deepEqual(positions(d.legs[i].mesh),legs[i]);assert.ok(Math.abs(footSkin(d.legs[i]).y)<2e-7,'warning cannot lift a supported foot');}
  assert.deepEqual(Array.from(model.scale.toArray()),[1,1,1]);assert.deepEqual(Array.from(model.position.toArray()),[0,.05,0]);if(blend===1)moved=signature(model)!==baseline;
 }
 assert.ok(moved,'warning changes real geometry, not only hidden metadata');assert.equal(signature(model),baseline,'zero restores original geometry byte-for-byte');let afterCount=0;model.traverse(m=>{if(m.isMesh)afterCount++;});assert.equal(afterCount,meshCount,'no extra visual meshes');dispose(model);
});

test('warning input clamps safely, capture clears it, and inspection geometry/size are completely unaffected',()=>{
 for(const sizePermille of[1000,1150]){
  const model=createInsectModel('rhino',{sizePermille}),baseline=signature(model);for(const warningBlend of[NaN,Infinity,undefined,-1]){updateInsectModel(model,{...resting,warningBlend});assert.equal(signature(model),baseline);}
  updateInsectModel(model,{...resting,warningBlend:1});const full=signature(model);assert.notEqual(full,baseline);updateInsectModel(model,{...resting,warningBlend:99});assert.equal(signature(model),full);updateInsectModel(model,{...resting,warningBlend:1,caught:true});assert.equal(signature(model),baseline);assert.equal(model.visible,false);updateInsectModel(model,{...resting,warningBlend:0});assert.equal(model.visible,true);assert.equal(signature(model),baseline);assert.equal(model.scale.x,sizePermille/1000);dispose(model);
  const inspection=createInsectModel('rhino',{inspection:true,sizePermille}),original=signature(inspection,{matrices:true});for(const warningBlend of[0,.2,.5,.8,1,0]){updateInsectModel(inspection,{...resting,warningBlend});assert.equal(signature(inspection,{matrices:true}),original);assert.equal(inspection.userData.fieldWarningHead,undefined);}dispose(inspection);
 }
});

test('a field warning cannot change existing battle rigs, paired poses or their original inspection geometry',()=>{
 for(const playerSpecies of['rhino','metallifer'])for(const sizePermille of[1000,1150]){
  const opponentSpecies=playerSpecies==='rhino'?'hercules':'rhino',config={playerSpecies,opponentSpecies,playerSizePermille:sizePermille,opponentSizePermille:sizePermille},a=createBattleView(config),b=createBattleView(config),field=createInsectModel('rhino',{sizePermille});
  const roots=v=>['player','opponent'].map(side=>v.scene.getObjectByName('battle-'+side)),initial=roots(a).map(m=>signature(m,{matrices:true}));for(let i=0;i<=20;i++)updateInsectModel(field,{...resting,warningBlend:i/20});assert.deepEqual(roots(a).map(m=>signature(m,{matrices:true})),initial);
  const delta=playerSpecies==='rhino'?.35:-.35,s={phase:'finished',position:delta,exchanges:1,lastExchange:{number:1,playerAction:'push',opponentAction:'brace',positionBefore:0,positionAfter:delta,delta}};
  for(let frame=0;frame<16;frame++){a.update(s,.1);b.update(s,.1);assert.deepEqual(roots(a).map(m=>signature(m,{matrices:true})),roots(b).map(m=>signature(m,{matrices:true})));}
  for(const root of roots(a))assert.equal(root.children[0].userData.fieldWarningHead,undefined,'battle inspection model never installs the field warning rig');a.dispose();b.dispose();dispose(field);
 }
});

const {createNightWorld}=await import('../src/world-night.js');
const {createRhinoHabitat}=await import('../src/rhino-habitat.js');
const {createStagHabitat}=await import('../src/stag-habitat.js');
const {individualHabitatOptions}=await import('../src/individual-layout.js');
const {createRhinoStudy}=await import('../src/rhino-study.js');
const {createStagStudy}=await import('../src/stag-study.js');

test('all three branch sites and supported sizes retain real foot support through warning, bounded retreat, capture freeze, release and settled recovery',()=>{
 const scene=new T.Scene(),world=createNightWorld(scene),rhino=createRhinoHabitat(world,scene),stag=createStagHabitat(world,scene),ray=new T.Raycaster(),rows=[['rhino','insect-4',rhino,.05,createRhinoStudy],['stag','insect-5',stag,.045,createStagStudy]],base={homes:world.insectHomes,extraHomes:[...rhino.homes,...stag.homes],rhinoSupports:rhino.rhinoSupports,stagSupports:stag.stagSupports};scene.updateMatrixWorld(true);
 const metrics={configurations:0,rayContacts:0,maxSupportGap:0,maxLift:0};
 for(const sizePermille of[1000,1075,1150])for(const siteIndex of[0,1,2]){
  const encounters=rows.map(([species,runtimeSlotId])=>({species,populationSlotId:species,runtimeSlotId,habitat:'night',siteIndex,sizePermille})),options=individualHabitatOptions('night',base,{encounters},world.heightAt);
  for(const [species,,habitat,rootHeight,createStudy]of rows)for(const sourceSide of[-1,1]){
   const support=options[species+'Supports'][0],home=support.home,axis=species==='rhino'?'x':'z',limits=support.retreatLimits,factor=sizePermille/1000,study=createStudy({position:home,heading:support.heading,scale:factor,retreatBounds:{min:limits.min-home[axis],max:limits.max-home[axis]}}),model=createInsectModel(species,{sizePermille}),wood=habitat.captureOccluders[0],threat={x:home.x+Math.sin(support.heading)*.6*sourceSide,z:home.z+Math.cos(support.heading)*.6*sourceSide},surface=home.y-rootHeight*factor;
   scene.add(model);let samples=0,seenWarning=false,seenRetreat=false,captured=false,released=false,settled=false,maximumDisplacement=0;
   function check(state,requireSix=false){
    assert.ok(state.position[axis]>=limits.min-1e-9&&state.position[axis]<=limits.max+1e-9,'root stays inside physically supported bounds');maximumDisplacement=Math.max(maximumDisplacement,Math.abs(state.position[axis]-home[axis]));
    updateInsectModel(model,{x:state.position.x,y:state.position.y,z:state.position.z,heading:state.heading,walkPhase:state.walkPhase,walkSpeed:state.walkSpeed,warningBlend:state.warningBlend,jawOpen:state.jawOpen,rhinoPhase:state.phase,stagPhase:state.phase,caught:state.caught});model.updateMatrixWorld(true);let supported=0;
    for(const leg of model.userData.legs){const foot=footSkin(leg);assert.ok(foot.y>=surface-2e-6,'skin does not penetrate the flat bark');ray.set(foot.clone().add(new T.Vector3(0,.03,0)),new T.Vector3(0,-1,0));ray.far=.06;const hit=ray.intersectObject(wood,false)[0];assert.ok(hit,`${species} site${siteIndex} size${sizePermille} actual foot has no supporting branch`);const gap=Math.abs(hit.point.y-surface);metrics.maxSupportGap=Math.max(metrics.maxSupportGap,gap);assert.ok(gap<2e-6,'ray hits the same real bark surface');const lift=foot.y-hit.point.y;metrics.maxLift=Math.max(metrics.maxLift,lift);assert.ok(lift>=-2e-6&&lift<=.009*factor+2e-6,'native swing lift is preserved');if(Math.abs(lift)<2e-6)supported++;metrics.rayContacts++;}
    assert.ok(supported>=3,'warning and retreat retain a supporting tripod');if(requireSix)assert.equal(supported,6,'stopped pose lands all six real feet');samples++;
   }
   check(study.state,true);assert.equal(study.disturb(threat),true);
   for(let frame=0;frame<1000;frame++){
    study.disturb(threat);study.update(.05);const state=study.state;seenWarning||=state.phase==='warning';seenRetreat||=state.phase==='retreating';
    if(frame%4===0||['warning','cornered'].includes(state.phase))check(state,state.phase==='cornered');
    if(!captured&&state.phase==='retreating'&&Math.abs(state.position[axis]-home[axis])>.04){
     assert.equal(study.capture(),true);const frozen=study.state;check(frozen);const skin=signature(model,{matrices:true});for(let i=0;i<8;i++){study.disturb(threat);study.update(.1);assert.deepEqual(study.state,frozen);check(study.state);assert.equal(signature(model,{matrices:true}),skin,'captured support/skin cannot advance');}captured=true;assert.equal(study.release(),true);released=true;
    }
    if(captured&&state.phase==='cornered'){check(state,true);settled=true;break;}
   }
   assert.ok(seenWarning&&seenRetreat&&captured&&released&&settled,`${species} completes warning/retreat/capture/release/stop`);assert.ok(maximumDisplacement>.04,'retreat has actual displacement, not just a phase flag');assert.ok(samples>10);
   let returned=false;for(let frame=0;frame<1000;frame++){study.update(.05);const state=study.state;if(frame%4===0||state.phase==='resting')check(state,state.phase==='resting');if(state.phase==='resting'&&state.position[axis]>=home[axis]-1e-8&&state.position[axis]<=home[axis]+.12*factor+1e-8){returned=true;break;}}
   assert.ok(returned,'without further threats the beetle walks back continuously into its ordinary range');study.reset();check(study.state,true);assert.equal(signature(model),freshSignature(species,sizePermille,home,support.heading),'reset restores native stopped model');scene.remove(model);dispose(model);metrics.configurations++;
  }
 }
 function freshSignature(species,sizePermille,home,heading){const model=createInsectModel(species,{sizePermille});updateInsectModel(model,{x:home.x,y:home.y,z:home.z,heading,walkPhase:0,walkSpeed:0,warningBlend:0,caught:false,jawOpen:species==='stag'?.25:undefined});const cloneSignature=signature(model);dispose(model);return cloneSignature;}
 // The separate field-warning tests check byte-for-byte reset. Here the real
 // world rays establish branch support rather than rendered/human readability.
 assert.equal(metrics.configurations,36);console.log('CPU branch support metrics (not a rendered playtest):',JSON.stringify(metrics));
});
