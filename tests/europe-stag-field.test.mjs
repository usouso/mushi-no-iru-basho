import {inverseEuropeIndividuals} from './fixtures/europe-individual-field-prior.mjs';
/** Fixed European log simulation + actual CPU skin rays; not GPU/real ecology. */
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import{createHash}from'node:crypto';
const box={};vm.runInNewContext(fs.readFileSync(new URL('../assets/vendor/three.min.js',import.meta.url),'utf8'),box);const T=box.THREE;globalThis.window={THREE:T};const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{})});globalThis.document={createElement:()=>({getContext:()=>ctx})};
const{createEuropeWorld}=await import('../src/world-europe.js'),{createEuropeStagHabitat}=await import('../src/europe-stag-habitat.js'),{createInsects,SPECIES}=await import('../src/insects.js'),{createEuropeStagModel,updateEuropeStagModel}=await import('../src/europe-stag-model.js'),{createCaptureVisibility}=await import('../src/capture-visibility.js');
const far={x:7,y:1.65,z:7,speed:0,quiet:true},eye={x:0,y:1.28,z:1.5,speed:0,quiet:true},V=p=>new T.Vector3(p.x,p.y,p.z),aim=(p,i)=>({x:i.x-p.x,y:i.y-p.y,z:i.z-p.z}),pose=i=>({x:i.x,y:i.y,z:i.z,orientation:{...i.orientation},walkPhase:i.walkPhase,jawOpen:i.jawOpen}),clone=x=>structuredClone(x),hash=x=>createHash('sha256').update(x).digest('hex'),strip=s=>s.replace(/\?v=[^'"\s]+/g,''),read=p=>strip(fs.readFileSync(new URL('../'+p,import.meta.url),'utf8'));
function fixture(){const scene=new T.Scene(),world=createEuropeWorld(scene),habitat=createEuropeStagHabitat(world,scene),los=createCaptureVisibility(world.captureOccluders),options={homes:world.insectHomes,extraHomes:habitat.homes,europeStagSupports:habitat.europeStagSupports,bounds:world.bounds,hasLineOfSight:los},sim=createInsects(world.heightAt,options);return{scene,world,habitat,los,options,sim,item:sim.items[0]};}
function skin(g,i){updateEuropeStagModel(g,{...i,position:{x:i.x,y:i.y,z:i.z}},0);g.updateMatrixWorld(true);const xyz=[];g.traverse(m=>{if(m.isMesh){const a=m.geometry.attributes.position;for(let n=0;n<a.count;n++)xyz.push(...new T.Vector3().fromBufferAttribute(a,n).applyMatrix4(m.matrixWorld).toArray());}});return xyz;}
function fixed(i){for(const k of['encounterId','sizePermille','motionSeed','measureVersion','populationSlotId'])assert.equal(i[k],undefined,k);}

function inverseWetapunga(source) {
 const marker=/^[ \t]*\/\/ WETAPUNGA_BEGIN\n[\s\S]*?^[ \t]*\/\/ WETAPUNGA_END\n/gm,blocks=source.match(marker)||[];
 assert.equal(blocks.length,10,'only ten identified 0.47 additions');
 const normalized=blocks.join('').replace(/(from\s*['"]\.\/[^'"?\n]+)(?:\?[^'"\n]*)?(['"])/g,'$1$2');
 assert.equal(createHash('sha256').update(normalized).digest('hex'),'7d41ae436f3546d99692bf5c487e0c3ab654b416b8b93438f9ea4fd2d381a04d','exact wetapunga-only blocks');
 source=source.replace(marker,'');
 for(const added of [' wetapungaSupports = [],',"|| (item.species==='wetapunga'&&!['finishing','retreating'].includes(item.wetapungaPhase)) "]){assert.equal(source.split(added).length-1,1);source=source.replace(added,'');}
 return source;
}

function inverseDragonflyLanding(source) {
 const marker=/^[ \t]*\/\/ DRAGONFLY_LANDING_BEGIN\n[\s\S]*?^[ \t]*\/\/ DRAGONFLY_LANDING_END\n/gm,blocks=source.match(marker)||[];
 assert.equal(blocks.length,2,'only two identified 0.46 render-only additions');
 assert.equal(createHash('sha256').update(blocks.join('')).digest('hex'),'fc12f729a856a1543b31a5e7c60f402616aba8f3008ac8056a2238b765c0172d','exact 0.46 render-only blocks');
 return source.replace(marker,'');
}

function inverseGiantWaterbug(source) {
 const marker=/^[ \t]*\/\/ GIANT_WATERBUG_BEGIN\n[\s\S]*?^[ \t]*\/\/ GIANT_WATERBUG_END\n/gm,blocks=source.match(marker)||[];
 assert.equal(blocks.length,10,'only ten identified 0.45 additions');
 assert.equal(createHash('sha256').update(blocks.join('').replace(/\?v=[^'"\s]+/g,'')).digest('hex'),'ab8672fea6e4443af29a4a8e051ec669ea05b1215d9df6db3f520f2d4ca4138d','literal new waterbug blocks remain exact');
 source=source.replace(marker,'');
 for(const added of [' giantWaterbugSupports = [],',"|| (item.species==='giantwaterbug'&&item.giantWaterbugPhase==='resting') "]){assert.equal(source.split(added).length-1,1);source=source.replace(added,'');}
 return source;
}

function inverseDragonflyAmbient(source) {
 const replacements = [
  ['individuals = [], dragonflyAmbient = [],', 'individuals = [],'],
  ["  // A timing-only sidecar. Copy owned data; never change identity, size or phase.\n  const dragonflyTimings = new Map();\n  try {\n    if (!Array.isArray(dragonflyAmbient) || Object.getPrototypeOf(dragonflyAmbient) !== Array.prototype || dragonflyAmbient.length > 6 || Reflect.ownKeys(dragonflyAmbient).length !== dragonflyAmbient.length + 1) throw new Error();\n    for (let i = 0; i < dragonflyAmbient.length; i++) {\n      const entry = Object.getOwnPropertyDescriptor(dragonflyAmbient, String(i));\n      if (!entry || !('value' in entry)) throw new Error();\n      const value = entry.value, keys = ['runtimeSlotId','restSeconds','offsetSeconds'];\n      if (!value || ![Object.prototype,null].includes(Object.getPrototypeOf(value)) || Reflect.ownKeys(value).length !== keys.length || !keys.every(key => Object.getOwnPropertyDescriptor(value,key) && 'value' in Object.getOwnPropertyDescriptor(value,key))) throw new Error();\n      const {runtimeSlotId,restSeconds,offsetSeconds} = value;\n      if (typeof runtimeSlotId !== 'string' || !/^insect-(8|9|10|11|12|13)$/.test(runtimeSlotId) || dragonflyTimings.has(runtimeSlotId) || !Number.isInteger(restSeconds) || restSeconds < 8 || restSeconds > 12 || !Number.isFinite(offsetSeconds) || offsetSeconds < 0 || offsetSeconds >= restSeconds + 6) throw new Error();\n      const index = Number(runtimeSlotId.slice(7)) - 1;\n      if (!initialHomes[index] || !homes[index].every((part,j) => initialHomes[index][j] === part)) throw new Error();\n      dragonflyTimings.set(runtimeSlotId, Object.freeze({restSeconds,offsetSeconds}));\n    }\n  } catch { throw new TypeError('Invalid dragonfly ambient profiles'); }\n", ''],
  ["          // Only the six meadow dragonflies may use the timing-only sidecar.\n          const ambient = item.species === 'dragonfly' ? dragonflyTimings.get(item.id) : null;\n          const period = ambient ? ambient.restSeconds + 6 : item.species === 'morpho' ? 22 : item.species === 'butterfly' ? 17 : 15;\n          const cycle = ambient ? (time + ambient.offsetSeconds) % period : (time + (item.beginner ? 0 : item.phase * 2)) % period;\n          const restTime = ambient ? ambient.restSeconds : item.species === 'morpho' ? 13 : item.species === 'butterfly' ? 11 : 9;", "          // Ordinary unprovoked perch / loop timing stays the same as v0.1.5.\n          const period = item.species === 'morpho' ? 22 : item.species === 'butterfly' ? 17 : 15;\n          const cycle = (time + (item.beginner ? 0 : item.phase * 2)) % period;\n          const restTime = item.species === 'morpho' ? 13 : item.species === 'butterfly' ? 11 : 9;"]
 ];
 for (const [added, original] of replacements) {
  assert.equal(source.split(added).length - 1, 1, 'exactly one literal 0.44 timing addition');
  source = source.replace(added, original);
 }
 return source;
}

test('fixed Europe registration is additive: all prior shared simulation source is literal after explicit removal',()=>{
 let s=inverseDragonflyAmbient(inverseGiantWaterbug(inverseDragonflyLanding(inverseWetapunga(inverseEuropeIndividuals(read('src/insects.js')))))).replace(/^import \{createEuropeStagStudy\}[^\n]*\n/,'').replace(/^  europestag:\{[^\n]*\n/m,'').replace('europeStagSupports = [], ','').replace(/  \/\/ Europe fixed-log support:[\s\S]*?  \/\/ End europe fixed-log support\.\n/,'').replace(' europeStags.clear();','').replace(/      if\(species==='europestag'\)\{[\s\S]*?syncEuropeStag\(item\);\n      }\n/,'').replace(/  function syncEuropeStag\(item\)\{[\s\S]*?  function syncManticora/,'  function syncManticora').replace(/^.*if\((?:item|held)\.species==='europestag'\).*\n/gm,'').replace(" || (item.species==='europestag'&&!['warning','retreating'].includes(item.europeStagPhase))",'').replaceAll(",'europestag'].includes",'].includes');
 assert.equal(hash(s),'7f20021bfa6217b2511b04dea72edbea11b5375cc8e5d0c93098fc4e4925587a');
 assert.equal(SPECIES.europestag.scientificName,'Lucanus cervus');assert.equal(SPECIES.europestag.name,'ヨーロッパミヤマクワガタ（雄）');assert.match(SPECIES.europestag.observation,/飛行や食餌は再現していません/);assert.match(SPECIES.europestag.observation,/幼虫.*腐朽/);assert.match(SPECIES.europestag.size,/35〜75mm.*約19cm.*約32cm.*表示補正/);
});

test('support records fail closed and copy valid horizontal axis/lane without inventing measured individuals',()=>{
 const f=fixture(),base=JSON.stringify(f.options.europeStagSupports);assert.deepEqual(f.sim.items.map(i=>[i.species,i.id]),[['europestag','insect-1']]);fixed(f.item);
 for(const edit of[g=>g.extra=1,g=>g.home.x+=.01,g=>g.home.y=NaN,g=>g.orientation.w=2,g=>g.orientation.x=.1,g=>g.axis.x=-1,g=>g.axis.y=.1,g=>g.retreatBounds.min=-.35,g=>g.retreatBounds.max=.35,g=>g.retreatBounds.min=.01,g=>g.retreatBounds.max=-.01]){const groups=clone(f.options.europeStagSupports);edit(groups[0]);assert.throws(()=>createInsects(f.world.heightAt,{...f.options,europeStagSupports:groups}),/europe-stag supports/);}
 for(const groups of[[],[...f.options.europeStagSupports,...f.options.europeStagSupports]])assert.throws(()=>createInsects(f.world.heightAt,{...f.options,europeStagSupports:groups}),/europe-stag supports/);
 const groups=clone(f.options.europeStagSupports);let reads=0;Object.defineProperty(groups[0].axis,'x',{get(){reads++;return 1;},enumerable:true});assert.throws(()=>createInsects(f.world.heightAt,{...f.options,europeStagSupports:groups}),/europe-stag supports/);assert.equal(reads,0);
 assert.throws(()=>createInsects(f.world.heightAt,{...f.options,individuals:[{runtimeSlotId:'insect-1',species:'europestag',sizePermille:1150}]}),/profile/);
 const copy=clone(f.options.europeStagSupports),sim=createInsects(f.world.heightAt,{...f.options,europeStagSupports:copy});copy[0].home.x=4;copy[0].axis.x=-1;sim.update(1/60,far);assert.equal(sim.items[0].x,0);assert.equal(JSON.stringify(f.options.europeStagSupports),base);f.world.dispose();
});

test('actual fast/quiet/visible miss paths warn and withdraw; nearest-only and solid occlusion stay authoritative',()=>{
 for(const [x,speed,quiet,warn]of[[2.8,2.7,false,true],[3.7,5.4,false,true],[2.8,1.05,true,false]]){const f=fixture(),p={x,y:1.65,z:.08,speed,quiet};assert.ok(f.world.colliders.every(c=>Math.hypot(p.x-c.x,p.z-c.z)>c.r+.28));assert.equal(f.los(p,f.item),true);f.sim.update(1/60,p);assert.equal(f.item.europeStagPhase,warn?'warning':'resting');if(warn){assert.ok(f.item.jawOpen>.25);for(let n=0;n<60;n++)f.sim.update(1/60,far);assert.ok(f.item.x<-.04&&f.item.x>=-.18-1e-9);assert.equal(f.item.europeStagPhase,'retreating');}else assert.equal(f.sim.swing(eye,aim(eye,f.item)).ok,true);f.world.dispose();}
 for(const [z,speed,warn]of[[1,1.05,true],[1.5,1.05,false],[1.5,0,false]]){const f=fixture(),p={x:0,y:1.28,z,speed,quiet:true};assert.ok(f.world.colliders.every(c=>Math.hypot(p.x-c.x,p.z-c.z)>c.r+.28));f.sim.update(1/60,p);assert.equal(f.item.europeStagPhase,warn?'warning':'resting');f.world.dispose();}
 const f=fixture(),target=aim(eye,f.item),dir=V(target).applyAxisAngle(new T.Vector3(0,1,0),.95),miss={x:dir.x,y:dir.y,z:dir.z};assert.equal(f.sim.swing(eye,miss).ok,false);assert.equal(f.sim.startleFromNet(eye,miss),f.item);assert.equal(f.item.europeStagPhase,'warning');assert.equal(f.sim.startleFromNet(eye,miss),null);for(let n=0;n<43;n++)f.sim.update(1/60,far);assert.ok(Math.abs(f.item.x)>.025);assert.equal(f.sim.swing(eye,aim(eye,f.item)).ok,true,'visible retreat is not artificial immunity');
 const wall=new T.Mesh(new T.BoxGeometry(2,2,.12),new T.MeshBasicMaterial());wall.position.set(0,1,.8);wall.updateMatrixWorld(true);const blockedLOS=createCaptureVisibility([...f.world.captureOccluders,wall]);assert.equal(blockedLOS(eye,f.item),false);const blocked=createInsects(f.world.heightAt,{...f.options,hasLineOfSight:blockedLOS});blocked.update(1/60,{x:0,y:1.65,z:1.5,speed:5.4});assert.equal(blocked.items[0].europeStagPhase,'resting');assert.equal(blocked.startleFromNet(eye,miss),null);assert.equal(blocked.swing(eye,aim(eye,blocked.items[0])).ok,false);
 const multi=createInsects(f.world.heightAt,{...f.options,homes:[['butterfly',0,1.1,.9]],extraHomes:f.habitat.homes}),origin={x:0,y:1.65,z:3.3,speed:0,quiet:true};assert.equal(multi.startleFromNet(origin,{x:0,y:-.2,z:-1})?.species,'butterfly');assert.equal(multi.items[1].europeStagPhase,'resting');f.world.dispose();
});

test('real field state/native skin/feet stay on log through warning, retreat, settlement and signed walk; captures freeze exact pose',()=>{
 const f=fixture(),g=createEuropeStagModel(),ray=new T.Raycaster(),metrics={poses:0,rays:0,minSkinY:Infinity,maxFootGap:0,maxBoneError:0},seen=new Set();let captured=false;
 for(let n=0;n<26*60;n++){const p=n<600?{x:2.4,y:1.65,z:.08,speed:2.7,quiet:false}:far;f.sim.update(1/60,p);const i=f.item;assert.ok(Number.isFinite(i.walkPhase)&&Number.isFinite(i.warningBlend));assert.ok(i.x>=-.34-1e-9&&i.x<=.34+1e-9);assert.ok(Math.abs(i.z-.08)<1e-12);fixed(i);const key=i.europeStagPhase;if(!seen.has(key)){seen.add(key);const xyz=skin(g,i);metrics.poses++;assert.ok(xyz.every(Number.isFinite));for(let k=1;k<xyz.length;k+=3){metrics.minSkinY=Math.min(metrics.minSkinY,xyz[k]);assert.ok(xyz[k]>=.48-2e-7);}let contact=0;for(const l of g.userData.legs){const a=l.mesh.geometry.attributes.position,points=[12,13,27].map(k=>new T.Vector3().fromBufferAttribute(a,k).applyMatrix4(l.mesh.matrixWorld));for(let j=0;j<2;j++)metrics.maxBoneError=Math.max(metrics.maxBoneError,Math.abs(points[j].distanceTo(points[j+1])-[.064,.060][j]));ray.set(points[2].clone().add(new T.Vector3(0,.2,0)),new T.Vector3(0,-1,0));ray.far=.4;const hit=ray.intersectObject(f.world.europeStagLog,false)[0];assert.ok(hit?.face);metrics.rays++;if(l.contact){contact++;metrics.maxFootGap=Math.max(metrics.maxFootGap,points[2].distanceTo(hit.point));}}assert.ok(contact>=3);}
  if(!captured&&key==='retreating'&&Math.abs(i.walkSpeed)>.05){const before=pose(i),mesh=skin(g,i);assert.equal(f.sim.swing(eye,aim(eye,i)).ok,true);for(let t=0;t<15;t++)f.sim.update(1/60,far);assert.deepEqual(pose(i),before);assert.deepEqual(skin(g,i),mesh);assert.equal(f.sim.release(eye),i);assert.deepEqual(pose(i),before);assert.deepEqual(skin(g,i),mesh);captured=true;}
 }
 for(const phase of['warning','retreating','cornered','settling','walking','resting'])assert.ok(seen.has(phase),phase);assert.ok(captured);assert.ok(metrics.maxFootGap<2e-7);assert.ok(metrics.maxBoneError<2e-8);console.log('Europe actual field skin',JSON.stringify(metrics));g.userData.dispose();f.world.dispose();
});

test('retained fixed origin hides once across reset and recreation, explicit return resumes same field individual and remains catchable',()=>{
 const f=fixture(),initial=pose(f.item);assert.equal(f.sim.swing(eye,aim(eye,f.item)).ok,true);assert.equal(f.sim.retain(),f.item);assert.equal(f.sim.caught,null);assert.equal(f.item.companion,true);assert.equal(f.sim.findTarget(eye,aim(eye,f.item)),null);const origin=[{id:'insect-1',species:'europestag'}];for(let n=0;n<60;n++)f.sim.update(1/60,far);assert.deepEqual(pose(f.item),initial);f.sim.reset();const i=f.sim.items[0];assert.equal(i.companion,true);assert.equal(i.caught,true);assert.equal(f.sim.items.length,1);fixed(i);
 const reload=createInsects(f.world.heightAt,f.options);reload.setCompanions(origin,eye);assert.equal(reload.items[0].caught,true);reload.setCompanions(origin,eye);assert.equal(reload.items.length,1);const at=pose(reload.items[0]);reload.setCompanions([],eye);assert.equal(reload.items[0].caught,false);assert.deepEqual(pose(reload.items[0]),at);assert.equal(reload.swing(eye,aim(eye,reload.items[0])).ok,true);assert.equal(reload.retain(),reload.items[0]);reload.setCompanions([{id:'insect-2',species:'europestag'}],eye);assert.equal(reload.items[0].companion,false);assert.equal(reload.items.length,1);f.world.dispose();
});
