import {sampleJewelPose,JEWEL_DIMENSIONS as D} from './jewel-kinematics.js?v=0.18.1&b=0f85c9d0b1ba';
/** Original wedge-shaped jewel beetle. Closed wings and leaf walking only; no feeding or flight.
 * Metallic materials approximate appearance, not physical structural-color spectra. */
const T=window.THREE;
function ellipsoid(parent,p,s,material){const m=new T.Mesh(new T.SphereGeometry(1,8,6),material);m.position.set(...p);m.scale.set(...s);parent.add(m);return m;}
function rod(parent,a,b,r,material){const delta=new T.Vector3(...b).sub(new T.Vector3(...a)),m=new T.Mesh(new T.CylinderGeometry(r*.55,r,delta.length(),5),material);m.position.set(...a).addScaledVector(delta,.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());parent.add(m);}
function merge(parent,name,material){const attributes={position:[],normal:[]};for(const child of [...parent.children]){child.updateMatrix();const g=child.geometry.index?child.geometry.toNonIndexed():child.geometry.clone();g.applyMatrix4(child.matrix);for(const key in attributes)attributes[key].push(...g.attributes[key].array);child.geometry.dispose();g.dispose();parent.remove(child);}const g=new T.BufferGeometry();for(const key in attributes)g.setAttribute(key,new T.Float32BufferAttribute(attributes[key],3));g.computeBoundingSphere();const mesh=new T.Mesh(g,material);mesh.name=name;parent.add(mesh);return mesh;}
function createLeg(parent,p,material){const g=new T.BufferGeometry(),positions=new Float32Array(28*3),indices=[];g.setAttribute('position',new T.BufferAttribute(positions,3));for(let bone=0;bone<2;bone++){const o=14*bone;for(let i=0;i<6;i++){const j=(i+1)%6;indices.push(o+i,o+j,o+6+j,o+i,o+6+j,o+6+i,o+12,o+j,o+i,o+13,o+6+i,o+6+j);}}g.setIndex(indices);const m=new T.Mesh(g,material);m.name=`jewel-leg-${p.id}`;m.userData={role:p.role,side:p.side};parent.add(m);return{mesh:m,a:new T.Vector3(),b:new T.Vector3(),axis:new T.Vector3(),u:new T.Vector3(),v:new T.Vector3()};}
function updateLeg(l,p){const a=l.mesh.geometry.attributes.position;for(let bone=0;bone<2;bone++){const start=bone?p.knee:p.hip,end=bone?p.foot:p.knee;l.a.set(start.x,start.y,start.z);l.b.set(end.x,end.y,end.z);l.axis.copy(l.b).sub(l.a).normalize();l.u.set(0,1,0);l.v.crossVectors(l.axis,l.u).normalize();l.u.crossVectors(l.v,l.axis).normalize();for(let e=0;e<2;e++){const base=e?l.b:l.a,r=bone===1&&e===1?0:bone===0?.0018:.0013;for(let i=0;i<6;i++){const t=i/6*Math.PI*2;a.setXYZ(bone*14+e*6+i,base.x+r*(Math.cos(t)*l.u.x+Math.sin(t)*l.v.x),base.y+r*(Math.cos(t)*l.u.y+Math.sin(t)*l.v.y),base.z+r*(Math.cos(t)*l.u.z+Math.sin(t)*l.v.z));}}a.setXYZ(bone*14+12,l.a.x,l.a.y,l.a.z);a.setXYZ(bone*14+13,l.b.x,l.b.y,l.b.z);}a.needsUpdate=true;l.mesh.geometry.computeVertexNormals();l.mesh.geometry.computeBoundingSphere();l.mesh.userData.foot={...p.foot};}
function meshFrom(p,idx,mat,name){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();g.computeBoundingSphere();const m=new T.Mesh(g,mat);m.name=name;return m;}
// Axial sections, rear to front: a pointed wedge, not a rounded horned-beetle shell.
const SECTIONS=[[-.080,.001,0],[-.065,.009,.007],[-.045,.015,.012],[-.020,.021,.015],[.005,.025,.017],[.025,.025,.015],[.035,.019,.008]],RIM_Y=-.003,FLOOR_Y=-.008;
function abdomen(material){
 const positions=[],indices=[],section=[[-1,RIM_Y],[-.85,FLOOR_Y],[0,FLOOR_Y],[.85,FLOOR_Y],[1,RIM_Y],[.85,-.014],[0,-.017],[-.85,-.014]];
 for(const[z,width]of SECTIONS)for(const[x,y]of section)positions.push(x*width,y,z);
 const N=section.length;for(let k=0;k<SECTIONS.length-1;k++)for(let j=0;j<N;j++){const a=k*N+j,b=k*N+(j+1)%N,c=b+N,d=a+N;indices.push(a,d,b,b,d,c);}const caps=T.ShapeUtils.triangulateShape(section.map(([x,y])=>new T.Vector2(x,y)),[]);for(const tri of caps){const a=section[tri[0]],b=section[tri[1]],c=section[tri[2]],ids=tri.slice();if((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])>0)ids.reverse();indices.push(...ids);const o=(SECTIONS.length-1)*N;indices.push(...ids.slice().reverse().map(j=>o+j));}return meshFrom(positions,indices,material,'jewel-wedge-abdomen-floor-rim');
}
function elytron(side,material){
 const angles=[0,.18,.40,.65,.90,1.15,Math.PI/2],p=[],indices=[],colors=[],green=new T.Color('#4f9664'),violet=new T.Color('#97415e');
 // Each longitudinal stripe is a face color on the shell itself, never a floating ribbon.
 for(let k=0;k<SECTIONS.length-1;k++)for(let j=0;j<angles.length-1;j++){
  const base=p.length/3,color=j===2||j===3?violet:green;
  for(const[row,col]of[[k,j],[k+1,j],[k+1,j+1],[k,j+1]]){const[z,w,h]=SECTIONS[row],a=angles[col];p.push(side*w*Math.sin(a),RIM_Y+h*Math.cos(a),z);colors.push(color.r,color.g,color.b);}
  if(side===1)indices.push(base,base+1,base+2,base,base+2,base+3);else indices.push(base,base+2,base+1,base,base+3,base+2);
 }
 const m=meshFrom(p,indices,material,`jewel-elytron-${side}`);m.geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));m.userData={role:'elytron',side,paintedLongitudinalBand:true};return m;
}
export function createJewelModel({inspection=false}={}){
 const root=new T.Group();root.name=`jewel-${inspection?'inspection':'lab'}`;
 const green=new T.MeshStandardMaterial({color:'#3e7453',roughness:.46,metalness:.28}),shellMat=new T.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.36,metalness:.45,side:T.DoubleSide}),membrane=new T.MeshStandardMaterial({color:'#8b7960',roughness:.8,side:T.DoubleSide}),eyeMat=new T.MeshStandardMaterial({color:'#20291f',roughness:.36});
 const body=new T.Group();root.add(body);body.add(abdomen(green));ellipsoid(body,[0,0,.045],[.022,.014,.020],green);ellipsoid(body,[0,0,.069],[.015,.011,.011],green);const bodyHeadVertexCount=body.children.reduce((n,m)=>n+(m.geometry.index?.count??m.geometry.attributes.position.count),0);
 for(const side of[-1,1]){for(const z of[.045,.006,-.040])ellipsoid(body,[side*.012,-.010,z],[.004,.004,.008],green);ellipsoid(body,[side*.004,-.004,.020],[.003,.005,.007],green);rod(body,[side*.010,.001,.074],[side*.019,.002,.085],.001,green);rod(body,[side*.019,.002,.085],[side*.026,.001,.086],.0009,green);}
 const bodyMesh=merge(body,'jewel-wedge-body-head-short-antennae',green);bodyMesh.userData={role:'body',bodyHeadVertexCount};const eyes=new T.Group();root.add(eyes);for(const side of[-1,1])ellipsoid(eyes,[side*.012,.002,.070],[.004,.005,.006],eyeMat);merge(eyes,'jewel-paired-eyes',eyeMat);
 const elytra=[],hindwings=[];for(const side of[-1,1]){const e=elytron(side,shellMat);root.add(e);elytra.push(e);const w=meshFrom([side*.004,-.001,.020,side*.010,-.001,-.010,side*.008,-.001,-.040,side*.005,-.001,-.052],[0,1,2,0,2,3],membrane,`jewel-stored-hindwing-${side}`);w.userData={role:'hindwing',side,stored:true};root.add(w);hindwings.push(w);}
 const pose=sampleJewelPose(),legs=pose.legs.map(l=>createLeg(root,l,green));root.userData={species:'jewel-study',inspection,bodyMesh,elytra,hindwings,legs,rootAboveSupport:D.rootAboveSupport,antennaCount:2};apply(root,pose);return root;
}
function apply(root,pose){for(let i=0;i<6;i++)updateLeg(root.userData.legs[i],pose.legs[i]);root.updateMatrixWorld(true);}
export function updateJewelModel(root,state={}){if(root.userData.inspection)return root;const p=sampleJewelPose(state);root.position.set(p.body.position.x,p.body.position.y,p.body.position.z);root.rotation.order='YXZ';root.rotation.set(0,p.body.heading,0);apply(root,p);return root;}
