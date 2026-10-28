/** Supported individual variants. Scale is a game display index, not measured
 * wild length or a strength multiplier. No new geometry or frame-random draws. */
// XYLOTRUPES_INDIVIDUAL_BEGIN
import {XYLOTRUPES_SITES} from './xylotrupes-layout.js?v=0.67.0&b=06ee2abee345';
// XYLOTRUPES_INDIVIDUAL_END
// GOLIATH_INDIVIDUAL_BEGIN
import {GOLIATH_INDIVIDUAL_OFFSETS} from './goliath-layout.js?v=0.67.0&b=06ee2abee345';
// GOLIATH_INDIVIDUAL_END
// RAINBOW_INDIVIDUAL_BEGIN
import {RAINBOW_STAG_SITES} from './rainbow-stag-layout.js?v=0.67.0&b=06ee2abee345';
// RAINBOW_INDIVIDUAL_END
import {GIRAFFE_STAG_SITES} from './giraffe-stag-layout.js?v=0.67.0&b=06ee2abee345';
import {EUROPE_STAG_SITES} from './europe-stag-layout.js?v=0.67.0&b=06ee2abee345';
// RAINBOW_INDIVIDUAL_BEGIN
// GOLIATH_INDIVIDUAL_BEGIN
// XYLOTRUPES_INDIVIDUAL_BEGIN
const ROOT_HEIGHT=Object.freeze({hercules:.06,rhino:.05,stag:.045,metallifer:0,giantstag:.045,atlas:.055,manticora:.055,europestag:.055,giraffestag:.060,rainbowstag:.050,goliath:.055,xylotrupes:.055});
// XYLOTRUPES_INDIVIDUAL_END
// GOLIATH_INDIVIDUAL_END
// RAINBOW_INDIVIDUAL_END
// RAINBOW_INDIVIDUAL_BEGIN
// GOLIATH_INDIVIDUAL_BEGIN
// XYLOTRUPES_INDIVIDUAL_BEGIN
const SUPPORT=Object.freeze({hercules:'herculesSupports',rhino:'rhinoSupports',stag:'stagSupports',metallifer:'metalliferSupports',giantstag:'giantStagSupports',atlas:'atlasSupports',manticora:'manticoraSupports',europestag:'europeStagSupports',giraffestag:'giraffeStagSupports',rainbowstag:'rainbowStagSupports',goliath:'goliathSupports',xylotrupes:'xylotrupesSupports'});
// XYLOTRUPES_INDIVIDUAL_END
// GOLIATH_INDIVIDUAL_END
// RAINBOW_INDIVIDUAL_END
export function individualScale(value){const n=typeof value==='object'?value?.sizePermille:value;return Number.isInteger(n)&&n>=1000&&n<=1150?n/1000:1;}
export function individualLabel(value){const n=typeof value==='object'?value?.sizePermille:value;return Number.isInteger(n)&&n>=1000&&n<=1150?`大きさ ${Math.round(n/10)}（同種の基準100）`:'大きさ 未計測';}
const copy=value=>JSON.parse(JSON.stringify(value));
const same=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)<1e-7;
/** Keep IDs/order, old species and physical supports unchanged. Only named
 * eligible homes move among three already-supported points on the same wood.
 * Pass the resulting options into createInsects; do not mutate a live world. */
