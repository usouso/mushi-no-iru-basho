/** Presentation-only original sumo choreography. No move selection, score,
 * random draw, collection mutation or assertion of a licensed game's moves. */
export const BATTLE_CHOREOGRAPHY=Object.freeze({contactSeconds:.46,releaseSeconds:.96,settledSeconds:1.42,approachSeconds:.18,recoverySeconds:1.30});
// Only a resolved ring-out gets time to push clear of the unchanged line and land.
export const RING_OUT_CHOREOGRAPHY=Object.freeze({releaseSeconds:1.35,recoverySeconds:1.70,settledSeconds:1.95});
const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{const t=clamp(x);return t*t*(3-2*t);},ramp=(t,a,b)=>ease((t-a)/(b-a));
export function sampleBattleChoreography(last,age,{playerSpecies,opponentSpecies,reducedMotion=false,ringOut=false}={}){
 const timing=ringOut?RING_OUT_CHOREOGRAPHY:BATTLE_CHOREOGRAPHY,release=timing.releaseSeconds,recovery=timing.recoverySeconds,settled=timing.settledSeconds;
 const t=Number.isFinite(age)?Math.max(0,age):0,active=!!last&&t<settled;
 const winner=Number.isFinite(last?.delta)&&last.delta<0?'opponent':'player',actor=last?.delta===0&&last.number%2===0?'opponent':winner;
 const species=actor==='player'?playerSpecies:opponentSpecies,family=['stag','metallifer','giantstag','miyama','manticora'].includes(species)?'jaw':'horn';
 const stage=!last||!active?'settled':t<.18?'prepare':t<.46?'approach':t<.54?'contact':t<release?'drive':t<recovery?'release':'recover';
 const contact=active&&!reducedMotion?ramp(t,.06,.46)*(1-ramp(t,release,recovery)):0;
 const drive=active&&!reducedMotion&&last.delta!==0?ramp(t,.54,.80)*(1-ramp(t,release,recovery)):0;
 return{age:t,stage,active,settled:!active,actor,family,contact,drive,crouch:active&&!reducedMotion?ramp(t,0,.18)*(1-ramp(t,release,recovery)):0,translation:!active||reducedMotion?1:ramp(t,ringOut?.62:.96,ringOut?recovery:settled),contactActive:!!last&&!reducedMotion&&t>=.46&&t<release,footRecovery:active?ramp(t,recovery,settled):1,reducedMotion:!!reducedMotion};
}
