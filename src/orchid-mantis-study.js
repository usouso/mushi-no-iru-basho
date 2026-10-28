/** Fixed-heading adult-female leaf study. Walking speeds, warning pulse and
 * reaction distances are game tuning, not measured Hymenopus escape behaviour. */
import {createBranchRetreatStudy} from './branch-retreat-study.js?v=0.67.0&b=06ee2abee345';
import {ORCHID_MANTIS_DIMENSIONS as D} from './orchid-mantis-kinematics.js?v=0.67.0&b=06ee2abee345';
export const ORCHID_MANTIS_MOTION=Object.freeze({warningSeconds:.25,retreatDistance:.06,retreatSpeed:.05,normalSpeed:.02,maxStepSeconds:.1});
const TAU=2*Math.PI;
const record=(v,keys)=>v&&[Object.prototype,null].includes(Object.getPrototypeOf(v))&&Reflect.ownKeys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k)&&'value'in Object.getOwnPropertyDescriptor(v,k)&&Number.isFinite(v[k]));
export function createOrchidMantisStudy(options={}){
 if(!options||![Object.prototype,null].includes(Object.getPrototypeOf(options))||Reflect.ownKeys(options).some(k=>!['position','orientation','retreatBounds','motionSeed'].includes(k)||!('value'in Object.getOwnPropertyDescriptor(options,k))))throw new TypeError('Invalid orchid-mantis study options');
 const {position={x:0,y:D.rootAboveSupport,z:0},orientation={x:0,y:0,z:0,w:1},retreatBounds={min:-.10,max:.10},motionSeed=1729}=options;
 if(!record(position,['x','y','z'])||Object.values(position).some(v=>Math.abs(v)>1e4)||!record(orientation,['x','y','z','w'])||Math.abs(Math.hypot(orientation.x,orientation.y,orientation.z,orientation.w)-1)>1e-8||!record(retreatBounds,['min','max'])||retreatBounds.min<-.10||retreatBounds.max>.10||!Number.isInteger(motionSeed)||motionSeed<0||motionSeed>0xffffffff)throw new TypeError('Invalid orchid-mantis fixed support');
 const origin={...position},q={...orientation},axis={x:2*(q.x*q.z+q.w*q.y),y:2*(q.y*q.z-q.w*q.x),z:1-2*(q.x*q.x+q.y*q.y)};
 if(1-2*(q.x*q.x+q.z*q.z)<1-1e-8||Math.abs(axis.y)>1e-8)throw new TypeError('Orchid-mantis needs a horizontal support');
 // The unchanged core stops each virtual half-cycle. Half the native cycle
 // therefore gives quarter-cycle (.01m) all-four-foot contact boundaries.
 // Convert its phase back below; the native .04m stride is never shortened.
 const virtualCycle=D.cycleDistance/2,core=createBranchRetreatStudy({species:'orchidmantis',position:{x:0,y:D.rootAboveSupport,z:0},heading:Math.PI/2,scale:1,motionSeed,retreatBounds,cycleDistance:virtualCycle,rootAboveSupport:D.rootAboveSupport,warningSeconds:ORCHID_MANTIS_MOTION.warningSeconds,retreatDistance:ORCHID_MANTIS_MOTION.retreatDistance,retreatSpeed:ORCHID_MANTIS_MOTION.retreatSpeed,warningPulse:true,boundedStepFinish:true});
 function state(){const{heading,pitch,warningBlend,...s}=core.state,d=s.walkPhase/TAU*virtualCycle;return{...s,position:{x:origin.x+axis.x*d,y:origin.y,z:origin.z+axis.z*d},orientation:{...q},walkPhase:s.walkPhase/2,forePose:warningBlend};}
 return{update:dt=>core.update(dt),disturb(observer){if(!observer||![Object.prototype,null].includes(Object.getPrototypeOf(observer))||!['x','z'].every(k=>Object.hasOwn(observer,k)&&'value'in Object.getOwnPropertyDescriptor(observer,k)&&Number.isFinite(observer[k])&&Math.abs(observer[k])<=1e4))return false;return core.disturb({x:(observer.x-origin.x)*axis.x+(observer.z-origin.z)*axis.z,z:0});},capture:()=>core.capture(),release:()=>core.release(),reset:()=>core.reset(),get state(){return state();}};
}
