// GIRAFFE_INDIVIDUAL_BEGIN
/** Authored branch display, not field biology. Optional scale/seed preserve the same gait; no flight/feeding options. Field caller owns canonical world-lane validation. */
// GIRAFFE_INDIVIDUAL_END
import {createBranchRetreatStudy} from './branch-retreat-study.js?v=0.67.0&b=06ee2abee345';
import {GIRAFFE_STAG_DIMENSIONS as D} from './giraffe-stag-kinematics.js?v=0.67.0&b=06ee2abee345';
export const GIRAFFE_STAG_MOTION=Object.freeze({warningSeconds:.22,retreatDistance:.12,retreatSpeed:.14,normalSpeed:.02,normalRange:.12,maxStepSeconds:.1});
function record(v,keys){return !!v&&[Object.prototype,null].includes(Object.getPrototypeOf(v))&&Reflect.ownKeys(v).length===keys.length&&keys.every(k=>Object.prototype.hasOwnProperty.call(v,k)&&'value'in Object.getOwnPropertyDescriptor(v,k)&&Number.isFinite(v[k]));}
export function createGiraffeStagStudy(options={}){
 // GIRAFFE_INDIVIDUAL_BEGIN
 if(!options||![Object.prototype,null].includes(Object.getPrototypeOf(options))||Reflect.ownKeys(options).some(k=>!['position','orientation','retreatBounds','scale','motionSeed'].includes(k)||!('value'in Object.getOwnPropertyDescriptor(options,k))))throw new TypeError('Invalid giraffe-stag options');
 const {scale=1,motionSeed=1729,position={x:0,y:D.rootAboveSupport*scale,z:0},orientation={x:0,y:0,z:0,w:1},retreatBounds={min:-.24,max:.24}}=options;
 if(!Number.isFinite(scale)||scale<1||scale>1.15||!Number.isInteger(motionSeed)||motionSeed<0||motionSeed>0xffffffff)throw new TypeError('Invalid giraffe-stag display scale or motion seed');
 const measured=Object.hasOwn(options,'scale')||Object.hasOwn(options,'motionSeed');
 if(!record(retreatBounds,['min','max'])||(measured?(retreatBounds.min<-.36-1e-10||retreatBounds.max>.36+1e-10||retreatBounds.max-retreatBounds.min>.48+1e-10):(retreatBounds.min<-.24||retreatBounds.max>.24)))throw new TypeError('Invalid giraffe-stag lane');
 if(!record(position,['x','y','z'])||Object.values(position).some(x=>Math.abs(x)>1e4)||!record(orientation,['x','y','z','w'])||Math.abs(Math.hypot(orientation.x,orientation.y,orientation.z,orientation.w)-1)>1e-6)throw new TypeError('Invalid giraffe-stag fixed support');
 // GIRAFFE_INDIVIDUAL_END
 const length=Math.hypot(orientation.x,orientation.y,orientation.z,orientation.w),q=Object.fromEntries(Object.entries(orientation).map(([k,v])=>[k,v/length])),origin={...position};
 // q * local +Z, and q * local +Y. This study is horizontal-only: no
 // silent projection/straightening of an unsupported tilted or vertical facet.
 const axis={x:2*(q.x*q.z+q.w*q.y),y:2*(q.y*q.z-q.w*q.x),z:1-2*(q.x*q.x+q.y*q.y)},normal={x:2*(q.x*q.y-q.w*q.z),y:1-2*(q.x*q.x+q.z*q.z),z:2*(q.y*q.z+q.w*q.x)};
 if(normal.y<1-1e-8||Math.abs(axis.y)>1e-8)throw new TypeError('Giraffe-stag needs a horizontal support quaternion');
 const core=createBranchRetreatStudy({boundedStepFinish:true,species:'giraffestag',position:{x:0,y:D.rootAboveSupport*scale,z:0},heading:Math.PI/2,scale,motionSeed,retreatBounds,cycleDistance:D.cycleDistance,rootAboveSupport:D.rootAboveSupport,warningSeconds:GIRAFFE_STAG_MOTION.warningSeconds,retreatDistance:GIRAFFE_STAG_MOTION.retreatDistance,retreatSpeed:GIRAFFE_STAG_MOTION.retreatSpeed,jawRest:D.restJawOpen,jawWarning:.65});
 function state(){const {heading,pitch,...s}=core.state,d=s.walkPhase/(2*Math.PI)*D.cycleDistance*scale;return{...s,position:{x:origin.x+axis.x*d,y:origin.y,z:origin.z+axis.z*d},orientation:{...q}};}
 return{update:dt=>core.update(dt),disturb(observer){
  if(!observer||![Object.prototype,null].includes(Object.getPrototypeOf(observer))||!['x','z'].every(k=>Object.prototype.hasOwnProperty.call(observer,k)&&'value'in Object.getOwnPropertyDescriptor(observer,k)&&Number.isFinite(observer[k])&&Math.abs(observer[k])<=1e4))return false;
  const along=(observer.x-origin.x)*axis.x+(observer.z-origin.z)*axis.z;return core.disturb({x:along,z:0});
 },capture:()=>core.capture(),release:()=>core.release(),reset:()=>core.reset(),get state(){return state();}};
}
