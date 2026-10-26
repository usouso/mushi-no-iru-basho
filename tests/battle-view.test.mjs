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
const ids=['rhino','stag','hercules','metallifer'],anchor=(view,side)=>view.scene.getObjectByName('battle-'+side);
const model=(view,side)=>anchor(view,side).children[0];
function geometrySignature(node){const hash=createHash('sha256');node.traverse(n=>{n.updateMatrix();hash.update(JSON.stringify([n.type,n.name,Array.from(n.matrix.elements)]));if(n.geometry){for(const key of Object.keys(n.geometry.attributes).sort()){const a=n.geometry.attributes[key];hash.update(key+':'+a.itemSize+':');hash.update(Buffer.from(a.array.buffer,a.array.byteOffset,a.array.byteLength));}if(n.geometry.index){const a=n.geometry.index.array;hash.update(Buffer.from(a.buffer,a.byteOffset,a.byteLength));}}});return hash.digest('hex');}
const materials=node=>{const result=new Set();node.traverse(n=>{if(n.material)for(const m of Array.isArray(n.material)?n.material:[n.material])result.add(m);});return result;};
const pose=view=>['player','opponent'].map(side=>{const a=anchor(view,side);return [...a.position.toArray(),...a.quaternion.toArray()];});
function snapshot(position=0,extras={}){return{phase:'watching',position,elapsed:0,exchanges:0,lastExchange:null,...extras};}
function assertScene(view){view.scene.updateMatrixWorld(true);view.scene.traverse(n=>assert.ok(n.matrixWorld.elements.every(Number.isFinite),n.name));for(const side of ['player','opponent']){const b=new T.Box3().setFromObject(anchor(view,side));assert.ok(Math.abs(b.min.y)<1e-10,side+' lowest surface touches table');assert.ok(b.max.y>.05);}}

test('only the four retained beetles are supported, and every pair faces inward at unchanged inspection scale',()=>{
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
 const next=snapshot(2,{elapsed:1.6,exchanges:1,lastExchange:{playerAction:'push',opponentAction:'brace',delta:2,positionBefore:0,positionAfter:2}});
 view.update(next,1/60);const first=pose(view);assert.ok(first[0][0]>before[0][0]);assert.ok(first[0][0]-before[0][0]<.05);
 for(let i=0;i<120;i++){view.update(next,1/60);assertScene(view);}
 view.update(next,1/60,{reducedMotion:true});const still=pose(view);
 for(let i=0;i<30;i++)view.update(next,1/60,{reducedMotion:true});assert.deepEqual(pose(view),still);
 view.update(snapshot(4,{phase:'finished'}),0,{reducedMotion:true});const end=pose(view);assert.ok(Math.abs(still[0][0]-before[0][0]-(end[0][0]-before[0][0])/2)<1e-12);
 view.update(snapshot(NaN),NaN,{reducedMotion:true});assertScene(view);view.resize(NaN);assert.ok(view.camera.projectionMatrix.elements.every(Number.isFinite));view.dispose();
});

