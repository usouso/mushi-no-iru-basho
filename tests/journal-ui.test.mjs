import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createJournal } from '../src/journal.js';
import { createJournalUI } from '../src/journal-ui.js';

// Focused DOM double: checks behavior/safe text sinks, not browser rendering.
class Element {
  constructor(tag, doc) { this.tagName = tag; this.doc = doc; this.children = []; this.attributes = {}; this.listeners = {}; this.dataset = {}; this.textContent = ''; this.value = ''; this.selectionStart = 0; this.selectionEnd = 0; }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = nodes; }
  setAttribute(key, value) { this.attributes[key] = value; }
  addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }
  emit(type, event = {}) { for (const listener of this.listeners[type] || []) listener(event); }
  focus() { this.doc.activeElement = this; }
  setSelectionRange(start, end) { this.selectionStart = start; this.selectionEnd = end; }
  set innerHTML(_) { throw Error('HTML injection sink must not be used'); }
}
function descendants(node) { return [node, ...node.children.flatMap(descendants)]; }
function find(root, cls) { return descendants(root).filter(node => node.className?.split(' ').includes(cls)); }
function fixture({ blocked = false } = {}) {
  const doc = { activeElement: null, createElement(tag) { return new Element(tag, this); } };
  doc.body = new Element('body', doc);
  globalThis.document = doc;
  const data = new Map();
  const storage = { getItem: key => data.get(key) ?? null, setItem(key, value) { if (blocked) throw Error('quota'); data.set(key, value); } };
  const locks = { request: async (_name, _options, callback) => callback() };
  const journal = createJournal(storage, { now: () => 100, locks });
  let closes = 0;
  const species = { butterfly: { name: 'モンシロチョウ', observation: '<img src=x onerror=alert(1)> 白い翅の先に黒い模様。' }, dragonfly: { name: 'アキアカネ' }, cicada: { name: 'アブラゼミ' } };
  const ui = createJournalUI({ journal, species, onClose: () => closes++ });
  return { doc, journal, ui, setBlocked(value) { blocked = value; }, get closes() { return closes; } };
}

test('initially hidden; open shows three unspoiled optional encounter cards and focuses close', () => {
  const { doc, ui } = fixture();
  assert.equal(ui.element, null);
  assert.equal(doc.body.children.length, 0);
  ui.open();
  assert.equal(ui.element.attributes.role, 'dialog');
  assert.equal(ui.element.attributes['aria-modal'], 'true');
  assert.equal(ui.element.hidden, false);
  assert.equal(find(ui.element, 'fj-unseen').length, 3);
  assert.equal(find(ui.element, 'fj-note').length, 0);
  const copy = descendants(ui.element).filter(n => n.tagName !== 'style').map(n => n.textContent).join(' ');
  assert.doesNotMatch(copy, /モンシロチョウ|アキアカネ|アブラゼミ|コンプリート|達成/);
  assert.equal(doc.activeElement, find(ui.element, 'fj-close')[0]);
  assert.equal(find(ui.element, 'fj-close')[0].textContent, '閉じる');
});

test('encounter name, latest location and note use safe text/value; input autosaves with 500 limit', () => {
  const { ui, journal } = fixture();
  const injection = '<img src=x onerror=alert(1)>';
  journal.record({ species: 'butterfly', location: '最初の場所' });
  journal.record({ species: 'butterfly', location: injection });
  journal.setNote('butterfly', injection);
  ui.open();
  assert.equal(find(ui.element, 'fj-place')[0].textContent, injection);
  assert.equal(find(ui.element, 'fj-observation')[0].textContent, injection + ' 白い翅の先に黒い模様。');
  assert.equal(find(ui.element, 'fj-observation')[0].children.length, 0, 'description stays plain text');
  const input = find(ui.element, 'fj-note')[0];
  assert.equal(input.value, injection);
  assert.equal(input.maxLength, 500);
  input.value = 'あ'.repeat(501); input.emit('input');
  assert.equal(journal.entries[0].note.length, 500);
  assert.equal(input.value.length, 500);
  assert.equal(find(ui.element, 'fj-unseen').length, 2);
});

test('save failure gives gentle status while retaining the note in this page', async () => {
  const { ui, journal } = fixture({ blocked: true });
  journal.record({ species: 'cicada', location: '木のそば' });
  ui.open();
  const input = find(ui.element, 'fj-note')[0];
  input.value = '木肌に似ていた'; input.emit('input');
  await journal.flush();
  const status = find(ui.element, 'fj-status')[0];
  assert.equal(status.dataset.unsaved, 'true');
  assert.match(status.textContent, /今回の未保存の変更は、このページを閉じると失われます/);
  assert.equal(journal.entries[0].note, '木肌に似ていた');
});

test('Tab wraps; refresh preserves memo focus and selection; close button hides then notifies', () => {
  const f = fixture();
  f.journal.record({ species: 'dragonfly', location: '池' });
  f.journal.setNote('dragonfly', '赤い腹');
  f.ui.open();
  const close = find(f.ui.element, 'fj-close')[0];
  let prevented = 0;
  f.ui.element.emit('keydown', { key: 'Tab', shiftKey: true, preventDefault() { prevented++; } });
  let editor = find(f.ui.element, 'fj-note')[0];
  assert.equal(f.doc.activeElement, editor);
  editor.setSelectionRange(1, 2);
  f.ui.refresh(); editor = find(f.ui.element, 'fj-note')[0];
  assert.equal(f.doc.activeElement, editor);
  assert.deepEqual([editor.selectionStart, editor.selectionEnd], [1, 2]);
  f.ui.element.emit('keydown', { key: 'Tab', shiftKey: false, preventDefault() { prevented++; } });
  assert.equal(f.doc.activeElement, close);
  assert.equal(prevented, 2);
  close.emit('click');
  assert.equal(f.closes, 1);
  assert.equal(f.ui.element.hidden, true);
  assert.equal(f.doc.activeElement, close, 'no canvas focus or pointer lock side effect');
  f.ui.close(); assert.equal(f.closes, 1, 'API close does not recursively notify');
});

