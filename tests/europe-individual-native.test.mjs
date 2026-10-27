import {inverseGiraffeStagModel} from './fixtures/giraffe-stag-model-prior.mjs';
/** 048 bounded native support/scale/inspection checks. No battle matrix or GPU claim. */
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import {createHash} from 'node:crypto';
import {createEuropeStagStudy as create} from '../src/europe-stag-study.js';
import {EUROPE_STAG_DIMENSIONS as D,sampleEuropeStagPose} from '../src/europe-stag-kinematics.js';
const hash=s=>createHash('sha256').update(s).digest('hex'),normalize=s=>s.replace(/(from\s*['"]\.\/[^'"?\n]+)(?:\?[^'"\n]*)?(['"])/g,'$1$2');
const read=f=>normalize(fs.readFileSync(new URL('../src/'+f,import.meta.url),'utf8'));
function replaceOnce(source,added,old){assert.equal(source.split(added).length-1,1,'one exact scaled-Europe edit');return source.replace(added,old);}
function oldStudy(){let s=read('europe-stag-study.js');for(const [added,old]of[
 ['createEuropeStagStudy({scale=1,position={x:0,y:D.rootAboveSupport*scale,z:0}','createEuropeStagStudy({position={x:0,y:D.rootAboveSupport,z:0}'],
 [' if(!Number.isFinite(scale)||scale<1||scale>1.15||!record(position,',' if(!record(position,'],
 ['position:{x:0,y:D.rootAboveSupport*scale,z:0},heading:Math.PI/2,scale,','position:{x:0,y:D.rootAboveSupport,z:0},heading:Math.PI/2,scale:1,'],
 ['d=s.walkPhase/(2*Math.PI)*D.cycleDistance*scale;','d=s.walkPhase/(2*Math.PI)*D.cycleDistance;']
 ])s=replaceOnce(s,added,old);assert.equal(hash(s),'54950febb6b028ba93f3b97de76b20c36f444749586ce0c61eaa979961f1a655');return s;}
const oldSource=oldStudy(),sourceURL=new URL('../src/europe-stag-study.js',import.meta.url),rewritten=oldSource.replace(/from\s*(['"])(\.\/[^'"]+)\1/g,(_a,q,p)=>`from ${q}${new URL(p,sourceURL).href}${q}`),{createEuropeStagStudy:oldCreate}=await import(`data:text/javascript;base64,${Buffer.from(rewritten).toString('base64')}`);
const box={};vm.runInNewContext(fs.readFileSync(new URL('../assets/vendor/three.min.js',import.meta.url),'utf8'),box);const T=box.THREE;globalThis.window={THREE:T};const context=new Proxy({createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{})});globalThis.document={createElement:()=>({getContext:()=>context})};
const {createInsectModel,updateInsectModel}=await import('../src/insect-models.js'),{createEuropeWorld}=await import('../src/world-europe.js'),{createEuropeStagHabitat}=await import('../src/europe-stag-habitat.js'),{EUROPE_STAG_LANE:L,EUROPE_STAG_SITES:SITES}=await import('../src/europe-stag-layout.js');
const V=p=>new T.Vector3(p.x,p.y,p.z),Q=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),Math.PI/2),orientation={x:Q.x,y:Q.y,z:Q.z,w:Q.w};
const fixture=()=>{const scene=new T.Scene(),world=createEuropeWorld(scene),habitat=createEuropeStagHabitat(world,scene);return {scene,world,habitat};};
const skin=root=>{const out=[];root.updateMatrixWorld(true);root.traverse(m=>{if(m.isMesh){const a=m.geometry.attributes.position;for(let i=0;i<a.count;i++)out.push(new T.Vector3().fromBufferAttribute(a,i).applyMatrix4(m.matrixWorld));}});return out;};

test('literal inverses preserve old study, other factory species, and old habitat; shared branch and native anatomy unchanged',()=>{
 oldStudy();let models=replaceOnce(inverseGiraffeStagModel(read('insect-models.js')),"const eligible=['hercules','rhino','stag','metallifer','giantstag','atlas','manticora','europestag'].includes(species);","const eligible=['hercules','rhino','stag','metallifer','giantstag','atlas','manticora'].includes(species);");assert.equal(hash(models),'15cb3660668fdcf349a8802b1f8d3df060eda65aac6cb87eb8bbda677d11388f');
 let habitat=replaceOnce(read('europe-stag-habitat.js'),' // Native foot X +/-.095, Z[-.090,.085], gait +/-.010, at maximum\n // display factor 1.15. The physical world lane/log do not scale or move.\n const footEnvelope = .105 * 1.15;\n',' // Native foot X +/-.095, Z[-.090,.085], gait +/-.010. A conservative square\n // envelope includes both ends and the centre of the finite horizontal lane.\n');habitat=replaceOnce(habitat,'for(const x of[-footEnvelope,0,footEnvelope])for(const z of[-footEnvelope,0,footEnvelope])','for(const x of[-.105,0,.105])for(const z of[-.105,0,.105])');assert.equal(hash(habitat),'263ba356295b0e92cd769fa94720913d80c38ab7355d5e91261e14fd0310dd00');
 assert.equal(hash(read('branch-retreat-study.js')),'c193f8de36e93a2af5b89c1bbe6d6d263b99258ce14a859c91f20b0d223516a7');
 assert.equal(hash(read('europe-stag-model.js')),'2e7e5aae1f2cb6d7ce0b8f7b4f978f4c5bb0002ef6c4667dfe7594b3025c7fea');assert.equal(hash(read('europe-stag-kinematics.js')),'55f094b546dc8a755bcdfe1264b8791185d1e51376be7bc2442b90f55ca19b0d');
});

test('omitted/default scale reproduces every old state through clocks, warning, retreat, held/release/reset and seed choices',()=>{
 for(const dt of[1/30,1/120,.1])for(const seed of[undefined,0,0xffffffff]){
  const opts=seed===undefined?{}:{motionSeed:seed},a=create(opts),b=oldCreate(opts);assert.deepEqual(a.state,b.state);
  for(let n=0;n<Math.ceil(18/dt);n++){
   if(n===Math.floor(2/dt)||n===Math.floor(10/dt))for(const s of[a,b])s.disturb({x:0,z:n<Math.floor(5/dt)?2:-2});
   if(n===Math.floor(3/dt))for(const s of[a,b])s.capture();if(n===Math.floor(4/dt))for(const s of[a,b])s.release();
   a.update(dt);b.update(dt);assert.deepEqual(a.state,b.state);
  }
  a.reset();b.reset();assert.deepEqual(a.state,b.state);assert.deepEqual(create({...opts,scale:1}).state,b.state);
 }
 for(const scale of[null,'1',NaN,Infinity,.999,1.15001])assert.throws(()=>create({scale}),TypeError);
 assert.equal(create({scale:1.15}).state.position.y,.055*1.15);assert.deepEqual(create().state,create({scale:1,motionSeed:1729}).state);
});

test('factory Europe display eligibility is finite and fixed; geometry remains original and inspection animation cannot rescale it',()=>{
 for(const n of[1000,1075,1150]){const field=createInsectModel('europestag',{sizePermille:n}),inspection=createInsectModel('europestag',{inspection:true,sizePermille:n});assert.equal(field.scale.x,n/1000);assert.equal(field.userData.individualScale,n/1000);assert.equal(inspection.scale.x,n/1000);
  const before=inspection.scale.clone();updateInsectModel(inspection,{species:'europestag',x:9,y:9,z:9,walkPhase:2},12);assert.deepEqual(inspection.scale,before);assert.deepEqual(field.userData.bodyMesh.geometry.attributes.position.array,inspection.userData.bodyMesh.geometry.attributes.position.array);field.userData.dispose();inspection.userData.dispose();}
 for(const sizePermille of[null,999,1151,1000.5,NaN,'1150']){const m=createInsectModel('europestag',{sizePermille});assert.equal(m.scale.x,1);m.userData.dispose();}
 for(const kind of['rainbowstag','wetapunga']){const m=createInsectModel(kind,{sizePermille:1150});assert.equal(m.scale.x,1);m.userData.dispose();}
});

test('actual habitat certifies max-size envelope on unchanged log; native feet/bones support all three sizes, sites and lane extremes',()=>{
 const f=fixture(),ray=new T.Raycaster(),metrics={poses:0,rays:0,maxGap:0,maxBoneError:0,minSkinY:Infinity,minAcrossMargin:Infinity};assert.equal(f.habitat.stats.footEnvelopeRays,27);assert.equal(f.habitat.stats.addedMeshes,0);assert.deepEqual(SITES,[-.12,0,.12]);
 for(const n of[1000,1075,1150]){const factor=n/1000,m=createInsectModel('europestag',{sizePermille:n});for(const x of[L.min,...SITES,L.max])for(const walkPhase of[0,Math.PI/2,Math.PI,Math.PI*1.5]){
  updateInsectModel(m,{species:'europestag',x,y:L.surface.y+D.rootAboveSupport*factor,z:L.surface.z,orientation,walkPhase,jawOpen:.25});m.updateMatrixWorld(true);metrics.poses++;let supported=0;
  for(const l of m.userData.legs){const a=l.mesh.geometry.attributes.position,p=[12,13,27].map(i=>new T.Vector3().fromBufferAttribute(a,i).applyMatrix4(l.mesh.matrixWorld));for(let i=0;i<2;i++)metrics.maxBoneError=Math.max(metrics.maxBoneError,Math.abs(p[i].distanceTo(p[i+1])-[D.upperLegLength,D.lowerLegLength][i]*factor));
   const foot=p[2];ray.set(foot.clone().add(new T.Vector3(0,.1,0)),new T.Vector3(0,-1,0));ray.far=.2;const hit=ray.intersectObject(f.world.europeStagLog)[0];metrics.rays++;assert.ok(hit?.face);assert.ok(hit.face.normal.y>.99999);if(l.contact){supported++;metrics.maxGap=Math.max(metrics.maxGap,Math.abs(foot.y-hit.point.y));}metrics.minAcrossMargin=Math.min(metrics.minAcrossMargin,.34-Math.abs(foot.z));
  }
  if(walkPhase===0||walkPhase===Math.PI)assert.equal(supported,6);for(const p of skin(m))metrics.minSkinY=Math.min(metrics.minSkinY,p.y-L.surface.y);
 }m.userData.dispose();}
 assert.equal(metrics.poses,60);assert.equal(metrics.rays,360);assert.ok(metrics.maxGap<2e-7&&metrics.maxBoneError<2e-7);assert.ok(metrics.minSkinY>-2e-7);assert.ok(metrics.minAcrossMargin>.15);console.log('048 native envelope',JSON.stringify(metrics));f.world.europeStagLog.scale.z=.19/.34;assert.throws(()=>createEuropeStagHabitat(f.world,f.scene),/foot envelope/,'expanded guard rejects a top that only the old envelope could fit');f.world.europeStagLog.scale.z=1;assert.equal(createEuropeStagHabitat(f.world,f.scene).stats.footEnvelopeRays,27);f.world.dispose();
});

test('actual scaled study and mesh keep stance feet planted in fixed world lane; stopped halfsteps and capture pose remain supported',()=>{
 let frames=0,nativeSamples=0,maxSlip=0;
 for(const factor of[1,1.075,1.15])for(const x of SITES){
  const s=create({scale:factor,motionSeed:123,position:{x,y:L.surface.y+D.rootAboveSupport*factor,z:L.surface.z},orientation,retreatBounds:{min:L.min-x,max:L.max-x}}),m=createInsectModel('europestag',{sizePermille:Math.round(factor*1000)});let previous=null;
  for(let n=0;n<12*60;n++){
   if(n===60||n===6*60)s.disturb({x:n===60?2:-2,z:.08});s.update(1/60);const state=s.state,p=sampleEuropeStagPose(state);frames++;assert.ok(state.position.x>=L.min-1e-10&&state.position.x<=L.max+1e-10);assert.equal(state.position.y,L.surface.y+D.rootAboveSupport*factor);
   const feet=p.legs.map(l=>({contact:l.contact,p:V(l.foot).multiplyScalar(factor).applyQuaternion(Q).add(V(state.position))}));if(previous)for(let i=0;i<6;i++)if(previous[i].contact&&feet[i].contact)maxSlip=Math.max(maxSlip,previous[i].p.distanceTo(feet[i].p));previous=feet;
   if(n%30===0){updateInsectModel(m,{...state,x:state.position.x,y:state.position.y,z:state.position.z});nativeSamples++;m.updateMatrixWorld(true);for(const [i,l]of m.userData.legs.entries())assert.ok(new T.Vector3().fromBufferAttribute(l.mesh.geometry.attributes.position,27).applyMatrix4(l.mesh.matrixWorld).distanceTo(feet[i].p)<2e-8);}
   if(['resting','warning','settling','cornered'].includes(state.phase))assert.equal(feet.filter(l=>l.contact).length,6);
   if(n===90){s.capture();const captured=s.state;for(let t=0;t<10;t++)s.update(.1);assert.deepEqual(s.state,captured);s.release();assert.deepEqual(s.state.position,captured.position);assert.equal(s.state.walkPhase,captured.walkPhase);}
  }m.userData.dispose();
 }
 assert.ok(maxSlip<2e-10);console.log('048 actual scale gait',JSON.stringify({frames,nativeSamples,maxSlip}));
});

test('bounded max-size inspector projection fits existing camera with factor-aware framing; native model preserves caller transforms',()=>{
 const m=createInsectModel('europestag',{inspection:true,sizePermille:1150});let poses=0,maxX=0,maxY=0;
 for(const [w,h]of[[320,720],[375,812],[1280,720]]){const camera=new T.PerspectiveCamera(42,w/h,.05,20);camera.position.set(0,1.35,3.4);camera.lookAt(0,0,0);camera.updateMatrixWorld(true);m.position.set(w<=760?0:-.7,w<=760?.5:0,0);m.scale.setScalar(Math.min(3.2*m.userData.individualScale,w/h*4.3));for(let n=0;n<8;n++)for(const tilt of[-1.2,.3,1.2]){m.rotation.set(tilt,n*Math.PI/4,0);const before=skin(m).map(p=>p.toArray());updateInsectModel(m,{x:9,y:9,z:9,walkPhase:2},12);assert.deepEqual(skin(m).map(p=>p.toArray()),before);poses++;for(const p of skin(m)){p.project(camera);maxX=Math.max(maxX,Math.abs(p.x));maxY=Math.max(maxY,Math.abs(p.y));}}}
 assert.equal(poses,72);assert.ok(maxX<.98&&maxY<.98);console.log('048 native inspector',JSON.stringify({poses,maxX,maxY}));m.userData.dispose();
});
