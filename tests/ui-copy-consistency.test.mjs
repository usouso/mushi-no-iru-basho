/** Static copy and focused DOM-double checks; not visual/accessibility certification. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createJournalUI} from '../src/journal-ui.js';
const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
class Node{
 constructor(tag,doc){Object.assign(this,{tag,doc,children:[],attributes:{},listeners:{},dataset:{},textContent:'',value:''});}
 append(...nodes){this.children.push(...nodes);}replaceChildren(...nodes){this.children=nodes;}
 setAttribute(k,v){this.attributes[k]=v;}addEventListener(k,fn){this.listeners[k]=fn;}
 focus(){this.doc.activeElement=this;}setSelectionRange(a,b){this.selectionStart=a;this.selectionEnd=b;}
 set innerHTML(_){throw Error('Unsafe HTML sink');}
}
const all=n=>[n,...n.children.flatMap(all)],find=(n,c)=>all(n).find(e=>e.className?.split(' ').includes(c));
function fixture(t){
 const before=globalThis.document,doc={createElement(tag){return new Node(tag,this);}};doc.body=new Node('body',doc);globalThis.document=doc;t.after(()=>{if(before===undefined)delete globalThis.document;else globalThis.document=before;});
 let listener,saves=0;const journal={entries:[{species:'known',note:'以前のメモ',location:''}],saved:true,pending:false,setNote(id,note){saves++;this.entries[0].note=note;return {...this.entries[0]};},subscribe(fn){listener=fn;return()=>{listener=null;};}};
 const species=Object.fromEntries(Array.from({length:20},(_,i)=>[i?'hidden-'+i:'known',{name:i?'秘密の名前'+i:'出会った虫',observation:i?'秘密の場所':''}]));
 const ui=createJournalUI({journal,species});ui.open('known');return{doc,ui,journal,notify(){listener?.();},get saves(){return saves;}};
}
test('title distinguishes unconditional Space net from pointer-lock-dependent left click with compact HUD guidance and optional full instructions',()=>{
 assert.match(html,/<dt>Space<\/dt><dd>網をふる<\/dd>/);
 assert.match(html,/左クリック：見回し中は網 · 停止中は見回し再開。/);
 assert.doesNotMatch(html,/<dt>左クリック \/ Space<\/dt>/);
 assert.match(html,/id="controls-hint"[^>]*>WASD 移動 · Shift 走る · 右クリック そっと · Space 網<\/p>/);assert.match(html,/見回し停止中 · 左クリックで見回し再開/);
 assert.equal((html.match(/class="gamepad-help"/g)||[]).length,1);
});
test('five habitat choices and twenty cards retain names hidden without summer or grassland-only generic copy',t=>{
 assert.deepEqual([...html.matchAll(/<option value="([^"]+)"/g)].map(m=>m[1]),['meadow','tropical','understory','night','savanna']);
 assert.doesNotMatch(html,/夏の野原|夏の観察手帖|SUMMER 01/);assert.match(html,/aria-label="各生息地をマウスで見回し/);
 const {ui}=fixture(t),nodes=all(ui.element),text=nodes.filter(n=>n.tag!=='style').map(n=>n.textContent).join(' ');
 assert.equal(nodes.filter(n=>n.className?.split(' ').includes('fj-card')).length,20);
 assert.equal(nodes.filter(n=>n.textContent==='いつか、どこかで。').length,19);assert.equal(nodes.filter(n=>n.textContent==='未登録').length,19);
 assert.doesNotMatch(text,/秘密の名前|秘密の場所|夏の野原|SUMMER 01/);assert.equal(find(ui.element,'fj-place').textContent,'出会った場所');assert.match(text,/捕まえると登録/);assert.ok(find(ui.element,'fj-sheet').children.indexOf(find(ui.element,'fj-status'))<find(ui.element,'fj-sheet').children.indexOf(find(ui.element,'fj-cards')));ui.close();
});
test('memo still attempts saving; pending/failure/success copy distinguishes unsaved changes without replacing editor',t=>{
 const f=fixture(t),editor=find(f.ui.element,'fj-note'),status=find(f.ui.element,'fj-status');editor.setSelectionRange(1,3);
 assert.match(html,/id="inspect-journal-button"[^>]*>図鑑・メモ<\/button>/);assert.match(find(f.ui.element,'fj-note-label').textContent,/メモ（任意）/);assert.doesNotMatch(html,/図鑑に記録済み/);
 assert.equal(find(f.ui.element,'fj-note-help').textContent,'500文字まで・自動保存（保存状況は上に表示）');
 editor.value='変更したメモ';editor.listeners.input();assert.equal(f.saves,1);assert.equal(f.journal.entries[0].note,editor.value);
 f.journal.saved=false;f.journal.pending=true;f.notify();assert.match(status.textContent,/保存中/);
 f.journal.pending=false;f.notify();assert.equal(status.dataset.unsaved,'true');assert.match(status.textContent,/今回の未保存の変更は、このページを閉じると失われます/);assert.doesNotMatch(status.textContent,/記録はこのページを開いている間だけ/);
 f.journal.saved=true;f.notify();assert.equal(status.dataset.unsaved,'false');assert.equal(status.textContent,'自動保存');
 assert.equal(find(f.ui.element,'fj-note'),editor);assert.equal(f.doc.activeElement,editor);assert.equal(editor.selectionStart,1);assert.equal(editor.selectionEnd,3);f.ui.close();
});
