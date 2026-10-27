/** Bounded 057 field/study checks, not wildlife timing or GPU validation. */
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import {priorModel,priorInsects,priorStudy,priorHabitat,priorLayout,priorIndividualLayout}from './fixtures/rainbow-individual-field-prior.mjs';
const box={};vm.runInNewContext(fs.readFileSync(new URL('../assets/vendor/three.min.js',import.meta.url),'utf8'),box);const T=box.THREE;globalThis.window={THREE:T};const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{})});globalThis.document={createElement:()=>({getContext:()=>ctx})};
const {createRainbowStagStudy:create}=await import('../src/rainbow-stag-study.js'),{createInsects,SPECIES}=await import('../src/insects.js'),{createAustraliaWorld}=await import('../src/world-australia.js'),{createRainbowStagHabitat}=await import('../src/rainbow-stag-habitat.js'),{individualHabitatOptions}=await import('../src/individual-layout.js'),{createCaptureVisibility}=await import('../src/capture-visibility.js'),{createInsectModel,updateInsectModel}=await import('../src/insect-models.js');
const read=f=>fs.readFileSync(new URL('../src/'+f+'.js',import.meta.url),'utf8'),data=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64'),resolve=s=>s.replace(/from\s*(['"])(\.\/[^'"]+)\1/g,(_,q,p)=>`from ${q}${new URL('../src/'+p,import.meta.url).href}${q}`),oldStudyURL=data(resolve(priorStudy(read('rainbow-stag-study')))),oldStudy=await import(oldStudyURL),oldField=await import(data(resolve(priorInsects(read('insects')).replace("'./rainbow-stag-study.js'",JSON.stringify(oldStudyURL)))));
const clone=structuredClone,close=(a,b,e=1e-9)=>assert.ok(Math.abs(a-b)<e,`${a} != ${b}`),home={x:0,y:.60,z:.10},q={x:0,y:Math.SQRT1_2,z:0,w:Math.SQRT1_2},studyOptions=()=>({position:{...home},orientation:{...q},retreatBounds:{min:-.34,max:.34}}),far={x:7,y:1.65,z:7,speed:0,quiet:true},eye={x:0,y:1.28,z:1.5,speed:0,quiet:true},front={x:2.4,y:1.65,z:0,speed:2.7,quiet:false},aim=i=>({x:i.x-eye.x,y:i.y-eye.y,z:i.z-eye.z}),pose=i=>({x:i.x,y:i.y,z:i.z,orientation:clone(i.orientation),walkPhase:i.walkPhase,jawOpen:i.jawOpen}),identity=i=>Object.fromEntries(['id','species','encounterId','sizePermille','motionSeed','measureVersion','populationSlotId'].map(k=>[k,i[k]]));
const scene=new T.Scene(),world=createAustraliaWorld(scene),habitat=createRainbowStagHabitat(world,scene),base={homes:[],extraHomes:habitat.homes,rainbowStagSupports:habitat.rainbowStagSupports,bounds:world.bounds,hasLineOfSight:createCaptureVisibility(world.captureOccluders)};
const profile=(size=1150,site=1,seed=1729)=>({species:'rainbowstag',habitat:'australia',runtimeSlotId:'insect-1',populationSlotId:'rainbowstag',encounterId:'g8-1234abcd-o9007199254740991-australia-rainbowstag',sizePermille:size,motionSeed:seed,siteIndex:site,measureVersion:1}),options=r=>individualHabitatOptions('australia',base,r?{encounters:[r]}:null,world.heightAt),field=r=>createInsects(world.heightAt,options(r)),advance=(s,n,p=far)=>{for(let k=0;k<Math.round(n*120);k++)s.update(1/120,p);};

