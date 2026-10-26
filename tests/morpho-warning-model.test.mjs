/** Actual vendored THREE vertices/hinges, not GPU visibility or natural-behaviour proof. */
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const sandbox={console};vm.runInNewContext(fs.readFileSync(new URL('../assets/vendor/three.min.js',import.meta.url),'utf8'),sandbox);const T=sandbox.THREE,context={};
for(const name of ['fillRect','clearRect','beginPath','moveTo','lineTo','bezierCurveTo','quadraticCurveTo','stroke','fill','save','restore','translate','rotate','ellipse','arc','drawImage','closePath','clip'])context[name]=()=>{};context.createLinearGradient=()=>({addColorStop(){}});
globalThis.window={THREE:T};globalThis.document={createElement:()=>({getContext:()=>context})};
const {createInsectModel,updateInsectModel}=await import('../src/insect-models.js');
const state=extra=>({species:'morpho',x:2,y:1.2,z:3,heading:.3,phase:.2,wingPhase:1.4,resting:true,flightBlend:0,caught:false,state:'resting',awarenessStage:'calm',alertBlend:0,...extra});
function vertices(root,wings=false){root.updateMatrixWorld(true);const wingNodes=new Set();for(const w of root.userData.wings)w.traverse(n=>wingNodes.add(n));const out=[],point=new T.Vector3();root.traverse(n=>{if(!n.geometry||wingNodes.has(n)!==wings)return;const p=n.geometry.attributes.position;for(let i=0;i<p.count;i++)out.push(...point.fromBufferAttribute(p,i).applyMatrix4(n.matrixWorld).toArray());});return out;}
const transform=root=>[...root.position.toArray(),...root.quaternion.toArray(),...root.scale.toArray(),...root.userData.visual.position.toArray(),...root.userData.visual.quaternion.toArray(),...root.userData.visual.scale.toArray()];
function dispose(root){const gs=new Set(),ms=new Set();root.traverse(n=>{if(n.geometry)gs.add(n.geometry);for(const m of n.material?(Array.isArray(n.material)?n.material:[n.material]):[])ms.add(m);});for(const r of [...gs,...ms])r.dispose();}

test('four morpho hinges warn on both a natural perch and fruit, with every non-wing body/leg/support vertex and scale unchanged',()=>{
 for(const feeding of [false,true])for(const time of [.1,1,2.5]){
  const model=createInsectModel('morpho'),base=state({state:feeding?'feeding':'resting'});updateInsectModel(model,base,time);const body=vertices(model),wings=vertices(model,true),root=transform(model),pivots=model.userData.wings.map(p=>p.position.toArray()),angles=model.userData.wings.map(p=>p.rotation.z);assert.equal(angles.length,4);let previous=0;
  for(const alertBlend of [.25,.5,1,10]){const item={...base,awarenessStage:'warning',alertBlend},saved=JSON.stringify(item);updateInsectModel(model,item,time);assert.equal(JSON.stringify(item),saved);assert.deepEqual(vertices(model),body,'merged body includes all six legs; no support skin changes');assert.deepEqual(transform(model),root);assert.deepEqual(model.userData.wings.map(p=>p.position.toArray()),pivots);const next=vertices(model,true);let displacement=0;for(let i=0;i<next.length;i+=3)displacement=Math.max(displacement,Math.hypot(next[i]-wings[i],next[i+1]-wings[i+1],next[i+2]-wings[i+2]));assert.ok(displacement>0&&displacement<.08);assert.ok(displacement>=previous);previous=displacement;model.userData.wings.forEach((p,i)=>{const opening=(angles[i]-p.rotation.z)*p.userData.side;assert.ok(opening>0&&opening<=.275+1e-12);});}
  updateInsectModel(model,base,time);assert.deepEqual(vertices(model,true),wings,'ending warning has no accumulated hinge drift');dispose(model);
 }
});

test('inspection, caught, airborne/nonperched, invalid blend and other awareness stages retain their exact existing pose',()=>{
 const cases=[{inspection:true},{extra:{caught:true}},{extra:{resting:false}},{extra:{flightBlend:.01}},{extra:{flightBlend:.5,state:'landing'}},{extra:{flightBlend:1,resting:false,state:'startled'}},{extra:{alertBlend:NaN}},{extra:{alertBlend:Infinity}},{extra:{alertBlend:-1}},{extra:{alertBlend:undefined}},{extra:{awarenessStage:'settling'}},{extra:{awarenessStage:'fleeing'}}];
 for(const scenario of cases){const a=createInsectModel('morpho',{inspection:!!scenario.inspection}),b=createInsectModel('morpho',{inspection:!!scenario.inspection});if(scenario.inspection){a.scale.setScalar(3.4);b.scale.setScalar(3.4);}updateInsectModel(a,state(scenario.extra),1);updateInsectModel(b,state({awarenessStage:'warning',alertBlend:1,...scenario.extra}),1);assert.deepEqual(vertices(a),vertices(b));assert.deepEqual(vertices(a,true),vertices(b,true));assert.deepEqual(transform(a),transform(b));if(scenario.inspection)assert.deepEqual(Array.from(b.scale.toArray()),[3.4,3.4,3.4],'inspection framing size remains caller-owned');dispose(a);dispose(b);}
});

test('gradually appearing and decaying warning remains finite and continuous instead of switching geometry or scale',()=>{
 const model=createInsectModel('morpho'),shape=model.userData.wings.map(p=>p.children.map(m=>m.geometry)),base=state();let previous=null,maxStep=0;
 for(let frame=0;frame<=120;frame++){const time=frame/120,blend=Math.sin(Math.PI*time)**2;updateInsectModel(model,{...base,awarenessStage:'warning',alertBlend:blend},time);const current=vertices(model,true);assert.ok(current.every(Number.isFinite));if(previous)for(let i=0;i<current.length;i+=3)maxStep=Math.max(maxStep,Math.hypot(current[i]-previous[i],current[i+1]-previous[i+1],current[i+2]-previous[i+2]));previous=current;assert.deepEqual(model.userData.wings.map(p=>p.children.map(m=>m.geometry)),shape);}
 assert.ok(maxStep<.004,`maximum wing-vertex step ${maxStep} m at 120Hz`);dispose(model);
});


test('fruit contact can show a warning during residual wing settling, proportional to grounded blend without affecting the body',()=>{
 const a=createInsectModel('morpho'),b=createInsectModel('morpho');
 for(const flightBlend of [1,.9,.4,.01,0]){const calm=state({state:'feeding',flightBlend}),warn={...calm,awarenessStage:'warning',alertBlend:1};updateInsectModel(a,calm,1);updateInsectModel(b,warn,1);assert.deepEqual(vertices(a),vertices(b));assert.deepEqual(transform(a),transform(b));for(let i=0;i<4;i++){const left=a.userData.wings[i],right=b.userData.wings[i],opening=(left.rotation.z-right.rotation.z)*left.userData.side;assert.ok(Math.abs(opening-(1-flightBlend)*(.24+.035*Math.sin(10)))<1e-12);}}
 dispose(a);dispose(b);
});
