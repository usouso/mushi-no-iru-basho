/** Actual-terrain support adapter; owns no geometry, textures or colliders. */
import {SWALLOWTAIL_SITES as SITES,SWALLOWTAIL_SUPPORT as D} from './swallowtail-layout.js?v=0.27.0&b=572abb81497f';
const T=window.THREE,xyz=v=>({x:v.x,y:v.y,z:v.z});
export function createSwallowtailHabitat(world,scene){
 const ground=world?.captureOccluders?.[0];
 if(!scene?.isScene||!ground?.isMesh||!ground.geometry?.attributes?.position||typeof world?.heightAt!=='function')throw new TypeError('Existing meadow terrain required');
 ground.updateWorldMatrix(true,false);
 const ray=new T.Raycaster(),normalMatrix=new T.Matrix3().getNormalMatrix(ground.matrixWorld),normals=[],surfaces=[];
 const swallowtailSupports=SITES.map(site=>{
  ray.set(new T.Vector3(site.x,10,site.z),new T.Vector3(0,-1,0));ray.far=20;
  const hit=ray.intersectObject(ground,false)[0];
  if(!hit?.face||!Number.isFinite(hit.point.y))throw new Error('Swallowtail requires actual bank terrain');
  const up=hit.face.normal.clone().applyMatrix3(normalMatrix).normalize();
  if(up.y<.9||hit.point.y-D.footDiskRadius*Math.sqrt(1-up.y*up.y)<=D.waterY)throw new Error('Bank support must be gentle and above water');
  const vertices=[hit.face.a,hit.face.b,hit.face.c].map(i=>new T.Vector3().fromBufferAttribute(ground.geometry.attributes.position,i).applyMatrix4(ground.matrixWorld));
  for(let i=0;i<3;i++){
   const a=vertices[i],ab=vertices[(i+1)%3].clone().sub(a),margin=hit.point.clone().sub(a).cross(ab).length()/ab.length();
   if(!Number.isFinite(margin)||margin<D.footDiskRadius+.001)throw new Error('Foot disk must fit a single terrain triangle');
  }
  const forward=new T.Vector3(0,0,site.forwardZ);forward.addScaledVector(up,-forward.dot(up)).normalize();
  const right=new T.Vector3().crossVectors(up,forward).normalize();forward.crossVectors(right,up).normalize();
  const q=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(right,up,forward)).normalize();
  if(q.w<0)q.set(-q.x,-q.y,-q.z,-q.w);
  const root=hit.point.clone().addScaledVector(up,D.rootAboveSurface);
  if(!Number.isFinite(world.heightAt(root.x,root.z)))throw new Error('Finite root terrain height required');
  normals.push(up);surfaces.push(hit.point.clone());
  return{position:xyz(root),orientation:{x:q.x,y:q.y,z:q.z,w:q.w}};
 });
 const delta=surfaces[1].clone().sub(surfaces[0]);
 if(normals[0].distanceTo(normals[1])>1e-6||Math.abs(delta.dot(normals[0]))>1e-6||delta.length()<.1||delta.length()>2)throw new Error('Two nearby coplanar bank supports required');
 const home=swallowtailSupports[0].position;
 return{homes:[['swallowtail',home.x,home.z,home.y-world.heightAt(home.x,home.z)]],swallowtailSupports,colliders:[],captureOccluders:[],stats:Object.freeze({addedMeshes:0,addedTriangles:0,addedTextures:0,entryRays:2})};
}
