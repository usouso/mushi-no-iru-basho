/** Per-species encounter tuning, not measured biological reaction distances. */
export const CAPTURE_AWARENESS = Object.freeze({
  butterfly: Object.freeze({ walkRadius: 3.2, dashRadius: 4.2, quietRadius: .95 }),
  dragonfly: Object.freeze({ walkRadius: 3.3, dashRadius: 4.4, quietRadius: 1.05 }),
  cicada: Object.freeze({ walkRadius: 3.5, dashRadius: 4.6, quietRadius: 1.15 })
});
export const NET_STARTLE = Object.freeze({ range: 3.2, minDot: .5 });
const clamp = value => Math.max(0, Math.min(1, value));
export function clearAwareness(item) {
  item.alert = 0; item.alertBlend = 0; item.awarenessStage = 'calm';
  item.warningElapsed = 0; item.netStartleOrigin = null;
}

// A warning is readable for at least .18 seconds before takeoff, even after a
// nearby miss. Stopping decays it rather than instantly clearing the feedback.
export function advanceAwareness(item, dt, rate, inFlight, settling) {
  if (dt <= 0) return false;
  if (inFlight || settling) {
    item.awarenessStage = settling ? 'settling' : 'fleeing';
    item.alert = 0; item.warningElapsed = 0; item.netStartleOrigin = null;
    item.alertBlend *= Math.exp(-dt * 8);
    return false;
  }
  const stimulus = item.netStartleOrigin ? Math.max(5, rate) : rate;
  item.alert = Math.max(0, Math.min(1.2, item.alert + dt * (stimulus || -.8)));
  if (item.alert >= .25) {
    item.warningElapsed = item.awarenessStage === 'warning' ? item.warningElapsed + dt : 0;
    item.awarenessStage = 'warning';
  } else {
    item.awarenessStage = 'calm'; item.warningElapsed = 0;
  }
  const target = item.awarenessStage === 'warning' ? clamp(item.alert) : 0;
  item.alertBlend += (target - item.alertBlend) * (1 - Math.exp(-dt * 10));
  return stimulus > 0 && item.alert >= 1 && item.warningElapsed >= .18;
}
