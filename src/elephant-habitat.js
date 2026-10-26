/** One additive living-tree connector and sloping observation support. Existing
 * trees, terrain, Hercules logs/fruit and ant geometry remain untouched. */
import {ELEPHANT_BRANCH as B,ELEPHANT_TREE as TREE} from './elephant-layout.js?v=0.26.0&b=b8d401c0400d';
import {ELEPHANT_DIMENSIONS as D} from './elephant-kinematics.js?v=0.26.0&b=b8d401c0400d';
const T=window.THREE;
function collector(){const p=[],c=[];return{add(g,m,color){const copy=g.index?g.toNonIndexed():g.clone();copy.applyMatrix4(m);p.push(...copy.attributes.position.array);const tint=new T.Color(color);for(let i=0;i<copy.attributes.position.count;i++)c.push(tint.r,tint.g,tint.b);copy.dispose();},finish(){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('color',new T.Float32BufferAttribute(c,3));g.computeVertexNormals();g.computeBoundingSphere();return g;}};}
function circles(a,b,r){const length=Math.hypot(b.x-a.x,b.z-a.z),n=Math.max(1,Math.ceil(length/.30)),radius=Math.hypot(r,length/n/2);return Array.from({length:n+1},(_,i)=>({x:a.x+(b.x-a.x)*i/n,z:a.z+(b.z-a.z)*i/n,r:radius}));}
export function createElephantHabitat(world,scene){
 const ground=scene?.getObjectByName('tropical-ground'),trees=scene?.getObjectByName('tropical-trunks');
 if(!scene?.isScene||!ground?.isMesh||!trees?.isMesh||typeof world?.heightAt!=='function'||!world.colliders?.some(c=>Math.hypot(c.x-TREE.x,c.z-TREE.z)<1e-6))throw new TypeError('Existing tropical living tree required');
 ground.updateWorldMatrix(true,false);trees.updateWorldMatrix(true,false);const ray=new T.Raycaster();
 function floor(x,z){ray.set(new T.Vector3(x,10,z),new T.Vector3(0,-1,0));ray.far=20;const hit=ray.intersectObject(ground,false)[0];if(!hit)throw new Error('Elephant support terrain missing');return hit.point.y;}
 const low=new T.Vector3(B.startX,floor(B.startX,B.z)+B.lowTopAboveGround,B.z),high=new T.Vector3(B.endX,floor(B.endX,B.z)+B.highTopAboveGround,B.z),u=high.clone().sub(low).normalize(),normal=new T.Vector3(-u.y,u.x,0),right=new T.Vector3(0,0,1),rise=B.verticalRadius*Math.cos(Math.PI/8),c0=low.clone().addScaledVector(normal,-rise),c1=high.clone().addScaledVector(normal,-rise),attach=new T.Vector3(TREE.x,floor(TREE.x,TREE.z)+TREE.attachAboveGround,TREE.z);
 const toTree=attach.clone().sub(c0),distance=toTree.length();ray.set(c0.clone(),toTree.normalize());ray.far=distance;const entry=ray.intersectObject(trees,false)[0];if(!entry||entry.distance>distance-.10)throw new Error('Elephant connector must enter the existing tree');
 ray.set(attach.clone().add(new T.Vector3(-5,0,0)),new T.Vector3(1,0,0));ray.far=5;if(!ray.intersectObject(trees,false).some(hit=>hit.distance<4.9))throw new Error('Elephant connector endpoint is outside the trunk');
 const batch=collector(),p=[],idx=[];
 for(const center of[c0,c1])for(let i=0;i<8;i++){const angle=Math.PI/8+i*Math.PI/4,point=center.clone().addScaledVector(normal,B.verticalRadius*Math.cos(angle)).addScaledVector(right,B.lateralRadius*Math.sin(angle));p.push(...point.toArray());}p.push(...c0.toArray(),...c1.toArray());
 for(let i=0;i<8;i++){const j=(i+1)%8;idx.push(i,j,8+j,i,8+j,8+i,16,j,i,17,8+i,8+j);}
 const branch=new T.BufferGeometry();branch.setAttribute('position',new T.Float32BufferAttribute(p,3));branch.setIndex(idx);branch.computeVertexNormals();batch.add(branch,new T.Matrix4(),'#918e70');branch.dispose();
 const delta=c0.clone().sub(attach),connector=new T.CylinderGeometry(.18,TREE.connectorRadius,delta.length(),8),matrix=new T.Matrix4().compose(attach.clone().addScaledVector(delta,.5),new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize()),new T.Vector3(1,1,1));batch.add(connector,matrix,'#85846a');connector.dispose();
 const timber=new T.Mesh(batch.finish(),new T.MeshLambertMaterial({vertexColors:true}));timber.name='elephant-living-tree-low-branch';timber.castShadow=timber.receiveShadow=true;scene.add(timber);timber.updateMatrixWorld(true);
 const rootAt=x=>{const t=(x-B.startX)/(B.endX-B.startX),v=low.clone().lerp(high,t).addScaledVector(normal,D.rootAboveSupport);return{x:v.x,y:v.y,z:v.z};},axis=[rootAt(B.laneStartX),rootAt(B.laneEndX)],home={x:(axis[0].x+axis[1].x)/2,y:(axis[0].y+axis[1].y)/2,z:(axis[0].z+axis[1].z)/2};
 return{homes:[['elephant',home.x,home.z,home.y-world.heightAt(home.x,home.z)]],elephantSupports:[{home,axis}],colliders:[...circles(c0,c1,B.lateralRadius),...circles(attach,c0,TREE.connectorRadius)],captureOccluders:[timber],stats:Object.freeze({addedMeshes:1,addedTriangles:timber.geometry.attributes.position.count/3,addedTextures:0,entryRays:5})};
}
