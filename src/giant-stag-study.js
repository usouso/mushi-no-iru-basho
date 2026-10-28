/** One male on a finite supported lane; defaults preserve the unmeasured individual. Warning and short
 * retreats are game tuning, not a measured natural defensive sequence. */
import {createBranchRetreatStudy} from './branch-retreat-study.js?v=0.67.0&b=06ee2abee345';
import {GIANT_STAG_DIMENSIONS as D} from './giant-stag-kinematics.js?v=0.67.0&b=06ee2abee345';
export const GIANT_STAG_MOTION=Object.freeze({warningSeconds:.22,retreatDistance:.20,retreatSpeed:.30,normalSpeed:.02,normalRange:.12,jawWarning:.65,maxStepSeconds:.1});
export function createGiantStagStudy({position={x:0,y:D.rootAboveSupport,z:0},heading=-Math.PI/2,scale=1,motionSeed=null,retreatBounds}={}){
 if(!position||![Object.prototype,null].includes(Object.getPrototypeOf(position))||Reflect.ownKeys(position).length!==3||!['x','y','z'].every(k=>Object.prototype.hasOwnProperty.call(position,k)&&'value'in Object.getOwnPropertyDescriptor(position,k)&&Number.isFinite(position[k])&&Math.abs(position[k])<=1e4)||!Number.isFinite(heading)||Math.abs(heading)>1e4)throw new TypeError('Invalid giant-stag support');
 if(!Number.isFinite(scale)||scale<1||scale>1.15||motionSeed!==null&&(!Number.isInteger(motionSeed)||motionSeed<0||motionSeed>0xffffffff))throw new TypeError('Invalid giant-stag individual motion');
 return createBranchRetreatStudy({boundedStepFinish:true,species:'giantstag',position,heading,scale,motionSeed,retreatBounds,cycleDistance:D.cycleDistance,rootAboveSupport:D.rootAboveSupport,warningSeconds:GIANT_STAG_MOTION.warningSeconds,retreatDistance:GIANT_STAG_MOTION.retreatDistance,retreatSpeed:GIANT_STAG_MOTION.retreatSpeed,jawRest:D.restJawOpen,jawWarning:GIANT_STAG_MOTION.jawWarning});
}
