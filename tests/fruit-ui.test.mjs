import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('fruit prompt is initially hidden in the existing stacked control group, without a separately positioned HUD panel',async()=>{
  const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
  const group=html.match(/<div class="hud-controls">([\s\S]*?)<\/div>/)?.[1]||'';
  assert.match(group,/<p id="interaction-hint" class="interaction-hint" role="status" hidden><\/p>/);
  assert.match(group,/id="controls-hint"/);assert.match(group,/id="look-resume-hint"/);assert.match(group,/id="quiet-label"/,'narrow quiet state shares the hint flow');
  assert.equal((html.match(/id="interaction-hint"/g)||[]).length,1);
  assert.match(html,/E \/ X \/ □：熱帯の果実台・倒木で置く・片付ける/);
  const css=await readFile(new URL('../style.css',import.meta.url),'utf8');
  assert.match(css,/\.hud-controls\{[^}]*display:flex;flex-direction:column;gap:6px/);
  assert.match(css,/\.controls-hint,\.look-resume-hint,\.interaction-hint\{font-size:16px;line-height:1\.5/);
  assert.doesNotMatch(css,/(?:controls-hint|look-resume-hint|interaction-hint)[^{]*\{[^}]*font-size:1[0-5]px/);
  assert.match(css,/\.hud-controls\{[^}]*max-width:calc\(100% - 192px\)/);assert.match(css,/\.hud-controls\{left:12px;bottom:12px;max-width:calc\(100% - 180px\)/);
  assert.doesNotMatch(css,/(?:^|[}\n])\s*\.interaction-hint\{/,'the prompt shares the readable stacked hint style, not a new floating panel');
  const narrow=css.slice(css.indexOf('@media(max-width:440px)'));assert.match(narrow,/\.quiet-label\{position:static;align-self:flex-end;max-width:100%\}/);assert.doesNotMatch(narrow,/bottom:110px/,'wrapped prompts cannot intersect a fixed-height quiet label');
});

test('index version labels agree at 0.22.0 and existing habitat, journal and quiet controls remain',async()=>{
  const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
  assert.match(html,/<meta name="application-version" content="0\.22\.0">/);
  assert.equal((html.match(/data-build-version>0\.22\.0</g)||[]).length,2);
  assert.match(html,/<button[^>]*id="title-button"[^>]*>表紙へ<\/button>/);
  for(const id of ['habitat-select','travel-habitat-select','travel-button','journal-button','pause-journal-button','inspect-journal-button','pause-button','quiet-label'])assert.ok(html.includes(`id="${id}"`),id);
  for(const text of ['Shift 保持','右クリック保持','Space</dt><dd>網をふる','左クリック：見回し中は網 · 停止中は見回し再開。','LB 保持','RB 保持','View 図鑑','Start ひと休み'])assert.ok(html.includes(text),text);
});
