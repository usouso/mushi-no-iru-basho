/** Timing-only meadow sidecar. Settings survive reset/travel/reload; the
 * simulation clock still restarts. Seconds are game tuning, not field data.
 * No storage, generator, encounter, model or geometry state is changed here.
 */
const EMPTY = Object.freeze([]);
function draw(worldSeed, outingCounter, runtimeSlotId, purpose) {
  // Counter stays decimal text, including values above uint32 up to MAX_SAFE_INTEGER.
  const input = `dragonfly-ambient-v1/meadow/${runtimeSlotId}/${purpose}/${worldSeed}/${outingCounter}`;
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  hash ^= hash >>> 16; hash = Math.imul(hash, 0x7feb352d);
  hash ^= hash >>> 15; hash = Math.imul(hash, 0x846ca68b);
  return (hash ^ (hash >>> 16)) >>> 0;
}
export function dragonflyAmbientProfiles(snapshot) {
  if (snapshot === null) return EMPTY;
  if (!snapshot || ![Object.prototype,null].includes(Object.getPrototypeOf(snapshot))) throw new TypeError('Invalid dragonfly ambient snapshot');
  const seed = Object.getOwnPropertyDescriptor(snapshot, 'worldSeed');
  const counter = Object.getOwnPropertyDescriptor(snapshot, 'outingCounter');
  if (!seed || !counter || !('value' in seed) || !('value' in counter) || !Number.isInteger(seed.value) || seed.value < 0 || seed.value > 0xffffffff || !Number.isSafeInteger(counter.value) || counter.value < 1) throw new TypeError('Invalid dragonfly ambient snapshot');
  return Object.freeze(Array.from({length:6}, (_, i) => {
    const runtimeSlotId = `insect-${i + 8}`;
    const restSeconds = 8 + draw(seed.value, counter.value, runtimeSlotId, 'rest') % 5;
    const offsetSeconds = draw(seed.value, counter.value, runtimeSlotId, 'offset') / 4294967296 * (restSeconds + 6);
    return Object.freeze({runtimeSlotId,restSeconds,offsetSeconds});
  }));
}
