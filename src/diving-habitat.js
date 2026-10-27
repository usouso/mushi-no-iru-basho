/** Additive shallow-swimming habitat: no new geometry, collision or update loop.
 * Existing pond gets the separately owned depth-opacity study material only.
 */
import {attachDivingWaterMaterial} from './diving-water-material.js?v=0.41.0&b=bed5219b02cd';
import {DIVING_CENTER,DIVING_WATER_Y,DIVING_HOME,DIVING_ENVELOPE} from './diving-layout.js?v=0.41.0&b=bed5219b02cd';
const THREE=window.THREE;
export function createDivingHabitat(world,scene){
 if(typeof world?.heightAt!=='function'||!scene?.isScene)throw new TypeError('Diving habitat needs the existing meadow world and scene');
 const water=scene.children.find(o=>o.isMesh&&o.geometry?.type==='CircleGeometry'&&o.material?.isShaderMaterial&&o.material.uniforms?.uTime&&Math.abs(o.geometry.attributes.position.getX(0)-24)<1e-5&&Math.abs(o.geometry.attributes.position.getY(0)-DIVING_WATER_Y)<1e-6),ground=world.captureOccluders?.[0];
 if(!water||!ground?.isMesh)throw new Error('Existing meadow pond and actual ground are required');
 water.updateWorldMatrix(true,false);ground.updateWorldMatrix(true,false);
 const ray=new THREE.Raycaster(),down=new THREE.Vector3(0,-1,0),probes=[[DIVING_CENTER.x,DIVING_CENTER.z]];
 for(const sx of[-1,1])for(const sz of[-1,1])probes.push([DIVING_CENTER.x+sx*DIVING_ENVELOPE.radiusX,DIVING_CENTER.z+sz*DIVING_ENVELOPE.radiusZ]);
 let minSampledDepth=Infinity;
 function surface(mesh,x,z){ray.set(new THREE.Vector3(x,2,z),down);ray.far=5;return ray.intersectObject(mesh,false)[0]?.point.y;}
 // Five fail-fast sites at entry only. Exact triangle-envelope / all-pose model
 // validation is in tests, not multiplied into an expensive runtime sweep.
 for(const [x,z]of probes){const top=surface(water,x,z),bottom=surface(ground,x,z);if(!Number.isFinite(top)||!Number.isFinite(bottom)||Math.abs(top-DIVING_WATER_Y)>1e-6||top-bottom<DIVING_ENVELOPE.maxDepth+.02)throw new Error('Diving envelope is not above sufficiently deep actual pond ground');minSampledDepth=Math.min(minSampledDepth,top-bottom);}
 const altitude=DIVING_HOME.y-world.heightAt(DIVING_HOME.x,DIVING_HOME.z);if(!Number.isFinite(altitude))throw new Error('Invalid meadow height sampler');
 const homes=Object.freeze([Object.freeze(['divingbeetle',DIVING_HOME.x,DIVING_HOME.z,altitude])]);
 const supports=Object.freeze([Object.freeze({home:DIVING_HOME,center:DIVING_CENTER,waterY:DIVING_WATER_Y})]);
 // This must happen last: validation failures do not replace the old material.
 // Its disposal listener frees the uniform texture AND detached original water
 // material using the existing scene-root lifecycle. No private render timer.
 const waterStudy=attachDivingWaterMaterial(water,world.heightAt);
 return{homes,supports,waterStudy,stats:Object.freeze({surfaceSamples:probes.length,entryRays:probes.length*2,minSampledDepth,addedDrawEntries:0,addedTriangles:0,addedTextures:1,textureBytes:waterStudy.stats.textureBytes})};
}
