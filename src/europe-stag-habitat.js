/** One bounded horizontal lane on the real low log. No added render geometry. */
import {EUROPE_STAG_LANE as L} from './europe-stag-layout.js?v=0.64.0&b=3616c2fe808e';
const T=window.THREE,xyz=v=>({x:v.x,y:v.y,z:v.z});
export function createEuropeStagHabitat(world,scene){
 const log=world?.europeStagLog;
 if(world?.regionId!=='europe'||!scene?.isScene||!log?.isMesh||log.name!=='europe-fallen-log'||scene.getObjectById(log.id)!==log||!world.captureOccluders?.includes(log)||typeof world.heightAt!=='function')throw new TypeError('Independent Europe log world required');
 log.updateWorldMatrix(true,false);
 const surface=new T.Vector3(L.surface.x,L.surface.y,L.surface.z),ray=new T.Raycaster(surface.clone().add(new T.Vector3(0,.2,0)),new T.Vector3(0,-1,0),0,.4),hit=ray.intersectObject(log,false)[0];
 if(!hit?.face||hit.point.distanceTo(surface)>1e-6||hit.face.normal.y<.999999)throw new Error('Actual horizontal Europe log top required');
 // Native foot X +/-.095, Z[-.090,.085], gait +/-.010, at maximum
 // display factor 1.15. The physical world lane/log do not scale or move.
 const footEnvelope = .105 * 1.15;
 for(const d of[L.min,0,L.max])for(const x of[-footEnvelope,0,footEnvelope])for(const z of[-footEnvelope,0,footEnvelope]){const p=hit.point.clone().add(new T.Vector3(d+z,0,-x));ray.set(p.clone().add(new T.Vector3(0,.2,0)),new T.Vector3(0,-1,0));const h=ray.intersectObject(log,false)[0];if(!h?.face||h.face.normal.y<.999999||h.point.distanceTo(p)>1e-6)throw new Error('Europe stag foot envelope leaves real top facet');}
 const home=xyz(hit.point.clone().add(new T.Vector3(0,L.rootAboveSupport,0))),q=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),Math.PI/2),terrain=world.heightAt(home.x,home.z);if(!Number.isFinite(terrain))throw new Error('Finite terrain required');
 return{homes:[['europestag',home.x,home.z,home.y-terrain]],europeStagSupports:[{home,orientation:{x:q.x,y:q.y,z:q.z,w:q.w},axis:{x:1,y:0,z:0},retreatBounds:{min:L.min,max:L.max}}],colliders:[],captureOccluders:[],stats:Object.freeze({addedMeshes:0,addedTriangles:0,addedTextures:0,footEnvelopeRays:27,feeding:false}),dispose(){}};
}
