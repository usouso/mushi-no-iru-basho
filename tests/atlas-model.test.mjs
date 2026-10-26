/** CPU original geometry/contact audit only; no WebGL or species-photo match claim. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {ATLAS_DIMENSIONS as D,sampleAtlasPose} from '../src/atlas-kinematics.js';
const box={console};vm.runInNewContext(fs.readFileSync(new URL('../assets/vendor/three.min.js',import.meta.url),'utf8'),box);const T=box.THREE;globalThis.window={THREE:T};
const {createAtlasModel,updateAtlasModel}=await import('../src/atlas-model.js');
const vec=p=>new T.Vector3(p.x,p.y,p.z),gap=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
function nearestVertex(mesh,p){const a=mesh.geometry.attributes.position;let d=Infinity;for(let i=0;i<a.count;i++)d=Math.min(d,new T.Vector3().fromBufferAttribute(a,i).applyMatrix4(mesh.matrixWorld).distanceTo(p));return d;}
function surfaceDistance(mesh,p){const g=mesh.geometry,a=g.attributes.position,index=g.index,triangle=new T.Triangle(),q=new T.Vector3();let d=Infinity;for(let i=0;i<(index?.count??a.count);i+=3){for(const[key,k]of[['a',0],['b',1],['c',2]])triangle[key].fromBufferAttribute(a,index?index.getX(i+k):i+k).applyMatrix4(mesh.matrixWorld);if(triangle.getArea()<1e-14)continue;triangle.closestPointToPoint(p,q);d=Math.min(d,p.distanceTo(q));}return d;}
function hornPoint(root,h,p){if(h.role==='head-horn')return vec(p).sub(vec(root.userData.headPivotOrigin)).applyMatrix4(root.userData.headPivot.matrixWorld);return vec(p).applyMatrix4(root.matrixWorld);}
function signature(root){const hash=createHash('sha256');root.traverse(n=>{n.updateMatrix();hash.update(JSON.stringify([n.name,Array.from(n.matrix.elements)]));if(n.geometry)for(const name of Object.keys(n.geometry.attributes).sort()){const a=n.geometry.attributes[name].array;hash.update(Buffer.from(a.buffer,a.byteOffset,a.byteLength));}});return hash.digest('hex');}

test('male lab has three role-specific horns, six legs and separate paired antennae/elytra/stored wings at declared display scale',()=>{
 const m=createAtlasModel(),u=m.userData;assert.equal(u.species,'atlas-study');assert.equal(u.sex,'male');assert.equal(D.displayScaleOnly,true);assert.equal(D.bodyLength,.20);assert.equal(D.displayLength,.38);
 assert.equal(u.horns.length,3);assert.equal(u.horns.filter(h=>h.role==='head-horn').length,1);assert.deepEqual(u.horns.filter(h=>h.role==='thorax-horn').map(h=>h.side).sort(),[-1,1]);assert.equal(u.legs.length,6);assert.equal(u.antennae.length,2);assert.equal(u.elytra.length,2);assert.equal(u.hindwings.length,2);assert.equal(u.eyes.centres.length,2);
 assert.equal(new Set([...u.horns.map(h=>h.mesh),...u.legs.map(l=>l.mesh),...u.antennae.map(a=>a.mesh),...u.elytra,...u.hindwings]).size,15);
 let draws=0,triangles=0;m.traverse(n=>{if(!n.isMesh)return;draws++;triangles+=(n.geometry.index?.count??n.geometry.attributes.position.count)/3;assert.equal(n.material.map,null);assert.ok(n.geometry.attributes.position.array.every(Number.isFinite));assert.ok(n.geometry.attributes.normal.array.every(Number.isFinite));});assert.ok(draws<25&&triangles<5000,'small original browser model budget');
 const body=new T.Box3().setFromObject(u.bodyMesh).union(new T.Box3().setFromObject(u.headMesh));assert.ok(Math.abs(body.max.z-body.min.z-.2)<.003);
 const horns=new T.Box3();for(const h of u.horns)horns.union(new T.Box3().setFromObject(h.mesh));assert.ok(Math.abs(horns.max.z-body.min.z-.38)<1e-6);assert.ok(new T.Box3().setFromObject(m).min.y>=-1e-7);
 for(const w of u.hindwings){assert.equal(w.userData.stored,true);const a=w.geometry.attributes.position;for(let i=0;i<a.count;i++){const p=new T.Vector3().fromBufferAttribute(a,i).applyMatrix4(w.matrixWorld),ray=new T.Raycaster(p.clone().add(new T.Vector3(0,1,0)),new T.Vector3(0,-1,0));const hit=ray.intersectObjects(u.elytra)[0];assert.ok(hit&&hit.point.y>p.y+.001,'stored hindwing sits beneath actual shell');}}
 m.userData.dispose();
});

test('actual three horn skins reach tagged tips and remain connected to head/pronotum without intersecting each other during warning',()=>{
 const m=createAtlasModel();for(const headLift of[0,.5,1]){updateAtlasModel(m,{headLift});const u=m.userData;
  for(const h of u.horns){const root=hornPoint(m,h,h.root),tip=hornPoint(m,h,h.tip),parent=h.role==='head-horn'?u.headMesh:u.bodyMesh;assert.ok(surfaceDistance(parent,root)<.015,'horn base embedded in the correct skin');assert.ok(nearestVertex(h.mesh,tip)<1e-7,'tip metadata reaches the actual tapered skin');assert.equal(h.mesh.parent,h.role==='head-horn'?u.headPivot:m);assert.equal(h.mesh.userData.role,h.role);}
  for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)assert.equal(new T.Box3().setFromObject(u.horns[i].mesh).intersectsBox(new T.Box3().setFromObject(u.horns[j].mesh)),false,'separate horn skins do not cross');
 }
 m.userData.dispose();
});

test('signed forward/reverse poses keep fixed leg lengths and world-fixed stance; actual skin reaches the scaled support plane',()=>{
 const m=createAtlasModel();
 for(const direction of[-1,1])for(const scale of[1,1.15]){
  let before;for(let n=0;n<=160;n++){
   const d=direction*.08*scale*n/160,heading=.6,state={scale,walkPhase:d/(D.cycleDistance*scale)*Math.PI*2,position:{x:2+Math.sin(heading)*d,y:1.1+D.rootAboveSupport*scale,z:3+Math.cos(heading)*d},heading,headLift:.5},pose=sampleAtlasPose(state);updateAtlasModel(m,state);assert.ok(pose.legs.filter(l=>l.contact).length>=3);
   for(let i=0;i<6;i++){
    const leg=pose.legs[i],skin=m.userData.legs[i],world=vec(leg.foot).applyMatrix4(m.matrixWorld);assert.ok(Math.abs(gap(leg.hip,leg.knee)-D.upperLegLength)<1e-10);assert.ok(Math.abs(gap(leg.knee,leg.foot)-D.lowerLegLength)<1e-10);assert.equal(skin.contact,leg.contact);assert.ok(nearestVertex(skin.mesh,world)<1e-7);assert.ok(skin.mesh.geometry.attributes.position.array.every(Number.isFinite));
    if(leg.contact){assert.ok(Math.abs(world.y-1.1)<1e-10);if(before?.contacts[i])assert.ok(world.distanceTo(before.feet[i])<1e-8,'signed stance anchor is fixed');}
   }
   assert.ok(new T.Box3().setFromObject(m).min.y>=1.1-1e-7,'no leg tube below support');before={feet:pose.legs.map(l=>vec(l.foot).applyMatrix4(m.matrixWorld)),contacts:pose.legs.map(l=>l.contact)};
  }
 }
 for(let n=-8;n<=8;n++)assert.equal(sampleAtlasPose({walkPhase:n*Math.PI}).legs.filter(l=>l.contact).length,6);m.userData.dispose();
});

test('inspection ignores field updates and malformed numeric poses remain finite without mutating another instance',()=>{
 const inspection=createAtlasModel({inspection:true}),field=createAtlasModel();inspection.position.set(1,2,3);inspection.rotation.set(.2,.3,.1);inspection.scale.setScalar(4);const before=signature(inspection);
 updateAtlasModel(inspection,{position:{x:-2,y:-3,z:-4},walkPhase:2,heading:1,headLift:1});assert.equal(signature(inspection),before);
 updateAtlasModel(field,{position:{x:NaN,y:Infinity,z:null},heading:NaN,walkPhase:NaN,headLift:Infinity,warningBlend:"bad",scale:NaN});field.traverse(n=>assert.ok(n.matrixWorld.elements.every(Number.isFinite)));assert.equal(signature(inspection),before);
 assert.throws(()=>updateAtlasModel(new T.Group(),{}),/atlas model/);inspection.userData.dispose();field.userData.dispose();
});

test('every visible geometry/material belongs to the original model and disposes once without damaging another model',()=>{
 const a=createAtlasModel(),b=createAtlasModel(),before=signature(b),resources=new Set();a.traverse(n=>{if(n.geometry)resources.add(n.geometry);if(n.material)resources.add(n.material);});b.traverse(n=>{if(n.geometry)assert.equal(resources.has(n.geometry),false);if(n.material)assert.equal(resources.has(n.material),false);});
 const counts=new Map();for(const resource of resources){counts.set(resource,0);resource.addEventListener('dispose',()=>counts.set(resource,counts.get(resource)+1));}a.userData.dispose();a.userData.dispose();assert.ok([...counts.values()].every(n=>n===1));assert.equal(signature(b),before);b.userData.dispose();
});
