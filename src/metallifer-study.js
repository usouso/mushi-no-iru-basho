/** Display study only: reuse the established short branch walk / retreat.
 * Timing, range and jaw response are game tuning, not measured wild behaviour. */
import {createStagStudy} from './stag-study.js?v=0.21.0&b=80addd8ed820';
export const METALLIFER_MOTION=Object.freeze({rootAboveSupport:0,cycleDistance:.04,range:.12,speed:.02,restJawOpen:.15});
export function createMetalliferStudy({position={x:0,y:0,z:0},heading=0,scale=1,motionSeed=null}={}){
 const study=createStagStudy({position,heading,scale,motionSeed});
 return {update:study.update,disturb:study.disturb,capture:study.capture,release:study.release,reset:study.reset,get state(){
  const s=study.state;
  // The existing gait's rest .25 maps to this original model's rest .15;
  // the restrained reaction remains .7 and keeps the same smooth timing.
  return {...s,id:'metallifer-study-1',jawOpen:.15+(s.jawOpen-.25)*(.55/.45)};
 }};
}
