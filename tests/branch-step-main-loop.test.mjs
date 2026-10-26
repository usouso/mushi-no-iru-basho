/** Bounded low-speed response through production main/net/DOM and real simulation.
 * Mock DOM/WebGL/audio and MapStorage; not browser render or play-feel evidence. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),source=fs.readFileSync(path.join(root,'tests/companions-main.test.mjs'),'utf8'),marker='\nconst legacy=';
assert.ok(source.includes(marker));
const factory=source.slice(0,source.indexOf(marker)).replace("const root=path.resolve(import.meta.dirname,'..');",`const root=${JSON.stringify(root)};`)+'\nexport {app};';
const {app}=await import('data:text/javascript;base64,'+Buffer.from(factory).toString('base64'));
const JOURNAL='mushi-journal-v2',ROSTER='mushi-companions-v2',note={species:'euchirus',firstSeen:1,lastSeen:2,location:'前の区画',x:1,z:2,note:'以前の長脚のメモ'},journalRaw=JSON.stringify({version:2,legacyImportDone:true,entries:[note]});
const extraExports='roster,models,collides,keepCaptured,openCompanions,closeCompanions,releaseCompanion,applyCompanionPresence';
const pose=i=>({x:i.x,y:i.y,z:i.z,heading:i.heading,walkPhase:i.walkPhase,jawOpen:i.jawOpen,warningBlend:i.warningBlend});
const click=(h,id)=>h.elements.get(id).click();
const net=h=>{h.key('keydown','Space');h.key('keyup','Space');};
function aim(h,i,p,{quiet=false,offset=0}={}){const y=h.g.world.heightAt(p.x,p.z)+(quiet?1.28:1.65);assert.equal(h.g.collides(p.x,p.z),false);h.g.setPose({x:p.x,y,z:p.z,speed:0,yaw:Math.atan2(p.x-i.x,p.z-i.z)+offset,pitch:Math.atan2(i.y-y,Math.hypot(i.x-p.x,i.z-p.z))});}
function waitFirstSlowStep(h,i,phase){h.g.setPose({x:0,y:h.g.world.heightAt(0,10)+1.65,z:10,speed:0});let frames=0;while(!(i[phase]==='walking'&&Math.abs(i.walkSpeed)>.0001)&&frames<1500){h.frame(1);frames++;}assert.ok(frames<1500,'natural low-speed walk starts');assert.ok(Math.abs(i.walkSpeed)<=.02/18+1e-8,'fixture is the affected first slow step, not established walking');assert.equal(i.warningBlend,0);return frames;}
function capture(h,i,p){h.mouse('mousedown',2);aim(h,i,p,{quiet:true});while(h.g.state.cooldown>0)h.frame(1);net(h);h.mouse('mouseup',2);assert.equal(h.g.simulation.caught,i,'real net catches the visible intended branch insect');const at=pose(i);assert.equal(i.walkSpeed,0);h.frame(22);assert.equal(h.g.state.mode,'inspect');assert.deepEqual(pose(i),at,'held branch pose remains frozen');return at;}
for(const f of[
 {species:'giantstag',habitat:'night',id:'insect-6',phase:'giantStagPhase',stimulus:'missed net',p:{x:-7.95,z:2}},
 {species:'miyama',habitat:'meadow',id:'insect-30',phase:'miyamaPhase',stimulus:'ordinary approach',p:{x:-8.23,z:-6.98}}
])test(`${f.species}: actual low-speed ${f.stimulus} warns promptly; quiet capture, exact return and retained origin stay intact`,async t=>{
 const h=await app(t,{extraExports,entries:[[JOURNAL,journalRaw]]}),{g}=h;await g.roster.flush();h.choose(f.habitat);let i=g.simulation.items.find(i=>i.species===f.species);assert.equal(i.id,f.id);assert.equal(i.encounterId,undefined,'legacy fixed fixture, not rerolled/generated');
 // First the quiet path: real right-button posture produces no threat, capture
 // while already moving and release without resetting the supported phase.
 const startFrames=waitFirstSlowStep(h,i,f.phase);h.mouse('mousedown',2);aim(h,i,f.p,{quiet:true});h.frame(6);assert.equal(i.warningBlend,0);assert.equal(i[f.phase],'walking');const quietSpeed=i.walkSpeed;net(h);h.mouse('mouseup',2);assert.equal(g.simulation.caught,i);const quietHeld=pose(i);h.frame(22);assert.equal(g.state.mode,'inspect');assert.deepEqual(pose(i),quietHeld);click(h,'release-button');assert.equal(g.state.mode,'playing');assert.deepEqual(pose(i),quietHeld,'release neither rewinds nor snaps the walk phase');assert.equal(i.walkSpeed,quietSpeed,'released ordinary walk resumes its frozen velocity');assert.equal(g.roster.entries.length,0);
 // Reset only via production main, then stimulate the first naturally moving
 // frame through the real missed-net / ordinary-W approach path. No synthetic study/disturb calls.
 g.restart();i=g.simulation.items.find(i=>i.species===f.species);waitFirstSlowStep(h,i,f.phase);aim(h,i,f.p,{offset:f.species==='giantstag'?.85:0});const before=pose(i),initialSpeed=i.walkSpeed;if(f.species==='giantstag'){net(h);assert.equal(g.simulation.caught,null,'off-axis real swing misses');assert.ok(g.state.cooldown>0);}else h.key('keydown','KeyW');assert.deepEqual(pose(i),before,'stimulus does not teleport the supported insect');
 let warningFrame=null;for(let frame=1;frame<=40;frame++){h.frame(1);if(frame===1&&f.species==='miyama'){assert.ok(g.state.player.speed>2.6,'real forward input provides ordinary approach pressure');h.key('keyup','KeyW');}assert.ok([i.x,i.y,i.z,i.walkPhase,i.walkSpeed,i.warningBlend].every(Number.isFinite));if(i[f.phase]==='warning'){warningFrame=frame;break;}}
 if(warningFrame===null)t.diagnostic(JSON.stringify({before,after:pose(i),phase:i[f.phase],player:g.state.player,initialSpeed,cooldown:g.state.cooldown}));assert.equal(warningFrame,36,'bounded half-step warns in .60s at real 60Hz, not 18s');assert.equal(i.walkSpeed,0);assert.ok(Math.abs(Math.sin(i.walkPhase))<1e-8,'warning starts at existing half-step endpoint');assert.ok(i.warningBlend>=.35-1e-8,'legacy warning, not Euchirus pulse');
 const warned=pose(i),held=capture(h,i,f.p);assert.equal(i[f.phase],'warning','cooldown finishes before the warning ends');click(h,'release-button');assert.equal(g.state.mode,'playing');assert.deepEqual(pose(i),held);assert.equal(g.simulation.caught,null);
 // Re-capture after the real cooldown; retain and confirm explicit release.
 capture(h,i,f.p);click(h,'keep-button');click(h,'keep-button');await g.roster.flush();await g.journal.flush();assert.equal(g.roster.entries.length,1);const entry=g.roster.entries[0];assert.equal(entry.id,`${f.habitat}/${f.id}`);assert.equal(entry.originKind,'legacy');for(const key of['originEncounterId','sizePermille','measureVersion'])assert.equal(entry[key],null);assert.equal(i.companion,true);h.frame(1);assert.equal(g.models.get(i.id).visible,false);assert.deepEqual(g.journal.entries.find(e=>e.species==='euchirus'),note);
 const keptRaw=h.savedSettings.get(ROSTER);h.travel(f.habitat==='night'?'meadow':'night');h.travel(f.habitat);i=g.simulation.items.find(i=>i.species===f.species);assert.equal(i.companion,true);assert.equal(g.models.get(i.id).visible,false);assert.equal(h.savedSettings.get(ROSTER),keptRaw);click(h,'companions-button');const select=h.elements.get('companion-select');select.value=entry.id;select.dispatchEvent(new Event('change'));click(h,'companion-release-button');assert.equal(g.roster.entries.length,1);click(h,'companion-release-button');await g.roster.flush();assert.equal(g.roster.entries.length,0);click(h,'companions-close-button');h.frame(1);assert.equal(i.companion,false);assert.equal(g.models.get(i.id).visible,true);capture(h,i,f.p);click(h,'release-button');assert.equal(g.state.mode,'playing');
 console.log(JSON.stringify({species:f.species,stimulus:f.stimulus,startFrames,initialSpeed,warningFrame,warningSeconds:warningFrame/60,warningTravel:Math.hypot(warned.x-before.x,warned.y-before.y,warned.z-before.z),quietCapture:true,exactReturn:true,retainedTravelAndExplicitRelease:true,notActualBrowserOrGPU:true}));
});
