/** 058 finite CPU support checks. No model skin / GPU / natural microhabitat claim. */
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import {createHash} from 'node:crypto';
const box={};vm.runInNewContext(fs.readFileSync(new URL('../assets/vendor/three.min.js',import.meta.url),'utf8'),box);const T=box.THREE;globalThis.window={THREE:T};
const {createAustraliaWorld}=await import('../src/world-australia.js'),{createRainbowStagHabitat}=await import('../src/rainbow-stag-habitat.js'),{AUSTRALIA_ROUTE}=await import('../src/rainbow-stag-layout.js'),{XYLOTRUPES_SUPPORT:S,XYLOTRUPES_BRANCH:B,XYLOTRUPES_APPROACHES}=await import('../src/xylotrupes-layout.js'),{createXylotrupesHabitat}=await import('../src/xylotrupes-habitat.js'),{createCaptureVisibility}=await import('../src/capture-visibility.js');
const hash=s=>createHash('sha256').update(s).digest('hex'),norm=s=>s.replace(/(from\s*['"]\.\/[^'"?\n]+)(?:\?[^'"\n]*)?(['"])/g,'$1$2');
function fixture(){const scene=new T.Scene(),world=createAustraliaWorld(scene);return{scene,world};}
const V=p=>new T.Vector3(p.x,p.y,p.z);
function geometry(g){const h=createHash('sha256');for(const m of g){m.updateMatrixWorld(true);h.update(JSON.stringify([m.name,m.matrixWorld.toArray(),m.material.color.getHexString()]));for(const a of Object.values(m.geometry.attributes))h.update(Buffer.from(a.array.buffer,a.array.byteOffset,a.array.byteLength));if(m.geometry.index){const a=m.geometry.index.array;h.update(Buffer.from(a.buffer,a.byteOffset,a.byteLength));}}return h.digest('hex');}
function gap(a,b){return Math.hypot(Math.max(0,a.min.x-b.max.x,b.min.x-a.max.x),Math.max(0,a.min.y-b.max.y,b.min.y-a.max.y),Math.max(0,a.min.z-b.max.z,b.min.z-a.max.z));}

test('frozen057 Australia source, old log, homes, colliders and support remain exact; addition is two owned meshes only',()=>{
 for(const[file,expected]of Object.entries({'world-australia.js':'ba671c4fc6a7a9f9c9a4202306813d9f691d3c5b97cf7ac708ab785bc0dc2049','rainbow-stag-layout.js':'763ac5a57ce05cdc2b580f5e912e9042393ba42d5cab9efa5f1586a3480e0e7e','rainbow-stag-habitat.js':'1679e3922008aa40183e90f327ec7285f314780dc272f7520ceb75927f49eb90'}))assert.equal(hash(norm(fs.readFileSync(new URL('../src/'+file,import.meta.url),'utf8'))),expected);
 const{scene,world}=fixture(),old=createRainbowStagHabitat(world,scene),before={geometry:geometry(world.meshes),homes:structuredClone(world.insectHomes),colliders:structuredClone(world.colliders),support:structuredClone(old.rainbowStagSupports),children:scene.children.length},refs=[...world.captureOccluders],h=createXylotrupesHabitat(world,scene);
 assert.equal(geometry(world.meshes),before.geometry);assert.deepEqual(world.insectHomes,before.homes);assert.deepEqual(world.colliders,before.colliders);assert.deepEqual(createRainbowStagHabitat(world,scene).rainbowStagSupports,before.support);assert.deepEqual(world.captureOccluders,refs);assert.equal(scene.children.length,before.children+2);assert.equal(h.stats.addedMeshes,2);assert.equal(h.stats.addedTextures,0);assert.deepEqual(h.xylotrupesSupports,[S]);assert.notEqual(h.xylotrupesSupports[0],S);assert.ok(Object.isFrozen(h.xylotrupesSupports[0].home));assert.deepEqual(h.homes,[['xylotrupes',S.home.x,S.home.z,S.home.y]]);assert.deepEqual(h.captureOccluders,[h.branch,h.post]);
 const b=new T.Box3().setFromObject(h.branch);assert.ok(b.min.x>-world.bounds&&b.max.x<world.bounds&&b.min.z>-world.bounds&&b.max.z<world.bounds);for(const mesh of h.captureOccluders){const a=mesh.geometry.attributes.position;for(let k=0;k<a.count;k++){const p=new T.Vector3().fromBufferAttribute(a,k).applyMatrix4(mesh.matrixWorld);assert.ok(h.colliders.some(c=>Math.hypot(p.x-c.x,p.z-c.z)<=c.r),'actual support footprint covered by finite colliders');}}let minOldSolidGap=Infinity;for(const solid of world.captureOccluders.slice(1)){const d=gap(b,new T.Box3().setFromObject(solid));assert.ok(d>0);minOldSolidGap=Math.min(minOldSolidGap,d);}console.log(JSON.stringify({supportAddition:{...h.stats,minOldSolidGap}}));h.dispose();world.dispose();
});

test('real top triangles cover full fixed lane and six-foot gait envelope; visible post reaches actual ground and branch',()=>{
 const{scene,world}=fixture(),h=createXylotrupesHabitat(world,scene),ray=new T.Raycaster(),down=new T.Vector3(0,-1,0);let rays=0,minMargin=Infinity,maxGap=0;
 const q=new T.Quaternion(S.orientation.x,S.orientation.y,S.orientation.z,S.orientation.w);assert.ok(new T.Vector3(0,0,1).applyQuaternion(q).distanceTo(new T.Vector3(1,0,0))<1e-12);
 for(const d of[-.12,0,.12])for(const x of[-.100,.100])for(const z of[-.090,0,.090])for(const gait of[-.010,0,.010]){const foot=new T.Vector3(x,-.055,z+gait).applyQuaternion(q).add(V(S.home)).add(new T.Vector3(d,0,0));ray.set(foot.clone().add(new T.Vector3(0,.2,0)),down);ray.far=.4;const hit=ray.intersectObject(h.branch,false)[0];assert.ok(hit?.face&&hit.face.normal.y>.999999);maxGap=Math.max(maxGap,foot.distanceTo(hit.point));minMargin=Math.min(minMargin,B.halfLength-Math.abs(foot.x-B.center.x),B.topHalfWidth-Math.abs(foot.z-B.center.z));rays++;}
 assert.ok(maxGap<1e-8);assert.ok(minMargin>.059999);assert.equal(h.stats.footEnvelopeRays,27);
 ray.set(new T.Vector3(B.postX,1,B.center.z),down);ray.far=2;const ground=ray.intersectObject(world.captureOccluders[0],false)[0],top=ray.intersectObject(h.post,false)[0];assert.ok(ground?.face&&top?.face);assert.ok(Math.abs(ground.point.y-h.groundAnchor.y)<1e-9);assert.ok(top.point.y>B.bottom&&top.point.y<B.top);
 // Four actual side-skin rays at the ground level prove the visible post surrounds its ground anchor.
 let groundSkinRays=0;for(const a of[0,Math.PI/2,Math.PI,Math.PI*1.5]){const dir=new T.Vector3(Math.cos(a),0,Math.sin(a));ray.set(V(h.groundAnchor).addScaledVector(dir,.2),dir.clone().negate());ray.far=.4;assert.ok(ray.intersectObject(h.post,false)[0]?.face);groundSkinRays++;}
 // At the post's cap height a ray from its axis reaches actual branch underside; the post cap is inside the closed prism.
 ray.set(new T.Vector3(B.postX,B.bottom-.1,B.center.z),new T.Vector3(0,1,0));ray.far=.3;const underside=ray.intersectObject(h.branch,false)[0];assert.ok(underside?.face&&underside.point.y<top.point.y);
 console.log(JSON.stringify({actualSupport:{rays,maxGap,minMargin,groundSkinRays,postBranchOverlap:top.point.y-underside.point.y}}));h.dispose();world.dispose();
});

test('old Australia loop and rainbow capture lines remain clear where previously clear; new front and side capture stay reachable',()=>{
 const{scene,world}=fixture(),before=createCaptureVisibility(world.captureOccluders),h=createXylotrupesHabitat(world,scene),after=createCaptureVisibility([...world.captureOccluders,...h.captureOccluders]);let samples=0,minNewMargin=Infinity;
 const routes=[AUSTRALIA_ROUTE,[{x:2.6,z:1.5},{x:2.6,z:.55},{x:3.6,z:.55}]];
 for(const route of routes)for(let k=1;k<route.length;k++){const a=route[k-1],b=route[k],n=Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.1);for(let j=0;j<=n;j++){const x=a.x+(b.x-a.x)*j/n,z=a.z+(b.z-a.z)*j/n;for(const c of world.colliders)assert.ok(Math.hypot(x-c.x,z-c.z)>c.r+.28);for(const c of h.colliders){const margin=Math.hypot(x-c.x,z-c.z)-c.r-.28;assert.ok(margin>0);minNewMargin=Math.min(minNewMargin,margin);}samples++;}}
 let oldLOS=0,oldClear=0;for(const e of AUSTRALIA_ROUTE)for(const x of[-.34,-.12,0,.12,.34]){const eye={x:e.x,y:1.28,z:e.z},target={x,y:.6075,z:.1},was=before(eye,target);assert.equal(after(eye,target),was);oldLOS++;if(was)oldClear++;}
 for(const eye of XYLOTRUPES_APPROACHES){assert.ok(V(eye).distanceTo(V(S.home))<2.6);assert.equal(after(eye,S.home),true);for(const c of[...world.colliders,...h.colliders])assert.ok(Math.hypot(eye.x-c.x,eye.z-c.z)>c.r+.28);}
 // Actual opaque branch blocks a crossing ray; capture visibility is not allowed to ignore this whole new support.
 assert.equal(after({x:S.home.x,y:.3,z:S.home.z},{x:S.home.x,y:1.1,z:S.home.z}),false);
 console.log(JSON.stringify({routeAndLOS:{samples,minNewMargin,oldLOS,oldClear,newCaptureApproaches:2}}));h.dispose();world.dispose();
});

test('habitat disposal releases only its two geometries/materials once and rejects wrong world before adding meshes',()=>{
 const{scene,world}=fixture(),count=scene.children.length;assert.throws(()=>createXylotrupesHabitat({...world,regionId:'flores'},scene));assert.equal(scene.children.length,count);const h=createXylotrupesHabitat(world,scene),owned=new Map(),old=new Map();
 for(const[m,map]of [...h.captureOccluders.map(m=>[m,owned]),...world.meshes.map(m=>[m,old])])for(const r of[m.geometry,m.material])if(!map.has(r)){map.set(r,0);r.addEventListener('dispose',()=>map.set(r,map.get(r)+1));}
 h.dispose();h.dispose();assert.equal(owned.size,4);assert.ok([...owned.values()].every(n=>n===1));assert.ok([...old.values()].every(n=>n===0));assert.equal(scene.children.length,count);assert.equal(h.branch.parent,null);assert.equal(h.post.parent,null);world.dispose();assert.ok([...old.values()].every(n=>n===1));
});
