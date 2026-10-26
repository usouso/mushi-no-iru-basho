/** Supported individual variants. Scale is a game display index, not measured
 * wild length or a strength multiplier. No new geometry or frame-random draws. */
const ROOT_HEIGHT=Object.freeze({hercules:.06,rhino:.05,stag:.045,metallifer:0,giantstag:.045,atlas:.055});
const SUPPORT=Object.freeze({hercules:'herculesSupports',rhino:'rhinoSupports',stag:'stagSupports',metallifer:'metalliferSupports',giantstag:'giantStagSupports',atlas:'atlasSupports'});
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
