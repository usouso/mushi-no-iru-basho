/** Production main, input, scene and capture rays with DOM/render/audio and Map
 * storage doubles. This is CPU integration, not WebGL or human-motion proof. */
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';
import {EXPEDITION_SLOTS} from '../src/expedition.js';
import {GIANT_STAG_MOTION} from '../src/giant-stag-study.js';
const root=path.resolve(import.meta.dirname,'..'),source=fs.readFileSync(path.join(root,'tests/companions-main.test.mjs'),'utf8'),marker='\nconst legacy=';assert.ok(source.includes(marker));
const factory=source.slice(0,source.indexOf(marker)).replace("const root=path.resolve(import.meta.dirname,'..');",`const root=${JSON.stringify(root)};`)+'\nexport {app};';const{app}=await import('data:text/javascript;base64,'+Buffer.from(factory).toString('base64'));
const EXPEDITION='mushi-expedition-v2',ROSTER='mushi-companions-v2',JOURNAL='mushi-journal-v2';
const exports='scene,roster,battle,models,inspectModel,collides,direction,rhinoHabitat,stagHabitat,giantStagHabitat';
const click=(h,id)=>h.elements.get(id).click(),select=(h,id,value)=>{const e=h.elements.get(id);e.value=value;e.dispatchEvent(new Event('change'));};
function manifest(site){return{version:2,legacyImportDone:true,generatorVersion:2,worldSeed:123,outingCounter:1,encounters:EXPEDITION_SLOTS.slice(0,6).map(s=>({...s,encounterId:`g${s.species==='giantstag'?2:1}-0000007b-o1-${s.habitat}-${s.populationSlotId}`,sizePermille:s.species==='giantstag'?1150:1000,motionSeed:1,siteIndex:s.species==='giantstag'?site:1,measureVersion:1})),measuredEncounterIds:[],best:[]};}
async function ready(t,site){assert.equal(GIANT_STAG_MOTION.warningSeconds,.22);assert.equal(GIANT_STAG_MOTION.retreatSpeed,.30);const h=await app(t,{expeditionEnabled:true,battleSeed:17,extraExports:exports,entries:[[EXPEDITION,JSON.stringify(manifest(site))]]});await h.g.expedition.flush();await h.g.roster.flush();assert.equal(h.g.expedition.reason,null);h.choose('night');const item=h.g.simulation.items[5];assert.equal(item.species,'giantstag');assert.equal(item.id,'insect-6');assert.equal(item.sizePermille,1150);assert.equal(h.g.models.get(item.id).scale.x,1.15);const{createCaptureVisibility}=await import(h.moduleURL('capture-visibility.js'));h.los=createCaptureVisibility([...h.g.world.captureOccluders,...h.g.rhinoHabitat.captureOccluders,...h.g.stagHabitat.captureOccluders,...h.g.giantStagHabitat.captureOccluders]);return h;}
const giant=h=>h.g.simulation.items[5],pose=i=>({x:i.x,y:i.y,z:i.z,heading:i.heading,pitch:i.pitch,walkPhase:i.walkPhase,walkSpeed:i.walkSpeed,jawOpen:i.jawOpen});
function aim(h,{x,z,quiet=false,offset=0,keepHeight=false}={}){const i=giant(h),p=h.g.state.player;x??=p.x;z??=p.z;assert.equal(h.g.collides(x,z),false,'fixture eye is on a legal walking spot');const y=keepHeight?p.y:h.g.world.heightAt(x,z)+(quiet?1.28:1.65);h.g.setPose({x,y,z,yaw:Math.atan2(x-i.x,z-i.z)+offset,pitch:Math.atan2(i.y-y,Math.hypot(i.x-x,i.z-z)),speed:0});}
function net(h){h.key('keydown','Space');h.key('keyup','Space');}
function observe(h){assert.equal(h.g.simulation.caught,giant(h),'net must catch this individual, not a different species');h.frame(22);assert.equal(h.g.state.mode,'inspect');assert.equal(h.g.inspectModel.userData.species,'giantstag');}
function waitReady(h){let n=0;while(h.g.state.cooldown>0&&n++<50)h.frame(1);assert.ok(n<50);}