test('automatic contact-hold resolve clips distinguish both beetles, then settle without future-action previews',()=>{
 const actions=['push','evade','brace'],playerPoses=new Set(),opponentPoses=new Set();
 for(const action of actions){
  const a=createBattleView({playerSpecies:'rhino',opponentSpecies:'stag'}),b=createBattleView({playerSpecies:'rhino',opponentSpecies:'stag'});
  const last={playerAction:action,opponentAction:'brace',positionBefore:0,positionAfter:1,delta:1};
  a.update(snapshot(1,{exchanges:1,lastExchange:last,intent:'push'}),.1);b.update(snapshot(1,{exchanges:1,lastExchange:last,intent:'evade'}),.1);
  assert.deepEqual(pose(a),pose(b),'obsolete manual intent never affects a watching pose');playerPoses.add(JSON.stringify(pose(a)[0]));
  for(let i=0;i<15;i++){a.update(snapshot(1,{exchanges:1,lastExchange:last,intent:'push'}),.1);b.update(snapshot(1,{exchanges:1,lastExchange:last,intent:'evade'}),.1);}
  assert.deepEqual(pose(a),pose(b),'between automatic exchanges both settle without a future cue');const still=pose(a);a.update(snapshot(1,{exchanges:1,lastExchange:last}),.1);assert.deepEqual(pose(a),still);a.dispose();b.dispose();
  const c=createBattleView({playerSpecies:'rhino',opponentSpecies:'stag'});c.update(snapshot(0,{exchanges:1,lastExchange:{playerAction:'brace',opponentAction:action,positionBefore:0,positionAfter:0,delta:0}}),.1);opponentPoses.add(JSON.stringify(pose(c)[1]));c.dispose();
 }
 assert.equal(playerPoses.size,3);assert.equal(opponentPoses.size,3);
 const reduced=createBattleView({playerSpecies:'rhino',opponentSpecies:'hercules'}),s=snapshot(1,{exchanges:1,lastExchange:{playerAction:'evade',opponentAction:'push',positionBefore:0,positionAfter:1,delta:1}});
 reduced.update(s,0,{reducedMotion:true});const fixed=pose(reduced);for(let i=0;i<10;i++)reduced.update(s,.02,{reducedMotion:true});assert.deepEqual(pose(reduced),fixed,'reduced action has a fixed pose');reduced.dispose();
});

test('every species pairing and action pairing keeps a 4mm actual-bounds gap throughout the resolve clip',()=>{
 const projected=new T.Vector3();
 for(const playerSpecies of ids)for(const opponentSpecies of ids)for(const playerAction of ['push','evade','brace'])for(const opponentAction of ['push','evade','brace']){
  const view=createBattleView({playerSpecies,opponentSpecies,aspect:.45}),position=playerAction==='push'?4:-4,radius=view.scene.getObjectByName('battle-stump').geometry.parameters.radiusTop;
  const s=snapshot(position,{phase:'finished',exchanges:1,lastExchange:{playerAction,opponentAction,positionBefore:0,positionAfter:position,delta:position}});
  for(let frame=0;frame<15;frame++){
   view.update(s,.05);assertScene(view);const a=new T.Box3().setFromObject(anchor(view,'player')),b=new T.Box3().setFromObject(anchor(view,'opponent'));
   assert.ok(b.min.x-a.max.x>=.004-1e-10,`${playerSpecies}/${opponentSpecies} ${playerAction}/${opponentAction} at ${frame}`);
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

test('successive automatic exchanges move continuously without clicks and retain a supported separated final pose',()=>{
 const positions=[1,0,-1,-2,0,2,3,4];
 for(const[playerSpecies,opponentSpecies]of[['hercules','metallifer'],['stag','rhino']]){
  const view=createBattleView({playerSpecies,opponentSpecies});let before=pose(view),priorPosition=0;
  for(let exchange=0;exchange<positions.length;exchange++){
   const position=positions[exchange],lastExchange={playerAction:exchange%2?'evade':'push',opponentAction:exchange%2?'push':'brace',positionBefore:priorPosition,positionAfter:position,delta:position-priorPosition},phase=exchange===positions.length-1?'finished':'watching';
   for(let frame=0;frame<96;frame++){
    view.update(snapshot(position,{phase,elapsed:exchange*1.6+frame/60,exchanges:exchange+1,lastExchange}),1/60);const next=pose(view);assertScene(view);
    for(let side=0;side<2;side++)assert.ok(Math.hypot(...next[side].slice(0,3).map((n,i)=>n-before[side][i]))<.04,'no per-frame whole-model position jump');
    const a=new T.Box3().setFromObject(anchor(view,'player')),b=new T.Box3().setFromObject(anchor(view,'opponent'));assert.ok(b.min.x-a.max.x>=.004-1e-10);before=next;
   }
   priorPosition=position;
  }
  const final=pose(view);for(let i=0;i<30;i++)view.update(snapshot(4,{phase:'finished',exchanges:8}),1/60);assert.deepEqual(pose(view),final,'finished beetles stay on the table rather than falling');view.dispose();
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
