import {createTestLocks} from './fixtures/journal-locks.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createJournal, JOURNAL_KEY, JOURNAL_VERSION, NOTE_LIMIT } from '../src/journal.js';

const oldEntries = ['butterfly', 'dragonfly', 'cicada', 'morpho', 'grasshopper'].map((species, i) => ({
  species, firstSeen: 100 + i, lastSeen: 200 + i,
  location: ['草花の野原', '池のほとり', '林縁', '熱帯の林', '草むら'][i],
  x: i * 10, z: -5 - i, note: `${species}の観察メモ`
}));
const capture = { species: 'hercules', location: '熱帯の木陰', x: -12, z: 6 };
function fixture(entries = oldEntries) {
  const legacyRaw=JSON.stringify({version:1,entries}),values=new Map([['mushi-journal-v1',legacyRaw]]);let writes=0;
  const f={locks:createTestLocks(),failWrite:false,time:1000,values,legacyRaw,
    storage:{getItem:key=>values.get(key)??null,setItem(key,value){assert.equal(key,'mushi-journal-v2');if(f.failWrite)throw Error('quota');values.set(key,value);writes++;}},
    now:()=>f.time,get raw(){return values.get('mushi-journal-v2')??values.get('mushi-journal-v1');},get writes(){return writes;}};
  return f;
}

test('v1 five-species journal queues lossless v2 migration and round-trips all six after hercules capture', async () => {
  const f = fixture(), original = f.raw, journal = createJournal(f.storage, f);
  assert.equal(JOURNAL_KEY, 'mushi-journal-v2');
  assert.equal(JOURNAL_VERSION, 2);
  assert.deepEqual(journal.entries, oldEntries);
  assert.equal(journal.saved, false);assert.equal(journal.pending,true);
  assert.equal(f.writes, 0);
  assert.equal(f.raw, original);
  assert.deepEqual(journal.record(capture), { ...capture, firstSeen: 1000, lastSeen: 1000, note: '' });
  journal.setNote('hercules', '木の幹にとまっていた');
  assert.deepEqual(journal.entries.slice(0, 5), oldEntries);
  assert.equal(journal.entries.length, 6);
  await journal.flush();
  assert.deepEqual(JSON.parse(f.raw), { version: 2, legacyImportDone:true, entries: journal.entries });
  assert.equal(f.values.get('mushi-journal-v1'),f.legacyRaw);
  const beforeReloadWrites=f.writes;
  const restored = createJournal(f.storage, f);
  assert.equal(restored.saved, true);
  assert.deepEqual(restored.entries, journal.entries);
  assert.equal(f.writes,beforeReloadWrites,'reloading valid v2 does not write');
});

test('invalid or unknown records cannot displace valid hercules or trigger a load-time write', async () => {
  const hercules = { ...capture, firstSeen: 300, lastSeen: 400, note: '長い角' };
  const f = fixture([null, { ...hercules, species: 'ant' }, { ...hercules, species: '__proto__' },
    ...oldEntries, { ...oldEntries[0], note: 'duplicate old species' },
    { ...hercules, firstSeen: 500 }, { ...hercules, lastSeen: '400' },
    hercules, { ...hercules, note: 'duplicate' }, { ...hercules, species: '__proto__' }]);
  const original = f.raw, journal = createJournal(f.storage, f);
  assert.deepEqual(journal.entries, [...oldEntries, hercules]);
  assert.equal(journal.saved, false);
  assert.equal(f.writes, 0);
  assert.equal(f.raw, original);
  for (const species of ['ant', '__proto__', 'constructor', 'Hercules', null]) {
    assert.equal(journal.record({ ...capture, species }), null);
    assert.equal(journal.setNote(species, 'unknown'), null);
  }
  assert.equal(f.writes, 0);
  journal.setNote('hercules', '長い角');
  assert.deepEqual(createJournal(f.storage).entries, [...oldEntries, hercules]);
});

test('hercules memo remains optional literal text with the existing 500-character limit', async () => {
  const f = fixture(), journal = createJournal(f.storage, f);
  assert.equal(journal.setNote('hercules', 'not encountered'), null);
  assert.equal(journal.record(capture).note, '');
  const literal = '<script>大きな角</script> & <img src=x onerror=alert(1)>\n草むら';
  assert.equal(journal.setNote('hercules', literal).note, literal);
  await journal.flush();
  assert.equal(createJournal(f.storage).entries[5].note, literal);
  assert.equal(NOTE_LIMIT, 500);
  assert.equal(journal.setNote('hercules', '草'.repeat(600)).note, '草'.repeat(500));
  assert.equal(journal.setNote('hercules', null), null);
  assert.equal(journal.setNote('hercules', '').note, '');
  assert.deepEqual(journal.entries.slice(0, 5), oldEntries);
});

test('six-species quota failure recovers all notes while protecting times against clock reversal', async () => {
  const f = fixture(), original = f.raw, journal = createJournal(f.storage, f);
  f.failWrite = true;
  journal.record(capture);
  journal.setNote('hercules', '木の幹にいた');
  assert.equal(journal.saved, false);
  assert.equal(journal.entries.length, 6);
  assert.equal(journal.entries[5].note, '木の幹にいた');
  assert.equal(f.raw, original);
  assert.equal(f.writes, 0);
  await journal.flush();
  f.failWrite = false;
  f.time = 900;
  journal.record({ ...capture, location: '熱帯の林縁' });
  await journal.flush();
  assert.equal(journal.saved, true);
  assert.equal(journal.entries[5].firstSeen, 1000);
  assert.equal(journal.entries[5].lastSeen, 1000);
  assert.equal(journal.entries[5].note, '木の幹にいた');
  assert.equal(journal.entries[5].location, '熱帯の林縁');
  assert.deepEqual(journal.entries.slice(0, 5), oldEntries);
  assert.deepEqual(createJournal(f.storage).entries, journal.entries);
});
