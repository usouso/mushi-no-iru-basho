/** Bounded elephant CPU audit: 13 ordered pairs / 26 final-push clips.
 * Actual Three geometry, mocked canvas/storage. Not GPU, sound or browser QA. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {createBattle,advanceBattle,BATTLE_LIMITS} from '../src/beetle-battle.js';
import {BATTLE_CHOREOGRAPHY,RING_OUT_CHOREOGRAPHY} from '../src/battle-choreography.js';
const sandbox={console};vm.runInNewContext(fs.readFileSync(new URL('../assets/vendor/three.min.js',import.meta.url),'utf8'),sandbox);
const T=sandbox.THREE,context={};
for(const key of['fillRect','clearRect','beginPath','moveTo','lineTo','bezierCurveTo','quadraticCurveTo','stroke','fill','save','restore','translate','rotate','ellipse','arc','drawImage','closePath','clip'])context[key]=()=>{};
context.createLinearGradient=()=>({addColorStop(){}});
globalThis.window={THREE:T};globalThis.document={createElement:()=>({getContext:()=>context})};
const storageCalls=[];globalThis.localStorage={getItem:key=>{storageCalls.push(key);return null;},setItem:key=>storageCalls.push(key),removeItem:key=>storageCalls.push(key)};
const {createBattleView}=await import('../src/battle-view.js');
const {createInsectModel}=await import('../src/insect-models.js');
const old=['hercules','rhino','stag','metallifer','atlas','giantstag'];
const pairs=old.flatMap(other=>[['elephant',other],[other,'elephant']]).concat([['elephant','elephant']]);
const config=([playerSpecies,opponentSpecies])=>({playerSpecies,opponentSpecies,playerSizePermille:old.slice(0,4).includes(playerSpecies)?1150:null,opponentSizePermille:old.slice(0,4).includes(opponentSpecies)?1150:null});
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
function neckCheck(m){
 const data=m.userData,body=data.bodyMesh,head=data.headMesh,components=body.userData.components.map(r=>localTriangles(body,r.start,r.count));
 // This head-local point is inside the actual closed head, close to its rear.
 // Remaining inside a body component proves a shared socket volume, not just
 // touching bounding boxes or a disconnected pivot floating near the body.
 const rear=new T.Vector3(0,0,-.004);assert.ok(inside(rear,localTriangles(head)));
 assert.equal(head.parent,data.headPivot);assert.equal(data.hornMesh.parent,data.headPivot);
 return()=>{const inverse=body.matrixWorld.clone().invert(),point=rear.clone().applyMatrix4(head.matrixWorld).applyMatrix4(inverse);assert.ok(components.some(c=>inside(point,c)),'prepared head retains actual neck overlap with the body');};
}

test('all old six-species terminal outputs retain the frozen 0.24 baseline',()=>{
 const ends=[];
 for(const p of old)for(const o of old)for(const seed of[0,17])ends.push(advanceBattle(createBattle({playerSpecies:p,opponentSpecies:o,seed}),100));
 assert.equal(ends.length,72);
 // Frozen 1e13ecb was read privately to obtain this constant. No git is needed here.
 assert.equal(createHash('sha256').update(JSON.stringify(ends)).digest('hex'),'1886095a7e4ae9221bfc36a2404126d32c9ab7333abe1ef83b8fb79bc9272cfe');
 assert.match(fs.readFileSync(new URL('../src/beetle-battle.js',import.meta.url),'utf8'),/if\(species==='stag'&&ownPosition<=-1\.5\)return \.05;/);
});

test('13 elephant pairs keep ring-out-only wins or explicit 59.6-second draws, independent of inputs/model size',()=>{
 assert.equal(pairs.length,13);assert.equal(BATTLE_LIMITS.ring,4);assert.equal(BATTLE_LIMITS.turns,36);assert.equal(BATTLE_LIMITS.maxSeconds,59.6);
 const outcomes={player:0,opponent:0,draw:0};
 for(const pair of pairs)for(const seed of[0,1,4,7]){
  const c={...config(pair),seed},s=advanceBattle(createBattle(c),100);assert.equal(s.phase,'finished');outcomes[s.winner]++;
  if(s.winner==='draw'){assert.equal(s.finishReason,'time-limit');assert.equal(s.elapsed,59.6);assert.equal(s.exchanges,36);assert.ok(Math.abs(s.position)<4);}
  else{assert.equal(s.finishReason,'ring-out');assert.equal(s.position,s.winner==='player'?4:-4);}
  assert.deepEqual(advanceBattle(createBattle({...c,playerSizePermille:1150,opponentSizePermille:1000,input:'push',playerAction:'evade'}),100),s);
 }
 assert.ok(Object.values(outcomes).every(n=>n>0));console.log('Elephant-only pure outcomes:',JSON.stringify(outcomes));
});

test('13 ordered pairs / 26 endpoint clips touch actual horn skins, support real feet and visibly cross the unchanged line within frame',()=>{
 const metrics={pairs:13,clips:0,maxContactGap:0,maxReachError:0,maxSkinStep:0,minFinalBodyClearance:Infinity,headSocketChecks:0,maxHeadPreparation:0};
 for(const pair of pairs)for(const sign of[-1,1]){
  const c=config(pair),label=pair.join('/')+' '+sign,view=createBattleView({...c,aspect:sign>0?.45:16/9}),s=terminal(sign),bytes=JSON.stringify(s),loser=sign>0?'opponent':'player';
  const ring=view.scene.getObjectByName('battle-ring').geometry.parameters.radius,platform=view.scene.getObjectByName('battle-stump').geometry.parameters.radiusTop;
  const initial=new T.Box3().setFromObject(view.scene.getObjectByName('battle-player')).union(new T.Box3().setFromObject(view.scene.getObjectByName('battle-opponent')));
  assert.ok(Math.abs(ring-(Math.max(.65,Math.abs(initial.min.x),Math.abs(initial.max.x))+.36)*.78)<1e-10,'winning line was not shrunk');
  const necks=new Map();
  for(const side of['player','opponent']){
   const m=model(view,side),rig=m.userData.battleRig;assert.equal(rig.legs.length,6);
   if(m.userData.species==='elephant'){
    assert.equal(rig.scale,1);assert.deepEqual(Array.from(m.scale.toArray()),[1,1,1]);
    for(const leg of rig.legs){assert.ok(Math.abs(leg.upper-.078)<1e-9);assert.ok(Math.abs(leg.lower-.070)<1e-9);}
    const hint=m.userData.weaponHint;assert.ok(hint?.mesh&&Number.isInteger(hint.index),'model supplies an actual head-horn skin vertex');
    assert.equal(rig.weapon.mesh,hint.mesh);assert.equal(rig.weapon.index,hint.index);
    assert.equal(m.userData.rootAboveSupport,.065);necks.set(side,neckCheck(m));
   }else assert.ok(Math.abs(rig.scale-(['atlas','giantstag'].includes(m.userData.species)?1:1.15))<1e-9);
  }
  view.update({phase:'watching',position:s.lastExchange.positionBefore,lastExchange:null},0,{reducedMotion:true});let held=0,last,previous=null;
  for(let frame=0;frame<52;frame++){
   last=view.update(s,.04);view.scene.updateMatrixWorld(true);view.camera.updateMatrixWorld(true);assert.equal(JSON.stringify(s),bytes);const points=[];
   for(const side of['player','opponent']){
    const m=model(view,side),rig=m.userData.battleRig,surface=skin(m),support=feet(m);points.push(...surface);
    if(necks.has(side)){necks.get(side)();metrics.headSocketChecks++;metrics.maxHeadPreparation=Math.max(metrics.maxHeadPreparation,Math.abs(m.userData.headPivot.rotation.x));}
    assert.ok(support.filter(f=>Math.abs(f.point.y)<2e-5).length>=2,label+' lacks supported skin feet');
    for(const leg of rig.legs){metrics.maxReachError=Math.max(metrics.maxReachError,leg.reachError);assert.ok(leg.reachError<.002,`${label} ${side}/${leg.role} reach ${leg.reachError} age ${last.age}`);}
    for(const p of surface){if(p.y < -2e-5)assert.fail(`${label} ${side} age=${last.age} skin below table ${lowestSkin(m)}`);assert.ok(Math.hypot(p.x,p.z)<platform-.02,label+' skin beyond safe platform');const q=p.clone().project(view.camera);assert.ok(Math.abs(q.x)<=.881&&Math.abs(q.y)<=.581&&q.z>=-1&&q.z<=1,label+' actual skin out of frame');}
    if(last.settled)assert.equal(support.filter(f=>Math.abs(f.point.y)<2e-5).length,6,label+' did not land all six feet');
   }
   if(previous)for(let n=0;n<points.length;n++){const d=points[n].distanceTo(previous[n]);metrics.maxSkinStep=Math.max(metrics.maxSkinStep,d);assert.ok(d<.075,`${label} skin jump ${d} at ${last.age}`);}previous=points;
   if(last.contactActive){
    held++;const attack=model(view,last.actor).userData.battleRig,defend=model(view,last.actor==='player'?'opponent':'player').userData.battleRig;
    assert.equal(last.family,['stag','metallifer','giantstag'].includes(attack.species)?'jaw':'horn');
    const weapon=attack.weaponWorld(),patch=defend.contactWorld(),actual=new T.Vector3().fromBufferAttribute(attack.weapon.mesh.geometry.attributes.position,attack.weapon.index).applyMatrix4(attack.weapon.mesh.matrixWorld);
    assert.ok(actual.distanceTo(weapon)<2e-6);assert.ok(triangle(defend).closestPointToPoint(patch,new T.Vector3()).distanceTo(patch)<2e-6);
    const gap=weapon.distanceTo(patch);metrics.maxContactGap=Math.max(metrics.maxContactGap,gap);assert.ok(gap<.006,label+' weapon/actual torso triangle gap');
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
 assert.equal(metrics.clips,26);assert.ok(metrics.headSocketChecks>=26*52&&metrics.maxHeadPreparation>.01);console.log('Elephant-only CPU contact/ringout metrics:',JSON.stringify(metrics));
});

test('elephant poses do not mutate field/inspection models or outcome; paused, reduced and reset poses preserve lifecycle',()=>{
 const field=createInsectModel('elephant'),inspection=createInsectModel('elephant',{inspection:true}),original=[signature(field),signature(inspection)],reads=storageCalls.length;
 const s=advanceBattle(createBattle({playerSpecies:'elephant',opponentSpecies:'hercules',seed:0}),100),bytes=JSON.stringify(s);
 const view=createBattleView({playerSpecies:'elephant',opponentSpecies:'hercules',playerSizePermille:1150,opponentSizePermille:1150});
 assert.equal(model(view,'player').userData.battleRig.scale,1,'fixed elephant ignores measurement scale');
 for(let n=0;n<18;n++)view.update(s,.02);const frozen=signature(view.scene),age=view.getPresentation().age;
 for(let n=0;n<8;n++){assert.deepEqual(view.update(s,0).events,[]);assert.equal(signature(view.scene),frozen);}assert.equal(view.getPresentation().age,age);
 for(let n=0;n<110;n++)view.update(s,.02);assert.equal(view.getPresentation().finished,true);assert.equal(JSON.stringify(s),bytes);
 assert.equal(BATTLE_CHOREOGRAPHY.settledSeconds,1.42);assert.equal(RING_OUT_CHOREOGRAPHY.settledSeconds,1.95);
 view.reset();assert.equal(view.getPresentation().finished,false);assert.equal(view.getPresentation().exchangeNumber,0);
 const ordinary=Object.freeze({phase:'watching',position:.35,exchanges:1,lastExchange:Object.freeze({number:1,delta:.35,positionBefore:0,positionAfter:.35})});
 for(let n=0;n<78;n++)view.update(ordinary,.02,{reducedMotion:true});assert.equal(view.getPresentation().settled,true);
 for(const side of['player','opponent'])assert.equal(feet(model(view,side)).filter(f=>Math.abs(f.point.y)<2e-5).length,6);
 view.dispose();assert.deepEqual([signature(field),signature(inspection)],original);assert.equal(storageCalls.length,reads);field.userData.dispose();inspection.userData.dispose();
});

test('three representative corrected poses retain native bone lengths at actual leg-skin endpoint centres',()=>{
 let maxBoneError=0,legsChecked=0;
 for(const [pair,sign]of [[['elephant','atlas'],1],[['giantstag','elephant'],1],[['elephant','elephant'],-1]]){
  const view=createBattleView(config(pair)),s=terminal(sign);
  view.update({phase:'watching',position:s.lastExchange.positionBefore,lastExchange:null},0,{reducedMotion:true});
  for(let frame=0;frame<52;frame++){
   const presentation=view.update(s,.04);view.scene.updateMatrixWorld(true);
   for(const side of['player','opponent']){
    const m=model(view,side);if(m.userData.species!=='elephant')continue;
    for(const leg of m.userData.battleRig.legs){
     const a=leg.mesh.geometry.attributes.position,meta=leg.mesh.userData.skinEndpoints;
     assert.ok(meta.hip.includes(12)&&meta.knee.includes(13)&&meta.knee.includes(26)&&meta.foot.includes(27));
     const [hip,kneeUpper,kneeLower,foot]=[12,13,26,27].map(index=>new T.Vector3().fromBufferAttribute(a,index).applyMatrix4(leg.mesh.matrixWorld));
     assert.ok(kneeUpper.distanceTo(kneeLower)<2e-7,'both real bone centres remain joined');
     const error=Math.max(Math.abs(hip.distanceTo(kneeUpper)-.078),Math.abs(kneeLower.distanceTo(foot)-.070));
     maxBoneError=Math.max(maxBoneError,error);assert.ok(error<2e-7,`${pair.join('/')} ${side}/${leg.role}/${leg.side} age=${presentation.age} actual bone error ${error}; upper=${hip.distanceTo(kneeUpper)} lower=${kneeLower.distanceTo(foot)} centres=${JSON.stringify([hip.toArray(),kneeUpper.toArray(),foot.toArray()])}`);legsChecked++;
    }
   }
  }
  view.dispose();
 }
 assert.equal(legsChecked,1248);console.log('Elephant corrected-pose actual bone metrics:',JSON.stringify({clips:3,legsChecked,maxBoneError}));
});
