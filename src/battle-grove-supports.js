/** Actual textured wood owns every contact. No invisible support planes. */
const T=window.THREE,TAU=Math.PI*2;
export function createBattleGroveSupports(world,scene){
 const meshes=[],colliders=[],source=world.captureOccluders[1].material;
 const bark=new T.MeshStandardMaterial({map:source.map,color:'#8f8365',roughness:1});
 function mesh(name,g,material=bark){const m=new T.Mesh(g,material);m.name=name;m.castShadow=m.receiveShadow=true;scene.add(m);meshes.push(m);return m;}
 function rod(name,a,b,r0,r1){const p=new T.Vector3(...a),d=new T.Vector3(...b).sub(p),g=new T.CylinderGeometry(r1,r0,d.length(),9);const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setY(i,uv.getY(i)*d.length()*.65);const m=mesh(name,g);m.position.copy(p).addScaledVector(d,.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return m;}
 // An octagonal prism whose highest edge pair is an actual horizontal facet.
 function woodLane(name,x,z,length,radius,topY,alongX=true){
  const cy=topY-radius*Math.cos(Math.PI/8),p=[],uv=[],index=[];
  for(const end of[-1,1])for(let i=0;i<8;i++){const a=(i+.5)*TAU/8,side=Math.sin(a)*radius,axis=end*length/2;p.push(x+(alongX?axis:side),cy+Math.cos(a)*radius,z+(alongX?side:axis));uv.push(i/8,end*length*.65);}
  for(let i=0;i<8;i++){const j=(i+1)%8;index.push(i,j,i+8,j,j+8,i+8);}for(let i=1;i<7;i++)index.push(0,i+1,i,8,8+i,8+i+1);
  // Opposite axis mapping reverses handedness.
  if(!alongX)for(let i=0;i<index.length;i+=3)[index[i+1],index[i+2]]=[index[i+2],index[i+1]];
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(index);g.computeVertexNormals();
  const m=mesh(name,g);for(let d=-length/2;d<=length/2+.01;d+=.3)colliders.push({x:x+(alongX?d:0),z:z+(alongX?0:d),r:radius+.03});return m;
 }
 const tx=-4.8,tz=2,base=world.heightAt(tx,tz),rhinoTop=base+1.2,stagTop=base+1.4;
 rod('grove-support-tree-lower',[tx,base-.08,tz],[tx+.12,base+3.5,tz],.48,.24);
 rod('grove-support-tree-upper',[tx+.12,base+3.5,tz],[tx+.25,base+6.3,tz-.12],.24,.055);colliders.push({x:tx,z:tz,r:.60});
 for(let k=0;k<5;k++){const a=k*TAU/5,x=tx+Math.cos(a)*.85,z=tz+Math.sin(a)*.85;rod('grove-support-tree-root',[tx,base+.30,tz],[x,world.heightAt(x,z)-.04,z],.16,.035);}
 const rhinoBranch=woodLane('grove-rhino-branch',-4,2,1.8,.30,rhinoTop,true),stagBranch=woodLane('grove-stag-branch',-4.8,2.8,1.8,.30,stagTop,false);
 const leafSource=world.ownedRoots.find(m=>m.isInstancedMesh&&m.material?.customProgramCacheKey?.()==='summer-wind-0.055');
 const foliage=new T.InstancedMesh(new T.PlaneGeometry(1,1),leafSource.material,180),dummy=new T.Object3D();foliage.name='grove-support-tree-foliage';foliage.castShadow=foliage.receiveShadow=true;
 for(let b=0;b<5;b++){const angle=b*TAU/5+.3,tip=[tx+Math.cos(angle)*1.8,base+5.1+b*.15,tz+Math.sin(angle)*1.8];rod('grove-support-tree-fork',[tx+.1,base+3.1,tz],tip,.16,.025);
  for(let n=0;n<36;n++){const a=n*2.399963,rad=Math.sqrt((n+.5)/36)*1.8;dummy.position.set(tip[0]+Math.cos(a)*rad,tip[1]+Math.sin(n*1.7)*.75,tip[2]+Math.sin(a)*rad);dummy.rotation.set(Math.sin(n)*1.1,a,.15);dummy.scale.set(1.2+(n%4)*.12,1.1,1);dummy.updateMatrix();foliage.setMatrixAt(b*36+n,dummy.matrix);foliage.setColorAt(b*36+n,new T.Color(['#c4d39b','#a5bc84','#d5dda4'][n%3]));}}
 foliage.frustumCulled=false;scene.add(foliage);meshes.push(foliage);
 const hx=10,hz=-5,hbase=world.heightAt(hx,hz),htop=hbase+.68,herculesLog=woodLane('grove-hercules-log',hx,hz,2.5,.40,htop,true);
 // Two small branch stubs and root-grounded ends keep this a fallen tree, not a plinth.
 rod('grove-log-stub',[hx+.83,hbase+.27,hz],[hx+1.03,hbase+.55,hz-.52],.12,.065);
 const rhino={home:{x:-3.65,y:rhinoTop+.05,z:2},heading:Math.PI/2,retreatLimits:{min:-4.1,max:-3.36}};
 const stag={home:{x:-4.8,y:stagTop+.045,z:3.15},heading:0,retreatLimits:{min:2.58,max:3.43}};
 const hercules={home:{x:hx,y:htop+.06,z:hz},axis:[{x:hx-.6,y:htop+.06,z:hz},{x:hx+.6,y:htop+.06,z:hz}]};
 const homes=[['rhino',rhino.home],['stag',stag.home],['hercules',hercules.home]].map(([id,p])=>[id,p.x,p.z,p.y-world.heightAt(p.x,p.z)]);
 scene.updateMatrixWorld(true);
 const surfaces={rhino:{mesh:rhinoBranch,topY:rhinoTop,halfWidth:.30*Math.sin(Math.PI/8)},stag:{mesh:stagBranch,topY:stagTop,halfWidth:.30*Math.sin(Math.PI/8)},hercules:{mesh:herculesLog,topY:htop,halfWidth:.40*Math.sin(Math.PI/8)}};
 function herculesSupportAt(pos){if(!pos||Math.abs(pos.x-hx)>.600001||Math.abs(pos.z-hz)>1e-6)return null;return{point:{x:pos.x,y:htop,z:pos.z},normal:{x:0,y:1,z:0},footHeightAt(x,z){return Math.abs(x-hx)<=1.25&&Math.abs(z-hz)<=surfaces.hercules.halfWidth?htop:null;}};}
 return{meshes,colliders,surfaces,insectHomes:homes,rhinoSupports:[rhino],stagSupports:[stag],herculesSupports:[hercules],herculesSupportAt,captureOccluders:meshes.filter(m=>m!==foliage)};
}
