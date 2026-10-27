/** Adapter on the world's one real branch; owns no geometry or material. */
import {GIRAFFE_STAG_BRANCH as B,GIRAFFE_STAG_SUPPORT as S} from './giraffe-stag-layout.js?v=0.64.0&b=3616c2fe808e';
const T=window.THREE,freeze=o=>{for(const v of Object.values(o))if(v&&typeof v==='object')freeze(v);return Object.freeze(o);};
export function createGiraffeStagHabitat(world,scene){
 const branch=world?.giraffeStagBranch;
 if(world?.regionId!=='flores'||!scene?.isScene||!branch?.isMesh||branch.name!=='giraffe-stag-observation-branch'||scene.getObjectById(branch.id)!==branch||!world.captureOccluders?.includes(branch)||typeof world.heightAt!=='function')throw new TypeError('Independent Flores branch world required');
 branch.updateWorldMatrix(true,false);const ray=new T.Raycaster(),down=new T.Vector3(0,-1,0);ray.far=.4;let rays=0,top;
 // GIRAFFE_INDIVIDUAL_BEGIN
 for(const d of[S.retreatBounds.min,0,S.retreatBounds.max])for(const z of[-.12*1.15,0,.12*1.15])for(const x of[-.115*1.15,0,.115*1.15]){const p=new T.Vector3(d+z,B.top+.2,-x);ray.set(p,down);const h=ray.intersectObject(branch,false)[0];if(!h?.face||h.face.normal.clone().transformDirection(branch.matrixWorld).y<.999999||Math.abs(h.point.y-B.top)>1e-6)throw new Error('Actual horizontal giraffe-stag foot envelope required');top=h.point.y;rays++;}
 // GIRAFFE_INDIVIDUAL_END
 const home={x:S.home.x,y:top+.06,z:S.home.z},ground=world.heightAt(home.x,home.z);if(!Number.isFinite(ground))throw new Error('Finite Flores ground required');
 const support=freeze({home,orientation:{...S.orientation},axis:{...S.axis},retreatBounds:{...S.retreatBounds}});
 return{homes:freeze([['giraffestag',home.x,home.z,home.y-ground]]),giraffeStagSupports:freeze([support]),colliders:[],captureOccluders:[],stats:Object.freeze({addedMeshes:0,addedTriangles:0,addedTextures:0,footEnvelopeRays:rays}),dispose(){}};
}
