/** Low branch for observation, not a representative wild resting height. */
export const STAG_BRANCH=Object.freeze({x:-4.8,startZ:1.9,endZ:3.7,radius:.30,surfaceAboveGround:1.40});
export const STAG_ORIGIN=Object.freeze({x:-4.8,z:3.15,heading:0});
export const STAG_APPROACH=Object.freeze([[-2,2],[-2.6,3.8],[-3.15,4]].map(Object.freeze));

// Root positions whose six feet stay on the existing branch at all supported sizes.
export const STAG_RETREAT_LIMITS=Object.freeze({min:2.58,max:3.43});
