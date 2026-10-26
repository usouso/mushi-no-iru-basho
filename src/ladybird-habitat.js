/** Two original broad leaves, additive to the existing meadow. No RNG or old-world mutation. */
import {LADYBIRD_LEAF_SITES as SITES,LADYBIRD_LEAF_SHAPE as SHAPE} from './ladybird-layout.js?v=0.25.0&b=1bc3118dbd0d';
import {LADYBIRD_DIMENSIONS as D} from './ladybird-kinematics.js?v=0.25.0&b=1bc3118dbd0d';
const T=window.THREE;
export function createLadybirdHabitat(world,scene){
 const ground=world?.captureOccluders?.[0];
 if(!scene?.isScene||!ground?.isMesh||typeof world?.heightAt!=='function')throw new TypeError('Existing meadow terrain required');
 ground.updateWorldMatrix(true,false);
 const ray=new T.Raycaster(),perches=[],surfaces=[];
 for(const site of SITES){
  ray.set(new T.Vector3(site.x,10,site.z),new T.Vector3(0,-1,0));ray.far=20;
  const hit=ray.intersectObject(ground,false)[0];
  if(!hit||!Number.isFinite(hit.point.y)||!Number.isFinite(world.heightAt(site.x,site.z)))throw new Error('Ladybird leaf requires actual terrain below it');
  const surface={x:site.x,y:hit.point.y+site.height,z:site.z};surfaces.push({surface,groundY:hit.point.y});
  perches.push(Object.freeze({position:Object.freeze({x:site.x,y:surface.y+D.rootAboveSupport,z:site.z}),heading:Math.PI}));
 }
 const leafPositions=[],leafColors=[],stemPositions=[],stemNormals=[],color=new T.Color();
 for(const {surface:p,groundY} of surfaces){
  // Horizontal broad central blade: all six feet through the short walk lie inside the actual polygon.
  // Alternating muted green facets suggest a midrib without raising the support plane.
  for(let i=0;i<SHAPE.segments;i++){
   const a=i/SHAPE.segments*Math.PI*2,b=(i+1)/SHAPE.segments*Math.PI*2;
   leafPositions.push(p.x,p.y,p.z,p.x+Math.cos(b)*SHAPE.radiusX,p.y,p.z+Math.sin(b)*SHAPE.radiusZ,p.x+Math.cos(a)*SHAPE.radiusX,p.y,p.z+Math.sin(a)*SHAPE.radiusZ);
   color.set(i<SHAPE.segments/2?'#698443':'#5c783b');for(let j=0;j<3;j++)leafColors.push(color.r,color.g,color.b);
  }
  const start=new T.Vector3(p.x+.020,groundY-.012,p.z+.035),end=new T.Vector3(p.x,p.y-.003,p.z),delta=end.clone().sub(start);
  const source=new T.CylinderGeometry(.003,.006,delta.length(),6,1,true),g=source.toNonIndexed();source.dispose();
  const matrix=new T.Matrix4().compose(start.clone().addScaledVector(delta,.5),new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize()),new T.Vector3(1,1,1));
  g.applyMatrix4(matrix);stemPositions.push(...g.attributes.position.array);stemNormals.push(...g.attributes.normal.array);g.dispose();
 }
 function geometry(positions){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.computeVertexNormals();g.computeBoundingSphere();return g;}
 const leafGeometry=geometry(leafPositions);leafGeometry.setAttribute('color',new T.Float32BufferAttribute(leafColors,3));
 const leaves=new T.Mesh(leafGeometry,new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide}));leaves.name='ladybird-rest-leaves';leaves.receiveShadow=true;
 const stemGeometry=geometry(stemPositions);stemGeometry.setAttribute('normal',new T.Float32BufferAttribute(stemNormals,3));
 const stems=new T.Mesh(stemGeometry,new T.MeshLambertMaterial({color:'#637445'}));stems.name='ladybird-rest-stems';stems.receiveShadow=true;
 scene.add(leaves,stems);leaves.updateMatrixWorld(true);stems.updateMatrixWorld(true);
 const home=perches[0].position;
 // Both meshes/materials belong to the normal scene-root disposal path; no cache or texture.
 return {homes:[['ladybird',home.x,home.z,home.y-world.heightAt(home.x,home.z)]],
  supports:[{home:{...home},perches}],captureOccluders:[leaves,stems],
  stats:Object.freeze({addedMeshes:2,addedTriangles:leafPositions.length/9+stemPositions.length/9,addedTextures:0,entryRays:2})};
}
