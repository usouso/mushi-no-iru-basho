/** Only maximum-size Atlas: nineteen ordered pairs, both final-push directions.
 * Indexed Three skin/geometry and pure rules, not GPU or human playtesting. */
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import{createHash}from'node:crypto';
import{createBattle,advanceBattle,BATTLE_LIMITS}from'../src/beetle-battle.js';
const sandbox={console};vm.runInNewContext(fs.readFileSync(new URL('../assets/vendor/three.min.js',import.meta.url),'utf8'),sandbox);const T=sandbox.THREE,context={};
for(const key of['fillRect','clearRect','beginPath','moveTo','lineTo','bezierCurveTo','quadraticCurveTo','stroke','fill','save','restore','translate','rotate','ellipse','arc','drawImage','closePath','clip'])context[key]=()=>{};context.createLinearGradient=()=>({addColorStop(){}});
globalThis.window={THREE:T};globalThis.document={createElement:()=>({getContext:()=>context})};const storeCalls=[];globalThis.localStorage={getItem:key=>{storeCalls.push(key);return null;},setItem:key=>storeCalls.push(key),removeItem:key=>storeCalls.push(key)};
const{createBattleView}=await import('../src/battle-view.js'),{createInsectModel}=await import('../src/insect-models.js');
const species=['hercules','rhino','stag','metallifer','atlas','giantstag','elephant','goliath','fivehorn','miyama'];
const measured=new Set(['hercules','rhino','stag','metallifer','atlas','giantstag']);
const pairs=species.filter(s=>s!=='atlas').flatMap(s=>[['atlas',s],[s,'atlas']]).concat([['atlas','atlas']]);
const config=([playerSpecies,opponentSpecies],atlasSize=1150)=>({playerSpecies,opponentSpecies,playerSizePermille:playerSpecies==='atlas'?atlasSize:measured.has(playerSpecies)?1150:null,opponentSizePermille:opponentSpecies==='atlas'?atlasSize:measured.has(opponentSpecies)?1150:null});
const model=(view,side)=>view.scene.getObjectByName('battle-'+side).children[0];
function skin(root){const points=[];root.traverse(mesh=>{if(!mesh.isMesh)return;const a=mesh.geometry.attributes.position,index=mesh.geometry.index,seen=new Set();for(let n=0;n<(index?.count??a.count);n++){const i=index?index.getX(n):n;if(seen.has(i))continue;seen.add(i);points.push(new T.Vector3().fromBufferAttribute(a,i).applyMatrix4(mesh.matrixWorld));}});return points;}
function feet(m){return m.userData.battleRig.legs.map(leg=>{const point=leg.foot.clone().applyMatrix4(leg.mesh.matrixWorld);assert.ok(Math.min(...skin(leg.mesh).map(p=>p.distanceTo(point)))<2e-6,'support endpoint belongs to actual indexed leg skin');return{leg,point};});}
function triangle(rig){const{mesh,triangleIndex}=rig.contactPatch,a=mesh.geometry.attributes.position,index=mesh.geometry.index;return new T.Triangle(...[0,1,2].map(n=>new T.Vector3().fromBufferAttribute(a,index?index.getX(triangleIndex*3+n):triangleIndex*3+n).applyMatrix4(mesh.matrixWorld)));}
function terminal(sign){return Object.freeze({phase:'finished',position:sign*4,winner:sign>0?'player':'opponent',finishReason:'ring-out',exchanges:20,lastExchange:Object.freeze({number:20,playerAction:sign>0?'push':'brace',opponentAction:sign>0?'brace':'push',positionBefore:sign*3.65,positionAfter:sign*4,delta:sign*.35})});}
function signature(m){m.updateMatrixWorld(true);const h=createHash('sha256');m.traverse(n=>{h.update(JSON.stringify([n.name,...n.matrixWorld.elements]));for(const a of Object.values(n.geometry?.attributes||{}))h.update(Buffer.from(a.array.buffer,a.array.byteOffset,a.array.byteLength));});return h.digest('hex');}

