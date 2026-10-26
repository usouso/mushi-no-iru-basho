/** Solid-geometry capture visibility, separate from camera/frustum and grass alpha.
 * The caller supplies static opaque Mesh/InstancedMesh objects only. No foliage,
 * water, insects, or invisible gameplay colliders are inferred from the scene.
 */
const THREE=window.THREE;
const SUPPORT_END_TOLERANCE=.10;
// Larger than either playable map's diagonal, but finite to fail closed on
// malformed extreme queries. Normal HUD/capture queries stop at 17m / 2.6m.
const MAX_RAY_DISTANCE=512;
export function createCaptureVisibility(occluders=[]) {
  if(!Array.isArray(occluders)||occluders.some(o=>!o?.isMesh||typeof o.raycast!=='function'))throw new TypeError('Capture occluders must be static meshes');
  const solids=[...new Set(occluders)];
  // Update each static object's ancestors and matrix once, never the full scene
  // for every candidate. Subsequent geometry/transform edits require rebuilding.
  for(const object of solids)object.updateWorldMatrix(true,false);
  const ray=new THREE.Raycaster(),origin=new THREE.Vector3(),direction=new THREE.Vector3(),hits=[];
  return function hasLineOfSight(eye,target) {
    if(!eye||!target)return false;
    let coordinates;
    try{coordinates=[eye.x,eye.y,eye.z,target.x,target.y,target.z];}catch{return false;}
    if(!coordinates.every(Number.isFinite))return false;
    const [ex,ey,ez,tx,ty,tz]=coordinates;
    const dx=tx-ex,dy=ty-ey,dz=tz-ez,distance=Math.hypot(dx,dy,dz);
    if(!Number.isFinite(distance)||distance>MAX_RAY_DISTANCE)return false;
    if(distance<=SUPPORT_END_TOLERANCE)return true;
    origin.set(ex,ey,ez);direction.set(dx/distance,dy/distance,dz/distance);
    ray.set(origin,direction);ray.near=0;ray.far=distance-SUPPORT_END_TOLERANCE;
    // Only the final ten centimetres are ignored: this accommodates the existing
    // <=82mm bark-rest render correction without permitting a nearer trunk hit.
    hits.length=0;ray.intersectObjects(solids,false,hits);
    return hits.length===0;
  };
}
