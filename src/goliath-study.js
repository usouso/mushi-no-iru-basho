/** Fixed, unmeasured male on one real branch. Human-response distances, waits
 * and speeds are game tuning, not measured G. goliatus defensive behaviour. */
import {createBranchRetreatStudy} from './branch-retreat-study.js?v=0.41.0&b=bed5219b02cd';
import {GOLIATH_DIMENSIONS as D} from './goliath-kinematics.js?v=0.41.0&b=bed5219b02cd';
export const GOLIATH_MOTION=Object.freeze({warningSeconds:.35,retreatDistance:.24,retreatSpeed:.10,normalSpeed:.02,normalRange:.12,maxStepSeconds:.1});
export function createGoliathStudy({position={x:0,y:D.rootAboveSupport,z:0},heading=0,retreatBounds}={}){
 if(!position||![Object.prototype,null].includes(Object.getPrototypeOf(position))||Reflect.ownKeys(position).length!==3||!['x','y','z'].every(k=>Object.prototype.hasOwnProperty.call(position,k)&&'value'in Object.getOwnPropertyDescriptor(position,k)&&Number.isFinite(position[k])&&Math.abs(position[k])<=1e4)||!Number.isFinite(heading)||Math.abs(heading)>1e4)throw new TypeError('Invalid goliath support');
 return createBranchRetreatStudy({boundedStepFinish:true,species:'goliath',position,heading,scale:1,motionSeed:null,retreatBounds,cycleDistance:D.cycleDistance,rootAboveSupport:D.rootAboveSupport,warningSeconds:GOLIATH_MOTION.warningSeconds,retreatDistance:GOLIATH_MOTION.retreatDistance,retreatSpeed:GOLIATH_MOTION.retreatSpeed});
}
