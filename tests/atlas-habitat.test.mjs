/** Actual Three.js wood/terrain rays only; not a rendered discovery or nature test. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
const box={console};vm.runInNewContext(fs.readFileSync(new URL('../assets/vendor/three.min.js',import.meta.url),'utf8'),box);const T=box.THREE,ctx={};for(const key of['fillRect','beginPath','moveTo','lineTo','quadraticCurveTo','stroke','fill'])ctx[key]=()=>{};globalThis.window={THREE:T};globalThis.document={createElement:()=>({getContext:()=>ctx})};
const {createUnderstoryWorld}=await import('../src/world-understory.js');
const {createMetalliferHabitat}=await import('../src/metallifer-habitat.js');
const {createAtlasHabitat}=await import('../src/atlas-habitat.js');
const {ATLAS_BRANCH:B,ATLAS_APPROACH:APPROACH}=await import('../src/atlas-layout.js');
const {createAtlasModel,updateAtlasModel,ATLAS_DIMENSIONS:D}=await import('../src/atlas-model.js');
const {createCaptureVisibility}=await import('../src/capture-visibility.js');
const {createInsects}=await import('../src/insects.js');
const vec=p=>new T.Vector3(p.x,p.y,p.z);
function signature(mesh){const h=createHash('sha256');h.update(JSON.stringify(mesh.matrix.elements));for(const[key,a]of Object.entries(mesh.geometry.attributes)){h.update(key);h.update(Buffer.from(a.array.buffer,a.array.byteOffset,a.array.byteLength));}if(mesh.geometry.index){const a=mesh.geometry.index.array;h.update(Buffer.from(a.buffer,a.byteOffset,a.byteLength));}return h.digest('hex');}
function fixture(){const scene=new T.Scene(),world=createUnderstoryWorld(scene),metallifer=createMetalliferHabitat(world,scene),old=scene.children.filter(n=>n.isMesh),before=old.map(signature),colliders=JSON.stringify(world.colliders),addon=createAtlasHabitat(world,scene);scene.updateMatrixWorld(true);return{scene,world,metallifer,old,before,colliders,addon};}
function sim(f,atlas=true){const w=f.world,m=f.metallifer,a=f.addon;return createInsects(w.heightAt,{homes:w.insectHomes,leafSupports:w.leafSupports,bounds:w.bounds,extraHomes:[...m.homes,...(atlas?a.homes:[])],metalliferSupports:m.metalliferSupports,atlasSupports:atlas?a.atlasSupports:[],hasLineOfSight:createCaptureVisibility([...w.captureOccluders,...m.captureOccluders,...(atlas?a.captureOccluders:[])])});}

test('Atlas adds one fixed fifth individual and two meshes without changing the old four insects, terrain, plants or entrance route',()=>{
 const f=fixture(),a=f.addon;assert.deepEqual(f.old.map(signature),f.before);assert.equal(JSON.stringify(f.world.colliders),f.colliders);assert.equal(f.scene.children.filter(n=>n.isMesh).length,f.old.length+2);assert.equal(a.stats.addedMeshes,2);assert.equal(a.stats.addedTextures,0);assert.ok(a.stats.addedTriangles<=256);
 const old=sim(f,false),next=sim(f);assert.deepEqual(next.items.slice(0,4),old.items);assert.equal(next.items[4].id,'insect-5');assert.equal(next.items[4].species,'atlas');assert.equal(next.items[4].encounterId,undefined);
 for(let n=0;n<120;n++){const p={x:0,y:1.65,z:10,speed:0};old.update(1/60,p);next.update(1/60,p);}assert.deepEqual(next.items.slice(0,4),old.items);
 for(let z=4;z<=10;z+=.1)assert.ok(a.colliders.every(c=>Math.hypot(c.x,c.z-z)>=c.r+.28));assert.throws(()=>createAtlasHabitat(f.world,new T.Scene()),/understory/);
});

test('actual wood gives a continuous flat lane throughout the .70m retreat, connected to a grounded trunk',()=>{
 const f=fixture(),home=f.addon.atlasSupports[0].home,wood=f.addon.captureOccluders[0],ray=new T.Raycaster(),top=home.y-D.rootAboveSupport;
 for(const d of[-.82,-.7,-.4,0,.12,.4])for(const dx of[-.106,0,.106]){ray.set(new T.Vector3(home.x+dx,top+.1,home.z+d),new T.Vector3(0,-1,0));ray.far=.2;const hit=ray.intersectObject(wood)[0];assert.ok(hit);assert.ok(Math.abs(hit.point.y-top)<1e-6);assert.ok(hit.face.normal.y>.99);}
 ray.set(new T.Vector3(B.x-1,f.world.heightAt(B.x,B.trunkZ),B.trunkZ),new T.Vector3(1,0,0));ray.far=2;assert.ok(ray.intersectObject(wood).length>0,'trunk enters terrain');
 ray.set(new T.Vector3(B.x,top+.6,B.trunkZ),new T.Vector3(0,-1,0));ray.far=2;assert.ok(ray.intersectObject(wood).length>0,'trunk joins branch rear');
});

test('six normal/quiet side approaches legally capture while the trunk-behind line is blocked, without reducing net range',()=>{
 const f=fixture();for(const p of APPROACH)for(const quiet of[false,true]){const s=sim(f),item=s.items[4],eye={...p,y:f.world.heightAt(p.x,p.z)+(quiet?1.28:1.65),quiet,speed:0},direction=vec(item).sub(vec(eye));assert.ok(f.addon.colliders.every(c=>Math.hypot(c.x-eye.x,c.z-eye.z)>c.r+.28));assert.equal(s.findTarget(eye,direction)?.item.id,item.id);assert.equal(s.swing(eye,direction).item,item);}
 const s=sim(f),item=s.items[4],eye={x:B.x,z:4.55,y:f.world.heightAt(B.x,4.55)+1.65},direction=vec(item).sub(vec(eye));assert.ok(direction.length()<2.6);assert.equal(s.findTarget(eye,direction)?.item.id===item.id,false);assert.equal(s.swing(eye,direction).ok,false);assert.equal(s.startleFromNet(eye,direction),null);
});

test('actual animated six-foot skin remains on real wood in forward and retreat poses, without touching the rear trunk',()=>{
 const f=fixture(),home=f.addon.atlasSupports[0].home,wood=f.addon.captureOccluders[0],m=createAtlasModel(),ray=new T.Raycaster();f.scene.add(m);let checks=0;
 for(const d of[-.7,-.687,-.54,-.3,-.02,0,.013,.12])for(const headLift of[0,1]){
  updateAtlasModel(m,{position:{x:home.x,y:home.y,z:home.z+d},heading:0,walkPhase:d/D.cycleDistance*Math.PI*2,headLift});
  for(const leg of m.userData.legs){if(!leg.contact)continue;const foot=vec(leg.foot).applyMatrix4(m.matrixWorld),a=leg.mesh.geometry.attributes.position;let skin=Infinity;for(let k=0;k<a.count;k++)skin=Math.min(skin,new T.Vector3().fromBufferAttribute(a,k).applyMatrix4(leg.mesh.matrixWorld).distanceTo(foot));assert.ok(skin<1e-6);ray.set(foot.clone().add(new T.Vector3(0,.03,0)),new T.Vector3(0,-1,0));ray.far=.06;const hit=ray.intersectObject(wood)[0];assert.ok(hit);assert.ok(Math.abs(hit.point.y-foot.y)<1e-6);checks++;}
  const bounds=new T.Box3().setFromObject(m);assert.ok(bounds.min.z>B.trunkZ+B.trunkRadius,'whole body and legs remain in front of the solid trunk');
 }
 assert.ok(checks>=60);m.userData.dispose();
});
