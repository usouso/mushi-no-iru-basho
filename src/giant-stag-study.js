/** One fixed, unmeasured male on a finite supported lane. Warning and short
 * retreats are game tuning, not a measured natural defensive sequence. */
import {createBranchRetreatStudy} from './branch-retreat-study.js?v=0.25.0&b=1bc3118dbd0d';
import {GIANT_STAG_DIMENSIONS as D} from './giant-stag-kinematics.js?v=0.25.0&b=1bc3118dbd0d';
export const GIANT_STAG_MOTION=Object.freeze({warningSeconds:.35,retreatDistance:.20,retreatSpeed:.12,normalSpeed:.02,normalRange:.12,jawWarning:.65,maxStepSeconds:.1});
export function createGiantStagStudy({position={x:0,y:D.rootAboveSupport,z:0},heading=-Math.PI/2,retreatBounds}={}){
 if(!position||![Object.prototype,null].includes(Object.getPrototypeOf(position))||Reflect.ownKeys(position).length!==3||!['x','y','z'].every(k=>Object.prototype.hasOwnProperty.call(position,k)&&'value'in Object.getOwnPropertyDescriptor(position,k)&&Number.isFinite(position[k])&&Math.abs(position[k])<=1e4)||!Number.isFinite(heading)||Math.abs(heading)>1e4)throw new TypeError('Invalid giant-stag support');
 return createBranchRetreatStudy({species:'giantstag',position,heading,scale:1,motionSeed:null,retreatBounds,cycleDistance:D.cycleDistance,rootAboveSupport:D.rootAboveSupport,warningSeconds:GIANT_STAG_MOTION.warningSeconds,retreatDistance:GIANT_STAG_MOTION.retreatDistance,retreatSpeed:GIANT_STAG_MOTION.retreatSpeed,jawRest:D.restJawOpen,jawWarning:GIANT_STAG_MOTION.jawWarning});
}
