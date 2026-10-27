/** Original observation staging, not a measured wild perch or host plant. */
const freeze=o=>{for(const v of Object.values(o))if(v&&typeof v==='object')freeze(v);return Object.freeze(o);};
export const MOONMOTH_STEM=freeze({x:-3.4,z:-.4,radius:.020,radialSegments:16,thetaStart:0,groundY:.0603627428412441,bottomY:.0403627428412441,topY:1.630362742841244});
export const MOONMOTH_PERCH=freeze({position:{x:-3.465,y:1.510362742841244,z:-.4},orientation:{x:-.5,y:.5,z:.5,w:.5},normal:{x:-1,y:0,z:0}});
// Head local +Z maps to world +Y; local +Y faces away from the stem toward -X.
export const MOONMOTH_FLIGHT=freeze([{x:-4.015,y:1.560362742841244,z:-.4},{x:-4.65,y:1.710362742841244,z:-.95},{x:-4.15,y:1.610362742841244,z:-1.55},{x:-3.85,y:1.560362742841244,z:-.95}]);
export const MOONMOTH_APPROACHES=freeze([{x:-4.4,z:-.4},{x:-3.9,z:-1.4}]);
export const MOONMOTH_APPROACH_ROUTE=freeze([[0,10],[0,4],[-2.2,.5],[-2.2,-1.4],[-4.4,-1.4],[-4.4,-.4]].map(([x,z])=>({x,z})));
