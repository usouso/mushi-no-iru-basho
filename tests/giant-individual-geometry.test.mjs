/** CPU geometry/identity checks only; not WebGL visibility or a natural-size claim. */
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import{createHash}from'node:crypto';
const box={console};vm.runInNewContext(fs.readFileSync(new URL('../assets/vendor/three.min.js',import.meta.url),'utf8'),box);const T=box.THREE,context={};
for(const k of['fillRect','clearRect','beginPath','moveTo','lineTo','bezierCurveTo','quadraticCurveTo','stroke','fill','save','restore','translate','rotate','ellipse','arc','drawImage','closePath','clip'])context[k]=()=>{};context.createLinearGradient=()=>({addColorStop(){}});globalThis.window={THREE:T};globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>context})};
const {createInsectModel,updateInsectModel}=await import('../src/insect-models.js');
const {individualHabitatOptions}=await import('../src/individual-layout.js');
const {createGiantStagStudy}=await import('../src/giant-stag-study.js');
const {sampleGiantStagPose,GIANT_STAG_DIMENSIONS:D}=await import('../src/giant-stag-kinematics.js');
const {createNightWorld}=await import('../src/world-night.js');
const {createRhinoHabitat}=await import('../src/rhino-habitat.js');
const {createStagHabitat}=await import('../src/stag-habitat.js');
const {createGiantStagHabitat}=await import('../src/giant-stag-habitat.js');
const {GIANT_STAG_BRANCH:B,GIANT_STAG_COVER:C}=await import('../src/giant-stag-layout.js');
const v=p=>new T.Vector3(p.x,p.y,p.z),sha=s=>createHash('sha256').update(s).digest('hex');
const oldSpecies=['hercules','rhino','stag','metallifer'];
function modelSignature(model){const h=createHash('sha256');model.updateMatrixWorld(true);model.traverse(o=>{if(!o.isMesh)return;h.update(JSON.stringify(Array.from(o.matrixWorld.elements)));for(const k of Object.keys(o.geometry.attributes).sort()){const a=o.geometry.attributes[k].array;h.update(k).update(Buffer.from(a.buffer,a.byteOffset,a.byteLength));}if(o.geometry.index){const a=o.geometry.index.array;h.update(Buffer.from(a.buffer,a.byteOffset,a.byteLength));}for(const m of Array.isArray(o.material)?o.material:[o.material])h.update(JSON.stringify([m.type,m.color?.getHex(),m.opacity,m.roughness,m.metalness,m.side,m.emissive?.getHex()]));});return h.digest('hex');}
function dispose(model){if(model.userData.dispose){model.userData.dispose();return;}const gs=new Set(),ms=new Set();model.traverse(o=>{if(o.geometry)gs.add(o.geometry);for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[])ms.add(m);});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());}
function priorFixture(){const results=[];for(const species of oldSpecies)for(const sizePermille of[1000,1075,1150])for(const siteIndex of[0,1,2]){const height={hercules:.06,rhino:.05,stag:.045,metallifer:0}[species],support={home:{x:2,y:height,z:3},heading:.7};if(species==='hercules')support.axis=[{x:1.4,y:height,z:3},{x:2.6,y:height,z:3}];const input={homes:[[species,2,3,height]],extraHomes:[],[species+'Supports']:[support],logFruitStation:species==='hercules'?{supportHome:{...support.home},target:{x:2.5,y:height,z:3}}:undefined},record={species,habitat:'test',runtimeSlotId:'insect-1',sizePermille,siteIndex};results.push(individualHabitatOptions('test',input,{encounters:[record]},()=>0));}
 for(const species of oldSpecies)for(const sizePermille of[1000,1150]){const model=createInsectModel(species,{sizePermille});for(const walkPhase of[0,.7,Math.PI]){updateInsectModel(model,{x:1,y:.1,z:2,heading:.4,walkPhase,walkSpeed:.02,jawOpen:.4,resting:true,state:'resting',caught:false},.2);results.push(modelSignature(model));}dispose(model);}return sha(JSON.stringify(results));}
