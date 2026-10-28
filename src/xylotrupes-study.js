/** Fixed short observation-branch response. Seconds/speeds/head motion are
 * game tuning, not measured natural activity, feeding or fighting behaviour. */
import {createBranchRetreatStudy} from './branch-retreat-study.js?v=0.67.0&b=06ee2abee345';
import {XYLOTRUPES_DIMENSIONS as D} from './xylotrupes-kinematics.js?v=0.67.0&b=06ee2abee345';
export const XYLOTRUPES_MOTION=Object.freeze({warningSeconds:.25,retreatDistance:.06,retreatSpeed:.08,normalSpeed:.02,maxStepSeconds:.1});
const TAU=2*Math.PI,record=(v,keys)=>v&&[Object.prototype,null].includes(Object.getPrototypeOf(v))&&Reflect.ownKeys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k)&&'value'in Object.getOwnPropertyDescriptor(v,k)&&Number.isFinite(v[k]));
export function createXylotrupesStudy(options={}){
// XYLOTRUPES_INDIVIDUAL_BEGIN
 if(!options||![Object.prototype,null].includes(Object.getPrototypeOf(options))||Reflect.ownKeys(options).some(k=>!['position','orientation','retreatBounds','scale','motionSeed'].includes(k)||!('value'in Object.getOwnPropertyDescriptor(options,k))))throw new TypeError('Invalid xylotrupes study options');
// XYLOTRUPES_INDIVIDUAL_END
// XYLOTRUPES_INDIVIDUAL_BEGIN
 const {scale=1,motionSeed=1729,position={x:0,y:D.rootAboveSupport*scale,z:0},orientation={x:0,y:0,z:0,w:1},retreatBounds={min:-.12,max:.12}}=options;
// XYLOTRUPES_INDIVIDUAL_END
// XYLOTRUPES_INDIVIDUAL_BEGIN
 if(!Number.isFinite(scale)||scale<1||scale>1.15||!Number.isInteger(motionSeed)||motionSeed<0||motionSeed>0xffffffff)throw new TypeError('Invalid xylotrupes individual scalars');
 if(!record(position,['x','y','z'])||Object.values(position).some(v=>Math.abs(v)>1e4)||!record(orientation,['x','y','z','w'])||Math.abs(Math.hypot(orientation.x,orientation.y,orientation.z,orientation.w)-1)>1e-8||!record(retreatBounds,['min','max'])||((retreatBounds.min<-.12||retreatBounds.max>.12)&&!(Object.hasOwn(options,'scale')&&Object.hasOwn(options,'motionSeed')&&[-.04,.04].some(site=>Math.abs(retreatBounds.min-(-.12-site))<1e-10&&Math.abs(retreatBounds.max-(.12-site))<1e-10))))throw new TypeError('Invalid xylotrupes fixed support');
// XYLOTRUPES_INDIVIDUAL_END
 const origin={...position},q={...orientation},axis={x:2*(q.x*q.z+q.w*q.y),y:2*(q.y*q.z-q.w*q.x),z:1-2*(q.x*q.x+q.y*q.y)};
 if(1-2*(q.x*q.x+q.z*q.z)<1-1e-8||Math.abs(axis.y)>1e-8)throw new TypeError('Xylotrupes needs a horizontal support');
// XYLOTRUPES_INDIVIDUAL_BEGIN
 const core=createBranchRetreatStudy({species:'xylotrupes',position:{x:0,y:D.rootAboveSupport*scale,z:0},heading:Math.PI/2,scale,motionSeed,retreatBounds,cycleDistance:D.cycleDistance,rootAboveSupport:D.rootAboveSupport,warningSeconds:XYLOTRUPES_MOTION.warningSeconds,retreatDistance:XYLOTRUPES_MOTION.retreatDistance,retreatSpeed:XYLOTRUPES_MOTION.retreatSpeed,boundedStepFinish:true});
// XYLOTRUPES_INDIVIDUAL_END
// XYLOTRUPES_INDIVIDUAL_BEGIN
 function state(){const{heading,pitch,...s}=core.state,d=s.walkPhase/TAU*D.cycleDistance*scale;return{...s,position:{x:origin.x+axis.x*d,y:origin.y,z:origin.z+axis.z*d},orientation:{...q},headLift:s.warningBlend};}
// XYLOTRUPES_INDIVIDUAL_END
 return{update:dt=>core.update(dt),disturb(observer){if(!observer||![Object.prototype,null].includes(Object.getPrototypeOf(observer))||!['x','z'].every(k=>Object.hasOwn(observer,k)&&'value'in Object.getOwnPropertyDescriptor(observer,k)&&Number.isFinite(observer[k])&&Math.abs(observer[k])<=1e4))return false;return core.disturb({x:(observer.x-origin.x)*axis.x+(observer.z-origin.z)*axis.z,z:0});},capture:()=>core.capture(),release:()=>core.release(),reset:()=>core.reset(),get state(){return state();}};
}
