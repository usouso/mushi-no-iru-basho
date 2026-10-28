// GOLIATH_INDIVIDUAL_BEGIN
/** Supported male on one real branch. Optional display scale and saved motion
 * do not represent natural size or strength. Response timing is game tuning. */
// GOLIATH_INDIVIDUAL_END
import {createBranchRetreatStudy} from './branch-retreat-study.js?v=0.67.0&b=06ee2abee345';
import {GOLIATH_DIMENSIONS as D} from './goliath-kinematics.js?v=0.67.0&b=06ee2abee345';
export const GOLIATH_MOTION=Object.freeze({warningSeconds:.35,retreatDistance:.24,retreatSpeed:.10,normalSpeed:.02,normalRange:.12,maxStepSeconds:.1});
// GOLIATH_INDIVIDUAL_BEGIN
export function createGoliathStudy(options={}){
 // Validate known option descriptors before scalar or nested support reads.
 if(!options||![Object.prototype,null].includes(Object.getPrototypeOf(options)))throw new TypeError('Invalid goliath options');
 for(const key of['position','heading','retreatBounds','scale','motionSeed'])if(key in options&&(!Object.hasOwn(options,key)||!('value'in Object.getOwnPropertyDescriptor(options,key))))throw new TypeError('Invalid goliath option accessor');
 const {scale=1,motionSeed=null,position={x:0,y:D.rootAboveSupport*scale,z:0},heading=0,retreatBounds}=options;
 if(!Number.isFinite(scale)||scale<1||scale>1.15||motionSeed!==null&&(!Number.isInteger(motionSeed)||motionSeed<0||motionSeed>0xffffffff))throw new TypeError('Invalid goliath display scale or motion seed');
// GOLIATH_INDIVIDUAL_END
 if(!position||![Object.prototype,null].includes(Object.getPrototypeOf(position))||Reflect.ownKeys(position).length!==3||!['x','y','z'].every(k=>Object.prototype.hasOwnProperty.call(position,k)&&'value'in Object.getOwnPropertyDescriptor(position,k)&&Number.isFinite(position[k])&&Math.abs(position[k])<=1e4)||!Number.isFinite(heading)||Math.abs(heading)>1e4)throw new TypeError('Invalid goliath support');
 // GOLIATH_INDIVIDUAL_BEGIN
 return createBranchRetreatStudy({boundedStepFinish:true,species:'goliath',position,heading,scale,motionSeed,retreatBounds,cycleDistance:D.cycleDistance,rootAboveSupport:D.rootAboveSupport,warningSeconds:GOLIATH_MOTION.warningSeconds,retreatDistance:GOLIATH_MOTION.retreatDistance,retreatSpeed:GOLIATH_MOTION.retreatSpeed});
 // GOLIATH_INDIVIDUAL_END
}
