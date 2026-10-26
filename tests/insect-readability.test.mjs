/** Actual r128 model/shader-source tests, not GPU compilation or visibility QA. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..');
const sandbox={console};vm.runInNewContext(fs.readFileSync(path.join(root,'assets/vendor/three.min.js'),'utf8'),sandbox);
const THREE=sandbox.THREE;
const context={};for(const method of ['fillRect','clearRect','beginPath','moveTo','lineTo','bezierCurveTo','quadraticCurveTo','stroke','fill','save','restore','translate','rotate','ellipse','arc','drawImage','closePath','clip'])context[method]=()=>{};
context.createLinearGradient=()=>({addColorStop(){}});
globalThis.window={THREE};globalThis.document={createElement(tag){assert.equal(tag,'canvas');return{width:0,height:0,getContext(type){assert.equal(type,'2d');return context;}};}};
const {applyInsectReadability}=await import('../src/insect-readability.js');
const {createInsectModel}=await import('../src/insect-models.js');
// Build the current factory without its final adapter in memory. No private git
// history, debug runtime export or alternate on-disk production file is needed.
const urls=new Map();function unassistedURL(name){
 name=name.split('?',1)[0];if(urls.has(name))return urls.get(name);
 let source=fs.readFileSync(path.join(root,'src',name),'utf8');
 if(name==='insect-models.js'){
  const final='return applyInsectReadability(root, { inspection, species });';assert.equal(source.split(final).length,2);
  source=source.replace(final,'return root;');
 }
 source=source.replace(/from\s*['"]\.\/([^'"]+)['"]/g,(_,dep)=>`from ${JSON.stringify(unassistedURL(dep))}`);
 const url='data:text/javascript;base64,'+Buffer.from(source).toString('base64');urls.set(name,url);return url;
}
const original=await import(unassistedURL('insect-models.js'));
const species=['butterfly','dragonfly','cicada','morpho','grasshopper','hercules','leafinsect','waterstrider','leafcutterant','firefly','dungbeetle','divingbeetle','mantis','ladybird','rhino','stag','bee','swallowtail','jewel','longhorn'];
const meshes=model=>{const result=[];model.traverse(n=>{if(n.isMesh)result.push(n);});return result;};
const materials=model=>new Set(meshes(model).flatMap(m=>Array.isArray(m.material)?m.material:[m.material]));
const patched=m=>m.customProgramCacheKey().includes('|insect-readability-1:');
function signature(model){
 model.updateMatrixWorld(true);const hash=createHash('sha256');
 model.traverse(n=>{
  hash.update(JSON.stringify([n.type,n.name,n.visible,Array.from(n.matrix.elements),Array.from(n.matrixWorld.elements)]));
  if(n.geometry){
   for(const key of Object.keys(n.geometry.attributes).sort()){const a=n.geometry.attributes[key];hash.update(key+':'+a.itemSize+':'+a.normalized+':');hash.update(Buffer.from(a.array.buffer,a.array.byteOffset,a.array.byteLength));}
   if(n.geometry.index){const a=n.geometry.index.array;hash.update(Buffer.from(a.buffer,a.byteOffset,a.byteLength));}
  }
 });return hash.digest('hex');
}
const colourContract=m=>({type:m.type,color:m.color?.toArray(),emissive:m.emissive?.toArray(),emissiveIntensity:m.emissiveIntensity,opacity:m.opacity,transparent:m.transparent,alphaTest:m.alphaTest,depthTest:m.depthTest,depthWrite:m.depthWrite,side:m.side,blending:m.blending,fog:m.fog,vertexColors:m.vertexColors,roughness:m.roughness,metalness:m.metalness,mapName:m.map?.name||'',mapSize:m.map?[m.map.image.width,m.map.image.height]:null});

test('all twenty field factories retain exact geometry, pose, draw count and physical material properties',()=>{
 for(const id of species){
  const before=original.createInsectModel(id),after=createInsectModel(id);
  assert.equal(signature(after),signature(before),id+' geometry/pose');
  assert.equal(meshes(after).length,meshes(before).length,id+' draw objects');
  assert.deepEqual([...materials(after)].map(colourContract),[...materials(before)].map(colourContract),id+' alpha/depth/maps');
  const eligible=[...materials(after)].filter(m=>m.isMeshStandardMaterial&&!m.transparent);
  assert.ok(eligible.length>0,id+' has lit surfaces');
  assert.equal(eligible.every(patched),id!=='firefly',id+' field-only coverage');
  assert.ok([...materials(after)].filter(m=>m.transparent).every(m=>!patched(m)),id+' membranes unchanged');
 }
});

test('inspection is byte-equivalent at geometry/material level, with no field hook or shared material leak',()=>{
 for(const id of species){
  const field=createInsectModel(id),inspection=createInsectModel(id,{inspection:true}),before=original.createInsectModel(id,{inspection:true});
  assert.equal(signature(inspection),signature(before),id+' inspection geometry');
  assert.deepEqual([...materials(inspection)].map(colourContract),[...materials(before)].map(colourContract));
  const fieldMaterials=materials(field);
  for(const material of materials(inspection)){assert.equal(patched(material),false,id+' inspection hook');assert.equal(fieldMaterials.has(material),false,id+' material ownership');}
 }
});

test('actual vendored standard shader keeps alpha/depth/normal/map/fog processing and adds only interior colour fill',()=>{
 assert.equal(THREE.REVISION,'128');
 for(const id of ['butterfly','hercules','rhino','stag','divingbeetle','leafinsect']){
  const material=[...materials(createInsectModel(id))].find(patched),shader={vertexShader:THREE.ShaderLib.standard.vertexShader,fragmentShader:THREE.ShaderLib.standard.fragmentShader,uniforms:{}};
  const vertex=shader.vertexShader;material.onBeforeCompile(shader,{});
  assert.equal(shader.vertexShader,vertex,'no silhouette expansion');
  assert.equal(shader.fragmentShader.split('// insect-readability-1:').length,2,'one adapter');
  for(const token of ['#include <alphatest_fragment>','#include <normal_fragment_maps>','#include <map_fragment>','#include <fog_fragment>','#include <tonemapping_fragment>','gl_FragColor = vec4( outgoingLight, diffuseColor.a );'])assert.ok(shader.fragmentShader.includes(token),token);
  assert.ok(shader.fragmentShader.indexOf('insectEdge =')>shader.fragmentShader.indexOf('#include <lights_fragment_end>'));
  assert.ok(shader.fragmentShader.indexOf('insectEdge =')<shader.fragmentShader.indexOf('#include <fog_fragment>'));
  assert.doesNotMatch(shader.fragmentShader,/gl_FragDepth|discard\s*;|diffuseColor\.a\s*=/);
  assert.match(shader.fragmentShader,new RegExp('insectEdge \\* '+(['rhino','stag'].includes(id)?'0\\.24':'0\\.60')));
 }
});

test('pre-existing shader hooks, dynamic cache keys, material identity and disposal listeners survive idempotent application',()=>{
 const material=new THREE.MeshStandardMaterial(),map=new THREE.Texture();material.map=map;let key='first',calls=0,disposals=0,observedThis,observedRenderer;
 material.customProgramCacheKey=()=>key;
 material.onBeforeCompile=function(shader,renderer){calls++;observedThis=this;observedRenderer=renderer;shader.uniforms.depthExisting={value:.4};shader.fragmentShader=shader.fragmentShader.replace('gl_FragColor = vec4( outgoingLight, diffuseColor.a );','diffuseColor.a *= 0.4;\ngl_FragColor = vec4( outgoingLight, diffuseColor.a );');};
 material.addEventListener('dispose',()=>disposals++);
 const model=new THREE.Group(),mesh=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),material);model.add(mesh);applyInsectReadability(model,{species:'divingbeetle'});
 const hook=material.onBeforeCompile,version=material.version;applyInsectReadability(model,{species:'divingbeetle'});assert.equal(material.onBeforeCompile,hook);assert.equal(material.version,version);assert.equal(mesh.material,material);assert.equal(material.map,map);
 assert.match(material.customProgramCacheKey(),/^first\|insect-readability-1:/);key='second';assert.match(material.customProgramCacheKey(),/^second\|/);
 const renderer={},shader={fragmentShader:THREE.ShaderLib.standard.fragmentShader,uniforms:{}};material.onBeforeCompile(shader,renderer);assert.equal(calls,1);assert.equal(observedThis,material);assert.equal(observedRenderer,renderer);assert.equal(shader.uniforms.depthExisting.value,.4);assert.match(shader.fragmentShader,/diffuseColor\.a \*= 0\.4;/);material.dispose();assert.equal(disposals,1);
});

test('transparent, basic, shader, line, inspection and firefly materials are untouched; unknown upstream fragment fails closed',()=>{
 for(const material of [new THREE.MeshStandardMaterial({transparent:true,opacity:.6}),new THREE.MeshBasicMaterial(),new THREE.ShaderMaterial()]){
  const group=new THREE.Group();group.add(new THREE.Mesh(new THREE.BoxGeometry(1,1,1),material));const hook=material.onBeforeCompile,key=material.customProgramCacheKey();applyInsectReadability(group,{species:'butterfly'});assert.equal(material.onBeforeCompile,hook);assert.equal(material.customProgramCacheKey(),key);
 }
 for(const options of [{inspection:true,species:'hercules'},{species:'firefly'}]){
  const group=new THREE.Group(),material=new THREE.MeshStandardMaterial();group.add(new THREE.Mesh(new THREE.BoxGeometry(1,1,1),material));const hook=material.onBeforeCompile;applyInsectReadability(group,options);assert.equal(material.onBeforeCompile,hook);
 }
 const material=new THREE.MeshStandardMaterial(),group=new THREE.Group();group.add(new THREE.Mesh(new THREE.BoxGeometry(1,1,1),material));applyInsectReadability(group,{species:'hercules'});const shader={fragmentShader:'void main(){gl_FragColor=vec4(1.0);}',uniforms:{}};material.onBeforeCompile(shader,{});assert.equal(shader.fragmentShader,'void main(){gl_FragColor=vec4(1.0);}');
});
