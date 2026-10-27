/** Timing-only meadow sidecar. Settings survive reset/travel/reload; the
 * simulation clock still restarts. Seconds are game tuning, not field data.
 * No storage, generator, encounter, model or geometry state is changed here.
 */
const EMPTY = Object.freeze([]);
function draw(worldSeed, outingCounter, runtimeSlotId, purpose) {
  // Counter stays decimal text, including values above uint32 up to MAX_SAFE_INTEGER.
  const input = `butterfly-ambient-v1/meadow/${runtimeSlotId}/${purpose}/${worldSeed}/${outingCounter}`;
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  hash ^= hash >>> 16; hash = Math.imul(hash, 0x7feb352d);
  hash ^= hash >>> 15; hash = Math.imul(hash, 0x846ca68b);
  return (hash ^ (hash >>> 16)) >>> 0;
}
export function butterflyAmbientProfiles(snapshot) {
  if (snapshot === null) return EMPTY;
  if (!snapshot || ![Object.prototype,null].includes(Object.getPrototypeOf(snapshot))) throw new TypeError('Invalid butterfly ambient snapshot');
  const seed = Object.getOwnPropertyDescriptor(snapshot, 'worldSeed');
  const counter = Object.getOwnPropertyDescriptor(snapshot, 'outingCounter');
  if (!seed || !counter || !('value' in seed) || !('value' in counter) || !Number.isInteger(seed.value) || seed.value < 0 || seed.value > 0xffffffff || !Number.isSafeInteger(counter.value) || counter.value < 1) throw new TypeError('Invalid butterfly ambient snapshot');
  return Object.freeze([1,2,3,4,5,6,7,18].map(slot => {
    const runtimeSlotId = `insect-${slot}`;
    const restSeconds = slot === 1 ? 12 + draw(seed.value, counter.value, runtimeSlotId, 'rest') % 3 : 9 + draw(seed.value, counter.value, runtimeSlotId, 'rest') % 5;
    // Begin on the same flower for at least two seconds; warning is unchanged.
    const offsetSeconds = slot === 1 ? 0 : draw(seed.value, counter.value, runtimeSlotId, 'offset') / 4294967296 * (restSeconds - 2);
    return Object.freeze({runtimeSlotId,restSeconds,offsetSeconds});
  }));
}
