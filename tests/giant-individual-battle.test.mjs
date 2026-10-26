/** Only the new maximum-size giant stag: three pairs, both final-push directions.
 * Indexed Three skin/geometry and pure rules, not GPU or human playtesting. */
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import{createHash}from'node:crypto';
import{createBattle,advanceBattle,BATTLE_LIMITS}from'../src/beetle-battle.js';
const sandbox={console};vm.runInNewContext(fs.readFileSync(new URL('../assets/vendor/three.min.js',import.meta.url),'utf8'),sandbox);const T=sandbox.THREE,context={};
for(const key of['fillRect','clearRect','beginPath','moveTo','lineTo','bezierCurveTo','quadraticCurveTo','stroke','fill','save','restore','translate','rotate','ellipse','arc','drawImage','closePath','clip'])context[key]=()=>{};context.createLinearGradient=()=>({addColorStop(){}});
globalThis.window={THREE:T};globalThis.document={createElement:()=>({getContext:()=>context})};const storeCalls=[];globalThis.localStorage={getItem:key=>{storeCalls.push(key);return null;},setItem:key=>storeCalls.push(key),removeItem:key=>storeCalls.push(key)};
const{createBattleView}=await import('../src/battle-view.js'),{createInsectModel}=await import('../src/insect-models.js');
const species=['hercules','rhino','stag','metallifer','atlas','giantstag','elephant'];
const model=(view,side)=>view.scene.getObjectByName('battle-'+side).children[0];
function skin(root){const points=[];root.traverse(mesh=>{if(!mesh.isMesh)return;const a=mesh.geometry.attributes.position,index=mesh.geometry.index,seen=new Set();for(let n=0;n<(index?.count??a.count);n++){const i=index?index.getX(n):n;if(seen.has(i))continue;seen.add(i);points.push(new T.Vector3().fromBufferAttribute(a,i).applyMatrix4(mesh.matrixWorld));}});return points;}
function feet(m){return m.userData.battleRig.legs.map(leg=>{const point=leg.foot.clone().applyMatrix4(leg.mesh.matrixWorld);assert.ok(Math.min(...skin(leg.mesh).map(p=>p.distanceTo(point)))<2e-6,'support endpoint belongs to actual indexed leg skin');return{leg,point};});}
function triangle(rig){const{mesh,triangleIndex}=rig.contactPatch,a=mesh.geometry.attributes.position,index=mesh.geometry.index;return new T.Triangle(...[0,1,2].map(n=>new T.Vector3().fromBufferAttribute(a,index?index.getX(triangleIndex*3+n):triangleIndex*3+n).applyMatrix4(mesh.matrixWorld)));}
function terminal(sign){return Object.freeze({phase:'finished',position:sign*4,winner:sign>0?'player':'opponent',finishReason:'ring-out',exchanges:20,lastExchange:Object.freeze({number:20,playerAction:sign>0?'push':'brace',opponentAction:sign>0?'brace':'push',positionBefore:sign*3.65,positionAfter:sign*4,delta:sign*.35})});}
function signature(m){m.updateMatrixWorld(true);const h=createHash('sha256');m.traverse(n=>{h.update(JSON.stringify([n.name,...n.matrixWorld.elements]));for(const a of Object.values(n.geometry?.attributes||{}))h.update(Buffer.from(a.array.buffer,a.array.byteOffset,a.array.byteLength));});return h.digest('hex');}

test('all seven frozen 0.25 pure outcomes stay identical; measured size never enters strength or winner rules',()=>{
 const rows=[];assert.equal(BATTLE_LIMITS.ring,4);assert.equal(BATTLE_LIMITS.turns,36);assert.equal(BATTLE_LIMITS.maxSeconds,59.6);
 const outcomes={player:0,opponent:0,draw:0};for(const p of species)for(const o of species)for(const seed of[0,17]){
  const config={playerSpecies:p,opponentSpecies:o,seed},s=advanceBattle(createBattle(config),100);rows.push(s);outcomes[s.winner]++;assert.equal(s.phase,'finished');
  if(s.winner==='draw'){assert.equal(s.finishReason,'time-limit');assert.equal(s.elapsed,59.6);assert.ok(Math.abs(s.position)<4);}else{assert.equal(s.finishReason,'ring-out');assert.equal(s.position,s.winner==='player'?4:-4);}
  assert.deepEqual(advanceBattle(createBattle({...config,playerSizePermille:1150,opponentSizePermille:1000}),100),s);
 }
 assert.equal(rows.length,98);assert.deepEqual(outcomes,{player:49,opponent:49,draw:0});
 // Obtained from the frozen 0.25 source; replay needs no git/private files.
 assert.equal(createHash('sha256').update(JSON.stringify(rows)).digest('hex'),'81c943c9162210904bb0cdc406cc014c8eb95ea61d24266f66853e26d016a496');
});

