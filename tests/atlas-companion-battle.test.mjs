/** Atlas fixed-individual ownership / automatic sumo / actual geometry checks.
 * Map locks and CPU projection are not browser persistence or a rendered playtest. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {COMPANION_KEY,LEGACY_COMPANION_KEY,COMPANION_SPECIES,createCompanionRoster,isCompanionSpecies} from '../src/individual-roster.js';
import {createBattle,advanceBattle,cancelBattle,BATTLE_SPECIES,BATTLE_LIMITS} from '../src/beetle-battle.js';
const oldSpecies=['hercules','rhino','stag','metallifer'];
const priorBattleSpecies=[...oldSpecies,'atlas','giantstag','elephant'];
const atlas={species:'atlas',originHabitat:'understory',originIndividualId:'insect-5',originKind:'legacy',originEncounterId:null,sizePermille:null,measureVersion:null};
const homes={hercules:'tropical',rhino:'night',stag:'night',metallifer:'understory'};
const capture=species=>({species,originHabitat:homes[species],originIndividualId:species==='hercules'||species==='stag'?'insect-5':'insect-4',originKind:'expedition',originEncounterId:`g1-1234abcd-o1-${homes[species]}-${species==='hercules'?'hercules-a':species}`,sizePermille:1100,measureVersion:1});
const oldEntry={id:'night/insect-4',species:'rhino',originHabitat:'night',originIndividualId:'insect-4',capturedAt:100};
const newPayload=entries=>JSON.stringify({version:2,legacyImportDone:true,entries});
function fixture(entries=[]){const values=new Map(entries),writes=[],tails=new Map();let fail=false;return{values,writes,now:()=>200,set failWrite(v){fail=v;},locks:{request(key,options,fn){assert.ok([COMPANION_KEY,LEGACY_COMPANION_KEY].includes(key));assert.equal(options.mode,'exclusive');const task=(tails.get(key)||Promise.resolve()).then(fn);tails.set(key,task.catch(()=>{}));return task;}},storage:{getItem(key){return values.get(key)??null;},setItem(key,value){assert.equal(key,COMPANION_KEY);if(fail)throw Error('quota');writes.push([key,value]);values.set(key,value);}}};}
const make=f=>createCompanionRoster(f.storage,f);
const end=(playerSpecies,opponentSpecies,seed)=>advanceBattle(createBattle({playerSpecies,opponentSpecies,seed}),100);

test('v2 adds one fixed unmeasured Atlas beside the unchanged four measured companions; reload, cancellation and explicit release preserve all other data',async()=>{
 const f=fixture([[LEGACY_COMPANION_KEY,JSON.stringify({version:1,entries:[]})],['mushi-expedition-v1','unchanged five-slot manifest'],['mushi-journal-v2','unchanged journal']]),r=make(f);
 assert.deepEqual(COMPANION_SPECIES,[...oldSpecies,'atlas','giantstag','elephant','goliath','fivehorn','miyama','euchirus','manticora','rainbowstag']);assert.equal(isCompanionSpecies('atlas'),true);
 for(const species of oldSpecies)assert.equal(r.add(capture(species)).ok,true);await r.flush();const previous=r.entries,legacyRaw=f.values.get(LEGACY_COMPANION_KEY);
 const result=r.add(atlas);assert.equal(result.ok,true);assert.equal(result.entry.id,'understory/insect-5');assert.equal(result.entry.originKind,'legacy');for(const key of['originEncounterId','sizePermille','measureVersion'])assert.equal(result.entry[key],null);assert.equal(await r.flush(),true);assert.equal(r.entries.length,5);assert.deepEqual(make(f).entries,r.entries);assert.deepEqual(r.entries.slice(0,4),previous);
 assert.deepEqual(r.add(atlas),{ok:false,reason:'already-owned'});assert.deepEqual(r.replace(result.entry.id,atlas),{ok:false,reason:'same-individual'});const before=JSON.stringify(r.entries),game=cancelBattle(advanceBattle(createBattle({playerSpecies:'atlas',opponentSpecies:'hercules',seed:0}),8));assert.equal(game.phase,'cancelled');assert.equal(game.winner,null);assert.equal(JSON.stringify(r.entries),before);
 assert.equal(r.release(result.entry.id).ok,true);assert.equal(await r.flush(),true);assert.deepEqual(r.entries,previous);assert.equal(f.values.get(LEGACY_COMPANION_KEY),legacyRaw);assert.equal(f.values.get('mushi-expedition-v1'),'unchanged five-slot manifest');assert.equal(f.values.get('mushi-journal-v2'),'unchanged journal');
});

test('Atlas never migrates from invented v1 data and cannot acquire a generator1 measurement or another fixed slot',async()=>{
 const fakeOld={id:'understory/insect-5',species:'atlas',originHabitat:'understory',originIndividualId:'insect-5',capturedAt:50},raw=JSON.stringify({version:1,entries:[oldEntry,fakeOld]}),f=fixture([[LEGACY_COMPANION_KEY,raw]]),r=make(f);
 assert.equal(r.reason,'invalid-data');assert.deepEqual(r.entries.map(e=>e.species),['rhino']);assert.equal(r.add(atlas).ok,true);assert.equal(await r.flush(),false);assert.equal(f.values.get(LEGACY_COMPANION_KEY),raw);assert.equal(f.values.has(COMPANION_KEY),false);assert.equal(f.writes.length,0);
 const good=fixture([[COMPANION_KEY,newPayload([])]]),q=make(good);
 for(const bad of[{...atlas,originIndividualId:'insect-4'},{...atlas,originHabitat:'tropical'},{...atlas,sizePermille:1000},{...atlas,originKind:'expedition',originEncounterId:'g1-1234abcd-o1-understory-atlas',sizePermille:1100,measureVersion:1},{...atlas,originKind:'expedition',originEncounterId:'g1-1234abcd-o1-understory-metallifer',sizePermille:1100,measureVersion:1}])assert.deepEqual(q.add(bad),{ok:false,reason:'invalid-capture'});
 assert.deepEqual(q.entries,[]);assert.equal(good.writes.length,0);
});

test('Atlas addition does not weaken v2 future/corrupt/conflict/quota safeguards or resurrect later v1 captures',async()=>{
 for(const raw of['{',JSON.stringify({version:3,legacyImportDone:true,entries:[]}),JSON.stringify({version:2,legacyImportDone:true,entries:[],unknown:'preserve'})]){const f=fixture([[COMPANION_KEY,raw],[LEGACY_COMPANION_KEY,JSON.stringify({version:1,entries:[oldEntry]})]]),r=make(f);assert.equal(r.reason,'invalid-data');assert.deepEqual(r.entries,[]);assert.equal(r.add(atlas).ok,true);assert.equal(await r.flush(),false);assert.equal(f.values.get(COMPANION_KEY),raw);assert.equal(f.writes.length,0);}
 const f=fixture([[COMPANION_KEY,newPayload([])]]),a=make(f),b=make(f);a.add(atlas);b.add(capture('rhino'));assert.equal(await a.flush(),true);assert.equal(await b.flush(),false);assert.equal(b.reason,'conflict');const winning=f.values.get(COMPANION_KEY);await b.flush();assert.equal(f.values.get(COMPANION_KEY),winning);
 f.values.set(LEGACY_COMPANION_KEY,JSON.stringify({version:1,entries:[oldEntry]}));const c=make(f);assert.deepEqual(c.entries.map(e=>e.species),['atlas']);f.failWrite=true;c.release('understory/insect-5');assert.equal(await c.flush(),false);assert.equal(c.reason,'storage-error');assert.equal(f.values.get(COMPANION_KEY),winning);assert.equal(make(f).entries[0].species,'atlas');f.failWrite=false;assert.equal(await c.flush(),true);assert.deepEqual(make(f).entries,[]);
});

test('all 49 ordered matchups use ring-out-only wins or explicit safety draws; both sides can win and sizes do not decide results',async()=>{
 const source=fs.readFileSync(new URL('../src/beetle-battle.js',import.meta.url),'utf8');
 // The new species registry line is isolated; all old rule bytes stay hash-pinned.
 const priorSpeciesSource=source.replace(",\n rainbowstag:{label:'ニジイロクワガタ（雄）',role:'丸い背と上向く大顎',help:'Phalacrognathus muelleri の雄。丸い背と上向く左右の大顎が目印。押し合いはゲーム上の動作です。'}",'').replace(",\n manticora:{label:'マンティコラ（M. latipennis・雄）',role:'大きな頭と曲がった顎',help:'Manticora latipennis の雄。大きな頭と曲がった大顎が目印。押し合いはゲーム上の動作です。'}",'').replace(",\n euchirus:{label:'テナガコガネ',role:'長い前脚で押し合う',help:'Euchirus longimanus の雄。長い左右の前脚が目印。押し合いはゲーム上の動作です。'}",'').replace(",\n miyama:{label:'ミヤマクワガタ',role:'張り出した頭と大顎',help:'頭の後ろの張出しと、左右の大顎が目印。'}",'').replace(",\n fivehorn:{label:'ゴホンヅノカブト',role:'五本の角を合わせる',help:'立ち上がる頭角と、二対の胸角が目印。'}",'').replace(",\n goliath:{label:'ゴライアス',role:'短いY字角で押し合う',help:'白黒の胸と、短い二叉の頭角が目印。'}",'').replace(",\n elephant:{label:'ゾウカブト',role:'丸い体で押し合う',help:'太い胴と前へ伸びた頭角が目印。'}",'');assert.notEqual(priorSpeciesSource,source);
 const referenceSource=priorSpeciesSource.replace("if(species==='stag'&&ownPosition<=-1.5)return .05;","if(species==='stag'&&ownPosition<=-1.5)return .10;");
 assert.equal(createHash('sha256').update(referenceSource).digest('hex'),'8efcca57b8e5c24935fcac053661aed18ce81a250828f4ab901dcab727c6e55b','only the edge coefficient and the exact added species registry may differ from 0.23');
 const reference=await import('data:text/javascript;base64,'+Buffer.from(referenceSource).toString('base64'));

 const ids=Object.keys(BATTLE_SPECIES);assert.deepEqual(ids,[...priorBattleSpecies,'goliath','fivehorn','miyama','euchirus','manticora','rainbowstag']);assert.equal(BATTLE_SPECIES.atlas.label,'アトラスオオカブト');assert.equal(BATTLE_LIMITS.maxSeconds,59.6);assert.equal(BATTLE_LIMITS.turns,36);assert.equal(BATTLE_LIMITS.ring,4);assert.equal(BATTLE_LIMITS.maxStep,.45);
 function result(s){
  assert.equal(s.phase,'finished');assert.ok(s.elapsed>=16.4&&s.elapsed<=59.6);assert.ok(s.exchanges>=9&&s.exchanges<=36);assert.ok(Number.isFinite(s.position)&&Math.abs(s.position)<=4);
  if(s.winner==='draw'){assert.equal(s.finishReason,'time-limit');assert.ok(Math.abs(s.position)<4);assert.equal(s.exchanges,36);assert.equal(s.elapsed,59.6);}
  else{assert.ok(['player','opponent'].includes(s.winner));assert.equal(s.finishReason,'ring-out');assert.equal(s.position,s.winner==='player'?4:-4);}
 }
 const outcomeHash=createHash('sha256');for(const p of oldSpecies)for(const o of oldSpecies)for(let seed=0;seed<32;seed++){const s=reference.advanceBattle(reference.createBattle({playerSpecies:p,opponentSpecies:o,seed}),100);result(s);outcomeHash.update(JSON.stringify(s));if(p!=='stag'&&o!=='stag')assert.deepEqual(end(p,o,seed),s);}
 // Pinned 0.23 reference: fixed 4-species × 32-seed results. No new hash hides the intended stag-only difference.
 // The unchanged first 12 exchanges are separately pinned in ringout-rules.test.mjs.
 assert.equal(outcomeHash.digest('hex'),'9d71f96ad1ebf4187d95c7164e03d5fd9f75dbee816b7f5369691b2e3f966453');
 const counts=[];for(const p of priorBattleSpecies)for(const o of priorBattleSpecies){const wins={player:0,opponent:0,draw:0};for(let seed=0;seed<128;seed++){const s=end(p,o,seed);result(s);wins[s.winner]++;}assert.ok(wins.player>0&&wins.opponent>0,`${p}/${o} permits both ring-out winners`);assert.ok(wins.draw>0,`${p}/${o} retains a real safety draw rather than forcing a winner`);counts.push({player:p,opponent:o,...wins});
  const options={playerSpecies:p,opponentSpecies:o,seed:17};assert.deepEqual(advanceBattle(createBattle({...options,playerSizePermille:1150,opponentSizePermille:1000,level:99}),100),end(p,o,17),'size and level are not strength inputs');
 }
 assert.equal(counts.length,49);
});

test('Atlas adds only a small conditional post-push brace bonus, with no change to controls, energy, model-size influence or cancellation',()=>{
 let exercised=0,withoutBonus=0;
 for(let seed=0;seed<32;seed++){
  let state=createBattle({playerSpecies:'hercules',opponentSpecies:'rhino',seed});
  while(state.phase==='watching'){
   const dt=2+(state.exchanges+1)*1.6-state.elapsed,base=advanceBattle(state,dt),variant=advanceBattle({...state,playerSpecies:'atlas'},dt);
   assert.equal(base.lastExchange.playerAction,variant.lastExchange.playerAction);assert.equal(base.playerEnergy,variant.playerEnergy);assert.equal(base.opponentEnergy,variant.opponentEnergy);
   if(state.exchanges>=3){const condition=state.lastExchange?.playerAction==='push'&&variant.lastExchange.playerAction==='brace';if(condition){assert.ok(variant.lastExchange.delta>=base.lastExchange.delta-.025000001);assert.ok(variant.lastExchange.delta-base.lastExchange.delta<=.194000001);if(variant.lastExchange.delta>base.lastExchange.delta)exercised++;}else{assert.equal(variant.lastExchange.delta,base.lastExchange.delta);withoutBonus++;}}
   state=base;
  }
 }
 assert.ok(exercised>0&&withoutBonus>0);
 const original=createBattle({playerSpecies:'atlas',opponentSpecies:'stag',seed:1});assert.deepEqual(createBattle({playerSpecies:'atlas',opponentSpecies:'stag',seed:1,playerSizePermille:9999,level:99}),original);const cancelled=cancelBattle(advanceBattle(original,8));assert.equal(cancelled.winner,null);assert.equal(advanceBattle(cancelled,100),cancelled);assert.equal(cancelBattle(cancelled),cancelled);
});

test('Atlas actual model fits every opponent and both sides, supports designated contact and returns to a six-foot separated stance',async()=>{
 const sandbox={console};vm.runInNewContext(fs.readFileSync(new URL('../assets/vendor/three.min.js',import.meta.url),'utf8'),sandbox);const T=sandbox.THREE,c={};for(const method of['fillRect','clearRect','beginPath','moveTo','lineTo','bezierCurveTo','quadraticCurveTo','stroke','fill','save','restore','translate','rotate','ellipse','arc','drawImage','closePath','clip'])c[method]=()=>{};c.createLinearGradient=()=>({addColorStop(){}});globalThis.window={THREE:T};globalThis.document={createElement:()=>({getContext:()=>c})};
 const {createBattleView}=await import('../src/battle-view.js'),point=new T.Vector3();
 const vector=p=>new T.Vector3(p.x,p.y,p.z);
 function skin(mesh){const a=mesh.geometry.attributes.position,index=mesh.geometry.index,seen=new Set(),points=[];for(let n=0;n<(index?.count??a.count);n++){const i=index?index.getX(n):n;if(seen.has(i))continue;seen.add(i);points.push(new T.Vector3().fromBufferAttribute(a,i).applyMatrix4(mesh.matrixWorld));}return points;}
 function feet(model){return model.userData.battleRig.legs.map(leg=>{const p=vector(leg.foot).applyMatrix4(leg.mesh.matrixWorld);assert.ok(Math.min(...skin(leg.mesh).map(q=>q.distanceTo(p)))<2e-6,'support point stays on actual leg skin');assert.ok(leg.reachError<.002,'leg remains within native reach');return{leg,point:p};});}
 function contact(a,b){const actual=new T.Vector3().fromBufferAttribute(a.weapon.mesh.geometry.attributes.position,a.weapon.index).applyMatrix4(a.weapon.mesh.matrixWorld),weapon=a.weaponWorld(),target=b.contactWorld(),{mesh,triangleIndex}=b.contactPatch,attribute=mesh.geometry.attributes.position,index=mesh.geometry.index;
  const triangle=new T.Triangle(...[0,1,2].map(n=>new T.Vector3().fromBufferAttribute(attribute,index?index.getX(triangleIndex*3+n):triangleIndex*3+n).applyMatrix4(mesh.matrixWorld)));
  assert.ok(actual.distanceTo(weapon)<2e-6,'contact uses the actual horn/jaw skin');assert.ok(triangle.closestPointToPoint(target,new T.Vector3()).distanceTo(target)<2e-6,'target is on the actual torso triangle');assert.ok(weapon.distanceTo(target)<.006,'weapon stays against the designated torso patch');
 }
 for(const opponent of priorBattleSpecies)for(const atlasSide of['player','opponent']){
  const view=createBattleView({playerSpecies:atlasSide==='player'?'atlas':opponent,opponentSpecies:atlasSide==='opponent'?'atlas':opponent}),anchors=['player','opponent'].map(side=>view.scene.getObjectByName('battle-'+side)),models=anchors.map(a=>a.children[0]),model=models[atlasSide==='player'?0:1];assert.equal(model.userData.species,'atlas');assert.equal(model.userData.legs.length,6);assert.ok(model.userData.bodyMesh?.isMesh,'actual Atlas factory, not fallback butterfly');let number=0;
  function assertPose(presentation){view.scene.updateMatrixWorld(true);view.camera.updateMatrixWorld(true);const stationary=presentation.settled,allFeet=models.map(feet);
   for(let side=0;side<2;side++){
    const supported=allFeet[side].filter(f=>Math.abs(f.point.y)<2e-5);assert.ok(supported.length>=2,'each beetle retains real supporting feet');if(stationary)assert.equal(supported.length,6,'all six feet return to the arena');
    models[side].traverse(mesh=>{if(!mesh.isMesh)return;for(const p of skin(mesh)){assert.ok(p.y>=-2e-5,'actual skin does not pass through the table');point.copy(p).project(view.camera);assert.ok(point.x>=-.881&&point.x<=.881&&point.y>=-.581&&point.y<=.581&&point.z>=-1&&point.z<=1,'whole horn/leg skin fits');}});
   }
   if(stationary){const boxes=anchors.map(a=>new T.Box3().setFromObject(a));assert.ok(boxes[1].min.x-boxes[0].max.x>=.004-1e-10,'neutral silhouettes remain separated');}
   if(presentation.contactActive){const actor=presentation.actor==='player'?0:1,receiver=1-actor;contact(models[actor].userData.battleRig,models[receiver].userData.battleRig);for(const f of allFeet[receiver].filter(f=>f.leg.role==='hind'))assert.ok(Math.abs(f.point.y)<2e-5,'tilted receiver keeps both hind support feet');}
  }
  for(const aspect of[.45,16/9])for(const position of[-4,0,4])for(const action of['push','brace','evade']){
   // A real exchange changes position by at most .45, not a teleport from 0 to a ring edge.
   const delta=(position?Math.sign(position):action==='evade'?-1:1)*.35,before=position-delta;
   view.reset();view.resize(aspect);assertPose(view.update({phase:'watching',position:before,lastExchange:null},0,{reducedMotion:true}));
   const s={phase:'finished',position,exchanges:++number,lastExchange:{number,playerAction:action,opponentAction:action==='push'?'brace':'push',positionBefore:before,positionAfter:position,delta}};let contacts=0,last;
   for(let n=0;n<16;n++){last=view.update(s,.1);assertPose(last);if(last.contactActive)contacts++;}
   assert.ok(contacts>=4,'contact is held rather than skipped');assert.equal(last.settled,true,'full release and landing are observed');assert.equal(last.finished,true);
  }
  view.dispose();
 }
});
