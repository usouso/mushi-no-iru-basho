/** UI contract and conservative declared-size budgets only. No browser layout,
 * WebGL, screenshot, actual font rendering or accessibility certification. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('index.html'),css=read('style.css'),journal=read('src/journal-ui.js');
const body=html.slice(html.indexOf('<body>')), ids=[...body.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
const block=selector=>{const escaped=selector.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),match=css.match(new RegExp('(?:^|[}\\n{])\\s*'+escaped+'\\{([^}]+)\\}'));assert.ok(match,selector);return match[1];};
const plain=s=>s.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
const vars=Object.fromEntries([...block(':root').matchAll(/(--[\w-]+):([^;]+);/g)].map(m=>[m[1],m[2]]));
const value=v=>v.replace(/var\((--[\w-]+)\)/g,(_,key)=>vars[key]);
function luminance(hex){const rgb=value(hex).replace('#','');assert.match(rgb,/^[\da-f]{6}$/i,'contrast pair must be opaque');return rgb.match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);}
const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);};

test('screen IDs, native controls, labels and urgent status nodes survive reduced copy',()=>{
 assert.equal(new Set(ids).size,ids.length,'no duplicate event targets');
 for(const id of ['start-screen','hud','pause-screen','inspect-screen','companions-screen','battle-screen','error-screen','start-button','pause-button','resume-button','travel-button','habitat-select','travel-habitat-select','volume','sensitivity','restart-button','title-button','journal-button','pause-journal-button','inspect-journal-button','companions-button','pause-companions-button','capture-battle-button','keep-button','release-button','companion-select','battle-opponent-select','battle-start-button','companion-release-button','companions-close-button','battle-heading','battle-state','battle-position','battle-move-player','battle-move-opponent','battle-cue','battle-result','battle-save-status','battle-finish-button','battle-exit-button','expedition-status','companion-save-status'])assert.ok(ids.includes(id),id);
 for(const id of ['volume','sensitivity','habitat-select','travel-habitat-select','companion-select','battle-opponent-select'])assert.ok(html.includes(`for="${id}"`),id+' label');
 for(const match of body.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/g))assert.ok(plain(match[1]).length>1,'no unexplained icon-only actions');
 assert.match(html,/id="battle-save-status" role="status" aria-live="polite" hidden/);assert.match(html,/id="companion-save-status" role="status" aria-live="polite"/);
 assert.equal((html.match(/data-build-version/g)||[]).length,2);assert.match(html,/name="application-version"/);
});

test('long instructions are optional native details; important actions and save warnings are not collapsed',()=>{
 const details=[...html.matchAll(/<details\b([^>]*)>([\s\S]*?)<\/details>/g)];assert.equal(details.length,4);
 for(const [,attrs,contents] of details){assert.doesNotMatch(attrs,/\bopen\b/);assert.match(contents,/<summary>[^<]+<\/summary>/);assert.doesNotMatch(contents,/id="(?:capture-battle-button|release-button|keep-button|battle-save-status|companion-save-status|expedition-status|volume)"/);}
 assert.match(details[0][2],/Shift 保持/);assert.match(details[0][2],/右クリック保持/);assert.match(details[0][2],/左クリック：見回し中は網 · 停止中は見回し再開/);assert.match(details[0][2],/View 図鑑/);
 assert.match(details[2][2],/id="insect-description"/);assert.match(details[2][2],/id="insect-hint"/);assert.match(details[3][2],/場外で決着/);
 assert.doesNotMatch(body,/LOCAL PROTOTYPE|A SMALL ENCOUNTER|FIELD NOTES|A MOMENT IN THE SHADE|class="journey"/);
 assert.doesNotMatch(html,/<button[^>]+id="battle-(push|evade|brace)"/);
});

test('all functional CSS text has at least 16px and line-height 1.5; small version labels are the only exceptions',()=>{
 const withoutVersions=css.replace(/\.title-version\{[^}]*\}/g,'').replace(/\.pause-bottom\{[^}]*\}/g,'');
 const sizes=[...withoutVersions.matchAll(/font-size:([^;}]+)/g)].map(m=>m[1]);assert.ok(sizes.length>40);
 for(const size of sizes){const minimum=parseFloat(size.replace(/^clamp\(/,''));assert.ok(minimum>=16,'functional minimum '+size);}
 for(const [,height] of css.matchAll(/line-height:([\d.]+)/g))assert.ok(Number(height)>=1.5,'line height '+height);
 for(const selector of ['body','.insect-description','.individual-size','.companions-card p','.error-card p','body .field-journal .fj-observation,body .field-journal .fj-place','body .field-journal .fj-note'])assert.match(block(selector),/font-size:18px/);
 assert.match(css,/summary:focus-visible/);assert.match(css,/button:disabled,select:disabled\{[^}]*opacity:1;[^}]*cursor:not-allowed;[^}]*border-style:dashed/);
});

test('opaque text plates and journal override colors pass normal-text contrast without relying on scene or shadows',()=>{
 const pairs=[['var(--ink)','var(--paper)'],['var(--ink-soft)','var(--paper)'],['var(--hud-text)','var(--hud-plate)'],['var(--paper)','var(--leaf)'],['#ffe1a1','var(--hud-plate)'],['var(--warning-ink)','var(--warning-bg)'],['#53604d','#dedfd4'],['var(--ink-soft)','#fffef8']];
 for(const [fg,bg] of pairs)assert.ok(contrast(fg,bg)>=4.5,`${fg}/${bg}: ${contrast(fg,bg)}`);
 for(const selector of ['.hud-status','.target-hint','.toast','.controls-hint,.look-resume-hint,.interaction-hint','.quiet-label','.observation-controls','.battle-top','.battle-moves strong','.battle-call'])assert.match(block(selector),/background:var\(--hud-plate\)/,selector);
 assert.match(block('.individual-size'),/color:var\(--ink\)/);assert.match(block('.expedition-status'),/color:var\(--ink\)/);
 assert.match(css,/body \.field-journal \.fj-status\[data-unsaved="true"\][^{]*\{[^}]*color:var\(--warning-ink\)/);
 assert.doesNotMatch(css,/text-shadow:/,'critical text no longer relies on shadows');
 assert.match(block('.battle-screen[data-phase="watching"] .battle-call'),/position:static/,'watching prompt flows above variable-length save warning');
 assert.doesNotMatch(css,/data-phase="(?:ringout|finished)"[^}]*font-size:(?:1\d|2[0-9])px/);
});

test('declared boxes reserve horizontal gaps at 640/900/1280 and remain scrollable at 360/480/720 heights',()=>{
 // These are box/em budgets derived from the declarations, NOT computed DOM.
 assert.match(block('.hud-status'),/max-width:calc\(100% - 230px\)/);assert.match(block('.hud-actions'),/width:188px/);
 assert.match(css,/\.hud-status\{top:12px;left:12px;max-width:calc\(100% - 208px\)/);
 assert.match(css,/\.hud-actions\{top:12px;right:12px;width:176px/);
 assert.match(block('.hud-controls'),/max-width:calc\(100% - 192px\)/);assert.match(css,/\.hud-controls\{left:12px;bottom:12px;max-width:calc\(100% - 180px\)/);
 assert.match(block('.pause-card,.companions-card'),/max-height:calc\(100dvh - 32px\);overflow:auto/);
 assert.match(block('body .field-journal .fj-sheet'),/max-height:calc\(100dvh - 32px\)/);
 assert.match(block('.inspect-card'),/overflow:auto/);assert.doesNotMatch(css.replace(/\.battle-accessible-detail\{[^}]*\}/g,''),/white-space:nowrap/,'ordinary text may wrap');
 for(const width of [640,900,1280])for(const height of [360,480,720]){
  const narrow=width<=760,edge=narrow?12:16,menu=narrow?176:188,status=width-(narrow?208:230);
  assert.ok(width-edge-menu-(edge+status)>=8,`${width} top cluster gap`);
  const controls=width-(narrow?180:192),quiet=narrow?144:152;
  assert.ok(width-edge-quiet-(edge+controls)>=8,`${width} bottom status gap`);
  const sheet=Math.min(560,width-32),padding=height<=520?18:24;
  assert.ok(sheet-2*padding>=480,'menu content has room for an 18px action with wrapping');
  assert.ok(height-32>=328,'bounded modal has a scroll viewport even on short windows');
  const inspection=height<=520?340:narrow?width-32:380;
  assert.ok(inspection<=width-32);assert.ok(inspection-48>=292);
  const journalWidth=Math.min(1080,width-32),columns=width<=760?1:width<=1000?2:3;
  const journalCard=(journalWidth-48-(columns-1)*16)/columns;
  assert.ok(journalCard-40>=18*15,`${width} journal permits at least 15 full-width body glyphs per line`);
  const battleWidth=width-32,headingSize=height<=520?18:Math.min(24,Math.max(18,width*.02));
  const headingLines=Math.ceil(40*headingSize/(battleWidth-32)); // conservative 40 full-width glyphs
  const headingHeight=headingLines*headingSize*1.5+24+14;
  const moveSize=height<=520?26:Math.min(48,Math.max(26,width*.035));
  const moveHeight=moveSize*1.5+6+(height<=520?6:14);
  const watchingCue=18*1.5+12+8,warning=2*16*1.5+18,buttons=18*1.5+22;
  assert.ok(headingHeight+moveHeight+watchingCue+warning+buttons+10+24<=height,`${width}×${height} conservative arena stack`);
 }

});

test('journal observations, memo semantics and failure statuses remain present with larger external styling',()=>{
 assert.match(journal,/fj-observation/);assert.match(journal,/input\.maxLength = NOTE_LIMIT/);assert.match(journal,/aria-label/);assert.match(journal,/aria-describedby/);
 assert.match(journal,/保存できません/);assert.match(journal,/ページを閉じると失われます/);
 assert.match(css,/body \.field-journal \.fj-observation/);assert.match(css,/body \.field-journal \.fj-note::placeholder\{font-size:16px/);
 assert.doesNotMatch(css,/\.fj-(?:observation|place|note|status)[^{]*\{[^}]*display:none/);
 assert.match(css,/body \.field-journal \.fj-eyebrow\{display:none\}/);
});

test('real input leaves native summary Space/arrow keys alone while field Space and Escape still work',async t=>{
 const {createInput}=await import('../src/input.js'),document=new EventTarget(),window=new EventTarget(),canvas=new EventTarget();
 for(const [name,value]of Object.entries({document,window,navigator:{getGamepads:()=>[]}})){const before=Object.getOwnPropertyDescriptor(globalThis,name);Object.defineProperty(globalThis,name,{configurable:true,value});t.after(()=>{if(before)Object.defineProperty(globalThis,name,before);else delete globalThis[name];});}
 let mode='title',actions=0,pauses=0;createInput(canvas,{mode:()=>mode,action(){actions++;},pause(){pauses++;},blur(){},lock(){}});
 const key=(code,target)=>{const e=new Event('keydown',{cancelable:true});Object.defineProperties(e,{code:{value:code},target:{value:target},repeat:{value:false}});document.dispatchEvent(e);return e;};
 const summary={tagName:'SUMMARY'},nested={tagName:'SPAN',closest:selector=>selector.includes('summary')?summary:null};
 for(const current of ['title','paused','inspect','companions'])for(const target of [summary,nested]){mode=current;for(const code of ['Space','Enter','ArrowDown'])assert.equal(key(code,target).defaultPrevented,false,current+' '+code);}
 assert.equal(actions,0,'opening help must not swing the net');assert.equal(key('Escape',summary).defaultPrevented,true);assert.equal(pauses,1);
 mode='playing';assert.equal(key('Space',canvas).defaultPrevented,true);assert.equal(actions,1,'actual field input unchanged');
});
