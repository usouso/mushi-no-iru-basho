/** Fixed-axis slope observation. Timing, speeds and retreat are game tuning,
 * not measured wild defence. Shared stepping runs in signed arc-distance. */
import {createBranchRetreatStudy} from './branch-retreat-study.js?v=0.25.0&b=1bc3118dbd0d';
import {ELEPHANT_DIMENSIONS as D} from './elephant-kinematics.js?v=0.25.0&b=1bc3118dbd0d';
export const ELEPHANT_MOTION=Object.freeze({warningSeconds:.35,retreatDistance:.24,retreatSpeed:.12,normalSpeed:.02,normalRange:.12,maxStepSeconds:.1,maxSlopeDegrees:15});
function point(v){return !!v&&[Object.prototype,null].includes(Object.getPrototypeOf(v))&&Reflect.ownKeys(v).length===3&&['x','y','z'].every(k=>Object.prototype.hasOwnProperty.call(v,k)&&'value'in Object.getOwnPropertyDescriptor(v,k)&&Number.isFinite(v[k])&&Math.abs(v[k])<=1e4);}
export function createElephantStudy({home,axis}={}){
 if(!point(home)||!Array.isArray(axis)||Object.getPrototypeOf(axis)!==Array.prototype||Reflect.ownKeys(axis).length!==3||![0,1].every(i=>Object.prototype.hasOwnProperty.call(axis,i)&&'value'in Object.getOwnPropertyDescriptor(axis,String(i))&&point(axis[i])))throw new TypeError('Invalid elephant slope support');
 const origin={...home},a={...axis[0]},b={...axis[1]},dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,horizontal=Math.hypot(dx,dz),length=Math.hypot(dx,dy,dz),angle=Math.atan2(dy,horizontal);
 if(length<.4||length>2.4||horizontal<.3||dy<0||angle>ELEPHANT_MOTION.maxSlopeDegrees*Math.PI/180||Math.hypot(origin.x-(a.x+b.x)/2,origin.y-(a.y+b.y)/2,origin.z-(a.z+b.z)/2)>1e-6)throw new TypeError('Invalid elephant slope support');
 const unit={x:dx/length,y:dy/length,z:dz/length},normal={x:-dx/horizontal*Math.sin(angle),y:Math.cos(angle),z:-dz/horizontal*Math.sin(angle)},heading=Math.atan2(dx,dz),pitch=-angle;
 const core=createBranchRetreatStudy({species:'elephant',position:{x:0,y:D.rootAboveSupport,z:0},heading:Math.PI/2,scale:1,motionSeed:null,retreatBounds:{min:-length/2,max:length/2},cycleDistance:D.cycleDistance,rootAboveSupport:D.rootAboveSupport,warningSeconds:ELEPHANT_MOTION.warningSeconds,retreatDistance:ELEPHANT_MOTION.retreatDistance,retreatSpeed:ELEPHANT_MOTION.retreatSpeed});
 function snapshot(){const s=core.state,d=s.position.x;return{...s,position:{x:origin.x+unit.x*d,y:origin.y+unit.y*d,z:origin.z+unit.z*d},heading,pitch,normal:{...normal},headLift:s.warningBlend};}
 return{update:dt=>core.update(dt),disturb(source){
  // Player eye height must not bias escape direction on a shallow slope. Project
  // the threat horizontally, then convert it to the same arc-distance units.
  if(!source||!['x','z'].every(k=>Object.prototype.hasOwnProperty.call(source,k)&&'value'in Object.getOwnPropertyDescriptor(source,k)&&Number.isFinite(source[k])&&Math.abs(source[k])<=1e4))return false;
  const arc=((source.x-origin.x)*dx+(source.z-origin.z)*dz)*length/(horizontal*horizontal);return core.disturb({x:arc,z:0});
 },capture:()=>core.capture(),release:()=>core.release(),reset:()=>core.reset(),get state(){return snapshot();}};
}
