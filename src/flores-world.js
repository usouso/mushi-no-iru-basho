/** Authored Flores-reference forest edge. Light bark and a short walk-around;
 * no claims about wild feeding, activity time, or measured habitat structure. */
import {FLORES_BOUNDS,FLORES_SPAWN,FLORES_TREES,FLORES_ROUTE,GIRAFFE_STAG_BRANCH as B} from './giraffe-stag-layout.js?v=0.67.0&b=06ee2abee345';
const T=window.THREE;
export const heightAt=()=>0;
function geometry(p,index){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));if(index)g.setIndex(index);g.computeVertexNormals();g.computeBoundingSphere();return g;}
function branchGeometry(){const ring=[[-B.topHalfWidth,B.bottom],[-B.halfWidth,.61],[-B.halfWidth,.72],[-B.topHalfWidth,B.top],[B.topHalfWidth,B.top],[B.halfWidth,.72],[B.halfWidth,.61],[B.topHalfWidth,B.bottom]],p=[],idx=[];for(const x of[B.minX,B.maxX])for(const[z,y]of ring)p.push(x,y,z);for(let i=0;i<8;i++){const j=(i+1)%8;idx.push(i,j,i+8,j,j+8,i+8);}for(let i=1;i<7;i++)idx.push(0,i+1,i,8,8+i,8+i+1);return geometry(p,idx);}
export function createFloresWorld(scene){
 if(!scene?.isScene)throw new TypeError('Flores world requires a Three scene');
 const previous={background:scene.background,fog:scene.fog},background=new T.Color('#c7d8bc'),fog=new T.Fog('#bbccb0',11,24),meshes=[],colliders=[];scene.background=background;scene.fog=fog;
 const sky=new T.HemisphereLight('#f0f2d8','#5a6850',1.1),sun=new T.DirectionalLight('#fff0cd',1.05);sun.position.set(-3,7,5);scene.add(sky,sun,sun.target);
 function mesh(name,g,color,side=T.FrontSide){const m=new T.Mesh(g,new T.MeshLambertMaterial({color,side}));m.name=name;m.receiveShadow=true;scene.add(m);meshes.push(m);return m;}
 function rod(name,a,b,r,color){const d=new T.Vector3(...b).sub(new T.Vector3(...a)),m=mesh(name,new T.CylinderGeometry(r*.8,r,d.length(),7),color);m.position.set(...a).addScaledVector(d,.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return m;}
 const ground=mesh('flores-ground',new T.PlaneGeometry(16,16),'#81916a');ground.rotation.x=-Math.PI/2;
 const path=[];for(let i=1;i<FLORES_ROUTE.length;i++){const a=FLORES_ROUTE[i-1],b=FLORES_ROUTE[i],dx=b.x-a.x,dz=b.z-a.z,l=Math.hypot(dx,dz),x=-dz/l*.30,z=dx/l*.30,p=[[a.x+x,.003,a.z+z],[a.x-x,.003,a.z-z],[b.x-x,.003,b.z-z],[b.x+x,.003,b.z+z]];path.push(...p[0],...p[2],...p[1],...p[0],...p[3],...p[2]);}mesh('flores-observation-path',geometry(path),'#b4b18a',T.DoubleSide);
 const branch=mesh('giraffe-stag-observation-branch',branchGeometry(),'#baaa83');for(const x of[-.6,-.3,0,.3,.6])colliders.push({x,z:0,r:.32});
 for(const[i,t]of FLORES_TREES.entries()){const trunk=mesh('flores-trunk-'+i,new T.CylinderGeometry(t.r*.7,t.r,3.4,9),'#81785b');trunk.position.set(t.x,1.7,t.z);colliders.push({...t});const crown=mesh('flores-crown-'+i,new T.IcosahedronGeometry(1,1),i%2?'#667e4d':'#799461');crown.position.set(t.x,3.65,t.z);crown.scale.set(1.2,.85,1.1);}
 // Rear foliage is an actual opaque surface, not a visibility exception. Its
 // small woody stem joins the observation branch outside the insect lane.
 rod('flores-leaf-stem',[.65,.72,-.13],[.65,1.04,-.5],.015,'#877b55');rod('flores-leaf-petiole',[.65,1.04,-.5],[0,1.02,-.5],.009,'#877b55');
 const leaf=mesh('flores-rear-leaf',geometry([0,.85,-.5,-.34,1.02,-.5,0,1.25,-.5,0,.85,-.5,0,1.25,-.5,.34,1.02,-.5]),'#668747',T.DoubleSide);
 for(const[x,z]of[[-2.1,-1.7],[2.5,-2.6],[-2.8,2.1]]){const shrub=mesh('flores-low-shrub',new T.IcosahedronGeometry(.48,0),'#607e45');shrub.position.set(x,.36,z);shrub.scale.set(1,.8,1);colliders.push({x,z,r:.48});}
 scene.updateMatrixWorld(true);let disposed=false;const stats=Object.freeze({meshes:meshes.length,drawCalls:meshes.length,triangles:meshes.reduce((n,m)=>n+(m.geometry.index?.count??m.geometry.attributes.position.count)/3,0),textures:0,observationBranches:1});
 return{regionId:'flores',insectHomes:Object.freeze([]),heightAt,bounds:FLORES_BOUNDS,spawn:{...FLORES_SPAWN},giraffeStagBranch:branch,observationLeaves:Object.freeze([leaf]),colliders,captureOccluders:[...meshes],meshes:Object.freeze(meshes),stats,locationLabel(){return 'フローレス島参考・明るい林縁（再現区画）';},update(){},dispose(){if(disposed)return;disposed=true;for(const m of meshes){scene.remove(m);m.geometry.dispose();m.material.dispose();}scene.remove(sky,sun,sun.target);if(scene.background===background)scene.background=previous.background;if(scene.fog===fog)scene.fog=previous.fog;}};
}
