/** Supported motion and local hood rays. CPU-only, not rendered visibility or
 * a measured natural retreat/capture-distance claim. */
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import {createHash}from'node:crypto';
import {createGiantStagStudy,GIANT_STAG_MOTION as M} from '../src/giant-stag-study.js';
import {GIANT_STAG_DIMENSIONS as D} from '../src/giant-stag-kinematics.js';
import {GIANT_STAG_RETREAT_BOUNDS as LIMITS,GIANT_STAG_ORIGIN as ORIGIN,GIANT_STAG_COVER as COVER} from '../src/giant-stag-layout.js';
const position={x:-5.75,y:.9,z:2},heading=-Math.PI/2,front={x:-7.95,y:1.65,z:2},back={x:-4,y:1.65,z:2};
const make=options=>createGiantStagStudy({position,heading,retreatBounds:LIMITS,...options}),near=(a,b,e=1e-8)=>assert.ok(Math.abs(a-b)<e,`${a} != ${b}`);
function step(s,seconds,threat=null,dt=.01){for(let n=0;n<Math.round(seconds/dt);n++){if(threat)s.disturb(threat);s.update(dt);}}

test('fixed-individual support input is bounded, detached, finite and uses the agreed root/gait contract',()=>{
 const s=make(),first=s.state;assert.equal(first.id,'giantstag-study-1');assert.equal(first.phase,'resting');assert.equal(first.jawOpen,D.restJawOpen);assert.equal(D.rootAboveSupport,.045);assert.equal(D.cycleDistance,.04);s.state.position.x=999;assert.deepEqual(s.state,first);
 for(const dt of[0,-1,NaN,Infinity,undefined])s.update(dt);assert.deepEqual(s.state,first);for(const p of[null,{}, {x:NaN,z:2},{x:1e10,z:2}])assert.equal(s.disturb(p),false);
 for(const p of[null,{x:0,z:0},{x:0,y:Infinity,z:0},{x:0,y:0,z:0,extra:1}])assert.throws(()=>make({position:p}),TypeError);
 for(const b of[undefined,null,{}, {min:.1,max:.2},{min:-.3,max:-.1},{min:-4,max:.2},{min:-.2,max:0,extra:1}])assert.throws(()=>make({retreatBounds:b}),TypeError);
});

test('visible preparation precedes a short accelerated retreat away from either threat, never beyond the lane',()=>{
 for(const threat of[front,back]){
  const s=make(),sign=threat===front?1:-1;assert.equal(s.disturb(threat),true);let warningSeconds=0,retreated=false,previous=s.state,peak=0;
  for(let n=0;n<700;n++){s.disturb(threat);s.update(.01);const now=s.state;if(previous.phase==='warning')warningSeconds+=.01;if(now.phase==='retreating'){retreated=true;assert.ok(warningSeconds>=M.warningSeconds-1e-8);assert.ok(sign*(now.position.x-previous.position.x)>=-1e-10);}assert.ok(now.position.x>=position.x-LIMITS.max-1e-9&&now.position.x<=position.x-LIMITS.min+1e-9);assert.ok(Math.abs(now.position.x-previous.position.x)<=M.retreatSpeed*.01+1e-9);assert.equal(now.position.y,position.y);assert.equal(now.position.z,position.z);assert.ok(now.warningBlend>=0&&now.warningBlend<=1);peak=Math.max(peak,Math.abs(now.walkSpeed));previous=now;}
  assert.ok(retreated&&peak>.09&&peak<=M.retreatSpeed+1e-9);assert.ok(sign*(s.state.position.x-position.x)>.15);assert.equal(s.state.phase,'cornered');near(s.state.walkPhase/Math.PI,Math.round(s.state.walkPhase/Math.PI));
 }
});

