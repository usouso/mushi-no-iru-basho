/** One additive living sapling and one insect-support leaf. No food or flight. */
import {JEWEL_TREE as TREE,JEWEL_SITE as SITE,JEWEL_LEAF as LEAF} from './jewel-layout.js?v=0.23.0&b=6eab031e296e';
const T=window.THREE;
function collector(){const p=[],c=[];return{add(g,m,color){const copy=g.index?g.toNonIndexed():g.clone();copy.applyMatrix4(m);p.push(...copy.attributes.position.array);const tint=new T.Color(color);for(let i=0;i<copy.attributes.position.count;i++)c.push(tint.r,tint.g,tint.b);copy.dispose();},finish(){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('color',new T.Float32BufferAttribute(c,3));g.computeVertexNormals();g.computeBoundingSphere();return g;}};}
function segment(batch,a,b,r0,r1,sides=5){const start=new T.Vector3(...a),delta=new T.Vector3(...b).sub(start),g=new T.CylinderGeometry(r1,r0,delta.length(),sides),m=new T.Matrix4().compose(start.addScaledVector(delta,.5),new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize()),new T.Vector3(1,1,1));batch.add(g,m,'#6c7351');g.dispose();}
export function createJewelHabitat(world,scene){
 const ground=world?.captureOccluders?.[0];if(!scene?.isScene||!ground?.isMesh||typeof world?.heightAt!=='function'||!Array.isArray(world?.colliders))throw new TypeError('Existing meadow terrain required');
 ground.updateWorldMatrix(true,false);const ray=new T.Raycaster();let entryRays=0;
 function groundAt(x,z){ray.set(new T.Vector3(x,10,z),new T.Vector3(0,-1,0));ray.far=20;entryRays++;const h=ray.intersectObject(ground,false)[0];if(!h||!Number.isFinite(h.point.y))throw new Error('Living sapling requires actual ground');return h.point.y;}
 const gy=groundAt(TREE.x,TREE.z),surfaceY=groundAt(SITE.x,SITE.z)+SITE.surfaceAboveGround,home={x:SITE.x,y:surfaceY+SITE.rootAboveSupport,z:SITE.z};
 const altitude=home.y-world.heightAt(home.x,home.z);if(!Number.isFinite(altitude))throw new Error('Finite home height required');
 // Validate root grounding before allocating the new scene-owned batches.
 const roots=Array.from({length:3},(_,i)=>{const a=.3+i*2*Math.PI/3,x=TREE.x+.30*Math.cos(a),z=TREE.z+.30*Math.sin(a);return[x,groundAt(x,z)-.015,z];});
 const wood=collector(),leaves=collector();
 segment(wood,[TREE.x,gy-.025,TREE.z],[TREE.x,gy+TREE.height,TREE.z],TREE.trunkRadius,.025,8);
 for(const end of roots)segment(wood,[TREE.x,gy+.10,TREE.z],end,.045,.012,5);
 const leafCenter=new T.Vector3(SITE.x,surfaceY,SITE.z+LEAF.centerForward),leafBase=leafCenter.clone().add(new T.Vector3(0,0,-LEAF.radiusZ)),branchEnd=leafBase.clone().add(new T.Vector3(0,-.025,-.045));
 segment(wood,[TREE.x,gy+.75,TREE.z],branchEnd.toArray(),.025,.008,6);
 segment(wood,branchEnd.clone().add(new T.Vector3(0,-.004,-.006)).toArray(),leafBase.clone().add(new T.Vector3(0,-.001,.004)).toArray(),.006,.003,5);
 const points=[];for(let i=0;i<LEAF.segments;i++){const a=i*2*Math.PI/LEAF.segments,b=(i+1)*2*Math.PI/LEAF.segments;points.push(leafCenter.x,surfaceY,leafCenter.z,leafCenter.x+Math.cos(b)*LEAF.radiusX,surfaceY,leafCenter.z+Math.sin(b)*LEAF.radiusZ,leafCenter.x+Math.cos(a)*LEAF.radiusX,surfaceY,leafCenter.z+Math.sin(a)*LEAF.radiusZ);}
 const supportGeometry=new T.BufferGeometry();supportGeometry.setAttribute('position',new T.Float32BufferAttribute(points,3));supportGeometry.computeVertexNormals();leaves.add(supportGeometry,new T.Matrix4(),'#688444');supportGeometry.dispose();
 // Three upper branches, three small leaves each. Every blade has a real twig
 // to its transformed rear/base vertex; no detached canopy-card cloud.
 const leafG=new T.BufferGeometry();leafG.setAttribute('position',new T.Float32BufferAttribute([0,0,0,0,0,.15,.055,0,.065,.05,0,-.035,0,0,-.12,-.05,0,-.035,-.055,0,.065],3));const indices=[];for(let i=0;i<6;i++)indices.push(0,(i+1)%6+1,i+1);leafG.setIndex(indices);leafG.computeVertexNormals();
 for(let b=0;b<3;b++){
  const a=.4+b*2*Math.PI/3,start=new T.Vector3(TREE.x,gy+2.15+b*.16,TREE.z),tip=new T.Vector3(TREE.x+Math.cos(a)*.65,gy+2.75+b*.12,TREE.z+Math.sin(a)*.65);segment(wood,start.toArray(),tip.toArray(),.027,.008,5);
  for(let n=0;n<3;n++){const t=a+(n-1)*.65,pos=tip.clone().add(new T.Vector3(Math.cos(t)*.19,Math.sin(n*2)*.05,Math.sin(t)*.19)),q=new T.Quaternion().setFromEuler(new T.Euler(.15*(n-1),t,.1)),m=new T.Matrix4().compose(pos,q,new T.Vector3(1,1,1));leaves.add(leafG,m,n%2?'#667d43':'#78904c');const base=new T.Vector3(0,0,-.12).applyMatrix4(m),normal=new T.Vector3(0,1,0).applyQuaternion(q),join=tip.clone().addScaledVector(tip.clone().sub(start).normalize(),-.018),end=base.clone().lerp(pos,.03).addScaledVector(normal,-Math.sign(join.clone().sub(base).dot(normal)||1)*.003);segment(wood,join.toArray(),end.toArray(),.004,.002,4);}
 }
 leafG.dispose();
 const timber=new T.Mesh(wood.finish(),new T.MeshLambertMaterial({vertexColors:true}));timber.name='jewel-living-sapling-wood';timber.castShadow=timber.receiveShadow=true;
 const foliage=new T.Mesh(leaves.finish(),new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide}));foliage.name='jewel-connected-live-leaves';foliage.castShadow=foliage.receiveShadow=true;scene.add(timber,foliage);timber.updateMatrixWorld(true);foliage.updateMatrixWorld(true);
 return{homes:[['jewel',home.x,home.z,altitude]],jewelSupports:[{home,heading:SITE.heading}],colliders:[{x:TREE.x,z:TREE.z,r:TREE.colliderRadius}],captureOccluders:[timber,foliage],stats:Object.freeze({addedMeshes:2,addedTriangles:(timber.geometry.attributes.position.count+foliage.geometry.attributes.position.count)/3,addedTextures:0,entryRays,liveLeaves:10,upperBranches:3,leafTwigs:9,supportLeaves:1})};
}
