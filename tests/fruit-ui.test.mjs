import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('fruit prompt is initially hidden in the existing stacked control group, without another HUD box',async()=>{
  const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
  const group=html.match(/<div class="hud-controls">([\s\S]*?)<\/div>/)?.[1]||'';
  assert.match(group,/<p id="interaction-hint" class="interaction-hint" role="status" hidden><\/p>/);
  assert.match(group,/id="controls-hint"/);assert.match(group,/id="look-resume-hint"/);
  assert.equal((html.match(/id="interaction-hint"/g)||[]).length,1);
  assert.match(html,/E \/ X \/ □：熱帯の果実台・倒木で置く・片付ける/);
  const css=await readFile(new URL('../style.css',import.meta.url),'utf8');
  assert.match(css,/\.hud-controls\{[^}]*display:flex;flex-direction:column;gap:6px/);
  assert.match(css,/\.look-resume-hint,\.interaction-hint\{font-size:12px/);
  assert.match(css,/\.look-resume-hint,\.interaction-hint\{font-size:11px\}/);
  assert.match(css,/max-width:calc\(100vw - 240px\)/);assert.match(css,/max-width:calc\(100vw - 180px\)/);
  assert.doesNotMatch(css,/\.interaction-hint\{[^}]*(?:position:absolute|border:|background:)/);
});

test('index version labels agree at 0.18.1 and existing habitat, journal and quiet controls remain',async()=>{
  const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
  assert.match(html,/<meta name="application-version" content="0\.18\.1">/);
  assert.equal((html.match(/data-build-version>0\.18\.1</g)||[]).length,2);
  assert.match(html,/<button[^>]*id="title-button"[^>]*>表紙へ<\/button>/);
  for(const id of ['habitat-select','travel-habitat-select','travel-button','journal-button','pause-journal-button','inspect-journal-button','pause-button','quiet-label'])assert.ok(html.includes(`id="${id}"`),id);
  for(const text of ['Shift 保持','右クリック保持','Space</dt><dd>網をふる','左クリック：見回し中は網 · 停止中は見回し再開。','LB 保持','RB 保持','View 図鑑','Start ひと休み'])assert.ok(html.includes(text),text);
});