test('exact 057 inverses retain frozen056 source and legacy fixed/default clocks, controls and metadata',()=>{
 for(const [name,fn]of Object.entries({'insect-models':priorModel,insects:priorInsects,'rainbow-stag-study':priorStudy,'rainbow-stag-habitat':priorHabitat,'rainbow-stag-layout':priorLayout,'individual-layout':priorIndividualLayout})){const source=read(name);assert.ok(fn(source));assert.throws(()=>fn(source.replace('RAINBOW_INDIVIDUAL_BEGIN','MUTATED_BEGIN')));}
 for(const [key,value]of Object.entries(oldField.SPECIES))assert.deepEqual(SPECIES[key],key==='rainbowstag'?{...value,size:SPECIES[key].size}:value);assert.match(SPECIES.rainbowstag.size,/保存成功後.*表示指数.*以前の固定個体/);
 assert.deepEqual(create().state,oldStudy.createRainbowStagStudy().state);assert.deepEqual(create({...studyOptions(),scale:1,motionSeed:1729}).state,oldStudy.createRainbowStagStudy(studyOptions()).state);
 for(const dt of[1/30,1/60,1/120,.1]){const a=create(studyOptions()),b=oldStudy.createRainbowStagStudy(studyOptions()),c=field(null),d=oldField.createInsects(world.heightAt,base);for(let n=0;n<12/dt;n++){if(n*dt<3){a.disturb(front);b.disturb(front);}a.update(dt);b.update(dt);c.update(dt,n*dt<3?front:far);d.update(dt,n*dt<3?front:far);assert.deepEqual(a.state,b.state);assert.deepEqual(c.items,d.items);}for(const s of[a,b])s.capture();for(const s of[a,b])s.update(.1);assert.deepEqual(a.state,b.state);for(const s of[a,b]){s.release();s.reset();}assert.deepEqual(a.state,b.state);for(const s of[c,d])s.reset();assert.deepEqual(c.items,d.items);assert.equal('encounterId'in c.items[0],false);}
 // The unchanged branch inverse proves every other species' source. One meadow timeline supplements it.
 const a=createInsects(),b=oldField.createInsects();for(let n=0;n<180;n++){a.update(1/30,far);b.update(1/30,far);assert.deepEqual(a.items,b.items);}
});

test('study scale and uint32 seed are owned copied options; default is exact and signed stride stays scaled',()=>{
 for(const patch of[{scale:.999},{scale:1.151},{scale:NaN},{scale:'1'},{motionSeed:-1},{motionSeed:4294967296},{motionSeed:.2},{scale:Infinity}])assert.throws(()=>create({...studyOptions(),...patch}),TypeError);
 let reads=0;for(const key of['scale','motionSeed']){const bad=studyOptions();Object.defineProperty(bad,key,{get(){reads++;return 1;},enumerable:true});assert.throws(()=>create(bad));}assert.equal(reads,0);
 for(const factor of[1,1.075,1.15])for(const seed of[0,1729,0xffffffff]){const input={...studyOptions(),scale:factor,motionSeed:seed},a=create(input),b=create(clone(input));input.position.x=4;input.orientation.y=0;input.retreatBounds.min=-4;input.motionSeed=4;input.scale=1;let min=0,max=0;for(let n=0;n<1200;n++){if(n<120){a.disturb(front);b.disturb(front);}if(n>=600&&n<720){a.disturb({x:-2.4,z:0});b.disturb({x:-2.4,z:0});}a.update(1/60);b.update(1/60);const s=a.state;assert.deepEqual(s,b.state);close(s.position.x,s.walkPhase/(2*Math.PI)*.04*factor);assert.ok(s.position.x>=-.34-1e-9&&s.position.x<=.34+1e-9);min=Math.min(min,s.walkSpeed);max=Math.max(max,s.walkSpeed);}assert.ok(min<0&&max>0);assert.ok(Math.max(-min,max)<=.14*factor+1e-9);const before=a.state;for(const dt of[0,-1,NaN,Infinity,undefined])a.update(dt);assert.deepEqual(a.state,before);a.reset();b.reset();assert.deepEqual(a.state,b.state);}
 const seeded=[0,0xffffffff].map(motionSeed=>create({...studyOptions(),scale:1.15,motionSeed}));for(let n=0;n<600;n++)for(const study of seeded)study.update(1/60);assert.notDeepEqual(seeded[0].state,seeded[1].state);
 const a=create({...studyOptions(),scale:1.15,motionSeed:0}),b=create({...studyOptions(),scale:1.15,motionSeed:0});a.update(20);b.update(.1);assert.deepEqual(a.state,b.state);
});