test('max giant stag versus elephant, Hercules and minimum giant: six real-skin contact, supported landing and camera clips',()=>{
 const metrics={pairs:3,clips:0,maxContactGap:0,maxReachError:0,maxSkinStep:0,maxGiantBoneError:0,minFinalBodyClearance:Infinity};
 for(const opponentSpecies of['elephant','hercules','giantstag'])for(const sign of[-1,1]){
  const otherSize=opponentSpecies==='hercules'?1150:opponentSpecies==='giantstag'?1000:null,view=createBattleView({playerSpecies:'giantstag',opponentSpecies,playerSizePermille:1150,opponentSizePermille:otherSize,aspect:sign>0?.45:16/9}),s=terminal(sign),bytes=JSON.stringify(s),label=`giantstag1150/${opponentSpecies}${otherSize??''} ${sign}`;
  const ring=view.scene.getObjectByName('battle-ring').geometry.parameters.radius,platform=view.scene.getObjectByName('battle-stump').geometry.parameters.radiusTop;
  assert.equal(model(view,'player').scale.x,1.15);assert.equal(model(view,'player').userData.battleRig.scale,1.15);assert.equal(model(view,'opponent').scale.x,(otherSize??1000)/1000);
  const initial=new T.Box3().setFromObject(view.scene.getObjectByName('battle-player')).union(new T.Box3().setFromObject(view.scene.getObjectByName('battle-opponent')));assert.ok(Math.abs(ring-(Math.max(.65,Math.abs(initial.min.x),Math.abs(initial.max.x))+.36)*.78)<1e-10,'ring is not shrunk for large specimens');
  view.update({phase:'watching',position:s.lastExchange.positionBefore,lastExchange:null},0,{reducedMotion:true});let previous=null,held=0,last;
  for(let frame=0;frame<52;frame++){
   last=view.update(s,.04);view.scene.updateMatrixWorld(true);view.camera.updateMatrixWorld(true);assert.equal(JSON.stringify(s),bytes);const all=[];
   for(const side of['player','opponent']){
    const m=model(view,side),rig=m.userData.battleRig,surface=skin(m),support=feet(m);all.push(...surface);assert.equal(rig.legs.length,6);assert.ok(support.filter(f=>Math.abs(f.point.y)<2e-5).length>=2,label+' lacks real supporting feet');
    for(const leg of rig.legs){metrics.maxReachError=Math.max(metrics.maxReachError,leg.reachError);assert.ok(leg.reachError<.002,`${label} ${side}/${leg.role} reach=${leg.reachError} age=${last.age}`);
     if(rig.species==='giantstag'){
      const a=leg.mesh.geometry.attributes.position,[hip,kneeA,kneeB,foot]=[12,13,26,27].map(i=>new T.Vector3().fromBufferAttribute(a,i).applyMatrix4(leg.mesh.matrixWorld));assert.ok(kneeA.distanceTo(kneeB)<2e-7);
      const error=Math.max(Math.abs(hip.distanceTo(kneeA)-leg.upper*rig.scale),Math.abs(kneeB.distanceTo(foot)-leg.lower*rig.scale));metrics.maxGiantBoneError=Math.max(metrics.maxGiantBoneError,error);assert.ok(error<2e-6,`${label} ${side} giant ${leg.role}/${leg.side} native bone change at ${last.age}: ${error}`);
     }
    }
    for(const p of surface){assert.ok(p.y>=-2e-5,`${label} ${side} skin below floor ${p.y} at ${last.age}`);assert.ok(Math.hypot(p.x,p.z)<platform-.02,label+' outside safe table');const q=p.clone().project(view.camera);assert.ok(Math.abs(q.x)<=.881&&Math.abs(q.y)<=.581&&q.z>=-1&&q.z<=1,label+' actual skin out of frame');}
    if(last.settled)assert.equal(support.filter(f=>Math.abs(f.point.y)<2e-5).length,6,label+' missing six-foot landing');
   }
   if(previous)for(let n=0;n<all.length;n++){const d=all[n].distanceTo(previous[n]);metrics.maxSkinStep=Math.max(metrics.maxSkinStep,d);assert.ok(d<.075,`${label} skin jump=${d} at ${last.age}`);}previous=all;
   if(last.contactActive){held++;const attack=model(view,last.actor).userData.battleRig,defend=model(view,last.actor==='player'?'opponent':'player').userData.battleRig,weapon=attack.weaponWorld(),patch=defend.contactWorld(),actual=new T.Vector3().fromBufferAttribute(attack.weapon.mesh.geometry.attributes.position,attack.weapon.index).applyMatrix4(attack.weapon.mesh.matrixWorld);assert.ok(actual.distanceTo(weapon)<2e-6);assert.ok(triangle(defend).closestPointToPoint(patch,new T.Vector3()).distanceTo(patch)<2e-6,'patch must lie on an actual torso triangle');const gap=weapon.distanceTo(patch);metrics.maxContactGap=Math.max(metrics.maxContactGap,gap);assert.ok(gap<.006,label+' actual jaw/horn-to-body gap');}
   if(last.finished)assert.ok(last.ringOutVisible&&last.settled&&last.age>=1.95,label+' premature final result');
   for(const z of[-.18,0,.18]){const q=new T.Vector3(sign*Math.sqrt(ring*ring-z*z),.001,z).project(view.camera);assert.ok(Math.abs(q.x)<=.881&&Math.abs(q.y)<=.581,label+' ring boundary not visible');}
  }
  assert.ok(held>=15&&last.finished&&last.ringOutVisible);const loser=sign>0?'opponent':'player';assert.equal(last.ringOutSide,loser);const body=model(view,loser).userData.battleRig.torsoBox(new T.Box3()),clearance=(sign>0?body.min.x:-body.max.x)-ring;metrics.minFinalBodyClearance=Math.min(metrics.minFinalBodyClearance,clearance);assert.ok(clearance>=.03499);for(const f of feet(model(view,loser)))assert.ok(sign*f.point.x>ring+.02499);
  view.dispose();metrics.clips++;
 }
 assert.equal(metrics.clips,6);console.log('Measured giant-only CPU metrics:',JSON.stringify(metrics));
});

