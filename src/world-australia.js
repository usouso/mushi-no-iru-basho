/** Bounded independent Australian rainforest-reference display foundation.
 * Generic original broadleaf forms; no particular plant/community reconstruction. */
import {AUSTRALIA_BOUNDS,AUSTRALIA_SPAWN,AUSTRALIA_TREES,RAINBOW_LOG as L} from './rainbow-stag-layout.js?v=0.67.0&b=06ee2abee345';
const T=window.THREE;
export const heightAt=()=>0;
function logGeometry(){
 // One closed hexagonal prism: real horizontal upper facet, not an invisible plane.
 const ring=[[-L.topHalfWidth,0],[-L.halfWidth,.25],[-L.topHalfWidth,L.top],[L.topHalfWidth,L.top],[L.halfWidth,.25],[L.topHalfWidth,0]],p=[],index=[];
 for(const x of[-L.halfLength,L.halfLength])for(const[z,y]of ring)p.push(x,y,z);
 for(let i=0;i<6;i++){const j=(i+1)%6;index.push(i,j,i+6,j,j+6,i+6);}
 for(let i=1;i<5;i++){index.push(0,i+1,i,6,6+i,6+i+1);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(index);g.computeVertexNormals();g.computeBoundingSphere();return g;
}
export function createAustraliaWorld(scene){
 if(!scene?.isScene)throw new TypeError('Australia world requires a Three scene');
 const previous={background:scene.background,fog:scene.fog},background=new T.Color('#adbdb2'),fog=new T.Fog('#adbdb2',12,27),meshes=[],colliders=[];
 scene.background=background;scene.fog=fog;
 const sky=new T.HemisphereLight('#e5eadb','#555d49',1.05),sun=new T.DirectionalLight('#f8ebd0',.9);sun.position.set(-5,10,6);scene.add(sky,sun,sun.target);
 function mesh(name,g,material){const m=new T.Mesh(g,material);m.name=name;m.receiveShadow=true;scene.add(m);meshes.push(m);return m;}
 const ground=mesh('australia-ground',new T.PlaneGeometry(20,20),new T.MeshLambertMaterial({color:'#797f60'}));ground.rotation.x=-Math.PI/2;
 const log=mesh('australia-fallen-log',logGeometry(),new T.MeshLambertMaterial({color:'#78664e'}));
 // The existing player uses circles + .28 body radius. These cover the full log
 // footprint, with no gap between circles and no independent hidden support.
 for(let i=-3;i<=3;i++)colliders.push({x:i*.45,z:0,r:.56});
 for(const t of AUSTRALIA_TREES){const trunk=mesh('australia-boundary-trunk',new T.CylinderGeometry(.19,t.r,4.4,7),new T.MeshLambertMaterial({color:'#70725c'}));trunk.position.set(t.x,2.2,t.z);colliders.push({...t});const crown=mesh('australia-boundary-crown',new T.IcosahedronGeometry(1,1),new T.MeshLambertMaterial({color:'#547355'}));crown.position.set(t.x,4.5,t.z);crown.scale.set(1.8,1.2,1.55);}
 scene.updateMatrixWorld(true);
 const stats=Object.freeze({meshes:meshes.length,drawCalls:meshes.length,triangles:meshes.reduce((n,m)=>n+(m.geometry.index?.count??m.geometry.attributes.position.count)/3,0),textures:0,fallenLogs:1});
 let disposed=false;return{regionId:'australia',heightAt,bounds:AUSTRALIA_BOUNDS,spawn:{...AUSTRALIA_SPAWN},insectHomes:[],colliders,captureOccluders:[...meshes],meshes:Object.freeze(meshes),rainbowLog:log,stats,locationLabel(){return '北東オーストラリア・雨林の倒木（再現区画）';},update(){},dispose(){if(disposed)return;disposed=true;const geometries=new Set(),materials=new Set();for(const m of meshes){geometries.add(m.geometry);materials.add(m.material);scene.remove(m);}for(const g of geometries)g.dispose();for(const m of materials)m.dispose();scene.remove(sky,sun,sun.target);if(scene.background===background)scene.background=previous.background;if(scene.fog===fog)scene.fog=previous.fog;}};
}
