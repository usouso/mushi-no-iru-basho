/** One observation-adjusted shallow swim, independent of natural body dimensions. */
import {DIVING_DIMENSIONS as D} from './diving-kinematics.js?v=0.18.1&b=0f85c9d0b1ba';
export const DIVING_CENTER=Object.freeze({x:23.2,z:-15.4});
export const DIVING_WATER_Y=-.29;
const tail=D.tailBreathingPoint;
export const DIVING_HOME=Object.freeze({x:DIVING_CENTER.x+.30,y:DIVING_WATER_Y-(-Math.sin(D.surfacePitch)*tail.z+Math.cos(D.surfacePitch)*tail.y),z:DIVING_CENTER.z});
export const DIVING_ENVELOPE=Object.freeze({radiusX:.30+D.footRadius,radiusZ:.15+D.footRadius,maxDepth:D.maxDepth});
export const DIVING_SHORE=Object.freeze({x:23.2,z:-14});
export const DIVING_APPROACH=Object.freeze([[21,-11],[24,-11],[24,-14],[23.2,-14]].map(Object.freeze));
