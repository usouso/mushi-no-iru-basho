import {inverseGiraffeStagModel} from './fixtures/giraffe-stag-model-prior.mjs';
import {inverseEuropeIndividuals} from './fixtures/europe-individual-field-prior.mjs';
/** Bounded 046 render-only arrival correction. No git history, GPU or field-clearance claim. */
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import {createHash} from 'node:crypto';
import {createInsects} from '../src/insects.js';
const normalize=s=>s.replace(/(from\s*['"]\.\/[^'"?\n]+)(?:\?[^'"\n]*)?(['"])/g,'$1$2');
const hash=s=>createHash('sha256').update(s).digest('hex');
function inverseWetapunga(source) {
 const marker=/^[ \t]*\/\/ WETAPUNGA_BEGIN\n[\s\S]*?^[ \t]*\/\/ WETAPUNGA_END\n/gm,blocks=source.match(marker)||[];
 assert.equal(blocks.length,10,'only ten identified 0.47 additions');
 const normalized=blocks.join('').replace(/(from\s*['"]\.\/[^'"?\n]+)(?:\?[^'"\n]*)?(['"])/g,'$1$2');
 assert.equal(createHash('sha256').update(normalized).digest('hex'),'7d41ae436f3546d99692bf5c487e0c3ab654b416b8b93438f9ea4fd2d381a04d','exact wetapunga-only blocks');
 source=source.replace(marker,'');
 for(const added of [' wetapungaSupports = [],',"|| (item.species==='wetapunga'&&!['finishing','retreating'].includes(item.wetapungaPhase)) "]){assert.equal(source.split(added).length-1,1);source=source.replace(added,'');}
 return source;
}

function inverse(source,count){
 const pattern=/^([ \t]*)\/\/ DRAGONFLY_LANDING_BEGIN\n[\s\S]*?^\1\/\/ DRAGONFLY_LANDING_END\n/gm;
 assert.equal((source.match(/DRAGONFLY_LANDING_BEGIN/g)||[]).length,count);assert.equal((source.match(/DRAGONFLY_LANDING_END/g)||[]).length,count);
 const matches=[...source.matchAll(pattern)];assert.equal(matches.length,count,'strict paired marker lines');return source.replace(pattern,'');
}
function inverseWetapungaModel(source) {
 const marker=/^[ \t]*\/\/ WETAPUNGA_MODEL_BEGIN\n[\s\S]*?^[ \t]*\/\/ WETAPUNGA_MODEL_END\n/gm,blocks=source.match(marker)||[];
 assert.equal(blocks.length,3,'only three 0.47 factory additions');
 assert.equal(hash(normalize(blocks.join(''))),'392efa230dfb2feaefca644eea643fe39ccaed41ad63c92edb77ce822df5c3c5','exact wetapunga-only model bindings');
 return source.replace(marker,'');
}
function inverseEuropeModel(source) {
 source=inverseGiraffeStagModel(source);
 const current="const eligible=['hercules','rhino','stag','metallifer','giantstag','atlas','manticora','europestag'].includes(species);", old="const eligible=['hercules','rhino','stag','metallifer','giantstag','atlas','manticora'].includes(species);";
 assert.equal(source.split(current).length-1,1);source=source.replace(current,old);
 assert.equal(hash(normalize(source)),'15cb3660668fdcf349a8802b1f8d3df060eda65aac6cb87eb8bbda677d11388f','exact frozen047 model factory');return source;
}
const simURL=new URL('../src/insects.js',import.meta.url),modelURL=new URL('../src/insect-models.js',import.meta.url);
const oldSource=normalize(inverse(inverseWetapunga(inverseEuropeIndividuals(fs.readFileSync(simURL,'utf8'))),2));
assert.equal(hash(oldSource),'ebef5dc22fdf1117c6a3c036ccf9adf265e9a38bda1b94659eaa48e073816dcd');
const oldModelSource=normalize(inverse(inverseWetapungaModel(inverseEuropeModel(fs.readFileSync(modelURL,'utf8'))),1));
assert.equal(hash(oldModelSource),'88e9674135fddbeabe03c113c5d2cb7a3471273b3f2ab4e40898638c19250d93');
const rewritten=oldSource.replace(/from\s*(['"])(\.\/[^'"]+)\1/g,(_a,q,p)=>`from ${q}${new URL(p,simURL).href}${q}`);
const {createInsects:oldCreate}=await import(`data:text/javascript;base64,${Buffer.from(rewritten).toString('base64')}`);
const ids=Array.from({length:6},(_,i)=>`insect-${i+8}`),profiles=(rest=8,offset=0)=>ids.map(runtimeSlotId=>({runtimeSlotId,restSeconds:rest,offsetSeconds:offset}));
const position=i=>({x:i.x,y:i.y,z:i.z}),distance=i=>Math.hypot(i.x-i.home.x,i.y-i.home.y,i.z-i.home.z),withoutDisplay=({dragonflyArriving,dragonflyWingBlend,...old})=>old;
const compare=(a,b)=>{assert.equal(a.time,b.time);assert.equal(a.catches,b.catches);assert.deepEqual(a.items.map(withoutDisplay),b.items);assert.equal(a.caught?.id,b.caught?.id);};
const pair=(rest=8,offset=0,extra={})=>{const options={dragonflyAmbient:profiles(rest,offset),...extra};return [createInsects(()=>0,options),oldCreate(()=>0,options)];};
const tick=(pair,dt,p)=>{for(const sim of pair)sim.update(dt,p);compare(...pair);};
function toReturn(pair,id,threshold,dt){let flew=false;for(let n=0;n<Math.ceil(8/dt);n++){tick(pair,dt);const item=pair[0].items.find(i=>i.id===id);flew ||= !item.resting;if(flew&&item.resting&&distance(item)<=threshold)return item;}assert.fail('bounded return fixture not reached');}

const box={};vm.runInNewContext(fs.readFileSync(new URL('../assets/vendor/three.min.js',import.meta.url),'utf8'),box);const T=box.THREE;globalThis.window={THREE:T};const context=new Proxy({createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{})});globalThis.document={createElement:()=>({getContext:()=>context})};
const {createInsectModel,updateInsectModel}=await import('../src/insect-models.js');
const pose=model=>({position:model.position.toArray(),quaternion:model.quaternion.toArray(),scale:model.scale.toArray(),visualPosition:model.userData.visual.position.toArray(),visualQuaternion:model.userData.visual.quaternion.toArray(),wings:model.userData.wings.map(w=>({rotation:w.rotation.toArray(),position:w.position.toArray()}))});

test('strict additive inverse pins both frozen045 sources without repository-history dependency',()=>{
 assert.equal(hash(oldSource),'ebef5dc22fdf1117c6a3c036ccf9adf265e9a38bda1b94659eaa48e073816dcd');assert.equal(hash(oldModelSource),'88e9674135fddbeabe03c113c5d2cb7a3471273b3f2ab4e40898638c19250d93');
 assert.doesNotMatch(oldSource,/dragonflyArriving|dragonflyWingBlend/);assert.doesNotMatch(oldModelSource,/dragonflyArriving|dragonflyWingBlend/);
});

test('six IDs × rest8/12 × rest/midflight/endoffset ×30/60/120Hz/maxdt preserve every old field at every step',()=>{
 let steps=0,arrivals=0,wingImprovement=0;
 for(const rest of [8,12])for(const offset of [0,rest+3,rest+6-1e-6])for(const dt of [1/30,1/60,1/120,.1]){
  const sims=pair(rest,offset);compare(...sims);
  for(let n=0;n<Math.ceil((rest+9)/dt);n++){
   const before=sims[0].items.map(i=>i.dragonflyWingBlend);tick(sims,dt);steps++;
   for(const [index,item] of sims[0].items.entries()){
    if(item.species!=='dragonfly'){assert.equal(item.dragonflyArriving,undefined);assert.equal(item.dragonflyWingBlend,undefined);continue;}
    const d=distance(item),arriving=!item.excursion&&sims[0].time>=item.settleUntil&&item.resting&&item.state==='resting'&&d>.005;
    assert.equal(item.dragonflyArriving,arriving);const u=Math.max(0,Math.min(1,(d-.005)/.045)),target=arriving?.65*u*u*(3-2*u):item.resting?0:1;
    assert.equal(item.dragonflyWingBlend,before[index]+(target-before[index])*Math.min(1,dt*8));assert.ok(item.dragonflyWingBlend>=0&&item.dragonflyWingBlend<=1);
    if(arriving){arrivals++;if(d>.04&&d<.06&&item.dragonflyWingBlend-item.flightBlend>.15)wingImprovement++;}
   }
  }
 }
 assert.ok(steps>20000);assert.ok(arrivals>1000);assert.ok(wingImprovement>0);console.log('046 bounded simulation',JSON.stringify({steps,arrivals,wingImprovement}));
});

test('arrival capture at50/10/5mm preserves exact success/held position, freezes new display fields and releases the identical old route',()=>{
 for(const id of ids)for(const threshold of [.05,.01,.005])for(const dt of [1/60,.1]){
  const sims=pair(8,12),item=toReturn(sims,id,threshold,dt),p={x:item.x,y:item.y,z:item.z+1,speed:0,quiet:true},direction={x:0,y:0,z:-1};
  for(const sim of sims)assert.equal(sim.swing(p,direction).item?.id,id);compare(...sims);const caught=position(item),wing=item.dragonflyWingBlend,arrival=item.dragonflyArriving;
  for(let n=0;n<20;n++)tick(sims,dt,p);assert.deepEqual(position(item),caught);assert.equal(item.dragonflyWingBlend,wing);assert.equal(item.dragonflyArriving,arrival);
  for(const sim of sims)assert.equal(sim.release(p).id,id);compare(...sims);assert.deepEqual(position(item),caught);
  let settling=false;for(let n=0;n<Math.ceil(9/dt);n++){tick(sims,dt);if(item.excursion||sims[0].time<item.settleUntil)assert.equal(item.dragonflyArriving,false);if(!item.excursion&&sims[0].time<item.settleUntil)settling=true;}
  assert.ok(settling);
 }
});

test('50/10/5mm return remains vulnerable to identical visible net misses and near-player warning/departure; LOS rejection unchanged',()=>{
 for(const threshold of [.05,.01,.005])for(const mode of ['miss','approach'])for(const dt of [1/60,.1]){
  const sims=pair(8,12),item=toReturn(sims,'insect-8',threshold,dt),p={x:item.x,y:item.y,z:item.z+(mode==='miss'?2.3:.2),speed:mode==='miss'?0:5.4,quiet:false},direction={x:.8,y:0,z:-.6};
  if(mode==='miss'){for(const sim of sims){assert.equal(sim.swing(p,direction).ok,false);assert.equal(sim.startleFromNet(p,direction)?.id,item.id);}compare(...sims);}
  let warned=mode==='miss',fled=false;
  for(let n=0;n<Math.ceil(2/dt);n++){tick(sims,dt,p);warned ||= item.awarenessStage==='warning';if(item.excursion){fled=true;assert.equal(item.excursion.reason,'startled');break;}}
  assert.ok(warned&&fled);assert.equal(item.dragonflyArriving,false);
 }
 const sims=pair(8,12,{hasLineOfSight:()=>false}),item=toReturn(sims,'insect-8',.05,1/60),p={x:item.x,y:item.y,z:item.z+1,speed:5.4};
 for(const sim of sims){assert.equal(sim.swing(p,{x:0,y:0,z:-1}).ok,false);assert.equal(sim.startleFromNet(p,{x:.8,y:0,z:-.6}),null);}compare(...sims);
});

test('normal pre-arrival flight stays the exact old pose; return wings alone change, warning hinge is suppressed only while arriving',()=>{
 const sims=pair(8,9),a=createInsectModel('dragonfly'),b=createInsectModel('dragonfly');
 for(let n=0;n<60;n++){tick(sims,1/60);const item=sims[0].items[7];updateInsectModel(a,item,sims[0].time);updateInsectModel(b,withoutDisplay(item),sims[0].time);assert.deepEqual(pose(a),pose(b));}
 const returning=pair(8,12),item=toReturn(returning,'insect-8',.05,1/60);assert.equal(item.dragonflyArriving,true);
 updateInsectModel(a,item,returning[0].time);updateInsectModel(b,withoutDisplay(item),returning[0].time);const pa=pose(a),pb=pose(b);assert.notDeepEqual(pa.wings,pb.wings);assert.deepEqual({...pa,wings:null},{...pb,wings:null});
 const warningItem={...item,flightBlend:0,awarenessStage:'warning',alertBlend:1,resting:true};updateInsectModel(a,warningItem,1);updateInsectModel(b,{...warningItem,awarenessStage:'calm'},1);assert.deepEqual(pose(a),pose(b),'no perched warning hinge during arrival');
 updateInsectModel(a,{...warningItem,dragonflyArriving:false,dragonflyWingBlend:0},1);updateInsectModel(b,withoutDisplay(warningItem),1);assert.deepEqual(pose(a),pose(b),'ordinary perched warning restored exactly');
});

test('held and inspection ignore new display fields; reset/recreation clears them; bad dt retains old clamp and no new timer',()=>{
 const sims=pair(8,12),item=toReturn(sims,'insect-8',.05,1/60);
 for(const inspection of [false,true]){const a=createInsectModel('dragonfly',{inspection}),b=createInsectModel('dragonfly',{inspection}),caught={...item,caught:true};updateInsectModel(a,caught,3);updateInsectModel(b,withoutDisplay(caught),3);assert.deepEqual(pose(a),pose(b));if(inspection){updateInsectModel(a,item,7);updateInsectModel(b,withoutDisplay(item),7);assert.deepEqual(pose(a),pose(b));}}
 for(const dt of [0,NaN,Infinity,-.1,1,100])tick(sims,dt);
 for(const sim of sims)sim.reset();compare(...sims);assert.ok(sims[0].items.filter(i=>i.species==='dragonfly').every(i=>!i.dragonflyArriving&&i.dragonflyWingBlend===0));
 const travel=createInsects(()=>0,{dragonflyAmbient:profiles(8,12)});assert.deepEqual(sims[0].items,travel.items);
});
