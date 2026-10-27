/** Bounded horizontal-log field study. Durations, speeds and jaw motion are
 * game tuning, NOT measured natural behaviour. */
import {createBranchRetreatStudy} from './branch-retreat-study.js?v=0.64.0&b=3616c2fe808e';
import {RAINBOW_STAG_DIMENSIONS as D} from './rainbow-stag-kinematics.js?v=0.64.0&b=3616c2fe808e';
export const RAINBOW_STAG_MOTION=Object.freeze({warningSeconds:.22,retreatDistance:.18,retreatSpeed:.14,normalSpeed:.02,normalRange:.12,maxStepSeconds:.1});
function record(v,keys){return !!v&&[Object.prototype,null].includes(Object.getPrototypeOf(v))&&Reflect.ownKeys(v).length===keys.length&&keys.every(k=>Object.prototype.hasOwnProperty.call(v,k)&&'value'in Object.getOwnPropertyDescriptor(v,k)&&Number.isFinite(v[k]));}
// RAINBOW_INDIVIDUAL_BEGIN
export function createRainbowStagStudy(options={}){
 // New scalar channels are owned data, never accessors. Existing extra options
 // and profileless support behaviour remain as before; field owns world bounds.
 for(const key of['scale','motionSeed']){const d=options&&Object.getOwnPropertyDescriptor(options,key);if(d&&!('value'in d))throw new TypeError('Invalid rainbow-stag scalar accessor');}
 const {scale=1,position={x:0,y:D.rootAboveSupport*scale,z:0},orientation={x:0,y:0,z:0,w:1},retreatBounds={min:-.34,max:.34},motionSeed=1729}=options;
 if(!Number.isFinite(scale)||scale<1||scale>1.15)throw new TypeError('Invalid rainbow-stag display scale');
// RAINBOW_INDIVIDUAL_END
 if(!record(position,['x','y','z'])||Object.values(position).some(x=>Math.abs(x)>1e4)||!record(orientation,['x','y','z','w'])||Math.abs(Math.hypot(orientation.x,orientation.y,orientation.z,orientation.w)-1)>1e-6||!Number.isInteger(motionSeed)||motionSeed<0||motionSeed>0xffffffff)throw new TypeError('Invalid rainbow-stag fixed support');
 const length=Math.hypot(orientation.x,orientation.y,orientation.z,orientation.w),q=Object.fromEntries(Object.entries(orientation).map(([k,v])=>[k,v/length])),origin={...position};
 // q * local +Z, and q * local +Y. This study is horizontal-only: no
 // silent projection/straightening of an unsupported tilted or vertical facet.
 const axis={x:2*(q.x*q.z+q.w*q.y),y:2*(q.y*q.z-q.w*q.x),z:1-2*(q.x*q.x+q.y*q.y)},normal={x:2*(q.x*q.y-q.w*q.z),y:1-2*(q.x*q.x+q.z*q.z),z:2*(q.y*q.z+q.w*q.x)};
 if(normal.y<1-1e-8||Math.abs(axis.y)>1e-8)throw new TypeError('Rainbow-stag needs a horizontal support quaternion');
 // RAINBOW_INDIVIDUAL_BEGIN
 const core=createBranchRetreatStudy({boundedStepFinish:true,species:'rainbowstag',position:{x:0,y:D.rootAboveSupport*scale,z:0},heading:Math.PI/2,scale,motionSeed,retreatBounds,cycleDistance:D.cycleDistance,rootAboveSupport:D.rootAboveSupport,warningSeconds:RAINBOW_STAG_MOTION.warningSeconds,retreatDistance:RAINBOW_STAG_MOTION.retreatDistance,retreatSpeed:RAINBOW_STAG_MOTION.retreatSpeed,jawRest:D.restJawOpen,jawWarning:.65});
 // RAINBOW_INDIVIDUAL_END
 // RAINBOW_INDIVIDUAL_BEGIN
 function state(){const {heading,pitch,...s}=core.state,d=s.walkPhase/(2*Math.PI)*D.cycleDistance*scale;return{...s,position:{x:origin.x+axis.x*d,y:origin.y,z:origin.z+axis.z*d},orientation:{...q}};}
 // RAINBOW_INDIVIDUAL_END
 return{update:dt=>core.update(dt),disturb(observer){
  if(!observer||![Object.prototype,null].includes(Object.getPrototypeOf(observer))||!['x','z'].every(k=>Object.prototype.hasOwnProperty.call(observer,k)&&'value'in Object.getOwnPropertyDescriptor(observer,k)&&Number.isFinite(observer[k])&&Math.abs(observer[k])<=1e4))return false;
  const along=(observer.x-origin.x)*axis.x+(observer.z-origin.z)*axis.z;return core.disturb({x:along,z:0});
 },capture:()=>core.capture(),release:()=>core.release(),reset:()=>core.reset(),get state(){return state();}};
}
