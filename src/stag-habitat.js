/** A second live branch of the existing rhino tree; old geometry stays untouched. */
import {STAG_BRANCH as B,STAG_ORIGIN as O} from './stag-layout.js?v=0.16.0&b=ef7356bcd944';
import {STAG_DIMENSIONS as D} from './stag-kinematics.js?v=0.16.0&b=ef7356bcd944';
const T=window.THREE;
function collector(){const p=[],c=[];return{add(g,m,color){const copy=g.index?g.toNonIndexed():g.clone();copy.applyMatrix4(m);p.push(...copy.attributes.position.array);const tint=new T.Color(color);for(let i=0;i<copy.attributes.position.count;i++)c.push(tint.r,tint.g,tint.b);copy.dispose();},finish(){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('color',new T.Float32BufferAttribute(c,3));g.computeVertexNormals();g.computeBoundingSphere();return g;}};}
function segment(batch,a,b,r0,r1){const start=new T.Vector3(...a),delta=new T.Vector3(...b).sub(start),g=new T.CylinderGeometry(r1,r0,delta.length(),4),m=new T.Matrix4().compose(start.addScaledVector(delta,.5),new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize()),new T.Vector3(1,1,1));batch.add(g,m,'#65765b');g.dispose();}
export function createStagHabitat(world,scene){
 const ground=scene?.getObjectByName('night-ground'),sharedTree=scene?.getObjectByName('rhino-living-tree-wood');
 if(!scene?.isScene||!ground?.isMesh||!sharedTree?.isMesh||typeof world?.heightAt!=='function')throw new TypeError('Existing night and living rhino tree required');
 ground.updateWorldMatrix(true,false);sharedTree.updateWorldMatrix(true,false);
 const ray=new T.Raycaster(new T.Vector3(B.x,10,2),new T.Vector3(0,-1,0),0,20),hit=ray.intersectObject(ground,false)[0];if(!hit)throw new Error('Shared tree terrain missing');
 const topY=hit.point.y+B.surfaceAboveGround,axisY=topY-B.radius*Math.cos(Math.PI/8),join=new T.Vector3(B.x,axisY,2.05);
 // Existing solid must enclose the new branch joint, not just have a matching name.
 for(const direction of[[-1,0,0],[0,1,0]]){
  // Check entry rays without mutating the existing front-sided material.
  const outward=new T.Vector3(...direction),origin=join.clone().addScaledVector(outward,5);ray.set(origin,outward.negate());ray.far=5;const entry=ray.intersectObject(sharedTree,false)[0];
  if(!entry||entry.distance>=4.9)throw new Error('New branch is disconnected from the living tree');
 }
 const wood=collector(),leaves=collector(),positions=[],index=[];for(const z of[B.startZ,B.endZ])for(let i=0;i<8;i++){const a=Math.PI/8+i*Math.PI/4;positions.push(B.x+Math.sin(a)*B.radius,axisY+Math.cos(a)*B.radius,z);}positions.push(B.x,axisY,B.startZ,B.x,axisY,B.endZ);
 for(let i=0;i<8;i++){const j=(i+1)%8;index.push(i,8+j,j,i,8+i,8+j,16,i,j,17,8+j,8+i);}
 const branch=new T.BufferGeometry();branch.setAttribute('position',new T.Float32BufferAttribute(positions,3));branch.setIndex(index);branch.computeVertexNormals();wood.add(branch,new T.Matrix4(),'#69715d');branch.dispose();
 // A small, attached living sprig beyond the walking/jaw envelope, not another tree.
 const sprig=[-5.1,topY+.70,3.80];segment(wood,[B.x,axisY,3.64],sprig,.05,.012);
 const outline=[0,0,0,0,0,.24,.08,0,.09,.07,0,-.07,0,0,-.16,-.07,0,-.07,-.08,0,.09],leafG=new T.BufferGeometry();leafG.setAttribute('position',new T.Float32BufferAttribute(outline,3));const li=[];for(let i=0;i<6;i++)li.push(0,i+1,(i+1)%6+1);leafG.setIndex(li);leafG.computeVertexNormals();
 for(let i=0;i<3;i++){const a=(i-1)*1.3,position=new T.Vector3(sprig[0]+Math.sin(a)*.22,sprig[1]+i*.06,sprig[2]+Math.cos(a)*.18),q=new T.Quaternion().setFromEuler(new T.Euler(.15,a,.10)),m=new T.Matrix4().compose(position,q,new T.Vector3(1,1,1)),base=new T.Vector3(0,0,-.16).applyMatrix4(m),normal=new T.Vector3(0,1,0).applyQuaternion(q);leaves.add(leafG,m,i===1?'#6b8065':'#59715c');segment(wood,[sprig[0],sprig[1]-.02,sprig[2]],base.addScaledVector(normal,.003).toArray(),.007,.003);}
 leafG.dispose();
 const timber=new T.Mesh(wood.finish(),new T.MeshLambertMaterial({vertexColors:true}));timber.name='stag-shared-tree-branch';timber.castShadow=timber.receiveShadow=true;const foliage=new T.Mesh(leaves.finish(),new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide}));foliage.name='stag-shared-tree-sprig';foliage.castShadow=foliage.receiveShadow=true;scene.add(timber,foliage);timber.updateMatrixWorld(true);foliage.updateMatrixWorld(true);
 const home={x:O.x,y:topY+D.rootAboveSupport,z:O.z},colliders=Array.from({length:7},(_,i)=>({x:B.x,z:B.startZ+i*.30,r:Math.hypot(.30,.15)}));
 return{homes:[['stag',home.x,home.z,home.y-world.heightAt(home.x,home.z)]],stagSupports:[{home,heading:O.heading}],colliders,captureOccluders:[timber],stats:Object.freeze({addedMeshes:2,addedTriangles:(timber.geometry.attributes.position.count+foliage.geometry.attributes.position.count)/3,addedTextures:0,entryRays:3})};
}
