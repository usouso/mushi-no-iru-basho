/** 057 independent bounded CPU field/native integration; not GPU or wildlife validation. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {priorModel,normalizeRainbowIndividual as norm} from './fixtures/rainbow-individual-field-prior.mjs';
const box={};vm.runInNewContext(fs.readFileSync(new URL('../assets/vendor/three.min.js',import.meta.url),'utf8'),box);
const T=box.THREE;globalThis.window={THREE:T};
const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{})});globalThis.document={createElement:()=>({getContext:()=>ctx})};
const {createInsectModel,updateInsectModel}=await import('../src/insect-models.js'),{createInsects}=await import('../src/insects.js'),{createAustraliaWorld}=await import('../src/world-australia.js'),{createRainbowStagHabitat}=await import('../src/rainbow-stag-habitat.js'),{individualHabitatOptions}=await import('../src/individual-layout.js'),{createCaptureVisibility}=await import('../src/capture-visibility.js');
const read=f=>fs.readFileSync(new URL('../src/'+f,import.meta.url),'utf8'),hash=s=>createHash('sha256').update(s).digest('hex');
const oldFactory=await import('data:text/javascript;base64,'+Buffer.from(priorModel(read('insect-models.js')).replace(/from\s*(['"])(\.\/[^'"]+)\1/g,(_,q,p)=>`from ${q}${new URL('../src/'+p,import.meta.url).href}${q}`)).toString('base64'));
const far={x:7,y:1.65,z:7,speed:0,quiet:true},front={x:2.4,y:1.65,z:0,speed:2.7,quiet:false},eye={x:0,y:1.28,z:1.5,speed:0,quiet:true};
const profile=(size,site)=>({species:'rainbowstag',habitat:'australia',runtimeSlotId:'insect-1',populationSlotId:'rainbowstag',encounterId:'g8-1234abcd-o17-australia-rainbowstag',sizePermille:size,motionSeed:1729,siteIndex:site,measureVersion:1});
function fixture(record){const scene=new T.Scene(),world=createAustraliaWorld(scene),habitat=createRainbowStagHabitat(world,scene),base={homes:[],extraHomes:habitat.homes,rainbowStagSupports:habitat.rainbowStagSupports,bounds:world.bounds,hasLineOfSight:createCaptureVisibility(world.captureOccluders)},options=individualHabitatOptions('australia',base,record?{encounters:[record]}:null,world.heightAt);return{scene,world,habitat,sim:createInsects(world.heightAt,options)};}
function snapshot(g){g.updateMatrixWorld(true);const meshes=[];g.traverse(m=>{if(!m.isMesh)return;meshes.push({name:m.name,matrix:m.matrixWorld.toArray(),attributes:Object.fromEntries(Object.entries(m.geometry.attributes).map(([k,a])=>[k,Array.from(a.array)])),index:m.geometry.index?Array.from(m.geometry.index.array):null,material:[m.material.type,m.material.color.getHexString(),m.material.roughness,m.material.metalness,m.material.side,m.material.opacity]});});return meshes;}
function sample(g,item,world,m,last){updateInsectModel(g,item);g.updateMatrixWorld(true);assert.ok(item.x>=-.34-1e-9&&item.x<=.34+1e-9);const f=g.scale.x,ray=new T.Raycaster();let planted=0;const next=[];
 for(const leg of g.userData.legs){const a=leg.mesh.geometry.attributes.position,[hip,knee,foot]=[12,13,27].map(k=>new T.Vector3().fromBufferAttribute(a,k).applyMatrix4(leg.mesh.matrixWorld));
  m.maxBoneError=Math.max(m.maxBoneError,Math.abs(hip.distanceTo(knee)-.060*f),Math.abs(knee.distanceTo(foot)-.060*f));assert.ok(hip.distanceTo(foot)<=.120*f+1e-8,'native endpoint within fixed-bone reach');
  ray.set(foot.clone().add(new T.Vector3(0,.2,0)),new T.Vector3(0,-1,0));ray.far=.4;const hit=ray.intersectObject(world.rainbowLog,false)[0];assert.ok(hit?.face&&hit.face.normal.y>.999999,'actual finite log top triangle');m.rays++;
  assert.ok(foot.y>=hit.point.y-2e-8);if(leg.contact){planted++;m.contacts++;m.maxGap=Math.max(m.maxGap,foot.distanceTo(hit.point));const before=last?.[next.length];if(before?.contact){m.comparisons++;m.maxSlip=Math.max(m.maxSlip,foot.distanceTo(before.foot));}}
  next.push({contact:leg.contact,foot});
 }
 assert.ok(planted>=3);if(['resting','warning','settling','cornered'].includes(item.rainbowStagPhase))assert.equal(planted,6);
 // All skin vertices only on sparse integration snapshots, not a new exhaustive anatomy sweep.
 if(m.frames%12===0){g.traverse(mesh=>{if(!mesh.isMesh)return;const a=mesh.geometry.attributes.position;for(let n=0;n<a.count;n++){const p=new T.Vector3().fromBufferAttribute(a,n).applyMatrix4(mesh.matrixWorld);assert.ok(p.toArray().every(Number.isFinite));assert.ok(p.y>=.55-2e-8);m.vertices++;}});}
 m.frames++;return next;
}
const metrics=()=>({frames:0,rays:0,contacts:0,comparisons:0,vertices:0,maxGap:0,maxSlip:0,maxBoneError:0});

test('frozen056 anatomy, materials, world and core are unchanged; profileless native factory remains exact',()=>{
 for(const [file,expected]of Object.entries({'rainbow-stag-model.js':'d936a3fdf23a2d5ba9797008a403da58527d19bdc5aa5a2634a380b67b3bfaa0','rainbow-stag-kinematics.js':'b2cf956ae15ec69d883f59711f415359a66203d69d5c32c3866da25a7b0ad44a','world-australia.js':'ba671c4fc6a7a9f9c9a4202306813d9f691d3c5b97cf7ac708ab785bc0dc2049','branch-retreat-study.js':'c193f8de36e93a2af5b89c1bbe6d6d263b99258ce14a859c91f20b0d223516a7'}))assert.equal(hash(norm(read(file))),expected,file);
 const f=fixture(null),a=createInsectModel('rainbowstag'),b=oldFactory.createInsectModel('rainbowstag');assert.equal('encounterId'in f.sim.items[0],false);
 for(let n=0;n<120;n++){f.sim.update(1/60,n<30?front:far);const i=f.sim.items[0];updateInsectModel(a,i);oldFactory.updateInsectModel(b,i);assert.deepEqual(snapshot(a),snapshot(b));}a.userData.dispose();b.userData.dispose();f.world.dispose();
});

test('six actual measured site/size fields keep native feet, bone reach and lane continuous through walk, warning, retreat, catch and release',()=>{
 const m=metrics(),cases=[];
 for(const size of[1000,1150])for(const site of[0,1,2]){const r=profile(size,site),f=fixture(r),g=createInsectModel('rainbowstag',{sizePermille:size});let i=f.sim.items[0],last=null;const phases=new Set();
  assert.equal(g.scale.x,size/1000);assert.ok(Math.abs(i.home.x-[-.12,0,.12][site])<1e-12);assert.ok(Math.abs(i.home.y-(.55+.05*size/1000))<2e-8);
  const check=()=>{phases.add(i.rainbowStagPhase);last=sample(g,i,f.world,m,last);assert.equal(i.encounterId,r.encounterId);};
  const step=p=>{f.sim.update(1/60,p);check();};
  const catchRelease=()=>{const before=snapshot(g),pos=[i.x,i.y,i.z,i.walkPhase,i.jawOpen];assert.equal(f.sim.swing(eye,{x:i.x-eye.x,y:i.y-eye.y,z:i.z-eye.z}).ok,true);for(let n=0;n<15;n++)step(front);assert.deepEqual([i.x,i.y,i.z,i.walkPhase,i.jawOpen],pos);assert.deepEqual(snapshot(g),before);assert.equal(f.sim.release(eye),i);check();assert.deepEqual(snapshot(g),before);};
  check();catchRelease();for(let n=0;n<24;n++)step(far);assert.equal(i.rainbowStagPhase,'walking');
  for(let n=0;n<120&&i.rainbowStagPhase!=='retreating';n++)step(front);assert.equal(i.rainbowStagPhase,'retreating');for(let n=0;n<6;n++)step(far);catchRelease();for(let n=0;n<48;n++)step(far);
  for(const p of['resting','walking','warning','retreating'])assert.ok(phases.has(p),p);cases.push({size,site,phases:[...phases]});
  f.sim.reset();i=f.sim.items[0];last=null;check();assert.ok(Math.abs(i.x-i.home.x)<1e-12);g.userData.dispose();f.world.dispose();
 }
 assert.ok(m.maxGap<2e-8);assert.ok(m.maxSlip<3e-8,`stance slip ${m.maxSlip}`);assert.ok(m.maxBoneError<3e-8);console.log(JSON.stringify({nativeField:m,cases}));
});

test('model owns only its resources; habitat borrows existing log and world disposes its own resources once',()=>{
 const f=fixture(profile(1150,2)),g=createInsectModel('rainbowstag',{sizePermille:1150});f.scene.add(g);
 function track(root){const counts=new Map();root.traverse(m=>{for(const resource of[m.geometry,...(Array.isArray(m.material)?m.material:[m.material])].filter(Boolean)){if(counts.has(resource))continue;counts.set(resource,0);resource.addEventListener('dispose',()=>counts.set(resource,counts.get(resource)+1));}});return counts;}
 const model=track(g),world=new Map();for(const mesh of f.world.meshes)for(const [r,n]of track(mesh))world.set(r,n);
 // Use one listener per resource for an exact shared-material/world count.
 const worldCounts=new Map([...world.keys()].map(r=>[r,0]));for(const r of worldCounts.keys())r.addEventListener('dispose',()=>worldCounts.set(r,worldCounts.get(r)+1));
 f.habitat.dispose();f.habitat.dispose();assert.ok([...worldCounts.values()].every(n=>n===0));assert.equal(f.scene.getObjectById(f.world.rainbowLog.id),f.world.rainbowLog);
 g.userData.dispose();g.userData.dispose();assert.ok([...model.values()].every(n=>n===1));assert.ok([...worldCounts.values()].every(n=>n===0));assert.equal(g.parent,null);
 f.world.dispose();f.world.dispose();assert.ok([...worldCounts.values()].every(n=>n===1));assert.equal(f.scene.getObjectById(f.world.rainbowLog.id),undefined);console.log(JSON.stringify({ownedDisposal:{modelResources:model.size,worldResources:worldCounts.size,addedHabitatMeshes:f.habitat.stats.addedMeshes}}));
});