test('all three saved sites and min/intermediate/max size retain physical world lane and copied identity across reset',()=>{
 for(const size of[1000,1075,1150])for(const site of[0,1,2]){const r=profile(size,site,[0,1729,0xffffffff][site]),opts=options(r),a=createInsects(world.heightAt,opts),b=field(r),initial=clone(a.items),id=identity(a.items[0]);close(a.items[0].home.x,[-.12,0,.12][site]);close(a.items[0].home.y,.55+.05*size/1000,2e-8);opts.individuals[0].sizePermille=1000;opts.individuals[0].motionSeed=99;opts.rainbowStagSupports[0].home.x=9;opts.rainbowStagSupports[0].retreatBounds.min=-9;opts.extraHomes[0][1]=9;
  for(let n=0;n<720;n++){const p=n<120?front:n>=360&&n<480?{...front,x:-2.4}:far;a.update(1/60,p);b.update(1/60,p);assert.deepEqual(a.items,b.items);const i=a.items[0];assert.ok(i.x>=-.34-1e-9&&i.x<=.34+1e-9);close(i.x-i.home.x,i.walkPhase/(2*Math.PI)*.04*size/1000);assert.deepEqual(identity(i),id);}a.reset();assert.deepEqual(a.items,initial);assert.deepEqual(field(r).items,initial);
 }
});

test('strict nine-key measured profile and canonical world support reject malformed, accessor or mismatched input without getter reads',()=>{
 const valid=profile(),good=options(valid),badValues={species:['stag','europestag'],habitat:['europe'],runtimeSlotId:['insect-2'],populationSlotId:['rainbowstag-a'],encounterId:['g6-1234abcd-o1-australia-rainbowstag','g8-1234ABCD-o1-australia-rainbowstag','g8-1234abcd-o0-australia-rainbowstag','g8-1234abcd-o01-australia-rainbowstag','g8-1234abcd-o9007199254740992-australia-rainbowstag'],sizePermille:[999,1151,1000.1,'1150',NaN],motionSeed:[-1,4294967296,1.2,NaN],siteIndex:[-1,3,.5,'1'],measureVersion:[0,2,'1']};
 for(const [key,values]of Object.entries(badValues))for(const value of values){const r={...valid,[key]:value};assert.throws(()=>createInsects(world.heightAt,{...good,individuals:[r]}),TypeError,`${key} ${value}`);}
 for(const r of[{...valid,extra:1},Object.assign(Object.create({}),valid),Object.fromEntries(Object.entries(valid).filter(([k])=>k!=='motionSeed'))])assert.throws(()=>createInsects(world.heightAt,{...good,individuals:[r]}));
 let reads=0;for(const key of Object.keys(valid)){const r={...valid};Object.defineProperty(r,key,{get(){reads++;return valid[key];},enumerable:true});assert.throws(()=>createInsects(world.heightAt,{...good,individuals:[r]}));}const array=[valid];Object.defineProperty(array,'0',{get(){reads++;return valid;},enumerable:true});for(const list of[array,new Array(1),[valid,valid],Object.assign([valid],{extra:1})])assert.throws(()=>createInsects(world.heightAt,{...good,individuals:list}));assert.equal(reads,0);
 for(const edit of[g=>g.home.x+=.01,g=>g.home.y+=.001,g=>g.home.z+=.01,g=>g.retreatBounds.min-=.01,g=>g.retreatBounds.max+=.01,g=>g.axis.x=-1,g=>g.orientation.y=-g.orientation.y,g=>g.extra=1]){const groups=clone(good.rainbowStagSupports);edit(groups[0]);assert.throws(()=>createInsects(world.heightAt,{...good,rainbowStagSupports:groups}),/rainbow-stag supports/);}
 const groups=clone(good.rainbowStagSupports);Object.defineProperty(groups[0].home,'x',{get(){reads++;return 0;},enumerable:true});assert.throws(()=>createInsects(world.heightAt,{...good,rainbowStagSupports:groups}));assert.equal(reads,0);assert.doesNotThrow(()=>createInsects(world.heightAt,{...good,individuals:[]})); // Old loose profileless support contract remains accepted.
assert.throws(()=>createInsects(world.heightAt,{...base,individuals:[valid]}));
});

