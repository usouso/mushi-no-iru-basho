/** Bounded native female wetapunga anatomy/gait checks; not biological or GPU certification. */
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const box={};vm.runInNewContext(fs.readFileSync(new URL('../assets/vendor/three.min.js',import.meta.url),'utf8'),box);const T=box.THREE;globalThis.window={THREE:T};
const {WETAPUNGA_DIMENSIONS:D,sampleWetapungaPose}=await import('../src/wetapunga-kinematics.js'),{createWetapungaModel,updateWetapungaModel}=await import('../src/wetapunga-model.js');
const V=p=>new T.Vector3(p.x,p.y,p.z),dist=(a,b)=>V(a).distanceTo(V(b));
function vertices(m){const a=m.geometry.attributes.position;return Array.from({length:a.count},(_,i)=>new T.Vector3().fromBufferAttribute(a,i));}
function triangles(m,predicate=()=>true){const a=m.geometry.attributes.position,idx=m.geometry.index,result=[];for(let n=0;n<(idx?.count??a.count);n+=3){if(!predicate(n/3))continue;const p=[0,1,2].map(j=>new T.Vector3().fromBufferAttribute(a,idx?idx.getX(n+j):n+j)),triangle=new T.Triangle(...p);if(triangle.getArea()>1e-14)result.push({triangle,box:new T.Box3().setFromPoints(p)});}return result;}
function edge(a,b,tri){const d=b.clone().sub(a),len=d.length();if(len<1e-8)return false;const hit=new T.Ray(a,d.divideScalar(len)).intersectTriangle(tri.a,tri.b,tri.c,false,new T.Vector3());return !!hit&&hit.distanceTo(a)>1e-7&&hit.distanceTo(a)<len-1e-7;}
function intersects(as,bs){let count=0;for(const a of as)for(const b of bs){if(!a.box.intersectsBox(b.box))continue;for(const [one,two] of [[a.triangle,b.triangle],[b.triangle,a.triangle]])if([[one.a,one.b],[one.b,one.c],[one.c,one.a]].some(([p,q])=>edge(p,q,two)))count++;}return count;}
const skin=root=>{const result=[];root.updateMatrixWorld(true);root.traverse(m=>{if(m.isMesh)for(const p of vertices(m))result.push(...p.applyMatrix4(m.matrixWorld).toArray());});return result;};

test('native six-foot contract and signed gait keep fixed femur/tibia lengths, finite joints and contact support',()=>{
 const base=sampleWetapungaPose();assert.equal(base.legs.length,6);for(const l of base.legs)assert.deepEqual(l.foot,D.restFootContacts.find(c=>c.id===l.id).position);
 for(let n=-96;n<=96;n++){
  const phase=n/24*Math.PI,p=sampleWetapungaPose({walkPhase:phase});assert.ok(p.legs.filter(l=>l.contact).length>=3);
  if(n%24===0)assert.equal(p.legs.filter(l=>l.contact).length,6);
  for(const l of p.legs){assert.ok([l.hip,l.knee,l.foot].every(p=>Object.values(p).every(Number.isFinite)));assert.ok(Math.abs(dist(l.hip,l.knee)-l.boneLengths[0])<1e-12);assert.ok(Math.abs(dist(l.knee,l.foot)-l.boneLengths[1])<1e-12);assert.ok(l.foot.y>=-D.rootAboveSupport-1e-12);if(l.contact)assert.equal(l.foot.y,-D.rootAboveSupport);}
 }
 const a=sampleWetapungaPose({walkPhase:0}),b=sampleWetapungaPose({walkPhase:2*Math.PI});assert.deepEqual(a.legs,b.legs);
 for(const phase of [.2,.7,1.2,-.2,-.7,-1.2]){
  const a=sampleWetapungaPose({walkPhase:phase}),b=sampleWetapungaPose({walkPhase:phase+.001});
  for(let j=0;j<6;j++)if(a.legs[j].contact&&b.legs[j].contact)assert.ok(Math.abs(b.legs[j].foot.z-a.legs[j].foot.z+D.cycleDistance*.001/(2*Math.PI))<1e-12,'planted toe exactly cancels signed root travel');
 }
});

test('actual native bone centers, tapered toe skin and six foot rays meet real flat support at rest and halfsteps',()=>{
 const root=createWetapungaModel(),support=new T.Mesh(new T.BoxGeometry(.4,.2,1),new T.MeshBasicMaterial());support.position.y=-D.rootAboveSupport-.1;support.updateMatrixWorld(true);let rays=0,maxGap=0;
 for(const phase of [0,Math.PI,2*Math.PI,-Math.PI,Math.PI/2]){
  updateWetapungaModel(root,{walkPhase:phase});
  for(const l of root.userData.legs){const a=l.mesh.geometry.attributes.position;for(const [b,pair] of l.boneVertexPairs.entries()){const start=new T.Vector3().fromBufferAttribute(a,pair[0]),end=new T.Vector3().fromBufferAttribute(a,pair[1]);assert.ok(Math.abs(start.distanceTo(end)-l.boneLengths[b])<1e-8);assert.ok(start.distanceTo(V(b?l.knee:l.hip))<1e-8);assert.ok(end.distanceTo(V(b?l.foot:l.knee))<1e-8);}
   const foot=new T.Vector3().fromBufferAttribute(a,l.tipVertex),ray=new T.Raycaster(foot.clone().add(new T.Vector3(0,.02,0)),new T.Vector3(0,-1,0),0,.05),hit=ray.intersectObject(support)[0];assert.ok(hit);rays++;if(l.contact){maxGap=Math.max(maxGap,Math.abs(foot.y-hit.point.y));assert.ok(Math.abs(foot.y-hit.point.y)<1e-8);}
  }
 }
 assert.equal(rays,30);console.log('wetapunga native toe gap',maxGap);support.geometry.dispose();support.material.dispose();root.userData.dispose();
});

