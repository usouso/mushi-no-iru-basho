/** Atlas-only real Three.js choreography audit. The renderer, audio and browser
 * are not exercised; CPU contact/projection is not a rendered playtest. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {createBattle,advanceBattle} from '../src/beetle-battle.js';
import {RING_OUT_CHOREOGRAPHY} from '../src/battle-choreography.js';
const sandbox={console};vm.runInNewContext(fs.readFileSync(new URL('../assets/vendor/three.min.js',import.meta.url),'utf8'),sandbox);
const T=sandbox.THREE,context={};
for(const name of ['fillRect','clearRect','beginPath','moveTo','lineTo','bezierCurveTo','quadraticCurveTo','stroke','fill','save','restore','translate','rotate','ellipse','arc','drawImage','closePath','clip'])context[name]=()=>{};
context.createLinearGradient=()=>({addColorStop(){}});
globalThis.window={THREE:T};globalThis.document={createElement:()=>({getContext:()=>context})};
const storageCalls=[];globalThis.localStorage={getItem(key){storageCalls.push(['read',key]);return null;},setItem(key){storageCalls.push(['write',key]);},removeItem(key){storageCalls.push(['remove',key]);}};
const {createBattleView}=await import('../src/battle-view.js');
const {createInsectModel}=await import('../src/insect-models.js');
const otherSpecies=['rhino','hercules','stag','metallifer'];
const anchor=(view,side)=>view.scene.getObjectByName('battle-'+side);
const model=(view,side)=>anchor(view,side).children[0];
const vector=p=>new T.Vector3(p.x,p.y,p.z);
function state(delta){return Object.freeze({phase:'watching',position:delta,exchanges:1,lastExchange:Object.freeze({number:1,playerAction:'evade',opponentAction:'brace',positionBefore:0,positionAfter:delta,delta,reason:'Atlas presentation fixture'})});}
function skinPoints(mesh){const a=mesh.geometry.attributes.position,index=mesh.geometry.index,seen=new Set(),points=[];for(let n=0;n<(index?.count??a.count);n++){const i=index?index.getX(n):n;if(seen.has(i))continue;seen.add(i);points.push(new T.Vector3().fromBufferAttribute(a,i).applyMatrix4(mesh.matrixWorld));}return points;}
function allSkin(m){const points=[];m.traverse(n=>{if(n.isMesh)points.push(...skinPoints(n));});return points;}
function feet(m){return m.userData.battleRig.legs.map(leg=>{const point=vector(leg.foot).applyMatrix4(leg.mesh.matrixWorld),gap=Math.min(...skinPoints(leg.mesh).map(p=>p.distanceTo(point)));assert.ok(gap<2e-6,'solved foot is on the actual leg skin');return{leg,point};});}
function triangle(rig){const {mesh,triangleIndex}=rig.contactPatch,a=mesh.geometry.attributes.position,index=mesh.geometry.index;return new T.Triangle(...[0,1,2].map(n=>new T.Vector3().fromBufferAttribute(a,index?index.getX(triangleIndex*3+n):triangleIndex*3+n).applyMatrix4(mesh.matrixWorld)));}
function signature(m){m.updateMatrixWorld(true);const hash=createHash('sha256');m.traverse(n=>{hash.update(JSON.stringify([n.name,...n.matrixWorld.elements]));for(const a of Object.values(n.geometry?.attributes||{})){const bytes=a.array;hash.update(Buffer.from(bytes.buffer,bytes.byteOffset,bytes.byteLength));}});return hash.digest('hex');}
function pairs(){const list=[];for(const other of otherSpecies)for(const size of[1000,1150]){list.push({playerSpecies:'atlas',opponentSpecies:other,playerSizePermille:null,opponentSizePermille:size});list.push({playerSpecies:other,opponentSpecies:'atlas',playerSizePermille:size,opponentSizePermille:null});}list.push({playerSpecies:'atlas',opponentSpecies:'atlas',playerSizePermille:null,opponentSizePermille:null});return list;}

// Nine distinct species pairs; measured opponents have minimum/maximum size.
// Atlas is still the same fixed, unmeasured individual, never a new size roll.
test('Atlas versus each supported beetle in both roles connects real horn/underside skins, keeps all three horns framed and lands on six feet',()=>{
 const metrics={speciesPairs:new Set(),clips:0,maxContactGap:0,maxFrameTravel:0,maxReachError:0};
 for(const config of pairs())for(const delta of[-.45,.45]){
  metrics.speciesPairs.add(config.playerSpecies+'/'+config.opponentSpecies);const view=createBattleView({...config,aspect:delta>0?.45:16/9}),snapshot=state(delta),bytes=JSON.stringify(snapshot),label=`${config.playerSpecies}/${config.opponentSpecies} ${delta}`;let previous=null,held=0,landed=false;
  for(const side of['player','opponent'])if(model(view,side).userData.species==='atlas'){
   const m=model(view,side),rig=m.userData.battleRig;assert.deepEqual(Array.from(m.scale.toArray()),[1,1,1]);assert.equal(rig.scale,1);assert.equal(m.userData.horns.length,3);
   assert.equal(rig.weapon.mesh,m.userData.horns.find(h=>h.role==='head-horn').mesh,'the head horn, not a guessed array index or thorax horn, is the active weapon');
   assert.equal(rig.legs.length,6);assert.deepEqual(rig.legs.map(l=>l.role+':'+l.side).sort(),['front:-1','front:1','hind:-1','hind:1','middle:-1','middle:1']);
   for(const leg of rig.legs){assert.equal(leg.role,leg.mesh.userData.legRole);assert.equal(leg.side,leg.mesh.userData.side);}
  }
  for(let n=0;n<78;n++){
   const p=view.update(snapshot,.02);view.scene.updateMatrixWorld(true);view.camera.updateMatrixWorld(true);assert.equal(JSON.stringify(snapshot),bytes);const points=[];
   for(const side of['player','opponent']){
    const m=model(view,side),rig=m.userData.battleRig,skin=allSkin(m),f=feet(m);points.push(...skin);
    for(const leg of rig.legs){metrics.maxReachError=Math.max(metrics.maxReachError,leg.reachError||0);assert.ok(leg.reachError<.002,`${label} ${rig.species} ${leg.role} exceeds its native leg reach`);}
    assert.ok(skin.every(q=>q.y>=-2e-5),label+' actual skin passes below the table');assert.ok(f.filter(q=>Math.abs(q.point.y)<2e-5).length>=2,label+' has no rear support');
    if(side!==p.actor&&p.contactActive)for(const q of f.filter(q=>q.leg.role==='hind'))assert.ok(Math.abs(q.point.y)<2e-5,label+' lifted defender loses a hind support foot');
    for(const q of skin){const projected=q.clone().project(view.camera);assert.ok(projected.x>=-.881&&projected.x<=.881&&projected.y>=-.581&&projected.y<=.581&&projected.z>=-1&&projected.z<=1,label+' actual skin is outside the close camera');}
    if(m.userData.species==='atlas'){
     for(const horn of m.userData.horns){assert.equal(horn.mesh.visible,true);assert.ok(skinPoints(horn.mesh).every(q=>{const v=q.project(view.camera);return v.x>-.881&&v.x<.881&&v.y>-.581&&v.y<.581;}),'all three complete horn skins remain in frame');}
     const head=m.userData.horns.find(h=>h.role==='head-horn'),tip=vector(head.tip).sub(vector(m.userData.headPivotOrigin)).applyMatrix4(m.userData.headPivot.matrixWorld);assert.ok(rig.weaponWorld().distanceTo(tip)<.003,'active weapon reaches the real head-horn tip');
    }
   }
   if(previous){assert.equal(points.length,previous.length);for(let i=0;i<points.length;i++){const distance=points[i].distanceTo(previous[i]);metrics.maxFrameTravel=Math.max(metrics.maxFrameTravel,distance);assert.ok(distance<.045,`${label} skin jumps ${distance}m in 20ms`);}}previous=points;
   if(p.contactActive){held++;const a=model(view,p.actor).userData.battleRig,b=model(view,p.actor==='player'?'opponent':'player').userData.battleRig,weapon=a.weaponWorld(),contact=b.contactWorld(),actualWeapon=new T.Vector3().fromBufferAttribute(a.weapon.mesh.geometry.attributes.position,a.weapon.index).applyMatrix4(a.weapon.mesh.matrixWorld),onTriangle=triangle(b).closestPointToPoint(contact,new T.Vector3());assert.ok(weapon.distanceTo(actualWeapon)<2e-6);assert.ok(contact.distanceTo(onTriangle)<2e-6);const gap=weapon.distanceTo(contact);metrics.maxContactGap=Math.max(metrics.maxContactGap,gap);assert.ok(gap<.006,label+' weapon is not touching the actual underside skin');}
   if(p.settled){landed=true;for(const side of['player','opponent'])assert.equal(feet(model(view,side)).filter(q=>Math.abs(q.point.y)<2e-5).length,6,'six actual feet return after the throw/tilt');}
  }
  assert.ok(held>=20,label+' only has a one-frame contact');assert.ok(landed);metrics.clips++;view.dispose();
 }
 assert.equal(metrics.speciesPairs.size,9);assert.equal(metrics.clips,34);console.log('Atlas-only CPU choreography metrics (not a rendered playtest):',JSON.stringify({...metrics,speciesPairs:metrics.speciesPairs.size}));
});

test('Atlas battle poses cannot mutate the fixed individual, another field model, frozen outcome or saved slots',()=>{
 const field=createInsectModel('atlas'),inspection=createInsectModel('atlas',{inspection:true}),before=[signature(field),signature(inspection)],readCount=storageCalls.length;
 const retained={version:2,legacyImportDone:true,entries:[{id:'understory/insect-5',species:'atlas',originHabitat:'understory',originIndividualId:'insect-5',originKind:'legacy',originEncounterId:null,sizePermille:null,measureVersion:null,capturedAt:1}]},saved=JSON.stringify(retained);
 const battle=advanceBattle(createBattle({playerSpecies:'atlas',opponentSpecies:'metallifer',seed:0}),100),outcome=JSON.stringify(battle),view=createBattleView({playerSpecies:'atlas',opponentSpecies:'metallifer',opponentSizePermille:1150});
 for(let n=0;n<18;n++)view.update(battle,.02);const pose=signature(anchor(view,'player')),events=[];for(let n=0;n<12;n++){assert.deepEqual(view.update(battle,0).events,[]);assert.equal(signature(anchor(view,'player')),pose);}
 const finishFrames=Math.ceil((RING_OUT_CHOREOGRAPHY.settledSeconds-view.getPresentation().age)/.02)+1;
 for(let n=0;n<finishFrames;n++)events.push(...view.update(battle,.02).events);assert.equal(view.getPresentation().settled,true);assert.equal(view.getPresentation().finished,true);assert.deepEqual(events.map(e=>e.type),['contact','settled']);
 view.reset();assert.equal(view.getPresentation().exchangeNumber,0);for(const side of['player','opponent'])assert.equal(feet(model(view,side)).filter(q=>Math.abs(q.point.y)<2e-5).length,6);
 const reduced=state(.45);for(let n=0;n<78;n++)view.update(reduced,.02,{reducedMotion:true});assert.equal(view.getPresentation().settled,true);for(const side of['player','opponent'])assert.equal(feet(model(view,side)).filter(q=>Math.abs(q.point.y)<2e-5).length,6);
 view.dispose();assert.equal(JSON.stringify(battle),outcome);assert.equal(JSON.stringify(retained),saved);assert.equal(storageCalls.length,readCount,'presentation never accesses roster/save keys');assert.deepEqual([signature(field),signature(inspection)],before);field.userData.dispose();inspection.userData.dispose();
});
