/** Two rooted flowers added without changing existing flower cards or seeded RNG. */
import {BEE_FLOWER_SITES as SITES,BEE_FLOWER_SHAPE as SHAPE} from './bee-layout.js?v=0.28.0&b=52b81ed2c56b';
import {BEE_DIMENSIONS as D} from './bee-kinematics.js?v=0.28.0&b=52b81ed2c56b';
const T=window.THREE;
function batch(){const positions=[],colors=[];return{add(g,m,tint){const c=g.index?g.toNonIndexed():g.clone();c.applyMatrix4(m);positions.push(...c.attributes.position.array);const color=new T.Color(tint);for(let i=0;i<c.attributes.position.count;i++)colors.push(color.r,color.g,color.b);c.dispose();},finish(){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();g.computeBoundingSphere();return g;}};}
function stalk(batch,a,b,r0,r1){const start=new T.Vector3(...a),delta=new T.Vector3(...b).sub(start),g=new T.CylinderGeometry(r1,r0,delta.length(),5),m=new T.Matrix4().compose(start.addScaledVector(delta,.5),new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize()),new T.Vector3(1,1,1));batch.add(g,m,'#6b8050');g.dispose();}
export function createBeeHabitat(world,scene){
 const ground=world?.captureOccluders?.[0];if(!scene?.isScene||!ground?.isMesh||typeof world?.heightAt!=='function')throw new TypeError('Existing meadow terrain required');ground.updateWorldMatrix(true,false);
 const ray=new T.Raycaster(),surfaces=[];
 for(const s of SITES){ray.set(new T.Vector3(s.x,10,s.z),new T.Vector3(0,-1,0));ray.far=20;const hit=ray.intersectObject(ground,false)[0];if(!hit||!Number.isFinite(hit.point.y)||!Number.isFinite(world.heightAt(s.x,s.z)))throw new Error('Flower requires actual terrain');surfaces.push({x:s.x,z:s.z,y:hit.point.y+s.height,groundY:hit.point.y});}
 const heads=batch(),plants=batch();
 for(const p of surfaces){
  // Flat central support, below it a shallow solid disc. Petals overlap its rim.
  const disc=new T.CylinderGeometry(SHAPE.discRadius,SHAPE.discRadius-.005,SHAPE.discThickness,SHAPE.segments);heads.add(disc,new T.Matrix4().makeTranslation(p.x,p.y-SHAPE.discThickness/2,p.z),'#b99b53');disc.dispose();
  const petals=[];for(let i=0;i<SHAPE.segments;i++){
   const a=i*Math.PI*2/SHAPE.segments,ca=Math.cos(a),sa=Math.sin(a),v=(r,w,y)=>[p.x+ca*r-sa*w,p.y+y,p.z+sa*r+ca*w],center=v(.081,0,-.003),outline=[v(.050,0,-.002),v(.078,-.012,-.003),v(.11,0,-.005),v(.078,.012,-.003)];
   for(let j=0;j<4;j++)petals.push(...center,...outline[(j+1)%4],...outline[j]);
  }
  const pg=new T.BufferGeometry();pg.setAttribute('position',new T.Float32BufferAttribute(petals,3));pg.computeVertexNormals();heads.add(pg,new T.Matrix4(),'#d9d5d2');pg.dispose();
  const start=[p.x+.02,p.groundY-.015,p.z+.025],end=[p.x,p.y-.004,p.z];stalk(plants,start,end,.006,.0035);
  // Two small leaves have petioles that enter the real stem, well below the corolla.
  for(let n=0;n<2;n++){const t=.34+n*.23,attach=new T.Vector3(start[0]+(end[0]-start[0])*t,start[1]+(end[1]-start[1])*t,start[2]+(end[2]-start[2])*t),a=n?2.4:-.7,base=attach.clone().add(new T.Vector3(Math.sin(a)*.020,.004,Math.cos(a)*.020)),q=new T.Quaternion().setFromEuler(new T.Euler(.12,a,0)),m=new T.Matrix4().compose(base,q,new T.Vector3(1,1,1)),g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([0,0,.05,0,0,0,-.016,0,.047,0,0,.105,.016,0,.047],3));g.setIndex([0,2,1,0,3,2,0,4,3,0,1,4]);g.computeVertexNormals();plants.add(g,m,'#6f8451');g.dispose();stalk(plants,attach.toArray(),base.clone().add(new T.Vector3(0,.001,0).applyQuaternion(q)).toArray(),.002,.0015);}
 }
 const corollas=new T.Mesh(heads.finish(),new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide}));corollas.name='bee-aster-inspired-heads';corollas.receiveShadow=true;const stems=new T.Mesh(plants.finish(),new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide}));stems.name='bee-rooted-stems-and-leaves';stems.receiveShadow=true;scene.add(corollas,stems);corollas.updateMatrixWorld(true);stems.updateMatrixWorld(true);
 const flowers=surfaces.map(p=>({position:{x:p.x,y:p.y+D.rootAboveSupport,z:p.z},heading:0})),home={...flowers[0].position};
 return{homes:[['bee',home.x,home.z,home.y-world.heightAt(home.x,home.z)]],beeSupports:[{home,flowers}],captureOccluders:[corollas,stems],stats:Object.freeze({addedMeshes:2,addedTriangles:(corollas.geometry.attributes.position.count+stems.geometry.attributes.position.count)/3,addedTextures:0,entryRays:2})};
}