test('turning the threat opens the other supported direction; removal permits a continuous return instead of permanent hiding',()=>{
 const s=make();step(s,7,front);near(s.state.position.x,-5.49);step(s,3,back);assert.ok(s.state.position.x<-5.52);let previous=s.state;for(let n=0;n<2500;n++){s.update(.01);assert.ok(Math.abs(s.state.position.x-previous.position.x)<=M.retreatSpeed*.01+1e-9);previous=s.state;}assert.ok(s.state.position.x>=-5.87-1e-9&&s.state.position.x<=-5.75+1e-9);assert.ok(['resting','walking'].includes(s.state.phase));
});

test('moving reactions brake on a half-step, and capture/release preserves the exact warning, walk, retreat or corner pose',()=>{
 for(const phase of['walking','warning','retreating','cornered']){
  const s=make();if(phase!=='walking')s.disturb(front);let n=0;while(s.state.phase!==phase&&n++<2500){if(phase==='cornered')s.disturb(front);s.update(.01);}assert.ok(n<2500);const old=s.state;assert.equal(s.capture(),true);const frozen=s.state;for(let k=0;k<100;k++){assert.equal(s.disturb(back),false);s.update(.1);}assert.deepEqual(s.state,frozen);assert.equal(s.release(),true);assert.deepEqual(s.state.position,old.position);assert.equal(s.state.phase,old.phase);near(s.state.jawOpen,old.jawOpen);s.update(.01);assert.ok(Math.abs(s.state.position.x-old.position.x)<=M.retreatSpeed*.01+1e-9);
 }
 const s=make();while(s.state.phase!=='walking'||Math.abs(s.state.walkSpeed)<.019)s.update(.01);s.update(.07);const before=s.state;s.disturb(front);assert.deepEqual(s.state.position,before.position);near(s.state.walkSpeed,before.walkSpeed);let n=0;while(s.state.phase!=='warning'&&n++<150)s.update(.01);assert.ok(n<150);near(s.state.walkPhase/Math.PI,Math.round(s.state.walkPhase/Math.PI));near(s.state.walkSpeed,0);
});

test('fixed timing is reproducible under dt subdivision, giant steps are capped, and reset does not use random draws',t=>{
 t.mock.method(Math,'random',()=>{throw Error('motion cannot draw per-frame randomness');});const a=make(),b=make();a.disturb(front);b.disturb(front);for(let n=0;n<150;n++){a.update(.1);for(let k=0;k<10;k++)b.update(.01);near(a.state.position.x,b.state.position.x);near(a.state.warningBlend,b.state.warningBlend);assert.equal(a.state.phase,b.state.phase);}const c=make(),d=make();c.update(1e300);d.update(.1);assert.deepEqual(c.state,d.state);a.reset();assert.deepEqual(a.state,make().state);
});

