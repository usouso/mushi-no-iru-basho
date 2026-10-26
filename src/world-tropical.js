/* Small, self-contained tropical forest-edge study. All materials and meshes are
 * authored here; no imported assets, ecological simulation, or visual QA claim. */
import {TROPICAL_HOMES,TROPICAL_BOUNDS,TROPICAL_SPAWN,TROPICAL_ROUTE,TROPICAL_BAIT,TROPICAL_LOGS} from './tropical-layout.js?v=0.22.0&b=cb8cdca3a903';
const THREE=window.THREE,TAU=Math.PI*2,EXTENT=35,STEP=.5;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function rng(seed){return()=>{seed=(seed+0x6D2B79F5)|0;let t=Math.imul(seed^seed>>>15,seed|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
export function streamCenter(z){return 12+Math.sin(z*.15)*3+Math.sin(z*.052)*1.5;}
function sampleHeight(x,z){const d=Math.abs(x-streamCenter(z)),bank=clamp((d-1.1)/2,0,1),smooth=bank*bank*(3-2*bank);return -.26+( .39+Math.sin(x*.085)*.14+Math.sin(z*.095)*.12)*smooth+Math.max(0,Math.hypot(x,z)-24)*.055*smooth;}
// Exact barycentric interpolation of the same .5m terrain triangles we render.
export function heightAt(x,z){const gx=clamp((x+EXTENT)/STEP,0,2*EXTENT/STEP-1e-8),gz=clamp((z+EXTENT)/STEP,0,2*EXTENT/STEP-1e-8),ix=Math.floor(gx),iz=Math.floor(gz),u=gx-ix,v=gz-iz,px=ix*STEP-EXTENT,pz=iz*STEP-EXTENT;const a=Math.fround(sampleHeight(px,pz)),b=Math.fround(sampleHeight(px+STEP,pz)),c=Math.fround(sampleHeight(px,pz+STEP)),d=Math.fround(sampleHeight(px+STEP,pz+STEP));return u+v<=1?a+(b-a)*u+(c-a)*v:d+(c-d)*(1-u)+(b-d)*(1-v);}
function pathDistance(x,z){let best=Infinity;for(let i=1;i<TROPICAL_ROUTE.length;i++){const a=TROPICAL_ROUTE[i-1],b=TROPICAL_ROUTE[i],dx=b[0]-a[0],dz=b[1]-a[1],t=clamp(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz),0,1);best=Math.min(best,Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz));}return best;}
function homeDistance(x,z){return Math.min(...TROPICAL_HOMES.map(h=>Math.hypot(x-h[1],z-h[2])));}
function texture(size,paint){const canvas=document.createElement('canvas');canvas.width=canvas.height=size;paint(canvas.getContext('2d'),size);const t=new THREE.CanvasTexture(canvas);t.anisotropy=4;return t;}
function collector(){const positions=[],normals=[],uvs=[],colors=[],indices=[];return{add(g,m,color){const base=positions.length/3,p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv,v=new THREE.Vector3(),nm=new THREE.Matrix3().getNormalMatrix(m);for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(m);positions.push(...v.toArray());v.fromBufferAttribute(n,i).applyMatrix3(nm).normalize();normals.push(...v.toArray());uvs.push(uv?uv.getX(i):0,uv?uv.getY(i):0);colors.push(color.r,color.g,color.b);}const a=g.index?.array;for(let i=0;i<(a?.length??p.count);i++)indices.push(base+(a?a[i]:i));},finish(){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeBoundingSphere();return g;}};}
function segment(c,a,b,r0,r1,color,sides=7){const v=new THREE.Vector3(...a),w=new THREE.Vector3(...b),delta=w.clone().sub(v),g=new THREE.CylinderGeometry(r1,r0,delta.length(),sides),m=new THREE.Matrix4().compose(v.add(w).multiplyScalar(.5),new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize()),new THREE.Vector3(1,1,1));c.add(g,m,new THREE.Color(color));g.dispose();}
function mesh(scene,name,g,material,shadow=true){const m=new THREE.Mesh(g,material);m.name=name;m.castShadow=shadow;m.receiveShadow=true;scene.add(m);return m;}
function instances(scene,name,g,material,items,shadow=false){const m=new THREE.InstancedMesh(g,material,items.length),o=new THREE.Object3D();m.name=name;items.forEach((v,i)=>{o.position.set(v.x,v.y,v.z);o.rotation.set(v.rx||0,v.ry||0,v.rz||0);o.scale.set(v.sx||1,v.sy||1,v.sz||1);o.updateMatrix();m.setMatrixAt(i,o.matrix);m.setColorAt(i,new THREE.Color(v.color||'#ffffff'));});m.castShadow=shadow;m.receiveShadow=true;m.frustumCulled=false;scene.add(m);return m;}
// Pointed blade with a flat central contact patch, without a hidden collider.
function leafGeometry(){const outline=[[0,.72],[.27,.43],[.36,.06],[.28,-.34],[0,-.57],[-.28,-.34],[-.36,.06],[-.27,.43]],p=[0,0,0],uv=[.5,.44],ix=[];for(const[x,z]of outline){p.push(x,0,z);uv.push(x/.72+.5,(z+.57)/1.29);}for(let i=0;i<8;i++)ix.push(0,1+i,1+(i+1)%8);const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return g;}
export function createTropicalWorld(scene){
  const random=rng(83691),colliders=[],supports=[],trunks=collector(),plants=collector();
  scene.background=new THREE.Color('#b8d0be');scene.fog=new THREE.Fog('#a9bead',23,71);
  scene.add(new THREE.HemisphereLight('#dcebd6','#535640',.78));
  const sun=new THREE.DirectionalLight('#fff0c5',1.15);sun.position.set(-15,30,12);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-28,right:28,top:28,bottom:-28,near:.5,far:85});sun.shadow.bias=-.0004;sun.shadow.normalBias=.025;scene.add(sun);scene.add(sun.target);
  const fill=new THREE.DirectionalLight('#b7dcd0',.22);fill.position.set(18,10,-18);scene.add(fill);
  const groundTex=texture(256,(c,s)=>{const r=rng(725);c.fillStyle='#8c8060';c.fillRect(0,0,s,s);for(let i=0;i<4300;i++){c.fillStyle=i%3?'rgba(38,41,23,.1)':'rgba(211,195,139,.16)';c.fillRect(r()*s,r()*s,1+r()*4,1+r()*3);}for(let i=0;i<80;i++){c.strokeStyle='rgba(79,56,31,.22)';c.beginPath();const x=r()*s,y=r()*s;c.moveTo(x,y);c.lineTo(x+5+r()*9,y+4);c.stroke();}});groundTex.wrapS=groundTex.wrapT=THREE.RepeatWrapping;groundTex.repeat.set(18,18);
  const leafTex=texture(128,(c,s)=>{c.fillStyle='#c6ce9c';c.fillRect(0,0,s,s);c.strokeStyle='rgba(55,79,34,.45)';c.lineWidth=2;c.beginPath();c.moveTo(s*.5,0);c.lineTo(s*.5,s);c.stroke();c.lineWidth=1;for(let j=1;j<10;j++)for(const side of[-1,1]){c.beginPath();c.moveTo(s*.5,j*s/10);c.lineTo(s*(.5+side*.45),(j-1.6)*s/10);c.stroke();}});
  const barkTex=texture(128,(c,s)=>{const r=rng(410);c.fillStyle='#9d9880';c.fillRect(0,0,s,s);for(let i=0;i<320;i++){c.strokeStyle=i%3?'rgba(42,48,32,.16)':'rgba(210,208,176,.22)';c.lineWidth=.5+r()*2;c.beginPath();const x=r()*s,y=r()*s;c.moveTo(x,y);c.lineTo(x+(r()-.5)*3,y+5+r()*33);c.stroke();}});barkTex.wrapS=barkTex.wrapT=THREE.RepeatWrapping;
  const leafMat=new THREE.MeshLambertMaterial({map:leafTex,side:THREE.DoubleSide}),barkMat=new THREE.MeshLambertMaterial({map:barkTex,vertexColors:true}),plantMat=new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide});
  const terrain=new THREE.BufferGeometry(),p=[],uv=[],colors=[],idx=[],N=EXTENT*2/STEP;
  for(let j=0;j<=N;j++)for(let i=0;i<=N;i++){const x=i*STEP-EXTENT,z=j*STEP-EXTENT,d=pathDistance(x,z),water=Math.abs(x-streamCenter(z));p.push(x,sampleHeight(x,z),z);uv.push(i/N,j/N);const col=new THREE.Color(water<2.5?'#928b71':d<1?'#c4af83':d<1.8?'#a79e73':'#8b9265');colors.push(col.r,col.g,col.b);}
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){const a=j*(N+1)+i,b=a+1,c=a+N+1,d=c+1;idx.push(a,c,b,b,c,d);}
  terrain.setAttribute('position',new THREE.Float32BufferAttribute(p,3));terrain.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));terrain.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));terrain.setIndex(idx);terrain.computeVertexNormals();mesh(scene,'tropical-ground',terrain,new THREE.MeshLambertMaterial({map:groundTex,vertexColors:true}),false);
  // A shallow, continuous ribbon with visible sandy bed. No invisible water wall.
  const waterG=new THREE.BufferGeometry(),wp=[],wi=[];for(let i=0;i<=140;i++){const z=-35+i*.5,x=streamCenter(z);wp.push(x-1.15,-.13,z,x+1.15,-.13,z);if(i<140){const a=i*2;wi.push(a,a+2,a+1,a+1,a+2,a+3);}}waterG.setAttribute('position',new THREE.Float32BufferAttribute(wp,3));waterG.setIndex(wi);waterG.computeVertexNormals();const water=mesh(scene,'tropical-stream',waterG,new THREE.MeshPhongMaterial({color:'#7ca9a0',transparent:true,opacity:.62,shininess:80,depthWrite:false}),false);
  const canopy=[],understory=[],litter=[],treePositions=[];
  // A few trunks define the openings; outer trees enclose rather than fill the slice.
  for(let i=0;i<36;i++){const a=i/36*TAU,r=24+random()*8;treePositions.push([Math.cos(a)*r,Math.sin(a)*r]);}
  treePositions.push([-11,6],[-13,-5],[-10,-20],[3,-24],[17,8],[20,-9],[4,19],[-20,12]);
  for(const[x,z]of treePositions){if(pathDistance(x,z)<2||Math.abs(x-streamCenter(z))<2.8||homeDistance(x,z)<2.6)continue;const y=heightAt(x,z),h=10+random()*6,r=.3+random()*.26,top=[x+.6,y+h,z-.3];segment(trunks,[x,y-.05,z],top,r,r*.38,'#85846a',9);colliders.push({x,z,r:r+.12});
    for(let k=0;k<4;k++){const a=k*TAU/4+random()*.2;segment(trunks,[x+Math.cos(a)*r*2.3,y,z+Math.sin(a)*r*2.3],[x,y+1.5,z],r*.28,r*.1,'#77775e',5);}
    for(let b=0;b<5;b++){const a=b*2.4+random(),reach=2.1+random()*2.2,end=[top[0]+Math.cos(a)*reach,y+h-1+random()*1.5,top[2]+Math.sin(a)*reach];segment(trunks,[x,y+h*.68,z],end,r*.42,.035,'#8f8b70',7);
      for(let n=0;n<15;n++){const t=random()*TAU,rr=Math.sqrt(random())*2.5;canopy.push({x:end[0]+Math.cos(t)*rr,y:end[1]+(random()-.5)*1.6,z:end[2]+Math.sin(t)*rr,rx:(random()-.5)*1.15,ry:random()*TAU,rz:(random()-.5)*.7,sx:1.6+random()*1.4,sy:1,sz:1.2+random()*1.2,color:['#69824b','#819458','#54734b','#8d9b5d'][n%4]});}
    }
  }
  mesh(scene,'tropical-trunks',trunks.finish(),barkMat);
  const blade=leafGeometry();instances(scene,'tropical-canopy-leaves',blade,leafMat,canopy,true);
  // Sparse large-leaved herbs with bare walking approaches and an open eye-level band.
  for(let i=0;i<390;i++){const x=(random()-.5)*62,z=(random()-.5)*62;if(pathDistance(x,z)<1.25||homeDistance(x,z)<1.7||Math.abs(x-streamCenter(z))<1.7)continue;const y=heightAt(x,z),h=.25+random()*.8;segment(plants,[x,y-.015,z],[x,y+h,z],.012,.005,'#698354',5);for(let k=0;k<4;k++){const a=k*TAU/4+random()*.4;understory.push({x:x+Math.sin(a)*.18,y:y+h*.65,z:z+Math.cos(a)*.18,rx:.25+random()*.65,ry:a,rz:(random()-.5)*.25,sx:.5+random()*.5,sz:.6+random()*.7,color:['#6c8e50','#7f9c58','#527d4e'][k%3]});}}
  // Canonical insect homes also own the support leaf. Flat blades keep foot contact
  // independent of heading; petiole and smaller lower leaves make the support a plant.
  for(let i=0;i<TROPICAL_HOMES.length;i++){const[,x,z,alt]=TROPICAL_HOMES[i],home={x,y:heightAt(x,z)+alt,z},contactY=home.y-.02875,root={x:x+.22,y:heightAt(x+.22,z+.1)-.015,z:z+.1};segment(plants,[root.x,root.y,root.z],[x,contactY,z],.012,.005,'#77905a',6);const m=new THREE.Matrix4().makeTranslation(x,contactY,z);m.multiply(new THREE.Matrix4().makeRotationY(i*.8));m.multiply(new THREE.Matrix4().makeScale(.48,1,.48));plants.add(blade,m,new THREE.Color('#8ba65b'));
    for(let k=0;k<2;k++){const q=new THREE.Matrix4().compose(new THREE.Vector3(x+.14,root.y+(contactY-root.y)*(.4+k*.22),z+.08),new THREE.Quaternion().setFromEuler(new THREE.Euler(.3,i+k*2,.15)),new THREE.Vector3(.35,1,.4));plants.add(blade,q,new THREE.Color('#68894e'));}
    supports.push({id:`insect-${i+1}`,kind:'leaf',surface:'leaf',home,root,contactY,topY:contactY,contactRadius:.08,normal:{x:0,y:1,z:0}});
  }
  mesh(scene,'tropical-rest-plants',plants.finish(),plantMat);
  instances(scene,'tropical-understory-leaves',blade,leafMat,understory);
  for(let i=0;i<260;i++){const x=(random()-.5)*64,z=(random()-.5)*64;if(Math.abs(x-streamCenter(z))<1.6)continue;litter.push({x,y:heightAt(x,z)+.012,z,ry:random()*TAU,sx:.12+random()*.18,sz:.13+random()*.2,color:['#8b734d','#9b8558','#776849'][i%3]});}
  instances(scene,'tropical-leaf-litter',blade,new THREE.MeshLambertMaterial({side:THREE.DoubleSide}),litter);
  const stones=[];for(let i=0;i<65;i++){const z=(random()-.5)*65,x=streamCenter(z)+(random()<.5?-1:1)*(1.4+random()*.9);if(homeDistance(x,z)<1.6)continue;const r=.08+random()*.22;stones.push({x,y:heightAt(x,z)+r*.2,z,sx:r*1.6,sy:r*.65,sz:r,ry:random()*TAU,color:['#989b87','#a9aa91','#7f8b7c'][i%3]});}instances(scene,'tropical-stream-stones',new THREE.IcosahedronGeometry(1,1),new THREE.MeshLambertMaterial(),stones,true);
  // One modest fixed fruit table. No bait rules or attraction state lives here.
  // Keep the old seeded world generation above byte-for-byte and consume no RNG.
  const treeCount=colliders.length,bx=TROPICAL_BAIT.x,bz=TROPICAL_BAIT.z,topY=heightAt(bx,bz)+TROPICAL_BAIT.topOffset;
  const baitStation=Object.freeze({id:'tropical-fruit',label:'熱帯の果実台',type:'fermented-fruit',x:bx,z:bz,topY,target:Object.freeze({x:bx,y:topY+.02875,z:bz}),interactRadius:2.2});
  const table=collector(),fruit=collector();
  function part(c,g,x,y,z,sx,sy,sz,color,rx=0,ry=0,rz=0){const m=new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new THREE.Vector3(sx,sy,sz));c.add(g,m,new THREE.Color(color));}
  const board=new THREE.CylinderGeometry(.32,.33,.045,20);
  part(table,board,bx,topY-.0225,bz,1,1,1,'#aa8d60');board.dispose();
  const feet=[];for(let i=0;i<3;i++){const angle=i*TAU/3+.3,x=bx+Math.cos(angle)*.23,z=bz+Math.sin(angle)*.23,y=heightAt(x,z)-.015;feet.push({x,y,z});segment(table,[x,y,z],[bx+(x-bx)*.82,topY-.045,bz+(z-bz)*.82],.026,.02,'#8b7758',7);}
  for(let i=0;i<3;i++){const a=feet[i],b=feet[(i+1)%3];segment(table,[a.x,a.y+.3,a.z],[b.x,b.y+.3,b.z],.009,.009,'#837456',5);}
  const tableMesh=mesh(scene,'tropical-fruit-table',table.finish(),new THREE.MeshLambertMaterial({map:barkTex,vertexColors:true}));
  colliders.push({x:bx,z:bz,r:TROPICAL_BAIT.colliderRadius});
  // Two small curved banana pieces occupy +Z only. The central 8cm foot disk is
  // deliberately bare wood; food is not a hidden support for the butterfly.
  const morsel=new THREE.SphereGeometry(1,10,6),speck=new THREE.SphereGeometry(1,5,3);
  for(let piece=0;piece<2;piece++)for(let i=0;i<4;i++){const x=bx+(i-1.5)*.027+(piece?-.022:.018),z=bz+.175+piece*.067+Math.sin(i*.9)*.012,y=topY+.012+Math.sin(i*.9)*.005;
    part(fruit,morsel,x,y,z,.022,.012,.018,piece?'#b3974b':'#c7ad61',0,0,(i-1.5)*.12);
    for(let k=0;k<2;k++)part(fruit,speck,x+(k-.5)*.013,y+.0105,z+(k?.005:-.006),.0035,.0012,.0025,'#705339');
  }
  // A small mashed tip is lower than the banana pieces, at the proboscis endpoint.
  part(fruit,morsel,bx,topY+.005,bz+.13,.025,.005,.03,'#b7a05b');
  morsel.dispose();speck.dispose();
  const fruitMesh=mesh(scene,'tropical-fermented-fruit',fruit.finish(),new THREE.MeshLambertMaterial({vertexColors:true}));fruitMesh.visible=false;
  function setBaitActive(active){fruitMesh.visible=Boolean(active);}
  // Two finite, horizontal bark facets support a short walking axis. The logs
  // consume no RNG and leave all previous geometry and bait behaviour unchanged.
  const logSurfaces=[],upNormal=Object.freeze({x:0,y:1,z:0});
  const herculesSupports=Object.freeze(TROPICAL_LOGS.map(log=>{
    const floor=Array.from({length:25},(_,i)=>heightAt(log.x-log.length/2+i*log.length/24,log.z));
    const centreY=Math.min(...floor)+.37,topY=centreY+log.radius*Math.cos(Math.PI/8),halfWidth=log.radius*Math.sin(Math.PI/8);
    const positions=[],uv=[],colors=[],bark=new THREE.Color('#b5a17e'),wood=new THREE.Color('#c9b088');
    const ring=(end,i)=>[log.x+end*log.length/2,centreY+log.radius*Math.cos((i+.5)*TAU/8),log.z+log.radius*Math.sin((i+.5)*TAU/8)];
    function tri(a,b,c,color,coords){positions.push(...a,...b,...c);colors.push(...color.toArray(),...color.toArray(),...color.toArray());uv.push(...coords);}
    for(let i=0;i<8;i++){
      const a=ring(-1,i),b=ring(1,i),c=ring(1,i+1),d=ring(-1,i+1);
      tri(a,c,b,bark,[i/8,0,(i+1)/8,2,i/8,2]);tri(a,d,c,bark,[i/8,0,(i+1)/8,0,(i+1)/8,2]);
      tri([log.x-log.length/2,centreY,log.z],d,a,wood,[.5,.5,.1,.9,.9,.9]);
      tri([log.x+log.length/2,centreY,log.z],b,c,wood,[.5,.5,.9,.1,.1,.1]);
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.computeVertexNormals();
    logSurfaces.push({x:log.x,z:log.z,topY,halfWidth,length:log.length,geometry:g});
    for(const offset of[-.75,0,.75])colliders.push({x:log.x+offset,z:log.z,r:.5});
    const home=Object.freeze({x:log.x,y:topY+.06,z:log.z}),axis=Object.freeze([Object.freeze({x:log.x-.6,y:home.y,z:log.z}),Object.freeze({x:log.x+.6,y:home.y,z:log.z})]);
    return Object.freeze({home,axis});
  }));
  // Preserve per-face bark / cut-end colours while batching both pieces once.
  const mergedLogs=new THREE.BufferGeometry();for(const attribute of['position','normal','uv','color']){const itemSize=attribute==='uv'?2:3,data=[];for(const s of logSurfaces)data.push(...s.geometry.attributes[attribute].array);mergedLogs.setAttribute(attribute,new THREE.Float32BufferAttribute(data,itemSize));}mergedLogs.computeBoundingSphere();
  for(const s of logSurfaces){s.geometry.dispose();delete s.geometry;}
  mesh(scene,'tropical-beetle-logs',mergedLogs,new THREE.MeshLambertMaterial({map:barkTex,vertexColors:true}));
  const herculesHomes=Object.freeze(herculesSupports.map(({home})=>Object.freeze(['hercules',home.x,home.z,home.y-heightAt(home.x,home.z)])));
  function herculesSupportAt(position){
    if(!position||!Number.isFinite(position.x)||!Number.isFinite(position.z))return null;
    const log=logSurfaces.find(s=>Math.abs(position.x-s.x)<=.6+1e-6&&Math.abs(position.z-s.z)<=1e-6);
    return log?{point:{x:position.x,y:log.topY,z:position.z},normal:upNormal,footHeightAt(x,z){if(!Number.isFinite(x)||!Number.isFinite(z)||Math.abs(x-log.x)>log.length/2||Math.abs(z-log.z)>.30)return null;return log.topY-Math.max(0,Math.abs(z-log.z)-log.halfWidth);}}:null;
  }
  // Static colour-pass entries only: shadow passes/driver calls require real rendering.
  const stats={trees:treeCount,leafInstances:canopy.length+understory.length+litter.length,canopyLeaves:canopy.length,understoryLeaves:understory.length,meshes:0,drawCalls:0,triangles:0,instances:0};scene.traverse(o=>{if(o.isMesh){stats.meshes++;stats.drawCalls+=Array.isArray(o.material)?o.material.length:1;stats.triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3*(o.isInstancedMesh?o.count:1);if(o.isInstancedMesh)stats.instances+=o.count;}});
  const landmarks={stream:{x:streamCenter(-8),z:-8,y:-.13},forest:{x:-10,z:-20},clearing:{x:0,z:7},restLeaves:supports.map(s=>s.home)};
  return{heightAt,colliders,bounds:TROPICAL_BOUNDS,spawn:{...TROPICAL_SPAWN},captureOccluders:Object.freeze(['tropical-ground','tropical-trunks','tropical-stream-stones','tropical-fruit-table','tropical-beetle-logs'].map(name=>scene.getObjectByName(name))),landmarks,supports,insectHomes:TROPICAL_HOMES,stats,baitStation,setBaitActive,herculesSupports,herculesHomes,herculesSupportAt,locationLabel(x,z){if(Math.hypot(x-bx,z-bz)<2.4)return baitStation.label;return Math.abs(x-streamCenter(z))<5?'熱帯林の小川沿い':z<-10?'木陰の明るい葉':'熱帯林の開けた林縁';},update(time,dt){water.material.opacity=.62+Math.sin(time*.35)*.018;}};
}
