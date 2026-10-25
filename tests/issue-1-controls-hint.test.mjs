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
 const context={nearbyBaitStation:()=>null,document,canvas,state,$:id=>{assert.ok(nodes.has(id),id);return nodes.get(id);},simulation:{findTarget:()=>target},direction:()=>({}),journal:{entries:[]},locationLabel:()=> '野原'};
 vm.createContext(context);vm.runInContext(hud+'\nthis.update=updateHUD;',context);
 return{nodes,state,document,canvas,update:context.update};
}
test('walking, looking, net, dash and quiet guidance has one stable wording in both lock states',()=>{
 const f=fixture();f.update();const locked=f.nodes.get('controls-hint').textContent;
 f.document.pointerLockElement=null;f.update();assert.equal(f.nodes.get('controls-hint').textContent,locked);
 assert.equal(text('controls-hint'),locked,'initial HTML and runtime copy must agree');
 for(const phrase of ['WASD 歩く','Shift 走る','右クリック そっと','マウス 見回す','Space 網','見回し中は左クリックも'])assert.ok(locked.includes(phrase),phrase);
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
 assert.match(f.nodes.get('controls-hint').textContent,/見回し中は左クリックも/);
});
test('target reasons, empty target and quiet/dash state remain independent of resume notice',()=>{
 const target={catchable:false,reason:'そっと近づいてみよう'},f=fixture(target);f.state.player.quiet=true;f.update();
 assert.equal(f.nodes.get('target-hint').textContent,target.reason);assert.equal(f.nodes.get('quiet-label').textContent,'そっと歩行中');
 f.state.player.quiet=false;f.state.player.running=true;f.document.pointerLockElement=null;f.update();assert.equal(f.nodes.get('quiet-label').textContent,'ダッシュ中');
 const empty=fixture();empty.update();assert.equal(empty.nodes.get('target-hint').textContent,'');assert.equal(empty.nodes.get('quiet-label').hidden,true);
});
test('declared stacked hint region reserves status width and retains text sizes without overlap assumptions',()=>{
 assert.match(html,/<div class="hud-controls">[\s\S]*?id="controls-hint"[\s\S]*?id="look-resume-hint"[\s\S]*?<\/div>/);
 assert.match(css,/\.hud-controls\{[^}]*left:34px;[^}]*bottom:29px;[^}]*max-width:calc\(100vw - 240px\);[^}]*display:flex;[^}]*flex-direction:column;[^}]*gap:6px;/);
 assert.match(css,/\.hud-controls \.controls-hint\{position:static;left:auto;bottom:auto;max-width:none\}/);
 assert.match(css,/@media\(max-width:760px\)\{\.hud-controls\{left:18px;bottom:20px;max-width:calc\(100vw - 180px\)\}/);
 assert.match(css,/\.look-resume-hint(?:,\.interaction-hint)?\{font-size:12px;/);assert.match(css,/\.look-resume-hint(?:,\.interaction-hint)?\{font-size:11px\}/);
 for(const width of [320,400,600,760,761,800,1024,1280,1920]){
  const mobile=width<=760,left=mobile?18:34,right=mobile?18:34,reserved=mobile?180:240,statusWidth=mobile?130:150;
  assert.ok(width-reserved>0);assert.ok(width-right-statusWidth-(left+width-reserved)>=14,`${width}px declared horizontal gap`);
 }
});
