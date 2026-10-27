import {sampleMetalliferPose} from './metallifer-kinematics.js?v=0.41.0&b=bed5219b02cd';
/** Original male Cyclommatus metallifer display. No photograph tracing or
 * textures. Display dimensions are game readability choices, NOT measurements.
 * Root coordinates: +Z forward; resting feet touch Y=0. Short display steps and
 * jaw opening only; simulation owns travel/capture. Inspection stays lab-static.
 */
const T=window.THREE;
export const METALLIFER_DIMENSIONS=Object.freeze({bodyLength:.160,bodyRearZ:-.085,headFrontZ:.075,jawTipZ:.282,jawProjection:.207,bodyWidth:.086,pronotumWidth:.060,displayLength:.367,rootAboveSupport:0,restJawOpen:.15,maxJawAngle:.32,sex:'male',displayScaleOnly:true});
const xyz=p=>({x:p[0],y:p[1],z:p[2]});
function meshFrom(positions,indices,material,name){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();g.computeBoundingSphere();return Object.assign(new T.Mesh(g,material),{name});}
function ellipsoid(parent,p,s,material){const m=new T.Mesh(new T.SphereGeometry(1,8,6),material);m.position.set(...p);m.scale.set(...s);parent.add(m);return m;}
function merge(parent,name,material){
 const positions=[],normals=[],ranges=[];let vertex=0,index=0;
 for(const child of[...parent.children]){child.updateMatrix();const g=child.geometry.index?child.geometry.toNonIndexed():child.geometry.clone();g.applyMatrix4(child.matrix);positions.push(...g.attributes.position.array);normals.push(...g.attributes.normal.array);ranges.push({vertexStart:vertex,vertexCount:g.attributes.position.count,indexStart:index,indexCount:g.attributes.position.count});vertex+=g.attributes.position.count;index+=g.attributes.position.count;child.geometry.dispose();g.dispose();parent.remove(child);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));g.computeBoundingSphere();const m=new T.Mesh(g,material);m.name=name;return{mesh:m,ranges};
}
function tube(parent,points,widths,material,flatten=1,sides=6){
 const p=[],indices=[];
 for(let i=0;i<points.length;i++){
  const q=new T.Vector3(...points[i]),axis=new T.Vector3(...points[Math.min(i+1,points.length-1)]).sub(new T.Vector3(...points[Math.max(0,i-1)])).normalize();
  const vertical=new T.Vector3(0,1,0),across=new T.Vector3().crossVectors(axis,vertical).normalize();if(across.lengthSq()<.5)across.set(1,0,0);vertical.crossVectors(across,axis).normalize();
  for(let j=0;j<sides;j++){const a=j/sides*Math.PI*2,u=widths[i]*Math.cos(a),v=widths[i]*flatten*Math.sin(a);p.push(q.x+across.x*u+vertical.x*v,q.y+across.y*u+vertical.y*v,q.z+across.z*u+vertical.z*v);}
 }
 for(let i=0;i<points.length-1;i++)for(let j=0;j<sides;j++){const a=i*sides+j,b=i*sides+(j+1)%sides;indices.push(a,b,a+sides,b,b+sides,a+sides);}
 for(let j=1;j<sides-1;j++){indices.push(0,j+1,j);const o=(points.length-1)*sides;indices.push(o,o+j,o+j+1);}
 const m=meshFrom(p,indices,material,'');parent.add(m);return m;
}
function lowerAbdomen(material){
 const p=[],indices=[],N=20;
 for(let ring=0;ring<7;ring++)for(let j=0;j<N;j++){const a=j/N*Math.PI*2,t=Math.min(ring,4)/4*Math.PI/2,r=ring<=4?Math.sin(t):ring===5?.9:0,y=ring<=4?.045-.018*Math.cos(t):.048;p.push(.034*r*Math.sin(a),y,-.040+.045*r*Math.cos(a));}
 for(let k=0;k<6;k++)for(let j=0;j<N;j++){const a=k*N+j,b=k*N+(j+1)%N;indices.push(a,b,a+N,b,b+N,a+N);}return meshFrom(p,indices,material,'abdomen');
}
function head(material){
 const outline=[[-.026,.027],[.026,.027],[.043,.064],[.035,.075],[-.035,.075],[-.043,.064]],p=[],indices=[],n=outline.length;
 for(const y of[.043,.060])for(const[x,z]of outline)p.push(x,y,z);p.push(0,.041,.051,0,.068,.051);
 for(let i=0;i<n;i++){const j=(i+1)%n;indices.push(i,j,n+j,i,n+j,n+i,2*n,j,i,2*n+1,n+i,n+j);}
 return meshFrom(p,indices,material,'head');
}
function elytron(side,material){
 const p=[],indices=[],N=7,M=14;
 for(let i=0;i<=N;i++)for(let j=0;j<=M;j++){const t=i/N*Math.PI/2,a=j/M*Math.PI;p.push(side*.034*Math.sin(t)*Math.sin(a),.045+.024*Math.cos(t),-.040+.045*Math.sin(t)*Math.cos(a));}
 for(let i=0;i<N;i++)for(let j=0;j<M;j++){const a=i*(M+1)+j,b=a+M+1;if(side>0)indices.push(a,b,a+1,a+1,b,b+1);else indices.push(a,a+1,b,a+1,b+1,b);}
 const m=meshFrom(p,indices,material,`metallifer-elytron-${side}`);m.userData={role:'elytron',side};return m;
}

