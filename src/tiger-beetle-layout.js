/** Original game-tuned short-hop sites on the unchanged east meadow path; not measured wild flight distances. */
const freeze=o=>{for(const v of Object.values(o))if(v&&typeof v==='object')freeze(v);return Object.freeze(o);};
export const TIGER_BEETLE_ROOT_HEIGHT=.05;
export const TIGER_BEETLE_SITES=freeze([{x:30.25,z:-11.30},{x:31.20,z:-11.80},{x:31.65,z:-12.70}]);
export const TIGER_BEETLE_HEADING=freeze({x:7,z:-8});
export const TIGER_BEETLE_APPROACH=freeze([{x:29,z:-10},{x:29.55,z:-10.6},{x:30.25,z:-9.9}]);
// Canonical actual Float32 terrain-triangle result; habitat independently rechecks it.
export const TIGER_BEETLE_STOPS=freeze([{"position":{"x":30.250341490805614,"y":0.3890458363722888,"z":-11.299998549113774},"orientation":{"x":0.0032018334807723077,"y":0.9360993159758252,"z":-0.0011875209056265293,"w":0.35171921853383603}},{"position":{"x":31.200520826130937,"y":0.3806571935518064,"z":-11.799998549158651},"orientation":{"x":0.004880661324172118,"y":0.936094771906819,"z":-0.001818262156612172,"w":0.3517093275369436}},{"position":{"x":31.650520825214606,"y":0.3751699523447206,"z":-12.70009380303494},"orientation":{"x":0.004545629493101549,"y":0.9360944385130706,"z":-0.002709949858055402,"w":0.3517089643571477}}]);
