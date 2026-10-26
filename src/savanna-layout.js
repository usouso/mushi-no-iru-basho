/** Small observation-adjusted daytime grassland, not a complete wild habitat. */
export const SAVANNA_BOUNDS=24;
export const SAVANNA_SPAWN=Object.freeze({x:0,z:8});
export const DUNG_ORIGIN=Object.freeze({x:0,y:0,z:4});
export const DUNG_HOME=Object.freeze({x:0,y:.08,z:3.84});
export const SAVANNA_HOMES=Object.freeze([Object.freeze(['dungbeetle',DUNG_HOME.x,DUNG_HOME.z,DUNG_HOME.y])]);
export const SAVANNA_DUNG_SUPPORTS=Object.freeze([Object.freeze({home:DUNG_HOME,origin:DUNG_ORIGIN})]);
export const SAVANNA_APPROACHES=Object.freeze([[0,8],[-1.3,5],[1.3,5],[-1.3,3.84],[1.3,3.84]].map(Object.freeze));
