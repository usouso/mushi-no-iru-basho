/** Actual Three.js geometry/rays only: no WebGL, perceived discovery or frame-rate claim. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
const sandbox={console};vm.runInNewContext(fs.readFileSync(new URL('../assets/vendor/three.min.js',import.meta.url),'utf8'),sandbox);
const T=sandbox.THREE,ctx={};for(const method of ['fillRect','beginPath','moveTo','lineTo','quadraticCurveTo','stroke','fill'])ctx[method]=()=>{};
globalThis.window={THREE:T};globalThis.document={createElement(tag){assert.equal(tag,'canvas');return{getContext:()=>ctx};}};
const {createUnderstoryWorld}=await import('../src/world-understory.js');
const {createMetalliferHabitat}=await import('../src/metallifer-habitat.js');
const {METALLIFER_BRANCH:B,METALLIFER_APPROACH:APPROACH}=await import('../src/metallifer-layout.js');
const {createCaptureVisibility}=await import('../src/capture-visibility.js');
const {createInsects}=await import('../src/insects.js');
function signature(mesh){const h=createHash('sha256');h.update(JSON.stringify(mesh.matrix.elements));for(const key of Object.keys(mesh.geometry.attributes)){const a=mesh.geometry.attributes[key].array;h.update(key);h.update(Buffer.from(a.buffer,a.byteOffset,a.byteLength));}if(mesh.geometry.index){const a=mesh.geometry.index.array;h.update(Buffer.from(a.buffer,a.byteOffset,a.byteLength));}return h.digest('hex');}
function fixture(){const scene=new T.Scene(),world=createUnderstoryWorld(scene),existing=scene.children.filter(n=>n.isMesh),signatures=existing.map(signature),colliders=JSON.stringify(world.colliders),addon=createMetalliferHabitat(world,scene);scene.updateMatrixWorld(true);return{scene,world,existing,signatures,colliders,addon};}
function sim(f,extra=true){const w=f.world,a=f.addon;return createInsects(w.heightAt,{homes:w.insectHomes,leafSupports:w.leafSupports,bounds:w.bounds,...(extra?{extraHomes:a.homes,metalliferSupports:a.metalliferSupports}:{}),hasLineOfSight:createCaptureVisibility([...w.captureOccluders,...(extra?a.captureOccluders:[])])});}
const v=p=>new T.Vector3(p.x,p.y,p.z),aim=(eye,p)=>v(p).sub(v(eye));

test('low branch is additive to understory only, old terrain/plants/colliders and leaf identities stay unchanged',()=>{
 const f=fixture(),{world:w,addon:a,scene}=f;
 assert.deepEqual(f.existing.map(signature),f.signatures);assert.equal(JSON.stringify(w.colliders),f.colliders);assert.equal(scene.children.filter(n=>n.isMesh).length,f.existing.length+2);assert.equal(a.stats.addedMeshes,2);assert.equal(a.stats.addedTextures,0);assert.ok(a.stats.addedTriangles<=256);
 assert.equal(a.homes.length,1);assert.equal(a.homes[0][0],'metallifer');assert.equal(a.metalliferSupports[0].heading,0);assert.equal(a.captureOccluders.length,1);
 const baseline=sim(f,false),augmented=sim(f);assert.deepEqual(augmented.items.slice(0,3),baseline.items);assert.equal(augmented.items[3].id,'insect-4');assert.equal(augmented.items[3].species,'metallifer');
 for(let n=0;n<120;n++){const player={x:0,y:1.65,z:10,speed:0};baseline.update(1/60,player);augmented.update(1/60,player);}assert.deepEqual(augmented.items.slice(0,3),baseline.items);
 for(let z=6;z<=10;z+=.1)assert.ok(a.colliders.every(c=>Math.hypot(c.x,c.z-z)>=c.r+.3),'original entrance route remains open');
 assert.throws(()=>createMetalliferHabitat(w,new T.Scene()),/understory/);
 console.log('Metallifer additive geometry:',JSON.stringify({home:a.metalliferSupports[0].home,...a.stats}));
});

test('actual top branch, grounded trunk and joined wood provide a continuous clear support lane',()=>{
 const {world:w,addon:a}=fixture(),wood=a.captureOccluders[0],home=a.metalliferSupports[0].home,ray=new T.Raycaster();
 for(const dz of [-.12,0,.12,.24,.36])for(const dx of[-.086,0,.086]){const origin=new T.Vector3(home.x+dx,home.y+.3,home.z+dz);ray.set(origin,new T.Vector3(0,-1,0));ray.far=.5;const hit=ray.intersectObject(wood,false)[0];assert.ok(hit);assert.ok(Math.abs(hit.point.y-home.y)<1e-6);assert.ok(hit.face.normal.y>.99);}
 // Cross-trunk entry at ground proves the visible trunk extends through the terrain.
 ray.set(new T.Vector3(B.x-1,w.heightAt(B.x,B.trunkZ),B.trunkZ),new T.Vector3(1,0,0));ray.far=2;assert.ok(ray.intersectObject(wood,false).length>0);
 // At the branch joint a vertical ray enters the upright trunk, not empty air.
 ray.set(new T.Vector3(B.x,home.y+.6,B.trunkZ),new T.Vector3(0,-1,0));ray.far=2;assert.ok(ray.intersectObject(wood,false).length>0);
});

test('standing/quiet route approaches can capture on support, but a trunk-behind line is vetoed rather than shrinking reach',()=>{
 const f=fixture(),{world:w,addon:a}=f,metrics=[];
 for(const point of APPROACH)for(const quiet of[false,true]){const s=sim(f),i=s.items[3],eye={...point,y:w.heightAt(point.x,point.z)+(quiet?1.28:1.65),quiet,speed:0},direction=aim(eye,i);assert.ok(a.colliders.every(c=>Math.hypot(c.x-eye.x,c.z-eye.z)>c.r+.3));const target=s.findTarget(eye,direction);assert.equal(target?.item.id,i.id);assert.equal(target.catchable,true);assert.equal(s.swing(eye,direction).item,i);metrics.push({...point,quiet,distance:direction.length()});}
 const s=sim(f),i=s.items[3],eye={x:B.x,z:5.9,y:w.heightAt(B.x,5.9)+1.65},direction=aim(eye,i);assert.ok(direction.length()<2.6);assert.equal(s.findTarget(eye,direction)?.item.id===i.id,false);assert.equal(s.swing(eye,direction).ok,false);
 console.log('Metallifer legal CPU approaches:',JSON.stringify(metrics));
});

test('actual animated feet remain supported on the existing flat facet during forward/reverse and jaw opening poses',async()=>{
 const {createMetalliferModel,updateMetalliferModel}=await import('../src/metallifer-model.js');
 const f=fixture(),home=f.addon.metalliferSupports[0].home,wood=f.addon.captureOccluders[0],root=createMetalliferModel();f.scene.add(root);
 const ray=new T.Raycaster();let checks=0;
 for(const distance of[0,.01,.02,.04,.08,.12])for(const jawOpen of[.15,.7]){
  updateMetalliferModel(root,{position:{x:home.x,y:home.y,z:home.z+distance},heading:0,walkPhase:distance/.04*2*Math.PI,walkSpeed:distance===0?0:.02,jawOpen});root.updateMatrixWorld(true);
  // Each rig foot with zero local lift must have real wood immediately below.
  for(const leg of root.userData.legs){const local=leg.foot;if(local.y>1e-7)continue;const foot=v(local).applyMatrix4(root.matrixWorld);const attribute=leg.mesh.geometry.attributes.position;let skinGap=Infinity;for(let k=0;k<attribute.count;k++)skinGap=Math.min(skinGap,new T.Vector3().fromBufferAttribute(attribute,k).applyMatrix4(leg.mesh.matrixWorld).distanceTo(foot));assert.ok(skinGap<1e-6,'actual foot tip lies on geometry');ray.set(foot.clone().add(new T.Vector3(0,.03,0)),new T.Vector3(0,-1,0));ray.far=.06;const hit=ray.intersectObject(wood,false)[0];assert.ok(hit);assert.ok(Math.abs(hit.point.y-foot.y)<1e-6);checks++;}
 }
 assert.ok(checks>=36);root.userData.dispose();
});