test('three maximum-size sites: a real miss moves toward real cover by cooldown, but a visible retry remains catchable',async t=>{
 const metrics=[];
 for(const[site,diagonal]of[[0,true],[1,false],[2,false]]){
  const h=await ready(t,site),{g}=h,i=giant(h),before=pose(i),otherBefore=g.simulation.items.slice(0,5).map(j=>[j.id,j.state,j.rhinoPhase,j.stagPhase]),x=i.x-(diagonal?1.55:2.2),z=i.z-(diagonal?1.55:0);
  aim(h,{x,z,offset:.85});assert.equal(h.los(g.state.player,i),true);assert.equal(g.simulation.findTarget(g.state.player,g.direction())?.catchable??false,false,'off-axis net is genuinely a miss');
  net(h);assert.equal(g.simulation.caught,null,'another insect must not be mistaken for a giant miss');assert.equal(g.state.cooldown,.7);assert.equal(i.giantStagPhase,'warning');assert.deepEqual(g.simulation.items.slice(0,5).map(j=>[j.id,j.state,j.rhinoPhase,j.stagPhase]),otherBefore,'one miss does not startle every nearby insect');
  h.frame(41);assert.ok(g.state.cooldown>0);aim(h,{x,z,keepHeight:true});net(h);assert.equal(g.simulation.caught,null,'pre-boundary retry obeys unchanged cooldown');h.frame(1);
  const at700={site,diagonal,moved:i.x-before.x,phase:i.giantStagPhase,los:h.los(g.state.player,i),cooldown:g.state.cooldown};assert.ok(at700.moved>.09&&at700.moved<.15,'bounded but perceptible movement before the next net');assert.equal(at700.phase,'retreating');assert.equal(at700.los,!diagonal,'only actual bark geometry hides this selected angle');
  waitReady(h);aim(h,{x,z,keepHeight:true});const visible=h.los(g.state.player,i),target=g.simulation.findTarget(g.state.player,g.direction());net(h);
  if(visible){assert.equal(target?.item,i);assert.equal(target.catchable,true);assert.equal(g.simulation.caught,i,'no extra phase/time veto for a visible moving beetle');observe(h);g.release({lock:false});}
  else{
   assert.notEqual(target?.item,i);assert.equal(g.simulation.caught,null,'the actual hood, not a hidden invulnerability flag, blocks this ray');
   const T=window.THREE,eye=g.state.player,delta=new T.Vector3(i.x-eye.x,i.y-eye.y,i.z-eye.z),distance=delta.length(),ray=new T.Raycaster(new T.Vector3(eye.x,eye.y,eye.z),delta.normalize(),0,distance-.10);assert.ok(ray.intersectObject(g.scene.getObjectByName('giantstag-bark-shelter'),false).length,'real opaque hood is the obstruction');
   waitReady(h);h.mouse('mousedown',2);aim(h,{x:i.x,z:-.3,quiet:true});assert.equal(h.los(g.state.player,i),true,'open near side permits a legal quiet re-approach');net(h);observe(h);h.mouse('mouseup',2);g.release({lock:false});
  }
  metrics.push(at700);
 }
 console.log('029 actual main miss/retry boundaries',JSON.stringify(metrics));
});

test('ordinary early accurate net still catches during the shorter warning, without requiring a miss or forced cooldown',async t=>{
 const h=await ready(t,1),{g}=h,i=giant(h);aim(h,{x:i.x-4.2,z:i.z});h.key('keydown','KeyW');let warningAt=null,first=null;
 for(let frame=0;frame<100;frame++){h.frame(1);aim(h,{keepHeight:true});if(i.giantStagPhase==='warning'&&warningAt===null)warningAt=g.simulation.time;const target=g.simulation.findTarget(g.state.player,g.direction());if(target?.item===i&&target.catchable){first={phase:i.giantStagPhase,distance:target.distance,warningAge:g.simulation.time-warningAt};break;}}
 assert.ok(first);assert.notEqual(warningAt,null);assert.equal(first.phase,'warning');assert.ok(first.warningAge>=0&&first.warningAge<.22);assert.equal(g.state.cooldown,0);net(h);h.key('keyup','KeyW');observe(h);assert.equal(g.capturedMeasurement.ok,true);assert.equal(g.capturedMeasurement.entry.sizePermille,1150);console.log('029 early accurate normal approach',JSON.stringify(first));g.release({lock:false});
});

