/** Original, presentation-only technique curves. Resolved delta chooses the
 * actor; this module never chooses a move, changes a result, or draws randomness.
 * Only the first two authored species (rhino/stag) receive an airborne technique.
 */
import {BATTLE_CHOREOGRAPHY, RING_OUT_CHOREOGRAPHY} from './battle-choreography.js?v=0.67.0&b=06ee2abee345';
export {BATTLE_CHOREOGRAPHY, RING_OUT_CHOREOGRAPHY};

export const BATTLE_TECHNIQUE_TIMING = Object.freeze({
  ...BATTLE_CHOREOGRAPHY,
  gripSeconds: .54,
  liftSeconds: .80,
  twistSeconds: .86,
  groundSeconds: 1.18,
  landingSeconds: 1.225,
});
export const RING_OUT_TECHNIQUE_TIMING = Object.freeze({
  ...BATTLE_TECHNIQUE_TIMING,
  ...RING_OUT_CHOREOGRAPHY,
  groundSeconds: 1.58,
  landingSeconds: 1.625,
});

const jawSpecies = new Set(['stag', 'metallifer', 'giantstag', 'miyama', 'manticora', 'rainbowstag', 'europestag']);
const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
const ramp = (t, start, end) => smooth((t - start) / (end - start));
const pulse = (t, start, peak, fall, end) => ramp(t, start, peak) * (1 - ramp(t, fall, end));

/** All motion channels are finite in [0,1]. prepare/grip/lift/twist/airborne/
 * release/landing are temporary amplitudes; translation/recovery are progress.
 * Grip starts at the fixed .46s contact cue, then the horn raises vertically or
 * the jaws unbalance sideways. Release precedes landing; recovery returns to
 * neutral before the next ordinary 1.6s logic exchange. Ring-out only stretches
 * this already-resolved presentation; it does not determine whether one occurs.
 * Reduced motion preserves stages/contact time but suppresses motion and cues,
 * immediately presenting the resolved position. No animation/event state lives
 * here: callers retain ownership of one-shot sound deduplication at .46s.
 */
export function sampleTechniqueTimeline(last, age, {
  playerSpecies, opponentSpecies, ringOut = false, reducedMotion = false,
} = {}) {
  const timing = ringOut ? RING_OUT_TECHNIQUE_TIMING : BATTLE_TECHNIQUE_TIMING;
  const {contactSeconds, gripSeconds, releaseSeconds, recoverySeconds, settledSeconds, groundSeconds, landingSeconds} = timing;
  const t = Number.isFinite(age) ? Math.max(0, age) : 0;
  const active = !!last && t < settledSeconds;
  const winner = Number.isFinite(last?.delta) && last.delta < 0 ? 'opponent' : 'player';
  const actor = last?.delta === 0 && last.number % 2 === 0 ? 'opponent' : winner;
  const species = actor === 'player' ? playerSpecies : opponentSpecies;
  const family = jawSpecies.has(species) ? 'jaw' : 'horn';
  const decisive = !!last && Number.isFinite(last.delta) && last.delta !== 0;
  const technique = !decisive ? 'hold' : species === 'rhino' ? 'horn-lift' : species === 'stag' ? 'jaw-turn' : 'hold';
  const moving = active && !reducedMotion;
  const throwing = moving && technique !== 'hold';
  const horn = technique === 'horn-lift';
  const stage = !active ? 'settled' : t < timing.approachSeconds ? 'prepare' : t < contactSeconds ? 'approach' : t < gripSeconds ? 'contact' : t < releaseSeconds ? 'drive' : t < recoverySeconds ? 'release' : 'recover';

  return {
    age: t, actor, family, technique, stage, active, settled: !active,
    contactActive: active && !reducedMotion && t >= contactSeconds && t < releaseSeconds,
    reducedMotion: !!reducedMotion,
    prepare: moving ? pulse(t, 0, timing.approachSeconds, timing.approachSeconds, contactSeconds) : 0,
    grip: moving ? pulse(t, contactSeconds, gripSeconds, releaseSeconds, releaseSeconds + .10) : 0,
    lift: throwing ? pulse(t, horn ? gripSeconds : .66, horn ? timing.liftSeconds : .90, releaseSeconds, groundSeconds) : 0,
    twist: throwing && !horn ? pulse(t, .58, timing.twistSeconds, releaseSeconds, groundSeconds) : 0,
    airborne: throwing ? pulse(t, horn ? .62 : .70, horn ? .82 : .90, releaseSeconds, groundSeconds) : 0,
    release: throwing ? pulse(t, releaseSeconds, releaseSeconds + .08, releaseSeconds + .08, groundSeconds) : 0,
    landing: throwing ? pulse(t, groundSeconds, landingSeconds, landingSeconds, recoverySeconds) : 0,
    translation: !moving ? 1 : ramp(t, ringOut ? .62 : releaseSeconds, ringOut ? recoverySeconds : settledSeconds),
    recovery: !moving ? 1 : ramp(t, recoverySeconds, settledSeconds),
  };
}
