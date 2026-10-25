const THREE=window.THREE;
export function createNet(){
 const group=new THREE.Group();
 const wood=new THREE.MeshStandardMaterial({color:0x8e7045,roughness:.85});
 const metal=new THREE.MeshStandardMaterial({color:0xa7aba2,metalness:.65,roughness:.4});
 const handle=new THREE.Mesh(new THREE.CylinderGeometry(.018,.024,.85,10),wood);handle.position.y=-.12;group.add(handle);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(.25,.009,6,48),metal);ring.position.y=.48;group.add(ring);
 const points=[];
 for(let a=0;a<24;a++){
  const angle=a*Math.PI/12;
  let prev=null;
  for(let j=0;j<=15;j++){
   const t=j/15,r=.25*Math.cos(t*Math.PI/2),p=new THREE.Vector3(Math.cos(angle)*r,.48+Math.sin(angle)*r,-.42*Math.sin(t*Math.PI/2));
   if(prev)points.push(prev,p);prev=p;
  }
 }
 for(let j=1;j<12;j++){
  const t=j/12,r=.25*Math.cos(t*Math.PI/2),z=-.42*Math.sin(t*Math.PI/2);
  for(let a=0;a<48;a++){const q=a*Math.PI/24,n=(a+1)*Math.PI/24;points.push(new THREE.Vector3(Math.cos(q)*r,.48+Math.sin(q)*r,z),new THREE.Vector3(Math.cos(n)*r,.48+Math.sin(n)*r,z));}
 }
 const net=new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:0xe7e5d9,transparent:true,opacity:.4}));group.add(net);
 group.position.set(.56,-.7,-.92);group.rotation.set(-.25,0,-.3);
 return {group,update(time,swing,walking){
  const s=Math.sin(Math.min(1,swing)*Math.PI);
  group.position.set(.56-s*.7,-.7+s*.25+Math.sin(time*7)*walking*.012,-.92-s*.62);
  group.rotation.set(-.25-s*.8,.1-s*.8,-.3+s*.5);
 }};
}
