/** Original procedural insect art. Rendering state only; no simulation mutates here. */
const THREE = window.THREE;
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
    wing(pivot,[[0,0],[.037,-.016],[.058,-.067],[.052,-.126],[.037,-.157],[.021,-.16],[.008,-.13],[0,-.06]],wings,field?'cicada':null);
    pivots.push(pivot);
  }
  legs(root,dark,1.6);root.userData.wings=pivots;
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
  (species==='dragonfly'?dragonfly:species==='cicada'?cicada:butterfly)(visual,!inspection);
  batchBody(visual);
  // Field readability only: inspection framing and the simulation capture centre stay unchanged.
  if (!inspection) visual.scale.setScalar(species==='butterfly'?1.6:species==='dragonfly'?1.65:1.8);
  group.userData.species=species;group.userData.inspection=inspection;group.userData.visual=visual;
  group.userData.wings=visual.userData.wings;
  // Perched cicadas climb with the head upwards, dorsal wing surface facing out.
  if(species==='cicada'&&!inspection) visual.rotation.x=-Math.PI/2;
  group.traverse(child=>{if(child.isMesh){child.castShadow=false;child.receiveShadow=false;}});
  return group;
}

export function updateInsectModel(group, item, time = 0) {
  const inspection=group.userData.inspection;
  const species=group.userData.species;
  if(!inspection) {
    group.visible=!item.caught;
    group.position.set(item.x,item.y,item.z);
    group.rotation.y=item.heading||0;
  }
  const visual=group.userData.visual;
  const phase=Number.isFinite(item.wingPhase)?item.wingPhase:time*12;
  const flight=inspection?0:(item.flightBlend||0);
  const wings=group.userData.wings||[];
  for(const pivot of wings) {
    const side=pivot.userData.side;
    if(species==='butterfly') {
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
    }
  }
  if(!inspection&&species==='cicada') visual.rotation.x=-Math.PI/2*(1-flight);
  if(!inspection&&species!=='cicada') visual.rotation.x=Math.sin(time*2+(item.phase||0))*.035*flight;
}
