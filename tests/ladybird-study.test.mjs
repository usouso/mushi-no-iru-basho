/** CPU pose/continuity checks; no anatomical timing or actual-rendering claim. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createLadybirdStudy} from '../src/ladybird-study.js';
import {LADYBIRD_DIMENSIONS as D,sampleLadybirdPose} from '../src/ladybird-kinematics.js';
const supports=()=>[{position:{x:-4.5,y:.8642506197+D.rootAboveSupport,z:-10.8},heading:Math.PI},{position:{x:-3.6,y:.9172597431+D.rootAboveSupport,z:-11.3},heading:Math.PI}],gap=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const worldFoot=(state,p)=>({x:state.position.x+Math.cos(state.heading)*p.x+Math.sin(state.heading)*p.z,y:state.position.y+p.y,z:state.position.z-Math.sin(state.heading)*p.x+Math.cos(state.heading)*p.z});
function step(s,seconds){for(let n=0;n<Math.round(seconds*120);n++)s.update(1/120);}
function until(s,check,max=45){for(let n=0;n<max*120;n++){s.update(1/120);if(check(s.state))return;}assert.fail('expected ladybird phase');}

test('short six-leg walking and finite flights preserve the visible shell-before-storage sequence through two landings',()=>{
 const s=createLadybirdStudy(supports()),phases=new Set();let before=s.state,landings=0;
 for(let n=0;n<75*120;n++){
  s.update(1/120);const a=s.state,p=sampleLadybirdPose(a);phases.add(a.phase);
  for(const value of [...Object.values(a.position),a.heading,a.pitch,a.walkPhase,a.walkSpeed,a.elytraOpen,a.hindwingDeploy,a.hindwingSweep,a.wingPhase,a.legTuck,a.time])assert.ok(Number.isFinite(value));
  assert.equal(a.pitch,0);for(const key of ['elytraOpen','hindwingDeploy','hindwingSweep','legTuck'])assert.ok(a[key]>=0&&a[key]<=1);
  assert.ok(gap(a.position,before.position)<.006);assert.ok(Math.abs(a.heading-before.heading)<.07);for(const key of ['elytraOpen','hindwingDeploy','hindwingSweep','legTuck'])assert.ok(Math.abs(a[key]-before[key])<.03,key);
  if(a.phase==='opening'){assert.equal(a.hindwingDeploy,0);assert.equal(a.hindwingSweep,0);}
  if(a.phase==='deploying'){assert.equal(a.elytraOpen,1);if(a.hindwingSweep>0)assert.equal(a.hindwingDeploy,1);}
  if(a.phase==='closing'){assert.equal(a.hindwingDeploy,1);if(a.elytraOpen<1)assert.equal(a.hindwingSweep,0);}
  if(a.phase==='stowing'){assert.equal(a.elytraOpen,0);assert.equal(a.hindwingSweep,0);}
  if(a.phase==='flying'){assert.equal(a.elytraOpen,1);assert.equal(a.hindwingDeploy,1);assert.equal(a.hindwingSweep,1);}
  else{assert.equal(a.legTuck,0);assert.ok(p.legs.filter(l=>l.contact).length>=3);if(a.phase!=='walking')assert.equal(p.legs.filter(l=>l.contact).length,6);for(const foot of p.legs.filter(l=>l.contact))assert.ok(Math.abs(foot.foot.y+D.rootAboveSupport)<1e-10);}
  if(before.phase==='walking'&&a.phase==='opening')assert.ok(Math.abs(Math.sin(a.walkPhase))<1e-10);
  if(before.phase==='stowing'&&a.phase==='resting'){landings++;assert.equal(a.hindwingDeploy,0);assert.ok(supports().some(p=>gap(p.position,a.position)<1e-10));}
  before=a;
 }
 assert.deepEqual(phases,new Set(['resting','walking','opening','deploying','flying','closing','stowing']));assert.ok(landings>=2);
});

test('the .036m straight walk keeps stance feet world-fixed and ends without resetting gait phase',()=>{
 const s=createLadybirdStudy(supports());until(s,a=>a.phase==='walking');const start=s.state.position;let before=s.state,oldPose=sampleLadybirdPose(before);
 while(s.state.phase==='walking'){
  s.update(1/120);const a=s.state,p=sampleLadybirdPose(a);for(let i=0;i<6;i++)if(oldPose.legs[i].contact&&p.legs[i].contact)assert.ok(gap(worldFoot(before,oldPose.legs[i].foot),worldFoot(a,p.legs[i].foot))<1e-10);
  assert.ok(a.walkPhase>=before.walkPhase);before=a;oldPose=p;
 }
 assert.equal(s.state.phase,'opening');assert.ok(Math.abs(gap(start,s.state.position)-.036)<1e-10);assert.ok(Math.abs(s.state.walkPhase-4*Math.PI)<1e-10);assert.equal(sampleLadybirdPose(s.state).legs.filter(l=>l.contact).length,6);
});

test('mid-stride departure finishes only the next supported half-cycle; every wing/walk phase freezes and resumes exact pose',()=>{
 const midway=createLadybirdStudy(supports());until(midway,a=>a.phase==='walking');step(midway,.137);const from=midway.state,geometry=sampleLadybirdPose(from);assert.equal(midway.depart(),true);assert.deepEqual(sampleLadybirdPose(midway.state),geometry);until(midway,a=>a.phase==='opening');assert.ok(gap(from.position,midway.state.position)>0&&gap(from.position,midway.state.position)<D.cycleDistance/2+1e-10);assert.equal(sampleLadybirdPose(midway.state).legs.filter(l=>l.contact).length,6);
 for(const [phase,elapsed]of [['resting',1.3],['walking',.137],['opening',.31],['deploying',.41],['flying',.67],['closing',.27],['closing',.86],['stowing',.47]]){
  const s=createLadybirdStudy(supports());if(phase==='walking')until(s,a=>a.phase==='walking');else if(phase!=='resting'){s.depart();if(phase!=='opening')until(s,a=>a.phase===phase);}step(s,elapsed);assert.equal(s.state.phase,phase);
  const before=s.state,pose=sampleLadybirdPose(before);assert.equal(s.capture(),true);assert.equal(s.capture(),false);assert.equal(s.depart(),false);step(s,2);assert.deepEqual({...s.state,caught:false,walkSpeed:before.walkSpeed},before);assert.equal(s.release(),true);assert.equal(s.release(),false);assert.deepEqual(sampleLadybirdPose(s.state),pose);assert.equal(s.state.time,before.time);
  s.update(1/120);assert.ok(gap(s.state.position,before.position)<.00001);for(const key of ['elytraOpen','hindwingDeploy','hindwingSweep','legTuck'])assert.ok(Math.abs(s.state[key]-before[key])<.0001,key);until(s,a=>a.phase==='resting');assert.equal(s.state.elytraOpen,0);assert.equal(s.state.hindwingDeploy,0);
 }
});

test('supports and snapshots are detached; invalid/zero dt freezes and oversized dt clamps without nonfinite outputs',()=>{
 const points=supports(),s=createLadybirdStudy(points),initial=s.state;points[0].position.x=99;const leaked=s.state;leaked.position.y=99;assert.deepEqual(s.state,initial);for(const dt of [0,-1,NaN,Infinity])s.update(dt);assert.deepEqual(s.state,initial);const other=createLadybirdStudy(supports());s.update(100);other.update(.1);assert.deepEqual(s.state,other.state);
 for(const value of [[],[supports()[0]],[supports()[0],supports()[0]]])assert.throws(()=>createLadybirdStudy(value),/Invalid ladybird supports/);const bad=supports();bad[1].position.y=NaN;assert.throws(()=>createLadybirdStudy(bad),/Invalid ladybird supports/);
});
