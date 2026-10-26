/** One original insect on existing ground: no new support, grass or collision. */
import {MANTICORA_ROUTE as R,MANTICORA_HOME as H,MANTICORA_ROOT_HEIGHT} from './manticora-layout.js?v=0.37.0&b=4d59dc9955d7';
import {MANTICORA_DIMENSIONS as D,sampleManticoraPose} from './manticora-kinematics.js?v=0.37.0&b=4d59dc9955d7';
const T=window.THREE;
export function createManticoraHabitat(world,scene){
 const ground=world?.captureOccluders?.[0];
 if(!scene?.isScene||!ground?.isMesh||ground.name!=='savanna-ground'||scene.getObjectById(ground.id)!==ground||!ground.geometry?.attributes?.position||typeof world?.heightAt!=='function')throw new TypeError('Existing savanna ground required');
 if(D.rootAboveSupport!==MANTICORA_ROOT_HEIGHT)throw new Error('Manticora support height changed');
 ground.updateWorldMatrix(true,false);
 const down=new T.Vector3(0,-1,0),ray=new T.Raycaster(),normalMatrix=new T.Matrix3().getNormalMatrix(ground.matrixWorld);
 function validateGround(point){
  ray.set(point.clone().add(new T.Vector3(0,.25,0)),down);ray.near=0;ray.far=.5;const hit=ray.intersectObject(ground,false)[0];
  if(!hit?.face||hit.point.distanceTo(point)>2e-7)throw new Error('Manticora lane requires its actual flat ground triangles');
  const normal=hit.face.normal.clone().applyMatrix3(normalMatrix).normalize();
  if(normal.distanceTo(new T.Vector3(0,1,0))>1e-7)throw new Error('Manticora ground orientation changed');
  const terrain=world.heightAt(point.x,point.z);if(!Number.isFinite(terrain)||Math.abs(terrain-hit.point.y)>2e-7)throw new Error('Manticora terrain height disagrees with actual ground');
  return hit;
 }
 const entry=validateGround(new T.Vector3(H.x,0,H.z)),headings=[Math.atan2(R[1].x-R[0].x,R[1].z-R[0].z),Math.atan2(R[2].x-R[1].x,R[2].z-R[1].z)];
 // Each straight segment's endpoints and gait extrema bound its planted feet.
 // The two headings at the corner are checked separately; a moving turn still
 // requires its own grounded gait rather than snapping six planted feet.
 for(const [node,heading]of[[R[0],headings[0]],[R[1],headings[0]],[R[1],headings[1]],[R[2],headings[1]]])for(const phase of[0,Math.PI]){
  const q=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),heading);
  for(const leg of sampleManticoraPose({walkPhase:phase}).legs){const foot=new T.Vector3(leg.foot.x,leg.foot.y,leg.foot.z).applyQuaternion(q).add(new T.Vector3(node.x,D.rootAboveSupport,node.z));validateGround(foot);}
 }
 const home={x:H.x,y:entry.point.y+D.rootAboveSupport,z:H.z};
 return{homes:[['manticora',home.x,home.z,D.rootAboveSupport]],manticoraSupports:[{home,route:R.map(p=>({...p}))}],colliders:[],captureOccluders:[],stats:Object.freeze({addedMeshes:0,addedTriangles:0,addedTextures:0,entryRays:1,footEnvelopeRays:48}),dispose(){}};
}
