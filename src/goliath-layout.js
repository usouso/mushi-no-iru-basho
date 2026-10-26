/** Cameroon-reference forest-edge display slice. Low branches, trail and timing
 * are observation/game choices, not measured wild perch heights. */
export const FOREST_BOUNDS=14;
export const FOREST_SPAWN=Object.freeze({x:0,z:9});
export const FOREST_ROUTE=Object.freeze([[0,9],[0,6],[0,3],[0,.5],[1.25,-2],[1.25,-4.2],[.5,-7]].map(Object.freeze));
export const FOREST_TREES=Object.freeze([
 Object.freeze({id:'forest-tree-1',x:-3.2,z:3,radius:.58,height:8.4}),
 Object.freeze({id:'forest-tree-2',x:4.5,z:-4.2,radius:.65,height:9.2})
]);
export const GOLIATH_SITES=Object.freeze([
 Object.freeze({id:'forest-branch-1',treeId:'forest-tree-1',x:-2.15,z:3,heading:Math.PI/2,branchStart:-3.35,branchEnd:-1.25,surfaceAboveGround:1.10}),
 Object.freeze({id:'forest-branch-2',treeId:'forest-tree-2',x:3.45,z:-4.2,heading:-Math.PI/2,branchStart:2.55,branchEnd:4.65,surfaceAboveGround:1.14})
]);
export const GOLIATH_RETREAT_BOUNDS=Object.freeze({min:-.24,max:.24});
// Approach centres stay outside actual trunk/branch walking colliders.
export const GOLIATH_APPROACHES=Object.freeze([
 Object.freeze({x:0,z:3}),Object.freeze({x:1.25,z:-4.2})
]);
// 0.130m half-width of the real flat octagon face, compared with 0.105m feet.
export const GOLIATH_BRANCH_RADIUS=.34;