test('the additive branch connects to the existing tree; real hood blocks a retreated front ray but leaves a side retry and supported skin',async()=>{
 const sandbox={console};vm.runInNewContext(fs.readFileSync(new URL('../assets/vendor/three.min.js',import.meta.url),'utf8'),sandbox);const T=sandbox.THREE;globalThis.window={THREE:T};
 const {createNightWorld}=await import('../src/world-night.js'),{createRhinoHabitat}=await import('../src/rhino-habitat.js'),{createStagHabitat}=await import('../src/stag-habitat.js'),{createGiantStagHabitat}=await import('../src/giant-stag-habitat.js'),{createCaptureVisibility}=await import('../src/capture-visibility.js'),{createGiantStagModel,updateGiantStagModel}=await import('../src/giant-stag-model.js');
 const scene=new T.Scene(),w=createNightWorld(scene),r=createRhinoHabitat(w,scene),st=createStagHabitat(w,scene),old=scene.children.filter(m=>m.isMesh),hash=m=>{const h=createHash('sha256');for(const[k,v]of Object.entries(m.geometry.attributes))h.update(k).update(Buffer.from(v.array.buffer,v.array.byteOffset,v.array.byteLength));if(m.geometry.index)h.update(Buffer.from(m.geometry.index.array.buffer));return h.digest('hex');},before=old.map(hash),colliders=JSON.stringify(w.colliders),added=createGiantStagHabitat(w,scene);scene.updateMatrixWorld(true);
 assert.deepEqual(old.map(hash),before);assert.equal(JSON.stringify(w.colliders),colliders);assert.equal(added.stats.addedMeshes,2);assert.equal(added.stats.addedTriangles,56);assert.equal(added.stats.addedTextures,0);assert.throws(()=>createGiantStagHabitat(w,new T.Scene()),/Existing/);
 const support=added.giantStagSupports[0],home=support.home,top=home.y-D.rootAboveSupport,los=createCaptureVisibility([...w.captureOccluders,...r.captureOccluders,...st.captureOccluders,...added.captureOccluders]);assert.deepEqual(support.retreatBounds,LIMITS);assert.equal(support.heading,ORIGIN.heading);
 const fromFront={x:-7.95,y:w.heightAt(-7.95,2)+1.65,z:2},fromSide={x:-5.55,y:w.heightAt(-5.55,-.3)+1.65,z:-.3};
 assert.equal(los(fromFront,home),true);for(const x of[-5.55,-5.49]){const target={x,y:home.y,z:2};assert.ok(Math.hypot(fromFront.x-x,fromFront.y-home.y)<2.6);assert.equal(los(fromFront,target),false);assert.equal(los(fromSide,target),true);}
 for(const p of[fromFront,fromSide])assert.ok([...w.colliders,...r.colliders,...st.colliders,...added.colliders].every(c=>Math.hypot(c.x-p.x,c.z-p.z)>c.r+.28),'legal approach does not stand inside wood');
 const model=createGiantStagModel(),ray=new T.Raycaster(),v=new T.Vector3();scene.add(model);let rays=0;
 for(const d of[-.26,-.20,-.15,-.08,0,.013,.06,.12,.18])for(const jawOpen of[0,.65,1]){
  updateGiantStagModel(model,{position:{x:home.x-d,y:home.y,z:home.z},heading:ORIGIN.heading,walkPhase:d/D.cycleDistance*Math.PI*2,walkSpeed:.02,jawOpen});model.updateMatrixWorld(true);
  model.traverse(m=>{if(!m.isMesh)return;const a=m.geometry.attributes.position;for(let n=0;n<a.count;n++){v.fromBufferAttribute(a,n).applyMatrix4(m.matrixWorld);assert.ok(v.y>=top-2e-6&&v.y<top+COVER.bottomAboveSupport-.01,'real skin stays above support and below bark hood');assert.ok(v.z<COVER.wallInnerZ-.02,'real skin does not cross the side wall');}});
  for(const leg of model.userData.legs){const foot=new T.Vector3(leg.foot.x,leg.foot.y,leg.foot.z).applyMatrix4(leg.mesh.matrixWorld);if(Math.abs(foot.y-top)>1e-6)continue;const a=leg.mesh.geometry.attributes.position;let gap=Infinity;for(let k=0;k<a.count;k++)gap=Math.min(gap,v.fromBufferAttribute(a,k).applyMatrix4(leg.mesh.matrixWorld).distanceTo(foot));assert.ok(gap<2e-6);ray.set(foot.clone().add(new T.Vector3(0,.03,0)),new T.Vector3(0,-1,0));ray.far=.06;const hit=ray.intersectObject(added.captureOccluders[0],false)[0];assert.ok(hit);near(hit.point.y,foot.y,2e-6);rays++;}
 }
 assert.ok(rays>=100);model.userData.dispose();const resources=new Set();scene.traverse(n=>{if(n.geometry)resources.add(n.geometry);for(const m of n.material?(Array.isArray(n.material)?n.material:[n.material]):[])resources.add(m);});for(const item of resources)item.dispose();
});
