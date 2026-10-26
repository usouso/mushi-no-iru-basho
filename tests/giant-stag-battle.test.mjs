/** Bounded giant-stag CPU audit: 11 ordered pairs / 22 final-push clips.
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
const old=['hercules','rhino','stag','metallifer','atlas'];
const pairs=old.flatMap(other=>[['giantstag',other],[other,'giantstag']]).concat([['giantstag','giantstag']]);
const config=([playerSpecies,opponentSpecies])=>({playerSpecies,opponentSpecies,playerSizePermille:old.slice(0,4).includes(playerSpecies)?1150:null,opponentSizePermille:old.slice(0,4).includes(opponentSpecies)?1150:null});
const model=(view,side)=>view.scene.getObjectByName('battle-'+side).children[0];
const vector=p=>new T.Vector3(p.x,p.y,p.z);
function skin(root){const out=[];root.traverse(mesh=>{if(!mesh.isMesh)return;const a=mesh.geometry.attributes.position,index=mesh.geometry.index,seen=new Set();for(let n=0;n<(index?.count??a.count);n++){const i=index?index.getX(n):n;if(seen.has(i))continue;seen.add(i);out.push(new T.Vector3().fromBufferAttribute(a,i).applyMatrix4(mesh.matrixWorld));}});return out;}
function feet(m){return m.userData.battleRig.legs.map(leg=>{const point=vector(leg.foot).applyMatrix4(leg.mesh.matrixWorld);assert.ok(Math.min(...skin(leg.mesh).map(p=>p.distanceTo(point)))<2e-6,'support is on real indexed leg skin');return{leg,point};});}
function triangle(rig){const {mesh,triangleIndex}=rig.contactPatch,a=mesh.geometry.attributes.position,index=mesh.geometry.index;return new T.Triangle(...[0,1,2].map(n=>new T.Vector3().fromBufferAttribute(a,index?index.getX(triangleIndex*3+n):triangleIndex*3+n).applyMatrix4(mesh.matrixWorld)));}
function terminal(sign){return Object.freeze({phase:'finished',position:sign*4,winner:sign>0?'player':'opponent',finishReason:'ring-out',exchanges:20,lastExchange:Object.freeze({number:20,playerAction:sign>0?'push':'brace',opponentAction:sign>0?'brace':'push',positionBefore:sign*3.65,positionAfter:sign*4,delta:sign*.35})});}
function signature(m){m.updateMatrixWorld(true);const h=createHash('sha256');m.traverse(n=>{h.update(JSON.stringify([n.name,...n.matrixWorld.elements]));for(const a of Object.values(n.geometry?.attributes||{}))h.update(Buffer.from(a.array.buffer,a.array.byteOffset,a.array.byteLength));});return h.digest('hex');}

test('old five-species motions and terminal rule outputs match the existing baseline exactly',()=>{
 const rows=[],ends=[];
 for(const p of old)for(const o of old)for(const seed of[0,17,1234]){
  let s=createBattle({playerSpecies:p,opponentSpecies:o,seed});ends.push(advanceBattle(s,100));
  for(let i=1;i<=12&&s.phase==='watching';i++){s=advanceBattle(s,BATTLE_LIMITS.introSeconds+i*BATTLE_LIMITS.exchangeSeconds-s.elapsed);rows.push([p,o,seed,s.exchanges,s.position,s.playerEnergy,s.opponentEnergy,s.lastExchange]);}
 }
 assert.equal(rows.length,836);
 assert.equal(createHash('sha256').update(JSON.stringify(rows)).digest('hex'),'74ecce04ae832fe00025e9fac7d9a419e3e9dd960844cec53304e616a874a324');
 // 75 full outcomes from pre-giant-stag b99a2dd, read directly from git source.
 assert.equal(ends.length,75);assert.equal(createHash('sha256').update(JSON.stringify(ends)).digest('hex'),'c5eb703b7df04f631a4c50b6b305b23da2f4884f8b70c13ffa82295f1f09cc3b');
});

test('11 giant-stag pairs keep ring-out-only wins or explicit 59.6-second draws, independent of inputs/model size',()=>{
 assert.equal(pairs.length,11);assert.equal(BATTLE_LIMITS.ring,4);assert.equal(BATTLE_LIMITS.turns,36);assert.equal(BATTLE_LIMITS.maxSeconds,59.6);
 const outcomes={player:0,opponent:0,draw:0};
 for(const pair of pairs)for(let seed=0;seed<32;seed++){
  const c={...config(pair),seed},s=advanceBattle(createBattle(c),100);assert.equal(s.phase,'finished');outcomes[s.winner]++;
  if(s.winner==='draw'){assert.equal(s.finishReason,'time-limit');assert.equal(s.elapsed,59.6);assert.equal(s.exchanges,36);assert.ok(Math.abs(s.position)<4);}
  else{assert.equal(s.finishReason,'ring-out');assert.equal(s.position,s.winner==='player'?4:-4);}
  assert.deepEqual(advanceBattle(createBattle({...c,playerSizePermille:1150,opponentSizePermille:1000,input:'push',playerAction:'evade'}),100),s);
 }
 assert.ok(Object.values(outcomes).every(n=>n>0));console.log('Giant-stag-only pure outcomes:',JSON.stringify(outcomes));
});

test('11 ordered pairs / 22 endpoint clips touch actual jaw skins, support real feet and visibly cross the unchanged line within frame',()=>{
 const metrics={pairs:11,clips:0,maxContactGap:0,maxReachError:0,maxSkinStep:0,minFinalBodyClearance:Infinity};
 for(const pair of pairs)for(const sign of[-1,1]){
  const c=config(pair),label=pair.join('/')+' '+sign,view=createBattleView({...c,aspect:sign>0?.45:16/9}),s=terminal(sign),bytes=JSON.stringify(s),loser=sign>0?'opponent':'player';
  const ring=view.scene.getObjectByName('battle-ring').geometry.parameters.radius,platform=view.scene.getObjectByName('battle-stump').geometry.parameters.radiusTop;
  const initial=new T.Box3().setFromObject(view.scene.getObjectByName('battle-player')).union(new T.Box3().setFromObject(view.scene.getObjectByName('battle-opponent')));
  assert.ok(Math.abs(ring-(Math.max(.65,Math.abs(initial.min.x),Math.abs(initial.max.x))+.36)*.78)<1e-10,'winning line was not shrunk');
  for(const side of['player','opponent']){
   const m=model(view,side),rig=m.userData.battleRig;assert.equal(rig.legs.length,6);
   if(m.userData.species==='giantstag'){
    assert.equal(rig.scale,1);assert.deepEqual(Array.from(m.scale.toArray()),[1,1,1]);
    for(const leg of rig.legs){assert.ok(Math.abs(leg.upper-.052)<1e-9);assert.ok(Math.abs(leg.lower-.047)<1e-9);}
    const hint=m.userData.weaponHint;assert.ok(hint?.mesh&&Number.isInteger(hint.index),'model supplies an actual jaw-skin vertex');
    assert.equal(rig.weapon.mesh,hint.mesh);assert.equal(rig.weapon.index,hint.index);
   }else assert.ok(Math.abs(rig.scale-(m.userData.species==='atlas'?1:1.15))<1e-9);
  }
  view.update({phase:'watching',position:s.lastExchange.positionBefore,lastExchange:null},0,{reducedMotion:true});let held=0,last,previous=null;
  for(let frame=0;frame<52;frame++){
   last=view.update(s,.04);view.scene.updateMatrixWorld(true);view.camera.updateMatrixWorld(true);assert.equal(JSON.stringify(s),bytes);const points=[];
   for(const side of['player','opponent']){
    const m=model(view,side),rig=m.userData.battleRig,surface=skin(m),support=feet(m);points.push(...surface);
    assert.ok(support.filter(f=>Math.abs(f.point.y)<2e-5).length>=2,label+' lacks supported skin feet');
    for(const leg of rig.legs){metrics.maxReachError=Math.max(metrics.maxReachError,leg.reachError);assert.ok(leg.reachError<.002,`${label} ${side}/${leg.role} reach ${leg.reachError} age ${last.age}`);}
    for(const p of surface){assert.ok(p.y>=-2e-5,label+' skin below table');assert.ok(Math.hypot(p.x,p.z)<platform-.02,label+' skin beyond safe platform');const q=p.clone().project(view.camera);assert.ok(Math.abs(q.x)<=.881&&Math.abs(q.y)<=.581&&q.z>=-1&&q.z<=1,label+' actual skin out of frame');}
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
 assert.equal(metrics.clips,22);console.log('Giant-stag-only CPU contact/ringout metrics:',JSON.stringify(metrics));
});

test('giant-stag poses do not mutate field/inspection models or outcome; paused, reduced and reset poses preserve lifecycle',()=>{
 const field=createInsectModel('giantstag'),inspection=createInsectModel('giantstag',{inspection:true}),original=[signature(field),signature(inspection)],reads=storageCalls.length;
 const s=advanceBattle(createBattle({playerSpecies:'giantstag',opponentSpecies:'hercules',seed:0}),100),bytes=JSON.stringify(s);
 const view=createBattleView({playerSpecies:'giantstag',opponentSpecies:'hercules',playerSizePermille:1150,opponentSizePermille:1150});
 assert.equal(model(view,'player').userData.battleRig.scale,1,'fixed giant-stag ignores measurement scale');
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
