/** Standalone CPU Three geometry, navigation and ownership. No GPU/visibility claim. */
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const sandbox={console};vm.runInNewContext(fs.readFileSync(new URL('../assets/vendor/three.min.js',import.meta.url),'utf8'),sandbox);const T=sandbox.THREE;globalThis.window={THREE:T};
const{createAustraliaWorld}=await import('../src/world-australia.js'),{createRainbowStagHabitat}=await import('../src/rainbow-stag-habitat.js'),{AUSTRALIA_ROUTE,AUSTRALIA_SPAWN,RAINBOW_APPROACH,RAINBOW_LANE:L}=await import('../src/rainbow-stag-layout.js'),{createCaptureVisibility}=await import('../src/capture-visibility.js');
const fixture=()=>{const scene=new T.Scene(),world=createAustraliaWorld(scene),habitat=createRainbowStagHabitat(world,scene);return{scene,world,habitat};};
const clearance=(p,c)=>Math.hypot(p.x-c.x,p.z-c.z)-c.r-.28;
test('bounded Australia world has actual matching terrain, one low solid log and no registered population',()=>{
 const{scene,world,habitat}=fixture();assert.equal(world.regionId,'australia');assert.equal(world.bounds,8);assert.deepEqual(world.spawn,{x:0,z:6});assert.deepEqual(world.insectHomes,[]);assert.equal(world.stats.fallenLogs,1);assert.equal(world.stats.textures,0);assert.equal(world.stats.drawCalls,8);assert.ok(world.stats.triangles<1000);assert.equal(habitat.homes.length,1);assert.equal(habitat.stats.addedMeshes,0);
 const ray=new T.Raycaster();for(const x of[-8,-3,.12,3,8])for(const z of[-8,-2,.7,4,8]){ray.set(new T.Vector3(x,2,z),new T.Vector3(0,-1,0));ray.far=3;const h=ray.intersectObject(scene.getObjectByName('australia-ground'))[0];assert.ok(h);assert.ok(Math.abs(h.point.y-world.heightAt(x,z))<1e-7);}
 const a=world.rainbowLog.geometry.attributes.position;for(let i=0;i<a.count;i++){const p=new T.Vector3().fromBufferAttribute(a,i);assert.ok(world.colliders.some(c=>Math.hypot(p.x-c.x,p.z-c.z)<=c.r+1e-7),'solid log footprint covered by existing circle contract');}
 world.spawn.x=999;assert.equal(AUSTRALIA_SPAWN.x,0);world.dispose();
});
test('entry, quiet approach, circling and return remain walkable; actual solid LOS reaches the complete lane',()=>{
 const{world,habitat}=fixture(),los=createCaptureVisibility(world.captureOccluders),s=habitat.rainbowStagSupports[0];let min=Infinity,maxReach=0;
 for(let n=1;n<AUSTRALIA_ROUTE.length;n++)for(let k=0;k<=40;k++){const a=AUSTRALIA_ROUTE[n-1],b=AUSTRALIA_ROUTE[n],p={x:a.x+(b.x-a.x)*k/40,z:a.z+(b.z-a.z)*k/40};assert.ok(Math.abs(p.x)<world.bounds&&Math.abs(p.z)<world.bounds);for(const c of world.colliders){const gap=clearance(p,c);min=Math.min(min,gap);assert.ok(gap>0);}}
 for(const d of[L.min,0,L.max])for(const height of[1.28,1.65]){const target={x:s.home.x+d,y:s.home.y,z:s.home.z},eye={...RAINBOW_APPROACH,y:height},reach=Math.hypot(eye.x-target.x,eye.y-target.y,eye.z-target.z);maxReach=Math.max(maxReach,reach);assert.ok(reach<2.6);assert.equal(los(eye,target),true);}
 assert.equal(los({...AUSTRALIA_SPAWN,y:1.65},s.home),true);assert.equal(los({x:0,y:.25,z:2},{x:0,y:.25,z:-2}),false,'log is a real occluder, not transparent scenery');console.log(JSON.stringify({minimumRouteClearance:min,maxCaptureReach:maxReach}));world.dispose();
});
test('horizontal lane home is reconstructed from real triangles, quaternion and projected foot envelope stay on the top',()=>{
 const{world,habitat}=fixture(),s=habitat.rainbowStagSupports[0],q=new T.Quaternion(s.orientation.x,s.orientation.y,s.orientation.z,s.orientation.w),ray=new T.Raycaster();assert.ok(Math.abs(q.length()-1)<1e-12);assert.ok(new T.Vector3(0,0,1).applyQuaternion(q).distanceTo(new T.Vector3(1,0,0))<1e-12);assert.deepEqual(s.retreatBounds,{min:-.34,max:.34});
 let rays=0;for(const d of[L.min,-.17,0,.17,L.max])for(const side of[-1,1])for(const z of[-.095,0,.09]){const foot=new T.Vector3(side*.095,-.05,z).applyQuaternion(q).add(new T.Vector3(s.home.x+d,s.home.y,s.home.z));ray.set(foot.clone().add(new T.Vector3(0,.03,0)),new T.Vector3(0,-1,0));ray.far=.06;const hit=ray.intersectObject(world.rainbowLog)[0];assert.ok(hit);assert.ok(hit.face.normal.y>.999999);assert.ok(hit.point.distanceTo(foot)<1e-7);rays++;}
 const row=habitat.homes[0];assert.equal(row[0],'rainbowstag');assert.ok(Math.abs(world.heightAt(row[1],row[2])+row[3]-s.home.y)<1e-12);assert.equal(rays,30);world.dispose();
});
test('wrong worlds are rejected and idempotent disposal owns only its resources and scene atmosphere',()=>{
 const scene=new T.Scene(),sentinel=new T.Group(),background=new T.Color('#123456'),fog=new T.Fog('#234567',2,9);scene.add(sentinel);scene.background=background;scene.fog=fog;const world=createAustraliaWorld(scene),resources=new Set(world.meshes.flatMap(m=>[m.geometry,m.material])),events=new Map([...resources].map(r=>[r,0]));for(const r of resources)r.addEventListener('dispose',()=>events.set(r,events.get(r)+1));
 assert.throws(()=>createAustraliaWorld(null),TypeError);assert.throws(()=>createRainbowStagHabitat({...world,regionId:'understory'},scene),TypeError);assert.throws(()=>createRainbowStagHabitat(world,new T.Scene()),TypeError);
 const habitat=createRainbowStagHabitat(world,scene);habitat.dispose();assert.ok(scene.getObjectById(world.rainbowLog.id));world.dispose();world.dispose();assert.equal(scene.children.length,1);assert.equal(scene.children[0],sentinel);assert.equal(scene.background,background);assert.equal(scene.fog,fog);assert.ok([...events.values()].every(n=>n===1));
 const next=createAustraliaWorld(scene),replacement=new T.Color('#abcdef');scene.background=replacement;next.dispose();assert.equal(scene.background,replacement,'do not overwrite later atmosphere ownership');
});
