/** Two visible connected support meshes beside, not replacing, the Australian log.
 * Generic observation support; no plant/food/activity ecology is asserted. */
import {XYLOTRUPES_BRANCH as B,XYLOTRUPES_SUPPORT as S} from './xylotrupes-layout.js?v=0.67.0&b=06ee2abee345';
const T=window.THREE,freeze=o=>{for(const v of Object.values(o))if(v&&typeof v==='object')freeze(v);return Object.freeze(o);};
function branchGeometry(){
 const ring=[[-.12,B.bottom],[-B.halfWidth,.63],[-B.topHalfWidth,B.top],[B.topHalfWidth,B.top],[B.halfWidth,.63],[.12,B.bottom]],p=[],indices=[];
 for(const x of[-B.halfLength,B.halfLength])for(const[z,y]of ring)p.push(x,y,z);
 for(let i=0;i<6;i++){const j=(i+1)%6;indices.push(i,j,i+6,j,j+6,i+6);}for(let i=1;i<5;i++)indices.push(0,i+1,i,6,6+i,6+i+1);
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(indices);g.computeVertexNormals();g.computeBoundingSphere();return g;
}
export function createXylotrupesHabitat(world,scene){
 const ground=world?.captureOccluders?.[0];
 if(world?.regionId!=='australia'||!scene?.isScene||!ground?.isMesh||ground.name!=='australia-ground'||scene.getObjectById(ground.id)!==ground||typeof world.heightAt!=='function')throw new TypeError('Actual Australia ground required');
 ground.updateWorldMatrix(true,false);const ray=new T.Raycaster(new T.Vector3(B.postX,2,B.center.z),new T.Vector3(0,-1,0),0,4),groundHit=ray.intersectObject(ground,false)[0];
 if(!groundHit?.face||Math.abs(groundHit.point.y-world.heightAt(B.postX,B.center.z))>1e-6)throw new Error('Actual observation-post ground contact required');
 const branch=new T.Mesh(branchGeometry(),new T.MeshLambertMaterial({color:'#a99472'}));branch.name='xylotrupes-observation-branch';branch.position.set(B.center.x,0,B.center.z);branch.receiveShadow=true;
 const postBottom=groundHit.point.y-.01,postTop=B.bottom+.04,post=new T.Mesh(new T.CylinderGeometry(B.postRadius,B.postRadius,postTop-postBottom,7),new T.MeshLambertMaterial({color:'#88785d'}));post.name='xylotrupes-observation-post';post.position.set(B.postX,(postTop+postBottom)/2,B.center.z);post.receiveShadow=true;
 branch.updateMatrixWorld(true);post.updateMatrixWorld(true);let footEnvelopeRays=0;
 try{
  for(const d of[S.retreatBounds.min,0,S.retreatBounds.max])for(const x of[-.105,0,.105])for(const z of[-.105,0,.105]){ray.set(new T.Vector3(S.home.x+d+z,S.home.y+.2,S.home.z-x),new T.Vector3(0,-1,0));ray.far=.4;const h=ray.intersectObject(branch,false)[0];if(!h?.face||h.face.normal.y<.999999||Math.abs(h.point.y-(S.home.y-.055))>1e-8)throw new Error('Actual xylotrupes top-facet foot envelope required');footEnvelopeRays++;}
 }catch(error){branch.geometry.dispose();branch.material.dispose();post.geometry.dispose();post.material.dispose();throw error;}
 scene.add(branch,post);const support=freeze({home:{...S.home},orientation:{...S.orientation},axis:{...S.axis},retreatBounds:{...S.retreatBounds}}),colliders=freeze([3.28,3.60,3.92].map(x=>({x,z:B.center.z,r:.25})));let disposed=false;
 return{homes:freeze([['xylotrupes',S.home.x,S.home.z,S.home.y-world.heightAt(S.home.x,S.home.z)]]),xylotrupesSupports:freeze([support]),branch,post,groundAnchor:freeze({x:groundHit.point.x,y:groundHit.point.y,z:groundHit.point.z}),colliders,captureOccluders:[branch,post],stats:Object.freeze({addedMeshes:2,addedTriangles:(branch.geometry.index.count+post.geometry.index.count)/3,addedTextures:0,footEnvelopeRays,observationSupport:true,feeding:false}),dispose(){if(disposed)return;disposed=true;for(const m of[branch,post]){m.geometry.dispose();m.material.dispose();m.parent?.remove(m);}}};
}
