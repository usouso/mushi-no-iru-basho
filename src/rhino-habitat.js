/** Additive, scene-owned living tree and one flat bark facet. No food mechanic/RNG. */
import {RHINO_TREE as TREE,RHINO_BRANCH as BRANCH,RHINO_ORIGIN as ORIGIN, RHINO_RETREAT_LIMITS as RETREAT} from './rhino-layout.js?v=0.21.0&b=80addd8ed820';
import {RHINO_DIMENSIONS as D} from './rhino-kinematics.js?v=0.21.0&b=80addd8ed820';
const T=window.THREE;
function collector(){const positions=[],colors=[];return{add(g,m,tint){const copy=g.index?g.toNonIndexed():g.clone();copy.applyMatrix4(m);positions.push(...copy.attributes.position.array);const c=new T.Color(tint);for(let i=0;i<copy.attributes.position.count;i++)colors.push(c.r,c.g,c.b);copy.dispose();},finish(){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();g.computeBoundingSphere();return g;}};}
function segment(batch,a,b,r0,r1,color,sides=8){const start=new T.Vector3(...a),delta=new T.Vector3(...b).sub(start),g=new T.CylinderGeometry(r1,r0,delta.length(),sides),m=new T.Matrix4().compose(start.addScaledVector(delta,.5),new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize()),new T.Vector3(1,1,1));batch.add(g,m,color);g.dispose();}
export function createRhinoHabitat(world,scene){
 const ground=scene?.getObjectByName('night-ground');
 if(!scene?.isScene||!ground?.isMesh||typeof world?.heightAt!=='function'||!Array.isArray(world?.colliders))throw new TypeError('Existing night terrain required');
 ground.updateWorldMatrix(true,false);const ray=new T.Raycaster(new T.Vector3(TREE.x,10,TREE.z),new T.Vector3(0,-1,0),0,20),hit=ray.intersectObject(ground,false)[0];
 if(!hit||!Number.isFinite(hit.point.y))throw new Error('Live tree needs terrain support');
 const groundY=hit.point.y,topY=groundY+BRANCH.surfaceAboveGround,axisY=topY-BRANCH.radius*Math.cos(Math.PI/8),wood=collector(),foliage=collector(),identity=new T.Matrix4();
 segment(wood,[TREE.x,groundY-.04,TREE.z],[TREE.x,groundY+TREE.height,TREE.z],TREE.trunkRadius,.17,'#58675b',10);
 for(let i=0;i<4;i++){const a=i*Math.PI/2+.3,x=TREE.x+Math.cos(a)*.75,z=TREE.z+Math.sin(a)*.75,y=world.heightAt(x,z);if(!Number.isFinite(y))throw new Error('Invalid root terrain');segment(wood,[TREE.x,groundY+.24,TREE.z],[x,y-.025,z],.13,.045,'#536153',6);}
 // Explicit octagon: top two vertices share exactly topY, not a rotated rounded trunk.
 const vertices=[],index=[];for(const x of[BRANCH.startX,BRANCH.endX])for(let i=0;i<8;i++){const a=Math.PI/8+i*Math.PI/4;vertices.push(x,axisY+Math.cos(a)*BRANCH.radius,BRANCH.z+Math.sin(a)*BRANCH.radius);}
 vertices.push(BRANCH.startX,axisY,BRANCH.z,BRANCH.endX,axisY,BRANCH.z);
 for(let i=0;i<8;i++){const j=(i+1)%8;index.push(i,j,8+j,i,8+j,8+i,16,j,i,17,8+i,8+j);}
 const branchGeometry=new T.BufferGeometry();branchGeometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));branchGeometry.setIndex(index);branchGeometry.computeVertexNormals();wood.add(branchGeometry,identity,'#69715d');branchGeometry.dispose();
 // A small fixed damp-looking bark mark near the living branch junction. No glow/feeding.
 const stain=[],stainY=topY+.0003;for(let i=0;i<8;i++){const a=i*Math.PI/4,b=(i+1)*Math.PI/4;stain.push(-4.30,stainY,2,-4.30+Math.cos(b)*.05,stainY,2+Math.sin(b)*.032,-4.30+Math.cos(a)*.05,stainY,2+Math.sin(a)*.032);}
 const stainG=new T.BufferGeometry();stainG.setAttribute('position',new T.Float32BufferAttribute(stain,3));stainG.computeVertexNormals();wood.add(stainG,identity,'#4f4532');stainG.dispose();
 const leafPoints=[0,0,0,0,0,.46,.16,0,.20,.15,0,-.12,0,0,-.32,-.15,0,-.12,-.16,0,.20],leafG=new T.BufferGeometry();leafG.setAttribute('position',new T.Float32BufferAttribute(leafPoints,3));const li=[];for(let i=0;i<6;i++)li.push(0,i+1,(i+1)%6+1);leafG.setIndex(li);leafG.computeVertexNormals();
 for(let b=0;b<3;b++){const a=b*Math.PI*2/3+.2,tip=[TREE.x+Math.cos(a)*1.0,groundY+4.30+b*.12,TREE.z+Math.sin(a)*1.0];segment(wood,[TREE.x,groundY+3.0,TREE.z],tip,.12,.035,'#5e705d',6);
  for(let n=0;n<12;n++){const t=n*Math.PI*2/12,p=new T.Vector3(tip[0]+Math.cos(t)*.65,tip[1]+Math.sin(n*2.1)*.22,tip[2]+Math.sin(t)*.65),q=new T.Quaternion().setFromEuler(new T.Euler(Math.sin(n)*.25,t,.1*Math.cos(n))),m=new T.Matrix4().compose(p,q,new T.Vector3(1.4,1,1.4));foliage.add(leafG,m,n%3?'#59715c':'#6b8065');
   // Each blade has a connected petiole, not a detached canopy card cloud.
   const branchStart=new T.Vector3(TREE.x,groundY+3.0,TREE.z),tipVector=new T.Vector3(...tip),join=tipVector.clone().addScaledVector(tipVector.clone().sub(branchStart).normalize(),-.035),leafEnd=new T.Vector3(0,0,-.32).applyMatrix4(m).add(new T.Vector3(0,.004,0).applyQuaternion(q));
   segment(wood,join.toArray(),leafEnd.toArray(),.009,.004,'#65765b',4);}}
 leafG.dispose();
 const timber=new T.Mesh(wood.finish(),new T.MeshLambertMaterial({vertexColors:true}));timber.name='rhino-living-tree-wood';timber.castShadow=timber.receiveShadow=true;
 const crown=new T.Mesh(foliage.finish(),new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide}));crown.name='rhino-living-tree-crown';crown.castShadow=crown.receiveShadow=true;scene.add(timber,crown);timber.updateMatrixWorld(true);crown.updateMatrixWorld(true);
 const home={x:ORIGIN.x,y:topY+D.rootAboveSupport,z:ORIGIN.z};
 const colliders=[{x:TREE.x,z:TREE.z,r:.60}];for(let i=0;i<7;i++)colliders.push({x:BRANCH.startX+i*.30,z:BRANCH.z,r:Math.hypot(.30,.15)});
 return{homes:[['rhino',home.x,home.z,home.y-world.heightAt(home.x,home.z)]],rhinoSupports:[{home,heading:ORIGIN.heading,retreatLimits:RETREAT}],colliders,captureOccluders:[timber],
  stats:Object.freeze({addedMeshes:2,addedTriangles:(timber.geometry.attributes.position.count+crown.geometry.attributes.position.count)/3,addedTextures:0,entryRays:1})};
}
