import {sampleGiantWaterbugPose,GIANT_WATERBUG_DIMENSIONS as D} from './giant-waterbug-kinematics.js?v=0.64.0&b=3616c2fe808e';
/** Original procedural adult water bug. No source image/texture/trace.
 * Internal hindwings, exact antennal segmentation and sex-specific anatomy are
 * deliberately unmodelled. Static inspection never overwrites caller transform.
 */
const T=window.THREE;
const vector=p=>new T.Vector3(p.x,p.y,p.z);
function ellipsoid(parent,name,p,s,material){const m=new T.Mesh(new T.SphereGeometry(1,12,6),material);m.name=name;m.position.set(...p);m.scale.set(...s);parent.add(m);return m;}
function rod(parent,a,b,r,material){const v=new T.Vector3(...b).sub(new T.Vector3(...a)),m=new T.Mesh(new T.CylinderGeometry(r*.65,r,v.length(),6),material);m.position.set(...a).addScaledVector(v,.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());parent.add(m);}
function merge(group,name,material){const p=[],n=[];for(const m of [...group.children]){m.updateMatrix();const g=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();g.applyMatrix4(m.matrix);p.push(...g.attributes.position.array);n.push(...g.attributes.normal.array);g.dispose();m.geometry.dispose();group.remove(m);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('normal',new T.Float32BufferAttribute(n,3));g.computeBoundingSphere();const mesh=new T.Mesh(g,material);mesh.name=name;group.add(mesh);return mesh;}
function patch(group,name,points,material){
 // Follow the authored abdomen skin; the wing panels must not float above it.
 const layer=name.includes('membrane')?(name.endsWith('--1')?.0012:.0018):.0008;
 const surface=p=>[p[0],-.002+.018*Math.sqrt(Math.max(0,1-(p[0]/.055)**2-((p[2]+.030)/.090)**2))+layer,p[2]];
 const p=[],center=points.reduce((a,v)=>a.map((x,i)=>x+v[i]/points.length),[0,0,0]);
 const triangle=(a,b,c,depth)=>{if(!depth){p.push(...surface(a),...surface(b),...surface(c));return;}const mid=(x,y)=>x.map((v,i)=>(v+y[i])/2),ab=mid(a,b),bc=mid(b,c),ca=mid(c,a);triangle(a,ab,ca,depth-1);triangle(ab,b,bc,depth-1);triangle(ca,bc,c,depth-1);triangle(ab,bc,ca,depth-1);};
 for(let i=0;i<points.length;i++)triangle(center,points[i],points[(i+1)%points.length],2);
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.computeVertexNormals();const m=new T.Mesh(g,material);m.name=name;group.add(m);
}
const SIDES=8;
function createLeg(root,pose,material){
 const segments=pose.role==='front'?4:2,vertices=segments*(SIDES*2+2),indices=[];
 for(let k=0;k<segments;k++){const o=k*(SIDES*2+2);for(let j=0;j<SIDES;j++){const q=(j+1)%SIDES;indices.push(o+j,o+q,o+SIDES+q,o+j,o+SIDES+q,o+SIDES+j,o+SIDES*2,o+q,o+j,o+SIDES*2+1,o+SIDES+j,o+SIDES+q);}}
 // Six small marginal hairs on each hind paddle: low-cost geometry, no alpha cards.
 const hairs=pose.role==='hind'?12:0;for(let j=0;j<hairs;j++){const o=vertices+j*3;indices.push(o,o+1,o+2);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(new Float32Array((vertices+hairs*3)*3),3));g.setIndex(indices);const mesh=new T.Mesh(g,material);mesh.name=`giant-waterbug-leg-${pose.id}`;root.add(mesh);
 return {mesh,id:pose.id,role:pose.role,side:pose.side,segments,hairs,contact:false,tipVertex:(segments-1)*(SIDES*2+2)+SIDES*2+1,boneVertexPairs:Array.from({length:segments},(_,k)=>[k*(SIDES*2+2)+SIDES*2,k*(SIDES*2+2)+SIDES*2+1])};
}
function updateLeg(leg,pose){
 const points=pose.role==='front'?[pose.hip,pose.knee,pose.ankle,pose.foot,pose.claw]:[pose.hip,pose.knee,pose.foot],a=leg.mesh.geometry.attributes.position;
 for(let k=0;k<leg.segments;k++){
  const start=vector(points[k]),end=vector(points[k+1]),axis=end.clone().sub(start).normalize(),u=new T.Vector3(0,1,0),v=new T.Vector3().crossVectors(axis,u).normalize();u.crossVectors(v,axis).normalize();
  const front=pose.role==='front',hind=pose.role==='hind',wide=front?(k===0?.010:k===3?.0013:.004):hind&&k===1?.009:.0035,thin=front?(k===0?.006:.0025):hind&&k===1?.002:.003;
  const o=k*(SIDES*2+2);
  for(let e=0;e<2;e++)for(let j=0;j<SIDES;j++){
   // Actual skin closes to a point at the gripping foot or single foreclaw.
   const taper=e&&k===leg.segments-1?0:e?.72:1,angle=j/SIDES*Math.PI*2,p=(e?end:start).clone().addScaledVector(v,Math.cos(angle)*wide*taper).addScaledVector(u,Math.sin(angle)*thin*taper);a.setXYZ(o+e*SIDES+j,p.x,p.y,p.z);
  }
  a.setXYZ(o+SIDES*2,start.x,start.y,start.z);a.setXYZ(o+SIDES*2+1,end.x,end.y,end.z);
  if(hind&&k===1)for(let j=0;j<6;j++)for(const side of [-1,1]){const f=.2+j*.1,p=start.clone().lerp(end,f),o=leg.segments*(SIDES*2+2)+(j*2+(side+1)/2)*3,edge=.009*(1-f)*side;const q=p.clone().addScaledVector(v,edge),r=p.clone().addScaledVector(v,edge+side*.004).addScaledVector(axis,.002);a.setXYZ(o,q.x,q.y,q.z);a.setXYZ(o+1,r.x,r.y,r.z);a.setXYZ(o+2,q.x+axis.x*.001,q.y+axis.y*.001,q.z+axis.z*.001);}
 }
 a.needsUpdate=true;leg.mesh.geometry.computeVertexNormals();leg.mesh.geometry.computeBoundingSphere();leg.mesh.geometry.computeBoundingBox();leg.contact=pose.contact;leg.pose=pose;
}
export function createGiantWaterbugModel({inspection=false}={}){
 const root=new T.Group();root.name=`giant-waterbug-${inspection?'inspection':'field'}`;
 const bodyMat=new T.MeshStandardMaterial({color:'#625d4e',roughness:.82}),hardMat=new T.MeshStandardMaterial({color:'#777263',roughness:.78,side:T.DoubleSide}),membraneMat=new T.MeshStandardMaterial({color:'#4d4a42',roughness:.65,side:T.DoubleSide}),detailMat=new T.MeshStandardMaterial({color:'#302f29',roughness:.52}),limbMat=new T.MeshStandardMaterial({color:'#716957',roughness:.77,side:T.DoubleSide});
 const body=new T.Group(),hard=new T.Group(),membrane=new T.Group(),detail=new T.Group();root.add(body,hard,membrane,detail);
 ellipsoid(body,'flattened-abdomen',[0,-.002,-.030],[.055,.018,.090],bodyMat);ellipsoid(body,'pronotum',[0,0,.061],[.045,.020,.027],bodyMat);ellipsoid(body,'head',[0,-.002,.097],[.028,.014,.023],bodyMat);
 for(const side of [-1,1]){
  ellipsoid(detail,'compound-eye',[side*.026,.003,.101],[.006,.007,.009],detailMat);
  // Original oblique hard-base/membrane division, not beetle elytra.
  patch(hard,`hemelytron-hard-base-${side}`,[[side*.008,.018,.052],[side*.039,.015,.04],[side*.051,.012,-.018],[side*.027,.018,-.061],[-side*.004,.021,-.015]],hardMat);
  const y=side===-1?.019:.021;
  patch(membrane,`hemelytron-overlapping-membrane-${side}`,[[side*.027,y,-.061],[-side*.004,y+.001,-.015],[-side*.016,y,-.077],[side*.004,y-.008,-.107],[side*.031,y-.006,-.082]],membraneMat);
  rod(detail,[side*.008,-.012,.105],[side*.015,-.016,.099],.001,detailMat);
  rod(detail,[side*.003,.002,-.106],[side*.003,.002,-.145],.0015,detailMat);
  // Coxal skin is inside and overlaps thoracic skin, not an isolated floating tube.
  for(const p of sampleGiantWaterbugPose().legs.filter(p=>p.side===side))ellipsoid(body,`coxa-${p.id}`,[p.hip.x,p.hip.y,p.hip.z],[.006,.005,.006],bodyMat);
 }
 rod(detail,[0,-.013,.106],[0,-.023,.083],.002,detailMat);rod(detail,[0,-.023,.083],[0,-.021,.071],.0014,detailMat);
 const bodyMesh=merge(body,'giant-waterbug-connected-body-coxae',bodyMat),hardMesh=merge(hard,'giant-waterbug-hemelytra-hard-bases',hardMat),membraneMesh=merge(membrane,'giant-waterbug-overlapping-membranous-tips',membraneMat),detailMesh=merge(detail,'giant-waterbug-eyes-mouth-short-antennae-breathing-pair',detailMat);
 const pose=sampleGiantWaterbugPose(),legs=pose.legs.map(p=>createLeg(root,p,limbMat));for(let i=0;i<legs.length;i++)updateLeg(legs[i],pose.legs[i]);
 let disposed=false;
 root.userData={inspection,species:'giantwaterbug',legs,bodyMesh,hardMesh,membraneMesh,detailMesh,dimensions:D,tailBreathingPoint:D.tailBreathingPoint,unmodelled:['internal hindwings','exact antennal segmentation','sex-specific anatomy'],dispose(){if(disposed)return;disposed=true;root.traverse(o=>{if(o.isMesh)o.geometry.dispose();});for(const m of [bodyMat,hardMat,membraneMat,detailMat,limbMat])m.dispose();}};
 root.updateMatrixWorld(true);return root;
}
export function updateGiantWaterbugModel(root,state={}){
 if(root.userData.inspection)return root;
 const pose=sampleGiantWaterbugPose(state);root.position.set(pose.body.position.x,pose.body.position.y,pose.body.position.z);root.rotation.order='YXZ';root.rotation.set(pose.body.pitch,pose.body.heading,pose.body.roll);
 for(let i=0;i<root.userData.legs.length;i++)updateLeg(root.userData.legs[i],pose.legs[i]);root.updateMatrixWorld(true);return root;
}
