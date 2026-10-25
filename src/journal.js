/** Browser-local field notes only: no accounts, telemetry, network or game-state effects.
 * Entries describe encounters, not a collection of retained insects. Releasing an
 * insect is still the simulation's responsibility and never removes its note.
 * Notes and location labels are plain text: render with textContent/value, never HTML.
 */
export const JOURNAL_KEY = 'mushi-journal-v1';
export const JOURNAL_VERSION = 1;
export const NOTE_LIMIT = 500;
const speciesIds = new Set(['butterfly', 'dragonfly', 'cicada']);
const text = (value, limit) => typeof value === 'string' ? value.slice(0, limit) : '';
const timestamp = value => Number.isSafeInteger(value) && value >= 0;
const coordinate = value => Number.isFinite(value) ? value : null;
const copyEntries = entries => entries.map(entry => ({ ...entry }));

// Access itself can throw (blocked storage, private/sandboxed contexts).
function browserStorage() {
  try { return globalThis.localStorage ?? null; } catch { return null; }
}

function normalizeEntries(entries) {
  if (!Array.isArray(entries)) return [];
  const result = [], seen = new Set();
  for (const entry of entries) {
    if (!entry || !speciesIds.has(entry.species) || seen.has(entry.species)
      || !timestamp(entry.firstSeen) || !timestamp(entry.lastSeen)
      || entry.lastSeen < entry.firstSeen) continue;
    seen.add(entry.species);
    result.push({
      species: entry.species,
      firstSeen: entry.firstSeen,
      lastSeen: entry.lastSeen,
      location: text(entry.location, 120),
      x: coordinate(entry.x),
      z: coordinate(entry.z),
      note: text(entry.note, NOTE_LIMIT)
    });
    if (result.length === 3) break;
  }
  return result;
}

/** Reading never writes. saved=false means storage was unavailable or invalid. */
export function loadJournal(storage = browserStorage()) {
  try {
    if (!storage) return { entries: [], saved: false };
    const raw = storage.getItem(JOURNAL_KEY);
    if (raw === null) return { entries: [], saved: true };
    // Three bounded notes cannot need a large payload. Do not parse unrelated data.
    if (typeof raw !== 'string' || raw.length > 20000) return { entries: [], saved: false };
    const data = JSON.parse(raw);
    if (!data || data.version !== JOURNAL_VERSION || !Array.isArray(data.entries)) {
      return { entries: [], saved: false };
    }
    const entries = normalizeEntries(data.entries);
    return { entries, saved: JSON.stringify(entries) === JSON.stringify(data.entries) };
  } catch { return { entries: [], saved: false }; }
}

/** Returns persistence success, never throws for disabled/full browser storage. */
export function saveJournal(entries, storage = browserStorage()) {
  try {
    if (!storage) return false;
    storage.setItem(JOURNAL_KEY, JSON.stringify({ version: JOURNAL_VERSION, entries: normalizeEntries(entries) }));
    return true;
  } catch { return false; }
}

/**
 * createJournal(storage?, {now = Date.now}?)
 * entries: detached snapshots of encountered species only (maximum three).
 * saved: whether current edits were persisted; false edits remain in memory.
 * record({species, location, x, z}): entry snapshot or null for invalid species.
 * setNote(species, plainText): entry snapshot or null if not encountered.
 * Location and x/z are supplied by the game's capture-place helper, not GPS.
 * record updates the latest place/time but preserves the first time and memo.
 * Both mutations retry saving the whole current journal, recovering after quota
 * or permission failures when storage becomes available again.
 */
export function createJournal(storage = browserStorage(), { now = Date.now } = {}) {
  const loaded = loadJournal(storage);
  const entries = loaded.entries;
  let saved = loaded.saved;
  function persist(entry) {
    saved = saveJournal(entries, storage);
    return { ...entry };
  }
  return {
    get entries() { return copyEntries(entries); },
    get saved() { return saved; },
    record({ species, location, x, z } = {}) {
      if (!speciesIds.has(species)) return null;
      const time = now();
      if (!timestamp(time)) return null;
      let entry = entries.find(item => item.species === species);
      if (!entry) {
        entry = { species, firstSeen: time, lastSeen: time, location: '', x: null, z: null, note: '' };
        entries.push(entry);
      }
      // A backwards wall clock must not invalidate an existing local record.
      entry.lastSeen = Math.max(entry.lastSeen, time);
      entry.location = text(location, 120);
      entry.x = coordinate(x);
      entry.z = coordinate(z);
      return persist(entry);
    },
    setNote(species, note) {
      const entry = entries.find(item => item.species === species);
      if (!entry || typeof note !== 'string') return null;
      entry.note = text(note, NOTE_LIMIT);
      return persist(entry);
    }
  };
}
