import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createJournalUI } from '../src/journal-ui.js';

// Small DOM double: interaction/text safety checks, not a visual rendering claim.
class Node {
  constructor(tag, doc) { Object.assign(this,{tag,doc,children:[],attributes:{},listeners:{},dataset:{},textContent:'',value:'',selectionStart:0,selectionEnd:0}); }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children=nodes; }
  setAttribute(k,v) { this.attributes[k]=v; }
  addEventListener(k,fn) { (this.listeners[k] ||= []).push(fn); }
  emit(k,event={}) { for(const fn of this.listeners[k]||[]) fn(event); }
  focus() { this.doc.activeElement=this; }
  setSelectionRange(a,b) { this.selectionStart=a;this.selectionEnd=b; }
  set innerHTML(_) { throw Error('Unsafe HTML sink'); }
}
const all=node=>[node,...node.children.flatMap(all)];
const find=(node,cls)=>all(node).filter(n=>n.className?.split(' ').includes(cls));
const definitions={butterfly:{name:'モンシロチョウ'},dragonfly:{name:'アキアカネ'},cicada:{name:'アブラゼミ'},morpho:{name:'モルフォチョウ',observation:'<b>青い翅</b>の観察文'}};
function setup(entries=[],species={...definitions}) {
  const doc={activeElement:null,createElement(tag){return new Node(tag,this);}};
  doc.body=new Node('body',doc);globalThis.document=doc;
  const rows=entries.map(row=>({...row}));let saves=0,closes=0;
  const journal={get entries(){return rows.map(row=>({...row}));},saved:true,setNote(id,value){const row=rows.find(row=>row.species===id);if(!row)return null;row.note=value;saves++;return {...row};}};
  const ui=createJournalUI({journal,species,onClose(){closes++;}});
  return {ui,doc,rows,species,get saves(){return saves;},get closes(){return closes;}};
}

test('native title selector is meadow-first, labelled and start-gated without new HUD controls',async()=>{
  const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
  const title=html.slice(html.indexOf('id="start-screen"'),html.indexOf('id="hud"'));
  assert.match(title,/<label for="habitat-select">散策する再現区画<\/label>/);
  assert.match(title,/<option value="meadow" selected>温帯の草地・林縁<\/option>/);
  assert.match(title,/<option value="tropical">中米熱帯林の再現区画<\/option>/);
  assert.equal((html.match(/id="habitat-select"/g)||[]).length,1);
  assert.ok(title.indexOf('id="habitat-select"')<title.indexOf('id="start-button"'));
  assert.doesNotMatch(title, /onchange=|oninput=|35° N/);
  assert.match(html, /id="look-resume-hint"/);
  assert.match(html, /右クリック保持/);
  const css=await readFile(new URL('../style.css',import.meta.url),'utf8');
  assert.match(css,/\.habitat-choice select:focus-visible/);
  assert.match(css,/\.habitat-choice select\{font-size:16px\}/);
});

test('four supplied species create four cards without revealing an undiscovered morpho',()=>{
  const f=setup([{species:'butterfly',location:'草地',note:'前の記録'}]);f.ui.open();
  assert.equal(find(f.ui.element,'fj-card').length,4);
  assert.equal(find(f.ui.element,'fj-unseen').length,3);
  const text=all(f.ui.element).filter(n=>n.tag!=='style').map(n=>n.textContent).join('');
  assert.doesNotMatch(text,/モルフォ|青い翅/);
  assert.equal(f.rows[0].note,'前の記録');assert.equal(f.saves,0);
});

test('morpho uses the same plain-text observation/location and optional autosaving memo as old entries',()=>{
  const rows=['butterfly','dragonfly','cicada'].map(species=>({species,location:'以前の場所',note:species+'の旧メモ'}));
  rows.push({species:'morpho',location:'<img src=x> 林内の光だまり',note:''});
  const f=setup(rows);f.ui.open('morpho');
  const cards=find(f.ui.element,'fj-card'),morpho=cards[3],editor=find(morpho,'fj-note')[0];
  assert.equal(find(morpho,'fj-observation')[0].textContent,definitions.morpho.observation);
  assert.equal(find(morpho,'fj-observation')[0].children.length,0);
  assert.equal(find(morpho,'fj-place')[0].textContent,rows[3].location);
  assert.equal(f.doc.activeElement,editor);assert.equal(editor.maxLength,500);
  editor.value='j';editor.emit('input');
  f.ui.element.emit('keydown',{key:'j',code:'KeyJ',preventDefault(){throw Error('UI must not capture memo j');}});
  assert.equal(f.rows[3].note,'j');assert.equal(f.ui.element.hidden,false);assert.equal(f.closes,0);
  assert.deepEqual(f.rows.slice(0,3),rows.slice(0,3));
  editor.value='あ'.repeat(501);editor.emit('input');assert.equal(f.rows[3].note.length,500);
  editor.setSelectionRange(1,2);f.ui.refresh();
  const next=find(find(f.ui.element,'fj-card')[3],'fj-note')[0];
  assert.equal(f.doc.activeElement,next);assert.deepEqual([next.selectionStart,next.selectionEnd],[1,2]);
  let prevented=0;f.ui.element.emit('keydown',{key:'Tab',shiftKey:false,preventDefault(){prevented++;}});
  assert.equal(f.doc.activeElement,find(f.ui.element,'fj-close')[0]);assert.equal(prevented,1);
});

test('empty species keeps legacy three and dynamic own keys determine later card count',()=>{
  const legacy=setup([],{});legacy.ui.open();assert.equal(find(legacy.ui.element,'fj-card').length,3);
  const inherited=Object.create({hiddenSpecies:{name:'not a card'}});inherited.morpho=definitions.morpho;
  const single=setup([],inherited);single.ui.open();assert.equal(find(single.ui.element,'fj-card').length,1);
  single.species.butterfly=definitions.butterfly;single.ui.refresh();assert.equal(find(single.ui.element,'fj-card').length,2);
});