function createLegRig(leg){
 const indices=[];for(let i=0;i<3;i++)for(let j=0;j<6;j++){const a=i*6+j,b=i*6+(j+1)%6;indices.push(a,b,a+6,b,b+6,a+6);}for(let j=1;j<5;j++)indices.push(0,j+1,j,18,18+j,18+j+1);
 const surface=new T.BufferGeometry();surface.setAttribute('position',new T.Float32BufferAttribute(new Float32Array(72),3));surface.setIndex(indices);
 return{surface,indices,q:new T.Vector3(),axis:new T.Vector3(),vertical:new T.Vector3(),across:new T.Vector3()};
}
function updateLegRig(leg,pose){
 const r=leg.rig,points=[pose.hip,pose.knee,pose.ankle,pose.foot],widths=[.0038,.003,.0013,0],positions=r.surface.attributes.position;
 for(let i=0;i<4;i++){
  const previous=points[Math.max(0,i-1)],next=points[Math.min(3,i+1)],q=points[i];r.axis.set(next.x-previous.x,next.y-previous.y,next.z-previous.z).normalize();r.vertical.set(0,1,0);r.across.crossVectors(r.axis,r.vertical).normalize();if(r.across.lengthSq()<.5)r.across.set(1,0,0);r.vertical.crossVectors(r.across,r.axis).normalize();
  for(let j=0;j<6;j++){const a=j/6*Math.PI*2,u=widths[i]*Math.cos(a),v=widths[i]*Math.sin(a);positions.setXYZ(i*6+j,q.x+r.across.x*u+r.vertical.x*v,q.y+r.across.y*u+r.vertical.y*v,q.z+r.across.z*u+r.vertical.z*v);}
 }
 r.surface.computeVertexNormals();const normal=r.surface.attributes.normal,out=leg.mesh.geometry.attributes.position,outNormal=leg.mesh.geometry.attributes.normal;
 for(let n=0;n<r.indices.length;n++){const at=r.indices[n];out.setXYZ(n,positions.getX(at),positions.getY(at),positions.getZ(at));outNormal.setXYZ(n,normal.getX(at),normal.getY(at),normal.getZ(at));}
 out.needsUpdate=true;outNormal.needsUpdate=true;leg.mesh.geometry.computeBoundingSphere();leg.mesh.geometry.computeBoundingBox();
 for(const key of['hip','knee','ankle','foot']){leg[key]={...pose[key]};leg.mesh.userData[key]=leg[key];}leg.contact=pose.contact;
}

