/** One ground-anchored rest twig. No host/feeding claim or old-world mutation. */
import {MOONMOTH_STEM as S,MOONMOTH_PERCH as P,MOONMOTH_FLIGHT} from './moonmoth-layout.js?v=0.67.0&b=06ee2abee345';
const T=window.THREE,freeze=o=>{for(const v of Object.values(o))if(v&&typeof v==='object')freeze(v);return Object.freeze(o);};
export function createMoonmothHabitat(world,scene){
 const ground=scene?.getObjectByName('night-ground');
 if(!scene?.isScene||!ground?.isMesh||!world?.captureOccluders?.includes(ground)||typeof world?.heightAt!=='function'||!Number.isFinite(world.heightAt(S.x,S.z))||!Number.isFinite(world.heightAt(P.position.x,P.position.z))||Math.abs(world.heightAt(S.x,S.z)-S.groundY)>1e-8)throw new TypeError('Canonical night terrain required');
 ground.updateWorldMatrix(true,false);const ray=new T.Raycaster(new T.Vector3(S.x,10,S.z),new T.Vector3(0,-1,0),0,20),hit=ray.intersectObject(ground,false)[0];
 if(!hit?.face||Math.abs(hit.point.y-S.groundY)>1e-8)throw new Error('Actual moonmoth ground triangle required');
 const stem=new T.Mesh(new T.CylinderGeometry(S.radius,S.radius,S.topY-S.bottomY,S.radialSegments,1,false,S.thetaStart),new T.MeshLambertMaterial({color:'#77735e'}));stem.name='moonmoth-rest-twig';stem.position.set(S.x,(S.topY+S.bottomY)/2,S.z);stem.castShadow=stem.receiveShadow=true;stem.updateMatrixWorld(true);
 let gripRays=0,maxGripGap=0;const q=new T.Quaternion(P.orientation.x,P.orientation.y,P.orientation.z,P.orientation.w);
 try{for(const side of[-1,1])for(const z of[.040,.005,-.030]){const foot=new T.Vector3(side*S.radius*Math.SQRT1_2,-(S.radius+.045)+S.radius*Math.SQRT1_2,z).applyQuaternion(q).add(new T.Vector3(P.position.x,P.position.y,P.position.z)),normal=new T.Vector3(foot.x-S.x,0,foot.z-S.z).normalize();ray.set(foot.clone().addScaledVector(normal,.15),normal.clone().negate());ray.far=.3;const contact=ray.intersectObject(stem,false)[0];if(!contact?.face||foot.distanceTo(contact.point)>2e-8)throw new Error('Actual moonmoth twig grip required');maxGripGap=Math.max(maxGripGap,foot.distanceTo(contact.point));gripRays++;}}
 catch(error){stem.geometry.dispose();stem.material.dispose();throw error;}
 const perch=freeze({position:{...P.position},orientation:{...P.orientation},normal:{...P.normal}}),records=freeze([{perch,flight:MOONMOTH_FLIGHT.map(p=>({...p}))}]);scene.add(stem);let disposed=false;
 return{homes:freeze([['moonmoth',P.position.x,P.position.z,P.position.y-world.heightAt(P.position.x,P.position.z)]]),get moonmothSupports(){return records;},perch,stem,colliders:freeze([{x:S.x,z:S.z,r:S.radius+.05}]),captureOccluders:Object.freeze([stem]),groundAnchor:freeze({x:hit.point.x,y:hit.point.y,z:hit.point.z}),stats:Object.freeze({addedMeshes:1,addedTriangles:stem.geometry.index.count/3,addedTextures:0,gripRays,maxGripGap}),dispose(){if(disposed)return;disposed=true;stem.geometry.dispose();stem.material.dispose();stem.parent?.remove(stem);}};
}
