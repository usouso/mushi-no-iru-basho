/** Actual main/geometry with fake DOM, renderer, storage and audio. CPU-only:
 * no browser appearance, physical gamepad, eating-animation or real-sound claim. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve(import.meta.dirname,'..');
const source=fs.readFileSync(path.join(root,'tests/hercules-main.test.mjs'),'utf8'),marker='\nconst beetles=()=>';assert.ok(source.includes(marker));
let harness=source.slice(0,source.indexOf(marker)).replace("from './fixtures/journal-locks.mjs'",`from ${JSON.stringify(pathToFileURL(path.join(root,'tests/fixtures/journal-locks.mjs')).href)}`).replace("const root=path.resolve(import.meta.dirname,'..');",`const root=${JSON.stringify(root)};`);
harness=harness.replace('export {state,simulation,world,journal,','export {state,simulation,world,logFruitHabitat,journal,');
harness+='\nexport {g,frame,elements,key,choose,find,renderedScene};export function setPads(pads){gamepads=pads;}';
const h=await import('data:text/javascript;base64,'+Buffer.from(harness).toString('base64'));
const{g,frame,elements,key,choose,find}=h;
const point=i=>({x:i.x,y:i.y,z:i.z});
const press=()=>{key('keydown','KeyE');key('keyup','KeyE');};
const pose=(x,z)=>g.setPose({x,z,y:g.world.heightAt(x,z)+1.65,speed:0});
test('one nearest E/X action keeps both fruit slots independent through log visit, capture, expiry and teardown',async t=>{
 t.after(()=>window.dispatchEvent(new Event('pagehide')));
 choose('tropical');assert.equal(g.simulation.items.length,11);
 const table=g.world.baitStation,log=g.logFruitHabitat.station,fruit=h.renderedScene.getObjectByName('tropical-log-fermented-fruit');assert.ok(fruit);assert.equal(fruit.visible,false);
 const midpoint={x:(table.x+log.x)/2,z:(table.z+log.z)/2};pose(midpoint.x,midpoint.z);
 assert.equal(Math.hypot(midpoint.x-table.x,midpoint.z-table.z),Math.hypot(midpoint.x-log.x,midpoint.z-log.z),'test the exact tie, not a rounded near-tie');
 press();assert.equal(g.simulation.bait?.active,true);assert.equal(g.simulation.logFruit,null,'old table wins a tie');
 const nearLog={x:midpoint.x+(log.x-table.x)*.05,z:midpoint.z+(log.z-table.z)*.05};pose(nearLog.x,nearLog.z);frame(1);assert.match(elements.get('interaction-hint').textContent,/E \/ X.*倒木/);press();assert.equal(g.simulation.logFruit?.active,true);assert.equal(g.simulation.bait?.active,true);assert.equal(fruit.visible,true);assert.match(elements.get('toast').textContent,/そばで休む/);assert.doesNotMatch(elements.get('toast').textContent,/食べ|摂食|咀嚼/);
 // Gamepad X uses the same nearest selector; held X must not toggle it twice.
 pose(table.x,table.z+1);const pad={connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};h.setPads([pad]);pad.buttons[2]={pressed:true,value:1};frame(1);assert.equal(g.simulation.bait,null);assert.equal(g.simulation.logFruit?.active,true);frame(2);assert.equal(g.simulation.bait,null);pad.buttons[2]={pressed:false,value:0};frame(1);h.setPads([]);
 pose(nearLog.x,nearLog.z);press();assert.equal(g.simulation.logFruit,null);assert.equal(g.simulation.bait,null);assert.equal(fruit.visible,false,'log cleanup only changes its own mesh');
 // Place again and watch the existing supported male walk to rest beside it.
 press();pose(log.x,log.z+4);let reached=false;
 for(let n=0;n<60*70;n++){frame(1);if(g.simulation.logFruit?.status==='resting'){reached=true;break;}}
 assert.ok(reached,'first log worker reaches a nearby resting point without a new input');
 const visitor=g.simulation.items.find(i=>i.id===g.simulation.logFruit.visitorId),home=g.logFruitHabitat.simulationStation.supportHome;assert.equal(visitor?.species,'hercules');assert.deepEqual(visitor.home,home);assert.equal(fruit.visible,true);
 pose(log.x,log.z+2);frame(1);assert.match(elements.get('interaction-hint').textContent,/倒木の果実.*果実のそばで休止中/);assert.doesNotMatch(elements.get('interaction-hint').textContent,/食べ|摂食|咀嚼/);
 pose(visitor.x,visitor.z+1.3);g.setPose({yaw:0,pitch:Math.atan2(visitor.y-g.state.player.y,1.3)});key('keydown','Space');key('keyup','Space');assert.equal(g.simulation.caught?.id,visitor.id);const caughtAt=point(visitor);frame(22);assert.equal(g.state.mode,'inspect');assert.deepEqual(point(visitor),caughtAt);assert.equal(fruit.visible,true);
 elements.get('inspect-journal-button').click();const editor=find('fj-note');editor.value='倒木の果実のそばで休んだ j';editor.dispatchEvent(new Event('input'));assert.equal(g.state.mode,'journal');const remaining=g.simulation.logFruit.remaining;frame(30);assert.equal(g.simulation.logFruit.remaining,remaining);key('keydown','Escape');key('keyup','Escape');assert.equal(g.state.mode,'inspect');g.release({lock:false});assert.deepEqual(point(visitor),caughtAt);
 pose(log.x,log.z+4);frame(2);g.pause();const frozen=g.simulation.logFruit,pausedAt=point(visitor);frame(120);assert.deepEqual(g.simulation.logFruit,frozen);assert.deepEqual(point(visitor),pausedAt);g.resume({lock:false});
 for(let n=0;n<60*95&&g.simulation.logFruit;n++)frame(1);assert.equal(g.simulation.logFruit,null);assert.equal(fruit.visible,false,'expiry clears only the new fruit presentation');
 // Reset/title remove the independent slot without reviving an old reservation.
 pose(nearLog.x,nearLog.z);press();assert.equal(g.simulation.logFruit?.active,true);g.restart();frame(1);assert.equal(g.simulation.logFruit,null);assert.equal(g.simulation.bait,null);assert.equal(fruit.visible,false);
 pose(nearLog.x,nearLog.z);press();g.title();frame(1);assert.equal(g.simulation.logFruit,null);assert.equal(fruit.visible,false);g.start();frame(1);assert.equal(g.simulation.logFruit,null);
 await g.journal.flush();const saved=g.journal.entries.find(e=>e.species==='hercules');assert.equal(saved.note,'倒木の果実のそばで休んだ j');let geometries=0,materials=0;fruit.geometry.addEventListener('dispose',()=>geometries++);fruit.material.addEventListener('dispose',()=>materials++);
 choose('meadow');assert.equal(g.logFruitHabitat,null);assert.equal(g.simulation.items.length,29);assert.equal(geometries,1);assert.equal(materials,1);assert.equal(fruit.parent,null);choose('tropical');assert.equal(g.simulation.logFruit,null);assert.equal(g.simulation.bait,null);assert.equal(h.renderedScene.getObjectByName('tropical-log-fermented-fruit').visible,false);assert.deepEqual(g.journal.entries.find(e=>e.species==='hercules'),saved);
});
