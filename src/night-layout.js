/* Observation-adjusted night wetland slice; not a claim about wild perch heights. */
export const NIGHT_BOUNDS=24;
export const NIGHT_SPAWN=Object.freeze({x:0,z:10});
export const NIGHT_HOMES=Object.freeze([
 Object.freeze(['firefly',0,4,1.55]),
 Object.freeze(['firefly',-4,-3,1.50]),
 Object.freeze(['firefly',4,-9,1.60]),
]);
export const NIGHT_SECOND_LEAF=Object.freeze({dx:.80,dz:-.30,dy:.05});
export const NIGHT_ROUTE=Object.freeze([[0,10],[0,4],[-4,-3],[4,-9],[4,2],[0,10]].map(Object.freeze));
export const NIGHT_LEAF_NORMAL=Object.freeze({x:0,y:Math.cos(80*Math.PI/180),z:-Math.sin(80*Math.PI/180)});
export const NIGHT_LEAF_FORWARD=Object.freeze({x:0,y:Math.sin(80*Math.PI/180),z:Math.cos(80*Math.PI/180)});
