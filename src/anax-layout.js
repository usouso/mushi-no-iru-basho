/** Original observation staging, not measured wild perch/flight dimensions. */
const freeze=o=>{for(const v of Object.values(o))if(v&&typeof v==='object')freeze(v);return Object.freeze(o);};
export const ANAX_STEM=freeze({x:14.5,z:-16,radius:.025,radialSegments:16,thetaStart:0,groundY:.0534273960203393,bottomY:.0334273960203393,topY:1.7272420992307836});
export const ANAX_PERCH=freeze({position:{x:14.43,y:1.5272420992307836,z:-16},orientation:{x:-.5,y:.5,z:.5,w:.5},normal:{x:-1,y:0,z:0}});
export const ANAX_SUPPORT=freeze({home:{...ANAX_PERCH.position},orientation:{...ANAX_PERCH.orientation},normal:{...ANAX_PERCH.normal},stem:{...ANAX_STEM}});
// Caller-owned route data. The pure study does not hardcode these coordinates.
export const ANAX_PATROL=freeze([{x:13.73,y:1.7272420992307836,z:-16.7},{x:18,y:1.65,z:-24},{x:25,y:1.65,z:-24},{x:27,y:1.65,z:-17},{x:20,y:1.65,z:-12}]);
export const ANAX_APPROACHES=freeze([{x:13.1,z:-16},{x:14.1,z:-14.6},{x:15,z:-16}]);
export const ANAX_APPROACH_ROUTE=freeze([[13,-10],[13,-16],[13,-14.6],[15,-14.6],[15,-16]].map(([x,z])=>({x,z})));