function habitat(){const scene=new T.Scene(),world=createNightWorld(scene),rhino=createRhinoHabitat(world,scene),stag=createStagHabitat(world,scene),giant=createGiantStagHabitat(world,scene);scene.updateMatrixWorld(true);return{scene,world,giant,options:{homes:world.insectHomes,extraHomes:[...rhino.homes,...stag.homes,...giant.homes],rhinoSupports:rhino.rhinoSupports,stagSupports:stag.stagSupports,giantStagSupports:giant.giantStagSupports}};}
function configure(f,sizePermille,siteIndex){const record={species:'giantstag',habitat:'night',runtimeSlotId:'insect-6',populationSlotId:'giantstag',sizePermille,siteIndex,motionSeed:12345,measureVersion:1,encounterId:'g2-00000001-o2-night-giantstag'},out=individualHabitatOptions('night',f.options,{encounters:[record]},f.world.heightAt);return{record,out,support:out.giantStagSupports[0]};}
function worldVertices(model){model.updateMatrixWorld(true);const out=[];model.traverse(o=>{const a=o.geometry?.attributes.position;if(a)for(let i=0;i<a.count;i++)out.push(o.localToWorld(new T.Vector3().fromBufferAttribute(a,i)));});return out;}
function update(model,state){updateInsectModel(model,{...state,x:state.position.x,y:state.position.y,z:state.position.z,giantStagPhase:state.phase});}

test('old four layout/geometry/pose fixtures are exact, and new fixed species remain unmeasured scale one',()=>{
 const measured=priorFixture();console.log('old-four fixture SHA',measured);assert.equal(measured,'93bc14c5f669578dab0ed940bbab2b476368db49f50eccaaaf962bbc0484e3dc');
 for(const species of['atlas','elephant']){const m=createInsectModel(species,{sizePermille:1150});assert.equal(m.userData.individualScale,1);assert.equal(m.scale.x,1);dispose(m);}
});

test('only giant gets a sixth profile; site rebasing preserves the absolute lane and old five homes',()=>{
 const f=habitat(),before=JSON.stringify(f.options),old=f.giant.giantStagSupports[0],axis=new T.Vector3(Math.sin(old.heading),0,Math.cos(old.heading));
 for(const size of[1000,1150])for(const site of[0,1,2]){const {out,support,record}=configure(f,size,site),offset=(site-1)*.04;assert.equal(JSON.stringify(f.options),before);assert.deepEqual(out.homes,f.options.homes);assert.deepEqual(out.extraHomes.slice(0,2),f.options.extraHomes.slice(0,2));assert.deepEqual(out.rhinoSupports,f.options.rhinoSupports);assert.deepEqual(out.stagSupports,f.options.stagSupports);assert.deepEqual(out.individuals,[record]);assert.ok(Math.abs(support.home.y-old.home.y-.045*(size/1000-1))<1e-12);assert.ok(v(support.home).sub(v(old.home)).setY(0).distanceTo(axis.clone().multiplyScalar(offset))<1e-12);
  for(const bound of['min','max']){const actual=v(support.home).addScaledVector(axis,support.retreatBounds[bound]),previous=v(old.home).addScaledVector(axis,old.retreatBounds[bound]);assert.ok(actual.setY(0).distanceTo(previous.setY(0))<1e-12);}
 }
 const model=createInsectModel('giantstag',{sizePermille:1150}),base=createInsectModel('giantstag');assert.equal(model.userData.individualScale,1.15);const a=modelSignature(base);model.scale.setScalar(1);assert.equal(modelSignature(model),a,'native geometry/material unchanged');dispose(model);dispose(base);
 const invalid=createInsectModel('giantstag',{sizePermille:1151});assert.equal(invalid.scale.x,1);dispose(invalid);
});

test('maximum size and three sites keep real foot skin on wood, below bark, away from wall and branch ends',()=>{
 const f=habitat(),wood=f.scene.getObjectByName('giantstag-west-support'),old=f.giant.giantStagSupports[0],top=old.home.y-D.rootAboveSupport,ray=new T.Raycaster();let maxFootGap=0,minRoof=Infinity,minSide=Infinity,minEnd=Infinity,minFacetSide=Infinity,checks=0;
 for(const size of[1000,1150])for(const site of[0,1,2]){const {support}=configure(f,size,site),s=size/1000,axis=new T.Vector3(Math.sin(support.heading),0,Math.cos(support.heading)),model=createInsectModel('giantstag',{sizePermille:size});
  for(const distance of[support.retreatBounds.min,0,support.retreatBounds.max])for(const jawOpen of[.25,.65,1]){const pos=v(support.home).addScaledVector(axis,distance),walkPhase=distance/(D.cycleDistance*s)*2*Math.PI;update(model,{position:pos,heading:support.heading,walkPhase,jawOpen});assert.equal(model.scale.x,s);
   const pose=sampleGiantStagPose({walkPhase});for(let i=0;i<6;i++){const leg=model.userData.legs[i],a=leg.mesh.geometry.attributes.position,p=leg.mesh.localToWorld(v(leg.foot));let skinGap=Infinity;for(let j=20;j<26;j++)skinGap=Math.min(skinGap,leg.mesh.localToWorld(new T.Vector3().fromBufferAttribute(a,j)).distanceTo(p));assert.ok(skinGap<1e-7);ray.set(p.clone().add(new T.Vector3(0,.05,0)),new T.Vector3(0,-1,0));ray.far=.1;const hit=ray.intersectObject(wood,false)[0];assert.ok(hit,'all supporting and swing endpoints remain over the branch');const expected=(pose.legs[i].foot.y+D.rootAboveSupport)*s,gap=Math.abs(p.y-hit.point.y-expected);maxFootGap=Math.max(maxFootGap,gap);assert.ok(gap<1e-6);checks++;}
   for(const p of worldVertices(model)){assert.ok(p.y>=top-1e-7);minRoof=Math.min(minRoof,top+C.bottomAboveSupport-p.y);minSide=Math.min(minSide,C.wallInnerZ-p.z);minEnd=Math.min(minEnd,p.x-B.startX,B.endX-p.x);minFacetSide=Math.min(minFacetSide,B.radius*Math.sin(Math.PI/8)-Math.abs(p.z-B.z));}
  }dispose(model);
 }
 assert.ok(minRoof>.006);assert.ok(minSide>.032);assert.ok(minEnd>.04);assert.ok(minFacetSide>.017);console.log(JSON.stringify({checks,maxFootGap,minRoof,minSide,minEnd,minFacetSide}));
});