test('scaled battle pauses and reduced motion cannot mutate independent field/inspection geometry, outcome or any saved data',()=>{
 const field=createInsectModel('giantstag',{sizePermille:1150}),inspection=createInsectModel('giantstag',{inspection:true,sizePermille:1150}),before=[signature(field),signature(inspection)],savedReads=storeCalls.length,s=terminal(1),bytes=JSON.stringify(s),view=createBattleView({playerSpecies:'giantstag',opponentSpecies:'elephant',playerSizePermille:1150});
 for(let n=0;n<20;n++)view.update(s,.02);const pose=signature(view.scene),age=view.getPresentation().age;for(let n=0;n<5;n++){assert.deepEqual(view.update(s,0).events,[]);assert.equal(signature(view.scene),pose);}assert.equal(view.getPresentation().age,age);
 for(let n=0;n<100;n++)view.update(s,.02,{reducedMotion:true});assert.equal(view.getPresentation().finished,true);for(const side of['player','opponent'])assert.equal(feet(model(view,side)).filter(f=>Math.abs(f.point.y)<2e-5).length,6);assert.equal(JSON.stringify(s),bytes);view.reset();assert.equal(view.getPresentation().exchangeNumber,0);view.dispose();assert.deepEqual([signature(field),signature(inspection)],before);assert.equal(storeCalls.length,savedReads);field.userData.dispose();inspection.userData.dispose();
});
