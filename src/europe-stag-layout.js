/** Southeast-England broadleaf-edge reference; a small authored evening display.
 * Coordinates, log height and walking lane are game staging, not a field survey. */
export const EUROPE_BOUNDS=8;
export const EUROPE_SPAWN=Object.freeze({x:0,z:6});
export const EUROPE_LOG=Object.freeze({halfLength:1.65,halfWidth:.49,topHalfWidth:.34,top:.48});
export const EUROPE_STAG_LANE=Object.freeze({surface:Object.freeze({x:0,y:.48,z:.08}),rootAboveSupport:.055,min:-.34,max:.34});
// Three authored starts on the unchanged world lane; not three new insects.
export const EUROPE_STAG_SITES=Object.freeze([-.12,0,.12]);
export const EUROPE_STAG_APPROACH=Object.freeze({x:0,z:1.55});
export const EUROPE_ROUTE=Object.freeze([[0,6],[0,3],[0,1.55],[2.7,1.55],[2.7,-1.6],[-2.7,-1.6],[-2.7,1.55],[0,1.55],[0,6]].map(([x,z])=>Object.freeze({x,z})));
export const EUROPE_TREES=Object.freeze([[-5.4,-3.8],[5.2,-3.5],[-1.8,-6.1],[5.4,4.0]].map(([x,z])=>Object.freeze({x,z,r:.29})));
