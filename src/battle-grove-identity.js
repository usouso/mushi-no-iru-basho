/** Fixed, unmeasured individuals in the new grove. These are NOT aliases for
 * old night/tropical insects, expedition encounters, or v1-import records. */
export const BATTLE_GROVE_ID='battle-grove';
export const BATTLE_GROVE_SLOTS=Object.freeze({rhino:'insect-1',stag:'insect-2',hercules:'insect-3'});
export function isBattleGroveOrigin(entry){return entry?.originHabitat===BATTLE_GROVE_ID&&Object.hasOwn(BATTLE_GROVE_SLOTS,entry?.species)&&entry.originIndividualId===BATTLE_GROVE_SLOTS[entry.species];}