export function individualHabitatOptions(habitat,options,snapshot,heightAt){
 if(!snapshot)return{...options,individuals:[]};
 const records=snapshot.encounters.filter(e=>e.habitat===habitat);
 if(!records.length)return {...options,individuals:[]};
 const out={...options,homes:copy(options.homes||[]),extraHomes:copy(options.extraHomes||[]),individuals:copy(records)};
 if(!records.length)return out;
 for(const key of new Set(records.map(e=>SUPPORT[e.species])))out[key]=copy(options[key]);
 if(options.logFruitStation)out.logFruitStation=copy(options.logFruitStation);
 const rows=[...out.homes,...out.extraHomes];
 for(const e of records){
  const id=e.runtimeSlotId||e.runtimeSlot,index=Number(id?.replace('insect-',''))-1,row=rows[index],key=SUPPORT[e.species],factor=individualScale(e);
  if(!row||row[0]!==e.species||!key||![0,1,2].includes(e.siteIndex)||factor===1&&e.sizePermille!==1000)throw new TypeError('Individual slot does not match supported habitat');
  const old={x:row[1],y:heightAt(row[1],row[2])+row[3],z:row[2]},support=out[key].find(g=>same(g.home,old));
  if(!support)throw new TypeError('Individual support not found');
  // GOLIATH_INDIVIDUAL_BEGIN
  // XYLOTRUPES_INDIVIDUAL_BEGIN
  if(e.species==='xylotrupes'){
   const offset=XYLOTRUPES_SITES[e.siteIndex],axis=support.axis,limits=support.retreatBounds;
   if(!axis||![axis.x,axis.y,axis.z,limits?.min,limits?.max].every(Number.isFinite)||Math.abs(axis.y)>1e-8||Math.abs(Math.hypot(axis.x,axis.y,axis.z)-1)>1e-8||limits.min>=limits.max)throw new TypeError('Xylotrupes physical lane missing');
   support.home={x:old.x+axis.x*offset,y:old.y+ROOT_HEIGHT.xylotrupes*(factor-1),z:old.z+axis.z*offset};support.retreatBounds={min:limits.min-offset,max:limits.max-offset};
   row[1]=support.home.x;row[2]=support.home.z;row[3]=support.home.y-heightAt(row[1],row[2]);continue;
  }
  // XYLOTRUPES_INDIVIDUAL_END
  if(e.species==='goliath'){
   const offset=GOLIATH_INDIVIDUAL_OFFSETS[e.siteIndex],heading=support.heading,limits=support.retreatBounds;
   if(![heading,limits?.min,limits?.max].every(Number.isFinite)||limits.min>=limits.max)throw new TypeError('Goliath physical lane missing');
   support.home={x:old.x+Math.sin(heading)*offset,y:old.y+ROOT_HEIGHT.goliath*(factor-1),z:old.z+Math.cos(heading)*offset};
   support.retreatBounds={min:limits.min-offset,max:limits.max-offset};
   row[1]=support.home.x;row[2]=support.home.z;row[3]=support.home.y-heightAt(row[1],row[2]);continue;
  }
  // GOLIATH_INDIVIDUAL_END
  // RAINBOW_INDIVIDUAL_BEGIN
  // Only the home changes: the three starts share one unchanged physical log.
  if(e.species==='rainbowstag'){
   const offset=RAINBOW_STAG_SITES[e.siteIndex],axis=support.axis,limits=support.retreatBounds;
   if(!axis||![axis.x,axis.y,axis.z,limits?.min,limits?.max].every(Number.isFinite)||Math.abs(axis.y)>1e-8||Math.abs(Math.hypot(axis.x,axis.y,axis.z)-1)>1e-8||limits.min>=limits.max)throw new TypeError('Rainbow-stag physical lane missing');
   support.home={x:old.x+axis.x*offset,y:old.y+ROOT_HEIGHT.rainbowstag*(factor-1),z:old.z+axis.z*offset};
   support.retreatBounds={min:limits.min-offset,max:limits.max-offset};
   row[1]=support.home.x;row[2]=support.home.z;row[3]=support.home.y-heightAt(row[1],row[2]);
   continue;
  }
  // RAINBOW_INDIVIDUAL_END
  // Giraffe uses the same horizontal quaternion/axis contract, on its own fixed branch.
  if(e.species==='giraffestag'){
   const offset=GIRAFFE_STAG_SITES[e.siteIndex],axis=support.axis,limits=support.retreatBounds;
   if(!axis||![axis.x,axis.y,axis.z,limits?.min,limits?.max].every(Number.isFinite)||Math.abs(axis.y)>1e-8||Math.abs(Math.hypot(axis.x,axis.y,axis.z)-1)>1e-8||limits.min>=limits.max)throw new TypeError('Giraffe-stag physical lane missing');
   support.home={x:old.x+axis.x*offset,y:old.y+ROOT_HEIGHT.giraffestag*(factor-1),z:old.z+axis.z*offset};
   support.retreatBounds={min:limits.min-offset,max:limits.max-offset};
   row[1]=support.home.x;row[2]=support.home.z;row[3]=support.home.y-heightAt(row[1],row[2]);
   continue;
  }
  // Europe uses a quaternion and one axis vector, not the older heading/axis-array contract.
  // Shift the start only; relative limits still describe the exact original world lane.
  if(e.species==='europestag'){
   const offset=EUROPE_STAG_SITES[e.siteIndex],axis=support.axis,limits=support.retreatBounds;
   if(!axis||![axis.x,axis.y,axis.z,limits?.min,limits?.max].every(Number.isFinite)||Math.abs(axis.y)>1e-8||Math.abs(Math.hypot(axis.x,axis.y,axis.z)-1)>1e-8||limits.min>=limits.max)throw new TypeError('Europe-stag physical lane missing');
   support.home={x:old.x+axis.x*offset,y:old.y+ROOT_HEIGHT.europestag*(factor-1),z:old.z+axis.z*offset};
   support.retreatBounds={min:limits.min-offset,max:limits.max-offset};
   row[1]=support.home.x;row[2]=support.home.z;row[3]=support.home.y-heightAt(row[1],row[2]);
   continue;
  }
  // Manticora sites move the study start along its fixed lane, not the lane or ground.
  if(e.species==='manticora'){support.home.y+=ROOT_HEIGHT.manticora*(factor-1);row[3]=support.home.y-heightAt(row[1],row[2]);continue;}
  const offset=(e.siteIndex-1)*(e.species==='hercules'?.22:e.species==='giantstag'?.04:e.species==='atlas'?.05:.14),heading=e.species==='hercules'?Math.atan2(support.axis[1].x-support.axis[0].x,support.axis[1].z-support.axis[0].z):support.heading,dy=ROOT_HEIGHT[e.species]*(factor-1);
  support.home={x:old.x+Math.sin(heading)*offset,y:old.y+dy,z:old.z+Math.cos(heading)*offset};
  // Giant's bark shelter/lane is fixed in world space, not attached to the new home.
  if(e.species==='giantstag'){
   const limits=support.retreatBounds;
   if(!limits||!Number.isFinite(limits.min)||!Number.isFinite(limits.max)||limits.min>=limits.max)throw new TypeError('Giant-stag physical lane missing');
   support.retreatBounds={min:limits.min-offset,max:limits.max-offset};
  }
  if(support.axis)for(const point of support.axis)point.y+=dy;
  row[1]=support.home.x;row[2]=support.home.z;row[3]=support.home.y-heightAt(row[1],row[2]);
  if(out.logFruitStation&&same(out.logFruitStation.supportHome,old)){
   out.logFruitStation.supportHome={...support.home};out.logFruitStation.target.y+=dy;
  }
 }
 return out;
}
