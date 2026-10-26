/** Observation-adjusted live tree, not a representative wild feeding height. */
export const RHINO_TREE=Object.freeze({x:-4.8,z:2,trunkRadius:.48,height:4.5});
export const RHINO_BRANCH=Object.freeze({startX:-4.9,endX:-3.1,z:2,radius:.30,surfaceAboveGround:1.20,segments:8});
export const RHINO_ORIGIN=Object.freeze({x:-3.65,z:2,heading:Math.PI/2});
export const RHINO_APPROACH=Object.freeze([[0,4],[-1.2,1.9],[-2,2],[-1.2,1.9],[-4,-3]].map(Object.freeze));

// Root positions whose six feet stay on the existing branch at all supported sizes.
export const RHINO_RETREAT_LIMITS=Object.freeze({min:-4.1,max:-3.36});