function legacyPoseHash(atlasSize=null){const h=createHash('sha256');for(const pair of[['atlas','rhino'],['atlas','hercules'],['miyama','atlas'],['atlas','atlas']])for(const sign of[-1,1]){const view=createBattleView({...config(pair,atlasSize),aspect:sign>0?.45:16/9}),s=terminal(sign);view.update({phase:'watching',position:s.lastExchange.positionBefore,lastExchange:null},0,{reducedMotion:true});for(let frame=0;frame<52;frame++){const p=view.update(s,.04);if([12,20,36,51].includes(frame)){view.scene.updateMatrixWorld(true);view.camera.updateMatrixWorld(true);h.update(JSON.stringify([pair,sign,frame,p,view.camera.matrixWorld.toArray(),view.camera.projectionMatrix.toArray()]));for(const side of['player','opponent']){const m=model(view,side);h.update(signature(m));h.update(JSON.stringify(m.userData.battleRig.legs.map(l=>({foot:l.foot.toArray(),world:l.worldFoot.toArray(),reach:l.reachError}))));}}}view.dispose();}return h.digest('hex');}
test('all old model sources and Atlas size1000 actual poses preserve frozen 0.33; rules remain byte-identical',()=>{
 // Frozen public 0.33 sources and actual view output, not a patched eligibility surrogate.
 const oldFiles=["atlas-kinematics.js", "atlas-model.js", "bee-kinematics.js", "bee-model.js", "diving-kinematics.js", "diving-model.js", "dung-kinematics.js", "dung-model.js", "elephant-kinematics.js", "elephant-model.js", "five-horn-kinematics.js", "five-horn-model.js", "giant-stag-kinematics.js", "giant-stag-model.js", "goliath-kinematics.js", "goliath-model.js", "jewel-kinematics.js", "jewel-model.js", "ladybird-kinematics.js", "ladybird-model.js", "longhorn-kinematics.js", "longhorn-model.js", "mantis-kinematics.js", "mantis-model.js", "metallifer-kinematics.js", "metallifer-model.js", "miyama-kinematics.js", "miyama-model.js", "rhino-kinematics.js", "rhino-model.js", "stag-kinematics.js", "stag-model.js", "strider-kinematics.js", "swallowtail-kinematics.js", "swallowtail-model.js"],hash=createHash('sha256');for(const file of oldFiles)hash.update(file).update(fs.readFileSync(new URL('../src/'+file,import.meta.url),'utf8').replace(/\?v=[^'"\s]+/g,''));assert.equal(hash.digest('hex'),'4c964abd121e53db462f80d996e1f702f8dae1d7a52384c8d842090c5a9c860e');
 const factory=fs.readFileSync(new URL('../src/insect-models.js',import.meta.url),'utf8').replace("'metallifer','giantstag','atlas'].includes(species)","'metallifer','giantstag'].includes(species)").replace(/\?v=[^'"\s]+/g,'');assert.equal(createHash('sha256').update(factory).digest('hex'),'8f3da55c47548f02d66dcdcd9c3e315a617fb66ed9834cc33732f32b689e675e','only the exact measured Atlas eligibility is excluded; old inline and imported art stays unchanged');
 assert.equal(createHash('sha256').update(fs.readFileSync(new URL('../src/beetle-battle.js',import.meta.url))).digest('hex'),'57fcb24bc7f6ad1489e544a614654fa44f4460c354bfb80c6774d591cdeb8bfb');
 assert.equal(legacyPoseHash(1000),'166c11e9fbf078e6bf287db9c5e5694487e854bc678dbef1e6b4cf1815f681b2','32 actual geometry/foot/camera/presentation samples from 8 frozen baseline clips');
});

test('nineteen ordered max-Atlas pairs / both terminal directions preserve actual skin contact, native bones, feet, ring-out and frame',()=>{
 const metrics={pairs:19,clips:0,maxContactGap:0,maxReachError:0,maxSkinStep:0,maxAtlasBoneError:0,minFinalBodyClearance:Infinity};
 for(const pair of pairs)for(const sign of[-1,1]){
  const options=config(pair),view=createBattleView({...options,aspect:sign>0?.45:16/9}),s=terminal(sign),bytes=JSON.stringify(s),label=`${pair.join('/')} max ${sign}`;
  const ring=view.scene.getObjectByName('battle-ring').geometry.parameters.radius,platform=view.scene.getObjectByName('battle-stump').geometry.parameters.radiusTop;
  for(const side of['player','opponent']){const expected=(options[side+'SizePermille']??1000)/1000;assert.equal(model(view,side).scale.x,expected);assert.equal(model(view,side).userData.battleRig.scale,expected);}
  const initial=new T.Box3().setFromObject(view.scene.getObjectByName('battle-player')).union(new T.Box3().setFromObject(view.scene.getObjectByName('battle-opponent')));assert.ok(Math.abs(ring-(Math.max(.65,Math.abs(initial.min.x),Math.abs(initial.max.x))+.36)*.78)<1e-10,'ring is not shrunk for large specimens');
  view.update({phase:'watching',position:s.lastExchange.positionBefore,lastExchange:null},0,{reducedMotion:true});let previous=null,held=0,last;
  for(let frame=0;frame<52;frame++){
   last=view.update(s,.04);view.scene.updateMatrixWorld(true);view.camera.updateMatrixWorld(true);assert.equal(JSON.stringify(s),bytes);const all=[];
   for(const side of['player','opponent']){
    const m=model(view,side),rig=m.userData.battleRig,surface=skin(m),support=feet(m);all.push(...surface);assert.equal(rig.legs.length,6);assert.ok(support.filter(f=>Math.abs(f.point.y)<2e-5).length>=2,label+' lacks real supporting feet');
    for(const leg of rig.legs){metrics.maxReachError=Math.max(metrics.maxReachError,leg.reachError);assert.ok(leg.reachError<.002,`${label} ${side}/${leg.role} reach=${leg.reachError} age=${last.age}`);
     if(rig.species==='atlas'){
      const a=leg.mesh.geometry.attributes.position,[hip,kneeA,kneeB,foot]=[12,13,26,27].map(i=>new T.Vector3().fromBufferAttribute(a,i).applyMatrix4(leg.mesh.matrixWorld));assert.ok(kneeA.distanceTo(kneeB)<2e-7);
      const error=Math.max(Math.abs(hip.distanceTo(kneeA)-leg.upper*rig.scale),Math.abs(kneeB.distanceTo(foot)-leg.lower*rig.scale));metrics.maxAtlasBoneError=Math.max(metrics.maxAtlasBoneError,error);assert.ok(error<2e-6,`${label} ${side} Atlas ${leg.role}/${leg.side} native bone change at ${last.age}: ${error}`);
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
 assert.equal(metrics.clips,38);console.log('Measured Atlas-only CPU metrics:',JSON.stringify(metrics));
});

test('scaled Atlas lifecycle preserves pause/reduced/reset, independent models, pure rules and all saved data',()=>{
 assert.equal(pairs.length,19);assert.equal(BATTLE_LIMITS.ring,4);assert.equal(BATTLE_LIMITS.maxSeconds,59.6);for(const pair of pairs)for(const seed of[0,17]){const plain={playerSpecies:pair[0],opponentSpecies:pair[1],seed},s=advanceBattle(createBattle(plain),100);assert.deepEqual(advanceBattle(createBattle({...config(pair),seed}),100),s);if(s.winner==='draw')assert.ok(Math.abs(s.position)<4&&s.finishReason==='time-limit');else assert.equal(s.position,s.winner==='player'?4:-4);}
 const field=createInsectModel('atlas',{sizePermille:1150}),inspection=createInsectModel('atlas',{inspection:true,sizePermille:1150}),before=[signature(field),signature(inspection)],savedReads=storeCalls.length,s=terminal(1),bytes=JSON.stringify(s),view=createBattleView({playerSpecies:'atlas',opponentSpecies:'elephant',playerSizePermille:1150});
 for(let n=0;n<20;n++)view.update(s,.02);const pose=signature(view.scene),age=view.getPresentation().age;for(let n=0;n<5;n++){assert.deepEqual(view.update(s,0).events,[]);assert.equal(signature(view.scene),pose);}assert.equal(view.getPresentation().age,age);
 for(let n=0;n<100;n++)view.update(s,.02,{reducedMotion:true});assert.equal(view.getPresentation().finished,true);for(const side of['player','opponent'])assert.equal(feet(model(view,side)).filter(f=>Math.abs(f.point.y)<2e-5).length,6);assert.equal(JSON.stringify(s),bytes);view.reset();assert.equal(view.getPresentation().exchangeNumber,0);view.dispose();assert.deepEqual([signature(field),signature(inspection)],before);assert.equal(storeCalls.length,savedReads);field.userData.dispose();inspection.userData.dispose();
});

test('available real bone centres on both sides retain native lengths at six key poses; tube-only Metallifer is explicit',()=>{
 const metrics={clips:0,keyPoses:0,bones:0,maxBoneError:0,tubeOnlyRigSamples:0};
 for(const pair of pairs)for(const sign of[-1,1]){
  const view=createBattleView({...config(pair)}),s=terminal(sign),label=pair.join('/')+' '+sign,indices=new Map();
  for(const side of['player','opponent'])for(const leg of model(view,side).userData.battleRig.legs){
   // Metallifer is a closed ring-only tube: it has no joint-centre vertices.
   // Do not invent a centre by averaging a bent/skinned ring or relax its length
   // tolerance. Its real skin, feet, contact and reach remain covered above.
   if(model(view,side).userData.battleRig.species==='metallifer')continue;
   const centres=leg.points.slice(0,3).map(point=>{let index=-1,min=Infinity;for(let i=0;i<leg.original.length/3;i++){const d=new T.Vector3().fromArray(leg.original,i*3).distanceTo(point);if(d<min){min=d;index=i;}}assert.ok(min<2e-7,`${label} ${side} ${leg.role} has a real original bone centre`);return index;});indices.set(leg,centres);
  }
  view.update({phase:'watching',position:s.lastExchange.positionBefore,lastExchange:null},0,{reducedMotion:true});
  for(let frame=0;frame<52;frame++){const p=view.update(s,.04);if(![4,12,20,30,39,50].includes(frame))continue;metrics.keyPoses++;
   for(const side of['player','opponent']){const rig=model(view,side).userData.battleRig;if(rig.species==='metallifer'){metrics.tubeOnlyRigSamples++;continue;}for(const leg of rig.legs){const a=leg.mesh.geometry.attributes.position,[hip,knee,ankle]=indices.get(leg).map(i=>new T.Vector3().fromBufferAttribute(a,i).applyMatrix4(leg.mesh.matrixWorld)),error=Math.max(Math.abs(hip.distanceTo(knee)-leg.upper*rig.scale),Math.abs(knee.distanceTo(ankle)-leg.lower*rig.scale));metrics.maxBoneError=Math.max(metrics.maxBoneError,error);metrics.bones+=2;assert.ok(error<2e-6,`${label} ${side}/${rig.species}/${leg.role}/${leg.side} age=${p.age} native skin bone error=${error}`);}}
  }view.dispose();metrics.clips++;
 }assert.equal(metrics.clips,38);assert.equal(metrics.keyPoses,228);assert.equal(metrics.tubeOnlyRigSamples,24);assert.equal(metrics.bones,5184);console.log('Atlas-pair both-side actual bone metrics:',JSON.stringify(metrics));
});
