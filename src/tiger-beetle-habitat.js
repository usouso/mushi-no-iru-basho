/** Read-only adapter on three actual existing terrain triangles. Owns no visual/collision resources. */
import {TIGER_BEETLE_SITES as S,TIGER_BEETLE_ROOT_HEIGHT as H,TIGER_BEETLE_HEADING as F,TIGER_BEETLE_STOPS as C} from './tiger-beetle-layout.js?v=0.67.0&b=06ee2abee345';
const T=window.THREE,freeze=o=>{for(const v of Object.values(o))if(v&&typeof v==='object')freeze(v);return Object.freeze(o);},plain=v=>({x:v.x,y:v.y,z:v.z});
export function createTigerBeetleHabitat(world,scene){
 const ground=world?.captureOccluders?.[0];if(!scene?.isScene||!ground?.isMesh||scene.getObjectById(ground.id)!==ground||typeof world.heightAt!=='function')throw new TypeError('Existing meadow terrain mesh required');
 ground.updateWorldMatrix(true,false);const ray=new T.Raycaster(),surfaces=[],stops=[];let rays=0,minFacetMargin=Infinity;
 for(const site of S){
  const nominal=world.heightAt(site.x,site.z);if(!Number.isFinite(nominal))throw new Error('Finite meadow terrain required');ray.set(new T.Vector3(site.x,nominal+2,site.z),new T.Vector3(0,-1,0));ray.far=4;const hit=ray.intersectObject(ground,false)[0];rays++;if(!hit?.face)throw new Error('Actual tiger-beetle terrain triangle required');
  const normal=hit.face.normal.clone().transformDirection(ground.matrixWorld);if(normal.y<.95)throw new Error('Near-horizontal tiger-beetle terrain required');const forward=new T.Vector3(F.x,0,F.z).addScaledVector(normal,-new T.Vector3(F.x,0,F.z).dot(normal)).normalize(),right=new T.Vector3().crossVectors(normal,forward).normalize(),q=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(right,normal,forward)),position=hit.point.clone().addScaledVector(normal,H),a=ground.geometry.attributes.position,triangle=[hit.face.a,hit.face.b,hit.face.c].map(i=>new T.Vector3().fromBufferAttribute(a,i).applyMatrix4(ground.matrixWorld));
  // Larger than all six authored foot positions and their ±.01m gait excursion.
  for(const x of[-.105,.105])for(const z of[-.12,.12]){const p=new T.Vector3(x,-H,z).applyQuaternion(q).add(position);ray.set(p.clone().addScaledVector(normal,.1),normal.clone().negate());ray.far=.2;const h=ray.intersectObject(ground,false)[0];rays++;if(!h||h.faceIndex!==hit.faceIndex||h.point.distanceTo(p)>1e-7)throw new Error('Tiger-beetle foot envelope must share its actual terrain facet');for(let k=0;k<3;k++)minFacetMargin=Math.min(minFacetMargin,new T.Line3(triangle[k],triangle[(k+1)%3]).closestPointToPoint(p,true,new T.Vector3()).distanceTo(p));}
  stops.push({position:plain(position),orientation:{x:q.x,y:q.y,z:q.z,w:q.w}});surfaces.push({point:plain(hit.point),normal:plain(normal),faceIndex:hit.faceIndex});
 }
 for(let i=0;i<3;i++)for(const key of['position','orientation'])for(const axis of Object.keys(C[i][key]))if(Math.abs(stops[i][key][axis]-C[i][key][axis])>1e-9)throw new Error('Canonical tiger-beetle meadow support required');
 if(minFacetMargin<.12)throw new Error('Tiger-beetle terrain facet margin too small');
 const first=stops[0].position;return{homes:freeze([['tigerbeetle',first.x,first.z,first.y-world.heightAt(first.x,first.z)]]),tigerBeetleSupports:freeze([{stops}]),supportSurfaces:freeze(surfaces),colliders:[],captureOccluders:[],stats:freeze({addedMeshes:0,addedTriangles:0,addedTextures:0,footEnvelopeRays:rays,minFacetMargin}),dispose(){}};
}