test('bounded native walk skin clears support; distal legs, ovipositor and long antennae do not cut body or each other',()=>{
 const root=createWetapungaModel(),body=triangles(root.userData.bodyMesh),ovipositor=triangles(root.userData.ovipositor),tailDistal=ovipositor.filter(t=>t.box.max.z<-.14),antennaDistal=root.userData.antennae.flatMap(a=>triangles(a.mesh).filter(t=>t.box.min.z>.16));
 assert.equal(intersects(tailDistal,body),0);assert.equal(intersects(antennaDistal,body),0);assert.equal(intersects(ovipositor,antennaDistal),0);
 let nativeFrames=0,minSupport=Infinity;
 for(let n=0;n<24;n++){
  updateWetapungaModel(root,{walkPhase:n/12*Math.PI});nativeFrames++;const legs=root.userData.legs.map(l=>triangles(l.mesh));
  for(let i=0;i<6;i++){
   const l=root.userData.legs[i],distal=triangles(l.mesh,t=>t>=16&&t<32||t>=48);
   assert.equal(intersects(distal,body),0,`${l.id} distal skin/body at${n}`);assert.equal(intersects(legs[i],ovipositor),0,`${l.id} tail at${n}`);assert.equal(intersects(legs[i],antennaDistal),0);
   for(let j=i+1;j<6;j++)assert.equal(intersects(legs[i],legs[j]),0,`${l.id}/${root.userData.legs[j].id} at${n}`);
  }
  root.traverse(m=>{if(m.isMesh)for(const p of vertices(m)){assert.ok(p.toArray().every(Number.isFinite));minSupport=Math.min(minSupport,p.y+D.rootAboveSupport);}});
 }
 assert.ok(minSupport>=-1e-8);assert.equal(nativeFrames,24);console.log('wetapunga native bounded clearance',JSON.stringify({nativeFrames,minSupport}));root.userData.dispose();
});

test('female wingless anatomy is explicit, true coxae connect body, original geometry budget is bounded',()=>{
 const root=createWetapungaModel();assert.equal(root.userData.sex,'female');assert.equal(root.userData.wingCount,0);assert.equal(root.userData.antennae.length,2);assert.equal(root.userData.cerci.length,2);assert.match(root.userData.ovipositor.name,/ovipositor/);assert.equal(root.userData.segmentMesh.userData.components.length,7);
 for(const l of root.userData.legs){const c=root.userData.bodyMesh.userData.components.find(c=>c.name===`coxa-${l.id}`);assert.ok(c);const a=root.userData.bodyMesh.geometry.attributes.position,box=new T.Box3();for(let n=c.start;n<c.start+c.count;n++)box.expandByPoint(new T.Vector3().fromBufferAttribute(a,n));assert.ok(box.containsPoint(V(l.hip)),'actual coxa surrounds the native hip');}
 let meshes=0,triangles=0;root.traverse(m=>{if(m.isMesh){meshes++;triangles+=(m.geometry.index?.count??m.geometry.attributes.position.count)/3;assert.equal(m.material.map,null);}});assert.ok(meshes<=16);assert.ok(triangles<5000);assert.ok(root.userData.approximations.includes('spine count and spacing'));console.log('wetapunga native budget',JSON.stringify({meshes,triangles}));root.userData.dispose();
});

test('capture and inspection freeze every native vertex and caller transform; release same state continuous; independent disposal',()=>{
 const a=createWetapungaModel(),b=createWetapungaModel({inspection:true}),state={position:{x:1,y:.8,z:2},orientation:{x:0,y:Math.SQRT1_2,z:0,w:Math.SQRT1_2},walkPhase:.9};
 updateWetapungaModel(a,state);const before=skin(a);for(let n=0;n<10;n++)updateWetapungaModel(a,{...state,position:{x:8,y:9,z:10},walkPhase:n,caught:true});assert.deepEqual(skin(a),before);updateWetapungaModel(a,state);assert.deepEqual(skin(a),before);
 b.position.set(2,3,4);b.rotation.set(.2,.3,.4);b.scale.setScalar(2);const inspection=skin(b);updateWetapungaModel(b,state);assert.deepEqual(skin(b),inspection);assert.notEqual(a.userData.legs[0].mesh.geometry,b.userData.legs[0].mesh.geometry);
 let geometries=0,materials=0;const mats=new Set();a.traverse(m=>{if(m.isMesh){m.geometry.addEventListener('dispose',()=>geometries++);mats.add(m.material);}});for(const m of mats)m.addEventListener('dispose',()=>materials++);a.userData.dispose();a.userData.dispose();assert.equal(geometries,15);assert.equal(materials,5);b.userData.dispose();
});
