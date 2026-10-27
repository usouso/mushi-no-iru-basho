/** Original native skin checks only. No GPU, fluid dynamics or field clearance claim. */
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const box={};vm.runInNewContext(fs.readFileSync(new URL('../assets/vendor/three.min.js',import.meta.url),'utf8'),box);const T=box.THREE;globalThis.window={THREE:T};
const {GIANT_WATERBUG_DIMENSIONS:D,sampleGiantWaterbugPose}=await import('../src/giant-waterbug-kinematics.js');
const {createGiantWaterbugModel,updateGiantWaterbugModel}=await import('../src/giant-waterbug-model.js');
const V=p=>new T.Vector3(p.x,p.y,p.z),distance=(a,b)=>V(a).distanceTo(V(b));
function vertices(root){root.updateMatrixWorld(true);const out=[];root.traverse(m=>{if(m.isMesh){const a=m.geometry.attributes.position;for(let i=0;i<a.count;i++)out.push({mesh:m.name,p:new T.Vector3().fromBufferAttribute(a,i).applyMatrix4(m.matrixWorld)});}});return out;}

test('pure pose finite with invariant native link lengths over grip/stroke/fold matrix; supported feet exact, front free',()=>{
 let poses=0;
 for(const grip of [0,.25,.5,.75,1])for(const forelegFold of [0,.5,1])for(let n=0;n<24;n++){
  const pose=sampleGiantWaterbugPose({grip,forelegFold,strokePhase:n/24});poses++;
  assert.equal(pose.legs.length,6);
  for(const l of pose.legs){const chain=l.role==='front'?[l.hip,l.knee,l.ankle,l.foot,l.claw]:[l.hip,l.knee,l.foot];assert.ok(chain.every(p=>Object.values(p).every(Number.isFinite)));for(let b=0;b<chain.length-1;b++)assert.ok(Math.abs(distance(chain[b],chain[b+1])-l.boneLengths[b])<1e-12,`${l.id} bone${b}`);if(l.role==='front')assert.equal(l.contact,false);else if(grip===1)assert.deepEqual(l.foot,D.supportContacts.find(c=>c.id===l.id).position);}
 }
 assert.equal(poses,360);
 const invalid=sampleGiantWaterbugPose({grip:NaN,forelegFold:Infinity,strokePhase:NaN,x:NaN,y:Infinity,pitch:Infinity});assert.deepEqual(invalid.body.position,{x:0,y:0,z:0});assert.equal(invalid.body.pitch,0);
});

test('native actual skin endpoints/bone centers match pose and four real tips touch slender stalk without body or forelegs faking support',()=>{
 const root=createGiantWaterbugModel(),pose=sampleGiantWaterbugPose(),all=vertices(root);
 let minClearance=Infinity;
 for(const l of root.userData.legs){const p=pose.legs.find(p=>p.id===l.id),a=l.mesh.geometry.attributes.position,chain=p.role==='front'?[p.hip,p.knee,p.ankle,p.foot,p.claw]:[p.hip,p.knee,p.foot];
  for(const [b,pair] of l.boneVertexPairs.entries()){const s=new T.Vector3().fromBufferAttribute(a,pair[0]),e=new T.Vector3().fromBufferAttribute(a,pair[1]);assert.ok(s.distanceTo(V(chain[b]))<1e-8);assert.ok(e.distanceTo(V(chain[b+1]))<1e-8);assert.ok(Math.abs(s.distanceTo(e)-p.boneLengths[b])<1e-8);}
  const tip=new T.Vector3().fromBufferAttribute(a,l.tipVertex);if(p.role==='front'){assert.ok(Math.hypot(tip.x,tip.y+.038)>.02);assert.equal(l.contact,false);}else{assert.ok(tip.distanceTo(V(D.supportContacts.find(c=>c.id===l.id).position))<1e-8);assert.ok(Math.abs(Math.hypot(tip.x,tip.y+.038)-D.supportRadius)<1e-8);}
 }
 for(const {p} of all){assert.ok([p.x,p.y,p.z].every(Number.isFinite));if(p.z>=-.09&&p.z<=.09)minClearance=Math.min(minClearance,Math.hypot(p.x,p.y+.038)-D.supportRadius);}
 assert.ok(minClearance>-1e-8,`native stalk skin clearance ${minClearance}`);
 assert.equal(root.userData.legs.filter(l=>l.contact).length,4);assert.ok(Object.isFrozen(D));root.userData.dispose();
});

