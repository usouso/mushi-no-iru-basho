import {sampleDungPose} from './dung-kinematics.js?v=0.23.0&b=6eab031e296e';
/** Body-centred dung-beetle renderer and independently scene-owned ball.
 * Original provisional beetle/ball shapes. Pure poses are owned by dung-kinematics.
 * No timers, locomotion, random state updates, IK, physics, or imported art here.
 */
const THREE=window.THREE;
const xyz=(v,p)=>v.set(p.x,p.y,p.z);
function sphere(parent,position,scale,material){const mesh=new THREE.Mesh(new THREE.SphereGeometry(1,10,8),material);mesh.position.set(...position);mesh.scale.set(...scale);parent.add(mesh);return mesh;}
function rod(parent,a,b,r,material){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),d=end.clone().sub(start),mesh=new THREE.Mesh(new THREE.CylinderGeometry(r*.7,r,d.length(),5),material);mesh.position.copy(start.add(end).multiplyScalar(.5));mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());parent.add(mesh);}
function batch(parent){
 const groups=new Map();for(const m of [...parent.children]){if(!m.isMesh)continue;if(!groups.has(m.material))groups.set(m.material,[]);groups.get(m.material).push(m);}
 for(const[material,meshes]of groups){const arrays={position:[],normal:[],uv:[]};for(const m of meshes){m.updateMatrix();const g=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();g.applyMatrix4(m.matrix);for(const key of Object.keys(arrays))arrays[key].push(...g.attributes[key].array);parent.remove(m);g.dispose();m.geometry.dispose();}const g=new THREE.BufferGeometry();for(const[key,data]of Object.entries(arrays))g.setAttribute(key,new THREE.Float32BufferAttribute(data,key==='uv'?2:3));g.computeBoundingSphere();parent.add(new THREE.Mesh(g,material));}
}
function ballTexture(){
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=128;const c=canvas.getContext('2d');c.fillStyle='#70604a';c.fillRect(0,0,256,128);
 // An original, deterministic paint pattern makes rotation visible without
 // moving vertices away from the supporting sphere. Not a source photograph.
 let seed=493;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<150;i++){const x=random()*256,y=random()*128,rx=2+random()*8,ry=1+random()*4;c.fillStyle=i%3===0?'#8a7859':i%3===1?'#5e513f':'#776b50';c.beginPath();c.ellipse(x,y,rx,ry,random()*3,0,Math.PI*2);c.fill();}
 const texture=new THREE.CanvasTexture(canvas);texture.encoding=THREE.sRGBEncoding;texture.wrapS=THREE.RepeatWrapping;return texture;
}
function limb(parent,id,material){
 const positions=new Float32Array(84),indices=[];for(let bone=0;bone<2;bone++){const o=bone*14;for(let i=0;i<6;i++){const j=(i+1)%6;indices.push(o+i,o+j,o+6+j,o+i,o+6+j,o+6+i,o+12,o+j,o+i,o+13,o+6+i,o+6+j);}}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setIndex(indices);const mesh=new THREE.Mesh(geometry,material);mesh.name=`dung-study-leg-${id}`;parent.add(mesh);
 return{mesh,geometry,a:new THREE.Vector3(),b:new THREE.Vector3(),axis:new THREE.Vector3(),u:new THREE.Vector3(),v:new THREE.Vector3(),normal:new THREE.Vector3(),tu:new THREE.Vector3(),tv:new THREE.Vector3()};
}
function updateLimb(l,p,bodyPosition,inverse){
 const positions=l.geometry.attributes.position;xyz(l.normal,p.contactNormal).normalize();l.tu.set(1,0,0).addScaledVector(l.normal,-l.normal.x);if(l.tu.lengthSq()<1e-10)l.tu.set(0,0,1).addScaledVector(l.normal,-l.normal.z);l.tu.normalize();l.tv.crossVectors(l.normal,l.tu);
 for(let bone=0;bone<2;bone++){
  xyz(l.a,bone?p.knee:p.hip);xyz(l.b,bone?p.foot:p.knee);l.axis.copy(l.b).sub(l.a).normalize();l.u.set(1,0,0).addScaledVector(l.axis,-l.axis.x);if(l.u.lengthSq()<1e-10)l.u.set(0,1,0).addScaledVector(l.axis,-l.axis.y);l.u.normalize();l.v.crossVectors(l.axis,l.u);
  for(let end=0;end<2;end++)for(let i=0;i<6;i++){const a=i*Math.PI/3,r=(bone?.00135:.002)*(end?.62:1),x=Math.cos(a)*r,y=Math.sin(a)*r,base=end?l.b:l.a,u=bone&&end?l.tu:l.u,v=bone&&end?l.tv:l.v;positions.setXYZ(bone*14+end*6+i,base.x+u.x*x+v.x*y,base.y+u.y*x+v.y*y,base.z+u.z*x+v.z*y);}
  positions.setXYZ(bone*14+12,l.a.x,l.a.y,l.a.z);positions.setXYZ(bone*14+13,l.b.x,l.b.y,l.b.z);
 }
 // Build the proven lab cross-sections in the canonical ground frame, then
 // transform ONCE into body-local coordinates. The field root restores them.
 for(let i=0;i<positions.count;i++){l.a.fromBufferAttribute(positions,i).sub(bodyPosition).applyQuaternion(inverse);positions.setXYZ(i,l.a.x,l.a.y,l.a.z);}
 positions.needsUpdate=true;l.geometry.computeVertexNormals();l.geometry.computeBoundingSphere();
}
export function createDungBeetleModel({inspection=false}={}){
 const group=new THREE.Group();group.name=`dungbeetle-${inspection?'inspection':'field'}`;const visual=new THREE.Group();visual.name='dung-beetle-visual';group.add(visual);const body=new THREE.Group();body.name='dung-beetle-body';visual.add(body);
 const shell=new THREE.MeshStandardMaterial({color:'#484331',roughness:.64}),dark=new THREE.MeshStandardMaterial({color:'#282b25',roughness:.7}),legMaterial=new THREE.MeshStandardMaterial({color:'#514c38',roughness:.8});
 // 160mm head/body, 88mm wide. No unsupported species-diagnostic ornament.
 for(const side of [-1,1])sphere(body,[side*.018,.002,-.025],[.026,.023,.055],shell);
 sphere(body,[0,0,.035],[.040,.025,.027],shell);sphere(body,[0,-.003,.063],[.030,.018,.017],dark);
 for(const side of [-1,1]){sphere(body,[side*.026,.006,.065],[.004,.004,.005],dark);rod(body,[side*.018,.005,.073],[side*.031,.012,.084],.0015,dark);rod(body,[side*.031,.012,.084],[side*.040,.012,.089],.0017,dark);}
 batch(body);
 const legs=[];for(let i=0;i<6;i++)legs.push(limb(visual,i,legMaterial));
 group.userData={species:'dungbeetle',inspection,visual,body,legs,containsDungBall:false,rotation:new THREE.Euler(0,0,0,'YXZ'),inverse:new THREE.Quaternion(),bodyPosition:new THREE.Vector3(),poseDistance:null};
 group.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false;}});updateDungBeetleModel(group,{dungDistance:0,dungOrigin:{x:0,y:0,z:0}});return group;
}
export function updateDungBeetleModel(group,item){
 const data=group.userData,distance=data.inspection?0:item.dungDistance,pose=sampleDungPose({distance}),origin=item.dungOrigin||{x:0,y:0,z:0};
 data.rotation.set(pose.body.pitch,pose.body.heading,0,'YXZ');data.inverse.setFromEuler(data.rotation).invert();xyz(data.bodyPosition,pose.body.position);
 if(data.poseDistance!==distance){for(let i=0;i<6;i++)updateLimb(data.legs[i],pose.legs[i],data.bodyPosition,data.inverse);data.poseDistance=distance;}
 if(!data.inspection){group.visible=!item.caught;group.position.set(pose.body.position.x+origin.x,pose.body.position.y+origin.y,pose.body.position.z+origin.z);group.quaternion.setFromEuler(data.rotation);}
 return group;
}
export function createDungBallModel(){
 const ball=new THREE.Mesh(new THREE.SphereGeometry(.08,48,24),new THREE.MeshStandardMaterial({map:ballTexture(),color:'#ffffff',roughness:1}));ball.name='dung-ball';ball.userData.isDungBall=true;ball.castShadow=true;ball.receiveShadow=true;return ball;
}
export function updateDungBallModel(mesh,ball){
 mesh.visible=!!ball;if(ball){xyz(mesh.position,ball.position);mesh.rotation.set(ball.angle,0,0);mesh.updateMatrixWorld(true);}return mesh;
}
