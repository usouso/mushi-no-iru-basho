/** One fixed original pond display. Metres and timings are game tuning, not
 * natural body size, preferred depth, or a new region. */
import {GIANT_WATERBUG_DIMENSIONS as D} from './giant-waterbug-kinematics.js?v=0.64.0&b=3616c2fe808e';
export const GIANT_WATERBUG_CENTER=Object.freeze({x:25.7,z:-15.7});
export const GIANT_WATERBUG_WATER_Y=-.29;
export const GIANT_WATERBUG_REST_PITCH=.95;
const c=Math.cos(GIANT_WATERBUG_REST_PITCH),s=Math.sin(GIANT_WATERBUG_REST_PITCH),tail=D.tailBreathingPoint;
export const GIANT_WATERBUG_HOME=Object.freeze({x:GIANT_WATERBUG_CENTER.x,y:GIANT_WATERBUG_WATER_Y-(-s*tail.z+c*tail.y),z:GIANT_WATERBUG_CENTER.z});
// Conservative whole-skin rectangle for a short pondward retreat, not a route
// generator. Root is allowed x[0,.16], z[-.20,0], y[-.04,0] from home.
export const GIANT_WATERBUG_ENVELOPE=Object.freeze({minX:-.14,maxX:.30,minZ:-.35,maxZ:.14,maxDepth:.30,groundMargin:.025});
export const GIANT_WATERBUG_SHORE=Object.freeze({x:25.7,z:-14.3});
export const GIANT_WATERBUG_RETREAT=Object.freeze({x:.16,y:-.04,z:-.20});
