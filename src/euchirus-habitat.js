/** One real bark facet, with no new mesh, collider, food or invisible support. */
import {EUCHIRUS_PROBE as P} from './euchirus-layout.js?v=0.40.0&b=8b1b975eded1';
import {EUCHIRUS_DIMENSIONS as D,sampleEuchirusPose} from './euchirus-kinematics.js?v=0.40.0&b=8b1b975eded1';
const T=window.THREE,xyz=v=>({x:v.x,y:v.y,z:v.z});
export function createEuchirusHabitat(world,scene){
 const trunk=world?.captureOccluders?.[1];
 if(!scene?.isScene||!trunk?.isMesh||trunk.name!=='understory-trunks'||scene.getObjectById(trunk.id)!==trunk||!trunk.geometry?.attributes?.position||typeof world?.heightAt!=='function')throw new TypeError('Existing understory tree required');
 if(D.rootAboveSupport!==P.rootAboveSupport)throw new Error('Euchirus support height changed');
 trunk.updateWorldMatrix(true,false);
 const outward=new T.Vector3(P.outward.x,P.outward.y,P.outward.z).normalize(),query=new T.Vector3(P.surface.x,P.surface.y,P.surface.z),ray=new T.Raycaster(query.clone().addScaledVector(outward,.5),outward.clone().negate(),0,1),hit=ray.intersectObject(trunk,false)[0];
 if(!hit?.face||hit.faceIndex!==P.faceIndex||hit.point.distanceTo(query)>1e-5)throw new Error('Expected actual Euchirus tree triangle required');
 const normal=hit.face.normal.clone().applyMatrix3(new T.Matrix3().getNormalMatrix(trunk.matrixWorld)).normalize();if(normal.distanceTo(outward)>1e-5)throw new Error('Euchirus tree face orientation changed');
 const forward=new T.Vector3(0,1,0).addScaledVector(normal,-normal.y).normalize(),right=new T.Vector3().crossVectors(normal,forward).normalize();forward.crossVectors(right,normal).normalize();
 // Long forefeet need their actual projected endpoints, not a circular envelope
 // that would unnecessarily shrink the insect or invent a wider support plane.
 // Endpoint locations plus gait extrema bound the straight 8 cm swept lane.
 for(const distance of[0,P.pathLength])for(const walkPhase of[0,Math.PI])for(const warningBlend of[0,1])for(const leg of sampleEuchirusPose({walkPhase,warningBlend}).legs){
  const foot=hit.point.clone().addScaledVector(right,leg.foot.x).addScaledVector(forward,distance+leg.foot.z);
  ray.set(foot.clone().addScaledVector(normal,.2),normal.clone().negate());ray.near=0;ray.far=.4;const support=ray.intersectObject(trunk,false)[0];
  if(!support?.face||support.faceIndex!==P.faceIndex||support.point.distanceTo(foot)>2e-7)throw new Error('Euchirus long-foot lane crosses actual tree facet');
 }
 const q=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(right,normal,forward)).normalize();if(q.w<0)q.set(-q.x,-q.y,-q.z,-q.w);
 const home=xyz(hit.point.clone().addScaledVector(normal,P.rootAboveSupport)),altitude=home.y-world.heightAt(home.x,home.z);if(!Number.isFinite(altitude))throw new Error('Finite Euchirus terrain height required');
 return{homes:[['euchirus',home.x,home.z,altitude]],euchirusSupports:[{home,orientation:{x:q.x,y:q.y,z:q.z,w:q.w}}],colliders:[],captureOccluders:[],stats:Object.freeze({addedMeshes:0,addedTriangles:0,addedTextures:0,entryRays:1,footEnvelopeRays:48,sapFeeding:false}),dispose(){}};
}
