/** Actual CPU mesh clearance on the existing night tree. This does not certify
 * rendered flight, biological motion, sound or physical browser input. */
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import{createHash}from'node:crypto';
const sandbox={console};vm.runInNewContext(fs.readFileSync(new URL('../assets/vendor/three.min.js',import.meta.url),'utf8'),sandbox);const T=sandbox.THREE;globalThis.window={THREE:T};
const{createNightWorld}=await import('../src/world-night.js'),{createRhinoHabitat}=await import('../src/rhino-habitat.js'),{createStagHabitat}=await import('../src/stag-habitat.js'),{createGiantStagHabitat}=await import('../src/giant-stag-habitat.js'),{createRhinoFlightStudy}=await import('../src/rhino-flight-study.js'),{createRhinoFlightModel,updateRhinoFlightModel}=await import('../src/rhino-flight-rig.js');
const SCALE=1.15,TOL=2e-6;
function triangles(mesh,matrix,faces=true){const a=mesh.geometry.attributes.position,index=mesh.geometry.index,points=Array.from({length:a.count},(_,i)=>new T.Vector3().fromBufferAttribute(a,i).applyMatrix4(matrix)),out=[];if(faces)for(let i=0;i<(index?.count??a.count);i+=3){const p=[0,1,2].map(j=>points[index?index.getX(i+j):i+j]),triangle=new T.Triangle(...p);if(triangle.getArea()>1e-15)out.push({triangle,box:new T.Box3().setFromPoints(p)});}return{points,triangles:out,box:new T.Box3().setFromPoints(points)};}
function signature(root){const h=createHash('sha256');root.updateMatrixWorld(true);root.traverse(m=>{h.update(m.name);h.update(JSON.stringify(m.matrixWorld.toArray()));for(const key of Object.keys(m.geometry?.attributes||{}).sort()){const a=m.geometry.attributes[key].array;h.update(key);h.update(Buffer.from(a.buffer,a.byteOffset,a.byteLength));}if(m.instanceMatrix)h.update(Buffer.from(m.instanceMatrix.array.buffer));});return h.digest('hex');}
function buildWorld(){const scene=new T.Scene(),world=createNightWorld(scene),rhino=createRhinoHabitat(world,scene),stag=createStagHabitat(world,scene),giant=createGiantStagHabitat(world,scene);scene.updateMatrixWorld(true);const rows=[];scene.traverse(mesh=>{if(!mesh.isMesh)return;for(let i=0;i<(mesh.isInstancedMesh?mesh.count:1);i++){const matrix=mesh.matrixWorld.clone();if(mesh.isInstancedMesh){const instance=new T.Matrix4();mesh.getMatrixAt(i,instance);matrix.multiply(instance);}const data=triangles(mesh,matrix);rows.push({mesh:mesh.name,instance:mesh.isInstancedMesh?i:null,...data});}});return{scene,world,rhino,stag,giant,rows};}
function crossing(a,b,triangle){const delta=b.clone().sub(a),length=delta.length();if(length<1e-10)return false;const hit=new T.Ray(a,delta.divideScalar(length)).intersectTriangle(triangle.a,triangle.b,triangle.c,false,new T.Vector3());return hit&&hit.distanceTo(a)>TOL&&hit.distanceTo(b)>TOL;}
function intersects(a,b){for(const triangle of[a,b]){const other=triangle===a?b:a;for(const[u,v]of[[triangle.a,triangle.b],[triangle.b,triangle.c],[triangle.c,triangle.a]])if(crossing(u,v,other))return true;}return false;}
function skin(root){const out=[];root.traverse(m=>{if(m.isMesh)out.push(...triangles(m,m.matrixWorld).points);});return out;}

