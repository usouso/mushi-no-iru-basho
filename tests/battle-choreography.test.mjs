import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {BATTLE_CHOREOGRAPHY as timing,sampleBattleChoreography as sample} from '../src/battle-choreography.js';

test('paired presentation phases are bounded and continuous without changing the resolved exchange',()=>{
 const exchange=Object.freeze({number:1,delta:1,positionBefore:0,positionAfter:1}),before=JSON.stringify(exchange);
 for(const t of [0,.06,.18,.46,.54,.8,.96,1.30,1.42]){
  const a=sample(exchange,t-1e-7,{playerSpecies:'rhino',opponentSpecies:'metallifer'}),b=sample(exchange,t+1e-7,{playerSpecies:'rhino',opponentSpecies:'metallifer'});
  for(const key of ['contact','drive','crouch','translation','footRecovery'])assert.ok(Math.abs(a[key]-b[key])<.0001,`${key} jumps at ${t}`);
 }
 assert.equal(timing.contactSeconds,.46);assert.equal(timing.settledSeconds,1.42);
 assert.equal(sample(exchange,.46,{}).contactActive,true);assert.equal(sample(exchange,.96,{}).contactActive,false);assert.equal(sample(exchange,1.42,{}).settled,true);
 assert.equal(JSON.stringify(exchange),before);
});

test('the actual initiating species chooses horn or jaw presentation, not a new combat rule or random draw',()=>{
 for(const p of ['rhino','hercules','stag','metallifer'])for(const o of ['rhino','hercules','stag','metallifer'])for(const delta of[-1,0,1]){
  const exchange={number:2,delta},pose=sample(exchange,.8,{playerSpecies:p,opponentSpecies:o}),actor=delta>0?'player':'opponent',species=actor==='player'?p:o;
  assert.equal(pose.actor,actor);assert.equal(pose.family,['stag','metallifer'].includes(species)?'jaw':'horn');assert.equal(pose.drive,delta===0?0:1);
  const reduced=sample(exchange,.72,{playerSpecies:p,opponentSpecies:o,reducedMotion:true});assert.equal(reduced.contact,0);assert.equal(reduced.drive,0);assert.equal(reduced.translation,1);
 }
});

test('battle-only Rhino head articulation moves head, horn, eyes and antennae together and restores their exact original geometry',async()=>{
 const sandbox={console};vm.runInNewContext(fs.readFileSync(new URL('../assets/vendor/three.min.js',import.meta.url),'utf8'),sandbox);globalThis.window={THREE:sandbox.THREE};
 const {createRhinoModel}=await import('../src/rhino-model.js');const {createBattleRig}=await import('../src/battle-pose.js');const T=sandbox.THREE;
 const untouched=createRhinoModel({inspection:true}),model=createRhinoModel({inspection:true});model.position.y=.05;model.updateMatrixWorld(true);const rig=createBattleRig(model,'rhino');
 const parts=[model.userData.hornMesh,model.userData.bodyMesh,model.getObjectByName('rhino-eyes'),model.getObjectByName('rhino-two-short-antennae')],originals=parts.map(m=>new Float32Array(m.geometry.attributes.position.array)),pivot=new T.Vector3(...model.userData.bodyMesh.userData.battleHead.pivot),q=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),.4);
 rig.setWeaponPitch(.4);
 for(let i=0;i<parts.length;i++){const a=parts[i].geometry.attributes.position,start=i===1?model.userData.bodyMesh.userData.battleHead.start:0,count=i===0?model.userData.hornMesh.userData.headHornVertexCount:i===1?model.userData.bodyMesh.userData.battleHead.count:a.count;for(let n=start;n<start+count;n++){const expected=new T.Vector3().fromArray(originals[i],n*3).sub(pivot).applyQuaternion(q).add(pivot),actual=new T.Vector3().fromBufferAttribute(a,n);assert.ok(actual.distanceTo(expected)<1e-7);} }
 const count=model.userData.bodyMesh.userData.battleHead.start;assert.deepEqual(Array.from(parts[1].geometry.attributes.position.array.slice(0,count*3)),Array.from(originals[1].slice(0,count*3)),'abdomen/pronotum are not head bones');
 assert.deepEqual(Array.from(untouched.userData.hornMesh.geometry.attributes.position.array),Array.from(originals[0]),'independent field/inspection geometry stays original');
 rig.restore();parts.forEach((m,i)=>assert.deepEqual(Array.from(m.geometry.attributes.position.array),Array.from(originals[i])));rig.dispose();
});
