/** Grounded foreleg warning is game staging, not an observed wild threat. */
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createHash} from 'node:crypto';
import {createEuchirusStudy} from '../src/euchirus-study.js';
import {sampleEuchirusPose} from '../src/euchirus-kinematics.js';
import {createBranchRetreatStudy} from '../src/branch-retreat-study.js';
const source=fs.readFileSync(new URL('../src/branch-retreat-study.js',import.meta.url),'utf8');
const legacy=source.replace(',boundedStepFinish=false','').replace(',warningPulse=false','').replace('if(warningPulse)warningBlend=0;','').replace('warningBlend=warningPulse?0:move.after','warningBlend=move.after').replace('warningBlend=warningPulse?Math.sin(Math.PI*clamp(warningElapsed/warningSeconds,0,1))**2:warningStart','warningBlend=warningStart').replace(/if\(m\.forelegFinish\)\{const u=clamp\(t\/m\.duration,0,1\);return .*?;\}/g,'').replace(/  \/\* Foreleg-pulse opt-in:[\s\S]*?  else if\(initialSpeed>1e-8\)\{/,'  if(initialSpeed>1e-8){');
const {createBranchRetreatStudy:createOld}=await import('data:text/javascript;base64,'+Buffer.from(legacy).toString('base64'));
const q={x:-Math.SQRT1_2,y:0,z:0,w:Math.SQRT1_2},p={x:1,y:1,z:2},make=()=>createEuchirusStudy({position:p,orientation:q});
function assertStance(s){const pose=sampleEuchirusPose(s),count=pose.legs.filter(l=>l.contact).length;assert.ok(count>=3);if(s.warningBlend>1e-8){assert.equal(s.walkSpeed,0);assert.ok(Math.abs(s.walkPhase/Math.PI-Math.round(s.walkPhase/Math.PI))<1e-9);assert.equal(count,4);assert.ok(pose.legs.filter(l=>l.role!=='front').every(l=>l.contact));}else if(Math.abs(s.walkSpeed)<1e-12)assert.equal(count,6);}
test('old branch callers are byte-reconstructable and keep exact full simulation results',()=>{
 assert.equal(createHash('sha256').update(legacy).digest('hex'),'81ec4214692223429a623aecc78e2396b70c29b687670d130f9b27d72f8e264c');let snapshots=0;
 for(const scale of[1,1.15])for(const seed of[null,1,987654])for(const sign of[-1,1]){const c={species:'old',position:{x:0,y:.055,z:0},heading:sign*Math.PI/2,scale,motionSeed:seed,retreatBounds:{min:-.3,max:.7},cycleDistance:.04,rootAboveSupport:.055,warningSeconds:.18,retreatDistance:.7,retreatSpeed:.36,jawRest:.1,jawWarning:.7},a=createOld(c),b=createBranchRetreatStudy(c);for(let i=0;i<600;i++){if([2,30,120,190,350,500].includes(i)){a.disturb({x:sign*.5,z:0});b.disturb({x:sign*.5,z:0});}if(i===160){a.capture();b.capture();}if(i===180){a.release();b.release();}if(i===470){a.reset();b.reset();}a.update(1/60);b.update(1/60);assert.deepEqual(b.state,a.state);snapshots++;}}
 console.log(JSON.stringify({unchangedOldBranchSnapshots:snapshots}));
});
test('foreleg pulse begins and ends on half-step stance; braking never lifts both front legs',()=>{
 for(const before of[0,10.11,10.63,11.81]){const study=make();for(let t=0;t<before;t+=1/240)study.update(Math.min(1/240,before-t));assert.equal(study.disturb({x:2,z:2}),true);let max=0,walked=false,prev=study.state;for(let i=0;i<600;i++){study.update(1/240);const s=study.state;assertStance(s);assert.ok(Math.abs(s.warningBlend-prev.warningBlend)<.06);max=Math.max(max,s.warningBlend);walked||=s.phase==='retreating';assert.ok(s.position.y>=1-1e-9&&s.position.y<=1.08+1e-9);prev=s;}assert.ok(max>.98);assert.ok(walked);}
});
test('capture freezes the current pulse; release continues, repeated stimulus does not teleport or restart',()=>{
 const study=make();study.disturb({x:2,z:2});study.update(.1);study.capture();const held=study.state;study.update(.1);assert.deepEqual(study.state,held);assert.equal(study.disturb({x:2,z:2}),false);study.release();let previous=study.state;for(let i=0;i<420;i++){study.disturb({x:2,z:2});study.update(1/120);const s=study.state;assertStance(s);assert.ok(Math.hypot(s.position.x-previous.position.x,s.position.y-previous.position.y,s.position.z-previous.position.z)<=.08/120+1e-10);previous=s;}assert.equal(study.state.phase,'cornered');assert.ok(Math.abs(study.state.position.y-1.08)<1e-9);study.reset();assert.equal(study.state.position.y,1);assert.equal(study.state.warningBlend,0);
});
test('support inputs reject malformed objects and preserve caller data',()=>{
 const a={...p},b={...q};createEuchirusStudy({position:a,orientation:b});assert.deepEqual(a,p);assert.deepEqual(b,q);assert.throws(()=>createEuchirusStudy({position:p,orientation:{...q,w:3}}));assert.throws(()=>createEuchirusStudy({position:{...p,x:Infinity},orientation:q}));assert.throws(()=>createEuchirusStudy({position:{...p,extra:1},orientation:q}));assert.equal(make().disturb({x:NaN,z:0}),false);
});
