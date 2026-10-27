/** Existing oak skin only: no new bark, invisible support or food mechanic. */
import {MIYAMA_PROBE as P} from './miyama-layout.js?v=0.41.0&b=bed5219b02cd';
const T=window.THREE,xyz=v=>({x:v.x,y:v.y,z:v.z});
export function createMiyamaHabitat(world,scene){
 const trunk=world?.captureOccluders?.[1];
 if(!scene?.isScene||!trunk?.isMesh||!trunk.geometry?.attributes?.position||typeof world?.heightAt!=='function')throw new TypeError('Existing meadow oak required');
 trunk.updateWorldMatrix(true);
 const outward=new T.Vector3(P.outward.x,P.outward.y,P.outward.z).normalize(),query=new T.Vector3(P.surface.x,P.surface.y,P.surface.z),ray=new T.Raycaster(query.clone().addScaledVector(outward,.5),outward.clone().negate(),0,1),hit=ray.intersectObject(trunk,false)[0];
 if(!hit?.face||hit.faceIndex!==P.faceIndex||hit.point.distanceTo(query)>1e-5)throw new Error('Expected actual miyama oak triangle required');
 const normal=hit.face.normal.clone().applyMatrix3(new T.Matrix3().getNormalMatrix(trunk.matrixWorld)).normalize();
 if(normal.distanceTo(outward)>1e-5)throw new Error('Miyama oak face orientation changed');
 const forward=new T.Vector3(0,1,0).addScaledVector(normal,-normal.y).normalize(),right=new T.Vector3().crossVectors(normal,forward).normalize();forward.crossVectors(right,normal).normalize();
 const vertices=[hit.face.a,hit.face.b,hit.face.c].map(i=>new T.Vector3().fromBufferAttribute(trunk.geometry.attributes.position,i).applyMatrix4(trunk.matrixWorld)),triangle=new T.Triangle(...vertices);
 // A convex triangle containing both endpoint disks also contains their swept
 // hull. Do not replace it with an assumed cylinder or a nominal bark quad.
 for(const distance of[0,P.pathLength]){
  const center=hit.point.clone().addScaledVector(forward,distance);
  if(!triangle.containsPoint(center))throw new Error('Miyama walking endpoint outside oak face');
  for(let i=0;i<3;i++){const a=vertices[i],edge=vertices[(i+1)%3].clone().sub(a),margin=center.clone().sub(a).cross(edge).length()/edge.length();if(!Number.isFinite(margin)||margin<P.footRadius+.001)throw new Error('Miyama foot envelope crosses oak facet');}
 }
 const q=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(right,normal,forward)).normalize();if(q.w<0)q.set(-q.x,-q.y,-q.z,-q.w);
 const home=xyz(hit.point.clone().addScaledVector(normal,P.rootAboveSupport)),altitude=home.y-world.heightAt(home.x,home.z);
 if(!Number.isFinite(altitude))throw new Error('Finite miyama terrain height required');
 return{homes:[['miyama',home.x,home.z,altitude]],miyamaSupports:[{home,orientation:{x:q.x,y:q.y,z:q.z,w:q.w}}],colliders:[],captureOccluders:[],stats:Object.freeze({addedMeshes:0,addedTriangles:0,addedTextures:0,entryRays:1,sapFeeding:false}),dispose(){}};
}
