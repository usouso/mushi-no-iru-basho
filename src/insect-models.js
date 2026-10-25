/** Original procedural insect art. Rendering state only; no simulation mutates here. */
const THREE = window.THREE;
// Initial prototype display dimensions; inspection keeps its independent framing.
export const FIELD_VISUAL_SCALE = Object.freeze({ butterfly: 1, dragonfly: 1, cicada: 1, morpho: 1, grasshopper: 1, hercules: 1 });
const cache = {};
const material = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: .76, ...extra });

function texture(kind, field = false) {
  const key = field ? `${kind}-field-base` : kind;
  if (cache[key]) return cache[key];
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
  const c = canvas.getContext('2d');
  c.fillStyle = kind === 'butterfly' ? '#fffee9' : kind === 'cicada' ? (field ? '#d4ad72' : '#b58b55') : (field ? '#f0efda' : '#e7eee2');
  c.fillRect(0, 0, 256, 256);
  let seed = 41;
  const random = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
  for (let n=0;n<2000;n++) {
    c.fillStyle = kind === 'cicada' ? `rgba(66,38,18,${random()*.22})` : `rgba(117,108,75,${random()*.07})`;
    const r = random() * 2 + .5;
    c.fillRect(random()*256,random()*256,r,r);
  }
  if (kind === 'butterfly') {
    c.fillStyle='#252d24'; c.beginPath();c.moveTo(175,0);c.lineTo(256,0);c.lineTo(256,95);c.bezierCurveTo(235,58,204,47,175,0);c.fill();
    [[156,94,13,17],[162,157,12,15]].forEach(([x,y,a,b])=>{c.beginPath();c.ellipse(x,y,a,b,-.1,0,Math.PI*2);c.fill();});
    c.strokeStyle='rgba(144,134,96,.26)'; c.lineWidth=1.1;
  } else { c.strokeStyle=kind==='cicada' ? 'rgba(65,38,18,.75)' : 'rgba(55,76,59,.72)';c.lineWidth=kind==='cicada'?1.8:1; }
  // Branched longitudinal and cross veins, intentionally drawn rather than downloaded.
  for(let n=0;n<9;n++) {
    const end = 12+n*29;
    c.beginPath();c.moveTo(0,180);c.bezierCurveTo(75,152,140,end,256,end);c.stroke();
    if(kind!=='butterfly') for(let j=1;j<6;j++) {
      const x=j*41;const y=180+(end-180)*(x/256);
      c.beginPath();c.moveTo(x,y);c.lineTo(x+12,y+24);c.stroke();
    }
  }
  const t = new THREE.CanvasTexture(canvas); t.encoding = THREE.sRGBEncoding; t.anisotropy=4;
  cache[key] = t; return t;
}
// A broad, two-tone margin is painted INSIDE the actual wing silhouette.
// It remains ordinary lit/occluded material: no screen-space outline, glow,
// extra mesh, or fixed-pixel LineBasicMaterial dependency. Inspection never
// enters this path and keeps its existing procedural texture byte-for-byte.
const fieldWingMaterials = new WeakMap();
function fieldWingMaterial(mat, kind, coords) {
  let variants = fieldWingMaterials.get(mat);
  if (!variants) { variants = new Map(); fieldWingMaterials.set(mat, variants); }
  const key = `${kind}-field-margin-${JSON.stringify(coords)}`;
  if (variants.has(key)) return variants.get(key);
  let map = cache[key];
  if (!map) {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
    const c = canvas.getContext('2d');
    c.drawImage(texture(kind, true).image, 0, 0);
    const xs = coords.map(p => p[0]), ys = coords.map(p => p[1]);
    const minX = Math.min(...xs), minY = Math.min(...ys);
    const width = Math.max(...xs) - minX, height = Math.max(...ys) - minY;
    c.beginPath();
    coords.forEach(([x, y], i) => {
      const u = (x - minX) / width * 256, v = (1 - (y - minY) / height) * 256;
      if (i === 0) c.moveTo(u, v); else c.lineTo(u, v);
    });
    c.closePath(); c.lineJoin = 'round';
    // Geometry clips the outer half of these strokes; both bands are on-wing.
    c.strokeStyle = kind === 'cicada' ? '#f5db9b' : '#fff9df';
    c.lineWidth = kind === 'butterfly' ? 22 : kind === 'dragonfly' ? 24 : 26; c.stroke();
    c.strokeStyle = kind === 'butterfly' ? '#655c3a' : kind === 'dragonfly' ? '#655435' : '#654021';
    c.lineWidth = kind === 'butterfly' ? 8 : kind === 'dragonfly' ? 9 : 10; c.stroke();
    map = new THREE.CanvasTexture(canvas); map.encoding = THREE.sRGBEncoding; map.anisotropy = 4;
    map.name = `${kind}-field-wing-margin`; cache[key] = map;
  }
  const fieldMat = mat.clone(); fieldMat.map = map;
  variants.set(key, fieldMat); return fieldMat;
}
function ellipsoid(parent, xyz, scale, mat, detail=12) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, detail, 8),mat);
  mesh.position.set(...xyz); mesh.scale.set(...scale); parent.add(mesh); return mesh;
}
function segment(parent, from, to, radius, mat, radial=5) {
  const a=new THREE.Vector3(...from), b=new THREE.Vector3(...to);
  const d=b.clone().sub(a);
  const m=new THREE.Mesh(new THREE.CylinderGeometry(radius*.8,radius,d.length(),radial),mat);
  m.position.copy(a.add(b).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize()); parent.add(m);return m;
}
function thread(parent, points, color, opacity=.8) {
  const geom=new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p)));
  const line=new THREE.Line(geom,new THREE.LineBasicMaterial({color,transparent:opacity<1,opacity})); parent.add(line);return line;
}
function wing(parent, coords, mat, fieldKind = null) {
  const shape=new THREE.Shape();shape.moveTo(coords[0][0],coords[0][1]);
  for(let i=1;i<coords.length;i++) shape.lineTo(coords[i][0],coords[i][1]);shape.closePath();
  const geom=new THREE.ShapeGeometry(shape,8);geom.computeBoundingBox();
  const box=geom.boundingBox,uv=geom.attributes.uv,pos=geom.attributes.position;
  for(let i=0;i<uv.count;i++) uv.setXY(i,(pos.getX(i)-box.min.x)/(box.max.x-box.min.x),(pos.getY(i)-box.min.y)/(box.max.y-box.min.y));
  geom.rotateX(Math.PI/2);
  const mesh=new THREE.Mesh(geom,fieldKind ? fieldWingMaterial(mat,fieldKind,coords) : mat); mesh.renderOrder=2;parent.add(mesh);return mesh;
}
function legs(body, mat, scale=1) {
  for(const side of [-1,1]) for(let n=0;n<3;n++) {
    const z=(.035-n*.026)*scale;
    segment(body,[side*.012*scale,0,z],[side*.032*scale,-.02*scale,z-.012*scale],.0015*scale,mat);
    segment(body,[side*.032*scale,-.02*scale,z-.012*scale],[side*.048*scale,-.025*scale,z+.006*scale],.0011*scale,mat);
  }
}
function butterfly(root, field = false) {
  const dark=material(field?'#282b20':'#34382b'),body=material(field?'#68673c':'#777950'),eyes=material('#252b22',{roughness:.3});
  ellipsoid(root,[0,0,-.025],[.009,.012,.046],dark);
  ellipsoid(root,[0,0,.018],[.014,.016,.022],body);
  ellipsoid(root,[0,.003,.048],[.013,.012,.012],body);
  for(const s of [-1,1]) {
    ellipsoid(root,[s*.01,.007,.051],[.005,.006,.006],eyes,8);
    thread(root,[[s*.005,.007,.056],[s*.015,.025,.079],[s*.022,.03,.084]],'#343b2a');
    ellipsoid(root,[s*.022,.03,.084],[.0025,.0025,.0035],dark,6);
  }
  const wingMat=material('#fffef4',{map:texture('butterfly'),side:THREE.DoubleSide,roughness:.9});
  const pivots=[];
  for(const side of [-1,1]) {
    const pivot=new THREE.Group();root.add(pivot);pivot.scale.x=side;pivot.userData.side=side;
    wing(pivot,[[.006,.024],[.043,.085],[.105,.113],[.149,.095],[.16,.065],[.143,.012],[.117,-.006],[.129,-.038],[.107,-.08],[.069,-.087],[.025,-.058],[.007,-.027]],wingMat,field?'butterfly':null);
    pivots.push(pivot);
  }
  legs(root,dark,.65);root.userData.wings=pivots;
}
function dragonfly(root, field = false) {
  const red=material(field?'#cf4c2c':'#ba442d'),dark=material(field?'#34281b':'#3a3325'),thorax=material(field?'#c69743':'#ad8744'),eyeMat=material('#7c4928',{roughness:.3});
  ellipsoid(root,[0,0,.02],[.015,.017,.026],thorax);
  ellipsoid(root,[0,0,.054],[.019,.013,.014],dark);
  for(const s of [-1,1]) ellipsoid(root,[s*.013,.005,.057],[.012,.014,.013],eyeMat,12);
  for(let i=0;i<9;i++) {
    const z=-.013-i*.014;
    ellipsoid(root,[0,0,z],[.008-i*.00045,.007-i*.00035,.0085],i%3===2?dark:red,8);
  }
  const glass=material(field?'#fff9df':'#f4f4de',{map:texture('dragonfly'),side:THREE.DoubleSide,transparent:true,opacity:field?.92:.72,roughness:.25,metalness:.08,depthWrite:false});
  const pivots=[];
  for(const side of [-1,1]) for(const back of [false,true]) {
    const pivot=new THREE.Group();pivot.scale.x=side;pivot.position.z=back?-.006:.025;root.add(pivot);pivot.userData.side=side;pivot.userData.back=back;
    wing(pivot,back?[[.008,0],[.075,.005],[.167,-.025],[.2,-.04],[.194,-.055],[.15,-.062],[.066,-.035]]:[[.008,0],[.073,.025],[.18,.04],[.2,.03],[.196,.017],[.135,.005],[.067,-.013]],glass,field?'dragonfly':null);
    thread(pivot,back?[[.01,.001,0],[.08,.001,-.012],[.197,.001,-.04]]:[[.01,.001,0],[.08,.001,.022],[.197,.001,.029]],'#5b5740',.65);
    segment(pivot,[.17,.002,back?-.035:.034],[.182,.002,back?-.039:.033],.0022,dark,4);
    pivots.push(pivot);
  }
  legs(root,dark,.85);root.userData.wings=pivots;
}
function cicada(root, field = false) {
  const brown=material(field?'#a07a42':'#8d683c'),dark=material(field?'#302113':'#30281b'),eyeMat=material(field?'#27170e':'#3d2516',{roughness:.25});
  ellipsoid(root,[0,0,-.025],[.032,.028,.065],brown);
  for(let n=0;n<6;n++) {
    const z=-.015-n*.014;
    thread(root,[[-.025,.012,z],[-.018,.026,z],[0,.029,z],[.018,.026,z],[.025,.012,z]],'#453720',.8);
  }
  ellipsoid(root,[0,0,.035],[.037,.03,.031],dark);
  ellipsoid(root,[0,.008,.07],[.036,.022,.019],brown);
  for(const s of [-1,1]) {
    ellipsoid(root,[s*.033,.012,.07],[.011,.013,.012],eyeMat,10);
    thread(root,[[s*.016,.014,.078],[s*.024,.019,.094],[s*.029,.017,.104]],'#322c22');
    ellipsoid(root,[s*.015,.027,.034],[.008,.004,.019],brown);
  }
  const wings=material(field?'#fff0cd':'#e0c99b',{map:texture('cicada'),side:THREE.DoubleSide,roughness:.72,transparent:true,opacity:.96});
  const pivots=[];
  for(const side of [-1,1]) {
    const pivot=new THREE.Group();pivot.position.set(side*.013,.018,.035);pivot.scale.x=side;pivot.rotation.z=-side*.32;root.add(pivot);pivot.userData.side=side;
    pivot.userData.wingType='forewing';
    wing(pivot,[[0,0],[.037,-.016],[.058,-.067],[.052,-.126],[.037,-.157],[.021,-.16],[.008,-.13],[0,-.06]],wings,field?'cicada':null);
    pivots.push(pivot);
  }
  // Short, opaque brown hindwings sit beneath the unchanged forewings.
  // Outline/veins are a simplified original form, not a measured species ratio.
  const hindMaterial=material('#a7804c',{map:texture('cicada'),side:THREE.DoubleSide,roughness:.8});
  for(const side of [-1,1]){
    const pivot=new THREE.Group();pivot.name='cicada-hindwing';pivot.position.set(side*.013,.018,.035);pivot.scale.x=side;pivot.rotation.z=-side*.32;
    pivot.userData.side=side;pivot.userData.wingType='hindwing';root.add(pivot);
    const mesh=wing(pivot,[[.006,-.026],[.020,-.033],[.035,-.058],[.036,-.084],[.027,-.108],[.015,-.104],[.007,-.070]],hindMaterial);
    mesh.position.y=-.0025;pivots.push(pivot);
  }
  legs(root,dark,1.6);root.userData.wings=pivots;
}

