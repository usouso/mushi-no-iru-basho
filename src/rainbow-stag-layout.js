/** North-Queensland rainforest-reference display, separate from Asian forest.
 * Low-log placement/height/lane are game staging, not adult ecological claims. */
export const AUSTRALIA_BOUNDS=8;
export const AUSTRALIA_SPAWN=Object.freeze({x:0,z:6});
export const RAINBOW_LOG=Object.freeze({halfLength:1.6,halfWidth:.5,topHalfWidth:.35,top:.55});
export const RAINBOW_LANE=Object.freeze({surface:Object.freeze({x:0,y:.55,z:.10}),rootAboveSupport:.05,min:-.34,max:.34});
export const RAINBOW_APPROACH=Object.freeze({x:0,z:1.5});
// Forward and reverse both work; the loop leaves every log end and trunk clear.
export const AUSTRALIA_ROUTE=Object.freeze([[0,6],[0,3],[0,1.5],[2.6,1.5],[2.6,-1.5],[-2.6,-1.5],[-2.6,1.5],[0,1.5],[0,6]].map(([x,z])=>Object.freeze({x,z})));
export const AUSTRALIA_TREES=Object.freeze([[-5.5,-3.5],[5.5,-3.5],[0,-6.2]].map(([x,z])=>Object.freeze({x,z,r:.28})));