test('coxae overlap connected thorax skin, shell is divided hemelytra with overlapping tips; bounded original mesh budget',()=>{
 const root=createGiantWaterbugModel(),body=root.userData.bodyMesh;let meshes=0,triangles=0;root.traverse(m=>{if(m.isMesh){meshes++;triangles+=(m.geometry.index?.count||m.geometry.attributes.position.count)/3;assert.equal(m.material.map,null);}});
 for(const p of sampleGiantWaterbugPose().legs){const origin=V(p.hip),ray=new T.Raycaster(origin.clone().add(new T.Vector3(0,.03,0)),new T.Vector3(0,-1,0),0,.06),hits=ray.intersectObject(body,false);assert.ok(hits.length>0,`${p.id} hip lies under connected body/coxa skin`);assert.ok(hits.some(h=>h.point.distanceTo(origin)<.022));}
 const membrane=root.userData.membraneMesh.geometry.attributes.position,layers=new Set();for(let i=0;i<membrane.count;i++){const x=membrane.getX(i),y=membrane.getY(i),z=membrane.getZ(i),base=-.002+.018*Math.sqrt(Math.max(0,1-(x/.055)**2-((z+.030)/.090)**2)),layer=y-base;assert.ok(Math.min(Math.abs(layer-.0012),Math.abs(layer-.0018))<1e-7);layers.add(Math.round(layer*10000));}assert.deepEqual([...layers].sort(),[12,18],'actual overlapping membrane surfaces have distinct layers, not coplanar metadata');
 assert.equal(root.userData.legs.filter(l=>l.role==='front').length,2);assert.match(root.userData.hardMesh.name,/hemelytra/);assert.match(root.userData.membraneMesh.name,/overlapping/);assert.ok(meshes<20);assert.ok(triangles<5000);assert.ok(root.userData.unmodelled.includes('internal hindwings'));console.log('waterbug native budget',JSON.stringify({meshes,triangles}));root.userData.dispose();
});

test('paired breathing endpoint actual skin and transformed midpoint track supplied pitch once; no hidden root tilt',()=>{
 const root=createGiantWaterbugModel(),raw=vertices(root);for(const p of D.breathingTips)assert.ok(raw.some(v=>v.p.distanceTo(V(p))<1e-8),'breathing-tip center is real geometry');
 const state={position:{x:2,y:-.4,z:-3},heading:.3,pitch:.95,grip:1};updateGiantWaterbugModel(root,state);assert.equal(root.rotation.x,.95);assert.equal(root.rotation.y,.3);
 const q=new T.Quaternion().setFromEuler(new T.Euler(.95,.3,0,'YXZ')),expect=V(D.tailBreathingPoint).applyQuaternion(q).add(V(state.position)),actual=root.localToWorld(V(D.tailBreathingPoint));assert.ok(actual.distanceTo(expect)<1e-12);
 assert.equal(sampleGiantWaterbugPose().body.pitch,0);root.userData.dispose();
});

test('independent model instances; native animated skin links finite at grip/swim/fold and inspection transform remains caller-owned; disposal idempotent',()=>{
 const a=createGiantWaterbugModel(),b=createGiantWaterbugModel({inspection:true});assert.notEqual(a.userData.legs[0].mesh.geometry,b.userData.legs[0].mesh.geometry);b.position.set(1,2,3);b.rotation.set(.4,.5,.6);b.scale.setScalar(2);b.updateMatrix();const transform=b.matrix.clone();
 for(let n=0;n<80;n++){updateGiantWaterbugModel(a,{grip:(n%20)/19,forelegFold:n/80,strokePhase:n/16,pitch:.95});assert.ok(vertices(a).every(v=>[v.p.x,v.p.y,v.p.z].every(Number.isFinite)));for(const l of a.userData.legs)for(const [b,pair] of l.boneVertexPairs.entries()){const arr=l.mesh.geometry.attributes.position;assert.ok(Math.abs(new T.Vector3().fromBufferAttribute(arr,pair[0]).distanceTo(new T.Vector3().fromBufferAttribute(arr,pair[1]))-l.pose.boneLengths[b])<1e-8);}}
 updateGiantWaterbugModel(b,{position:{x:8,y:9,z:10},pitch:1});b.updateMatrix();assert.deepEqual(b.matrix.elements,transform.elements);
 let geometryEvents=0,materialEvents=0;const mats=new Set();a.traverse(o=>{if(o.isMesh){o.geometry.addEventListener('dispose',()=>geometryEvents++);mats.add(o.material);}});for(const m of mats)m.addEventListener('dispose',()=>materialEvents++);a.userData.dispose();a.userData.dispose();assert.equal(geometryEvents,10);assert.equal(materialEvents,5);b.userData.dispose();
});

test('study orientation and radian stroke channels are explicit aliases; zero stroke strength freezes neutral swim shape',()=>{
 const state={position:{x:1,y:2,z:3},orientation:{pitch:.95,yaw:.3,roll:.1},grip:0,stroke:1.2,strokeStrength:1,forelegFold:1},root=createGiantWaterbugModel();updateGiantWaterbugModel(root,state);
 assert.equal(root.rotation.order,'YXZ');assert.equal(root.rotation.x,.95);assert.equal(root.rotation.y,.3);assert.equal(root.rotation.z,.1);
 const p=sampleGiantWaterbugPose(state),alias=sampleGiantWaterbugPose({...state,strokePhase:1.2/(2*Math.PI),swimBlend:1});assert.deepEqual(p.legs,alias.legs);
 assert.deepEqual(sampleGiantWaterbugPose({grip:0,strokeStrength:0,stroke:0}).legs,sampleGiantWaterbugPose({grip:0,strokeStrength:0,stroke:2}).legs);root.userData.dispose();
});
