/** One authored battle-collection grove; metres, Y up. No persistence IDs. */
export const GROVE_BOUNDS=32;
export const GROVE_SPAWN=Object.freeze({x:0,z:10});
export const GROVE_ROUTE=Object.freeze([[0,10],[0,3],[-2,2],[-2,-2],[1,-5],[7,-5],[8,-8],[4,-12],[4,-13.4]].map(([x,z])=>Object.freeze({x,z})));
export const GROVE_ARENA=Object.freeze({x:4,z:-17,radius:2.7,gateZ:-12,interactX:4,interactZ:-13.4,interactRadius:2.1});
export const GROVE_APPROACHES=Object.freeze({rhino:Object.freeze({x:-2,z:2}),stag:Object.freeze({x:-3.1,z:4}),hercules:Object.freeze({x:10,z:-3.5})});
export const GROVE_SPECIES=Object.freeze(['rhino','stag','hercules']);
export function groveRouteDistance(x,z){let best=Infinity;for(let i=1;i<GROVE_ROUTE.length;i++){const a=GROVE_ROUTE[i-1],b=GROVE_ROUTE[i],dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz)));best=Math.min(best,Math.hypot(x-a.x-dx*t,z-a.z-dz*t));}return best;}
