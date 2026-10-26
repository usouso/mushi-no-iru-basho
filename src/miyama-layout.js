/** One existing south-east oak triangle. Positions and short climbing lane are
 * game staging, not measured wild resting height or an escape-distance claim. */
export const MIYAMA_PROBE=Object.freeze({
 surface:Object.freeze({x:-9.53308629989624,y:.8002728226780892,z:-7.7340997505188}),
 outward:Object.freeze({x:.86534130940114,y:.031076025395847345,z:.5002186510812218}),
 faceIndex:3,rootAboveSupport:.055,footRadius:.145,pathLength:.08,
});
export const MIYAMA_APPROACH=Object.freeze([[0,10],[-4,3],[-5,-3],[-7.5,-5.5],[-8.23,-6.98]].map(p=>Object.freeze({x:p[0],z:p[1]})));
export const MIYAMA_CAPTURE_SPOTS=Object.freeze([{x:-8.23,z:-6.98},{x:-8.55,z:-6.35}].map(Object.freeze));
