/** One fixed bark facet. Short climbing, warning and upward withdrawal are game
 * tuning, not measured natural escape behaviour. No flight or trunk traversal. */
import {createBranchRetreatStudy} from './branch-retreat-study.js?v=0.40.0&b=8b1b975eded1';
import {MIYAMA_DIMENSIONS as D} from './miyama-kinematics.js?v=0.40.0&b=8b1b975eded1';
export const MIYAMA_MOTION=Object.freeze({normalRange:.08,normalSpeed:.02,warningSeconds:.25,retreatDistance:.08,retreatSpeed:.06,jawWarning:.7,maxStepSeconds:.1});
function record(value,keys){return !!value&&[Object.prototype,null].includes(Object.getPrototypeOf(value))&&Reflect.ownKeys(value).length===keys.length&&keys.every(k=>Object.prototype.hasOwnProperty.call(value,k)&&'value'in Object.getOwnPropertyDescriptor(value,k)&&Number.isFinite(value[k])&&Math.abs(value[k])<=1e4);}
export function createMiyamaStudy({position,orientation}={}){
 if(!record(position,['x','y','z'])||!record(orientation,['x','y','z','w']))throw new TypeError('Invalid miyama bark support');
 const length=Math.hypot(orientation.x,orientation.y,orientation.z,orientation.w);if(Math.abs(length-1)>1e-6)throw new TypeError('Invalid miyama bark orientation');
 const origin={...position},q=Object.fromEntries(Object.entries(orientation).map(([k,v])=>[k,v/length]));
 const tangent={x:2*(q.x*q.z+q.w*q.y),y:2*(q.y*q.z-q.w*q.x),z:1-2*(q.x*q.x+q.y*q.y)};
 const core=createBranchRetreatStudy({boundedStepFinish:true,species:'miyama',position:{x:0,y:D.rootAboveSupport,z:0},heading:Math.PI/2,scale:1,motionSeed:null,retreatBounds:{min:0,max:MIYAMA_MOTION.normalRange},cycleDistance:D.cycleDistance,rootAboveSupport:D.rootAboveSupport,warningSeconds:MIYAMA_MOTION.warningSeconds,retreatDistance:MIYAMA_MOTION.retreatDistance,retreatSpeed:MIYAMA_MOTION.retreatSpeed,jawRest:D.restJawOpen,jawWarning:MIYAMA_MOTION.jawWarning});
 function snapshot(){const s=core.state,d=s.position.x;return{...s,position:{x:origin.x+tangent.x*d,y:origin.y+tangent.y*d,z:origin.z+tangent.z*d},orientation:{...q}};}
 return{update:dt=>core.update(dt),disturb(source){
  if(!source||!['x','z'].every(k=>Object.prototype.hasOwnProperty.call(source,k)&&'value'in Object.getOwnPropertyDescriptor(source,k)&&Number.isFinite(source[k])&&Math.abs(source[k])<=1e4))return false;
  // On this near-vertical fixed lane the player's eye height cannot choose an
  // alleged "away" axis. Use the bounded upper refuge instead; its end remains
  // visible/catchable. Never walk off the facet or restart a retreat per frame.
  return core.disturb({x:-1,z:0});
 },capture:()=>core.capture(),release:()=>core.release(),reset:()=>core.reset(),get state(){return snapshot();}};
}
