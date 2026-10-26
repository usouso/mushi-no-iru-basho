import {createTestLocks} from './fixtures/journal-locks.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createJournal, JOURNAL_KEY, JOURNAL_VERSION, NOTE_LIMIT } from '../src/journal.js';

const oldEntries = ['butterfly', 'dragonfly', 'cicada'].map((species, index) => ({
  species, firstSeen: 100 + index, lastSeen: 200 + index,
  location: ['草花の野原', '池のほとり', '林縁'][index],
  x: index * 10, z: -5 - index * 5, note: `${species}の観察メモ`
}));
const morphoCapture = { species: 'morpho', location: '熱帯の林', x: 12, z: -6 };

function fixture(entries = oldEntries) {
  const legacyRaw=JSON.stringify({version:1,entries}),values=new Map([['mushi-journal-v1',legacyRaw]]);let writes=0;
  const f={locks:createTestLocks(),failWrite:false,time:1000,values,legacyRaw,
    storage:{getItem:key=>values.get(key)??null,setItem(key,value){assert.equal(key,'mushi-journal-v2');if(f.failWrite)throw Error('quota');values.set(key,value);writes++;}},
    now:()=>f.time,get raw(){return values.get('mushi-journal-v2')??values.get('mushi-journal-v1');},get writes(){return writes;}};
  return f;
}

test('v1 three-species journal survives load and addition of the fourth species', async () => {
  const f = fixture(), original = f.raw;
  const journal = createJournal(f.storage, f);
  assert.equal(JOURNAL_KEY, 'mushi-journal-v2');
  assert.equal(JOURNAL_VERSION, 2);
  assert.deepEqual(journal.entries, oldEntries);
  assert.equal(journal.saved, false);assert.equal(journal.pending,true);
  assert.equal(f.writes,0,'migration is queued, not a synchronous startup write');
  assert.equal(f.raw, original);

  const morpho = journal.record(morphoCapture);
  assert.deepEqual(morpho, { ...morphoCapture, firstSeen: 1000, lastSeen: 1000, note: '' });
  assert.equal(journal.entries.length, 4);
  assert.deepEqual(journal.entries.slice(0, 3), oldEntries);
  await journal.flush();
  assert.deepEqual(JSON.parse(f.raw), { version: 2, legacyImportDone:true, entries: journal.entries });
  assert.equal(f.values.get('mushi-journal-v1'),f.legacyRaw);
  const beforeReloadWrites=f.writes;
  const restored = createJournal(f.storage, f);
  assert.equal(restored.saved, true);
  assert.deepEqual(restored.entries, journal.entries);
  assert.equal(f.writes,beforeReloadWrites,'reloading valid v2 does not write');
});

test('unknown, duplicate and malformed records cannot replace the fourth valid species', async () => {
  const morpho = { ...morphoCapture, firstSeen: 300, lastSeen: 400, note: '青い翅' };
  const f = fixture([null, { ...morpho, species: 'ant' }, ...oldEntries,
    { ...morpho, firstSeen: 500 }, { ...morpho, lastSeen: '400' },
    morpho, { ...morpho, note: 'duplicate' }, { ...morpho, species: '__proto__' }]);
  const raw = f.raw, journal = createJournal(f.storage, f);
  assert.deepEqual(journal.entries, [...oldEntries, morpho]);
  assert.equal(journal.saved, false, 'filtered payload is not silently rewritten');
  assert.equal(f.writes, 0);
  assert.equal(f.raw, raw);
  for (const species of ['ant', '__proto__', 'constructor', 'Morpho']) {
    assert.equal(journal.record({ ...morphoCapture, species }), null);
    assert.equal(journal.setNote(species, 'unknown'), null);
  }
  assert.equal(f.writes, 0);
  journal.setNote('morpho', '青い翅');
  assert.deepEqual(createJournal(f.storage).entries, [...oldEntries, morpho]);
});

test('morpho memo is optional, literal text and bounded to the unchanged 500 characters', async () => {
  const f = fixture(), journal = createJournal(f.storage, f);
  assert.equal(journal.setNote('morpho', 'not yet encountered'), null);
  assert.equal(journal.record(morphoCapture).note, '');
  const literal = '<script>青い翅</script> & <img src=x onerror=alert(1)>\n木陰';
  assert.equal(journal.setNote('morpho', literal).note, literal);
  await journal.flush();
  assert.equal(createJournal(f.storage).entries[3].note, literal);
  assert.equal(NOTE_LIMIT, 500);
  assert.equal(journal.setNote('morpho', '青'.repeat(650)).note, '青'.repeat(500));
  assert.equal(journal.setNote('morpho', '').note, '');
  assert.deepEqual(journal.entries.slice(0, 3), oldEntries);
});

test('four-species quota failure retains memory edits and recovers without losing old notes', async () => {
  const f = fixture(), journal = createJournal(f.storage, f), oldRaw = f.raw;
  f.failWrite = true;
  journal.record(morphoCapture);
  journal.setNote('morpho', '木陰で翅が光った');
  assert.equal(journal.saved, false);
  assert.equal(journal.entries.length, 4);
  assert.equal(journal.entries[3].note, '木陰で翅が光った');
  assert.equal(f.raw, oldRaw);
  assert.equal(f.writes, 0);
  await journal.flush();
  f.failWrite = false;
  f.time = 900;
  journal.record({ ...morphoCapture, location: '熱帯の林縁' });
  await journal.flush();
  assert.equal(journal.saved, true);
  assert.equal(journal.entries[3].firstSeen, 1000);
  assert.equal(journal.entries[3].lastSeen, 1000, 'backward clock must not corrupt chronology');
  assert.equal(journal.entries[3].note, '木陰で翅が光った');
  assert.equal(journal.entries[3].location, '熱帯の林縁');
  assert.deepEqual(journal.entries.slice(0, 3), oldEntries);
  assert.deepEqual(createJournal(f.storage).entries, journal.entries);
});
