/** One finite lane on the world's actual log skin. No added meshes or ecology. */
import {RAINBOW_LANE as L} from './rainbow-stag-layout.js?v=0.67.0&b=06ee2abee345';
const T=window.THREE,xyz=v=>({x:v.x,y:v.y,z:v.z});
export function createRainbowStagHabitat(world,scene){
 const log=world?.rainbowLog;
 if(world?.regionId!=='australia'||!scene?.isScene||!log?.isMesh||log.name!=='australia-fallen-log'||scene.getObjectById(log.id)!==log||!world.captureOccluders?.includes(log)||typeof world.heightAt!=='function')throw new TypeError('Independent Australia log world required');
 log.updateWorldMatrix(true,false);
 const surface=new T.Vector3(L.surface.x,L.surface.y,L.surface.z),ray=new T.Raycaster(surface.clone().add(new T.Vector3(0,.2,0)),new T.Vector3(0,-1,0),0,.4),hit=ray.intersectObject(log,false)[0];
 if(!hit?.face||hit.point.distanceTo(surface)>1e-6||hit.face.normal.y<.999999)throw new Error('Actual horizontal log top required');
 // +/- .105 projected-foot envelope includes the .095 halfspan and .01 gait.
 // Check both ends and centre on actual triangles; final model skin QA is separate.
 // RAINBOW_INDIVIDUAL_BEGIN
 for(const d of[L.min,0,L.max])for(const x of[-.105*1.15,0,.105*1.15])for(const z of[-.105*1.15,0,.105*1.15]){const p=hit.point.clone().add(new T.Vector3(d+z,0,-x));ray.set(p.clone().add(new T.Vector3(0,.2,0)),new T.Vector3(0,-1,0));const h=ray.intersectObject(log,false)[0];if(!h?.face||h.face.normal.y<.999999||h.point.distanceTo(p)>1e-6)throw new Error('Rainbow foot envelope leaves real top facet');}
 // RAINBOW_INDIVIDUAL_END
 const home=xyz(hit.point.clone().add(new T.Vector3(0,L.rootAboveSupport,0))),q=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),Math.PI/2),terrain=world.heightAt(home.x,home.z);if(!Number.isFinite(terrain))throw new Error('Finite terrain required');
 return{homes:[['rainbowstag',home.x,home.z,home.y-terrain]],rainbowStagSupports:[{home,orientation:{x:q.x,y:q.y,z:q.z,w:q.w},axis:{x:1,y:0,z:0},retreatBounds:{min:L.min,max:L.max}}],colliders:[],captureOccluders:[],stats:Object.freeze({addedMeshes:0,addedTriangles:0,addedTextures:0,footEnvelopeRays:27,feeding:false}),dispose(){}};
}
