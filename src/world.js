/* Natsukusa: a hand-composed, procedural summer woodland.
 * All geometry/materials are local; no network assets or generated fetches.
 * Coordinates are metres, Y up. Gameplay can use the same heightAt function.
 */
const THREE = window.THREE;
const TAU = Math.PI * 2;
const PATH = [[0,83],[1,47],[2,27],[0,10],[-1,2],[-5,-6],[-8,-15],[-16,-28],[-18,-49],[-25,-88]];
const EAST_PATH = [[-3,-2],[5,-6],[13,-10],[21,-11],[29,-10],[36,-18],[38,-36],[48,-56]];
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
const smooth = (a,b,x) => { const t=clamp((x-a)/(b-a),0,1); return t*t*(3-2*t); };
function seeded(seed) { return () => { seed|=0; seed=seed+0x6D2B79F5|0; let t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function hash(x,z) { const t=Math.sin(x*127.1+z*311.7)*43758.5453; return t-Math.floor(t); }
function noise(x,z) { const ix=Math.floor(x),iz=Math.floor(z),fx=x-ix,fz=z-iz,u=fx*fx*(3-2*fx),v=fz*fz*(3-2*fz); return (hash(ix,iz)*(1-u)+hash(ix+1,iz)*u)*(1-v)+(hash(ix,iz+1)*(1-u)+hash(ix+1,iz+1)*u)*v; }
function pondDistance(x,z) { return Math.hypot((x-24)/9,(z+20)/6); }
function distancePath(x,z,points=PATH) { let nearest=1e3; for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],dx=b[0]-a[0],dz=b[1]-a[1],t=clamp(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz),0,1);nearest=Math.min(nearest,Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t));} return nearest; }
function pathDistance(x,z) { return Math.min(distancePath(x,z),distancePath(x,z,EAST_PATH)); }
export function heightAt(x,z) {
  const base=.08+Math.sin(x*.053)*.32+Math.sin(z*.043)*.24+Math.sin((x+z)*.13)*.07+(noise(x*.045,z*.045)-.5)*.35;
  const edge=smooth(50,90,Math.hypot(x*.85,z));
  const rolling=edge*(1.3+noise(x*.035+13,z*.035)*2.9);
  const p=smooth(1.29,.59,pondDistance(x,z));
  return (base+rolling)*(1-p)-.86*p;
}
function canvasTexture(size,draw) {const canvas=document.createElement('canvas');canvas.width=canvas.height=size; const ctx=canvas.getContext('2d');draw(ctx,size);const texture=new THREE.CanvasTexture(canvas);texture.anisotropy=4;return texture;}
function addInstanced(scene,geometry,material,instances,shadow=false) {
  if(!instances.length)return null;
  const mesh=new THREE.InstancedMesh(geometry,material,instances.length),dummy=new THREE.Object3D();
  const color=new THREE.Color();
  instances.forEach((p,i)=>{dummy.position.set(p.x,p.y,p.z);dummy.rotation.set(p.rx||0,p.ry||0,p.rz||0);dummy.scale.set(p.sx||1,p.sy||1,p.sz||1);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);if(p.color){color.set(p.color);mesh.setColorAt(i,color);}});
  mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
  mesh.castShadow=shadow;mesh.receiveShadow=true;mesh.frustumCulled=false;scene.add(mesh);return mesh;
}
function meshCollector() {
  const positions=[],normals=[],uvs=[],colors=[],indices=[];
  return {
    add(geometry,matrix,color=new THREE.Color(1,1,1)) {
      const p=geometry.attributes.position,n=geometry.attributes.normal,uv=geometry.attributes.uv,offset=positions.length/3;
      const v=new THREE.Vector3(),normal=new THREE.Vector3(),nm=new THREE.Matrix3().getNormalMatrix(matrix);
      for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(matrix);positions.push(v.x,v.y,v.z);normal.fromBufferAttribute(n,i).applyMatrix3(nm).normalize();normals.push(normal.x,normal.y,normal.z);uvs.push(uv?uv.getX(i):0,uv?uv.getY(i):0);colors.push(color.r,color.g,color.b);}
      if(geometry.index){for(let i=0;i<geometry.index.count;i++)indices.push(geometry.index.array[i]+offset);}else for(let i=0;i<p.count;i++)indices.push(i+offset);
    },
    finish() {const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeBoundingSphere();return g;}
  };
}
function cylinderInto(collector,a,b,r1,r2,color,segments=7) {
  const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start),len=delta.length();
  const g=new THREE.CylinderGeometry(r2,r1,len,segments,1,false),m=new THREE.Matrix4(),q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());
  // Bark texture repeats vertically instead of stretching the grain over a whole tree.
  const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setY(i,uv.getY(i)*len*.65);
  m.compose(start.add(end).multiplyScalar(.5),q,new THREE.Vector3(1,1,1));collector.add(g,m,color);g.dispose();
}
function windMaterial(parameters,uniform,strength=.08) {
  const material=new THREE.MeshLambertMaterial(parameters);
  material.onBeforeCompile=shader=>{shader.uniforms.uWorldTime=uniform;shader.vertexShader='uniform float uWorldTime;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>\n#ifdef USE_INSTANCING\nvec3 root = instanceMatrix[3].xyz;\nfloat wind = sin(uWorldTime * 1.25 + root.x * .14 + root.z * .18);\ntransformed.x += wind * ${strength.toFixed(3)} * (position.y + .5);\ntransformed.z += cos(uWorldTime*.87+root.x*.11)*${(strength*.35).toFixed(3)}*(position.y+.5);\n#endif`);};
  material.customProgramCacheKey=()=>`summer-wind-${strength}`;return material;
}

export function createWorld(scene) {
  const rand=seeded(40521),windTime={value:0};
  const colliders=[];
  scene.background=new THREE.Color('#b4d4dc');
  scene.fog=new THREE.FogExp2('#bfd3ca',.0078);
  const hemi=new THREE.HemisphereLight('#d6ecf3','#677648',.85);scene.add(hemi);
  const sun=new THREE.DirectionalLight('#fff0cf',1.28);sun.position.set(-35,65,28);sun.target.position.set(0,0,-12);sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-39;sun.shadow.camera.right=39;sun.shadow.camera.top=39;sun.shadow.camera.bottom=-39;sun.shadow.camera.near=10;sun.shadow.camera.far=150;sun.shadow.bias=-.00045;sun.shadow.normalBias=.035;sun.shadow.radius=2;scene.add(sun,sun.target);
  const fill=new THREE.DirectionalLight('#b8d2ce',.17);fill.position.set(30,20,-50);scene.add(fill);
  const skyMat=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{top:{value:new THREE.Color('#72aecd')},bottom:{value:new THREE.Color('#dce5d7')},sunDir:{value:sun.position.clone().normalize()}},vertexShader:'varying vec3 vSky; void main(){vSky=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 vSky;uniform vec3 top;uniform vec3 bottom;uniform vec3 sunDir;void main(){vec3 d=normalize(vSky);float h=smoothstep(-.04,.75,d.y);vec3 col=mix(bottom,top,h);float s=max(dot(d,sunDir),0.);col+=vec3(1.,.85,.53)*pow(s,120.)*.24;col=mix(col,vec3(1.,.98,.86),smoothstep(.99965,.9999,s));gl_FragColor=vec4(col,1.);}'});
  const sky=new THREE.Mesh(new THREE.SphereGeometry(200,32,16),skyMat);sky.renderOrder=-100;sky.frustumCulled=false;sky.onBeforeRender=(_renderer,_scene,camera)=>{sky.position.copy(camera.position);sky.updateMatrixWorld();};scene.add(sky);

  // Fine mottled soil, moss and dry fibres; shared by grass-coloured and dirt-coloured ground.
  const groundTexture=canvasTexture(256,(ctx,s)=>{
    const r=seeded(93);ctx.fillStyle='#d7d5c0';ctx.fillRect(0,0,s,s);
    for(let i=0;i<15500;i++){const x=r()*s,y=r()*s,a=.03+r()*.12;ctx.fillStyle=`rgba(${r()>.45?'56,64,36':'255,248,208'},${a})`;ctx.fillRect(x,y,.5+r()*2,.5+r()*2);}
    for(let i=0;i<1300;i++){const x=r()*s,y=r()*s;ctx.strokeStyle=`rgba(71,79,42,${.06+r()*.12})`;ctx.lineWidth=.4;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+(r()-.5)*4,y-2-r()*5);ctx.stroke();}
  });groundTexture.wrapS=groundTexture.wrapT=THREE.RepeatWrapping;groundTexture.repeat.set(66,66);
  const terrainG=new THREE.PlaneGeometry(184,184,120,120);terrainG.rotateX(-Math.PI/2);
  const positions=terrainG.attributes.position,groundColors=[];
  const grassDark=new THREE.Color('#697b41'),grassLight=new THREE.Color('#879051'),dirt=new THREE.Color('#b9a37c'),wet=new THREE.Color('#716d4b');
  for(let i=0;i<positions.count;i++){
    const x=positions.getX(i),z=positions.getZ(i);positions.setY(i,heightAt(x,z));
    const n=noise(x*.18+2,z*.18)*.72+noise(x*.035,z*.035)*.28;
    const c=grassDark.clone().lerp(grassLight,n);
    const d=pathDistance(x,z),width=1.2+noise(x*.32,z*.32)*.5;
    c.lerp(dirt,1-smooth(width,width+1.1,d));
    const pd=pondDistance(x,z);if(pd<1.33)c.lerp(wet,(1-smooth(.98,1.33,pd))*.8);
    // Quiet leaf litter below the forest canopy.
    const forest=smooth(24,46,Math.hypot(x*.95,z+5));if(x<-18||z<-38)c.lerp(new THREE.Color('#656e3e'),forest*.35);
    groundColors.push(c.r,c.g,c.b);
  }
  terrainG.setAttribute('color',new THREE.Float32BufferAttribute(groundColors,3));terrainG.computeVertexNormals();
  const ground=new THREE.Mesh(terrainG,new THREE.MeshStandardMaterial({map:groundTexture,vertexColors:true,roughness:1}));ground.receiveShadow=true;scene.add(ground);

  // Beyond the playable grove, overlapping ridgelines give a genuinely roomy horizon.
  for(let layer=0;layer<3;layer++){
    const vertices=[],idx=[],segments=100,radius=115+layer*47;
    for(let i=0;i<=segments;i++){const a=i/segments*TAU,x=Math.cos(a)*radius,z=Math.sin(a)*radius;const h=7+layer*4+noise(Math.cos(a)*4.2+layer*9,Math.sin(a)*4.2)*17+Math.sin(a*5+layer)*3;vertices.push(x,-3,z,x,h,z);if(i<segments){const k=i*2;idx.push(k,k+1,k+2,k+1,k+3,k+2);}}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(idx);g.computeVertexNormals();
    const hill=new THREE.Mesh(g,new THREE.MeshLambertMaterial({color:['#6e8b72','#86a194','#a3bcb1'][layer],side:THREE.DoubleSide}));scene.add(hill);
  }

  const barkTexture=canvasTexture(256,(ctx,s)=>{
    const r=seeded(88);ctx.fillStyle='#817561';ctx.fillRect(0,0,s,s);
    for(let i=0;i<340;i++){let x=r()*s,y=r()*s;ctx.strokeStyle=`rgba(${r()>.65?'209,195,153':'41,38,30'},${.15+r()*.4})`;ctx.lineWidth=.4+r()*3.5;ctx.beginPath();ctx.moveTo(x,y);for(let j=0;j<6;j++){x+=(r()-.5)*5;y+=5+r()*13;ctx.lineTo(x,y);}ctx.stroke();}
    for(let i=0;i<1400;i++){ctx.fillStyle=`rgba(208,210,165,${r()*.15})`;ctx.fillRect(r()*s,r()*s,1+r()*3,1+r()*2);}
  });barkTexture.wrapS=barkTexture.wrapT=THREE.RepeatWrapping;
  const barkMaterial=new THREE.MeshStandardMaterial({map:barkTexture,roughness:1,vertexColors:true});
  const leafTexture=canvasTexture(256,(ctx,s)=>{
    const r=seeded(42);ctx.clearRect(0,0,s,s);
    ctx.lineWidth=2;ctx.strokeStyle='#62743a';ctx.beginPath();ctx.moveTo(126,234);ctx.bezierCurveTo(120,165,142,100,122,30);ctx.stroke();
    const leaves=[];for(let i=0;i<44;i++){const a=r()*TAU,rad=Math.sqrt(r());leaves.push({x:128+Math.cos(a)*rad*101,y:125+Math.sin(a)*rad*102,len:13+r()*13,w:6+r()*7,angle:a+(r()-.5)});}leaves.sort((a,b)=>a.y-b.y);
    for(const l of leaves){ctx.save();ctx.translate(l.x,l.y);ctx.rotate(l.angle);ctx.fillStyle=`hsl(${79+r()*18},${28+r()*12}%,${34+r()*20}%)`;ctx.beginPath();ctx.moveTo(-l.len,0);ctx.bezierCurveTo(-l.len*.4,-l.w,l.len*.5,-l.w,l.len,0);ctx.bezierCurveTo(l.len*.4,l.w,-l.len*.45,l.w,-l.len,0);ctx.fill();ctx.strokeStyle='rgba(202,211,134,.23)';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(-l.len,0);ctx.lineTo(l.len,0);ctx.stroke();ctx.restore();}
  });
  const leafMaterial=windMaterial({map:leafTexture,alphaTest:.46,side:THREE.DoubleSide,color:'#d9e1a8'},windTime,.055);
  const branchGeometry=meshCollector(),leafInstances=[];
  let treeCount=0;
  function tree(x,z,height,crown,seed,landmark=false) {
    treeCount++;
    const r=seeded(seed),y=heightAt(x,z),trunk=landmark?.61:height*.042;
    colliders.push({x,z,r:trunk+.12});
    const bark=new THREE.Color().setHSL(.105,.13,.69+r()*.17);
    const leanX=(r()-.5)*.8,leanZ=(r()-.5)*.8;
    cylinderInto(branchGeometry,[x,y-.08,z],[x+leanX*.4,y+height*.55,z+leanZ*.4],trunk,trunk*.53,bark,9);
    cylinderInto(branchGeometry,[x+leanX*.4,y+height*.55,z+leanZ*.4],[x+leanX,y+height*.91,z+leanZ],trunk*.53,.075,bark,7);
    for(let i=0;i<6;i++){
      const a=i/6*TAU+r()*.6,start=height*(.34+r()*.22),length=crown*(.55+r()*.4);
      const bx=x+Math.cos(a)*length,bz=z+Math.sin(a)*length,by=y+height*(.69+r()*.17);
      const mid=[x+Math.cos(a)*length*.48,y+start+(by-y-start)*.53,z+Math.sin(a)*length*.48];
      cylinderInto(branchGeometry,[x,y+start,z],mid,trunk*(.34+r()*.12),trunk*.17,bark,6);
      cylinderInto(branchGeometry,mid,[bx,by,bz],trunk*.17,.035,bark,5);
      if(i<4){const forkA=a+.5;cylinderInto(branchGeometry,mid,[bx+Math.cos(forkA)*.8,by+height*.09,bz+Math.sin(forkA)*.8],trunk*.12,.02,bark,5);}
    }
    // Buttress roots ground the tree instead of letting a cylinder float on the turf.
    for(let i=0;i<4;i++){const a=i*TAU/4+r()*.3,rx=x+Math.cos(a)*trunk*2.4,rz=z+Math.sin(a)*trunk*2.4;cylinderInto(branchGeometry,[x,y+.43,z],[rx,heightAt(rx,rz)+.03,rz],trunk*.34,.04,bark,5);}
    const count=landmark?230:Math.round(87+crown*17);
    for(let i=0;i<count;i++){
      const a=r()*TAU,u=r()*2-1,rad=Math.cbrt(r()),horizontal=Math.sqrt(1-u*u);
      const lobes=1+.11*Math.sin(a*5+seed);const px=x+Math.cos(a)*horizontal*rad*crown*lobes,pz=z+Math.sin(a)*horizontal*rad*crown*.87*lobes;
      const py=y+height*.79+u*rad*height*.25+Math.sin(a*3)*.25;
      const scale=(landmark?1.66:1.4)+r()*.72;
      const shade=clamp(.66+rad*.29+r()*.12,.6,1.08);const c=new THREE.Color().setHSL(.22+r()*.035,.22+r()*.12,shade*.57);
      leafInstances.push({x:px,y:py,z:pz,rx:(r()-.5)*2.5,ry:r()*TAU,rz:(r()-.5)*.6,sx:scale,sy:scale*(.82+r()*.35),sz:1,color:c});
    }
    return {x,z,y,r:trunk,height,crown};
  }
  const oak=tree(-10,-8,11.5,5.4,181,true);
  tree(12,-33,12,4.7,212);tree(34,-5,10.5,4.8,83);tree(-22,7,13,5.5,356);
  const treePositions=[[-29,-9],[-23,-24],[-33,-32],[-4,-40],[24,-42],[43,-29],[-34,23],[28,27],[-44,1],[46,9]];
  for(let i=0;i<treePositions.length;i++)tree(treePositions[i][0],treePositions[i][1],9+rand()*5,3.6+rand()*1.5,500+i*37);
  for(let i=0;i<68;i++){
    const a=rand()*TAU,rad=43+rand()*44,x=Math.cos(a)*rad,z=Math.sin(a)*rad;
    if(pathDistance(x,z)<3.8||pondDistance(x,z)<1.7)continue;
    if(treePositions.some(p=>Math.hypot(x-p[0],z-p[1])<5))continue;
    treePositions.push([x,z]);tree(x,z,8+rand()*6,3.1+rand()*1.9,900+i*71);
  }
  const trunks=new THREE.Mesh(branchGeometry.finish(),barkMaterial);trunks.castShadow=true;trunks.receiveShadow=true;scene.add(trunks);
  const leaves=addInstanced(scene,new THREE.PlaneGeometry(1,1),leafMaterial,leafInstances,true);

  // Transparent tufts retain fine, curved leaf silhouettes at eye height.
  const grassTexture=canvasTexture(256,(ctx,s)=>{
    const r=seeded(913);ctx.clearRect(0,0,s,s);
    for(let i=0;i<46;i++){
      const x=20+r()*216,y=256,top=24+r()*149,bend=(r()-.5)*90,width=1.5+r()*3.6;
      const grad=ctx.createLinearGradient(0,256,0,top);grad.addColorStop(0,'#536335');grad.addColorStop(.6,`hsl(${70+r()*19},35%,${37+r()*15}%)`);grad.addColorStop(1,'#abb36d');
      ctx.fillStyle=grad;ctx.beginPath();ctx.moveTo(x-width,y);ctx.quadraticCurveTo(x+bend*.2,top+60,x+bend,top);ctx.quadraticCurveTo(x+bend*.38,top+70,x+width,y);ctx.fill();
      if(i%7===0){ctx.strokeStyle='#999660';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+bend*.3,top+30,x+bend,top-9);ctx.stroke();for(let j=0;j<5;j++){ctx.fillStyle='#c5bc86';ctx.beginPath();ctx.ellipse(x+bend+(j%2?2:-2),top-6+j*4,2,3,.5,0,TAU);ctx.fill();}}
    }
  });
  const grassMaterial=windMaterial({map:grassTexture,alphaTest:.46,side:THREE.DoubleSide,color:'#d1d79d'},windTime,.12);
  const grassGeometry=new THREE.PlaneGeometry(1,1);grassGeometry.translate(0,.5,0);
  const grassInstances=[];
  for(let i=0;i<12600;i++){
    const x=(rand()-.5)*167,z=(rand()-.5)*167,dist=Math.hypot(x,z),d=pathDistance(x,z),pd=pondDistance(x,z);
    if(d<1.35+rand()*.75||pd<1.12||dist>84||Math.hypot(x,z-10)<2.4)continue;
    const density=dist<38?.94:dist<58?.65:.32;
    if(rand()>density)continue;
    if(colliders.some(c=>Math.hypot(x-c.x,z-c.z)<c.r+.3))continue;
    const patch=noise(x*.12,z*.12),h=.22+patch*.48+rand()*.22;
    const c=new THREE.Color().setHSL(.21+rand()*.035,.25+rand()*.12,.63+rand()*.15);
    grassInstances.push({x,y:heightAt(x,z)-.02,z,ry:rand()*TAU,sx:.72+rand()*.64,sy:h,sz:1,color:c});
    if(dist<39&&rand()<.45)grassInstances.push({x:x+.06,y:heightAt(x,z)-.02,z:z+.04,ry:rand()*TAU,sx:.74+rand()*.4,sy:h*.92,sz:1,color:c});
  }
  addInstanced(scene,grassGeometry,grassMaterial,grassInstances,false);

  // Understorey shrubs use the same leaf sprays, but spread close to the forest floor.
  const shrubs=[];
  for(let i=0;i<160;i++){
    const x=(rand()-.5)*139,z=(rand()-.5)*139;
    if(Math.hypot(x,z)<19||pathDistance(x,z)<3||pondDistance(x,z)<1.3)continue;
    const size=.65+rand()*.9;
    for(let j=0;j<8;j++){const a=rand()*TAU,rad=rand()*size;shrubs.push({x:x+Math.cos(a)*rad,y:heightAt(x,z)+.45+rand()*size*.7,z:z+Math.sin(a)*rad,rx:(rand()-.5)*2,ry:rand()*TAU,sx:size*1.1,sy:size*.95,sz:1,color:new THREE.Color().setHSL(.23+rand()*.025,.28,.52+rand()*.16)});}
  }
  addInstanced(scene,new THREE.PlaneGeometry(1,1),leafMaterial,shrubs,false);

  // Small field flowers, never giant candy-coloured props.
  const flowerTexture=canvasTexture(256,(ctx,s)=>{
    const r=seeded(678);ctx.clearRect(0,0,s,s);
    for(let i=0;i<8;i++){
      const x=26+r()*204,top=35+r()*100;ctx.strokeStyle='#667d42';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+(r()-.5)*28,256);ctx.quadraticCurveTo(x+15,180,x,top);ctx.stroke();
      for(let j=0;j<2;j++){ctx.save();ctx.translate(x+7,185-j*30);ctx.rotate(j?.8:-.7);ctx.fillStyle='#7b9150';ctx.beginPath();ctx.ellipse(0,0,16,4,0,0,TAU);ctx.fill();ctx.restore();}
      for(let k=0;k<7;k++){const a=k/7*TAU;ctx.fillStyle=i%3?'#eee9c8':'#d4c587';ctx.beginPath();ctx.ellipse(x+Math.cos(a)*7,top+Math.sin(a)*7,5.5,3.3,a,0,TAU);ctx.fill();}ctx.fillStyle='#b89b45';ctx.beginPath();ctx.arc(x,top,3,0,TAU);ctx.fill();
    }
  });
  const flowerMaterial=windMaterial({map:flowerTexture,alphaTest:.42,side:THREE.DoubleSide},windTime,.08);
  const flowers=[];
  const flowerPatches=[[-5,7,4],[8,-1,5],[15,-13,3],[-16,-17,4],[4,-22,3],[22,11,4]];
  for(const [cx,cz,r]of flowerPatches)for(let i=0;i<24;i++){const a=rand()*TAU,rad=Math.sqrt(rand())*r,x=cx+Math.cos(a)*rad,z=cz+Math.sin(a)*rad;if(pathDistance(x,z)<1.9||pondDistance(x,z)<1.2)continue;flowers.push({x,y:heightAt(x,z),z,ry:rand()*TAU,sx:.45+rand()*.35,sy:.40+rand()*.24,sz:1});}
  addInstanced(scene,grassGeometry,flowerMaterial,flowers,false);

  // Cool, mineral rocks nestle into the grass; sizes stay physically plausible.
  const rockGeo=new THREE.IcosahedronGeometry(1,1),rp=rockGeo.attributes.position;
  for(let i=0;i<rp.count;i++){const x=rp.getX(i),y=rp.getY(i),z=rp.getZ(i),f=.86+noise(x*3+5,z*3+y)*.23;rp.setXYZ(i,x*f,y*f,z*f);}rockGeo.computeVertexNormals();
  const rockTexture=canvasTexture(128,(ctx,s)=>{const r=seeded(23);ctx.fillStyle='#c2c2ab';ctx.fillRect(0,0,s,s);for(let i=0;i<6500;i++){ctx.fillStyle=r()>.4?'rgba(44,47,40,.13)':'rgba(240,236,205,.22)';ctx.fillRect(r()*s,r()*s,1+r()*3,1+r()*3);}});
  const rockMaterial=new THREE.MeshStandardMaterial({map:rockTexture,color:'#9c9f8b',roughness:1});
  const rocks=[];
  for(let i=0;i<74;i++){
    let x,z;if(i<24){const a=rand()*TAU;x=24+Math.cos(a)*(9.5+rand()*1.8);z=-20+Math.sin(a)*(6.2+rand()*1.4);}else{x=(rand()-.5)*140;z=(rand()-.5)*140;}
    if(pathDistance(x,z)<2||Math.hypot(x,z)<6)continue;
    const size=i<24?.22+rand()*.48:.35+rand()*.9;
    rocks.push({x,y:heightAt(x,z)+size*.25,z,rx:rand()*.5,ry:rand()*TAU,rz:rand()*.5,sx:size*(1+rand()*.4),sy:size*.65,sz:size,color:new THREE.Color().setHSL(.14,.06,.68+rand()*.16)});
    if(size>.55)colliders.push({x,z,r:size*.8});
  }
  addInstanced(scene,rockGeo,rockMaterial,rocks,true);

  // Pond surface uses broad moving highlights, not mirror/glitter overload.
  const waterG=new THREE.CircleGeometry(1,72);waterG.rotateX(-Math.PI/2);const wp=waterG.attributes.position;
  for(let i=0;i<wp.count;i++){const x=wp.getX(i),z=wp.getZ(i);wp.setXYZ(i,24+x*9.7,-.29,-20+z*6.45);}waterG.computeVertexNormals();
  const waterMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:{uTime:windTime,uColor:{value:new THREE.Color('#557c76')},uFogColor:{value:scene.fog.color},uFogDensity:{value:scene.fog.density}},vertexShader:'varying vec3 vWorld;varying float vDepth;void main(){vec4 w=modelMatrix*vec4(position,1.);vWorld=w.xyz;vec4 v=viewMatrix*w;vDepth=-v.z;gl_Position=projectionMatrix*v;}',fragmentShader:'uniform float uTime;uniform vec3 uColor;uniform vec3 uFogColor;uniform float uFogDensity;varying vec3 vWorld;varying float vDepth;void main(){float ripple=sin(vWorld.x*4.1+vWorld.z*2.8+uTime*.8)*sin(vWorld.x*1.3-vWorld.z*4.7-uTime*.65);float fine=sin(vWorld.z*13.+vWorld.x*7.+uTime*1.2);vec3 col=uColor+vec3(.10,.14,.12)*ripple*.23+vec3(.18,.18,.12)*pow(max(0.,fine),16.)*.22;float f=1.-exp(-uFogDensity*uFogDensity*vDepth*vDepth);gl_FragColor=vec4(mix(col,uFogColor,f),.87);}'});
  const water=new THREE.Mesh(waterG,waterMaterial);water.renderOrder=2;scene.add(water);
  // Irises / reeds with thin stems around the far bank.
  const reedTexture=canvasTexture(256,(ctx,s)=>{const r=seeded(77);for(let i=0;i<18;i++){const x=20+r()*210,top=20+r()*80,bend=(r()-.5)*35;ctx.strokeStyle=i%3?'#8c955d':'#71804c';ctx.lineWidth=1.8;ctx.beginPath();ctx.moveTo(x,256);ctx.quadraticCurveTo(x+bend,100,x+bend,top);ctx.stroke();ctx.fillStyle='#736b42';ctx.beginPath();ctx.ellipse(x+bend,top+6,2.2,11,0,0,TAU);ctx.fill();ctx.fillStyle='#798749';ctx.beginPath();ctx.moveTo(x,245);ctx.quadraticCurveTo(x-24,170,x-35,134);ctx.quadraticCurveTo(x-6,165,x+2,245);ctx.fill();}});
  const reedMaterial=windMaterial({map:reedTexture,alphaTest:.4,side:THREE.DoubleSide},windTime,.07),reeds=[];
  for(let i=0;i<115;i++){const a=rand()*TAU,rad=1.08+rand()*.11,x=24+Math.cos(a)*9*rad,z=-20+Math.sin(a)*6*rad;if(pathDistance(x,z)<1.8)continue;reeds.push({x,y:heightAt(x,z)-.08,z,ry:rand()*TAU,sx:.7+rand()*.5,sy:.8+rand()*.65,sz:1});}
  addInstanced(scene,grassGeometry,reedMaterial,reeds,false);

  // A few floating pads make the water readable at low viewing angles.
  const padG=new THREE.CircleGeometry(1,12);padG.rotateX(-Math.PI/2);
  const pads=[];for(let i=0;i<18;i++){const x=25+rand()*4,z=-23+rand()*4;if(pondDistance(x,z)>.82)continue;pads.push({x,y:-.272,z,ry:rand()*TAU,sx:.14+rand()*.17,sy:1,sz:.12+rand()*.14,color:new THREE.Color().setHSL(.24,.24,.4+rand()*.12)});}
  addInstanced(scene,padG,new THREE.MeshStandardMaterial({color:'#a3b47a',roughness:.88,side:THREE.DoubleSide}),pads,false);

  // Resting insects have actual supports: these coordinates intentionally match
  // insects.js homes. Keeping the head still makes landing / release readable.
  const perchHomes=[
    ['flower',0,5,1.15],['flower',-3.7,1.8,1.15],['flower',5,-3,1.3],
    ['flower',-17,-1,1.25],['flower',12,-13,1.2],['flower',-26,-21,1.15],
    ['flower',15,15,1.25],['flower',-7,15,1.2],
    ['reed',18,-14,1.4],['reed',19,-24,1.25],['reed',29,-13,1.35],
    ['reed',31,-24,1.2],['reed',22,-29,1.3],['reed',10,-19,1.2]
  ];
  const perchGeometry=meshCollector(),perchMatrix=new THREE.Matrix4(),perchObject=new THREE.Object3D();
  const perchLeaf=new THREE.SphereGeometry(1,7,3),perchPetal=new THREE.SphereGeometry(1,7,4);
  function perchPart(geometry,x,y,z,sx,sy,sz,rx,ry,rz,color){
    perchObject.position.set(x,y,z);perchObject.scale.set(sx,sy,sz);perchObject.rotation.set(rx,ry,rz);perchObject.updateMatrix();
    perchMatrix.copy(perchObject.matrix);perchGeometry.add(geometry,perchMatrix,new THREE.Color(color));
  }
  for(let i=0;i<perchHomes.length;i++){
    const [kind,x,z,h]=perchHomes[i],headY=heightAt(x,z)+h-.025;
    const bx=i===0?1.2:x+.16*Math.cos(i*1.9),bz=i===0?z+.06:z+.16*Math.sin(i*1.9),baseY=heightAt(bx,bz);
    let last=[bx,baseY-.015,bz];
    // Tall cow-parsley-like stems lean naturally, rather than forming poles in the path.
    for(let j=1;j<=4;j++){
      const t=j/4,curve=t*t*(3-2*t),point=[bx+(x-bx)*curve,baseY+(headY-baseY)*t,bz+(z-bz)*curve];
      cylinderInto(perchGeometry,last,point,kind==='flower'?.013-j*.001:.011-j*.0009,kind==='flower'?.012-j*.001:.010-j*.0009,new THREE.Color(kind==='flower'?'#708144':'#85875a'),5);last=point;
    }
    for(let j=0;j<3;j++){
      const t=.26+j*.19,curve=t*t*(3-2*t),a=i*1.7+j*2.4,lx=bx+(x-bx)*curve,ly=baseY+(headY-baseY)*t,lz=bz+(z-bz)*curve;
      perchPart(perchLeaf,lx+Math.cos(a)*.085,ly+.025,lz+Math.sin(a)*.085,.12,.008,kind==='flower'?.033:.018,0,-a,-.22,'#778b48');
    }
    if(kind==='flower'){
      // Small cream petals, golden centre. The insect remains the salient shape.
      for(let j=0;j<7;j++){const a=j/7*TAU;perchPart(perchPetal,x+Math.cos(a)*.047,headY-.006,z+Math.sin(a)*.047,.043,.009,.019,0,-a,0,'#e2d697');}
      perchPart(perchPetal,x,headY,z,.029,.014,.029,0,0,0,'#b79b45');
      // One smaller companion bloom makes the tall plant legible from the path.
      const ax=x+.15*Math.cos(i+1),az=z+.15*Math.sin(i+1),ay=headY-.22;
      const branchT=.65,branchCurve=branchT*branchT*(3-2*branchT);
      cylinderInto(perchGeometry,[bx+(x-bx)*branchCurve,baseY+(headY-baseY)*branchT,bz+(z-bz)*branchCurve],[ax,ay,az],.005,.003,new THREE.Color('#78864a'),5);
      perchPart(perchPetal,ax,ay,az,.035,.012,.035,0,0,0,'#d8ce8d');
    }else{
      cylinderInto(perchGeometry,[x,headY-.105,z],[x,headY,z],.022,.013,new THREE.Color('#91825a'),6);
    }
  }
  perchLeaf.dispose();perchPetal.dispose();
  const perches=new THREE.Mesh(perchGeometry.finish(),new THREE.MeshLambertMaterial({vertexColors:true}));
  perches.name='insect-resting-perches';perches.receiveShadow=true;scene.add(perches);

  // Pale summer pollen is deliberately sparse, and never mistaken for catchable insects.
  const dustPositions=new Float32Array(64*3);for(let i=0;i<64;i++){dustPositions[i*3]=(rand()-.5)*65;dustPositions[i*3+1]=.6+rand()*5;dustPositions[i*3+2]=(rand()-.5)*65;}
  const dustG=new THREE.BufferGeometry();dustG.setAttribute('position',new THREE.BufferAttribute(dustPositions,3));
  const dust=new THREE.Points(dustG,new THREE.PointsMaterial({color:'#f3e6b5',size:.026,transparent:true,opacity:.32,depthWrite:false,sizeAttenuation:true}));scene.add(dust);

  // Fallen branch beside the oak: an understated close-up scale cue.
  const log=new THREE.Mesh(new THREE.CylinderGeometry(.17,.23,3.1,9),new THREE.MeshStandardMaterial({map:barkTexture,color:'#7c715a',roughness:1}));log.rotation.set(.1,.5,Math.PI/2-.1);log.position.set(-16,heightAt(-16,-4)+.21,-4);log.castShadow=true;log.receiveShadow=true;scene.add(log);
  colliders.push({x:-16,z:-4,r:.55});

  const landmarks={oak,pond:{x:24,z:-20,y:-.29,rx:9,rz:6},meadow:{x:4,z:-3,y:heightAt(4,-3)},flowers:{x:8,z:-1,y:heightAt(8,-1)},forest:{x:-24,z:-25,y:heightAt(-24,-25)}};
  return {
    heightAt,colliders,bounds:85,spawn:{x:0,z:10},landmarks,
    update(time,dt){windTime.value=time;dust.rotation.y=Math.sin(time*.012)*.035;dust.position.y=Math.sin(time*.21)*.09;},
    // Useful renderer inspection without changing simulation state.
    stats:{trees:treeCount,leafCards:leafInstances.length,grassTufts:grassInstances.length},
  };
}