test('quiet maximum-size capture preserves measurement and ownership through COM cancel, exact return and explicit release/recapture',async t=>{
 const h=await ready(t,2),{g}=h,i=giant(h),oldFive=structuredClone(g.activeOuting.encounters.slice(0,5)),id=i.encounterId;h.mouse('mousedown',2);aim(h,{x:i.x-3.2,z:i.z,quiet:true});h.key('keydown','KeyW');let found=false;
 for(let frame=0;frame<100;frame++){h.frame(1);aim(h,{quiet:true,keepHeight:true});assert.equal(i.warningBlend,0,'quiet approach outside its intrusion radius does not trigger the faster warning');const target=g.simulation.findTarget(g.state.player,g.direction());if(target?.item===i&&target.catchable){found=true;break;}}
 assert.equal(found,true);net(h);h.key('keyup','KeyW');observe(h);h.mouse('mouseup',2);assert.equal(g.capturedMeasurement.entry.encounterId,id);assert.equal(g.capturedMeasurement.entry.sizePermille,1150);assert.equal(g.journal.entries.find(e=>e.species==='giantstag').location,'夜の林縁・樹皮の隙間');const captured=pose(i);
 click(h,'keep-button');await g.roster.flush();await g.journal.flush();await g.expedition.flush();assert.equal(i.companion,true);h.frame(1);assert.equal(g.models.get(i.id).visible,false);const owned=g.roster.entries[0],raw=h.savedSettings.get(ROSTER),outingRaw=h.savedSettings.get(EXPEDITION),player={x:g.state.player.x,y:g.state.player.y,z:g.state.player.z};assert.equal(owned.originEncounterId,id);assert.equal(owned.sizePermille,1150);assert.deepEqual(g.activeOuting.encounters.slice(0,5),oldFive);
 click(h,'companions-button');select(h,'companion-select',owned.id);select(h,'battle-opponent-select','goliath');click(h,'battle-start-button');h.frame(40);click(h,'battle-exit-button');assert.equal(g.battle.phase,'cancelled');assert.equal(g.state.mode,'companions');assert.deepEqual(pose(i),captured);assert.equal(h.savedSettings.get(ROSTER),raw);assert.equal(h.savedSettings.get(EXPEDITION),outingRaw);click(h,'companions-close-button');assert.equal(g.state.mode,'playing');assert.deepEqual({x:g.state.player.x,y:g.state.player.y,z:g.state.player.z},player);
 click(h,'companions-button');select(h,'companion-select',owned.id);click(h,'companion-release-button');assert.equal(g.roster.entries.length,1);click(h,'companion-release-button');await g.roster.flush();assert.equal(g.roster.entries.length,0);assert.deepEqual(pose(i),captured,'explicit return starts at the supported captured pose');assert.equal(i.companion,false);click(h,'companions-close-button');h.mouse('mousedown',2);aim(h,{x:i.x,z:-.3,quiet:true});assert.equal(h.los(g.state.player,i),true);waitReady(h);aim(h,{x:i.x,z:-.3,quiet:true});net(h);observe(h);h.mouse('mouseup',2);assert.equal(g.capturedMeasurement.alreadyMeasured,true);assert.equal(g.capturedMeasurement.newRecord,false);assert.deepEqual(g.expedition.snapshot.measuredEncounterIds,[id]);assert.equal(g.simulation.items.filter(j=>j.species==='giantstag').length,1);assert.equal(h.savedSettings.get(EXPEDITION),outingRaw);g.release({lock:false});
});