// Original morpho silhouette and painted markings, constructed without tracing
// reference photographs. Front/back use opposite culling on the same geometry:
// dorsal blue cannot show through the opaque brown, eye-spotted underside.
function morphoWingShape(back) {
  const shape=new THREE.Shape();
  if(!back) {
    shape.moveTo(.010,.020);
    shape.quadraticCurveTo(.030,.090,.076,.130);
    shape.bezierCurveTo(.130,.171,.205,.170,.232,.126);
    shape.quadraticCurveTo(.240,.107,.240,.083);
    shape.bezierCurveTo(.235,.035,.193,-.014,.128,-.032);
    shape.quadraticCurveTo(.056,-.047,.014,-.025);
  } else {
    shape.moveTo(.012,.005);
    shape.quadraticCurveTo(.073,-.015,.136,-.024);
    shape.bezierCurveTo(.194,-.031,.225,-.078,.207,-.127);
    shape.bezierCurveTo(.193,-.173,.154,-.204,.102,-.204);
    shape.bezierCurveTo(.047,-.205,.012,-.157,.006,-.080);
  }
  shape.closePath();return shape;
}
function morphoWingTexture(back, underside, shape, bounds) {
  const key=`morpho-${back?'hind':'fore'}-${underside?'ventral':'dorsal'}`;
  if(cache[key])return cache[key];
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;
  const c=canvas.getContext('2d'),size=512;
  const gradient=c.createLinearGradient(20,430,470,40);
  if(underside) {
    gradient.addColorStop(0,'#65432e');gradient.addColorStop(.45,'#a48255');gradient.addColorStop(1,'#79583b');
  } else {
    gradient.addColorStop(0,'#234477');gradient.addColorStop(.38,'#277fa9');gradient.addColorStop(.72,'#72bdcb');gradient.addColorStop(1,'#28638c');
  }
  c.fillStyle=gradient;c.fillRect(0,0,size,size);
  let seed=back?731:293;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  // Small painted scale strokes, not a photo texture or an emissive effect.
  for(let i=0;i<1500;i++) {
    const x=random()*size,y=random()*size;
    c.fillStyle=underside?`rgba(45,28,18,${.035+random()*.09})`:`rgba(183,219,218,${.035+random()*.08})`;
    c.fillRect(x,y,1+random()*3,1+random()*5);
  }
  c.strokeStyle=underside?'rgba(51,32,21,.43)':'rgba(21,49,70,.36)';c.lineWidth=1.8;
  for(let i=0;i<9;i++) {
    const edge=30+i*55;
    c.beginPath();c.moveTo(12,back?45:365);
    c.bezierCurveTo(135,back?130:300,305,edge,505,edge);c.stroke();
  }
  if(underside) {
    // Broken tawny bands and separated cream/dark eyespots on each wing.
    c.strokeStyle='rgba(221,190,137,.56)';c.lineWidth=9;
    for(const shift of [0,92]) {
      c.beginPath();c.moveTo(20,112+shift);c.bezierCurveTo(140,60+shift,320,195+shift,490,135+shift);c.stroke();
    }
    const eyes=back?[[.61,.23,.059],[.78,.44,.077],[.69,.68,.079],[.43,.82,.059]]:
      [[.64,.27,.054],[.79,.49,.070],[.64,.72,.061]];
    for(const [u,v,r]of eyes) {
      const x=u*size,y=v*size,radius=r*size;
      for(const [factor,color]of [[1.15,'#51331e'],[1,'#d1b583'],[.76,'#31271f'],[.53,'#a48758'],[.34,'#292522']]) {
        c.fillStyle=color;c.beginPath();c.ellipse(x,y,radius*factor,radius*.87*factor,-.12,0,Math.PI*2);c.fill();
      }
      c.fillStyle='#e3d4b1';c.beginPath();c.ellipse(x-radius*.12,y-radius*.10,radius*.14,radius*.16,0,0,Math.PI*2);c.fill();
    }
  }
  // Broad natural dark margin follows this wing's curved geometry silhouette.
  const points=shape.getPoints(24),width=bounds.max.x-bounds.min.x,height=bounds.max.y-bounds.min.y;
  c.beginPath();points.forEach((p,i)=>{
    const x=(p.x-bounds.min.x)/width*size,y=(1-(p.y-bounds.min.y)/height)*size;
    if(i)c.lineTo(x,y);else c.moveTo(x,y);
  });c.closePath();c.lineJoin='round';
  c.strokeStyle=underside?'#60432c':'#29291f';c.lineWidth=underside?25:46;c.stroke();
  if(!underside) {
    c.fillStyle='#d9d8b6';
    for(const [u,v]of back?[[.77,.25],[.87,.43],[.80,.66],[.59,.84]]:[[.67,.08],[.83,.17],[.94,.32],[.90,.57]]) {
      c.beginPath();c.ellipse(u*size,v*size,3.5,5.5,-.25,0,Math.PI*2);c.fill();
    }
  }
  const map=new THREE.CanvasTexture(canvas);map.encoding=THREE.sRGBEncoding;map.anisotropy=4;map.name=key;
  cache[key]=map;return map;
}
function morphoLegs(root,mat) {
  for(const side of [-1,1]){
    // Reduced forelegs folded beneath the thorax; they do not support the body.
    segment(root,[side*.010,-.012,.039],[side*.017,-.020,.046],.0011,mat);
    segment(root,[side*.017,-.020,.046],[side*.009,-.023,.035],.0008,mat);
    // The middle and hind support legs retain their previous geometry exactly.
    for(let n=1;n<3;n++){
      const scale=1.15,z=(.035-n*.026)*scale;
      segment(root,[side*.012*scale,0,z],[side*.032*scale,-.02*scale,z-.012*scale],.0015*scale,mat);
      segment(root,[side*.032*scale,-.02*scale,z-.012*scale],[side*.048*scale,-.025*scale,z+.006*scale],.0011*scale,mat);
    }
  }
}
function morpho(root) {
  const dark=material('#322d24'),fur=material('#605a43'),eyes=material('#211f1a',{roughness:.32});
  ellipsoid(root,[0,0,-.035],[.013,.016,.058],dark);
  ellipsoid(root,[0,.001,.021],[.020,.022,.032],fur);
  ellipsoid(root,[0,.006,.066],[.016,.016,.015],fur);
  for(const side of [-1,1]) {
    ellipsoid(root,[side*.013,.010,.070],[.008,.009,.008],eyes,10);
    thread(root,[[side*.007,.012,.078],[side*.018,.032,.102],[side*.032,.039,.118]],'#39372b');
    ellipsoid(root,[side*.032,.039,.118],[.003,.003,.005],dark,8);
    for(let n=0;n<3;n++) segment(root,[side*.013,.009,.025-n*.012],[side*.021,.018,.024-n*.012],.0012,fur,4);
  }
  morphoLegs(root,dark);
  const shapes=[morphoWingShape(false),morphoWingShape(true)],geometries=[],materials=[];
  for(const back of [false,true]) {
    const shape=shapes[back?1:0],geometry=new THREE.ShapeGeometry(shape,18);geometry.computeBoundingBox();
    const bounds=geometry.boundingBox.clone(),uv=geometry.attributes.uv,pos=geometry.attributes.position;
    for(let i=0;i<uv.count;i++)uv.setXY(i,(pos.getX(i)-bounds.min.x)/(bounds.max.x-bounds.min.x),(pos.getY(i)-bounds.min.y)/(bounds.max.y-bounds.min.y));
    const upper=material('#e3f0ee',{map:morphoWingTexture(back,false,shape,bounds),side:THREE.BackSide,roughness:.39,metalness:.16});
    const lower=material('#f6ecdc',{map:morphoWingTexture(back,true,shape,bounds),side:THREE.FrontSide,roughness:.88});
    upper.name='morpho-dorsal-blue';lower.name='morpho-ventral-eyespots';
    geometry.rotateX(Math.PI/2);geometries.push(geometry);materials.push([upper,lower]);
  }
  const pivots=[];
  for(const side of [-1,1])for(const back of [false,true]) {
    const pivot=new THREE.Group();pivot.scale.x=side;pivot.position.y=back?-.0006:.0008;
    pivot.userData.side=side;pivot.userData.back=back;root.add(pivot);
    const index=back?1:0;
    for(const [surface,mat]of [['dorsal',materials[index][0]],['ventral',materials[index][1]]]) {
      const mesh=new THREE.Mesh(geometries[index],mat);mesh.name=`morpho-${back?'hind':'fore'}-${surface}`;
      mesh.userData.surface=surface;pivot.add(mesh);
    }
    pivots.push(pivot);
  }
  root.userData.wings=pivots;
}

