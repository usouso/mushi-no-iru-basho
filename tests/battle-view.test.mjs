/** Actual THREE geometry/projection/resource ownership; no rendered-frame claim. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..'),sandbox={console};
vm.runInNewContext(fs.readFileSync(path.join(root,'assets/vendor/three.min.js'),'utf8'),sandbox);
const T=sandbox.THREE,context={};
for(const method of ['fillRect','clearRect','beginPath','moveTo','lineTo','bezierCurveTo','quadraticCurveTo','stroke','fill','save','restore','translate','rotate','ellipse','arc','drawImage','closePath','clip'])context[method]=()=>{};
context.createLinearGradient=()=>({addColorStop(){}});
globalThis.window={THREE:T};globalThis.document={createElement(tag){assert.equal(tag,'canvas');return{width:0,height:0,getContext(){return context;}};}};
const {createBattleView}=await import('../src/battle-view.js');
// Use the same versioned module identity as the view, just as the browser does.
// An unversioned Node import would create a second, unrelated texture cache.
const factorySpecifier=fs.readFileSync(path.join(root,'src/battle-view.js'),'utf8').match(/from ['"](\.\/insect-models\.js[^'"]+)['"]/)?.[1];assert.ok(factorySpecifier);
const {createInsectModel}=await import(new URL(factorySpecifier,new URL('../src/battle-view.js',import.meta.url)));
const ids=['rhino','stag','hercules','metallifer','atlas'],anchor=(view,side)=>view.scene.getObjectByName('battle-'+side);
const model=(view,side)=>anchor(view,side).children[0];
function geometrySignature(node){const hash=createHash('sha256');node.traverse(n=>{n.updateMatrix();hash.update(JSON.stringify([n.type,n.name,Array.from(n.matrix.elements)]));if(n.geometry){for(const key of Object.keys(n.geometry.attributes).sort()){const a=n.geometry.attributes[key];hash.update(key+':'+a.itemSize+':');hash.update(Buffer.from(a.array.buffer,a.array.byteOffset,a.array.byteLength));}if(n.geometry.index){const a=n.geometry.index.array;hash.update(Buffer.from(a.buffer,a.byteOffset,a.byteLength));}}});return hash.digest('hex');}
const materials=node=>{const result=new Set();node.traverse(n=>{if(n.material)for(const m of Array.isArray(n.material)?n.material:[n.material])result.add(m);});return result;};
const pose=view=>['player','opponent'].map(side=>{const a=anchor(view,side);return [...a.position.toArray(),...a.quaternion.toArray()];});
function snapshot(position=0,extras={}){return{phase:'watching',position,elapsed:0,exchanges:0,lastExchange:null,...extras};}
function minSkinY(root){let y=Infinity;const p=new T.Vector3();root.traverse(n=>{const a=n.geometry?.attributes.position;if(!a)return;for(let i=0;i<a.count;i++)y=Math.min(y,p.fromBufferAttribute(a,i).applyMatrix4(n.matrixWorld).y);});return y;}
function assertScene(view){
 view.scene.updateMatrixWorld(true);view.scene.traverse(n=>assert.ok(n.matrixWorld.elements.every(Number.isFinite),n.name));
 for(const side of ['player','opponent']){const m=model(view,side),b=new T.Box3().setFromObject(anchor(view,side));assert.ok(minSkinY(m)>=-2e-5,side+' actual skin cannot pierce table');assert.ok(b.max.y>.05);const rig=m.userData.battleRig;assert.ok(rig);const feet=rig.legs.map(l=>l.foot.clone().applyMatrix4(l.mesh.matrixWorld));assert.ok(feet.filter(p=>Math.abs(p.y)<2e-5).length>=2,side+' retains rear support');}
}
function assertPair(view){
 const p=view.getPresentation(),a=new T.Box3().setFromObject(anchor(view,'player')),b=new T.Box3().setFromObject(anchor(view,'opponent'));
 if(p.settled)assert.ok(b.min.x-a.max.x>=.004-1e-10,'restored neutral silhouettes stay separated');
 if(p.contactActive)assert.ok(view.scene.userData.battleContact.distance<.006,'real weapon and body patch touch');
 const overlap=model(view,'player').userData.battleRig.torsoBox().intersect(model(view,'opponent').userData.battleRig.torsoBox());if(!overlap.isEmpty()){const size=overlap.getSize(new T.Vector3());assert.ok(Math.min(size.x,size.y,size.z)<.006,'torso volumes do not deeply interpenetrate');}
}

test('only the five retained beetles are supported, and every pair faces inward at unchanged inspection scale',()=>{
 assert.throws(()=>createBattleView({playerSpecies:'butterfly',opponentSpecies:'rhino'}),TypeError);
 assert.throws(()=>createBattleView({playerSpecies:'rhino',opponentSpecies:'unknown'}),TypeError);
 for(const playerSpecies of ids)for(const opponentSpecies of ids){
  const view=createBattleView({playerSpecies,opponentSpecies});assertScene(view);
  for(const [side,id,sign]of[['player',playerSpecies,1],['opponent',opponentSpecies,-1]]){
   const n=model(view,side),original=createInsectModel(id,{inspection:true});assert.equal(n.userData.species,id);assert.equal(n.userData.inspection,true);assert.deepEqual(Array.from(n.scale.toArray()),[1,1,1]);assert.equal(geometrySignature(n),geometrySignature(original),id+' original inspection geometry');
   const heading=new T.Vector3(0,0,1).applyQuaternion(anchor(view,side).quaternion);assert.ok(heading.x*sign>.999);assert.ok([...materials(n)].every(m=>!m.customProgramCacheKey().includes('insect-readability')));
  }
  view.dispose();
 }
});

test('watching, finished and cancelled positions remain finite, supported, separated and on the same table',()=>{
 for(const playerSpecies of ids)for(const opponentSpecies of ids){
  const view=createBattleView({playerSpecies,opponentSpecies}),radius=view.scene.getObjectByName('battle-stump').geometry.parameters.radiusTop;
  for(const phase of ['watching','finished','cancelled'])for(const position of [-4,-2,0,2,4]){
   view.update(snapshot(position,{phase}),1/60,{reducedMotion:true});assertScene(view);
   const a=new T.Box3().setFromObject(anchor(view,'player')),b=new T.Box3().setFromObject(anchor(view,'opponent'));
   assert.ok(a.max.x<b.min.x,'horn/jaw bounds do not cross');
   for(const box of [a,b])for(const x of[box.min.x,box.max.x])for(const z of[box.min.z,box.max.z])assert.ok(Math.hypot(x,z)<radius,'model remains on stump');
  }
  view.update(snapshot(4,{phase:'finished',winner:'player'}),1/60,{reducedMotion:true});assertScene(view);view.dispose();
 }
});

test('portrait to wide close projections keep complete beetles inside the central arena while the stump may crop',()=>{
 const point=new T.Vector3();
 for(const playerSpecies of ids)for(const opponentSpecies of ids){
  const view=createBattleView({playerSpecies,opponentSpecies});
  for(const aspect of [.25,.45,.75,1,16/9,3])for(const position of [-4,0,4]){
   view.resize(aspect);view.update(snapshot(position),.02,{reducedMotion:true});view.scene.updateMatrixWorld(true);view.camera.updateMatrixWorld(true);
   for(const side of['player','opponent'])anchor(view,side).traverse(mesh=>{if(!mesh.isMesh)return;const box=new T.Box3().setFromObject(mesh);
    for(const x of[box.min.x,box.max.x])for(const y of[box.min.y,box.max.y])for(const z of[box.min.z,box.max.z]){
     point.set(x,y,z).project(view.camera);assert.ok(point.x>=-.881&&point.x<=.881,`${aspect} horizontal ${mesh.name}`);assert.ok(point.y>=-.581&&point.y<=.581,`${aspect} vertical ${mesh.name}: ${point.y}`);assert.ok(point.z>=-1&&point.z<=1);
    }
   });
  }
  view.dispose();
 }
});

test('snapshot transition animates a bounded push, while reduced motion and repeated steady states are static',()=>{
 const view=createBattleView({playerSpecies:'rhino',opponentSpecies:'stag'}),before=pose(view);
 const next=snapshot(.35,{elapsed:1.6,exchanges:1,lastExchange:{playerAction:'push',opponentAction:'brace',delta:.35,positionBefore:0,positionAfter:.35}});
 view.update(next,1/60);view.update(next,.1);const first=pose(view);assert.notDeepEqual(first,before,'preparation changes the paired stance before contact');assert.ok(Math.abs(first[0][0]-before[0][0])<.05);
 for(let i=0;i<120;i++){view.update(next,1/60);assertScene(view);}
 view.update(next,1/60,{reducedMotion:true});const still=pose(view);
 for(let i=0;i<30;i++)view.update(next,1/60,{reducedMotion:true});assert.deepEqual(pose(view),still);
 view.update(snapshot(4,{phase:'finished'}),0,{reducedMotion:true});const end=pose(view);assert.ok(Math.abs(still[0][0]-before[0][0]-(end[0][0]-before[0][0])*.35/4)<1e-12);
 view.update(snapshot(NaN),NaN,{reducedMotion:true});assertScene(view);view.resize(NaN);assert.ok(view.camera.projectionMatrix.elements.every(Number.isFinite));view.dispose();
});

test('paired outcome choreography swaps attacker and weapon family without previewing future intent; reduced motion is static',()=>{
 const families=new Set(),actors=new Set();
 for(const delta of [-.35,.35]){
  const a=createBattleView({playerSpecies:'rhino',opponentSpecies:'stag'}),b=createBattleView({playerSpecies:'rhino',opponentSpecies:'stag'}),last={number:1,playerAction:'push',opponentAction:'brace',positionBefore:0,positionAfter:delta,delta};
  const sa=snapshot(delta,{exchanges:1,lastExchange:last,intent:'push'}),sb={...sa,intent:'evade'};
  for(let frame=0;frame<80;frame++){a.update(sa,.02);b.update(sb,.02);assert.deepEqual(pose(a),pose(b),'future automatic intent cannot leak into resolved movement');assertScene(a);assertPair(a);}
  families.add(a.getPresentation().family);actors.add(a.getPresentation().actor);const still=pose(a);a.update(sa,.1);assert.deepEqual(pose(a),still,'both settle between exchanges');a.dispose();b.dispose();
 }
 assert.deepEqual([...families].sort(),['horn','jaw']);assert.deepEqual([...actors].sort(),['opponent','player']);
 const reduced=createBattleView({playerSpecies:'rhino',opponentSpecies:'hercules'}),s=snapshot(1,{exchanges:1,lastExchange:{playerAction:'evade',opponentAction:'push',positionBefore:0,positionAfter:1,delta:1}});
 reduced.update(s,0,{reducedMotion:true});const fixed=pose(reduced);for(let i=0;i<10;i++)reduced.update(s,.02,{reducedMotion:true});assert.deepEqual(pose(reduced),fixed);reduced.dispose();
});

test('every species and action pairing allows only designated weapon contact, keeps rear support and remains framed throughout recovery',()=>{
 const projected=new T.Vector3();
 for(const playerSpecies of ids)for(const opponentSpecies of ids)for(const playerAction of ['push','evade','brace'])for(const opponentAction of ['push','evade','brace']){
  const view=createBattleView({playerSpecies,opponentSpecies,aspect:.45}),position=playerAction==='push'?4:-4,radius=view.scene.getObjectByName('battle-stump').geometry.parameters.radiusTop;
  const delta=Math.sign(position)*.35,before=position-delta;view.update(snapshot(before),0,{reducedMotion:true});
  const s=snapshot(position,{phase:'finished',exchanges:1,lastExchange:{playerAction,opponentAction,positionBefore:before,positionAfter:position,delta}});
  for(let frame=0;frame<32;frame++){
   view.update(s,.05);assertScene(view);const a=new T.Box3().setFromObject(anchor(view,'player')),b=new T.Box3().setFromObject(anchor(view,'opponent'));
   assertPair(view);
   for(const box of[a,b])for(const x of[box.min.x,box.max.x])for(const y of[box.min.y,box.max.y])for(const z of[box.min.z,box.max.z]){
    assert.ok(Math.hypot(x,z)<radius,'resolve pose stays on table');projected.set(x,y,z).project(view.camera);
    assert.ok(projected.x>=-.881&&projected.x<=.881&&projected.y>=-.581&&projected.y<=.581,'evade/lean/endpoint stays inside portrait reserved frame');
   }
  }
  view.dispose();
 }
});

test('finished endpoints place the losing body centre on the ring, without falling or changing models',()=>{
 const point=new T.Vector3();
 for(const playerSpecies of ids)for(const opponentSpecies of ids)for(const position of[-4,4]){
  const view=createBattleView({playerSpecies,opponentSpecies});view.update(snapshot(position,{phase:'finished'}),0,{reducedMotion:true});
  const side=position>0?'opponent':'player',m=model(view,side),body=m.userData.visual?.userData.bodyBounds;
  if(body)body.getCenter(point).applyMatrix4(m.matrixWorld);else new T.Box3().setFromObject(m.userData.bodyMesh).getCenter(point);
  const ring=view.scene.getObjectByName('battle-ring').geometry.parameters.radius;
  assert.ok(Math.abs(point.x-Math.sign(position)*ring)<1e-10,'losing body centre reaches boundary');assertScene(view);view.dispose();
 }
});

test('successive real automatic exchanges move continuously without clicks and retain a supported separated final pose',async()=>{
 const {createBattle,advanceBattle}=await import('../src/beetle-battle.js');
 const {RING_OUT_CHOREOGRAPHY}=await import('../src/battle-choreography.js');
 for(const[playerSpecies,opponentSpecies]of[['hercules','metallifer'],['stag','rhino']]){
  const view=createBattleView({playerSpecies,opponentSpecies});let before=pose(view),s=createBattle({playerSpecies,opponentSpecies,seed:17});
  while(s.phase==='watching'){
   s=advanceBattle(s,2+(s.exchanges+1)*1.6-s.elapsed);
   const frames=s.phase==='finished'&&s.finishReason==='ring-out'?Math.max(96,Math.ceil(RING_OUT_CHOREOGRAPHY.settledSeconds*60)+2):96;
   for(let frame=0;frame<frames;frame++){
    view.update(s,1/60);const next=pose(view);assertScene(view);
    for(let side=0;side<2;side++)assert.ok(Math.hypot(...next[side].slice(0,3).map((n,i)=>n-before[side][i]))<.04,'no per-frame whole-model position jump');
    assertPair(view);before=next;
   }
  }
  assert.equal(view.getPresentation().finished,true,'freeze is checked only after the visible final landing');
  const final=pose(view);for(let i=0;i<30;i++)view.update(s,1/60);assert.deepEqual(pose(view),final,'finished beetles stay on the table rather than falling');view.dispose();
 }
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 for(const id of['battle-push','battle-evade','battle-brace'])assert.ok(!html.includes('id="'+id+'"'),'manual action button removed');
 assert.ok(!html.includes('スタミナ'));assert.match(html,/操作せず、虫たちの押し合いを見守ろう/);
 for(const id of['battle-heading','battle-state','battle-position','battle-cue','battle-result','battle-save-status','battle-finish-button','battle-exit-button'])assert.ok(html.includes('id="'+id+'"'));
});

test('dispose releases each owned geometry/material once without touching shared insect texture caches',()=>{
 const field=createInsectModel('hercules'),cachedMaps=new Set([...materials(field)].map(m=>m.map).filter(Boolean));assert.ok(cachedMaps.size>0);
 let textureDisposals=0;for(const map of cachedMaps)map.addEventListener('dispose',()=>textureDisposals++);
 const view=createBattleView({playerSpecies:'hercules',opponentSpecies:'hercules'}),geometries=new Set(),mats=materials(view.scene),counts=new Map();
 view.scene.traverse(n=>{if(n.geometry)geometries.add(n.geometry);});
 for(const owned of [...geometries,...mats]){counts.set(owned,0);owned.addEventListener('dispose',()=>counts.set(owned,counts.get(owned)+1));}
 for(const m of materials(model(view,'player')))if(m.map)assert.ok(cachedMaps.has(m.map));
 view.dispose();view.dispose();view.update(snapshot(3),1);view.resize(2);assert.equal(view.scene.children.length,0);
 assert.ok([...counts.values()].every(n=>n===1));assert.equal(textureDisposals,0);
 const after=createBattleView({playerSpecies:'hercules',opponentSpecies:'rhino'});assert.ok([...materials(model(after,'player'))].some(m=>cachedMaps.has(m.map)));assertScene(after);after.dispose();assert.equal(textureDisposals,0);
});
