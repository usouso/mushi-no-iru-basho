/** Original adult-male mantis pose lab. Metres are display sizes, not anatomy measurements.
 * Pure body-local limb pose; no clock, DOM, renderer, or mutable simulation ownership. */
export const MANTIS_DIMENSIONS=Object.freeze({bodyLength:.26,rootAboveSupport:.045,supportRadius:Math.hypot(.08,.10)});
const finite=(x,d=0)=>Number.isFinite(x)?x:d;
const clamp=x=>Math.max(0,Math.min(1,finite(x)));
const point=(x,y,z)=>({x,y,z});
export function sampleMantisPose(state={}){
 const tuck=clamp(state.legTuck),open=clamp(state.wingOpen),phase=finite(state.wingPhase),legs=[];
 for(const side of [-1,1]){
  // Two forelegs are folded raptorial limbs, not support legs.
  legs.push({id:`front-${side}`,role:'raptorial',side,support:false,hip:point(side*.009,-.001,.073),knee:point(side*.025,-.022,.104),foot:point(side*.014,-.007,.080)});
  for(const role of ['middle','hind']){
   const hip=point(side*.013,-.002,role==='middle'?.008:-.035),knee=point(side*.053,-.012,role==='middle'?.046:-.070),foot=point(side*.080,-.045,role==='middle'?.025:-.100);
   // Rigid rotation about each hip preserves both segment lengths. Small tuck only.
   const a=side*tuck*.38,c=Math.cos(a),s=Math.sin(a);
   for(const p of [knee,foot]){const x=p.x-hip.x,y=p.y-hip.y;p.x=hip.x+c*x-s*y;p.y=hip.y+s*x+c*y;}
   legs.push({id:`${role}-${side}`,role,side,support:tuck===0,hip,knee,foot});
  }
 }
 const wings=[];for(const side of [-1,1])for(const role of ['forewing','hindwing'])wings.push({id:`${role}-${side}`,role,side,open,flap:open*Math.sin(phase)*(role==='hindwing'?.43:.17)});
 return {body:{position:point(finite(state.position?.x),finite(state.position?.y),finite(state.position?.z)),heading:finite(state.heading),pitch:finite(state.pitch)},headYaw:Math.max(-.16,Math.min(.16,finite(state.headYaw))),legs,wings};
}