// Six-sided tapered limb with a horizontal foot end-cap. Unlike a tilted
// cylinder cap, every terminal vertex stays on or above the support plane.
function grasshopperLimb(parent, from, to, radius, mat, foot=false) {
  const a=new THREE.Vector3(...from),b=new THREE.Vector3(...to),axis=b.clone().sub(a).normalize();
  const u=new THREE.Vector3(1,0,0).addScaledVector(axis,-axis.x).normalize(),v=axis.clone().cross(u);
  const positions=[],indices=[],sides=6;
  for(let end=0;end<2;end++)for(let i=0;i<sides;i++) {
    const angle=i*Math.PI*2/sides,r=radius*(end?.62:1),point=(end?b:a).clone();
    if(end&&foot)point.add(new THREE.Vector3(Math.cos(angle)*r,0,Math.sin(angle)*r));
    else point.addScaledVector(u,Math.cos(angle)*r).addScaledVector(v,Math.sin(angle)*r);
    positions.push(...point.toArray());
  }
  positions.push(...a.toArray(),...b.toArray());
  for(let i=0;i<sides;i++){const j=(i+1)%sides;indices.push(i,j,6+j,i,6+j,6+i,12,j,i,13,6+i,6+j);}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(28),2));geometry.setIndex(indices);geometry.computeVertexNormals();
  const mesh=new THREE.Mesh(geometry,mat);parent.add(mesh);return mesh;
}
function grasshopper(root) {
  const green=material('#70864a'),straw=material('#b09a60'),dark=material('#383e28');
  ellipsoid(root,[0,-.002,-.040],[.013,.015,.090],green,12);
  ellipsoid(root,[0,.002,.040],[.017,.020,.050],green,10);
  const head=new THREE.Mesh(new THREE.ConeGeometry(.015,.055,6),green);
  head.rotation.x=Math.PI/2;head.position.set(0,.002,.1025);root.add(head);
  for(const side of [-1,1]){
    ellipsoid(root,[side*.011,.008,.096],[.004,.006,.008],dark,6);
    thread(root,[[side*.007,.011,.118],[side*.018,.025,.180],[side*.027,.033,.230]],'#78764d',1);
    // Closed, tapered forewings sit along the abdomen rather than flapping.
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([
      side*.002,.022,.050,side*.014,.013,.020,side*.008,.006,-.125,side*.001,.014,-.108
    ],3));g.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,1,1,0,1],2));
    g.setIndex(side===1?[0,1,2,0,2,3]:[0,2,1,0,3,2]);g.computeVertexNormals();root.add(new THREE.Mesh(g,straw));
    for(const [hip,knee,foot]of [
      [[side*.012,0,.050],[side*.027,-.020,.060],[side*.040,-.045,.075]],
      [[side*.013,-.001,.005],[side*.035,-.022,-.005],[side*.055,-.045,.005]]
    ]){grasshopperLimb(root,hip,knee,.0027,green);grasshopperLimb(root,knee,foot,.0018,dark,true);}
  }
  const hindLegs=[];
  for(const side of [-1,1]){
    const hip=new THREE.Vector3(side*.018,-.002,-.045),knee=new THREE.Vector3(side*.055,.010,.050),foot=new THREE.Vector3(side*.070,-.045,-.090);
    const thigh=new THREE.Group();thigh.position.copy(hip);root.add(thigh);
    const kneeOffset=knee.clone().sub(hip),shin=new THREE.Group();shin.position.copy(kneeOffset);thigh.add(shin);
    grasshopperLimb(thigh,[0,0,0],kneeOffset.toArray(),.0065,green);
    grasshopperLimb(shin,[0,0,0],foot.clone().sub(knee).toArray(),.0025,straw,true);
    hindLegs.push({thigh,shin,foot:foot.clone().sub(knee)});
  }
  root.userData.hindLegs=hindLegs;
  // Reused math scratch: model updates create neither meshes nor temporary vectors.
  root.userData.pose={normal:new THREE.Vector3(0,1,0),forward:new THREE.Vector3(),right:new THREE.Vector3(),matrix:new THREE.Matrix4(),rest:new THREE.Quaternion(),upright:new THREE.Quaternion(),up:new THREE.Vector3(0,1,0)};
}

