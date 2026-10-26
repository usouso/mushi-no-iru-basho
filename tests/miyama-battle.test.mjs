/** Bounded miyama CPU audit: 19 ordered pairs / 38 final-push clips.
 * Actual Three geometry, mocked canvas/storage. Not GPU, sound or browser QA. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {createBattle,advanceBattle,cancelBattle,BATTLE_LIMITS} from '../src/beetle-battle.js';
import {BATTLE_CHOREOGRAPHY,RING_OUT_CHOREOGRAPHY} from '../src/battle-choreography.js';
const sandbox={console};vm.runInNewContext(fs.readFileSync(new URL('../assets/vendor/three.min.js',import.meta.url),'utf8'),sandbox);
const T=sandbox.THREE,context={};
for(const key of['fillRect','clearRect','beginPath','moveTo','lineTo','bezierCurveTo','quadraticCurveTo','stroke','fill','save','restore','translate','rotate','ellipse','arc','drawImage','closePath','clip'])context[key]=()=>{};
context.createLinearGradient=()=>({addColorStop(){}});
globalThis.window={THREE:T};globalThis.document={createElement:()=>({getContext:()=>context})};
const storageCalls=[];globalThis.localStorage={getItem:key=>{storageCalls.push(key);return null;},setItem:key=>storageCalls.push(key),removeItem:key=>storageCalls.push(key)};
const {createBattleView}=await import('../src/battle-view.js');
const {createInsectModel}=await import('../src/insect-models.js');
const old=['hercules','rhino','stag','metallifer','atlas','giantstag','elephant','goliath','fivehorn'];
const pairs=old.flatMap(other=>[['miyama',other],[other,'miyama']]).concat([['miyama','miyama']]);
const config=([playerSpecies,opponentSpecies])=>({playerSpecies,opponentSpecies,playerSizePermille:old.filter(s=>!['atlas','elephant','goliath','fivehorn'].includes(s)).includes(playerSpecies)?1150:null,opponentSizePermille:old.filter(s=>!['atlas','elephant','goliath','fivehorn'].includes(s)).includes(opponentSpecies)?1150:null});
const model=(view,side)=>view.scene.getObjectByName('battle-'+side).children[0];
const vector=p=>new T.Vector3(p.x,p.y,p.z);
function skin(root){const out=[];root.traverse(mesh=>{if(!mesh.isMesh)return;const a=mesh.geometry.attributes.position,index=mesh.geometry.index,seen=new Set();for(let n=0;n<(index?.count??a.count);n++){const i=index?index.getX(n):n;if(seen.has(i))continue;seen.add(i);out.push(new T.Vector3().fromBufferAttribute(a,i).applyMatrix4(mesh.matrixWorld));}});return out;}
function lowestSkin(root){let lowest={y:Infinity};root.traverse(mesh=>{if(!mesh.isMesh)return;const a=mesh.geometry.attributes.position;for(let i=0;i<a.count;i++){const p=new T.Vector3().fromBufferAttribute(a,i).applyMatrix4(mesh.matrixWorld);if(p.y<lowest.y)lowest={mesh:mesh.name,index:i,x:p.x,y:p.y,z:p.z};}});return JSON.stringify(lowest);}
function feet(m){return m.userData.battleRig.legs.map(leg=>{const point=vector(leg.foot).applyMatrix4(leg.mesh.matrixWorld);assert.ok(Math.min(...skin(leg.mesh).map(p=>p.distanceTo(point)))<2e-6,'support is on real indexed leg skin');return{leg,point};});}
function triangle(rig){const {mesh,triangleIndex}=rig.contactPatch,a=mesh.geometry.attributes.position,index=mesh.geometry.index;return new T.Triangle(...[0,1,2].map(n=>new T.Vector3().fromBufferAttribute(a,index?index.getX(triangleIndex*3+n):triangleIndex*3+n).applyMatrix4(mesh.matrixWorld)));}
function terminal(sign){return Object.freeze({phase:'finished',position:sign*4,winner:sign>0?'player':'opponent',finishReason:'ring-out',exchanges:20,lastExchange:Object.freeze({number:20,playerAction:sign>0?'push':'brace',opponentAction:sign>0?'brace':'push',positionBefore:sign*3.65,positionAfter:sign*4,delta:sign*.35})});}
function signature(m){m.updateMatrixWorld(true);const h=createHash('sha256');m.traverse(n=>{h.update(JSON.stringify([n.name,...n.matrixWorld.elements]));for(const a of Object.values(n.geometry?.attributes||{}))h.update(Buffer.from(a.array.buffer,a.array.byteOffset,a.array.byteLength));});return h.digest('hex');}
function localTriangles(mesh,start=0,count=null){const a=mesh.geometry.attributes.position,index=mesh.geometry.index,out=[];count??=index?.count??a.count;for(let i=start;i<start+count;i+=3){const tri=new T.Triangle(...[0,1,2].map(n=>new T.Vector3().fromBufferAttribute(a,index?index.getX(i+n):i+n)));if(tri.getArea()>1e-15)out.push(tri);}return out;}
function inside(point,triangles){const ray=new T.Ray(point,new T.Vector3(.019,1,.031).normalize()),hits=[];for(const tri of triangles){const hit=ray.intersectTriangle(tri.a,tri.b,tri.c,false,new T.Vector3());if(hit){const d=point.distanceTo(hit);if(d>1e-8&&!hits.some(x=>Math.abs(x-d)<1e-7))hits.push(d);}}return hits.length%2===1;}
const torsoTriangleCache=new WeakMap();
function jawPenetration(attack,defend,label,age){
 // Inspect both actual jaw skins, not just one selected contact tip.
 // Both attacker and receiver roles are sampled at finite contact frames.
 let maxDepth=0;for(const horn of attack.model.userData.jaws){const points=skin(horn.mesh);
 for(const mesh of defend.torsoMeshes){
  let groups=torsoTriangleCache.get(mesh);if(!groups){groups=(mesh.userData.components||[{start:0,count:mesh.geometry.index?.count??mesh.geometry.attributes.position.count}]).map(r=>localTriangles(mesh,r.start,r.count));torsoTriangleCache.set(mesh,groups);}
  const inverse=mesh.matrixWorld.clone().invert(),box=new T.Box3().setFromBufferAttribute(mesh.geometry.attributes.position);
  for(let i=0;i<points.length;i++){
   const point=points[i].clone().applyMatrix4(inverse);if(!box.containsPoint(point))continue;
   for(const triangles of groups){if(!inside(point,triangles))continue;let depth=Infinity;
    for(const tri of triangles)depth=Math.min(depth,tri.closestPointToPoint(point,new T.Vector3()).applyMatrix4(mesh.matrixWorld).distanceTo(points[i]));
    maxDepth=Math.max(maxDepth,depth);assert.ok(depth<=.0005,`${label} ${horn.mesh.name} penetrates actual other torso: depth=${depth} local vertex=${i} age=${age} world=${points[i].toArray()} mesh=${mesh.name}`);
   }
  }
 }
 }return maxDepth;
}
function jawSocketCheck(m){
 const data=m.userData,body=data.bodyMesh,components=body.userData.components.map(r=>localTriangles(body,r.start,r.count));
 assert.equal(data.headPivot,undefined);assert.equal(data.jaws.length,2);assert.deepEqual(data.jaws.map(j=>j.side),[-1,1]);
 const witnesses=data.jaws.map(jaw=>{
  assert.equal(jaw.mesh.parent,jaw.pivot);assert.equal(jaw.pivot.parent,m);
  // A point just forward of the real tube root must belong to both solids,
  // rather than merely sit near a disconnected metadata pivot.
  const inner=vector(jaw.centerline[1]).sub(vector(jaw.root)).multiplyScalar(.05);
  assert.ok(inside(inner,localTriangles(jaw.mesh)),'jaw-root witness lies inside actual closed jaw skin');
  return{jaw,inner};
 });
 return()=>{const inverse=body.matrixWorld.clone().invert();for(const {jaw,inner}of witnesses){const point=inner.clone().applyMatrix4(jaw.mesh.matrixWorld).applyMatrix4(inverse);assert.ok(components.some(c=>inside(point,c)),'articulated jaw retains actual shared volume with its head socket');}};
}

test('all old nine-species terminal outputs retain the frozen baseline; registry-only rule extension',()=>{
 const ends=[];
 for(const p of old)for(const o of old)for(const seed of[0,17])ends.push(advanceBattle(createBattle({playerSpecies:p,opponentSpecies:o,seed}),100));
 assert.equal(ends.length,162);
 // Frozen 0.31 (8450438) outputs were read privately to obtain this constant. No git is needed here.
 assert.equal(createHash('sha256').update(JSON.stringify(ends)).digest('hex'),'e0f20d495b9fb9f351fedaafb464a5f0193b11bff50be9e3bfcfd7362d833741');
 const source=fs.readFileSync(new URL('../src/beetle-battle.js',import.meta.url),'utf8');
 assert.equal(createHash('sha256').update(source.replace(/export const BATTLE_SPECIES=freeze\(\{[\s\S]*?\n\}\);/,'export const BATTLE_SPECIES=<registry>;')).digest('hex'),'bcb68d5024e7293e865e2ff9206ea5cbbe02e3cbe71769dfcaa1b3c1d46b5770','only the eligible registry may extend old rules');
 assert.match(source,/if\(species==='stag'&&ownPosition<=-1\.5\)return \.05;/);
 // Pin the old model/kinematics files explicitly; future files cannot enter this baseline.
 const oldFiles=["atlas-kinematics.js", "atlas-model.js", "bee-kinematics.js", "bee-model.js", "diving-kinematics.js", "diving-model.js", "dung-kinematics.js", "dung-model.js", "elephant-kinematics.js", "elephant-model.js", "five-horn-kinematics.js", "five-horn-model.js", "giant-stag-kinematics.js", "giant-stag-model.js", "goliath-kinematics.js", "goliath-model.js", "jewel-kinematics.js", "jewel-model.js", "ladybird-kinematics.js", "ladybird-model.js", "longhorn-kinematics.js", "longhorn-model.js", "mantis-kinematics.js", "mantis-model.js", "metallifer-kinematics.js", "metallifer-model.js", "rhino-kinematics.js", "rhino-model.js", "stag-kinematics.js", "stag-model.js", "strider-kinematics.js", "swallowtail-kinematics.js", "swallowtail-model.js"];const modelsHash=createHash('sha256');for(const file of oldFiles)modelsHash.update(file).update(fs.readFileSync(new URL('../src/'+file,import.meta.url),'utf8').replace(/\?v=[^'"\s]+/g,''));assert.equal(modelsHash.digest('hex'),'1ac9c0f474731e8e71744ebe1fb87f7620fcdbae0276303e1360376ae431e0f6');
});

test('19 miyama pairs keep ring-out-only wins or explicit 59.6-second draws, independent of inputs/model size',()=>{
 assert.equal(pairs.length,19);assert.equal(BATTLE_LIMITS.ring,4);assert.equal(BATTLE_LIMITS.turns,36);assert.equal(BATTLE_LIMITS.maxSeconds,59.6);
 const outcomes={player:0,opponent:0,draw:0};
 for(const pair of pairs)for(const seed of[0,1,4,7]){
  const c={...config(pair),seed},s=advanceBattle(createBattle(c),100);assert.equal(s.phase,'finished');outcomes[s.winner]++;
  if(s.winner==='draw'){assert.equal(s.finishReason,'time-limit');assert.equal(s.elapsed,59.6);assert.equal(s.exchanges,36);assert.ok(Math.abs(s.position)<4);}
  else{assert.equal(s.finishReason,'ring-out');assert.equal(s.position,s.winner==='player'?4:-4);}
  assert.deepEqual(advanceBattle(createBattle({...c,playerSizePermille:1150,opponentSizePermille:1000,input:'push',playerAction:'evade'}),100),s);
 }
 assert.ok(Object.values(outcomes).every(n=>n>0));console.log('Miyama-only pure outcomes:',JSON.stringify(outcomes));
});

test('19 ordered pairs / 38 endpoint clips touch actual jaw/horn skins, support real feet and visibly cross the unchanged line within frame',()=>{
 const metrics={pairs:19,clips:0,maxBoneError:0,bonesChecked:0,maxContactGap:0,maxJawPenetration:0,jawProbeFrames:0,maxReachError:0,maxSkinStep:0,minFinalBodyClearance:Infinity,jawSocketChecks:0,maxJawPreparation:0};
 for(const pair of pairs)for(const sign of[-1,1]){
  const c=config(pair),label=pair.join('/')+' '+sign,view=createBattleView({...c,aspect:sign>0?.45:16/9}),s=terminal(sign),bytes=JSON.stringify(s),loser=sign>0?'opponent':'player';
  const ring=view.scene.getObjectByName('battle-ring').geometry.parameters.radius,platform=view.scene.getObjectByName('battle-stump').geometry.parameters.radiusTop;
  const initial=new T.Box3().setFromObject(view.scene.getObjectByName('battle-player')).union(new T.Box3().setFromObject(view.scene.getObjectByName('battle-opponent')));
  assert.ok(Math.abs(ring-(Math.max(.65,Math.abs(initial.min.x),Math.abs(initial.max.x))+.36)*.78)<1e-10,'winning line was not shrunk');
  const necks=new Map();
  for(const side of['player','opponent']){
   const m=model(view,side),rig=m.userData.battleRig;assert.equal(rig.legs.length,6);
   if(m.userData.species==='miyama'){
    assert.equal(rig.scale,1);assert.deepEqual(Array.from(m.scale.toArray()),[1,1,1]);
    for(const leg of rig.legs){assert.ok(Math.abs(leg.upper-.060)<1e-9);assert.ok(Math.abs(leg.lower-.055)<1e-9);}
    const hint=m.userData.weaponHint;assert.ok(hint?.mesh&&Number.isInteger(hint.index),'model supplies an actual left-jaw skin vertex');
    assert.equal(rig.weapon.mesh,hint.mesh);assert.equal(rig.weapon.index,hint.index);
    assert.equal(m.userData.rootAboveSupport,.055);assert.equal(m.userData.jaws.length,2);assert.equal(new Set(m.userData.jaws.map(j=>j.mesh)).size,2);necks.set(side,jawSocketCheck(m));
   }else assert.ok(Math.abs(rig.scale-(['atlas','elephant','goliath','fivehorn'].includes(m.userData.species)?1:1.15))<1e-9);
  }
  view.update({phase:'watching',position:s.lastExchange.positionBefore,lastExchange:null},0,{reducedMotion:true});let held=0,last,previous=null;
  for(let frame=0;frame<52;frame++){
   last=view.update(s,.04);view.scene.updateMatrixWorld(true);view.camera.updateMatrixWorld(true);assert.equal(JSON.stringify(s),bytes);const points=[];
   for(const side of['player','opponent']){
    const m=model(view,side),rig=m.userData.battleRig,surface=skin(m),support=feet(m);points.push(...surface);
    if(necks.has(side))for(const leg of rig.legs){
     const a=leg.mesh.geometry.attributes.position,meta=m.userData.legs.find(source=>source.mesh===leg.mesh).skinEndpoints;
     assert.ok(meta.hip.includes(12)&&meta.knee.includes(13)&&meta.knee.includes(26)&&meta.foot.includes(27));
     const [hip,kneeA,kneeB,foot]=[12,13,26,27].map(i=>new T.Vector3().fromBufferAttribute(a,i).applyMatrix4(leg.mesh.matrixWorld));
     assert.ok(kneeA.distanceTo(kneeB)<2e-7,'real bone centres remain joined');
     const error=Math.max(Math.abs(hip.distanceTo(kneeA)-.060),Math.abs(kneeB.distanceTo(foot)-.055));metrics.maxBoneError=Math.max(metrics.maxBoneError,error);metrics.bonesChecked++;
     assert.ok(error<2e-7,`${label} ${side}/${leg.role}/${leg.side} age=${last.age} bone error=${error}; centres=${JSON.stringify([hip.toArray(),kneeA.toArray(),foot.toArray()])}`);
    }
    if(necks.has(side)){necks.get(side)();metrics.jawSocketChecks++;metrics.maxJawPreparation=Math.max(metrics.maxJawPreparation,Math.max(...m.userData.jaws.map(j=>Math.abs(j.pivot.rotation.y))));}
    assert.ok(support.filter(f=>Math.abs(f.point.y)<2e-5).length>=2,label+' lacks supported skin feet');
    for(const leg of rig.legs){metrics.maxReachError=Math.max(metrics.maxReachError,leg.reachError);assert.ok(leg.reachError<.002,`${label} ${side}/${leg.role} reach ${leg.reachError} age ${last.age}; lengths=${[leg.upper,leg.lower]} scale=${rig.scale} hip=${leg.points[0].clone().applyMatrix4(leg.mesh.parent.matrixWorld).toArray()} foot=${leg.worldFoot.toArray()} anchor=${view.scene.getObjectByName('battle-'+side).position.toArray()}`);}
    for(const p of surface){if(p.y < -2e-5)assert.fail(`${label} ${side} age=${last.age} skin below table ${lowestSkin(m)}`);assert.ok(Math.hypot(p.x,p.z)<platform-.02,label+' skin beyond safe platform');const q=p.clone().project(view.camera);assert.ok(Math.abs(q.x)<=.881&&Math.abs(q.y)<=.581&&q.z>=-1&&q.z<=1,label+' actual skin out of frame');}
    if(last.settled)assert.equal(support.filter(f=>Math.abs(f.point.y)<2e-5).length,6,label+' did not land all six feet');
   }
   if(previous)for(let n=0;n<points.length;n++){const d=points[n].distanceTo(previous[n]);metrics.maxSkinStep=Math.max(metrics.maxSkinStep,d);assert.ok(d<.075,`${label} skin jump ${d} at ${last.age}`);}previous=points;
   if(last.contactActive){
    held++;const attack=model(view,last.actor).userData.battleRig,defend=model(view,last.actor==='player'?'opponent':'player').userData.battleRig;
    assert.equal(last.family,['stag','metallifer','giantstag','miyama'].includes(attack.species)?'jaw':'horn');
    const jawReceive=attack.species==='goliath'&&defend.species==='miyama';
    if(jawReceive)assert.ok(defend.model.userData.jaws.some(j=>j.mesh===defend.contactPatch.mesh),'short Goliath horn is intercepted by actual Miyama jaw skin');
    else assert.ok(defend.torsoMeshes.includes(defend.contactPatch.mesh),'all other contacts preserve their actual torso target');
    const weapon=attack.weaponWorld(),patch=defend.contactWorld(),actual=new T.Vector3().fromBufferAttribute(attack.weapon.mesh.geometry.attributes.position,attack.weapon.index).applyMatrix4(attack.weapon.mesh.matrixWorld);
    assert.ok(actual.distanceTo(weapon)<2e-6);assert.ok(triangle(defend).closestPointToPoint(patch,new T.Vector3()).distanceTo(patch)<2e-6);
    if([10,20,30].includes(frame))for(const [owner,other]of [[attack,defend],[defend,attack]])if(owner.species==='miyama'){metrics.jawProbeFrames++;metrics.maxJawPenetration=Math.max(metrics.maxJawPenetration,jawPenetration(owner,other,label+' owner='+owner.species+' actor='+attack.species,last.age));}
    const gap=weapon.distanceTo(patch);metrics.maxContactGap=Math.max(metrics.maxContactGap,gap);assert.ok(gap<.006,label+' weapon/actual contact triangle gap');
   }
   if(last.finished)assert.ok(last.ringOutVisible&&last.settled&&last.age>=1.95,label+' premature result');
   for(const z of[-.18,0,.18]){const q=new T.Vector3(sign*Math.sqrt(ring*ring-z*z),.001,z).project(view.camera);assert.ok(Math.abs(q.x)<=.881&&Math.abs(q.y)<=.581,label+' final boundary not framed');}
  }
  assert.ok(held>=15&&last.finished&&last.ringOutVisible);assert.equal(last.ringOutSide,loser);
  const body=model(view,loser).userData.battleRig.torsoBox(new T.Box3()),clearance=(sign>0?body.min.x:-body.max.x)-ring;
  metrics.minFinalBodyClearance=Math.min(metrics.minFinalBodyClearance,clearance);assert.ok(clearance>=.03499,label+' torso still inside line');
  for(const f of feet(model(view,loser)))assert.ok(sign*f.point.x>ring+.02499,label+' support remains inside line');
  view.dispose();metrics.clips++;
 }
 assert.equal(metrics.clips,38);assert.ok(metrics.jawProbeFrames>=38*2);assert.ok(metrics.jawSocketChecks>=38*52&&metrics.maxJawPreparation>.01);console.log('Miyama-only CPU contact/ringout metrics:',JSON.stringify(metrics));
});

test('miyama poses do not mutate field/inspection models or outcome; paused, reduced and reset poses preserve lifecycle',()=>{
 const field=createInsectModel('miyama'),inspection=createInsectModel('miyama',{inspection:true}),original=[signature(field),signature(inspection)],reads=storageCalls.length;
 const s=advanceBattle(createBattle({playerSpecies:'miyama',opponentSpecies:'hercules',seed:0}),100),bytes=JSON.stringify(s);
 const view=createBattleView({playerSpecies:'miyama',opponentSpecies:'hercules',playerSizePermille:1150,opponentSizePermille:1150});
 assert.equal(model(view,'player').userData.battleRig.scale,1,'fixed miyama ignores measurement scale');
 const defaults=Object.fromEntries(['player','opponent'].map(side=>{const rig=model(view,side).userData.battleRig;return[side,{weaponIndex:rig.weapon.index,weaponMesh:rig.weapon.mesh,mesh:rig.contactPatch.mesh,triangle:rig.contactPatch.triangleIndex,point:rig.contactPatch.localPoint.clone()}];}));
 for(let n=0;n<18;n++)view.update(s,.02);const frozen=signature(view.scene),age=view.getPresentation().age;
 for(let n=0;n<8;n++){assert.deepEqual(view.update(s,0).events,[]);assert.equal(signature(view.scene),frozen);}assert.equal(view.getPresentation().age,age);
 for(let n=0;n<110;n++)view.update(s,.02);assert.equal(view.getPresentation().finished,true);assert.equal(JSON.stringify(s),bytes);
 assert.equal(BATTLE_CHOREOGRAPHY.settledSeconds,1.42);assert.equal(RING_OUT_CHOREOGRAPHY.settledSeconds,1.95);
 view.reset();assert.equal(view.getPresentation().finished,false);assert.equal(view.getPresentation().exchangeNumber,0);
 const ordinary=Object.freeze({phase:'watching',position:.35,exchanges:1,lastExchange:Object.freeze({number:1,delta:.35,positionBefore:0,positionAfter:.35})});
 for(let n=0;n<78;n++)view.update(ordinary,.02,{reducedMotion:true});assert.equal(view.getPresentation().settled,true);
 for(const side of['player','opponent'])assert.equal(feet(model(view,side)).filter(f=>Math.abs(f.point.y)<2e-5).length,6);
 // The same view alternates actors without leaking contact targets.
 for(const [number,delta,actor]of [[2,-.35,'opponent'],[3,.35,'player']]){
  const exchange={phase:'watching',position:delta,exchanges:number,lastExchange:{number,delta,positionBefore:0,positionAfter:delta}};
  let pose;for(let n=0;n<40;n++)pose=view.update(exchange,.02);
  assert.ok(pose.contactActive);assert.equal(pose.actor,actor);
  const attack=model(view,actor).userData.battleRig,receive=model(view,actor==='player'?'opponent':'player').userData.battleRig;
  assert.ok(attack.weaponWorld().distanceTo(receive.contactWorld())<.006);
  if(actor==='opponent'){
   assert.equal(attack.weapon.index,defaults.opponent.weaponIndex);assert.equal(attack.weapon.mesh,defaults.opponent.weaponMesh);assert.equal(receive.weapon.index,defaults.player.weaponIndex);assert.equal(receive.weapon.mesh,defaults.player.weaponMesh,'opposite actor preserves the default weapon mesh');
   assert.equal(receive.contactPatch.mesh,defaults.player.mesh);assert.equal(receive.contactPatch.triangleIndex,defaults.player.triangle);
   assert.ok(receive.contactPatch.localPoint.distanceTo(defaults.player.point)<1e-10,'contact target resets for the opposite actor');
  }
 }
 // The exceptional short-horn -> receiving-jaw target resets on actor reversal.
 const intercept=createBattleView({playerSpecies:'goliath',opponentSpecies:'miyama'}),receiving=model(intercept,'opponent').userData.battleRig,defaultPatch=receiving.contactPatch.mesh;
 for(const [number,delta]of [[1,.35],[2,-.35],[3,.35]]){
  const exchange={phase:'watching',position:delta,exchanges:number,lastExchange:{number,delta,positionBefore:0,positionAfter:delta}};
  let pose;for(let n=0;n<40;n++)pose=intercept.update(exchange,.02);
  assert.ok(pose.contactActive);
  if(delta>0)assert.ok(receiving.model.userData.jaws.some(j=>j.mesh===receiving.contactPatch.mesh),'Goliath is received on real jaw skin');
  else assert.equal(receiving.contactPatch.mesh,defaultPatch,'receiving-jaw override is cleared when Miyama attacks');
 }
 intercept.reset();assert.equal(receiving.contactPatch.mesh,defaultPatch);intercept.dispose();
 const cancelled=cancelBattle(advanceBattle(createBattle({playerSpecies:'miyama',opponentSpecies:'hercules',seed:7}),5)),cancelBytes=JSON.stringify(cancelled);assert.equal(cancelled.phase,'cancelled');assert.equal(cancelled.winner,null);view.update(cancelled,.04);assert.equal(JSON.stringify(cancelled),cancelBytes);
 view.dispose();assert.deepEqual([signature(field),signature(inspection)],original);assert.equal(storageCalls.length,reads);field.userData.dispose();inspection.userData.dispose();
});

