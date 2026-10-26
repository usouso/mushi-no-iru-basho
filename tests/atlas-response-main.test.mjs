/** Actual main/net/movement/DOM/stores with the existing Atlas harness. CPU
 * geometry and Map storage doubles only; no GPU, sound or human play-feel claim. */
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),source=fs.readFileSync(path.join(root,'tests/atlas-loop.test.mjs'),'utf8'),marker="\ntest('real net";assert.ok(source.includes(marker));
const factory=source.slice(0,source.indexOf(marker)).replace("const root=path.resolve(import.meta.dirname,'..'),source=",`const root=${JSON.stringify(root)},source=`)+'\nexport {ready,atlas,oldRaw,journalRaw,journalRecord,ROSTER,LEGACY,JOURNAL,EXPEDITION};';
const {ready,atlas,oldRaw,journalRaw,journalRecord,ROSTER,LEGACY,JOURNAL,EXPEDITION}=await import('data:text/javascript;base64,'+Buffer.from(factory).toString('base64'));
const click=(h,id)=>h.elements.get(id).click(),select=(h,id,value)=>{const e=h.elements.get(id);e.value=value;e.dispatchEvent(new Event('change'));};
const pose=i=>({x:i.x,y:i.y,z:i.z,heading:i.heading,walkPhase:i.walkPhase,walkSpeed:i.walkSpeed,headLift:i.headLift,phase:i.atlasPhase});
const dir=p=>({x:-Math.sin(p.yaw)*Math.cos(p.pitch),y:Math.sin(p.pitch),z:-Math.cos(p.yaw)*Math.cos(p.pitch)});
function aim(h,x,z,{quiet=false,offset=0}={}){const i=atlas(h),y=h.g.world.heightAt(x,z)+(quiet?1.28:1.65);assert.equal(h.g.collides(x,z),false,'observer must stand outside real walking colliders');h.g.setPose({x,y,z,speed:0,yaw:Math.atan2(x-i.x,z-i.z)+offset,pitch:Math.atan2(i.y-y,Math.hypot(i.x-x,i.z-z))});}
function net(h){h.key('keydown','Space');h.key('keyup','Space');}
function waitReady(h){let frames=0;while(h.g.state.cooldown>0&&frames<60){h.frame(1);frames++;}assert.equal(h.g.state.cooldown,0);return frames;}
function captured(h){const i=atlas(h);assert.equal(h.g.simulation.caught?.id,i.id);const at=pose(i);h.frame(22);assert.equal(h.g.state.mode,'inspect');assert.deepEqual(pose(i),at);assert.equal(h.g.capturedMeasurement,null);assert.match(h.elements.get('insect-individual-size').textContent,/未計測/);return i;}

test('front real miss warns, retreats during the real .7-second cooldown and remains immediately catchable after legal walking and re-aim',async t=>{
 const h=await ready(t),{g}=h;h.choose('understory');const i=atlas(h),outingRaw=h.savedSettings.get(EXPEDITION),initial=pose(i);
 aim(h,1.6,8.65,{offset:.85});h.frame(1);assert.equal(i.atlasPhase,'resting');net(h);assert.equal(g.simulation.caught,null);assert.equal(g.state.cooldown,.7);assert.equal(i.atlasPhase,'warning');assert.equal(g.journal.entries.length,0);
 const start={...g.state.player},started=g.state.elapsed;h.key('keydown','KeyW');h.frame(10);const remaining=g.state.cooldown;net(h);assert.equal(g.state.cooldown,remaining,'early repeated net input cannot bypass or restart the cooldown');assert.equal(g.simulation.caught,null);
 h.frame(4);assert.equal(i.atlasPhase,'retreating','short visible warning ends before .24 seconds');assert.ok(i.z<initial.z);const frames=14+waitReady(h);h.key('keyup','KeyW');
 assert.ok(frames>=42&&frames<=43);assert.ok(g.state.elapsed-started>=.7-1e-9&&g.state.elapsed-started<.72);assert.ok(Math.hypot(g.state.player.x-start.x,g.state.player.z-start.z)>1,'W moves the actual main player, not a target teleport');assert.ok(g.state.player.speed>2.6);assert.equal(g.collides(g.state.player.x,g.state.player.z),false);
 assert.ok(initial.z-i.z>.09&&initial.z-i.z<.2,'retreat advances materially during cooldown without teleporting or leaving the .7m route');assert.equal(i.atlasPhase,'retreating');
 aim(h,g.state.player.x,g.state.player.z);assert.equal(g.simulation.findTarget(g.state.player,dir(g.state.player))?.item.id,i.id,'visible supported target has no hidden immunity after a miss');net(h);captured(h);assert.equal(h.savedSettings.get(EXPEDITION),outingRaw);assert.equal(g.activeOuting.encounters.length,6);
 console.log('Atlas front main recovery:',JSON.stringify({cooldownFrames:frames,retreat:initial.z-i.z,playerTravel:Math.hypot(g.state.player.x-start.x,g.state.player.z-start.z)}));
});

