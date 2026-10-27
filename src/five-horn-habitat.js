/** One sloping facet attached to the existing living tree. No new foliage,
 * bait or feeding claim, and no edits to the older world/observation branches. */
import {FIVE_HORN_BRANCH as B,FIVE_HORN_TREE as TREE} from './five-horn-layout.js?v=0.40.0&b=8b1b975eded1';
import {FIVE_HORN_DIMENSIONS as D} from './five-horn-kinematics.js?v=0.40.0&b=8b1b975eded1';
const T=window.THREE;
export function createFiveHornHabitat(world,scene){
 const ground=scene?.getObjectByName('understory-ground'),treeWood=scene?.getObjectByName('understory-trunks');
 if(!scene?.isScene||!ground?.isMesh||!treeWood?.isMesh||typeof world?.heightAt!=='function'||!world.colliders?.some(c=>Math.hypot(c.x-TREE.x,c.z-TREE.z)<1e-6))throw new TypeError('Existing understory living tree required');
 ground.updateWorldMatrix(true,false);treeWood.updateWorldMatrix(true,false);const ray=new T.Raycaster(new T.Vector3(B.startX,10,B.z),new T.Vector3(0,-1,0),0,20),floor=ray.intersectObject(ground,false)[0];if(!floor)throw new Error('Five-horn branch terrain missing');
 const theta=B.slopeDegrees*Math.PI/180,low=new T.Vector3(B.startX,floor.point.y+B.lowTopAboveGround,B.z),high=new T.Vector3(B.endX,low.y+(B.endX-B.startX)*Math.tan(theta),B.z),up=high.clone().sub(low).normalize(),normal=new T.Vector3(-up.y,up.x,0),right=new T.Vector3(0,0,1),drop=B.verticalRadius*Math.cos(Math.PI/8),c0=low.clone().addScaledVector(normal,-drop),c1=high.clone().addScaledVector(normal,-drop),delta=c1.clone().sub(c0),length=delta.length();
 ray.set(c0,delta.normalize());ray.far=length;const join=ray.intersectObject(treeWood,false)[0];if(!join||join.distance>length-.08)throw new Error('Five-horn slope must enter the actual living trunk');
 const positions=[],indices=[],colours=[],color=new T.Color('#968a65');
 for(const center of[c0,c1])for(let i=0;i<8;i++){const a=Math.PI/8+i*Math.PI/4,p=center.clone().addScaledVector(normal,B.verticalRadius*Math.cos(a)).addScaledVector(right,B.lateralRadius*Math.sin(a));positions.push(...p.toArray());}positions.push(...c0.toArray(),...c1.toArray());
 for(let i=0;i<8;i++){const j=(i+1)%8;indices.push(i,j,8+j,i,8+j,8+i,16,j,i,17,8+i,8+j);}for(let i=0;i<positions.length/3;i++)colours.push(color.r,color.g,color.b);
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new T.Float32BufferAttribute(colours,3));geometry.setIndex(indices);geometry.computeVertexNormals();geometry.computeBoundingSphere();const timber=new T.Mesh(geometry,new T.MeshLambertMaterial({vertexColors:true}));timber.name='fivehorn-living-tree-slope';timber.castShadow=timber.receiveShadow=true;scene.add(timber);timber.updateMatrixWorld(true);
 const rootAt=x=>{const v=low.clone().lerp(high,(x-B.startX)/(B.endX-B.startX)).addScaledVector(normal,D.rootAboveSupport);return{x:v.x,y:v.y,z:v.z};},axis=[rootAt(B.laneStartX),rootAt(B.laneEndX)],home={x:(axis[0].x+axis[1].x)/2,y:(axis[0].y+axis[1].y)/2,z:(axis[0].z+axis[1].z)/2},segments=Math.ceil((B.endX-B.startX)/.25),radius=Math.hypot(B.lateralRadius,(B.endX-B.startX)/(segments*2)),colliders=Array.from({length:segments+1},(_,i)=>({x:c0.x+(c1.x-c0.x)*i/segments,z:B.z,r:radius}));let disposed=false;
 return{homes:[['fivehorn',home.x,home.z,home.y-world.heightAt(home.x,home.z)]],fiveHornSupports:[{home,axis}],colliders,captureOccluders:[timber],stats:Object.freeze({addedMeshes:1,addedTriangles:indices.length/3,addedTextures:0,slopeDegrees:B.slopeDegrees}),dispose(){if(disposed)return;disposed=true;geometry.dispose();timber.material.dispose();scene.remove(timber);}};
}
