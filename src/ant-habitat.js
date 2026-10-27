import {ANT_ROUTE,ANT_START_DISTANCES,ANT_CARRYING_LEAF,ANT_SHELTER_CENTRES,ANT_PATH_LENGTH,ANT_FOOT_RADIUS,sampleAntPath} from './ant-layout.js?v=0.64.0&b=3616c2fe808e';
const THREE=window.THREE;
/** Additive adapter; terrain/old plants/old colliders and seeded generation are untouched. */
export function createAntHabitat(world,scene){
  const ground=scene?.getObjectByName('tropical-ground');
  if(!ground?.isMesh||typeof world?.heightAt!=='function')throw new TypeError('Ant habitat requires the existing tropical terrain');
  ground.updateWorldMatrix(true,false);
  if(!ground.matrixWorld.equals(new THREE.Matrix4()))throw new Error('Ant terrain sampler expects static world-space vertices');
  const positions=ground.geometry.attributes.position,index=ground.geometry.index;
  // Read actual terrain vertices/index rather than approximate an analytic height.
  const columns=Math.round(Math.sqrt(positions.count)),cells=columns-1,minX=positions.getX(0),minZ=positions.getZ(0),step=positions.getX(1)-minX;
  if(columns*columns!==positions.count||!index||!(step>0))throw new Error('Unsupported terrain grid');
  const edge=minX+cells*step;
  function sampleAt(x,z){
    if(!Number.isFinite(x)||!Number.isFinite(z)||x<minX||z<minZ||x>edge||z>minZ+cells*step)return null;
    const gx=Math.min(cells-1e-9,(x-minX)/step),gz=Math.min(cells-1e-9,(z-minZ)/step),ix=Math.floor(gx),iz=Math.floor(gz),u=gx-ix,v=gz-iz,offset=(iz*cells+ix)*6+(u+v<=1?0:3),ids=[index.getX(offset),index.getX(offset+1),index.getX(offset+2)],a=new THREE.Vector3().fromBufferAttribute(positions,ids[0]),b=new THREE.Vector3().fromBufferAttribute(positions,ids[1]),c=new THREE.Vector3().fromBufferAttribute(positions,ids[2]);
    const normal=b.sub(a).cross(c.sub(a)).normalize();if(normal.y<=0)return null;
    const y=a.y-(normal.x*(x-a.x)+normal.z*(z-a.z))/normal.y;
    return{point:{x,y,z},normal:{x:normal.x,y:normal.y,z:normal.z}};
  }
  const homes=Object.freeze(ANT_START_DISTANCES.map(s=>{const p=sampleAntPath(s),surface=sampleAt(p.x,p.z);return Object.freeze(['leafcutterant',p.x,p.z,surface.point.y-world.heightAt(p.x,p.z)]);}));
  const supports=Object.freeze(homes.map(([,x,z],i)=>Object.freeze({home:Object.freeze(sampleAt(x,z).point),route:ANT_ROUTE,carryingLeaf:ANT_CARRYING_LEAF[i]})));
  function supportAt(item){const surface=item&&sampleAt(item.x,item.z);return surface?{...surface,sampleAt}:null;}
  // Two small curled pieces of fallen bark/leaf litter: open towards the path,
  // backed and roofed, with no floor replacing the original terrain.
  const p=[],colors=[],color=new THREE.Color();
  function quad(a,b,c,d,tint){p.push(...a,...b,...c,...a,...c,...d);color.set(tint);for(let i=0;i<6;i++)colors.push(color.r,color.g,color.b);}
  for(let shelterIndex=0;shelterIndex<ANT_SHELTER_CENTRES.length;shelterIndex++){
    const endpoint=ANT_SHELTER_CENTRES[shelterIndex],cx=endpoint.x,z0=endpoint.z,sign=shelterIndex===0?-1:1,base=sampleAt(cx,z0).point.y,u0=-.30,u1=.40;
    // Open ends face the long path, so both lanes enter beneath the high roof,
    // rather than crossing a low side wall with a carried leaf.
    const point=(u,y,v)=>[cx+v,base+y,z0+sign*u],floorPoint=(u,v)=>{const x=cx+v,z=z0+sign*u;return[x,sampleAt(x,z).point.y-.015,z];};
    const arch=[[-.25,.025],[-.20,.19],[-.10,.265],[.10,.265],[.20,.19],[.25,.025]];
    for(let i=1;i<arch.length;i++){const[va,ya]=arch[i-1],[vb,yb]=arch[i];quad(point(u0,ya,va),point(u1,ya,va),point(u1,yb,vb),point(u0,yb,vb),i%2?'#887552':'#97845d');}
    for(let i=1;i<arch.length;i++){const[va,ya]=arch[i-1],[vb,yb]=arch[i];quad(floorPoint(u0,va),point(u0,ya,va),point(u0,yb,vb),floorPoint(u0,vb),'#78694c');}
    for(const side of[-1,1])quad(floorPoint(u0,side*.25),floorPoint(u1,side*.25),point(u1,.025,side*.25),point(u0,.025,side*.25),'#74674c');

  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(p,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();geometry.computeBoundingSphere();const shelter=new THREE.Mesh(geometry,new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide}));shelter.name='ant-endpoint-shelters';shelter.castShadow=true;shelter.receiveShadow=true;scene.add(shelter);shelter.updateWorldMatrix(true,false);
  return{homes,supports,supportAt,sampleAt,captureOccluders:Object.freeze([shelter]),meshes:Object.freeze([shelter]),stats:{pathLength:ANT_PATH_LENGTH,footRadius:ANT_FOOT_RADIUS,addedMeshes:1,addedTriangles:p.length/9,addedTextures:0},update(){}};
}