// Original, deliberately simplified male Hercules display form. These curves
// do not claim a measured regional horn profile or exact anatomical tooth count.
function herculesShellTexture() {
  if(cache.herculesShell)return cache.herculesShell;
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const c=canvas.getContext('2d');
  c.fillStyle='#9c9c57';c.fillRect(0,0,256,256);let seed=714;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<48;i++){c.fillStyle=i%3?'#494834':'#64623d';c.beginPath();c.ellipse(random()*256,random()*256,2+random()*10,2+random()*7,random()*Math.PI,0,Math.PI*2);c.fill();}
  c.strokeStyle='rgba(212,210,148,.24)';c.lineWidth=1;for(let i=0;i<16;i++){c.beginPath();c.moveTo(i*17,0);c.lineTo(i*17+7,256);c.stroke();}
  const map=new THREE.CanvasTexture(canvas);map.encoding=THREE.sRGBEncoding;map.name='hercules-original-olive-spots';cache.herculesShell=map;return map;
}
function herculesHorn(root, points, radius, mat) {
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),geometry=new THREE.TubeGeometry(curve,10,radius,6,false);
  const p=geometry.attributes.position;
  for(let ring=0;ring<=10;ring++){
    const centre=curve.getPointAt(ring/10),taper=Math.pow(1-ring/10,.7);
    for(let side=0;side<=6;side++){const i=ring*7+side;p.setXYZ(i,centre.x+(p.getX(i)-centre.x)*taper,centre.y+(p.getY(i)-centre.y)*taper,centre.z+(p.getZ(i)-centre.z)*taper);}
  }
  geometry.computeVertexNormals();const horn=new THREE.Mesh(geometry,mat);root.add(horn);
}
function herculesLeg(root,side,index,mat) {
  const hip=new THREE.Vector3(side*(index===2?.035:.040),-.005,[.055,-.005,-.060][index]),foot=new THREE.Vector3(side*.105,-.060,[.075,-.005,-.085][index]);
  const knee=new THREE.Vector3(),u=new THREE.Vector3(),v=new THREE.Vector3(),axis=new THREE.Vector3();
  const geometry=new THREE.BufferGeometry(),positions=new Float32Array(84),indices=[];
  // Two six-sided segments in one mesh; terminal rings stay horizontal.
  for(let bone=0;bone<2;bone++)for(let j=0;j<6;j++){const b=bone*14,k=(j+1)%6;indices.push(b+j,b+k,b+6+k,b+j,b+6+k,b+6+j,b+12,b+k,b+j,b+13,b+6+j,b+6+k);}
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setIndex(indices);
  const mesh=new THREE.Mesh(geometry,mat);mesh.name=`hercules-leg-${side}-${index}`;root.add(mesh);
  return{side,index,hip,knee,foot,u,v,axis,geometry,mesh,anchor:new THREE.Vector3(),swingStart:new THREE.Vector3(),worldFoot:new THREE.Vector3(),target:new THREE.Vector3(),wasSwing:false,baseZ:foot.z,offset:(side===-1&&index!==1)||(side===1&&index===1)?0:.5};
}
function updateHerculesLeg(leg) {
  const {hip,knee,foot,side,index,axis,u,v,geometry}=leg;
  knee.set(hip.x+(foot.x-hip.x)*.67+side*.008,-.018,(hip.z+foot.z)*.5+(index===0?.012:index===2?-.010:0));
  const p=geometry.attributes.position;
  for(let bone=0;bone<2;bone++){
    const a=bone?knee:hip,b=bone?foot:knee,radius=bone?.0032:.005;axis.subVectors(b,a).normalize();u.set(1,0,0).addScaledVector(axis,-axis.x).normalize();v.crossVectors(axis,u);
    for(let end=0;end<2;end++)for(let j=0;j<6;j++){
      const angle=j*Math.PI/3,r=radius*(end?.62:1),c=Math.cos(angle)*r,s=Math.sin(angle)*r,origin=end?b:a,i=bone*14+end*6+j;
      if(bone&&end)p.setXYZ(i,origin.x+c,origin.y,origin.z+s);
      else p.setXYZ(i,origin.x+u.x*c+v.x*s,origin.y+u.y*c+v.y*s,origin.z+u.z*c+v.z*s);
    }
    p.setXYZ(bone*14+12,a.x,a.y,a.z);p.setXYZ(bone*14+13,b.x,b.y,b.z);
  }
  p.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere();
}
function hercules(root) {
  const black=material('#252923',{roughness:.38}),shell=material('#d4cf98',{map:herculesShellTexture(),roughness:.44}),legMat=material('#4c4b35',{roughness:.68});
  ellipsoid(root,[0,-.006,-.035],[.046,.024,.074],black,12);
  ellipsoid(root,[0,.004,.039],[.045,.031,.047],black,12);
  ellipsoid(root,[0,-.001,.089],[.028,.022,.021],black,12);
  for(const side of [-1,1]){
    ellipsoid(root,[side*.023,.010,-.042],[.028,.031,.068],shell,12);
    ellipsoid(root,[side*.026,.005,.084],[.005,.006,.006],legMat,6);
    thread(root,[[side*.017,.002,.098],[side*.028,-.003,.115],[side*.035,.002,.110]],'#656247',1);
  }
  root.updateMatrixWorld(true);const bodyBounds=new THREE.Box3();
  root.traverse(o=>{if(o.isMesh)bodyBounds.union(new THREE.Box3().setFromObject(o));});root.userData.bodyBounds=bodyBounds;
  herculesHorn(root,[[0,.055,.030],[0,.080,.135],[0,.063,.237],[0,.035,.310]],.013,black);
  herculesHorn(root,[[0,.016,.095],[0,.015,.160],[0,.027,.223],[0,.041,.265]],.009,black);
  const legs=[];
  // A group keeps each deformable leg out of the rigid-body material batching.
  const rig=new THREE.Group();root.add(rig);
  for(const side of [-1,1])for(let index=0;index<3;index++){const leg=herculesLeg(rig,side,index,legMat);legs.push(leg);updateHerculesLeg(leg);}
  root.userData.legs=legs;
  root.userData.gait={ready:false,position:new THREE.Vector3(),rotation:new THREE.Quaternion(),inverse:new THREE.Quaternion(),cycle:0,legs};
}