test('scaled seeded study cancels stance sliding, preserves capture pose, and resets without new draws',()=>{
 const f=habitat();let maximumSlide=0,sawRetreat=false,supportedChecks=0;
 for(const site of[0,1,2]){const {support,record}=configure(f,1150,site),options={position:support.home,heading:support.heading,retreatBounds:support.retreatBounds,scale:1.15,motionSeed:record.motionSeed},study=createGiantStagStudy(options),twin=createGiantStagStudy(options),initial=study.state,model=createInsectModel('giantstag',{sizePermille:1150});let prior=null;
  for(let frame=0;frame<180;frame++){if(frame===0){const source={x:support.home.x-1,z:support.home.z};study.disturb(source);twin.disturb(source);}study.update(1/120);twin.update(1/120);const state=study.state;assert.deepEqual(state,twin.state);sawRetreat||=state.phase==='retreating';update(model,state);const feet=model.userData.legs.map(l=>({contact:l.contact,p:l.mesh.localToWorld(v(l.foot))}));
   if(prior)for(let i=0;i<6;i++)if(prior[i].contact&&feet[i].contact){maximumSlide=Math.max(maximumSlide,prior[i].p.distanceTo(feet[i].p));assert.ok(prior[i].p.distanceTo(feet[i].p)<1e-8);supportedChecks++;}prior=feet;
   if(frame===67){const held=study.state;study.capture();const frozen=study.state;update(model,frozen);const verts=worldVertices(model).map(p=>p.toArray());study.update(.1);assert.deepEqual(study.state,frozen);study.release();const resumed=study.state;assert.deepEqual(resumed.position,held.position);assert.equal(resumed.walkPhase,held.walkPhase);assert.equal(resumed.jawOpen,held.jawOpen);update(model,resumed);assert.deepEqual(worldVertices(model).map(p=>p.toArray()),verts);}
  }
  study.reset();assert.deepEqual(study.state,initial);dispose(model);
 }
 assert.ok(sawRetreat);assert.ok(supportedChecks>100);
 const seeded=createGiantStagStudy({retreatBounds:{min:-.26,max:.18},motionSeed:1}),fixed=createGiantStagStudy({retreatBounds:{min:-.26,max:.18}});for(let i=0;i<90;i++){seeded.update(.1);fixed.update(.1);}assert.equal(fixed.state.phase,'resting');assert.ok(Math.abs(seeded.state.walkPhase)>0,'motionSeed reaches existing seeded-wait branch');
 for(const scale of[0,1.151,NaN])assert.throws(()=>createGiantStagStudy({retreatBounds:{min:-.26,max:.18},scale}),TypeError);for(const motionSeed of[-1,1.2,Infinity])assert.throws(()=>createGiantStagStudy({retreatBounds:{min:-.26,max:.18},motionSeed}),TypeError);console.log(JSON.stringify({maximumSlide,supportedChecks}));
 const inspect=createInsectModel('giantstag',{inspection:true,sizePermille:1150});inspect.position.set(3,4,5);inspect.rotation.set(.2,.3,.4);inspect.scale.setScalar(3*1.15);const signature=modelSignature(inspect);updateInsectModel(inspect,{x:1,y:1,z:1,walkPhase:2,jawOpen:1,caught:true});assert.equal(modelSignature(inspect),signature);dispose(inspect);
});
