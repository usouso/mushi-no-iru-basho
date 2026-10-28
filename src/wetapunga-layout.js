/** Small authored northern-New-Zealand forest display, not surveyed habitat or
 * natural-size staging. The lane uses the native model's metre-space contract. */
import {WETAPUNGA_DIMENSIONS as D} from './wetapunga-kinematics.js?v=0.67.0&b=06ee2abee345';
export const NEWZEALAND_BOUNDS=7;
export const NEWZEALAND_SPAWN=Object.freeze({x:0,z:4.4});
export const WETAPUNGA_BRANCH=Object.freeze({minX:-1.5,maxX:1.3,top:.94,bottom:.62,halfWidth:.26,topHalfWidth:.20});
export const WETAPUNGA_HOME=Object.freeze({x:0,y:WETAPUNGA_BRANCH.top+D.rootAboveSupport,z:0});
export const WETAPUNGA_SUPPORT=Object.freeze({home:WETAPUNGA_HOME,orientation:Object.freeze({x:0,y:Math.SQRT1_2,z:0,w:Math.SQRT1_2}),axis:Object.freeze({x:1,y:0,z:0}),normal:Object.freeze({x:0,y:1,z:0}),retreatBounds:Object.freeze({min:-.24,max:.24})});
export const WETAPUNGA_APPROACH=Object.freeze({x:0,z:1.45});
export const WETAPUNGA_ROUTE=Object.freeze([[0,4.4],[0,1.45],[1.95,1.45],[1.95,-1.3],[0,-1.3]].map(([x,z])=>Object.freeze({x,z})));
export const NEWZEALAND_TREES=Object.freeze([[-1.35,0,.24],[-4.2,-2.8,.23],[4.2,-3.5,.24],[-4.8,3.5,.25],[4.8,3,.25]].map(([x,z,r])=>Object.freeze({x,z,r})));
