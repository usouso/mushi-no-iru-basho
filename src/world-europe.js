/** Small independent broadleaf woodland-edge display with readable warm light.
 * Original generic tree forms; no measured terrain, vegetation or time system. */
import {EUROPE_BOUNDS,EUROPE_SPAWN,EUROPE_TREES,EUROPE_LOG as L} from './europe-stag-layout.js?v=0.64.0&b=3616c2fe808e';
const T=window.THREE;
export const heightAt=()=>0;
function logGeometry(){
 // Closed eight-sided solid touching the terrain. Its top is the actual support.
 const ring=[[-L.topHalfWidth,0],[-L.halfWidth,.18],[-L.halfWidth,.29],[-L.topHalfWidth,L.top],[L.topHalfWidth,L.top],[L.halfWidth,.29],[L.halfWidth,.18],[L.topHalfWidth,0]],p=[],index=[];
 for(const x of[-L.halfLength,L.halfLength])for(const[z,y]of ring)p.push(x,y,z);
 for(let i=0;i<8;i++){const j=(i+1)%8;index.push(i,j,i+8,j,j+8,i+8);}
 for(let i=1;i<7;i++)index.push(0,i+1,i,8,8+i,8+i+1);
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(index);g.computeVertexNormals();g.computeBoundingSphere();return g;
}
export function createEuropeWorld(scene){
 if(!scene?.isScene)throw new TypeError('Europe world requires a Three scene');
 const previous={background:scene.background,fog:scene.fog},background=new T.Color('#c3b4a1'),fog=new T.Fog('#b9ae9c',13,28),meshes=[],colliders=[];
 scene.background=background;scene.fog=fog;
 // Evening is a fixed art treatment: strong ambient fill keeps dark heads readable.
 const sky=new T.HemisphereLight('#efe0ce','#575747',1.05),sun=new T.DirectionalLight('#ffd6ac',.85);sun.position.set(-7,7,5);scene.add(sky,sun,sun.target);
 function mesh(name,g,material){const m=new T.Mesh(g,material);m.name=name;m.receiveShadow=true;scene.add(m);meshes.push(m);return m;}
 const ground=mesh('europe-ground',new T.PlaneGeometry(20,20),new T.MeshLambertMaterial({color:'#8c896c'}));ground.rotation.x=-Math.PI/2;
 const log=mesh('europe-fallen-log',logGeometry(),new T.MeshLambertMaterial({color:'#9a8c78'}));
 // Existing player collision uses circles plus a .28m body radius. These cover
 // the solid footprint, including both ends; they are not support surfaces.
 for(let i=-3;i<=3;i++)colliders.push({x:i*.46,z:0,r:.59});
 for(const [i,t]of EUROPE_TREES.entries()){
  const trunk=mesh('europe-boundary-trunk',new T.CylinderGeometry(.17,t.r,3.8,7),new T.MeshLambertMaterial({color:'#786e5e'}));trunk.position.set(t.x,1.9,t.z);colliders.push({...t});
  const crown=mesh('europe-boundary-crown',new T.IcosahedronGeometry(1,1),new T.MeshLambertMaterial({color:i%2?'#6e7955':'#7e8159'}));crown.position.set(t.x,4.0,t.z);crown.scale.set(i%2?1.7:1.9,1.35,1.6);
 }
 scene.updateMatrixWorld(true);
 const stats=Object.freeze({meshes:meshes.length,drawCalls:meshes.length,triangles:meshes.reduce((n,m)=>n+(m.geometry.index?.count??m.geometry.attributes.position.count)/3,0),textures:0,fallenLogs:1});
 let disposed=false;
 return{regionId:'europe',heightAt,bounds:EUROPE_BOUNDS,spawn:{...EUROPE_SPAWN},insectHomes:[],colliders,captureOccluders:[...meshes],meshes:Object.freeze(meshes),europeStagLog:log,stats,locationLabel(){return '南東イングランド参考・夕方の広葉樹林縁（再現区画）';},update(){},dispose(){if(disposed)return;disposed=true;const geometries=new Set(),materials=new Set();for(const m of meshes){geometries.add(m.geometry);materials.add(m.material);scene.remove(m);}for(const g of geometries)g.dispose();for(const m of materials)m.dispose();scene.remove(sky,sun,sun.target);if(scene.background===background)scene.background=previous.background;if(scene.fog===fog)scene.fog=previous.fog;}};
}
