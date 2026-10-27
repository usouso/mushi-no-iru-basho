/** Original broad green observation leaf, not an orchid flower or measured wild perch. */
const freeze=o=>{for(const v of Object.values(o))if(v&&typeof v==='object')freeze(v);return Object.freeze(o);};
export const ORCHID_MANTIS_LEAF=freeze({x:3.5,z:5,topY:1.045381784439087,heightAboveGround:.92,rootAboveSupport:.060,outline:[[0,.37],[.16,.27],[.23,.10],[.23,-.12],[.16,-.28],[0,-.37],[-.16,-.28],[-.23,-.12],[-.23,.10],[-.16,.27]]});
export const ORCHID_MANTIS_SUPPORT=freeze({position:{x:3.5,y:1.105381784439087,z:5},orientation:{x:0,y:0,z:0,w:1},retreatBounds:{min:-.10,max:.10}});
export const ORCHID_MANTIS_STEM=freeze({base:{x:3.54,z:4.60},tip:{x:3.5,y:1.045381784439087,z:4.69},bottomRadius:.012,topRadius:.006});
export const ORCHID_MANTIS_APPROACH=freeze([[0,10],[0,4],[2.5,4],[3.5,6.25]].map(([x,z])=>({x,z})));
export const ORCHID_MANTIS_CAPTURE_SPOTS=freeze([{x:3.5,z:6.25},{x:4.75,z:5}]);