test('styles are scoped, readable and scrollable; module has no network/HTML or input-global hooks', async () => {
  const source = await readFile(new URL('../src/journal-ui.js', import.meta.url), 'utf8');
  assert.match(source, /max-height:calc\(100dvh - 56px\);overflow:auto/);
  assert.match(source, /font:17px\/1\.9/);
  assert.match(source, /font-size:16px;line-height:1\.9/);
  assert.match(source, /\.field-journal\[hidden\]\{display:none!important\}/);
  assert.doesNotMatch(source, /innerHTML|fetch\(|XMLHttpRequest|requestPointerLock|document\.addEventListener|window\.addEventListener/);
});


test('creation, refresh and close need no DOM; first open mounts once and optional species focuses memo', () => {
  delete globalThis.document;
  const data = new Map();
  const journal = createJournal({ getItem: key => data.get(key) ?? null, setItem(key, value) { data.set(key, value); } }, { locks: { request: async (_name, _options, callback) => callback() } });
  const ui = createJournalUI({ journal });
  assert.equal(ui.element, null);
  ui.refresh(); ui.close();
  assert.equal(ui.element, null);
  const f = fixture(); // Provides a document but its UI is not mounted either.
  journal.record({ species: 'cicada', location: '木' });
  ui.open('cicada');
  assert.equal(f.doc.activeElement, find(ui.element, 'fj-note')[0]);
  const element = ui.element;
  ui.close(); ui.open();
  assert.equal(ui.element, element);
  assert.equal(f.doc.body.children.length, 1);
  assert.equal(f.doc.activeElement, find(ui.element, 'fj-close')[0]);
});


test('async persistence changes only status; preserves composing editor and releases subscriptions', async () => {
  const f = fixture();
  let subscribers = 0, subscriptions = 0, lateNotification;
  const subscribe = f.journal.subscribe.bind(f.journal);
  f.journal.subscribe = listener => {
    subscribers++; subscriptions++; lateNotification = listener;
    const release = subscribe(listener);
    return () => { subscribers--; release(); };
  };
  f.journal.record({ species: 'cicada', location: '木陰' });
  await f.journal.flush();
  f.ui.refresh(); f.ui.close();
  assert.equal(subscribers, 0, 'unmounted UI has no subscription');
  f.ui.open('cicada');
  assert.equal(subscribers, 1);
  const input = find(f.ui.element, 'fj-note')[0];
  const cards = find(f.ui.element, 'fj-cards')[0];
  const card = cards.children.find(node => descendants(node).includes(input));
  const status = find(f.ui.element, 'fj-status')[0];
  input.value = 'へんかん中のメモ';
  input.setSelectionRange(2, 5);
  input.emit('compositionstart');
  input.emit('input', { isComposing: true });
  assert.equal(status.dataset.pending, 'true');
  assert.match(status.textContent, /保存中/);
  const assertEditorUnchanged = () => {
    assert.equal(find(f.ui.element, 'fj-note')[0], input);
    assert.ok(cards.children.includes(card));
    assert.equal(f.doc.activeElement, input);
    assert.deepEqual([input.selectionStart, input.selectionEnd], [2, 5]);
    assert.equal(input.value, 'へんかん中のメモ');
  };
  assertEditorUnchanged();
  await f.journal.flush();
  assert.equal(status.dataset.pending, 'false');
  assert.equal(status.dataset.unsaved, 'false');
  assertEditorUnchanged();

  f.setBlocked(true);
  input.emit('input', { isComposing: true });
  await f.journal.flush();
  assert.equal(status.dataset.unsaved, 'true');
  assert.match(status.textContent, /今回の未保存の変更は、このページを閉じると失われます/);
  assertEditorUnchanged();
  f.setBlocked(false);
  input.emit('input', { isComposing: true });
  await f.journal.flush();
  assert.equal(status.dataset.unsaved, 'false');
  assertEditorUnchanged();
  input.emit('compositionend');

  f.ui.close();
  assert.equal(subscribers, 0);
  const closedStatus = status.textContent;
  f.setBlocked(true);
  f.journal.setNote('cicada', '閉じた後の変更');
  await f.journal.flush();
  lateNotification({ saved: false, pending: false });
  assert.equal(status.textContent, closedStatus, 'late callbacks do not touch hidden UI');
  assert.equal(find(f.ui.element, 'fj-note')[0], input);
  f.ui.close();
  assert.equal(subscribers, 0, 'repeated close does not release twice');
  f.ui.open();
  assert.equal(subscribers, 1);
  assert.equal(subscriptions, 2);
  assert.match(status.textContent, /今回の未保存の変更は、このページを閉じると失われます/);
  f.ui.refresh(); f.ui.open();
  assert.equal(subscribers, 1);
  assert.equal(subscriptions, 2, 'refresh/repeated open do not add listeners');
  f.ui.close();
  assert.equal(subscribers, 0);
});
