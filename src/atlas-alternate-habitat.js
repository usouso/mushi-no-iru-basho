/** One real low branch attached to an existing tree. This is an exhibit
 * placement, not a claim about natural Atlas perch heights or behaviour. */
import {ATLAS_DIMENSIONS as D} from './atlas-kinematics.js?v=0.67.0&b=06ee2abee345';
const T=window.THREE;
export const ATLAS_ALTERNATE_BRANCH=Object.freeze({treeX:-9,z:5,startX:-9.10,endX:-6.85,radius:.32,surfaceAboveGround:1.12,homeX:-7.60,heading:Math.PI/2});
export function createAtlasAlternateHabitat(world,scene){
 const B=ATLAS_ALTERNATE_BRANCH,ground=scene?.getObjectByName('understory-ground'),trunk=scene?.getObjectByName('understory-trunks');
 if(!scene?.isScene||!ground?.isMesh||!trunk?.isMesh||typeof world?.heightAt!=='function'||!world.colliders?.some(c=>Math.hypot(c.x-B.treeX,c.z-B.z)<1e-7))throw new TypeError('Existing west understory tree required');
 if(scene.getObjectByName('atlas-west-observation-branch'))throw new Error('Atlas west branch already exists');
 ground.updateWorldMatrix(true,false);trunk.updateWorldMatrix(true,false);
 const ray=new T.Raycaster(new T.Vector3(B.treeX,10,B.z),new T.Vector3(0,-1,0),0,20),terrain=ray.intersectObject(ground,false)[0];
 const terrainY=world.heightAt(B.treeX,B.z);
 if(!terrain||!Number.isFinite(terrainY)||Math.abs(terrain.point.y-terrainY)>1e-6)throw new Error('Atlas west terrain mismatch');
 const topY=terrain.point.y+B.surfaceAboveGround,axisY=topY-B.radius*Math.cos(Math.PI/8);
 // Both real trunk skins must bracket the branch's rear centre. No invisible
 // support, replacement trunk or analytically invented joint is added.
 ray.set(new T.Vector3(B.treeX-1,axisY,B.z),new T.Vector3(1,0,0));ray.far=2;
 const west=ray.intersectObject(trunk,false)[0];
 ray.set(new T.Vector3(B.treeX+1,axisY,B.z),new T.Vector3(-1,0,0));
 const east=ray.intersectObject(trunk,false)[0];
 if(!west||!east||!(west.point.x<B.startX&&B.startX<east.point.x&&east.point.x<B.endX))throw new Error('Atlas west branch is not connected to the existing trunk');
 const home={x:B.homeX,y:topY+D.rootAboveSupport,z:B.z},altitude=home.y-world.heightAt(home.x,home.z);
 if(!Number.isFinite(altitude))throw new Error('Finite Atlas west terrain height required');
 const p=[],indices=[];
 for(const x of[B.startX,B.endX])for(let i=0;i<8;i++){const a=Math.PI/8+i*Math.PI/4;p.push(x,axisY+Math.cos(a)*B.radius,B.z-Math.sin(a)*B.radius);}
 p.push(B.startX,axisY,B.z,B.endX,axisY,B.z);
 for(let i=0;i<8;i++){const j=(i+1)%8;indices.push(i,8+j,j,i,8+i,8+j,16,i,j,17,8+j,8+i);}
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(p,3));geometry.setIndex(indices);geometry.computeVertexNormals();geometry.computeBoundingSphere();
 const material=new T.MeshLambertMaterial({color:'#a29a7b'}),wood=new T.Mesh(geometry,material);wood.name='atlas-west-observation-branch';wood.castShadow=wood.receiveShadow=true;scene.add(wood);wood.updateMatrixWorld(true);
 const colliders=Array.from({length:7},(_,i)=>({x:B.startX+(B.endX-B.startX)*i/6,z:B.z,r:Math.hypot(B.radius,(B.endX-B.startX)/12)}));let disposed=false;
 return{homes:[['atlas',home.x,home.z,altitude]],atlasSupports:[{home,heading:B.heading}],colliders,captureOccluders:[wood],stats:Object.freeze({addedMeshes:1,addedTriangles:32,addedTextures:0}),dispose(){if(disposed)return;disposed=true;scene.remove(wood);geometry.dispose();material.dispose();}};
}
