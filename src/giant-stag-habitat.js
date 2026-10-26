/** Additive western support and one low bark hood; existing night tree, terrain
 * and old beetle branches are neither cut nor edited. No food/visibility rule. */
import {RHINO_TREE as TREE} from './rhino-layout.js?v=0.37.0&b=4d59dc9955d7';
import {GIANT_STAG_BRANCH as B,GIANT_STAG_ORIGIN as O,GIANT_STAG_RETREAT_BOUNDS as LIMITS,GIANT_STAG_COVER as C} from './giant-stag-layout.js?v=0.37.0&b=4d59dc9955d7';
import {GIANT_STAG_DIMENSIONS as D} from './giant-stag-kinematics.js?v=0.37.0&b=4d59dc9955d7';
const T=window.THREE;
function collector(){const p=[],c=[];return{add(g,m,color){const copy=g.index?g.toNonIndexed():g.clone();copy.applyMatrix4(m);p.push(...copy.attributes.position.array);const tint=new T.Color(color);for(let i=0;i<copy.attributes.position.count;i++)c.push(tint.r,tint.g,tint.b);copy.dispose();},finish(){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('color',new T.Float32BufferAttribute(c,3));g.computeVertexNormals();g.computeBoundingSphere();return g;}};}
function box(batch,min,max,color){const size=new T.Vector3(...max).sub(new T.Vector3(...min)),center=new T.Vector3(...min).addScaledVector(size,.5),g=new T.BoxGeometry(size.x,size.y,size.z);batch.add(g,new T.Matrix4().makeTranslation(center.x,center.y,center.z),color);g.dispose();}
function mesh(batch,name){const m=new T.Mesh(batch.finish(),new T.MeshLambertMaterial({vertexColors:true}));m.name=name;m.castShadow=m.receiveShadow=true;return m;}
export function createGiantStagHabitat(world,scene){
 const ground=scene?.getObjectByName('night-ground'),tree=scene?.getObjectByName('rhino-living-tree-wood');
 if(!scene?.isScene||!ground?.isMesh||!tree?.isMesh||typeof world?.heightAt!=='function')throw new TypeError('Existing night terrain and living rhino tree required');
 ground.updateWorldMatrix(true,false);tree.updateWorldMatrix(true,false);
 const ray=new T.Raycaster(new T.Vector3(TREE.x,10,TREE.z),new T.Vector3(0,-1,0),0,20),hit=ray.intersectObject(ground,false)[0];
 if(!hit)throw new Error('Giant-stag tree terrain missing');
 const topY=hit.point.y+B.surfaceAboveGround,axisY=topY-B.radius*Math.cos(Math.PI/8),join=new T.Vector3(B.endX,axisY,B.z);
 for(const direction of[[-1,0,0],[0,1,0]]){const outward=new T.Vector3(...direction);ray.set(join.clone().addScaledVector(outward,5),outward.negate());ray.far=5;const entry=ray.intersectObject(tree,false)[0];if(!entry||entry.distance>=4.9)throw new Error('Giant-stag branch must enter the existing living tree');}
 const wood=collector(),hood=collector(),positions=[],indices=[];
 for(const x of[B.startX,B.endX])for(let i=0;i<8;i++){const a=Math.PI/8+i*Math.PI/4;positions.push(x,axisY+Math.cos(a)*B.radius,B.z+Math.sin(a)*B.radius);}positions.push(B.startX,axisY,B.z,B.endX,axisY,B.z);
 for(let i=0;i<8;i++){const j=(i+1)%8;indices.push(i,j,8+j,i,8+j,8+i,16,j,i,17,8+i,8+j);}
 const branch=new T.BufferGeometry();branch.setAttribute('position',new T.Float32BufferAttribute(positions,3));branch.setIndex(indices);branch.computeVertexNormals();wood.add(branch,new T.Matrix4(),'#69715d');branch.dispose();
 box(hood,[C.startX,topY+C.bottomAboveSupport,C.minZ],[C.endX,topY+C.bottomAboveSupport+C.thickness,C.maxZ],'#6c6555');
 box(hood,[C.startX,topY+C.wallBottomAboveSupport,C.wallInnerZ],[C.endX,topY+C.bottomAboveSupport+C.thickness,C.wallOuterZ],'#5a5142');
 const timber=mesh(wood,'giantstag-west-support'),cover=mesh(hood,'giantstag-bark-shelter');scene.add(timber,cover);timber.updateMatrixWorld(true);cover.updateMatrixWorld(true);
 const home={x:O.x,y:topY+D.rootAboveSupport,z:O.z},colliders=Array.from({length:6},(_,i)=>({x:B.startX+i*(B.endX-B.startX)/5,z:B.z,r:Math.hypot(B.radius,.15)}));
 return{homes:[['giantstag',home.x,home.z,home.y-world.heightAt(home.x,home.z)]],giantStagSupports:[{home,heading:O.heading,retreatBounds:{...LIMITS}}],colliders,captureOccluders:[timber,cover],stats:Object.freeze({addedMeshes:2,addedTriangles:(timber.geometry.attributes.position.count+cover.geometry.attributes.position.count)/3,addedTextures:0,entryRays:3})};
}
