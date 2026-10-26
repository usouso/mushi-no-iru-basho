/** CPU model and signed-distance gait only. No GPU or natural-motion claim. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {sampleMetalliferPose,METALLIFER_GAIT} from '../src/metallifer-kinematics.js';
const root=path.resolve(import.meta.dirname,'..'),sandbox={console};vm.runInNewContext(fs.readFileSync(path.join(root,'assets/vendor/three.min.js'),'utf8'),sandbox);const T=sandbox.THREE;globalThis.window={THREE:T};
const {createMetalliferModel,updateMetalliferModel,METALLIFER_DIMENSIONS}=await import('../src/metallifer-model.js');
const {createInsectModel,updateInsectModel}=await import('../src/insect-models.js');
function signature(node){const h=createHash('sha256');node.traverse(n=>{n.updateMatrix();h.update(JSON.stringify([n.type,n.name,Array.from(n.matrix.elements)]));if(n.geometry){for(const key of Object.keys(n.geometry.attributes).sort()){const a=n.geometry.attributes[key];h.update(key+':'+a.itemSize+':');h.update(Buffer.from(a.array.buffer,a.array.byteOffset,a.array.byteLength));}if(n.geometry.index){const a=n.geometry.index.array;h.update(Buffer.from(a.buffer,a.byteOffset,a.byteLength));}}});return h.digest('hex');}
const length=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z),world=(body,p)=>({x:body.position.x+Math.cos(body.heading)*p.x+Math.sin(body.heading)*p.z,y:body.position.y+p.y,z:body.position.z-Math.sin(body.heading)*p.x+Math.cos(body.heading)*p.z});

test('inspection geometry retains the frozen original lab fingerprint and its 16 draws, 2204 triangles, zero textures',()=>{
 const m=createMetalliferModel({inspection:true});assert.equal(signature(m),'7902a8e6db04181f72fa65b6810c323a9275a9a54274a33915605d2915cc0afb');
 let draws=0,triangles=0;m.traverse(n=>{if(n.isMesh){draws++;triangles+=(n.geometry.index?.count??n.geometry.attributes.position.count)/3;assert.equal(n.material.map,null);assert.ok(n.geometry.attributes.position.array.every(Number.isFinite));}});
 assert.equal(draws,16);assert.equal(triangles,2204);assert.equal(m.userData.legs.length,6);assert.equal(m.userData.elytra.length,2);assert.equal(m.userData.hindwings.length,2);assert.equal(m.userData.antennae.length,2);assert.equal(METALLIFER_DIMENSIONS.displayScaleOnly,true);m.userData.dispose();
});

test('signed .04m gait keeps stance feet world-fixed in both directions and all six down at half-cycle stops',()=>{
 assert.equal(METALLIFER_GAIT.cycleDistance,.04);const base=sampleMetalliferPose().legs;
 for(const direction of[-1,1])for(const heading of[0,.7]){
  let old;for(let n=0;n<=720;n++){
   const distance=direction*.12*n/720,pose=sampleMetalliferPose({walkPhase:distance/.04*2*Math.PI,position:{x:2+Math.sin(heading)*distance,y:1.2,z:-3+Math.cos(heading)*distance},heading});
   assert.ok(pose.legs.filter(l=>l.contact).length>=3);
   for(let i=0;i<6;i++){const leg=pose.legs[i];assert.ok(leg.foot.y>=0&&leg.foot.y<=.006+1e-12);if(leg.contact)assert.equal(leg.foot.y,0);
    if(old?.legs[i].contact&&leg.contact)assert.ok(length(world(old.body,old.legs[i].foot),world(pose.body,leg.foot))<1e-10);
    for(const[a,b]of[['hip','knee'],['knee','ankle']]){const ratio=length(leg[a],leg[b])/length(base[i][a],base[i][b]);assert.ok(ratio>.86&&ratio<1.167,'bounded display deformation, not fixed-bone anatomy');}
   }old=pose;
  }
 }
 for(let n=-6;n<=6;n++)assert.equal(sampleMetalliferPose({walkPhase:n*Math.PI}).legs.filter(l=>l.contact&&l.foot.y===0).length,6);
});

test('field leg geometry follows contacts on the support plane, stays finite and preserves the phase when stopped or captured',()=>{
 const m=createMetalliferModel();
 for(const walkPhase of[0,.2,.8,Math.PI,4.3,2*Math.PI,-.4,-Math.PI]){
  const state={position:{x:2,y:1.4,z:3},heading:.6,walkPhase,jawOpen:.7,walkSpeed:.02};updateMetalliferModel(m,state);
  assert.deepEqual(Array.from(m.position.toArray()),[2,1.4,3]);const pose=sampleMetalliferPose(state);
  for(let i=0;i<6;i++){
   const leg=m.userData.legs[i],p=leg.mesh.geometry.attributes.position;assert.equal(leg.contact,pose.legs[i].contact);assert.deepEqual(leg.foot,pose.legs[i].foot);assert.ok(p.array.every(Number.isFinite));assert.ok(leg.mesh.geometry.attributes.normal.array.every(Number.isFinite));
   const expected=new T.Vector3(leg.foot.x,leg.foot.y,leg.foot.z).applyMatrix4(m.matrixWorld);let minimum=Infinity;for(let n=0;n<p.count;n++){const at=new T.Vector3().fromBufferAttribute(p,n).applyMatrix4(m.matrixWorld);minimum=Math.min(minimum,at.distanceTo(expected));}assert.ok(minimum<1e-7,'actual taper reaches declared foot');
   if(leg.contact)assert.ok(Math.abs(expected.y-1.4)<1e-12);
  }
  const before=signature(m);updateMetalliferModel(m,{...state,walkSpeed:0,phase:'resting',caught:true});assert.equal(signature(m),before,'stop/capture never resets legs');
  assert.ok(new T.Box3().setFromObject(m).min.y>=1.4-1e-7);
 }
 m.userData.dispose();
});

test('inspection updates do not replace independent framing, jaw pose or frozen legs',()=>{
 const m=createMetalliferModel({inspection:true});m.position.set(1,2,3);m.rotation.set(.2,.3,.1);m.scale.setScalar(4);const before=signature(m);
 updateMetalliferModel(m,{position:{x:-3,y:-4,z:-5},heading:2,walkPhase:4,jawOpen:1});assert.equal(signature(m),before);assert.equal(m.userData.jawOpen,.15);assert.ok(m.userData.legs.every(l=>!l.rig));m.userData.dispose();
});

test('common model factory connects only the new species and keeps field readability outside inspection',()=>{
 const field=createInsectModel('metallifer'),inspection=createInsectModel('metallifer',{inspection:true});
 assert.equal(field.userData.species,'metallifer');assert.equal(inspection.userData.species,'metallifer');assert.equal(field.userData.inspection,false);assert.equal(inspection.userData.inspection,true);
 field.traverse(n=>{if(n.material)assert.match(n.material.customProgramCacheKey(),/insect-readability/);});inspection.traverse(n=>{if(n.material)assert.doesNotMatch(n.material.customProgramCacheKey(),/insect-readability/);});
 updateInsectModel(field,{x:3,y:2,z:1,heading:.2,walkPhase:Math.PI,jawOpen:.7,metalliferPhase:'reacting',caught:true});assert.equal(field.visible,false);assert.deepEqual(Array.from(field.position.toArray()),[3,2,1]);assert.equal(field.userData.jawOpen,.7);assert.equal(field.userData.legs.filter(l=>l.contact).length,6);
 updateInsectModel(field,{x:3,y:2,z:1,heading:.2,walkPhase:Math.PI,jawOpen:.7,metalliferPhase:'walking',caught:false});assert.equal(field.visible,true);field.userData.dispose();inspection.userData.dispose();
});

test('dynamic scratch surfaces and visible resources dispose once; malformed numeric pose input stays finite',()=>{
 const m=createMetalliferModel();updateMetalliferModel(m,{position:{x:NaN,y:Infinity,z:null},heading:NaN,walkPhase:NaN,jawOpen:Infinity});m.traverse(n=>assert.ok(n.matrixWorld.elements.every(Number.isFinite)));
 const resources=new Set(m.userData.legs.map(l=>l.rig.surface));m.traverse(n=>{if(n.geometry)resources.add(n.geometry);if(n.material)resources.add(n.material);});const counts=new Map();for(const resource of resources){counts.set(resource,0);resource.addEventListener('dispose',()=>counts.set(resource,counts.get(resource)+1));}
 m.userData.dispose();m.userData.dispose();assert.ok([...counts.values()].every(n=>n===1));
});
