/** Two attached observation-height branches. The damp bark marks are only
 * visual search clues; no sap-feeding animation, bait or resource is modeled. */
import {GOLIATH_SITES as SITES,GOLIATH_RETREAT_BOUNDS as LIMITS,GOLIATH_BRANCH_RADIUS as R} from './goliath-layout.js?v=0.39.0&b=8a647322e77c';
import {GOLIATH_DIMENSIONS as D} from './goliath-kinematics.js?v=0.39.0&b=8a647322e77c';
const T=window.THREE;
function collector(){const p=[],colors=[];return{add(g,color){const copy=g.index?g.toNonIndexed():g.clone();p.push(...copy.attributes.position.array);const c=new T.Color(color);for(let i=0;i<copy.attributes.position.count;i++)colors.push(c.r,c.g,c.b);copy.dispose();},finish(){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();g.computeBoundingSphere();return g;}};}
export function createGoliathHabitat(world,scene){
 const ground=scene?.getObjectByName('forest-ground'),treeWood=scene?.getObjectByName('forest-mature-wood');
 if(!scene?.isScene||!ground?.isMesh||!treeWood?.isMesh||typeof world?.heightAt!=='function'||!Array.isArray(world?.forestTrees))throw new TypeError('Existing Central-African forest world required');
 scene.updateMatrixWorld(true);const ray=new T.Raycaster(),supports=[],homes=[],colliders=[],wood=collector();
 for(const site of SITES){
  const tree=world.forestTrees.find(t=>t.id===site.treeId);if(!tree||![tree.x,tree.z,site.heading,site.branchStart,site.branchEnd,D.rootAboveSupport].every(Number.isFinite))throw new Error('Goliath tree support missing');
  ray.set(new T.Vector3(tree.x,15,tree.z),new T.Vector3(0,-1,0));ray.far=30;const hit=ray.intersectObject(ground,false)[0];if(!hit)throw new Error('Goliath tree terrain missing');
  const surface=hit.point.y+site.surfaceAboveGround,axisY=surface-R*Math.cos(Math.PI/8),joinX=site.heading>0?site.branchStart:site.branchEnd,outside=site.heading>0?-1:1;
  ray.set(new T.Vector3(joinX+outside*2,axisY,site.z),new T.Vector3(-outside,0,0));ray.far=2;const join=ray.intersectObject(treeWood,false)[0];if(!join||join.distance>=1.99)throw new Error('Goliath branch must enter the actual mature trunk');
  const p=[],index=[];for(const x of[site.branchStart,site.branchEnd])for(let i=0;i<8;i++){const a=Math.PI/8+i*Math.PI/4;p.push(x,axisY+Math.cos(a)*R,site.z+Math.sin(a)*R);}p.push(site.branchStart,axisY,site.z,site.branchEnd,axisY,site.z);
  for(let i=0;i<8;i++){const j=(i+1)%8;index.push(i,j,8+j,i,8+j,8+i,16,j,i,17,8+i,8+j);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(index);g.computeVertexNormals();wood.add(g,'#8e8870');g.dispose();
  const mark=[],x=site.x-Math.sin(site.heading)*.14,y=surface+.00035;for(let i=0;i<10;i++){const a=i*Math.PI/5,b=(i+1)*Math.PI/5;mark.push(x,y,site.z,x+Math.cos(b)*.085,y,site.z+Math.sin(b)*.047,x+Math.cos(a)*.085,y,site.z+Math.sin(a)*.047);}const stain=new T.BufferGeometry();stain.setAttribute('position',new T.Float32BufferAttribute(mark,3));stain.computeVertexNormals();wood.add(stain,'#51452f');stain.dispose();
  const home={x:site.x,y:surface+D.rootAboveSupport,z:site.z};supports.push({home,heading:site.heading,retreatBounds:{...LIMITS}});homes.push(['goliath',home.x,home.z,home.y-world.heightAt(home.x,home.z)]);
  for(let i=0;i<8;i++)colliders.push({x:site.branchStart+(site.branchEnd-site.branchStart)*i/7,z:site.z,r:Math.hypot(R,(site.branchEnd-site.branchStart)/14)});
 }
 const timber=new T.Mesh(wood.finish(),new T.MeshLambertMaterial({vertexColors:true}));timber.name='forest-goliath-supports';timber.castShadow=timber.receiveShadow=true;scene.add(timber);timber.updateMatrixWorld(true);let disposed=false;
 return{homes,goliathSupports:supports,colliders,captureOccluders:[timber],stats:Object.freeze({addedMeshes:1,addedTriangles:timber.geometry.attributes.position.count/3,addedTextures:0,sapFeeding:false}),dispose(){if(disposed)return;disposed=true;timber.geometry.dispose();timber.material.dispose();scene.remove(timber);}};
}
