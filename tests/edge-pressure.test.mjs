/** One-coefficient rule regression. Small deterministic checks, not a replay of
 * the private 704-pair experiment, rendered QA or an estimate of win probability. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import * as current from '../src/beetle-battle.js';
const read=name=>fs.readFileSync(new URL('../src/'+name,import.meta.url),'utf8');
const sha=text=>createHash('sha256').update(text).digest('hex');
const oldLine="if(species==='stag'&&ownPosition<=-1.5)return .10;";
const newLine="if(species==='stag'&&ownPosition<=-1.5)return .05;";
const source=read('beetle-battle.js'),newSpeciesLine=",\n elephant:{label:'ゾウカブト',role:'丸い体で押し合う',help:'太い胴と前へ伸びた頭角が目印。'}",goliathSpeciesLine=",\n goliath:{label:'ゴライアス',role:'短いY字角で押し合う',help:'白黒の胸と、短い二叉の頭角が目印。'}",fivehornSpeciesLine=",\n fivehorn:{label:'ゴホンヅノカブト',role:'五本の角を合わせる',help:'立ち上がる頭角と、二対の胸角が目印。'}",miyamaSpeciesLine=",\n miyama:{label:'ミヤマクワガタ',role:'張り出した頭と大顎',help:'頭の後ろの張出しと、左右の大顎が目印。'}",priorSpeciesSource=source.replace(/,\n manticora:\{[^\n]+\}\n/,'\n').replace(",\n euchirus:{label:'テナガコガネ',role:'長い前脚で押し合う',help:'Euchirus longimanus の雄。長い左右の前脚が目印。押し合いはゲーム上の動作です。'}",'').replace(newSpeciesLine,'').replace(goliathSpeciesLine,'').replace(fivehornSpeciesLine,'').replace(miyamaSpeciesLine,''),referenceSource=priorSpeciesSource.replace(newLine,oldLine);
const load=source=>import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const reference=await load(referenceSource);
// Test-only exposure, never written to or exported from production runtime.
const audit=await load(source+'\nexport {roleBonus};');
const referenceAudit=await load(referenceSource+'\nexport {roleBonus};');
const tick=(api,s)=>api.advanceBattle(s,api.BATTLE_LIMITS.introSeconds+(s.exchanges+1)*api.BATTLE_LIMITS.exchangeSeconds-s.elapsed);
function endValid(s){
 assert.equal(s.phase,'finished');
 if(s.winner==='draw'){assert.equal(s.finishReason,'time-limit');assert.equal(s.exchanges,36);assert.equal(s.elapsed,59.6);assert.ok(Math.abs(s.position)<4);}
 else{assert.equal(s.finishReason,'ring-out');assert.equal(s.position,s.winner==='player'?4:-4);}
}

test('old species retain the hash-pinned single edge adjustment beside the exact added registry line',()=>{
 assert.equal(source.split(newLine).length,2);assert.equal(source.includes(oldLine),false);
 assert.equal(sha(referenceSource),'8efcca57b8e5c24935fcac053661aed18ce81a250828f4ab901dcab727c6e55b');
 assert.notEqual(priorSpeciesSource,source);assert.equal(referenceSource.replace(oldLine,newLine),priorSpeciesSource);
 assert.deepEqual(Object.fromEntries(Object.entries(current.BATTLE_SPECIES).filter(([key])=>!['elephant','goliath','fivehorn','miyama','euchirus','manticora'].includes(key))),reference.BATTLE_SPECIES);assert.deepEqual(current.BATTLE_LIMITS,reference.BATTLE_LIMITS);
 assert.deepEqual(Object.keys(current).sort(),Object.keys(reference).sort());
 assert.equal(current.BATTLE_SPECIES.stag.help,'端に近づいたときの踏ん張りが少し得意。');
});

test('only stag at or beyond its losing-side -1.5 boundary retains a reduced positive bonus',()=>{
 for(const species of Object.keys(current.BATTLE_SPECIES))for(const number of[1,4,36])for(const position of[-4,-1.5001,-1.5,-1.4999,0,4])for(const action of['push','brace','evade'])for(const previous of[null,'push','brace','evade']){
  const a=referenceAudit.roleBonus(species,number,position,action,previous),b=audit.roleBonus(species,number,position,action,previous);
  if(species==='stag'&&position<=-1.5){assert.equal(a,.10);assert.equal(b,.05);}
  else assert.equal(b,a);
 }
});

test('every non-stag ordered matchup keeps all state output identical on two fixed seeds',()=>{
 const species=Object.keys(current.BATTLE_SPECIES).filter(s=>!['stag','elephant','goliath','fivehorn','miyama','euchirus','manticora'].includes(s));assert.equal(species.length,5);let matches=0;
 for(const playerSpecies of species)for(const opponentSpecies of species)for(const seed of[0,17]){
  const options={playerSpecies,opponentSpecies,seed};let a=reference.createBattle(options),b=current.createBattle(options);
  assert.deepEqual(b,a);
  while(a.phase==='watching'){a=tick(reference,a);b=tick(current,b);assert.deepEqual(b,a);}
  endValid(b);matches++;
 }
 assert.equal(matches,50);
});

test('small recorded outcome table preserves input/energy behavior before and after edge pressure, with ring-out-only results',()=>{
 // Seven examples selected from the saved paired experiment, including both
 // directions, retained draws, a newly resolved draw, and final-exchange ringout.
 const expected=[
  ['rhino','stag',1,'player',27],['rhino','stag',9,'player',11],['rhino','stag',49,'player',36],
  ['stag','stag',1,'player',32],['stag','stag',4,'draw',36],
  ['giantstag','stag',1,'player',32],['stag','giantstag',0,'opponent',15]
 ];
 let matchingBeforeEdge=0,changedAfterEdge=0;
 for(const [playerSpecies,opponentSpecies,seed,winner,exchanges]of expected){
  const options={playerSpecies,opponentSpecies,seed};let a=reference.createBattle(options),b=current.createBattle(options),edgeSeen=false;
  while(a.phase==='watching'&&b.phase==='watching'){
   const edge=(playerSpecies==='stag'&&a.position<=-1.5)||(opponentSpecies==='stag'&&a.position>=1.5);
   edgeSeen ||= edge;a=tick(reference,a);b=tick(current,b);
   for(const key of['playerEnergy','opponentEnergy'])assert.equal(b[key],a[key]);
   for(const key of['playerAction','opponentAction'])assert.equal(b.lastExchange[key],a.lastExchange[key]);
   if(!edgeSeen){assert.deepEqual(b,a);matchingBeforeEdge++;}
   else if(b.position!==a.position)changedAfterEdge++;
  }
  const end=current.advanceBattle(b,100);endValid(end);assert.equal(end.winner,winner);assert.equal(end.exchanges,exchanges);
  assert.deepEqual(current.advanceBattle(current.createBattle({...options,playerSizePermille:1150,opponentSizePermille:1000,input:'push'}),100),end);
  assert.equal(current.advanceBattle(end,100),end);assert.equal(current.cancelBattle(end),end);
 }
 assert.ok(matchingBeforeEdge>0&&changedAfterEdge>0);
});

test('old six-species contact/landing/ring-out paths are unchanged apart from exact new-species adapter branches and cache tags',()=>{
 const expected={
  'battle-view.js':'14995bd2c79987c109ad47761481bf472158fb34989492c942dabfb1e660f88c',
  'battle-choreography.js':'3979b9eae782743f2f7a13d1b0c2d746d587ad787307ce1ef5c7db45e7565673',
  'battle-pose.js':'56756df3184b582dac9ccfc34c5214e31e21f6cd95f3f495e3df54c58c0628db'
 };
 // Remove only the explicit new short-horn adapter before applying the prior
 // elephant/large-giant normalization. Actual old seven-species poses are also
 // compared independently; this guard never treats changed rules as metadata.
 const beforeGoliath=(text,name)=>{
  text=text.replaceAll(",'fivehorn'",'').replace("species==='fivehorn'?.35:",'').replace("   if(attack.species==='fivehorn'){attack.rig.selectFrontWeapon(sign,-1.5);receive.rig.selectFrontContact(-sign,1.5);}\n",'');
  if(name==='battle-view.js')text=text.replace("   attack.rig.resetContactTargets();receive.rig.resetContactTargets();\n",'').replace("   if(attack.species==='goliath'){attack.rig.selectFrontWeapon(sign);receive.rig.selectFrontContact(-sign);}\n",'');
  if(name==='battle-pose.js')text=text.replace("let contactMesh=hit.object;const contactLocal=","const contactMesh=hit.object,contactLocal=").replace(" const defaultWeaponIndex=weaponIndex,defaultContactMesh=contactMesh,defaultContactLocal=contactLocal.clone();\n",'').replace(/  resetContactTargets\(\)\{[\s\S]*?(?=  setJaws\()/,'').replace("restore(){rig.resetContactTargets();","restore(){");
  return text.replaceAll(",'goliath'",'').replaceAll("['elephant'].includes(attack.species)","attack.species==='elephant'").replaceAll("['elephant'].includes(species)","species==='elephant'");
 }; // Remove only explicit elephant adapter branches before comparing the old six-species code.
 const oldView=text=>text.replace(" const scaledGiantPair=[player,opponent].some(e=>e.species==='giantstag'&&e.model.userData.individualScale>1);\n","").replace("createBattleRig(e.model,e.species,{groundedKnees:scaledGiantPair&&e.species==='giantstag'})","createBattleRig(e.model,e.species)").replace("'atlas','giantstag','elephant']","'atlas','giantstag']").replace("attack.species==='elephant'?0:","").replace("['rhino','atlas','elephant']","['rhino','atlas']").replace("let low=attack.rig.torsoBox(scratch).min.y;if(attack.species==='elephant'){const mesh=attack.rig.weapon.mesh,a=mesh.geometry.attributes.position;for(let i=0;i<a.count;i++)low=Math.min(low,corner.fromBufferAttribute(a,i).applyMatrix4(mesh.matrixWorld).y);}","const low=attack.rig.torsoBox(scratch).min.y;");
 const oldPose=text=>text.replace("createBattleRig(model,species,{groundedKnees=false}={})","createBattleRig(model,species)").replace("if(species==='elephant'||groundedKnees){const vertical=","if(species==='elephant'){const vertical=").replace("['giantstag','elephant'].includes(species)","species==='giantstag'").replace("species==='elephant'?[data.weaponHint.mesh]:","").replaceAll("['atlas','elephant'].includes(species)","species==='atlas'").replace("angle*(species==='elephant'?.60:.70)","angle*.70").replace("if(species==='elephant'){const vertical=new T.Vector3(0,1,0).transformDirection(inv);vertical.addScaledVector(axis,-vertical.dot(axis));const capacity=vertical.length();if(capacity>1e-8&&h>1e-8){vertical.divideScalar(capacity);const center=hip.clone().addScaledVector(axis,a).applyMatrix4(parent.matrixWorld),required=(.006*rig.scale-center.y)/(h*rig.scale*capacity);if(up.dot(vertical)<required){const k=Math.min(1,Math.max(-1,required)),side=up.clone().addScaledVector(vertical,-up.dot(vertical));if(side.lengthSq()<1e-12)side.crossVectors(axis,vertical);side.normalize();up.copy(vertical).multiplyScalar(k).addScaledVector(side,Math.sqrt(Math.max(0,1-k*k)));}}}","");
 for(const [name,hash]of Object.entries(expected)){let text=read(name).replace(/\?v=[^'"\s]+/g,'') .replace("import {createManticoraBattleView} from './manticora-battle-view.js';\n",'').replace(" if(playerSpecies==='manticora'||opponentSpecies==='manticora')return createManticoraBattleView({playerSpecies,opponentSpecies,playerSizePermille,opponentSizePermille,aspect});\n",'').replaceAll(",'manticora'",'').replace("species==='manticora'?new T.Vector3(.067,.005,.144):",'').replace("species==='manticora'?data.jaws.map(j=>j.mesh):",'').replace("||scaledAtlasPair",'').replace(" const scaledAtlasPair=[player,opponent].some(e=>e.species==='atlas'&&e.model.userData.individualScale>1);\n",'').replaceAll(",'miyama'",'').replace("(attack.species==='miyama'?.10:.16)",'.16').replace("if(receive.species==='miyama')receive.rig.selectFrontJawContact(-sign);else receive.rig.selectFrontContact(-sign);","receive.rig.selectFrontContact(-sign);").replace("   // Keep the curved jaw shafts just below the receiving belly. This is a\n   // 1.5mm render-contact clearance, not a different capture or battle rule.\n   // The existing 2mm torso-floor margin leaves the rigid body above the table.\n   if(attack.species==='miyama'){attack.anchor.position.y-=.0015*c;attack.anchor.updateMatrixWorld(true);}\n",'');if(name==='battle-view.js')text=text.replace("import {createEuchirusBattleView} from './euchirus-battle-view.js';\n",'').replace(" if(playerSpecies==='euchirus'||opponentSpecies==='euchirus')return createEuchirusBattleView({playerSpecies,opponentSpecies,playerSizePermille,opponentSizePermille,aspect});\n",'');if(name==='battle-view.js')text=oldView(beforeGoliath(text,name));if(name==='battle-pose.js')text=oldPose(beforeGoliath(text,name));assert.equal(sha(text),hash,name);}
 // This is preservation evidence, not a substitute for an actual terminal-view
 // test on the few newly resolved outcomes (owned by the integration task).
});
