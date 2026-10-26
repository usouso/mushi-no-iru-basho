/** Observation-scale western branch of the existing night tree. Game layout,
 * not a claim about natural resting height or human reaction distances. */
export const GIANT_STAG_BRANCH=Object.freeze({startX:-6.20,endX:-4.70,z:2,radius:.30,surfaceAboveGround:.85});
export const GIANT_STAG_ORIGIN=Object.freeze({x:-5.75,z:2,heading:-Math.PI/2});
export const GIANT_STAG_RETREAT_BOUNDS=Object.freeze({min:-.26,max:.18});
// West-facing opening, open near side. Feet and body pass below the real hood;
// the hood blocks a front capture ray only after the body has moved underneath.
export const GIANT_STAG_COVER=Object.freeze({startX:-5.69,endX:-5.26,minZ:1.89,maxZ:2.14,bottomAboveSupport:.085,thickness:.028,wallInnerZ:2.13,wallOuterZ:2.16,wallBottomAboveSupport:-.06});
export const GIANT_STAG_APPROACH=Object.freeze([
 Object.freeze({x:-7.95,z:2}),Object.freeze({x:-5.55,z:-.30})
]);
