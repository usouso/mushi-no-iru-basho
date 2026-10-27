/** Original small Flores-reference forest edge, not a surveyed habitat or wild scale. */
export const FLORES_BOUNDS=7;
export const FLORES_SPAWN=Object.freeze({x:0,z:3});
export const GIRAFFE_STAG_BRANCH=Object.freeze({minX:-.8,maxX:.8,top:.80,bottom:.53,halfWidth:.29,topHalfWidth:.22});
export const GIRAFFE_STAG_HOME=Object.freeze({x:0,y:.86,z:0});
export const GIRAFFE_STAG_SUPPORT=Object.freeze({home:GIRAFFE_STAG_HOME,orientation:Object.freeze({x:0,y:Math.SQRT1_2,z:0,w:Math.SQRT1_2}),axis:Object.freeze({x:1,y:0,z:0}),retreatBounds:Object.freeze({min:-.24,max:.24})});
// GIRAFFE_INDIVIDUAL_BEGIN
export const GIRAFFE_STAG_SITES=Object.freeze([-.12,0,.12]);
// GIRAFFE_INDIVIDUAL_END
export const GIRAFFE_STAG_APPROACH=Object.freeze({x:0,z:1.5});
export const FLORES_ROUTE=Object.freeze([[0,3],[0,1.5],[1.5,1.5],[1.5,-1.5],[0,-1.5]].map(([x,z])=>Object.freeze({x,z})));
export const FLORES_TREES=Object.freeze([[-.78,0,.20],[-4,-3,.28],[3.8,-3.2,.25],[-4,3.8,.26],[4.3,3.3,.26]].map(([x,z,r])=>Object.freeze({x,z,r})));
