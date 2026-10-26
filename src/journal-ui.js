import { NOTE_LIMIT } from './journal.js?v=0.21.0&b=80addd8ed820';

const LEGACY_SPECIES_IDS = ['butterfly', 'dragonfly', 'cicada'];
let instance = 0;
const STYLE = `
.field-journal{position:fixed;inset:0;z-index:30;display:grid;place-items:center;padding:28px;pointer-events:auto;background:rgba(28,43,30,.45);backdrop-filter:blur(8px);color:var(--ink,#263c2d);font-family:var(--sans,'Yu Gothic',Meiryo,sans-serif)}
.field-journal[hidden]{display:none!important}
.field-journal *{box-sizing:border-box}
.field-journal .fj-sheet{width:min(1080px,100%);max-height:calc(100dvh - 56px);overflow:auto;overscroll-behavior:contain;background:var(--paper,#f6f3e7);box-shadow:0 20px 80px #172c2330;padding:0 34px 28px}
.field-journal .fj-header{position:sticky;top:0;z-index:1;display:flex;justify-content:space-between;align-items:center;gap:20px;background:var(--paper,#f6f3e7);padding:27px 0 21px;border-bottom:1px solid var(--line,#c9cdbd)}
.field-journal .fj-eyebrow{margin:0 0 7px;color:#707b60;font-size:10px;letter-spacing:.16em;line-height:1.6}
.field-journal h2{font-family:var(--serif,'Yu Mincho',serif);font-weight:400;font-size:32px;letter-spacing:.12em;line-height:1.5;margin:0}
.field-journal .fj-close{flex:none;background:transparent;color:var(--ink,#263c2d);border:1px solid #aeb69c;padding:12px 16px;font-size:14px;line-height:1.5;cursor:pointer}
.field-journal .fj-close:hover{background:#e7ebdc}
.field-journal .fj-intro{margin:22px 0 7px;font-size:17px;line-height:1.9;letter-spacing:.03em}
.field-journal .fj-subtitle{margin:0 0 25px;font-size:14px;line-height:1.9;color:#657157}
.field-journal .fj-cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;align-items:stretch}
.field-journal .fj-card{min-width:0;padding:23px 21px;background:#fbfaf4;border:1px solid #dce0d0}
.field-journal .fj-card h3{margin:0 0 20px;font-family:var(--serif,'Yu Mincho',serif);font-size:23px;font-weight:400;line-height:1.65;letter-spacing:.035em;overflow-wrap:anywhere}
.field-journal .fj-observation{margin:0 0 23px;font-size:17px;line-height:1.9;overflow-wrap:anywhere;white-space:pre-wrap}
.field-journal .fj-place-label{margin:0 0 4px;font-size:12px;line-height:1.8;letter-spacing:.08em;color:#758167}
.field-journal .fj-place{margin:0 0 23px;font-size:17px;line-height:1.9;overflow-wrap:anywhere;white-space:pre-wrap}
.field-journal .fj-note-label{display:block;margin:0 0 9px;font-size:14px;line-height:1.8;letter-spacing:.04em}
.field-journal .fj-note{display:block;width:100%;min-height:150px;resize:vertical;padding:12px;border:1px solid #b4bda5;border-radius:0;background:#fffef8;color:#263c2d;font:17px/1.9 var(--sans,'Yu Gothic',Meiryo,sans-serif)}
.field-journal .fj-note::placeholder{color:#858b78;font-size:14px}
.field-journal .fj-note-help{margin:8px 0 0;font-size:12px;line-height:1.8;color:#7b826c}
.field-journal .fj-unseen{background:transparent;border:1px dashed #bdc6ae;display:flex;flex-direction:column;justify-content:center;min-height:275px}
.field-journal .fj-unseen h3{font-size:19px;color:#637355;margin:0 0 14px}
.field-journal .fj-unseen p{font-size:14px;line-height:1.9;color:#788269;margin:0}
.field-journal .fj-status{font-size:14px;line-height:1.9;color:#637355;min-height:27px;margin:20px 0 0;overflow-wrap:anywhere}
.field-journal .fj-status[data-unsaved="true"]{color:#78613a}
.field-journal button:focus-visible,.field-journal textarea:focus-visible{outline:3px solid #b8a450;outline-offset:4px}
@media(max-width:850px){.field-journal .fj-cards{grid-template-columns:1fr}.field-journal .fj-card{padding:22px}.field-journal .fj-unseen{min-height:140px}.field-journal .fj-note{min-height:130px}.field-journal .fj-sheet{width:min(640px,100%)}}
@media(max-width:600px){.field-journal{padding:12px}.field-journal .fj-sheet{max-height:calc(100dvh - 24px);padding:0 18px 22px}.field-journal .fj-header{padding:19px 0 16px;gap:10px}.field-journal h2{font-size:27px}.field-journal .fj-eyebrow{font-size:8px}.field-journal .fj-close{padding:11px 12px;font-size:13px}.field-journal .fj-intro,.field-journal .fj-place,.field-journal .fj-observation{font-size:14px;line-height:1.9}.field-journal .fj-subtitle,.field-journal .fj-status{font-size:13px}.field-journal .fj-card{padding:20px 17px}.field-journal .fj-card h3{font-size:23px}.field-journal .fj-note{font-size:16px;line-height:1.9}.field-journal .fj-unseen h3{font-size:18px}}
@media(prefers-reduced-motion:reduce){.field-journal *{scroll-behavior:auto!important;transition:none!important;animation:none!important}}
`;