export function createMetalliferModel({inspection=false}={}){
 const root=new T.Group();root.name='metallifer-male-study';
 const bronze=new T.MeshStandardMaterial({color:'#9a793f',roughness:.48,metalness:.46});
 const shell=new T.MeshStandardMaterial({color:'#b79a53',roughness:.39,metalness:.52,side:T.DoubleSide});
 const dark=new T.MeshStandardMaterial({color:'#211f19',roughness:.35});
 const membrane=new T.MeshStandardMaterial({color:'#89754f',roughness:.82,side:T.DoubleSide});
 const body=new T.Group();body.add(lowerAbdomen(bronze));ellipsoid(body,[0,.049,.015],[.030,.016,.025],bronze);body.add(head(bronze));
 const legs=[];
 for(const side of[-1,1])for(let i=0;i<3;i++){
  const role=['front','middle','hind'][i],hip=[side*[.020,.023,.022][i],[.043,.040,.041][i],[.026,-.018,-.052][i]],knee=[side*.054,.034,[.055,-.013,-.078][i]],ankle=[side*.073,.005,[.077,-.020,-.098][i]],foot=[side*.079,0,[.083,-.021,-.104][i]];
  ellipsoid(body,hip,[.004,.004,.005],bronze);
  const part=new T.Group();tube(part,[hip,knee,ankle,foot],[.0038,.003,.0013,0],bronze);const {mesh}=merge(part,`metallifer-leg-${role}-${side}`,bronze);mesh.userData={role:'leg',legRole:role,side,hip:xyz(hip),knee:xyz(knee),ankle:xyz(ankle),foot:xyz(foot)};root.add(mesh);const leg={mesh,...mesh.userData};if(!inspection)leg.rig=createLegRig(leg);legs.push(leg);
 }
 const {mesh:bodyMesh}=merge(body,'metallifer-body-broad-head-narrow-pronotum',bronze);bodyMesh.userData={role:'body'};root.add(bodyMesh);
 const jaws=[];
 for(const side of[-1,1]){
  const origin=[side*.029,.059,.070],points=[origin,[side*.041,.059,.108],[side*.054,.060,.158],[side*.062,.063,.208],[side*.058,.066,.247],[side*.047,.068,.275],[side*.041,.069,.282]];
  const pivot=new T.Group();pivot.name=`metallifer-jaw-pivot-${side}`;pivot.position.set(...origin);root.add(pivot);
  const raw=new T.Group();tube(raw,points,[.0075,.008,.0075,.006,.004,.002,0],bronze,.55,8);
  const major={base:[side*.052,.060,.158],tip:[side*.026,.063,.177]},basal=[{base:[side*.039,.059,.104],tip:[side*.031,.060,.109]},{base:[side*.044,.060,.124],tip:[side*.035,.060,.129]},{base:[side*.048,.060,.141],tip:[side*.040,.061,.146]}];
  for(const tooth of[major,...basal])tube(raw,[tooth.base,tooth.tip],[tooth===major?.0055:.0028,0],bronze,.65,6);
  const {mesh,ranges}=merge(raw,`metallifer-long-jaw-${side}`,bronze);mesh.geometry.translate(-origin[0],-origin[1],-origin[2]);mesh.userData={role:'mandible',side};pivot.add(mesh);
  jaws.push({pivot,mesh,side,root:xyz(origin),socketRadius:.014,coordinateSpace:'model local before articulation',centerline:points.map(xyz),majorTooth:{base:xyz(major.base),tip:xyz(major.tip)},basalTeeth:basal.map(t=>({base:xyz(t.base),tip:xyz(t.tip)})),shaftVertexCount:ranges[0].vertexCount,shaftIndexCount:ranges[0].indexCount,toothRanges:ranges.slice(1)});
 }
 const elytra=[],hindwings=[];
 for(const side of[-1,1]){
  const e=elytron(side,shell);root.add(e);elytra.push(e);
  const wing=meshFrom([side*.008,.052,-.012,side*.022,.052,-.027,side*.020,.052,-.058,side*.009,.052,-.074],[0,1,2,0,2,3],membrane,`metallifer-folded-hindwing-${side}`);wing.userData={role:'hindwing',side,folded:true};root.add(wing);hindwings.push(wing);
 }
 const antennae=[];
 for(const side of[-1,1]){
  const start=[side*.037,.052,.052],elbow=[side*.066,.052,.057],tip=[side*.079,.057,.036],part=new T.Group();tube(part,[start,elbow,tip],[.0017,.0014,.0011],bronze);
  for(let j=0;j<3;j++){const base=[side*(.074+j*.002),.056,.042-j*.0025],end=[side*(.082+j*.002),.059,.040-j*.0025];tube(part,[base,end],[.0012,0],bronze);}
  const {mesh}=merge(part,`metallifer-elbowed-antenna-${side}`,bronze);mesh.userData={role:'antenna',side};root.add(mesh);antennae.push({mesh,side,root:xyz(start),elbow:xyz(elbow),tip:xyz(tip)});
 }
 const eyeGroup=new T.Group(),centres=[];for(const side of[-1,1]){const center=[side*.041,.057,.059];ellipsoid(eyeGroup,center,[.003,.004,.004],dark);centres.push(xyz(center));}
 const {mesh:eyeMesh}=merge(eyeGroup,'metallifer-two-lateral-eyes',dark);eyeMesh.userData={role:'eyes',count:2};root.add(eyeMesh);
 let disposed=false;
 root.userData={species:'metallifer-study',inspection,sex:'male',dimensions:METALLIFER_DIMENSIONS,legs,jaws,elytra,hindwings,antennae,eyes:{mesh:eyeMesh,centres},bodyMesh,headBounds:{min:{x:-.043,y:.041,z:.027},max:{x:.043,y:.068,z:.075}},nominalBodyBounds:{min:{x:-.043,y:.027,z:-.085},max:{x:.043,y:.069,z:.075}},dispose(){if(disposed)return;disposed=true;const geometries=new Set(),materials=new Set();root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);});for(const leg of legs)if(leg.rig)geometries.add(leg.rig.surface);for(const g of geometries)g.dispose();for(const m of materials)m.dispose();root.parent?.remove(root);}};
 for(const jaw of jaws)jaw.pivot.rotation.y=jaw.side*METALLIFER_DIMENSIONS.maxJawAngle*METALLIFER_DIMENSIONS.restJawOpen;
 root.userData.jawOpen=METALLIFER_DIMENSIONS.restJawOpen;if(!inspection)updateMetalliferModel(root,{jawOpen:METALLIFER_DIMENSIONS.restJawOpen});else root.updateMatrixWorld(true);return root;
}

export function updateMetalliferModel(root,state={}){
 if(!['metallifer-study','metallifer'].includes(root?.userData?.species))throw new TypeError('Expected metallifer model');
 if(root.userData.inspection)return root;
 const pose=sampleMetalliferPose(state),open=pose.jawOpen;
 root.position.set(pose.body.position.x,pose.body.position.y,pose.body.position.z);root.rotation.set(0,pose.body.heading,0);
 for(let i=0;i<root.userData.legs.length;i++)updateLegRig(root.userData.legs[i],pose.legs[i]);
 for(const jaw of root.userData.jaws)jaw.pivot.rotation.y=jaw.side*METALLIFER_DIMENSIONS.maxJawAngle*open;
 root.userData.jawOpen=open;root.updateMatrixWorld(true);return root;
}