test('all six scaled phases capture/freeze/release native pose continuously and keep encounter on retain/reset',()=>{
 for(const phase of['resting','walking','warning','retreating','cornered','settling']){const sim=field(profile()),i=sim.items[0],g=createInsectModel('rainbowstag',{sizePermille:1150});for(let n=0;n<3600&&i.rainbowStagPhase!==phase;n++)sim.update(1/120,n<1200?front:far);assert.equal(i.rainbowStagPhase,phase);updateInsectModel(g,i);g.updateMatrixWorld(true);const physical=pose(i),id=identity(i),native=()=>({matrix:g.matrixWorld.toArray(),legs:g.userData.legs.map(l=>Array.from(l.mesh.geometry.attributes.position.array))}),before=native();assert.equal(sim.swing(eye,aim(i)).ok,true);advance(sim,2,front);assert.deepEqual(pose(i),physical);assert.deepEqual(identity(i),id);updateInsectModel(g,i);assert.deepEqual(native(),before);assert.equal(sim.release(eye),i);assert.deepEqual(pose(i),physical);updateInsectModel(g,i);assert.deepEqual(native(),before);sim.update(1/120,far);assert.ok(Math.abs(i.x-physical.x)<.002);sim.reset();assert.deepEqual(sim.items,field(profile()).items);g.userData.dispose();}
 const sim=field(profile(1150,0,0xffffffff)),i=sim.items[0],id=identity(i);assert.equal(sim.swing(eye,aim(i)).ok,true);assert.equal(sim.retain(),i);sim.reset();assert.equal(sim.items[0].companion,true);assert.deepEqual(identity(sim.items[0]),id);sim.setCompanions([],eye);assert.equal(sim.items[0].caught,false);assert.equal(sim.swing(eye,aim(sim.items[0])).ok,true);
});

test('maximum native foot envelope is checked on actual branch triangles without adding geometry',async()=>{
 const old=await import(data(resolve(priorHabitat(read('rainbow-stag-habitat'))))),branch=world.rainbowLog,scale=branch.scale.z;
 assert.equal(habitat.stats.footEnvelopeRays,27);assert.equal(habitat.stats.addedMeshes,0);assert.equal(habitat.stats.addedTriangles,0);assert.equal(habitat.stats.addedTextures,0);
 try{branch.scale.z*=.61;branch.updateMatrixWorld(true);assert.doesNotThrow(()=>old.createRainbowStagHabitat(world,scene));assert.throws(()=>createRainbowStagHabitat(world,scene),/foot envelope/);}finally{branch.scale.z=scale;branch.updateMatrixWorld(true);}
});

test('actual maximum-size study keeps native planted feet on the unchanged log during signed walking',()=>{
 const sim=field(profile(1150,0,0)),model=createInsectModel('rainbowstag',{sizePermille:1150}),ray=new T.Raycaster(),last=new Map();
 let contacts=0,comparisons=0,maxSlip=0,maxGap=0,maxBoneError=0,back=false,forward=false;
 for(let frame=0;frame<720;frame++){
  sim.update(1/60,frame<120?front:frame>=360&&frame<480?{...front,x:-2.4}:far);
  const item=sim.items[0];back ||= item.walkSpeed<0;forward ||= item.walkSpeed>0;updateInsectModel(model,item);model.updateMatrixWorld(true);
  assert.equal(model.scale.x,1.15);assert.ok(item.x>=-.34-1e-9&&item.x<=.34+1e-9);
  for(const leg of model.userData.legs){
   const attr=leg.mesh.geometry.attributes.position,[hip,knee,foot]=[12,13,27].map(k=>new T.Vector3().fromBufferAttribute(attr,k).applyMatrix4(leg.mesh.matrixWorld));
   maxBoneError=Math.max(maxBoneError,Math.abs(hip.distanceTo(knee)-.060*1.15),Math.abs(knee.distanceTo(foot)-.060*1.15));
   ray.set(foot.clone().add(new T.Vector3(0,.2,0)),new T.Vector3(0,-1,0));ray.far=.4;const hit=ray.intersectObject(world.rainbowLog,false)[0];assert.ok(hit?.face&&hit.face.normal.y>.999999);
   if(leg.contact){contacts++;maxGap=Math.max(maxGap,foot.distanceTo(hit.point));const prior=last.get(leg);if(prior?.contact){comparisons++;maxSlip=Math.max(maxSlip,foot.distanceTo(prior.foot));}}
   last.set(leg,{contact:leg.contact,foot});
  }
 }
 assert.ok(back&&forward);assert.ok(contacts>2000&&comparisons>1900);assert.ok(maxSlip<3e-8,`actual stance slip ${maxSlip}`);assert.ok(maxGap<2e-8,`actual log contact ${maxGap}`);assert.ok(maxBoneError<3e-8,`native fixed bones ${maxBoneError}`);
 console.log(JSON.stringify({nativeStudy:{frames:720,footRays:4320,contacts,comparisons,maxSlip,maxGap,maxBoneError}}));model.userData.dispose();
});

test.after(()=>world.dispose());
