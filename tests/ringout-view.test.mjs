/** CPU ring boundary/contact/support audit, not a rendered playtest. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
const sandbox={console};vm.runInNewContext(fs.readFileSync(new URL('../assets/vendor/three.min.js',import.meta.url),'utf8'),sandbox);
const T=sandbox.THREE,context={};for(const method of['fillRect','clearRect','beginPath','moveTo','lineTo','bezierCurveTo','quadraticCurveTo','stroke','fill','save','restore','translate','rotate','ellipse','arc','drawImage','closePath','clip'])context[method]=()=>{};context.createLinearGradient=()=>({addColorStop(){}});globalThis.window={THREE:T};globalThis.document={createElement:()=>({getContext:()=>context})};
const {createBattleView}=await import('../src/battle-view.js');
const {BATTLE_CHOREOGRAPHY,RING_OUT_CHOREOGRAPHY}=await import('../src/battle-choreography.js');
const species=['hercules','rhino','stag','metallifer','atlas'];
const model=(view,side)=>view.scene.getObjectByName('battle-'+side).children[0];
function skin(root){const points=[];root.traverse(mesh=>{if(!mesh.isMesh)return;const a=mesh.geometry.attributes.position,index=mesh.geometry.index,seen=new Set();for(let n=0;n<(index?.count??a.count);n++){const i=index?index.getX(n):n;if(seen.has(i))continue;seen.add(i);points.push(new T.Vector3().fromBufferAttribute(a,i).applyMatrix4(mesh.matrixWorld));}});return points;}
function foot(leg){const p=leg.foot.clone().applyMatrix4(leg.mesh.matrixWorld);assert.ok(Math.min(...skin(leg.mesh).map(q=>q.distanceTo(p)))<2e-6,'support point matches actual leg skin');return p;}
function terminal(sign=1){return Object.freeze({phase:'finished',position:sign*4,winner:sign>0?'player':'opponent',finishReason:'ring-out',exchanges:20,lastExchange:Object.freeze({number:20,playerAction:sign>0?'push':'brace',opponentAction:sign>0?'brace':'push',positionBefore:sign*3.65,positionAfter:sign*4,delta:sign*.35})});}
function neutral(position=0){return{phase:'watching',position,lastExchange:null};}
function visualSignature(view){view.scene.updateMatrixWorld(true);const h=createHash('sha256');for(const side of['player','opponent'])model(view,side).traverse(n=>{h.update(JSON.stringify(n.matrixWorld.toArray()));for(const a of Object.values(n.geometry?.attributes||{}))h.update(Buffer.from(a.array.buffer,a.array.byteOffset,a.array.byteLength));});return h.digest('hex');}

test('all five maximum-size opponents on both sides are visibly outside the unchanged line, grounded safely and framed before a winner is allowed',()=>{
 const metrics={clips:0,maxReachError:0,maxSkinStep:0,minFinalBodyClearance:Infinity};
 for(const playerSpecies of species)for(const opponentSpecies of species)for(const sign of[-1,1]){
  const view=createBattleView({playerSpecies,opponentSpecies,playerSizePermille:1150,opponentSizePermille:1150,aspect:sign>0?.45:16/9}),ring=view.scene.getObjectByName('battle-ring').geometry.parameters.radius,platform=view.scene.getObjectByName('battle-stump').geometry.parameters.radiusTop,initial=new T.Box3().setFromObject(view.scene.getObjectByName('battle-player')).union(new T.Box3().setFromObject(view.scene.getObjectByName('battle-opponent')));
  assert.ok(Math.abs(ring-(Math.max(.65,Math.abs(initial.min.x),Math.abs(initial.max.x))+.36)*.78)<1e-10,'winning line cannot shrink');assert.ok(platform>ring+.1,'safe floor remains outside the line');
  const s=terminal(sign),bytes=JSON.stringify(s),loser=sign>0?'opponent':'player';view.update(neutral(s.lastExchange.positionBefore),0,{reducedMotion:true});let held=0,sawVisible=false,last,previous=null;
  for(let frame=0;frame<52;frame++){
   last=view.update(s,.04);view.scene.updateMatrixWorld(true);view.camera.updateMatrixWorld(true);assert.equal(JSON.stringify(s),bytes);const points=[];
   for(const side of['player','opponent']){
    const m=model(view,side),rig=m.userData.battleRig,feet=rig.legs.map(foot),surface=skin(m);points.push(...surface);assert.ok(feet.filter(p=>Math.abs(p.y)<2e-5).length>=2,'moving beetle retains real supported feet');
    for(const leg of rig.legs){metrics.maxReachError=Math.max(metrics.maxReachError,leg.reachError);assert.ok(leg.reachError<.002,`${playerSpecies}/${opponentSpecies} ${side} ${leg.role} reach=${leg.reachError} age=${last.age}`);}
    for(const p of surface){assert.ok(p.y>=-2e-5,'skin stays above the table');assert.ok(Math.hypot(p.x,p.z)<platform-.02,'no unsafe fall or unsupported platform edge');const q=p.clone().project(view.camera);assert.ok(Math.abs(q.x)<=.881&&Math.abs(q.y)<=.581&&q.z>=-1&&q.z<=1,'close camera retains actual bug skin');}
    if(last.settled)assert.equal(feet.filter(p=>Math.abs(p.y)<2e-5).length,6,'all six feet land');
   }
   if(previous)for(let i=0;i<points.length;i++){const d=points[i].distanceTo(previous[i]);metrics.maxSkinStep=Math.max(metrics.maxSkinStep,d);assert.ok(d<.075,'no large skin discontinuity within 40ms');}previous=points;
   if(last.contactActive){held++;assert.ok(view.scene.userData.battleContact.distance<.006,'weapon remains on the body during the final push');}
   if(last.ringOutVisible){sawVisible=true;assert.equal(last.ringOutSide,loser);const info=view.scene.userData.battleRingOut;assert.ok(info.innerBodyEdge>ring+.012&&info.outsideSupport>=3,'visible flag needs actual body and planted feet beyond the line');}
   if(last.finished){assert.ok(last.ringOutVisible&&last.settled&&last.age>=1.95,'no winner while bugs remain central or airborne');}
   // Keep a visible segment of the relevant boundary in the same close shot.
   for(const z of[-.18,0,.18]){const p=new T.Vector3(sign*Math.sqrt(ring*ring-z*z),.001,z).project(view.camera);assert.ok(Math.abs(p.x)<=.881&&Math.abs(p.y)<=.581,'ring edge remains in the final camera');}
  }
  assert.ok(held>=15&&sawVisible&&last.finished);const body=model(view,loser).userData.battleRig.torsoBox(new T.Box3()),clearance=(sign>0?body.min.x:-body.max.x)-ring;metrics.minFinalBodyClearance=Math.min(metrics.minFinalBodyClearance,clearance);assert.ok(clearance>=.03499,'entire real torso clears the line');for(const leg of model(view,loser).userData.battleRig.legs)assert.ok(sign*foot(leg).x>ring+.02499,'every final support foot is clearly outside');view.dispose();metrics.clips++;
 }
 assert.equal(metrics.clips,50);console.log('CPU ring-out metrics (not a rendered playtest):',JSON.stringify(metrics));
});

test('central or mismatched winner declarations cannot finish; a draw and ordinary exchange retain the original landing duration',()=>{
 assert.equal(BATTLE_CHOREOGRAPHY.settledSeconds,1.42);assert.equal(RING_OUT_CHOREOGRAPHY.settledSeconds,1.95);
 for(const invalid of[{...terminal(),position:0,lastExchange:{...terminal().lastExchange,positionBefore:0,positionAfter:0,delta:0}},{...terminal(),winner:'opponent'},{...terminal(),position:Infinity},{...terminal(),finishReason:'turn-limit'}]){const view=createBattleView({playerSpecies:'rhino',opponentSpecies:'stag'});for(let i=0;i<25;i++)view.update(invalid,.1);assert.equal(view.getPresentation().finished,false);assert.equal(view.getPresentation().ringOutVisible,false);assert.equal(view.update(invalid,0).finished,false,'frozen-frame fast path cannot bypass the real boundary gate');view.dispose();}
 const view=createBattleView({playerSpecies:'hercules',opponentSpecies:'atlas'}),draw={phase:'finished',winner:'draw',finishReason:'turn-limit',position:.35,exchanges:36,lastExchange:{number:36,positionBefore:0,positionAfter:.35,delta:.35,playerAction:'push',opponentAction:'brace'}};for(let i=0;i<16;i++)view.update(draw,.1);assert.equal(view.getPresentation().age,1.42);assert.equal(view.getPresentation().finished,true);assert.equal(view.getPresentation().ringOutVisible,false);view.dispose();
});

test('zero-dt suspension freezes the final push; reduced-motion stays static, reset clears the boundary and events never replay',()=>{
 for(const reducedMotion of[false,true]){
  const view=createBattleView({playerSpecies:'metallifer',opponentSpecies:'atlas',playerSizePermille:1150}),s=terminal(-1),events=[];for(let i=0;i<20;i++)events.push(...view.update(s,.04,{reducedMotion}).events);const frozen=visualSignature(view),age=view.getPresentation().age;
  for(let i=0;i<20;i++){assert.deepEqual(view.update(s,0,{reducedMotion}).events,[]);assert.equal(visualSignature(view),frozen);}assert.equal(view.getPresentation().age,age);
  for(let i=0;i<40;i++){events.push(...view.update(s,.04,{reducedMotion}).events);if(reducedMotion)assert.equal(visualSignature(view),frozen);}
  assert.deepEqual(events.map(e=>e.type),['started','contact','settled']);assert.equal(view.getPresentation().finished,true);assert.equal(view.getPresentation().ringOutVisible,true);const stable=visualSignature(view);for(let i=0;i<8;i++){assert.deepEqual(view.update(s,.1,{reducedMotion}).events,[]);assert.equal(visualSignature(view),stable);}view.reset();assert.equal(view.getPresentation().ringOutVisible,false);assert.equal(view.getPresentation().finished,false);assert.equal(view.scene.userData.battleRingOut,null);view.dispose();view.dispose();assert.equal(view.scene.children.length,0);
 }
});
