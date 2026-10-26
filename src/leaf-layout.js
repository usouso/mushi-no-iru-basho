/* Independent understory study, metres / Y up. No exact country or season claim. */
export const LEAF_BOUNDS = 24;
export const LEAF_SPAWN = Object.freeze({x:0,z:10});
export const LEAF_HOMES = Object.freeze([
  Object.freeze(['leafinsect',0,4,1.30]),
  Object.freeze(['leafinsect',-5,-3,1.42]),
  Object.freeze(['leafinsect',5,-9,1.22]),
]);
// A walkable opening, not a displayed objective line.
export const LEAF_ROUTE = Object.freeze([[0,10],[0,4],[-5,-3],[5,-9],[9,-3],[4,3],[0,10]].map(Object.freeze));
export const LEAF_WALK_HALF_LENGTH = .30;
