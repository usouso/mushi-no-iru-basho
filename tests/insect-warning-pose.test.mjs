/** Warning pose geometry only. Actual perception and GPU rendering are untested. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const sandbox={console};vm.runInNewContext(fs.readFileSync(new URL('../assets/vendor/three.min.js',import.meta.url),'utf8'),sandbox);const T=sandbox.THREE,c={};
for(const method of['fillRect','clearRect','beginPath','moveTo','lineTo','bezierCurveTo','quadraticCurveTo','stroke','fill','save','restore','translate','rotate','ellipse','arc','drawImage','closePath','clip'])c[method]=()=>{};c.createLinearGradient=()=>({addColorStop(){}});
globalThis.window={THREE:T};globalThis.document={createElement:()=>({getContext:()=>c})};
const {createInsectModel,updateInsectModel}=await import('../src/insect-models.js');
const state=extra=>({x:1,y:2,z:3,home:{x:1,y:2,z:3},heading:.2,wingPhase:.5,flightBlend:0,resting:true,caught:false,phase:.1,state:'resting',walkPhase:0,walkSpeed:0,dungDistance:0,...extra});
const bark={kind:'bark',point:{x:1,y:2,z:3},normal:{x:0,y:0,z:1}};
function vertices(model,wingOnly=false){
 model.updateMatrixWorld(true);const wingNodes=new Set();for(const w of model.userData.wings||[])w.traverse(n=>wingNodes.add(n));const result=[];
 model.traverse(node=>{if(!node.geometry||wingNodes.has(node)!==wingOnly)return;const p=node.geometry.attributes.position,point=new T.Vector3();for(let i=0;i<p.count;i++)result.push(...point.fromBufferAttribute(p,i).applyMatrix4(node.matrixWorld).toArray());});return result;
}
function dispose(model){const gs=new Set(),ms=new Set();model.traverse(n=>{if(n.geometry)gs.add(n.geometry);if(n.material)for(const m of Array.isArray(n.material)?n.material:[n.material])ms.add(m);});for(const x of[...gs,...ms])x.dispose();}

test('dragonfly and cicada warnings move actual wing vertices by a bounded hinge while every resting body/foot vertex stays fixed',()=>{
 for(const species of['dragonfly','cicada']){
  const model=createInsectModel(species),support=species==='cicada'?bark:null,base=state();updateInsectModel(model,base,1,support);const body=vertices(model),wings=vertices(model,true),root=model.matrix.toArray(),visual=model.userData.visual.matrix.toArray(),angles=model.userData.wings.map(w=>w.rotation.z);let previous=0;
  for(const alertBlend of[.25,.5,1,20]){
   const item=state({awarenessStage:'warning',alertBlend}),saved=JSON.stringify(item);updateInsectModel(model,item,1,support);assert.equal(JSON.stringify(item),saved);assert.deepEqual(vertices(model),body,'body/legs including real foot skin unchanged');assert.deepEqual(model.matrix.toArray(),root);assert.deepEqual(model.userData.visual.matrix.toArray(),visual);const changed=vertices(model,true);let displacement=0;
   for(let i=0;i<changed.length;i+=3)displacement=Math.max(displacement,Math.hypot(changed[i]-wings[i],changed[i+1]-wings[i+1],changed[i+2]-wings[i+2]));assert.ok(displacement>0&&displacement<.04);assert.ok(displacement>=previous);previous=displacement;
   model.userData.wings.forEach((w,i)=>assert.ok(Math.abs(w.rotation.z-angles[i])<=.08+1e-12));
  }
  updateInsectModel(model,base,1,support);assert.deepEqual(vertices(model,true),wings,'warning ends without accumulated hinge drift');dispose(model);
 }
});

test('flying, landing, caught, inspection, missing/invalid blend and other awareness phases keep original poses',()=>{
 for(const species of['dragonfly','cicada'])for(const inspection of[false,true])for(const extra of[{flightBlend:1,resting:false},{flightBlend:.4,resting:true,state:'landing'},{resting:false},{caught:true},{alertBlend:NaN},{alertBlend:-1},{alertBlend:undefined},{awarenessStage:'settling'}]){
  const a=createInsectModel(species,{inspection}),b=createInsectModel(species,{inspection}),neutral=state(extra),warn=state({awarenessStage:'warning',alertBlend:1,...extra});updateInsectModel(a,neutral,1,bark);updateInsectModel(b,warn,1,bark);assert.deepEqual(vertices(a),vertices(b));assert.deepEqual(vertices(a,true),vertices(b,true));dispose(a);dispose(b);
 }
});

test('wing-warning fields do not change species outside the explicit butterfly/dragonfly/cicada set',()=>{
 // Butterfly warning is an intentional 0.21 addition, covered by capture-core tests.
 for(const species of['morpho','grasshopper','hercules','leafinsect','waterstrider','leafcutterant','firefly','dungbeetle','divingbeetle','mantis','ladybird','rhino','stag','metallifer','bee','swallowtail','jewel','longhorn']){
  const a=createInsectModel(species),b=createInsectModel(species);updateInsectModel(a,state(),1);updateInsectModel(b,state({awarenessStage:'warning',alertBlend:1}),1);assert.deepEqual(vertices(a),vertices(b),species+' body');assert.deepEqual(vertices(a,true),vertices(b,true),species+' wings');dispose(a);dispose(b);
 }
});
