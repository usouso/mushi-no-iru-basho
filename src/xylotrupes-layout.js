/** Observation staging only: not a host plant, feeding site or measured wild microhabitat. */
const freeze=o=>{for(const v of Object.values(o))if(v&&typeof v==='object')freeze(v);return Object.freeze(o);};
// XYLOTRUPES_INDIVIDUAL_BEGIN
export const XYLOTRUPES_SITES=Object.freeze([-.04,0,.04]);
// XYLOTRUPES_INDIVIDUAL_END
export const XYLOTRUPES_BRANCH=freeze({center:{x:3.6,z:-.8},halfLength:.46,topHalfWidth:.16,halfWidth:.18,top:.70,bottom:.56,postX:3.93,postRadius:.055});
export const XYLOTRUPES_SUPPORT=freeze({home:{x:3.6,y:Math.fround(.70)+.055,z:-.8},orientation:{x:0,y:Math.SQRT1_2,z:0,w:Math.SQRT1_2},axis:{x:1,y:0,z:0},retreatBounds:{min:-.12,max:.12}});
export const XYLOTRUPES_APPROACHES=freeze([{x:3.6,y:1.28,z:.55},{x:2.6,y:1.28,z:-.8}]);