test('rear off-axis real miss does not send the fixed forward-facing Atlas toward the observer, and a re-aimed net still captures',async t=>{
 const h=await ready(t),{g}=h;h.choose('understory');const i=atlas(h);aim(h,3.4,5.1,{offset:.85});h.frame(1);const at=pose(i),distance=Math.hypot(i.x-g.state.player.x,i.z-g.state.player.z);
 assert.ok((g.state.player.x-i.x)*Math.sin(i.heading)+(g.state.player.z-i.z)*Math.cos(i.heading)<-.15);
 net(h);assert.equal(g.simulation.caught,null);assert.equal(g.state.cooldown,.7);assert.equal(i.atlasPhase,'resting');waitReady(h);assert.deepEqual(pose(i),at);assert.equal(Math.hypot(i.x-g.state.player.x,i.z-g.state.player.z),distance);
 aim(h,3.4,5.1);assert.equal(g.simulation.findTarget(g.state.player,dir(g.state.player))?.item.id,i.id);net(h);captured(h);assert.equal(g.journal.entries.filter(e=>e.species==='atlas').length,1);
});

test('actual quiet walking capture, journal, keep and COM cancellation freeze the same pose; explicit return permits recapture without altering six-slot outing or old saves',async t=>{
 const h=await ready(t,{entries:[[LEGACY,oldRaw],[JOURNAL,journalRaw]]}),{g}=h;h.choose('understory');const outingRaw=h.savedSettings.get(EXPEDITION),outing=structuredClone(g.activeOuting),oldRoster=g.roster.entries;assert.equal(outing.encounters.length,6);
 h.mouse('mousedown',2);aim(h,0,atlas(h).z,{quiet:true});h.key('keydown','KeyW');h.frame(5);h.key('keyup','KeyW');assert.ok(g.state.player.speed>1&&g.state.player.speed<1.06);assert.equal(g.state.player.quiet,true);assert.equal(atlas(h).atlasPhase,'resting');aim(h,g.state.player.x,g.state.player.z,{quiet:true});net(h);h.mouse('mouseup',2);const i=captured(h),at=pose(i);
 click(h,'inspect-journal-button');assert.equal(g.state.mode,'journal');g.journal.setNote('atlas','短い警告の後も、枝で後ずさる');h.frame(12);assert.deepEqual(pose(i),at);g.closeJournal({lock:false});assert.equal(g.state.mode,'inspect');assert.deepEqual(pose(i),at);
 click(h,'keep-button');await g.roster.flush();await g.journal.flush();assert.equal(i.companion,true);assert.equal(g.simulation.caught,null);assert.equal(g.roster.entries.length,oldRoster.length+1);const held=pose(i),entry=g.roster.entries.at(-1),rosterRaw=h.savedSettings.get(ROSTER);assert.equal(entry.id,'understory/insect-5');for(const k of ['originEncounterId','sizePermille','measureVersion'])assert.equal(entry[k],null);
 click(h,'companions-button');select(h,'companion-select',entry.id);select(h,'battle-opponent-select','rhino');click(h,'battle-start-button');assert.equal(g.state.mode,'battle');h.frame(20);assert.deepEqual(pose(i),held);click(h,'battle-exit-button');assert.equal(g.battle.phase,'cancelled');click(h,'companions-close-button');assert.equal(g.state.mode,'playing');h.frame(2);assert.deepEqual(pose(i),held);assert.equal(g.models.get(i.id).visible,false);assert.equal(g.simulation.items.filter(item=>item.species==='atlas').length,1);assert.equal(h.savedSettings.get(ROSTER),rosterRaw);
 click(h,'companions-button');select(h,'companion-select',entry.id);click(h,'companion-release-button');assert.equal(i.companion,true);click(h,'companion-release-button');assert.equal(i.companion,false);assert.equal(i.x,held.x);assert.equal(i.y,held.y);assert.equal(i.z,held.z);assert.equal(i.walkPhase,held.walkPhase);await g.roster.flush();click(h,'companions-close-button');h.frame(1);assert.equal(g.models.get(i.id).visible,true);
 h.mouse('mousedown',2);waitReady(h);aim(h,0,i.z,{quiet:true});h.frame(1);aim(h,0,i.z,{quiet:true});net(h);h.mouse('mouseup',2);captured(h);assert.equal(g.journal.entries.find(e=>e.species==='atlas').note,'短い警告の後も、枝で後ずさる');assert.deepEqual(g.roster.entries,oldRoster);
 assert.equal(h.savedSettings.get(EXPEDITION),outingRaw);assert.deepEqual(g.activeOuting,outing);assert.equal(h.savedSettings.get(LEGACY),oldRaw);assert.deepEqual(g.journal.entries.find(e=>e.species==='rhino'),journalRecord);assert.equal(g.expedition.snapshot.measuredEncounterIds.length,0);assert.equal(g.expedition.snapshot.best.length,0);
});