// Batch rigid body parts by their shared material. Wing pivots remain independent.
// This keeps all the leg/eye detail without a draw call for every tiny segment.
function batchBody(root) {
  const buckets = new Map();
  for (const child of [...root.children]) {
    if (!child.isMesh || Array.isArray(child.material)) continue;
    if (!buckets.has(child.material)) buckets.set(child.material, []);
    buckets.get(child.material).push(child);
  }
  for (const [mat, parts] of buckets) {
    if (parts.length < 2) continue;
    const arrays = { position: [], normal: [], uv: [] };
    for (const part of parts) {
      part.updateMatrix();
      const geom = part.geometry.index ? part.geometry.toNonIndexed() : part.geometry.clone();
      geom.applyMatrix4(part.matrix);
      for (const name of Object.keys(arrays)) {
        const attr = geom.getAttribute(name);
        if (attr) arrays[name].push(attr.array);
      }
      geom.dispose(); root.remove(part); part.geometry.dispose();
    }
    const merged = new THREE.BufferGeometry();
    for (const [name, chunks] of Object.entries(arrays)) {
      const values = new Float32Array(chunks.reduce((sum, a) => sum + a.length, 0));
      let offset = 0; for (const a of chunks) { values.set(a, offset); offset += a.length; }
      merged.setAttribute(name, new THREE.BufferAttribute(values, name === 'uv' ? 2 : 3));
    }
    merged.computeBoundingSphere();
    root.add(new THREE.Mesh(merged, mat));
  }
}

