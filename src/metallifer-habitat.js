/** New attached low trunk / branch; existing forest meshes are never edited. */
import {METALLIFER_BRANCH as B,METALLIFER_ORIGIN as O} from './metallifer-layout.js?v=0.41.0&b=bed5219b02cd';
const T=window.THREE;
function collector(){const p=[],c=[];return{add(g,m,color){const copy=g.index?g.toNonIndexed():g.clone();copy.applyMatrix4(m);p.push(...copy.attributes.position.array);const tint=new T.Color(color);for(let i=0;i<copy.attributes.position.count;i++)c.push(tint.r,tint.g,tint.b);copy.dispose();},finish(){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('color',new T.Float32BufferAttribute(c,3));g.computeVertexNormals();g.computeBoundingSphere();return g;}};}
function segment(batch,a,b,r0,r1,color='#68725b'){const from=new T.Vector3(...a),delta=new T.Vector3(...b).sub(from),g=new T.CylinderGeometry(r1,r0,delta.length(),8),m=new T.Matrix4().compose(from.addScaledVector(delta,.5),new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize()),new T.Vector3(1,1,1));batch.add(g,m,color);g.dispose();}
export function createMetalliferHabitat(world,scene){
 const ground=scene?.getObjectByName('understory-ground');
 if(!scene?.isScene||!ground?.isMesh||typeof world?.heightAt!=='function')throw new TypeError('Existing understory world required');
 ground.updateWorldMatrix(true,false);
 const ray=new T.Raycaster(new T.Vector3(B.x,10,B.trunkZ),new T.Vector3(0,-1,0),0,20),hit=ray.intersectObject(ground,false)[0];
 if(!hit)throw new Error('Metallifer support terrain missing');
 const baseY=hit.point.y,topY=baseY+B.surfaceAboveGround,axisY=topY-B.radius*Math.cos(Math.PI/8),wood=collector(),leaves=collector();
 // Root sunk 4 cm into actual ground; trunk overlaps the branch's rear joint.
 segment(wood,[B.x,baseY-.04,B.trunkZ],[B.x,baseY+B.trunkHeight,B.trunkZ],B.trunkRadius,.13);
 const p=[],idx=[];for(const z of[B.startZ,B.endZ])for(let i=0;i<8;i++){const a=Math.PI/8+i*Math.PI/4;p.push(B.x+Math.sin(a)*B.radius,axisY+Math.cos(a)*B.radius,z);}p.push(B.x,axisY,B.startZ,B.x,axisY,B.endZ);
 for(let i=0;i<8;i++){const j=(i+1)%8;idx.push(i,8+j,j,i,8+i,8+j,16,i,j,17,8+j,8+i);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();wood.add(g,new T.Matrix4(),'#728066');g.dispose();
 const tip=[B.x-.62,baseY+B.trunkHeight+.12,B.trunkZ-.12];segment(wood,[B.x,baseY+B.trunkHeight-.3,B.trunkZ],tip,.065,.015);
 const leaf=new T.BufferGeometry();leaf.setAttribute('position',new T.Float32BufferAttribute([0,0,0,0,0,.30,.10,0,.11,.08,0,-.10,0,0,-.24,-.08,0,-.10,-.10,0,.11],3));const li=[];for(let i=0;i<6;i++)li.push(0,i+1,(i+1)%6+1);leaf.setIndex(li);leaf.computeVertexNormals();
 for(let i=0;i<3;i++){const q=new T.Quaternion().setFromEuler(new T.Euler(.15,i*1.8,.12)),center=new T.Vector3(tip[0]-.05,tip[1]+i*.06,tip[2]-.08),m=new T.Matrix4().compose(center,q,new T.Vector3(1,1,1)),petiole=new T.Vector3(0,0,-.24).applyMatrix4(m);leaves.add(leaf,m,['#68815c','#799067','#5d7955'][i]);segment(wood,tip,petiole.toArray(),.007,.003);}
 leaf.dispose();
 const timber=new T.Mesh(wood.finish(),new T.MeshLambertMaterial({vertexColors:true}));timber.name='metallifer-observation-tree';timber.castShadow=timber.receiveShadow=true;
 const foliage=new T.Mesh(leaves.finish(),new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide}));foliage.name='metallifer-observation-sprig';foliage.castShadow=foliage.receiveShadow=true;
 scene.add(timber,foliage);timber.updateMatrixWorld(true);foliage.updateMatrixWorld(true);
 const home={x:O.x,y:topY,z:O.z};
 const colliders=Array.from({length:7},(_,i)=>({x:B.x,z:B.startZ+(B.endZ-B.startZ)*i/6,r:Math.hypot(B.radius,(B.endZ-B.startZ)/12)}));
 colliders.push({x:B.x,z:B.trunkZ,r:B.trunkRadius});
 return {homes:[['metallifer',home.x,home.z,home.y-world.heightAt(home.x,home.z)]],metalliferSupports:[{home,heading:O.heading}],colliders,captureOccluders:[timber],stats:Object.freeze({addedMeshes:2,addedTriangles:(timber.geometry.attributes.position.count+foliage.geometry.attributes.position.count)/3,addedTextures:0})};
}
