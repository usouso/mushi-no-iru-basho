/** Actual candidate artifact audit, not an HTTP/cache freshness or browser test. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..');
const dist=fs.existsSync(path.join(root,'dist/index.html'))?path.join(root,'dist'):root;
// This delivered application uses static import-from declarations only. Fail on new forms
// rather than silently omitting an edge; the internal build suite tests the general parser.
function moduleReferences(source){
 const refs=[...source.matchAll(/^import\s+[^;\n]+?\s+from\s+(['"])([^'"]+)\1\s*;/gm)].map(m=>({start:m.index+m[0].indexOf(m[2]),end:m.index+m[0].indexOf(m[2])+m[2].length,specifier:m[2]}));
 const stripped=source.replace(/^import\s+[^;\n]+?\s+from\s+(['"])([^'"]+)\1\s*;/gm,'');
 assert.doesNotMatch(stripped,/^\s*(?:import\b|export\s+(?:\*|\{)[^;]*\bfrom\b)/m,'unsupported runtime import form requires explicit audit');
 return refs;
}
const read=name=>fs.readFileSync(path.join(dist,name));
const walk=(dir,prefix='')=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>!prefix&&e.name==='.git'?[]:e.isDirectory()?walk(path.join(dir,e.name),prefix+e.name+'/'):[prefix+e.name]).sort();
test('actual production graph has a closed exact token on every edge and matching content fingerprint, without source/build/package dependencies',()=>{
 // Public repository documents are not build inputs; all other unexpected files still fail.
 const reviewDocuments=new Set(['README.md','PLAYTEST-JA.md','AUDIO-PLAYTEST-JA.md']);
 const files=walk(dist).filter(name=>!name.startsWith('tests/')&&!reviewDocuments.has(name)),html=read('index.html').toString();
 const version=html.match(/<meta name="application-version" content="([0-9.]+)">/)?.[1];assert.equal(version,'0.29.0');
 assert.equal([...html.matchAll(/<span data-build-version>([^<]+)<\/span>/g)].filter(m=>m[1]===version).length,2);
 const refs=[...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(refs.length,3);const token=new URL(refs[0],'https://local.invalid/nested/index.html').search;
 assert.match(token,new RegExp('^\\?v='+version.replaceAll('.','\\.')+'&b=[a-f0-9]{12}$'));
 const expected=new Set(['index.html','style.css','.nojekyll','assets/vendor/three.min.js','assets/vendor/THREE-LICENSE.txt']);
 const audioFiles=['bgm_temperate_preview_01.ogg','insect_aburazemi_call_01.ogg','insect_beetle_walk_01.ogg','insect_beetle_walk_02.ogg','insect_beetle_walk_03.ogg','insect_grasshopper_landing_01.ogg','insect_grasshopper_landing_02.ogg','insect_grasshopper_takeoff_01.ogg','insect_grasshopper_takeoff_02.ogg','sfx_capture_01.ogg','sfx_net_swing_01.ogg','sfx_net_swing_02.ogg','sfx_net_swing_03.ogg','CREDITS.md','FluidR3-MIT-LICENSE.txt'];
 for(const file of audioFiles){expected.add('assets/audio/'+file);if(file.endsWith('.ogg'))assert.equal(read('assets/audio/'+file).subarray(0,4).toString(),'OggS');}
 const originals=new Map(),queue=[],seen=new Set();let edgeCount=0;
 function edge(specifier,parent){
  assert.match(specifier,/^\.{1,2}\//);const url=new URL(specifier,'https://local.invalid/nested/'+parent);
  assert.equal(url.origin,'https://local.invalid');assert.ok(url.pathname.startsWith('/nested/'));
  assert.equal(url.hash,'');assert.equal(url.search,token,`${parent}: ${specifier}`);edgeCount++;
  const name=url.pathname.slice('/nested/'.length);assert.ok(files.includes(name));expected.add(name);return name;
 }
 for(const ref of refs){const file=edge(ref,'index.html');if(file==='src/main.js')queue.push(file);}
 while(queue.length){
  const file=queue.shift();if(seen.has(file))continue;seen.add(file);
  let source=read(file).toString();assert.doesNotMatch(source,/__insectGame|DEV-ONLY|sourceMappingURL/);
  const dependencies=moduleReferences(source);
  for(const ref of dependencies)queue.push(edge(ref.specifier,file));
  for(const ref of dependencies.toReversed())source=source.slice(0,ref.start)+ref.specifier.slice(0,-token.length)+source.slice(ref.end);
  originals.set(file,Buffer.from(source));
 }
 assert.equal(seen.size,114);assert.ok(edgeCount>11);assert.deepEqual(files,[...expected].sort(),'runtime only; no maps, tests, helpers or package files');
 const originalHTML=html.split(token).join('');
 originals.set('index.html',Buffer.from(originalHTML));
 const hash=createHash('sha256');hash.update('bundle-v1\0'+version+'\0');
 for(const name of files){const bytes=originals.get(name)||read(name);hash.update(Buffer.byteLength(name)+':'+name+':'+bytes.length+':');hash.update(bytes);}
 assert.equal(token,'?v='+version+'&b='+hash.digest('hex').slice(0,12));
});