test('lane ends, all three seed sites and retreat interior clear both flight sides and land six feet on the same branch at maximum display scale',()=>{
 const{scene,world,rhino,rows:allRows}=buildWorld(),worldBefore=signature(scene),surface=rhino.rhinoSupports[0].home.y-.05,wood=rhino.captureOccluders[0],ray=new T.Raycaster(),metrics={clips:0,frames:0,skinSamples:0,exactTriangleTests:0,maxSupportGap:0,maxSkinStep:0,minAboveTerrain:Infinity,minCrownGap:Infinity,captureFreezeChecks:0};
 const region=new T.Box3(new T.Vector3(-4.55,surface-.01,-.6),new T.Vector3(-1.90,surface+1.35,4.6)),rows=allRows.filter(r=>r.box.intersectsBox(region)).map(r=>({...r,triangles:r.triangles.filter(t=>t.box.intersectsBox(region))}));
 const crown=allRows.find(r=>r.mesh==='rhino-living-tree-crown');
 // All three seed sites, the two physical lane ends, and one retreat interior.
 // Intermediate roots translate the same path through an independently clear
 // east-side slab; no branch/root/crown geometry is modified for this test.
 for(const x of[-4.10,-3.93,-3.79,-3.65,-3.51,-3.36])for(const side of[-1,1]){
  const home={x,y:surface+.05*SCALE,z:2},study=createRhinoFlightStudy({position:home,heading:Math.PI/2,scale:SCALE,motionSeed:0,retreatBounds:{min:-4.1-x,max:-3.36-x}}),model=createRhinoFlightModel();model.scale.setScalar(SCALE);const source={x:x+.65,z:2-side*.7};let flightOrigin=null,seenAir=false,seenLanding=false,completed=false,previous=null,frame=0;
  const label=`x${x}/side${side}`;
  while(frame++<1200){
   const prior=study.state;if(!flightOrigin)study.disturb(source);study.update(1/120);const state=study.state;
   if(state.phase==='preparing-flight'&&!flightOrigin)flightOrigin={...state.position};
   updateRhinoFlightModel(model,state);model.updateMatrixWorld(true);const points=[];
   model.traverse(part=>{if(!part.isMesh)return;const data=triangles(part,part.matrixWorld,false);points.push(...data.points);let faces=null;
    for(const obstacle of rows){if(!data.box.intersectsBox(obstacle.box))continue;for(const wall of obstacle.triangles){if(!data.box.intersectsBox(wall.box))continue;
     // The real flat branch top is the supporting contact. If every skin vertex
     // is above that plane and the wood triangle is below, contact is not a cut.
     if(wall.box.max.y<=surface+TOL&&data.box.min.y>=surface-TOL)continue;
     faces??=triangles(part,part.matrixWorld).triangles;for(const face of faces){if(!face.box.intersectsBox(wall.box))continue;metrics.exactTriangleTests++;assert.equal(!!intersects(face.triangle,wall.triangle),false,`${label} ${state.phase} time=${state.time}: ${part.name} cuts ${obstacle.mesh}`);}
    }}
   });
   for(const p of points){assert.ok([p.x,p.y,p.z].every(Number.isFinite));assert.ok(region.containsPoint(p),`${label} skin exits broadphase region`);if(p.x>=-4.9&&p.x<=-3.1&&Math.abs(p.z-2)<=.30*Math.sin(Math.PI/8)-TOL)assert.ok(p.y>=surface-TOL,`${label} skin inside the actual flat-topped branch`);const terrain=world.heightAt(p.x,p.z);metrics.minAboveTerrain=Math.min(metrics.minAboveTerrain,p.y-terrain);assert.ok(p.y>=terrain-TOL,`${label} skin below terrain`);metrics.skinSamples++;}
   if(previous)for(let i=0;i<points.length;i++)metrics.maxSkinStep=Math.max(metrics.maxSkinStep,points[i].distanceTo(previous[i]));previous=points;
   metrics.minCrownGap=Math.min(metrics.minCrownGap,crown.box.min.y-Math.max(...points.map(p=>p.y)));
   if(state.phase==='preparing-flight'||state.phase==='landing'){
    assert.ok(Math.hypot(state.position.x-flightOrigin.x,state.position.y-flightOrigin.y,state.position.z-flightOrigin.z)<1e-8,'wing preparation/landing stays on the actual departure branch');
    let supported=0;for(const leg of model.userData.legs){const f=leg.mesh.userData.foot,p=new T.Vector3(f.x,f.y,f.z).applyMatrix4(leg.mesh.matrixWorld),actual=triangles(leg.mesh,leg.mesh.matrixWorld).points;assert.ok(Math.min(...actual.map(q=>q.distanceTo(p)))<TOL,'foot endpoint on real skin');ray.set(p.clone().add(new T.Vector3(0,.05,0)),new T.Vector3(0,-1,0));ray.far=.1;const hit=ray.intersectObject(wood,false)[0];assert.ok(hit,`${label} no actual branch under foot`);const gap=Math.abs(hit.point.y-p.y);metrics.maxSupportGap=Math.max(metrics.maxSupportGap,gap);if(gap<TOL)supported++;}
    assert.equal(supported,6,`${label} ${state.phase} does not have six supported feet`);
   }
   seenAir||=state.phase==='flying'&&state.position.y>home.y+.30;seenLanding||=state.phase==='landing';
   if(metrics.clips===0&&state.phase==='flying'&&state.position.y>home.y+.45&&metrics.captureFreezeChecks===0){assert.equal(study.capture(),true);const frozen=study.state;updateRhinoFlightModel(model,frozen);const hash=signature(model);for(let n=0;n<5;n++){study.update(.1);assert.deepEqual(study.state,frozen);updateRhinoFlightModel(model,study.state);assert.equal(signature(model),hash);metrics.captureFreezeChecks++;}assert.equal(study.release(),true);const released=study.state;assert.deepEqual(released.position,frozen.position);assert.equal(released.heading,frozen.heading);}
   metrics.frames++;if(seenLanding&&!['preparing-flight','flying','landing'].includes(state.phase)){assert.deepEqual(state.position,flightOrigin,'return is the same real departure support, not a reset/teleport');completed=true;break;}
  }
  assert.ok(seenAir&&seenLanding&&completed,label+' did not complete one bounded flight');model.userData.dispose();metrics.clips++;console.log('Clearance clip:',label,'frames',frame);
 }
 assert.equal(metrics.clips,12);assert.ok(metrics.maxSkinStep<.06,'no per-120Hz-frame geometry jump');assert.equal(signature(scene),worldBefore,'existing habitat/root/branch/crown geometry untouched');console.log('Rhino maximum-scale CPU flight clearance:',JSON.stringify(metrics));
});
