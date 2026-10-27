/** 054 removes a grounded departure-tick yaw only. Actual-foot terrain proof is separate native QA. */
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import {priorInsects}from './fixtures/grasshopper-launch-prior.mjs';
const box={};vm.runInNewContext(fs.readFileSync(new URL('../assets/vendor/three.min.js',import.meta.url),'utf8'),box);const T=box.THREE;globalThis.window={THREE:T};const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{})});globalThis.document={createElement:()=>({getContext:()=>ctx})};
const {createWorld}=await import('../src/world.js'),{createInsects,SPECIES}=await import('../src/insects.js'),scene=new T.Scene(),world=createWorld(scene),options={extraHomes:world.grasshopperHomes,grasshopperSupports:world.grasshopperSupports};
const source=fs.readFileSync(new URL('../src/insects.js',import.meta.url),'utf8'),frozen=priorInsects(source).replace(/from\s*(['"])(\.\/[^'"]+)\1/g,(_,q,p)=>`from ${q}${new URL('../src/'+p,import.meta.url).href}${q}`),old=await import('data:text/javascript;base64,'+Buffer.from(frozen).toString('base64'));
const clone=structuredClone,far={x:70,y:2,z:70,speed:0,quiet:true},hopper=(s,k)=>s.items[18+k],make=()=>createInsects(world.heightAt,options),makeOld=()=>old.createInsects(world.heightAt,options),point=i=>({x:i.x,y:i.y,z:i.z}),withoutHeading=items=>items.map(i=>{const o=clone(i);if(i.species==='grasshopper')delete o.heading;return o;}),sameControls=(a,b)=>assert.deepEqual(withoutHeading(a.items),withoutHeading(b.items)),eye=(i,side=1,d=1)=>({x:i.x+side*d,y:world.heightAt(i.x+side*d,i.z)+1.65,z:i.z,speed:0,quiet:true}),aim=(p,i)=>({x:i.x-p.x,y:i.y-p.y,z:i.z-p.z}),turn=(heading,target,dt)=>heading+Math.atan2(Math.sin(target-heading),Math.cos(target-heading))*(1-Math.exp(-dt*10));

test('single exact marker/literal inverse retains frozen053, original 35 species metadata and unmodified default timelines',()=>{
 assert.ok(priorInsects(source));assert.throws(()=>priorInsects(source.replace('if(u>0)item.heading','if(u>=0)item.heading')));assert.throws(()=>priorInsects(source+'\n// GRASSHOPPER_LAUNCH_BEGIN'));assert.ok(Object.hasOwn(SPECIES,'orchidmantis'));assert.deepEqual(Object.fromEntries(Object.entries(SPECIES).filter(([key])=>key!=='orchidmantis')),old.SPECIES); // Only the explicitly added055 species is outside this frozen 35-species metadata set.
 const a=createInsects(),b=old.createInsects();for(let n=0;n<180;n++){a.update(1/60,far);b.update(1/60,far);assert.deepEqual(a.items,b.items);}assert.equal(a.items.some(i=>i.species==='grasshopper'),false);
});

test('six local approaches across ordinary/dash/quiet and 30/60/120Hz/.1 defer only u0 yaw, preserve all root/target/time/alert fields and final approach turn',()=>{
 const metrics={traces:0,launches:0,landings:0,maxRemovedLaunchYaw:0},routes=new Set();
 for(const dt of[1/30,1/60,1/120,.1])for(let group=0;group<3;group++)for(const side of[-1,1])for(const mode of['ordinary','dash','quiet']){
  const a=make(),b=makeOld(),i=hopper(a,group),j=hopper(b,group),p={...eye(i,side,mode==='quiet'?.6:1),speed:mode==='dash'?5.4:mode==='quiet'?.7:3,quiet:mode==='quiet'};let launched=false,landed=false;
  for(let n=0;n<Math.ceil(3/dt);n++){
   const before=clone(i),oldBefore=clone(j);a.update(dt,launched?far:p);b.update(dt,launched?far:p);sameControls(a,b);
   if(!before.airborne&&i.airborne){assert.equal(i.jumpProgress,0);assert.deepEqual(point(i),point(before));assert.equal(i.heading,before.heading);const oldTurn=Math.abs(j.heading-oldBefore.heading);assert.ok(oldTurn>1e-5);metrics.maxRemovedLaunchYaw=Math.max(metrics.maxRemovedLaunchYaw,oldTurn);metrics.launches++;launched=true;routes.add(`${group}:${side}:${i.jumpEnd.x},${i.jumpEnd.z}`);}
   else if(before.airborne){const target=Math.atan2(before.jumpEnd.x-before.jumpStart.x,before.jumpEnd.z-before.jumpStart.z);assert.equal(i.heading,turn(before.heading,target,dt),'old interpolation exactly after root travel starts, including u1');if(!i.airborne){assert.deepEqual(point(i),before.jumpEnd);assert.equal(i.state,'resting');assert.equal(i.jumpProgress,0);metrics.landings++;landed=true;break;}}
  }
  assert.ok(launched&&landed,`${group} ${side} ${mode} ${dt}`);const heading=i.heading;for(let n=0;n<5;n++){a.update(dt,far);b.update(dt,far);sameControls(a,b);assert.equal(i.heading,heading);}metrics.traces++;
 }
 assert.equal(metrics.traces,72);assert.equal(metrics.launches,72);assert.equal(metrics.landings,72);assert.equal(routes.size,7,'quiet .6m observer selects one additional already-supported destination');metrics.uniqueGroupSideTargets=routes.size;console.log('Grasshopper launch bounded traces',JSON.stringify(metrics));
});

test('six released routes keep old launch/capture decisions exact and update0 cannot move root or heading',()=>{
 for(const dt of[1/30,1/120,.1])for(let group=0;group<3;group++)for(const side of[-1,1]){
  const a=make(),b=makeOld(),i=hopper(a,group),j=hopper(b,group),p=eye(i,side);for(const s of[a,b])assert.equal(s.swing(p,aim(p,hopper(s,group))).item,hopper(s,group));assert.deepEqual(a.items,b.items);
  for(const s of[a,b])assert.equal(s.release(p),hopper(s,group));assert.deepEqual(a.items,b.items);assert.equal(i.jumpProgress,0);const snapshot=clone(a.items);for(const s of[a,b])s.update(0,p);assert.deepEqual(a.items.map(i=>({...point(i),heading:i.heading})),snapshot.map(i=>({...point(i),heading:i.heading})));assert.deepEqual(a.items,b.items);
  let landed=false;for(let n=0;n<Math.ceil(1.1/dt);n++){a.update(dt,far);b.update(dt,far);assert.deepEqual(a.items,b.items);if(!i.airborne){landed=true;break;}}assert.ok(landed);a.reset();b.reset();assert.deepEqual(a.items,b.items);
 }
});

test('capture during launch/air and release retain old freeze and restart semantics, with no hidden correction or teleport',()=>{
 for(const stage of['launch','air'])for(let group=0;group<3;group++){
  const a=make(),b=makeOld(),i=hopper(a,group),j=hopper(b,group),p={...eye(i,-1),speed:3,quiet:false};while(!i.airborne||stage==='air'&&i.jumpProgress<.2){a.update(1/60,i.airborne?far:p);b.update(1/60,j.airborne?far:p);}sameControls(a,b);const from=eye(i),position=point(i),heading=i.heading;
  for(const s of[a,b])assert.equal(s.swing(from,aim(from,hopper(s,group))).item,hopper(s,group));sameControls(a,b);assert.equal(i.airborne,false);assert.equal(i.jumpProgress,0);assert.deepEqual(point(i),position);for(let n=0;n<60;n++){a.update(1/60,p);b.update(1/60,p);sameControls(a,b);assert.deepEqual(point(i),position);assert.equal(i.heading,heading);}for(const s of[a,b])s.release(from);sameControls(a,b);assert.deepEqual(point(i),position);assert.equal(i.heading,heading);const snapshot=clone(a.items);a.update(0,from);b.update(0,from);assert.deepEqual(a.items,snapshot);sameControls(a,b);for(let n=0;n<70;n++){a.update(1/60,far);b.update(1/60,far);sameControls(a,b);}a.reset();b.reset();assert.deepEqual(a.items,b.items);
 }
});

test.after(()=>{const geometries=new Set(),materials=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);});for(const g of geometries)g.dispose();for(const m of materials)m.dispose();});