/**
 * createJournalUI({ journal, species, onClose }) -> { open, close, refresh, element }
 * journal is createJournal() from journal.js; species is the SPECIES keyed object.
 * Cards follow its own keys in order; an empty object retains the legacy three.
 * Reading/rendering cards never deletes earlier journal records.
 * Creation is DOM-free. First open() appends the modal and scoped CSS to body.
 * element is a getter returning null until the first open.
 * open(optionalSpeciesId) refreshes and focuses that encountered memo if given,
 * otherwise the close button. close() only hides;
 * it never focuses/locks the game canvas. The close button hides then invokes
 * onClose(), so the caller owns pause state and any pointer-lock recovery.
 * Escape/J hotkeys, game input gating, inert background, and capture recording
 * remain with the caller. Tab stays within this visible modal. No global hooks.
 * refresh() updates entries/status, preserving a focused memo's selection.
 * Input autosaves plain text, bounded to NOTE_LIMIT, with no required submission.
 * Optional journal.pending/subscribe report asynchronous persistence. Notifications
 * only update status, never replace an editor or interrupt its selection/composition.
 * Subscription exists only while open; closing releases it and reopening reads state.
 */
export function createJournalUI({ journal, species = {}, onClose } = {}) {
  if (!journal || typeof journal.setNote !== 'function') {
    throw new TypeError('createJournalUI requires a journal instance');
  }
  let mounted = null;
  return {
    open(speciesId) {
      if (!mounted) mounted = mountJournalUI({ journal, species, onClose });
      mounted.open(speciesId);
    },
    close() { mounted?.close(); },
    refresh() { mounted?.refresh(); },
    get element() { return mounted?.element ?? null; }
  };
}

