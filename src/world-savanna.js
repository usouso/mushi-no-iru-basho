/** Independent flat-ground display slice. No terrain/time/physics changes to old worlds. */
import {SAVANNA_BOUNDS,SAVANNA_SPAWN,SAVANNA_HOMES,SAVANNA_DUNG_SUPPORTS,DUNG_ORIGIN} from './savanna-layout.js?v=0.39.0&b=8a647322e77c';
import {createDungBallModel,updateDungBallModel} from './dung-model.js?v=0.39.0&b=8a647322e77c';
const THREE=window.THREE;
export const heightAt=()=>0;
const hash=(x,z)=>{const n=Math.sin(x*127.1+z*311.7)*43758.5453;return n-Math.floor(n);};
export function createSavannaWorld(scene){
 scene.background=new THREE.Color('#c6c7b2');scene.fog=new THREE.Fog('#c6c7b2',23,58);
 const sky=new THREE.HemisphereLight('#e4ecdd','#8b795c',.95);scene.add(sky);
 const sun=new THREE.DirectionalLight('#fff0cf',1.15);sun.position.set(-12,21,9);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-15;sun.shadow.camera.right=15;sun.shadow.camera.top=15;sun.shadow.camera.bottom=-15;sun.shadow.camera.near=1;sun.shadow.camera.far=70;sun.shadow.bias=-.0003;scene.add(sun);
 const meshes=[],colliders=[],add=(geometry,material,name)=>{const m=new THREE.Mesh(geometry,material);m.name=name;m.receiveShadow=true;scene.add(m);meshes.push(m);return m;};
 const g=new THREE.PlaneGeometry(60,60,40,40);g.rotateX(-Math.PI/2);const pos=g.attributes.position,colors=[];
 for(let i=0;i<pos.count;i++){pos.setY(i,0);const h=hash(pos.getX(i),pos.getZ(i)),c=new THREE.Color('#a39571').multiplyScalar(.90+h*.16);colors.push(c.r,c.g,c.b);}g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 const ground=add(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1}),'savanna-ground');
 // Sparse tapered dry blades. The central approach and rolling strip remain bare.
 const blade=new THREE.BufferGeometry();blade.setAttribute('position',new THREE.Float32BufferAttribute([-.025,0,0,.025,0,0,.012,.32,0, 0,0,-.024,0,0,.024,0,.25,-.018, -.018,0,-.018,.018,0,.018,-.05,.20,.02],3));blade.computeVertexNormals();
 const points=[];for(let x=-27;x<=27;x+=1.1)for(let z=-27;z<=27;z+=1.1){if(Math.abs(x)<3&&z>-1&&z<11)continue;const q=hash(x+7,z-2);if(q<.42)continue;points.push([x+(q-.5)*.6,z+(hash(x,z+5)-.5)*.6,q]);}
 const grasses=new THREE.InstancedMesh(blade,new THREE.MeshStandardMaterial({color:'#9c955c',roughness:1,side:THREE.DoubleSide}),points.length);grasses.name='savanna-dry-grass';const matrix=new THREE.Matrix4(),quat=new THREE.Quaternion(),up=new THREE.Vector3(0,1,0),p=new THREE.Vector3(),scale=new THREE.Vector3();
 points.forEach(([x,z,q],i)=>{quat.setFromAxisAngle(up,q*6.28);matrix.compose(p.set(x,0,z),quat,scale.setScalar(.6+q*.7));grasses.setMatrixAt(i,matrix);grasses.setColorAt(i,new THREE.Color('#aaa06b').multiplyScalar(.75+q*.35));});grasses.receiveShadow=true;scene.add(grasses);meshes.push(grasses);
 // Widely separated low boundary shrubs, not a dense forest or route wall.
 const locations=[[-12,4],[-9,-9],[10,-7],[14,6],[-18,17],[17,17],[-19,-16],[19,-18]];
 const trunks=new THREE.InstancedMesh(new THREE.CylinderGeometry(.08,.16,1.4,7),new THREE.MeshStandardMaterial({color:'#766348',roughness:1}),locations.length);trunks.name='savanna-boundary-stems';
 const crowns=new THREE.InstancedMesh(new THREE.SphereGeometry(1,10,6),new THREE.MeshStandardMaterial({color:'#777e49',roughness:1}),locations.length*3);crowns.name='savanna-low-shrubs';
 locations.forEach(([x,z],i)=>{quat.identity();matrix.compose(p.set(x,.7,z),quat,scale.set(1,1,1));trunks.setMatrixAt(i,matrix);colliders.push({x,z,r:.3});for(let j=0;j<3;j++){const a=j*Math.PI*2/3+i;matrix.compose(p.set(x+Math.cos(a)*.55,1.3+j*.12,z+Math.sin(a)*.55),quat,scale.set(1.05,.65,1));crowns.setMatrixAt(i*3+j,matrix);}});
 for(const m of[trunks,crowns]){m.castShadow=true;m.receiveShadow=true;scene.add(m);meshes.push(m);}
 const ball=createDungBallModel();scene.add(ball);meshes.push(ball);
 const setDungBall=state=>{updateDungBallModel(ball,state);if(state)ball.layers.enable(0);else ball.layers.disable(0);};
 setDungBall({id:'ball-1',position:{x:DUNG_ORIGIN.x,y:DUNG_ORIGIN.y+.08,z:DUNG_ORIGIN.z},radius:.08,angle:0});
 const stats={meshes:meshes.length,triangles:0,instances:0};for(const m of meshes){stats.triangles+=(m.geometry.index?.count??m.geometry.attributes.position.count)/3*(m.isInstancedMesh?m.count:1);if(m.isInstancedMesh)stats.instances+=m.count;}
 // Scene-root disposal owns geometry/material/texture and InstancedMesh events.
 // The dynamic ball updates its world matrix synchronously before each LOS query.
 return {heightAt,bounds:SAVANNA_BOUNDS,spawn:SAVANNA_SPAWN,colliders,insectHomes:SAVANNA_HOMES,dungSupports:SAVANNA_DUNG_SUPPORTS,setDungBall,captureOccluders:[ground,trunks,ball],meshes,stats,landmarks:{rollingStrip:{x:0,z:4,length:1.8}},locationLabel:(x,z)=>Math.abs(x)<3&&z>2&&z<9?'露出した土の転がし道':'乾いた草地',update(){}};
}
