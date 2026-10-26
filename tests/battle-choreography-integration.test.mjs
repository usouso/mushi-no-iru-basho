/** Actual Three.js skin/projection and presentation lifecycle checks. Canvas and
 * storage are doubles: not rendered WebGL, listening, biology or fun evidence. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {createBattle,advanceBattle,cancelBattle} from '../src/beetle-battle.js';
const sandbox={console};vm.runInNewContext(fs.readFileSync(new URL('../assets/vendor/three.min.js',import.meta.url),'utf8'),sandbox);
const T=sandbox.THREE,context={};
for(const name of ['fillRect','clearRect','beginPath','moveTo','lineTo','bezierCurveTo','quadraticCurveTo','stroke','fill','save','restore','translate','rotate','ellipse','arc','drawImage','closePath','clip'])context[name]=()=>{};
context.createLinearGradient=()=>({addColorStop(){}});
globalThis.window={THREE:T};globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>context})};
const storageCalls=[];globalThis.localStorage={getItem(key){storageCalls.push(['read',key]);return null;},setItem(key){storageCalls.push(['write',key]);},removeItem(key){storageCalls.push(['remove',key]);}};
const {createBattleView}=await import('../src/battle-view.js');
const species=['hercules','rhino','stag','metallifer'];
const vector=p=>new T.Vector3(p.x,p.y,p.z);
const anchor=(view,side)=>view.scene.getObjectByName('battle-'+side);
const model=(view,side)=>anchor(view,side).children[0];
const skinFeet=m=>(m.userData.battleRig?.legs||m.userData.visual?.userData.legs||m.userData.legs).map(leg=>{
 const foot=vector(leg.foot||leg.mesh.userData.foot).applyMatrix4(leg.mesh.matrixWorld),positions=leg.mesh.geometry.attributes.position,p=new T.Vector3();let gap=Infinity;
 for(let n=0;n<positions.count;n++)gap=Math.min(gap,p.fromBufferAttribute(positions,n).applyMatrix4(leg.mesh.matrixWorld).distanceTo(foot));
 assert.ok(gap<2e-6,`${m.userData.species} ${leg.role||leg.index} foot is ${gap}m off real skin (reach=${leg.reachError??'n/a'})`);return foot;
});
function state(direction=1,number=1){const delta=.35*Math.sign(direction);return Object.freeze({phase:'watching',position:delta,exchanges:number,lastExchange:Object.freeze({number,playerAction:delta>0?'push':'brace',opponentAction:delta>0?'brace':'push',positionBefore:0,positionAfter:delta,delta,reason:'display fixture'})});}
function visualState(view){view.scene.updateMatrixWorld(true);const rows=[];view.scene.traverse(n=>{rows.push([n.name,n.visible,...n.matrixWorld.elements]);if(n.geometry?.attributes.position)rows.push(Array.from(n.geometry.attributes.position.array));if(n.material?.opacity!==undefined)rows.push(n.material.opacity);});return createHash('sha256').update(JSON.stringify([rows,view.camera.projectionMatrix.toArray()])).digest('hex');}

// The result fixture follows the requested ring-out-only rule. Size, poses and
// contacts never feed back into the resolved result or the retained roster.
test('hash-pinned old four-species outcomes and current ring-out snapshots remain independent of presentation and storage',async()=>{
 const source=fs.readFileSync(new URL('../src/beetle-battle.js',import.meta.url),'utf8');
 // Only 0.24's documented stag-edge coefficient and 0.25's registry addition
 // differ from this old fixture. Do not replace the historical outcome hash.
 const referenceSource=source.replace(",\n elephant:{label:'ゾウカブト',role:'丸い体で押し合う',help:'太い胴と前へ伸びた頭角が目印。'}",'').replace("if(species==='stag'&&ownPosition<=-1.5)return .05;","if(species==='stag'&&ownPosition<=-1.5)return .10;");
 assert.equal(createHash('sha256').update(referenceSource).digest('hex'),'8efcca57b8e5c24935fcac053661aed18ce81a250828f4ab901dcab727c6e55b');
 const reference=await import('data:text/javascript;base64,'+Buffer.from(referenceSource).toString('base64'));
 const outcomes=[],referenceOutcomes=[];
 for(const p of species)for(const o of species){const wins=new Set();for(let seed=0;seed<32;seed++){
  const s=advanceBattle(createBattle({playerSpecies:p,opponentSpecies:o,seed}),100);outcomes.push(s);wins.add(s.winner);const prior=reference.advanceBattle(reference.createBattle({playerSpecies:p,opponentSpecies:o,seed}),100);referenceOutcomes.push(prior);if(p!=='stag'&&o!=='stag')assert.deepEqual(s,prior);
  assert.equal(s.phase,'finished');assert.ok(s.elapsed>=16.4&&s.elapsed<=59.6);assert.ok(s.exchanges>=9&&s.exchanges<=36);
  if(s.winner==='draw'){assert.equal(s.finishReason,'time-limit');assert.ok(Math.abs(s.position)<4);assert.equal(s.exchanges,36);assert.equal(s.elapsed,59.6);}
  else{assert.ok(['player','opponent'].includes(s.winner));assert.equal(s.finishReason,'ring-out');assert.equal(s.position,s.winner==='player'?4:-4);}
 }assert.ok(wins.has('player')&&wins.has('opponent'),`${p}/${o} supports both ring-out winners`);}
 assert.equal(outcomes.length,512);assert.equal(createHash('sha256').update(JSON.stringify(referenceOutcomes)).digest('hex'),'d52859dd3cd6f310f78b6faf317dbdf4ce603f71c367cf16af1d3ffee81aab08');
 const stored={entries:[{species:'rhino',id:'fixed',sizePermille:1150}]},raw=JSON.stringify(stored),calls=storageCalls.length;
 for(const p of species){const view=createBattleView({playerSpecies:p,opponentSpecies:'metallifer',playerSizePermille:1150}),options={playerSpecies:p,opponentSpecies:'metallifer',seed:17},battle=createBattle(options),terminal=advanceBattle(battle,100),bytes=JSON.stringify(terminal);
  assert.deepEqual(advanceBattle(createBattle({...options,playerSizePermille:1150,opponentSizePermille:1000,level:99}),100),terminal,'model size and retained level are not rule inputs');
  for(let i=0;i<80;i++)view.update(terminal,1/60);assert.equal(JSON.stringify(terminal),bytes);assert.equal(cancelBattle(terminal),terminal);view.dispose();
 }
 assert.equal(JSON.stringify(stored),raw);assert.equal(storageCalls.length,calls,'view never reads/writes/deletes retained storage');
});

test('zero-dt suspension freezes every skin, anchor and camera; resume advances from that pose and reduced-motion is static',()=>{
 for(const p of species)for(const o of species){
  const view=createBattleView({playerSpecies:p,opponentSpecies:o,playerSizePermille:1150,opponentSizePermille:1000}),s=state();for(let n=0;n<9;n++)view.update(s,.02);
  const frozen=visualState(view);for(let n=0;n<20;n++)view.update(s,0);assert.equal(visualState(view),frozen,`${p}/${o} hidden frame advanced`);
  for(let n=0;n<15;n++)view.update(s,.02);assert.notEqual(visualState(view),frozen,`${p}/${o} did not resume`);
  view.update(s,0,{reducedMotion:true});const reduced=visualState(view);for(let n=0;n<40;n++)view.update(s,.04,{reducedMotion:true});assert.equal(visualState(view),reduced,`${p}/${o} reduced motion oscillates`);
  for(const side of ['player','opponent'])assert.ok(skinFeet(model(view,side)).filter(p=>Math.abs(p.y)<2e-5).length>=3,'reduced pose stays supported');
  const geometries=new Set(),materials=new Set(),textures=new Set();view.scene.traverse(n=>{if(n.geometry)geometries.add(n.geometry);for(const m of n.material?(Array.isArray(n.material)?n.material:[n.material]):[]){materials.add(m);for(const v of Object.values(m))if(v?.isTexture)textures.add(v);}});
  const events=new Map();for(const r of [...geometries,...materials,...textures]){events.set(r,0);r.addEventListener('dispose',()=>events.set(r,events.get(r)+1));}
  view.dispose();view.dispose();view.update(s,.1);view.resize(.45);assert.equal(view.scene.children.length,0);for(const r of [...geometries,...materials])assert.equal(events.get(r),1);for(const r of textures)assert.equal(events.get(r),0,'shared field texture remains owned by its cache');
 }
});

test('presentation start/contact/settled events are emitted once in order, never on frozen frames or resume replay',()=>{
 const view=createBattleView({playerSpecies:'hercules',opponentSpecies:'metallifer'}),s=state(),events=[];
 for(let n=0;n<5;n++)assert.deepEqual(view.update(s,0).events,[],'first snapshot on a hidden frame cannot sound');
 for(let n=0;n<20;n++)events.push(...view.update(s,.02).events);
 assert.deepEqual(events.map(e=>e.type),['started']);const frozen=visualState(view);
 for(let n=0;n<80;n++)assert.deepEqual(view.update(s,0).events,[]);assert.equal(visualState(view),frozen);
 for(let n=0;n<65;n++)events.push(...view.update(s,.02).events);
 assert.deepEqual(events.map(e=>e.type),['started','contact','settled']);assert.equal(new Set(events.map(e=>e.key)).size,1);for(const e of events)assert.deepEqual(e.exchange,s.lastExchange);
 for(let n=0;n<80;n++)assert.deepEqual(view.update(s,.02).events,[],'settled snapshot must not replay');
 const next=state(-1,2),other=[];assert.deepEqual(view.update(next,0).events,[]);for(let n=0;n<80;n++)other.push(...view.update(next,.02).events);
 assert.deepEqual(other.map(e=>e.type),['started','contact','settled']);assert.notEqual(other[0].key,events[0].key);
 view.dispose();
});

function contactTriangle(rig){
 const {mesh,triangleIndex}=rig.contactPatch,attribute=mesh.geometry.attributes.position,index=mesh.geometry.index,points=[];
 for(let n=0;n<3;n++)points.push(new T.Vector3().fromBufferAttribute(attribute,index?index.getX(triangleIndex*3+n):triangleIndex*3+n).applyMatrix4(mesh.matrixWorld));
 return new T.Triangle(...points);
}
function actualIndexedBox(mesh){const box=new T.Box3(),p=new T.Vector3(),a=mesh.geometry.attributes.position,index=mesh.geometry.index;for(let n=0;n<(index?.count??a.count);n++)box.expandByPoint(p.fromBufferAttribute(a,index?index.getX(n):n).applyMatrix4(mesh.matrixWorld));return box;}
function torsoBox(rig){rig.syncSurfaces();const box=new T.Box3();for(const mesh of rig.torsoMeshes)box.union(actualIndexedBox(mesh));return box;}
function allSkinWorld(m){const out=[];m.traverse(n=>{if(!n.isMesh)return;const a=n.geometry.attributes.position,index=n.geometry.index,seen=new Set();for(let k=0;k<(index?.count??a.count);k++){const i=index?index.getX(k):k;if(seen.has(i))continue;seen.add(i);out.push(new T.Vector3().fromBufferAttribute(a,i).applyMatrix4(n.matrixWorld));}});return out;}
function assertTorsoSeparation(a,b,label){const overlap=a.clone().intersect(b);if(!overlap.isEmpty()){const d=overlap.getSize(new T.Vector3());assert.ok(Math.min(d.x,d.y,d.z)<.006,label+' non-weapon torso bounds have deep volumetric overlap');}}

// The allowed connection is weapon skin against the selected underside patch.
// Body-only bounds are a coarse extra rejection of deep torso overlap, not a
// substitute for the weapon/triangle contact checks below.
test('all 16 pairs and mixed/maximum sizes actually connect weapon to underside, keep support, move continuously and land inside the close camera',()=>{
 const measured={pairs:0,maxContactGap:0,maxFrameTravel:0,maxReachError:0};
 for(const playerSpecies of species)for(const opponentSpecies of species)for(const[playerSizePermille,opponentSizePermille]of[[1000,1150],[1150,1000],[1150,1150]])for(const delta of[-1,1]){
  const view=createBattleView({playerSpecies,opponentSpecies,playerSizePermille,opponentSizePermille,aspect:delta>0?.45:16/9}),s=state(delta),before=[];let held=0,landed=false,previous=null,observedFamily=null;
  for(let frame=0;frame<78;frame++){
   const presentation=view.update(s,.02);view.scene.updateMatrixWorld(true);view.camera.updateMatrixWorld(true);
   const actor=presentation.actor,defender=actor==='player'?'opponent':'player',attackModel=model(view,actor),defendModel=model(view,defender),attack=attackModel.userData.battleRig,defend=defendModel.userData.battleRig;
   assert.ok(attack&&defend,'each independent model has a battle-only rig');observedFamily=presentation.family;
   for(const rig of[attack,defend])for(const leg of rig.legs){measured.maxReachError=Math.max(measured.maxReachError,leg.reachError||0);assert.ok(leg.reachError<.002,`${playerSpecies}/${opponentSpecies} ${rig.species} ${leg.role} exceeds native leg reach by ${leg.reachError}m`);}
   const points=[];for(const side of ['player','opponent']){
    const m=model(view,side),feet=skinFeet(m),skin=allSkinWorld(m);points.push(...skin);
    assert.ok(feet.every(p=>p.y>=-2e-5),`${playerSpecies}/${opponentSpecies} foot below table`);
    assert.ok(skin.every(p=>p.y>=-2e-5),`${playerSpecies}/${opponentSpecies} skin below table`);
    assert.ok(feet.filter(p=>Math.abs(p.y)<2e-5).length>=2,`${playerSpecies}/${opponentSpecies} lacks rear support`);
    for(const p of skin){const q=p.clone().project(view.camera);assert.ok(q.x>=-.881&&q.x<=.881&&q.y>=-.581&&q.y<=.581&&q.z>=-1&&q.z<=1,`${playerSpecies}/${opponentSpecies} actual skin outside frame`);}
   }
   if(previous){assert.equal(points.length,previous.length);for(let n=0;n<points.length;n++){const d=points[n].distanceTo(previous[n]);measured.maxFrameTravel=Math.max(measured.maxFrameTravel,d);assert.ok(d<.045,`${playerSpecies}/${opponentSpecies} skin jumps ${d}m at frame ${frame}`);}}previous=points;
   assertTorsoSeparation(torsoBox(attack),torsoBox(defend),`${playerSpecies}/${opponentSpecies}`);
   if(presentation.contactActive){
    held++;const weapon=attack.weaponWorld(),patch=defend.contactWorld(),triangle=contactTriangle(defend),onSkin=triangle.closestPointToPoint(patch,new T.Vector3());assert.ok(onSkin.distanceTo(patch)<2e-6,'defender target lies on the actual indexed skin triangle');
    const mesh=attack.weapon.mesh,actual=new T.Vector3().fromBufferAttribute(mesh.geometry.attributes.position,attack.weapon.index).applyMatrix4(mesh.matrixWorld);assert.ok(actual.distanceTo(weapon)<2e-6,'weapon target lies on the actual displayed horn/jaw');
    const gap=weapon.distanceTo(patch);measured.maxContactGap=Math.max(measured.maxContactGap,gap);assert.ok(gap<.006,`${playerSpecies}/${opponentSpecies} staged contact is ${gap}m away from real body`);
   }
   if(presentation.stage==='settled'){
    landed=true;for(const side of['player','opponent'])assert.equal(skinFeet(model(view,side)).filter(p=>Math.abs(p.y)<2e-5).length,6,'all feet return after release');
   }
  }
  assert.ok(held>=20,'contact is held visibly for multiple frames, not a one-frame teleport');assert.ok(landed);assert.equal(observedFamily,['stag','metallifer'].includes(delta>0?playerSpecies:opponentSpecies)?'jaw':'horn');measured.pairs++;view.dispose();
 }
 console.log('CPU choreography contact metrics (not a rendered playtest):',JSON.stringify(measured));
});