function mountJournalUI({ journal, species, onClose }) {
  const prefix = `field-journal-${++instance}`;
  const make = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const element = make('section', 'field-journal');
  element.hidden = true;
  element.setAttribute('role', 'dialog');
  element.setAttribute('aria-modal', 'true');
  element.setAttribute('aria-labelledby', `${prefix}-title`);
  element.setAttribute('aria-describedby', `${prefix}-intro`);
  const style = make('style', '', STYLE);
  const sheet = make('div', 'fj-sheet');
  const header = make('header', 'fj-header');
  const headingBlock = make('div');
  const title = make('h2', '', '出会いの図鑑');
  title.id = `${prefix}-title`;
  headingBlock.append(make('p', 'fj-eyebrow', '図鑑'), title);
  const closeButton = make('button', 'fj-close', '閉じる');
  closeButton.type = 'button';
  header.append(headingBlock, closeButton);
  const intro = make('p', 'fj-intro', '捕まえた虫の記録');
  intro.id = `${prefix}-intro`;
  const subtitle = make('p', 'fj-subtitle', '捕まえると登録。場所は自動、メモは任意。');
  const cards = make('div', 'fj-cards');
  const status = make('p', 'fj-status');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.setAttribute('aria-atomic', 'true');
  sheet.append(header, intro, subtitle, status, cards);
  element.append(style, sheet);
  document.body.append(element);
  let editors = [];
  let unsubscribe = null;

  function updateStatus(failed = false) {
    const pending = !failed && journal.pending === true;
    const unsaved = failed || pending || journal.saved === false;
    status.dataset.unsaved = String(unsaved);
    status.dataset.pending = String(pending);
    const message = pending
      ? 'このブラウザに保存中です。ページを閉じると、未保存の記録が失われることがあります。'
      : unsaved
        ? '今はこのブラウザに保存できません。今回の未保存の変更は、このページを閉じると失われます。'
        : '自動保存';
    if (status.textContent !== message) status.textContent = message;
  }

  function refresh() {
    const focused = editors.find(({ input }) => input === document.activeElement);
    const selection = focused ? [focused.input.selectionStart, focused.input.selectionEnd] : null;
    const entries = new Map(journal.entries.map(entry => [entry.species, entry]));
    editors = [];
    cards.replaceChildren();
    const speciesIds = Object.keys(species);
    for (const id of speciesIds.length ? speciesIds : LEGACY_SPECIES_IDS) {
      const entry = entries.get(id);
      const card = make('article', entry ? 'fj-card' : 'fj-card fj-unseen');
      if (!entry) {
        // Do not disclose a name, image, location, checklist number, or target.
        card.append(make('h3', '', '未登録'), make('p', '', 'いつか、どこかで。'));
      } else {
        const name = typeof species[id]?.name === 'string' ? species[id].name : '野原で出会った虫';
        card.append(make('h3', '', name));
        const observation = species[id]?.observation;
        if (typeof observation === 'string' && observation) {
          card.append(make('p', 'fj-observation', observation));
        }
        card.append(make('p', 'fj-place-label', 'さいごに出会った場所'), make('p', 'fj-place', entry.location || '出会った場所'));
        const label = make('label', 'fj-note-label', 'ひと言メモ（任意）');
        const input = make('textarea', 'fj-note');
        input.id = `${prefix}-${id}-note`;
        input.maxLength = NOTE_LIMIT;
        input.rows = 4;
        input.value = entry.note;
        input.placeholder = '色や動き、気づいたことなど';
        input.setAttribute('aria-label', `${name}のひと言メモ（任意）`);
        label.htmlFor = input.id;
        const help = make('p', 'fj-note-help', `${NOTE_LIMIT}文字まで・自動保存（保存状況は上に表示）`);
        help.id = `${prefix}-${id}-help`;
        input.setAttribute('aria-describedby', help.id);
        input.addEventListener('input', () => {
          // Also enforce the limit for scripted input and unusual paste clients.
          const value = input.value.slice(0, NOTE_LIMIT);
          if (input.value !== value) input.value = value;
          try { updateStatus(!journal.setNote(id, value)); }
          catch { updateStatus(true); }
        });
        editors.push({ id, input });
        card.append(label, input, help);
      }
      cards.append(card);
    }
    updateStatus();
    if (focused && !element.hidden) {
      const replacement = editors.find(item => item.id === focused.id)?.input;
      if (replacement) {
        replacement.focus({ preventScroll: true });
        replacement.setSelectionRange(...selection);
      }
    }
  }

  function open(speciesId) {
    refresh();
    element.hidden = false;
    if (!unsubscribe && typeof journal.subscribe === 'function') {
      unsubscribe = journal.subscribe(() => {
        // A late notification after close is harmless; do not rebuild cards here.
        if (!element.hidden) updateStatus();
      });
    }
    const focusTarget = editors.find(item => item.id === speciesId)?.input || closeButton;
    focusTarget.focus({ preventScroll: true });
  }
  function close() {
    element.hidden = true;
    const release = unsubscribe;
    unsubscribe = null;
    release?.();
  }
  closeButton.addEventListener('click', () => { close(); onClose?.(); });
  element.addEventListener('keydown', event => {
    if (element.hidden || event.key !== 'Tab') return;
    const focusable = [closeButton, ...editors.map(item => item.input)];
    const first = focusable[0], last = focusable[focusable.length - 1];
    const current = document.activeElement;
    if (event.shiftKey && (current === first || !focusable.includes(current))) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && (current === last || !focusable.includes(current))) {
      event.preventDefault(); first.focus();
    }
  });
  return { open, close, refresh, element };
}