export function createInsectModel(species, { inspection = false } = {}) {
  const group=new THREE.Group();group.name=`${species}-${inspection?'inspection':'field'}`;
  const visual=new THREE.Group();group.add(visual);
  (species==='hercules'?hercules:species==='grasshopper'?grasshopper:species==='morpho'?morpho:species==='dragonfly'?dragonfly:species==='cicada'?cicada:butterfly)(visual,!inspection);
  batchBody(visual);
  // Field readability only: inspection framing and the simulation capture centre stay unchanged.
  if (!inspection) visual.scale.setScalar(FIELD_VISUAL_SCALE[species] ?? 1);
  group.userData.species=species;group.userData.inspection=inspection;group.userData.visual=visual;
  group.userData.wings=visual.userData.wings;
  if(species==='hercules')group.userData.herculesGait=visual.userData.gait;
  // Perched cicadas climb with the head upwards, dorsal wing surface facing out.
  if(species==='cicada'&&!inspection) visual.rotation.x=-Math.PI/2;
  group.traverse(child=>{if(child.isMesh){child.castShadow=false;child.receiveShadow=false;}});
  return group;
}

export function updateInsectModel(group, item, time = 0, support = null) {
  const inspection=group.userData.inspection;
  const species=group.userData.species;
  if(!inspection) {
    group.visible=!item.caught;
    group.position.set(item.x,item.y,item.z);
    group.rotation.y=item.heading||0;
  }
  const visual=group.userData.visual;
  if(species==='hercules') {
    const phase=inspection?0:(Number.isFinite(item.walkPhase)?item.walkPhase:0),turning=!inspection&&!item.caught&&item.state==='turning';
    const progress=turning?Math.min(1,Math.max(0,item.turnProgress||0)):0,cycle=phase/(Math.PI*2)+(turning?progress*6:0);
    const gait=group.userData.herculesGait;
    // Per-model rendering anchors, never simulation state. Teleports, capture,
    // or discontinuous test poses reset safely instead of stretching a leg.
    const cycleDelta=cycle-gait.cycle,phaseDelta=cycleDelta-Math.round(cycleDelta);
    const reset=inspection||!gait.ready||item.caught||gait.position.distanceToSquared(group.position)>.0025||gait.rotation.angleTo(group.quaternion)>.25||Math.abs(phaseDelta)>.4;
    gait.inverse.copy(group.quaternion).invert();
    for(const leg of visual.userData.legs){
      const q=((cycle+leg.offset)%1+1)%1,swing=q>.6?(q-.6)/.4:0,isSwing=q>.6;
      const baseQ=((phase/(Math.PI*2)+leg.offset)%1+1)%1,baseSwing=baseQ>.6?(baseQ-.6)/.4:0;
      const stride=baseQ<=.6?.015-.05*baseQ:-.015+.03*baseSwing*baseSwing*(3-2*baseSwing);
      // Swing targets tuck inward 6mm during turns; planted feet never slide.
      leg.target.set(leg.side*(turning?.099:.105),-.06,leg.baseZ+(turning?stride:isSwing?.015:stride));
      leg.target.applyQuaternion(group.quaternion).add(group.position);
      if(reset){
        leg.foot.set(leg.side*.105,-.06+.012*Math.sin(Math.PI*swing)**2,leg.baseZ+stride);
        leg.worldFoot.copy(leg.foot).applyQuaternion(group.quaternion).add(group.position);
        leg.anchor.copy(leg.worldFoot);leg.anchor.y=group.position.y-.06;leg.swingStart.copy(leg.anchor);
      } else if(isSwing){
        if(!leg.wasSwing)leg.swingStart.copy(leg.worldFoot);
        const blend=swing*swing*(3-2*swing);
        leg.worldFoot.copy(leg.swingStart).lerp(leg.target,blend);leg.worldFoot.y=group.position.y-.06+.012*Math.sin(Math.PI*swing)**2;
        leg.foot.copy(leg.worldFoot).sub(group.position).applyQuaternion(gait.inverse);
      } else {
        if(leg.wasSwing)leg.anchor.copy(leg.target);
        leg.worldFoot.copy(leg.anchor);leg.foot.copy(leg.worldFoot).sub(group.position).applyQuaternion(gait.inverse);
      }
      leg.wasSwing=isSwing;updateHerculesLeg(leg);
    }
    gait.ready=!inspection&&!item.caught;gait.position.copy(group.position);gait.rotation.copy(group.quaternion);gait.cycle=cycle;
    return;
  }
  if(species==='grasshopper') {
    const p=!inspection&&item.airborne&&!item.caught?Math.min(1,Math.max(0,item.jumpProgress||0)):0;
    // Rapid extension followed by a gradual fold; endpoint poses are identical.
    const kick=p>0&&p<1?Math.sin(Math.PI*p)*(1-.35*p):0;
    for(const {thigh,shin}of visual.userData.hindLegs){thigh.rotation.x=kick*.85;shin.rotation.x=-kick*1.2;}
    visual.position.set(0,0,0);visual.rotation.set(0,0,0);
    if(!inspection){
      const pose=visual.userData.pose,heading=item.heading||0,n=support?.normal;
      pose.upright.setFromAxisAngle(pose.up,heading);pose.rest.copy(pose.upright);
      if(n&&Number.isFinite(n.x)&&Number.isFinite(n.y)&&Number.isFinite(n.z)&&n.y>0)pose.normal.set(n.x,n.y,n.z).normalize();
      else if(!item.airborne)pose.normal.set(0,1,0);
      {
        pose.forward.set(Math.sin(heading),0,Math.cos(heading));
        pose.forward.addScaledVector(pose.normal,-pose.forward.dot(pose.normal));
        if(pose.forward.lengthSq()>1e-10){pose.forward.normalize();pose.right.crossVectors(pose.normal,pose.forward).normalize();pose.matrix.makeBasis(pose.right,pose.normal,pose.forward);pose.rest.setFromRotationMatrix(pose.matrix);}
      }
      const ramp=Math.min(1,p/.15,(1-p)/.20),air=p>0?ramp*ramp*(3-2*ramp):0;
      group.quaternion.copy(pose.rest).slerp(pose.upright,air);
    }
    return;
  }
  const phase=Number.isFinite(item.wingPhase)?item.wingPhase:time*12;
  const flight=inspection?0:(item.flightBlend||0);
  if(species==='morpho'&&!inspection) {
    // Render-only feeding detail, allocated lazily so the ordinary model and
    // inspection keep their original geometry. No new simulation state lives here.
    const feeding=item.state==='feeding'&&!item.caught&&item.resting===true&&flight<.01;
    let proboscis=group.userData.proboscis;
    if(feeding&&!proboscis) {
      const curve=new THREE.CatmullRomCurve3([
        new THREE.Vector3(0,-.003,.078),new THREE.Vector3(0,-.008,.097),
        new THREE.Vector3(0,-.018,.116),new THREE.Vector3(0,-.01875,.13)
      ]);
      proboscis=new THREE.Mesh(new THREE.TubeGeometry(curve,8,.0012,4,false),material('#5b4830',{roughness:.84}));
      proboscis.name='morpho-feeding-proboscis';
      // Tip meets the fruit at table top +10mm; feet stay at body Y-28.75mm.
      visual.add(proboscis);group.userData.proboscis=proboscis;
    }
    if(proboscis)proboscis.visible=feeding;
  }
  const wings=group.userData.wings||[];
  for(const pivot of wings) {
    const side=pivot.userData.side;
    if(species==='morpho') {
      const restAngle=1.30+Math.sin(time*1.1+(item.phase||0))*.07;
      const flap=.10+Math.sin(phase+(pivot.userData.back?.22:0))*1.15;
      const inspectionAngle=.55+Math.sin(time*.7)*.12;
      pivot.rotation.z=side*(inspection?inspectionAngle:restAngle*(1-flight)+flap*flight);
    } else if(species==='butterfly') {
      const restAngle=.60+Math.sin(time*2+(item.phase||0))*.18;
      const flightAngle=.2+Math.sin(phase)*.82;
      const angle=inspection?.12+Math.sin(time*1.4)*.06:restAngle*(1-flight)+flightAngle*flight;
      pivot.rotation.z=side*angle;
    } else if(species==='dragonfly') {
      const restAngle=.16+Math.sin(time*2.2+(item.phase||0)+(pivot.userData.back?.5:0))*.035;
      const flightAngle=Math.sin(phase+(pivot.userData.back?1.2:0))*.238;
      pivot.rotation.z=side*(inspection?Math.sin(time*1.1)*.015:restAngle*(1-flight)+flightAngle*flight);
      // A fixed, shallow opposite incidence on fore/hind wings avoids four
      // edge-on planes from the front. This is display geometry, not steering.
      if (!inspection) pivot.rotation.x=(pivot.userData.back?-.18:.18)*(1-flight);
    } else {
      const restMotion=Math.sin(time*1.7+(item.phase||0))*.028;
      pivot.rotation.z=-side*(.32+(inspection?Math.sin(time)*.018:restMotion*(1-flight)+flight*.2*Math.sin(phase)));
      if(pivot.userData.wingType==='hindwing')pivot.rotation.y=inspection?0:-side*.55*flight;
    }
  }
  if(!inspection&&species==='cicada') {
    // Without an actual bark anchor, preserve the original pose exactly. The
    // simulation/root centre never moves; only the resting model meets bark.
    visual.position.set(0,0,0);
    visual.rotation.set(-Math.PI/2*(1-flight),0,0);
    const contact=1-Math.min(1,Math.max(0,flight));
    const finite=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&Number.isFinite(p.z);
    if(contact>0&&support?.kind==='bark'&&finite(support.point)&&finite(support.normal)&&finite(item.home)) {
      const normal=new THREE.Vector3(support.normal.x,support.normal.y,support.normal.z);
      if(normal.lengthSq()>1e-10) {
        normal.normalize();
        const up=new THREE.Vector3(0,1,0).addScaledVector(normal,-normal.y);
        if(up.lengthSq()>1e-10) {
          up.normalize();
          const right=normal.clone().cross(up).normalize();
          const restWorld=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(right,normal,up));
          const inverseHeading=group.quaternion.clone().invert();
          // Cicada leg endpoints share local Y=-.025*1.6; scale is unchanged.
          const offset=new THREE.Vector3(support.point.x-item.home.x,support.point.y-item.home.y,support.point.z-item.home.z)
            .addScaledVector(normal,.04*visual.scale.y);
          visual.position.copy(offset.applyQuaternion(inverseHeading).multiplyScalar(contact));
          visual.quaternion.copy(inverseHeading.multiply(restWorld)).slerp(new THREE.Quaternion(),1-contact);
        }
      }
    }
  }
  if(!inspection&&species!=='cicada') visual.rotation.x=Math.sin(time*2+(item.phase||0))*.035*flight;
}
