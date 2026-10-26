/** Issue #1: execute actual updateHUD with DOM doubles + audit declared CSS bounds.
 * Self-contained: node --test tests/issue-1-controls-hint.test.mjs
 * This checks copy/state/declared layout, NOT browser pixels, typography or usability.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=name=>fs.readFileSync(new URL('../'+name,import.meta.url),'utf8');
const html=read('index.html'),css=read('style.css'),main=read('src/main.js');
const hud=main.match(/function updateHUD\(\)\{[\s\S]*?\n\}(?=\nfunction render\()/)?.[0];
assert.ok(hud,'actual updateHUD function must be available in runtime source');
const text=id=>html.match(new RegExp(`<[^>]+id="${id}"[^>]*>([\\s\\S]*?)<\\/p>`))?.[1].replace(/<[^>]+>/g,'').trim();
function fixture(target=null){
 const nodes=new Map();for(const match of html.matchAll(/\bid="([^"]+)"/g))nodes.set(match[1],{textContent:text(match[1])||'',hidden:false,classList:{toggle(){}}});
 const canvas=nodes.get('game-canvas'),document={pointerLockElement:canvas},state={elapsed:1,player:{x:0,z:0,quiet:false,running:false}};
 const context={world:{},logFruitHabitat:null,nearbyBaitStation:()=>null,document,canvas,state,$:id=>{assert.ok(nodes.has(id),id);return nodes.get(id);},simulation:{dungBall:null,findTarget:()=>target},direction:()=>({}),journal:{entries:[]},locationLabel:()=> '野原'};
 vm.createContext(context);vm.runInContext(hud+'\nthis.update=updateHUD;',context);
 return{nodes,state,document,canvas,update:context.update};
}
test('compact movement, net, dash and quiet guidance stays stable while full click/look instructions remain available',()=>{
 const f=fixture();f.update();const locked=f.nodes.get('controls-hint').textContent;
 f.document.pointerLockElement=null;f.update();assert.equal(f.nodes.get('controls-hint').textContent,locked);
 assert.equal(text('controls-hint'),locked,'initial HTML and runtime copy must agree');
 for(const phrase of ['WASD 移動','Shift 走る','右クリック そっと','Space 網'])assert.ok(locked.includes(phrase),phrase);
 assert.match(html,/<dt>マウス<\/dt><dd>見回す<\/dd>/);assert.match(html,/左クリック：見回し中は網 · 停止中は見回し再開/);
});
test('separate look-resume notice appears only while unlocked, including after intro hint timeout',()=>{
 const f=fixture();for(const elapsed of [0,24,25,90]){
  f.state.elapsed=elapsed;f.document.pointerLockElement=f.canvas;f.update();assert.equal(f.nodes.get('look-resume-hint').hidden,true);
  assert.equal(f.nodes.get('controls-hint').hidden,elapsed>24);
  f.document.pointerLockElement=null;f.update();assert.equal(f.nodes.get('look-resume-hint').hidden,false);assert.equal(f.nodes.get('controls-hint').hidden,false);
 }
 assert.match(text('look-resume-hint'),/見回し停止中.*左クリックで見回し再開/);
 assert.match(html,/<p[^>]*id="look-resume-hint"[^>]*role="status"[^>]*hidden/);
});
test('catchable-target action copy explains left-click net only while already looking',()=>{
 const f=fixture({catchable:true});f.update();assert.match(f.nodes.get('target-hint').textContent,/左クリック \/ Space/);
 f.document.pointerLockElement=null;f.update();assert.match(f.nodes.get('target-hint').textContent,/Space/);assert.doesNotMatch(f.nodes.get('target-hint').textContent,/左クリック/);
 assert.match(f.nodes.get('controls-hint').textContent,/Space 網/);assert.equal(f.nodes.get('look-resume-hint').hidden,false);
});
test('target reasons, empty target and quiet/dash state remain independent of resume notice',()=>{
 const target={catchable:false,reason:'そっと近づいてみよう'},f=fixture(target);f.state.player.quiet=true;f.update();
 assert.equal(f.nodes.get('target-hint').textContent,target.reason);assert.equal(f.nodes.get('quiet-label').textContent,'そっと歩行中');
 f.state.player.quiet=false;f.state.player.running=true;f.document.pointerLockElement=null;f.update();assert.equal(f.nodes.get('quiet-label').textContent,'ダッシュ中');
 const empty=fixture();empty.update();assert.equal(empty.nodes.get('target-hint').textContent,'');assert.equal(empty.nodes.get('quiet-label').hidden,true);
});
test('declared stacked hint region retains readable sizes and reserves horizontal status space at supported wider widths',()=>{
 assert.match(html,/<div class="hud-controls">[\s\S]*?id="controls-hint"[\s\S]*?id="look-resume-hint"[\s\S]*?<\/div>/);
 assert.match(css,/\.hud-controls\{[^}]*left:16px;[^}]*bottom:16px;[^}]*max-width:calc\(100% - 192px\);[^}]*display:flex;[^}]*flex-direction:column;[^}]*gap:6px;/);
 assert.match(css,/\.controls-hint,\.look-resume-hint,\.interaction-hint\{font-size:16px;line-height:1\.5;[^}]*max-width:100%/);
 assert.match(css,/\.hud-controls\{left:12px;bottom:12px;max-width:calc\(100% - 180px\)\}/);
 assert.doesNotMatch(css,/(?:controls-hint|look-resume-hint|interaction-hint)[^{]*\{[^}]*font-size:1[0-5]px/);
 for(const width of [600,760,761,800,1024,1280,1920]){
  const mobile=width<=760,left=mobile?12:16,right=left,reserved=mobile?180:192,statusWidth=mobile?144:152;
  assert.ok(width-reserved>0);assert.ok(width-right-statusWidth-(left+width-reserved)>=8,`${width}px declared horizontal gap`);
 }
 // At <=440px the quiet label is another flex-flow child, not an absolute
 // box at a guessed text height. This is a structure check, not browser pixels.
 const group=html.match(/<div class="hud-controls">([\s\S]*?)<\/div>/)?.[1]||'';assert.match(group,/id="quiet-label"/);
 const narrow=css.slice(css.indexOf('@media(max-width:440px)'));assert.match(narrow,/\.quiet-label\{position:static;align-self:flex-end;max-width:100%\}/);assert.doesNotMatch(narrow,/bottom:110px/);
 assert.match(css,/\.hud-actions button\{padding:8px;font-size:16px\}/);
});
