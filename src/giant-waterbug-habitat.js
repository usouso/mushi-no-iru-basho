/** Add one rooted stalk to the existing meadow pond. Never replace the water
 * material, old world geometry, supports, routes, stores or collision arrays. */
import {GIANT_WATERBUG_DIMENSIONS as D} from './giant-waterbug-kinematics.js?v=0.64.0&b=3616c2fe808e';
import {GIANT_WATERBUG_CENTER as CENTER,GIANT_WATERBUG_WATER_Y as WATER_Y,GIANT_WATERBUG_HOME as HOME,GIANT_WATERBUG_REST_PITCH as PITCH,GIANT_WATERBUG_ENVELOPE as E,GIANT_WATERBUG_RETREAT as RETREAT} from './giant-waterbug-layout.js?v=0.64.0&b=3616c2fe808e';
const T=window.THREE,V=p=>new T.Vector3(p.x,p.y,p.z),xyz=p=>Object.freeze({x:p.x,y:p.y,z:p.z});
export function createGiantWaterbugHabitat(world,scene){
 const ground=world?.captureOccluders?.[0];
 if(!scene?.isScene||typeof world?.heightAt!=='function'||!ground?.isMesh||scene.getObjectById(ground.id)!==ground)throw new TypeError('Existing meadow pond and ground required');
 const water=scene.children.find(o=>o.isMesh&&o.geometry?.type==='CircleGeometry'&&o.material?.isShaderMaterial&&o.material.uniforms?.uTime&&Math.abs(o.geometry.attributes.position.getX(0)-24)<1e-5&&Math.abs(o.geometry.attributes.position.getY(0)-WATER_Y)<1e-6);
 if(!water)throw new Error('Existing meadow pond water required');
 ground.updateWorldMatrix(true,false);water.updateWorldMatrix(true,false);
 const ray=new T.Raycaster(),down=new T.Vector3(0,-1,0),probes=[[0,0],[E.minX,E.minZ],[E.minX,E.maxZ],[E.maxX,E.minZ],[E.maxX,E.maxZ]];let minSampledDepth=Infinity;
 function surface(mesh,x,z){ray.set(new T.Vector3(x,2,z),down);ray.far=5;return ray.intersectObject(mesh,false)[0]?.point.y;}
 // Entry-only fail-fast samples. The complete native skin/ground audit belongs
 // in tests, not a per-frame or per-entry large vertex sweep.
 for(const [dx,dz]of probes){const x=CENTER.x+dx,z=CENTER.z+dz,top=surface(water,x,z),bottom=surface(ground,x,z);if(!Number.isFinite(top)||!Number.isFinite(bottom)||Math.abs(top-WATER_Y)>1e-6||top-bottom<E.maxDepth+E.groundMargin)throw new Error('Giant waterbug envelope needs deeper actual pond ground');minSampledDepth=Math.min(minSampledDepth,top-bottom);}
 const orientation=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),PITCH),axis=V(D.supportAxis.direction).applyQuaternion(orientation).normalize(),support=V(D.supportAxis.origin).applyQuaternion(orientation).add(V(HOME)),top=support.clone().addScaledVector(axis,-.24);
 ray.set(top,axis);ray.far=2;const hit=ray.intersectObject(ground,false)[0];
 if(!hit||!Number.isFinite(hit.distance)||hit.distance<.30)throw new Error('Giant waterbug stalk requires actual ground anchor');
 const bottom=hit.point.clone().addScaledVector(axis,.015),length=top.distanceTo(bottom),altitude=HOME.y-world.heightAt(HOME.x,HOME.z);
 if(!Number.isFinite(altitude))throw new Error('Finite meadow height sampler required');
 // Uniform radius is the model's real four-foot grip contract. Cylinder x
 // vertices remain +/-radius under this X-only tilt, not an inflated fake perch.
 const stalk=new T.Mesh(new T.CylinderGeometry(D.supportRadius,D.supportRadius,length,16,1),new T.MeshLambertMaterial({color:'#626d42'}));stalk.name='giant-waterbug-rooted-stalk';stalk.position.copy(top).add(bottom).multiplyScalar(.5);stalk.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),axis);stalk.receiveShadow=true;scene.add(stalk);stalk.updateMatrixWorld(true);
 const record=Object.freeze({home:HOME,center:CENTER,waterY:WATER_Y,pitch:PITCH,heading:0,orientation:Object.freeze({pitch:PITCH,yaw:0,roll:0}),axis:xyz(axis),support:xyz(support),radius:D.supportRadius,groundAnchor:xyz(hit.point),envelope:Object.freeze({...E,retreat:RETREAT})});
 const supports=Object.freeze([record]),homes=Object.freeze([Object.freeze(['giantwaterbug',HOME.x,HOME.z,altitude])]);let disposed=false;
 return{homes,supports,giantWaterbugSupports:supports,home:HOME,center:CENTER,waterY:WATER_Y,axis:record.axis,stalk,colliders:Object.freeze([]),captureOccluders:Object.freeze([stalk]),stats:Object.freeze({entryRays:11,surfaceSamples:5,minSampledDepth,addedMeshes:1,addedTriangles:64,addedTextures:0}),dispose(){if(disposed)return;disposed=true;scene.remove(stalk);stalk.geometry.dispose();stalk.material.dispose();}};
}
