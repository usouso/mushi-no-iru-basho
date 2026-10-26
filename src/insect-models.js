import {createManticoraModel,updateManticoraModel} from './manticora-model.js?v=0.37.0&b=4d59dc9955d7';
import {createEuchirusModel,updateEuchirusModel} from './euchirus-model.js?v=0.37.0&b=4d59dc9955d7';
import {createMiyamaModel,updateMiyamaModel} from './miyama-model.js?v=0.37.0&b=4d59dc9955d7';
import {createFiveHornModel,updateFiveHornModel} from './five-horn-model.js?v=0.37.0&b=4d59dc9955d7';
import {createGoliathModel,updateGoliathModel} from './goliath-model.js?v=0.37.0&b=4d59dc9955d7';
import {createElephantModel,updateElephantModel} from './elephant-model.js?v=0.37.0&b=4d59dc9955d7';
import {createGiantStagModel,updateGiantStagModel} from './giant-stag-model.js?v=0.37.0&b=4d59dc9955d7';
import {createAtlasModel,updateAtlasModel} from './atlas-model.js?v=0.37.0&b=4d59dc9955d7';
import {createLonghornModel,updateLonghornModel} from './longhorn-model.js?v=0.37.0&b=4d59dc9955d7';
import {createMetalliferModel,updateMetalliferModel} from './metallifer-model.js?v=0.37.0&b=4d59dc9955d7';
import {createJewelModel,updateJewelModel} from './jewel-model.js?v=0.37.0&b=4d59dc9955d7';
import {createSwallowtailModel,updateSwallowtailModel} from './swallowtail-model.js?v=0.37.0&b=4d59dc9955d7';
import {createBeeModel,updateBeeModel} from './bee-model.js?v=0.37.0&b=4d59dc9955d7';
import {createStagModel,updateStagModel} from './stag-model.js?v=0.37.0&b=4d59dc9955d7';
import {createRhinoModel,updateRhinoModel} from './rhino-model.js?v=0.37.0&b=4d59dc9955d7';
import {createRhinoFlightModel,updateRhinoFlightModel} from './rhino-flight-rig.js?v=0.37.0&b=4d59dc9955d7';
import {createLadybirdModel,updateLadybirdModel} from './ladybird-model.js?v=0.37.0&b=4d59dc9955d7';
import {createMantisModel,updateMantisModel} from './mantis-model.js?v=0.37.0&b=4d59dc9955d7';
import {createDivingModel,updateDivingModel} from './diving-model.js?v=0.37.0&b=4d59dc9955d7';
import {createDungBeetleModel,updateDungBeetleModel} from './dung-model.js?v=0.37.0&b=4d59dc9955d7';
import {createStriderPose,sampleStriderPose} from './strider-kinematics.js?v=0.37.0&b=4d59dc9955d7';
import {applyInsectReadability} from './insect-readability.js?v=0.37.0&b=4d59dc9955d7';
/** Original procedural insect art. Rendering state only; no simulation mutates here. */
const THREE = window.THREE;
// Initial prototype display dimensions; inspection keeps its independent framing.
export const FIELD_VISUAL_SCALE = Object.freeze({ butterfly: 1, dragonfly: 1, cicada: 1, morpho: 1, grasshopper: 1, hercules: 1, leafinsect: 1, waterstrider: 1, leafcutterant: 1, firefly: 1 });
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
  // Hind legs originate on the thorax, not beside the narrow abdomen.
  const legScale=.85;
  for(const side of [-1,1]) for(let n=0;n<3;n++) {
    const z=(.035-n*.026)*legScale;
    const hip=n===2?[side*.008,-.004,.004]:[side*.012*legScale,0,z];
    segment(root,hip,[side*.032*legScale,-.02*legScale,z-.012*legScale],.0015*legScale,dark);
    segment(root,[side*.032*legScale,-.02*legScale,z-.012*legScale],[side*.048*legScale,-.025*legScale,z+.006*legScale],.0011*legScale,dark);
  }
  root.userData.wings=pivots;
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
  geometry.computeVertexNormals();const horn=new THREE.Mesh(geometry,mat);root.add(horn);return horn;
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
  for(const part of root.children)if(part.isMesh)part.userData.battleRole='torso';
  const thoraxHorn=herculesHorn(root,[[0,.055,.030],[0,.080,.135],[0,.063,.237],[0,.035,.310]],.013,black);thoraxHorn.userData.battleRole='thorax-horn';
  const headHorn=herculesHorn(root,[[0,.016,.095],[0,.015,.160],[0,.027,.223],[0,.041,.265]],.009,black);headHorn.userData.battleRole='head-horn';
  const legs=[];
  // A group keeps each deformable leg out of the rigid-body material batching.
  const rig=new THREE.Group();root.add(rig);
  for(const side of [-1,1])for(let index=0;index<3;index++){const leg=herculesLeg(rig,side,index,legMat);legs.push(leg);updateHerculesLeg(leg);}
  root.userData.legs=legs;
  root.userData.gait={ready:false,position:new THREE.Vector3(),rotation:new THREE.Quaternion(),inverse:new THREE.Quaternion(),cycle:0,legs};
}

// Original adult-female leaf-insect study. Display dimensions and gait timing
// are prototype choices, not a measured specimen or traced reference image.
function leafInsectTexture() {
  if(cache.leafInsect)return cache.leafInsect;
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const c=canvas.getContext('2d');
  c.fillStyle='#83944e';c.fillRect(0,0,256,256);
  c.strokeStyle='#536c39';c.lineWidth=3;c.beginPath();c.moveTo(128,0);c.lineTo(128,256);c.stroke();
  c.lineWidth=1.5;c.strokeStyle='rgba(62,88,41,.58)';
  for(let n=0;n<9;n++)for(const side of [-1,1]){const y=20+n*25;c.beginPath();c.moveTo(128,y+22);c.quadraticCurveTo(128+side*44,y+2,128+side*123,y-16);c.stroke();}
  let seed=803;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let n=0;n<300;n++){c.fillStyle=`rgba(196,202,126,${.04+random()*.10})`;c.fillRect(random()*256,random()*256,1+random()*3,1+random()*3);}
  c.fillStyle='rgba(128,99,54,.64)';for(const[x,y,rx,ry]of [[15,61,19,9],[238,149,22,12],[37,222,13,8],[224,35,12,7]]){c.beginPath();c.ellipse(x,y,rx,ry,.3,0,Math.PI*2);c.fill();}
  const map=new THREE.CanvasTexture(canvas);map.name='leaf-insect-original-veins';map.encoding=THREE.sRGBEncoding;cache.leafInsect=map;return map;
}
function leafInsectPlate(parent, outline, mat, y=0) {
  let area=0;for(let i=0;i<outline.length;i++){const a=outline[i],b=outline[(i+1)%outline.length];area+=a[0]*b[1]-b[0]*a[1];}if(area<0)outline=[...outline].reverse();
  const positions=[],uv=[],indices=[],count=outline.length,centreX=outline.reduce((sum,p)=>sum+p[0],0)/count,centreZ=outline.reduce((sum,p)=>sum+p[1],0)/count;
  // A shallow, closed lens instead of a zero-thickness billboard.
  for(const level of [1,-1])for(const[x,z]of outline){positions.push(x,y+level*.0015,z);uv.push((x+.09)/.18,(z+.15)/.30);}
  positions.push(centreX,y+.010,centreZ,centreX,y-.006,centreZ);uv.push((centreX+.09)/.18,(centreZ+.15)/.30,(centreX+.09)/.18,(centreZ+.15)/.30);
  for(let i=0;i<count;i++){const j=(i+1)%count;indices.push(count*2,j,i,count*2+1,count+i,count+j,i,j,count+j,i,count+j,count+i);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();
  const mesh=new THREE.Mesh(g,mat);parent.add(mesh);return mesh;
}
function leafInsectLeg(parent,side,index,mat) {
  const baseHip=new THREE.Vector3(side*.045,-.008,[.070,0,-.075][index]),foot=new THREE.Vector3(side*.12,0,[.075,0,-.075][index]);
  const g=new THREE.BufferGeometry(),indices=[];g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(120),3));
  for(let bone=0;bone<2;bone++){
    const base=bone*20;for(let ring=0;ring<2;ring++)for(let j=0;j<6;j++){const k=(j+1)%6,a=base+ring*6;indices.push(a+j,a+k,a+6+k,a+j,a+6+k,a+6+j);}
    for(let j=0;j<6;j++){const k=(j+1)%6;indices.push(base+18,base+k,base+j,base+19,base+12+j,base+12+k);}
  }
  g.setIndex(indices);const mesh=new THREE.Mesh(g,mat);mesh.name=`leaf-insect-leg-${side}-${index}`;parent.add(mesh);
  return{side,index,baseHip,hip:new THREE.Vector3(),knee:new THREE.Vector3(),foot,baseZ:foot.z,mesh,geometry:g,axis:new THREE.Vector3(),u:new THREE.Vector3(),v:new THREE.Vector3(),anchor:new THREE.Vector3(),swingStart:new THREE.Vector3(),worldFoot:new THREE.Vector3(),target:new THREE.Vector3(),wasSwing:false,offset:(side===-1&&index!==1)||(side===1&&index===1)?0:.5};
}
function updateLeafInsectLeg(leg,body) {
  const {baseHip,hip,knee,foot,side,index,geometry,axis,u,v}=leg;
  hip.copy(baseHip).applyQuaternion(body.quaternion).add(body.position);
  knee.set(hip.x+(foot.x-hip.x)*.55+side*.009,.023+foot.y*.15,(hip.z+foot.z)*.5+(index===0?.005:index===2?-.005:0));
  const p=geometry.attributes.position;
  for(let bone=0;bone<2;bone++){
    const a=bone?knee:hip,b=bone?foot:knee;axis.subVectors(b,a).normalize();u.set(1,0,0).addScaledVector(axis,-axis.x).normalize();v.crossVectors(axis,u);
    for(let ring=0;ring<3;ring++)for(let j=0;j<6;j++){
      const t=ring/2,r=ring===1?(bone?.010:.013):(bone?.0017:.0025),angle=j*Math.PI/3,c=Math.cos(angle)*r,s=Math.sin(angle)*r*.25,i=bone*20+ring*6+j;
      const x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t,z=a.z+(b.z-a.z)*t;
      if(bone&&ring===2)p.setXYZ(i,x+c,y,z+Math.sin(angle)*r);
      else p.setXYZ(i,x+u.x*c+v.x*s,y+u.y*c+v.y*s,z+u.z*c+v.z*s);
    }
    p.setXYZ(bone*20+18,a.x,a.y,a.z);p.setXYZ(bone*20+19,b.x,b.y,b.z);
  }
  p.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere();
}
function leafInsect(root) {
  const green=material('#7f9250',{roughness:.88}),leaf=material('#d0d4a0',{map:leafInsectTexture(),roughness:.9,side:THREE.DoubleSide}),dark=material('#39452a',{roughness:.55});
  const body=new THREE.Group();body.name='leaf-insect-sway-body';body.position.y=.045;root.add(body);
  const abdomen=[[-.020,.080],[-.053,.052],[-.079,.016],[-.074,-.003],[-.090,-.035],[-.082,-.078],[-.058,-.116],[0,-.150],[.053,-.121],[.079,-.083],[.090,-.035],[.081,-.008],[.074,.020],[.052,.056],[.018,.080]];
  leafInsectPlate(body,abdomen,leaf);
  ellipsoid(body,[0,-.002,-.028],[.033,.010,.102],green,10);
  ellipsoid(body,[0,.002,.091],[.021,.013,.024],green,10);
  ellipsoid(body,[0,.003,.131],[.018,.013,.019],green,12);
  const fore=new THREE.Group();fore.name='leaf-insect-closed-forewings';body.add(fore);
  for(const side of [-1,1]){
    const outline=[[.002,.072],[.028,.061],[.057,.020],[.064,-.033],[.043,-.092],[.010,-.119]].map(([x,z])=>[x*side,z]);if(side===-1)outline.reverse();
    leafInsectPlate(fore,outline,leaf,.009);
    ellipsoid(body,[side*.014,.007,.137],[.0035,.004,.0045],dark,6);
    thread(body,[[side*.006,.008,.144],[side*.014,.017,.164],[side*.017,.018,.173]],'#6d7941',1);
  }
  // Keep the two closed forewing components as a single rigid mesh, no flap API.
  batchBody(fore);fore.children[0].name='leaf-insect-closed-forewing-pair';batchBody(body);
  const rig=new THREE.Group();root.add(rig);const legs=[];
  for(const side of [-1,1])for(let index=0;index<3;index++){const leg=leafInsectLeg(rig,side,index,green);legs.push(leg);updateLeafInsectLeg(leg,body);}
  root.userData.leafBody=body;root.userData.legs=legs;
  root.userData.gait={ready:false,position:new THREE.Vector3(),rotation:new THREE.Quaternion(),inverse:new THREE.Quaternion(),cycle:0,legs};
}
// Treat accumulated whole cycles as touchdown, not a rounding-error swing at q≈1.
function leafCyclePhase(value) {const q=((value%1)+1)%1;return q<1e-9||q>1-1e-9?0:q;}
function updateLeafInsect(group,item,inspection) {
  const visual=group.userData.visual,body=visual.userData.leafBody,gait=group.userData.leafGait;
  body.rotation.z=inspection||item.caught?0:Math.min(.045,Math.max(-.045,Number.isFinite(item.leafSway)?item.leafSway:0));
  const phase=inspection?0:(Number.isFinite(item.walkPhase)?item.walkPhase:0),turning=!inspection&&!item.caught&&item.state==='turning',progress=turning?Math.min(1,Math.max(0,item.turnProgress||0)):0,cycle=phase/(Math.PI*2)+(turning?progress*6:0);
  const delta=cycle-gait.cycle,reset=inspection||!gait.ready||item.caught||gait.position.distanceToSquared(group.position)>.0025||gait.rotation.angleTo(group.quaternion)>.25||Math.abs(delta-Math.round(delta))>.4;
  gait.inverse.copy(group.quaternion).invert();
  for(const leg of visual.userData.legs){
    const q=leafCyclePhase(cycle+leg.offset),isSwing=q>.6,swing=isSwing?(q-.6)/.4:0,baseQ=leafCyclePhase(phase/(Math.PI*2)+leg.offset),baseSwing=baseQ>.6?(baseQ-.6)/.4:0;
    const stride=baseQ<=.6?.012-.04*baseQ:-.012+.024*baseSwing*baseSwing*(3-2*baseSwing);
    leg.target.set(leg.side*(turning?.114:.12),0,leg.baseZ+(turning?stride:isSwing?.012:stride)).applyQuaternion(group.quaternion).add(group.position);
    if(reset){leg.foot.set(leg.side*.12,.008*Math.sin(Math.PI*swing)**2,leg.baseZ+stride);leg.worldFoot.copy(leg.foot).applyQuaternion(group.quaternion).add(group.position);leg.anchor.copy(leg.worldFoot);leg.anchor.y=group.position.y;leg.swingStart.copy(leg.anchor);}
    else if(isSwing){if(!leg.wasSwing)leg.swingStart.copy(leg.worldFoot);leg.worldFoot.copy(leg.swingStart).lerp(leg.target,swing*swing*(3-2*swing));leg.worldFoot.y=group.position.y+.008*Math.sin(Math.PI*swing)**2;leg.foot.copy(leg.worldFoot).sub(group.position).applyQuaternion(gait.inverse);}
    // Plant where the displayed swing ended; a moving turn target must not drag a grounded foot.
    else {if(leg.wasSwing){leg.anchor.copy(leg.worldFoot);leg.anchor.y=group.position.y;}leg.worldFoot.copy(leg.anchor);leg.foot.copy(leg.worldFoot).sub(group.position).applyQuaternion(gait.inverse);}
    leg.wasSwing=isSwing;updateLeafInsectLeg(leg,body);
  }
  gait.ready=!inspection&&!item.caught;gait.position.copy(group.position);gait.rotation.copy(group.quaternion);gait.cycle=cycle;
}

// Water support is not a ground stance: the feet intentionally slide laterally.
function striderLeg(parent,pose,mat){
  const mesh=grasshopperLimb(parent,[0,.02,0],[.1,0,0],.0015,mat,true);
  const g=new THREE.BufferGeometry(),indices=[];
  for(let bone=0;bone<2;bone++)for(const index of mesh.geometry.index.array)indices.push(index+bone*14);
  g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(84),3));g.setIndex(indices);mesh.geometry.dispose();mesh.geometry=g;mesh.name=`water-strider-${pose.role}-${pose.side}`;
  return{mesh,geometry:g,pose,axis:new THREE.Vector3(),u:new THREE.Vector3(),v:new THREE.Vector3()};
}
function updateStriderLeg(leg){
  const {pose,geometry,axis,u,v}=leg,p=geometry.attributes.position;
  for(let bone=0;bone<2;bone++){
    const a=bone?pose.knee:pose.hip,b=bone?pose.foot:pose.knee;
    axis.set(b.x-a.x,b.y-a.y,b.z-a.z).normalize();u.set(1,0,0).addScaledVector(axis,-axis.x).normalize();v.crossVectors(axis,u);
    for(let end=0;end<2;end++)for(let j=0;j<6;j++){
      const base=end?b:a,angle=j*Math.PI/3,r=(bone?.0012:.00165)*(end?.65:1),c=Math.cos(angle)*r,s=Math.sin(angle)*r;
      if(bone&&end)p.setXYZ(bone*14+end*6+j,base.x+c,base.y,base.z+s);
      else p.setXYZ(bone*14+end*6+j,base.x+u.x*c+v.x*s,base.y+u.y*c+v.y*s,base.z+u.z*c+v.z*s);
    }
    p.setXYZ(bone*14+12,a.x,a.y,a.z);p.setXYZ(bone*14+13,b.x,b.y,b.z);
  }p.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere();
}
function waterStrider(root){
  const dark=material('#262d29',{roughness:.5}),pale=material('#c3c4ab',{roughness:.77}),edge=material('#a39b58',{roughness:.75});
  const body=new THREE.Group();body.name='water-strider-body';root.add(body);
  ellipsoid(body,[0,.025,-.016],[.0085,.008,.034],dark,12);
  ellipsoid(body,[0,.027,.021],[.012,.009,.015],dark,12);
  ellipsoid(body,[0,.029,.041],[.008,.007,.009],dark,12);
  ellipsoid(body,[0,.020,-.006],[.008,.0035,.037],pale,10);
  for(const side of [-1,1]){
    segment(body,[side*.010,.030,.009],[side*.009,.033,.031],.0011,edge,5);
    ellipsoid(body,[side*.007,.032,.042],[.003,.0035,.0038],dark,6);
    thread(body,[[side*.004,.031,.047],[side*.013,.036,.062],[side*.020,.035,.074]],'#6c7052',1);
  }
  batchBody(body);const rig=new THREE.Group();rig.name='water-strider-six-leg-rig';root.add(rig);
  const pose=sampleStriderPose({state:'resting'},createStriderPose()),legs=pose.legs.map(p=>striderLeg(rig,p,dark));
  root.userData.strider={pose,legs,inspectionPose:{state:'resting',strokePhase:0}};legs.forEach(updateStriderLeg);
}
function updateWaterStrider(group,item,inspection){
  const data=group.userData.visual.userData.strider;sampleStriderPose(inspection?data.inspectionPose:item,data.pose);for(const leg of data.legs)updateStriderLeg(leg);
}

// Original Atta forager study. Display dimensions are not specimen dimensions.
function antLeafTexture(){
  if(cache.antLeaf)return cache.antLeaf;const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const c=canvas.getContext('2d');c.fillStyle='#80964c';c.fillRect(0,0,128,128);c.strokeStyle='#536f39';c.lineWidth=2;c.beginPath();c.moveTo(64,128);c.lineTo(64,0);c.stroke();for(let i=1;i<7;i++){const y=i*18;for(const side of [-1,1]){c.beginPath();c.moveTo(64,y+18);c.lineTo(64+side*48,y-5);c.stroke();}}const map=new THREE.CanvasTexture(canvas);map.encoding=THREE.sRGBEncoding;map.name='ant-original-leaf-veins';cache.antLeaf=map;return map;
}
function antLimb(root,side,index,mat){
  const hip=new THREE.Vector3(side*.008,.017,[.014,.003,-.009][index]),foot=new THREE.Vector3(side*.040,0,[.030,0,-.032][index]),geometry=new THREE.BufferGeometry(),indices=[];
  for(let bone=0;bone<2;bone++)for(let j=0;j<6;j++){const b=bone*14,k=(j+1)%6;indices.push(b+j,b+k,b+6+k,b+j,b+6+k,b+6+j,b+12,b+k,b+j,b+13,b+6+j,b+6+k);}
  geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(84),3));geometry.setIndex(indices);const mesh=new THREE.Mesh(geometry,mat);mesh.name=`ant-leg-${side}-${index}`;root.add(mesh);
  return{side,index,hip,foot,knee:new THREE.Vector3(),axis:new THREE.Vector3(),u:new THREE.Vector3(),v:new THREE.Vector3(),normal:new THREE.Vector3(0,1,0),worldNormal:new THREE.Vector3(0,1,0),targetNormal:new THREE.Vector3(0,1,0),geometry,mesh,anchor:new THREE.Vector3(),worldFoot:new THREE.Vector3(),target:new THREE.Vector3(),swingStart:new THREE.Vector3(),baseZ:foot.z,wasSwing:false,offset:(side===-1&&index!==1)||(side===1&&index===1)?0:.5};
}
function updateAntLimb(leg){
  const {hip,knee,foot,side,index,axis,u,v,normal,geometry}=leg;knee.set(hip.x+(foot.x-hip.x)*.55+side*.003,.013+Math.max(0,foot.y)*.3,(hip.z+foot.z)*.5+(index===0?.005:index===2?-.004:0));const p=geometry.attributes.position;
  for(let bone=0;bone<2;bone++){
    const a=bone?knee:hip,b=bone?foot:knee;axis.subVectors(b,a).normalize();u.set(1,0,0).addScaledVector(axis,-axis.x).normalize();v.crossVectors(axis,u);
    for(let end=0;end<2;end++){
      if(bone&&end){u.set(1,0,0).addScaledVector(normal,-normal.x).normalize();v.crossVectors(normal,u);}
      for(let j=0;j<6;j++){const angle=j*Math.PI/3,r=(bone?.0011:.0015)*(end?.65:1),c=Math.cos(angle)*r,s=Math.sin(angle)*r,origin=end?b:a;p.setXYZ(bone*14+end*6+j,origin.x+u.x*c+v.x*s,origin.y+u.y*c+v.y*s,origin.z+u.z*c+v.z*s);}
    }p.setXYZ(bone*14+12,a.x,a.y,a.z);p.setXYZ(bone*14+13,b.x,b.y,b.z);
  }p.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere();
}
function leafCutterAnt(root){
  const rust=material('#86492d',{roughness:.62}),dark=material('#33251d',{roughness:.45}),green=material('#d1d9a0',{map:antLeafTexture(),roughness:.84,side:THREE.DoubleSide});
  const body=new THREE.Group();body.name='ant-body';root.add(body);
  ellipsoid(body,[0,.019,-.033],[.013,.012,.013],rust,12);
  ellipsoid(body,[0,.021,.003],[.009,.009,.018],rust,12);
  ellipsoid(body,[0,.022,.033],[.017,.013,.017],rust,12);
  ellipsoid(body,[0,.017,-.018],[.004,.005,.005],rust,8);ellipsoid(body,[0,.016,-.025],[.005,.004,.004],rust,8);
  for(const side of [-1,1]){
    ellipsoid(body,[side*.014,.026,.037],[.0024,.0028,.003],dark,6);
    // Three small mesosomal spine pairs; shape is schematic, not diagnostic tracing.
    for(const z of [.014,.003,-.010]){const cone=new THREE.Mesh(new THREE.ConeGeometry(.0019,.008,4),rust);cone.position.set(side*.006,.030,z);cone.rotation.z=-side*.42;body.add(cone);}
    // Bent antennae and triangular mandibles: a visible connection holds the leaf base.
    thread(body,[[side*.009,.027,.042],[side*.025,.033,.055],[side*.023,.031,.072]],'#714126',1);
    const jaw=new THREE.BufferGeometry();jaw.setAttribute('position',new THREE.Float32BufferAttribute([side*.010,.021,.044,side*.002,.022,.054,0,.022,.053,side*.006,.019,.045],3));jaw.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,1,1,0,1],2));jaw.setIndex([0,1,2,0,2,3,2,1,0,3,2,0]);jaw.computeVertexNormals();const m=new THREE.Mesh(jaw,dark);m.name=`ant-mandible-${side}`;body.add(m);
  }batchBody(body);
  const leaf=new THREE.Group();leaf.name='ant-carried-leaf';leaf.position.set(0,.022,.053);root.add(leaf);
  const shape=new THREE.Shape(),outline=[[0,0],[-.022,.026],[-.045,.074],[-.037,.111],[-.017,.140],[.011,.130],[.040,.093],[.045,.056],[.018,.016]];shape.moveTo(...outline[0]);for(const p of outline.slice(1))shape.lineTo(...p);shape.closePath();
  const g=new THREE.ExtrudeGeometry(shape,{depth:.0008,bevelEnabled:false,steps:1,curveSegments:1});const uv=g.attributes.uv,p=g.attributes.position;for(let i=0;i<p.count;i++)uv.setXY(i,(p.getX(i)+.045)/.09,1-p.getY(i)/.14);const blade=new THREE.Mesh(g,green);blade.name='ant-original-leaf-fragment';leaf.add(blade);
  const rig=new THREE.Group();rig.name='ant-six-leg-rig';root.add(rig);const legs=[];for(const side of [-1,1])for(let i=0;i<3;i++){const l=antLimb(rig,side,i,rust);legs.push(l);updateAntLimb(l);}
  root.userData.ant={legs,leaf,ready:false,position:new THREE.Vector3(),rotation:new THREE.Quaternion(),inverse:new THREE.Quaternion(),cycle:0,normal:new THREE.Vector3(0,1,0),forward:new THREE.Vector3(),right:new THREE.Vector3(),matrix:new THREE.Matrix4()};
}
function antGround(target,normal,support,root,up){
  const hit=typeof support?.sampleAt==='function'?support.sampleAt(target.x,target.z):null;
  if(hit?.point&&Number.isFinite(hit.point.y)&&hit.normal&&hit.normal.y>0){target.y=hit.point.y;normal.set(hit.normal.x,hit.normal.y,hit.normal.z).normalize();}
  else{target.y=root.y-(up.x*(target.x-root.x)+up.z*(target.z-root.z))/Math.max(.1,up.y);normal.copy(up);}
}
function updateLeafCutterAnt(group,item,inspection,support){
  const data=group.userData.visual.userData.ant,phase=inspection?0:(Number.isFinite(item.walkPhase)?item.walkPhase:0),turning=!inspection&&!item.caught&&item.state==='turning';
  // Integer cycles preserve grounded endpoints; <=30 degrees per cycle keeps
  // planted legs from crossing. This is display tuning, not a measured gait.
  const turnAngle=Number.isFinite(item.turnAngle)?Math.min(Math.PI,Math.abs(item.turnAngle)):Math.PI,turnCycles=Math.max(1,Math.ceil(turnAngle/(Math.PI/6)-1e-9)),cycle=phase/(Math.PI*2)+(turning?turnCycles*Math.min(1,Math.max(0,item.turnProgress||0)):0);
  data.leaf.visible=item.carryingLeaf!==false;
  if(inspection){for(const l of data.legs){l.foot.set(l.side*.040,0,l.baseZ+.009-.030*l.offset);l.normal.set(0,1,0);updateAntLimb(l);}data.ready=false;return;}
  if(!inspection){const n=support?.normal;data.normal.set(n?.x||0,n?.y>0?n.y:1,n?.z||0).normalize();const h=item.heading||0;data.forward.set(Math.sin(h),0,Math.cos(h)).addScaledVector(data.normal,-(Math.sin(h)*data.normal.x+Math.cos(h)*data.normal.z)).normalize();data.right.crossVectors(data.normal,data.forward).normalize();data.matrix.makeBasis(data.right,data.normal,data.forward);group.quaternion.setFromRotationMatrix(data.matrix);}
  else data.normal.set(0,1,0);
  const delta=cycle-data.cycle,reset=inspection||!data.ready||item.caught||data.position.distanceToSquared(group.position)>.0009||data.rotation.angleTo(group.quaternion)>.3||Math.abs(delta-Math.round(delta))>.4;data.inverse.copy(group.quaternion).invert();
  for(const l of data.legs){
    const q=leafCyclePhase(cycle+l.offset),swing=q>.6?(q-.6)/.4:0,isSwing=q>.6,bq=leafCyclePhase(phase/(Math.PI*2)+l.offset),bs=bq>.6?(bq-.6)/.4:0,stride=bq<=.6?.009-.030*bq:-.009+.018*bs*bs*(3-2*bs);
    l.target.set(l.side*(turning?.037:.040),0,l.baseZ+(turning?stride:isSwing?.009:stride)).applyQuaternion(group.quaternion).add(group.position);antGround(l.target,l.targetNormal,inspection?null:support,group.position,data.normal);
    if(reset){l.foot.set(l.side*.040,0,l.baseZ+stride);l.worldFoot.copy(l.foot).applyQuaternion(group.quaternion).add(group.position);antGround(l.worldFoot,l.worldNormal,inspection?null:support,group.position,data.normal);l.anchor.copy(l.worldFoot);l.swingStart.copy(l.anchor);l.worldFoot.addScaledVector(l.worldNormal,.006*Math.sin(Math.PI*swing)**2);}
    else if(isSwing){if(!l.wasSwing)l.swingStart.copy(l.worldFoot);l.worldFoot.copy(l.swingStart).lerp(l.target,swing*swing*(3-2*swing));antGround(l.worldFoot,l.worldNormal,support,group.position,data.normal);l.worldFoot.addScaledVector(l.worldNormal,.006*Math.sin(Math.PI*swing)**2);}
    else{if(l.wasSwing){l.anchor.copy(l.worldFoot);antGround(l.anchor,l.worldNormal,support,group.position,data.normal);}l.worldFoot.copy(l.anchor);}
    l.foot.copy(l.worldFoot).sub(group.position).applyQuaternion(data.inverse);l.normal.copy(l.worldNormal).applyQuaternion(data.inverse);l.wasSwing=isSwing;updateAntLimb(l);
  }data.ready=!inspection&&!item.caught;data.position.copy(group.position);data.rotation.copy(group.quaternion);data.cycle=cycle;
}

// Male Aquatica lateralis: original, display-scaled geometry. The two small
// ventral organs emit a CONSTANT weak light; no timer, halo, light or bloom.
function firefly(root) {
  const dark=material('#252b28',{roughness:.6}),red=material('#b96654'),legMat=material('#6a6954');
  const shell=material('#303a32',{roughness:.54}),membrane=material('#bac5af',{side:THREE.DoubleSide,transparent:true,opacity:.72,depthWrite:false,roughness:.64});
  const abdomen=new THREE.Group();root.add(abdomen);abdomen.name='firefly-abdomen';
  const rings=[[-.055,.003],[-.050,.011],[-.035,.015],[-.015,.014],[.006,.007]],verts=[],indices=[];
  for(const[z,w]of rings)for(const[x,y]of [[-.8,.019],[.8,.019],[1,.025],[.8,.035],[0,.039],[-.8,.035],[-1,.025]])verts.push(x*w,y,z);
  for(let r=0;r<4;r++)for(let j=0;j<7;j++){const k=(j+1)%7,a=r*7+j,b=r*7+k,c=(r+1)*7+k,d=(r+1)*7+j;indices.push(a,b,c,a,c,d);}
  for(let j=1;j<6;j++){indices.push(0,j+1,j,28,28+j,28+j+1);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));g.setIndex(indices);g.computeVertexNormals();abdomen.add(new THREE.Mesh(g,dark));
  ellipsoid(root,[0,.032,.019],[.018,.011,.013],red,8);
  ellipsoid(root,[0,.030,.037],[.009,.007,.008],dark,8);
  ellipsoid(root,[0,.041,.019],[.003,.002,.012],dark,6);
  for(const side of [-1,1]){
    segment(root,[side*.004,.033,.042],[side*.009,.037,.052],.0008,dark,4);
    segment(root,[side*.009,.037,.052],[side*.013,.037,.064],.0006,dark,4);
  }
  const limbs=new THREE.Group();limbs.name='firefly-six-legs';root.add(limbs);const feet=[];
  for(const side of [-1,1])for(const z of [-.025,0,.026]){
    const hip=[side*.009,.024,z*.65],knee=[side*.022,.013,z],foot=[side*.027,0,z];
    grasshopperLimb(limbs,hip,knee,.0013,legMat);grasshopperLimb(limbs,knee,foot,.001,legMat,true);feet.push(new THREE.Vector3(...foot));
  }batchBody(limbs);
  const elytra=[],hindwings=[];
  for(const side of [-1,1]){
    const cover=new THREE.Group();cover.name=`firefly-elytron-${side}`;cover.position.set(side*.0005,.041,.009);root.add(cover);
    wing(cover,[[0,0],[side*.014,-.004],[side*.015,-.028],[side*.011,-.058],[side*.002,-.063],[0,-.057]],shell);elytra.push({pivot:cover,side});
    const hind=new THREE.Group();hind.name=`firefly-hindwing-${side}`;hind.position.set(side*.003,.037,.005);hind.scale.x=.16;root.add(hind);
    wing(hind,[[0,0],[side*.048,-.013],[side*.054,-.031],[side*.041,-.052],[side*.018,-.056],[0,-.035]],membrane);hindwings.push({pivot:hind,side});
  }
  const glowGeometry=new THREE.BufferGeometry(),positions=[],glowIndices=[];
  for(const[z0,z1]of [[-.039,-.030],[-.052,-.043]]){
    const i=positions.length/3,w=z0<-.04?.005:.008;positions.push(-w,.0188,z0,w,.0188,z0,w,.0188,z1,-w,.0188,z1);glowIndices.push(i,i+1,i+2,i,i+2,i+3);
  }
  glowGeometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));glowGeometry.setIndex(glowIndices);glowGeometry.computeVertexNormals();
  const light=material('#b9c77d',{emissive:'#b9ce68',emissiveIntensity:.28,roughness:.84});
  const lanterns=new THREE.Mesh(glowGeometry,light);lanterns.name='firefly-ventral-lanterns';root.add(lanterns);
  root.userData.firefly={elytra,hindwings,limbs,feet,lanterns,normal:new THREE.Vector3(),forward:new THREE.Vector3(),right:new THREE.Vector3(),matrix:new THREE.Matrix4(),rest:new THREE.Quaternion(),upright:new THREE.Quaternion(),up:new THREE.Vector3(0,1,0)};
}
function updateFirefly(group,item,inspection,support){
  const data=group.userData.visual.userData.firefly,clamp=x=>Math.min(1,Math.max(0,Number.isFinite(x)?x:0)),smooth=x=>x*x*(3-2*x),f=inspection?0:clamp(item.flightBlend);
  const open=smooth(clamp(f/.35)),deploy=smooth(clamp((f-.2)/.45)),flap=smooth(clamp((f-.55)/.45)),phase=Number.isFinite(item.wingPhase)?item.wingPhase:0;
  for(const{pivot,side}of data.elytra){pivot.rotation.y=side*open*.85;pivot.rotation.z=side*open*.3;}
  for(const{pivot,side}of data.hindwings){pivot.scale.x=.16+.84*deploy;pivot.rotation.y=side*.75*deploy;pivot.rotation.z=side*(.1*deploy+.48*Math.sin(phase)*flap);}
  // The simulation preserves this blend across mid-flight capture/release.
  // Deriving it again from reset flightProgress would snap the resting basis.
  const air=inspection?0:clamp(item.airBlend);
  data.limbs.scale.y=1-.6*air;data.limbs.position.y=.014*air;
  if(!inspection){
    const heading=item.heading||0;data.upright.setFromAxisAngle(data.up,heading);data.rest.copy(data.upright);
    const n=support?.normal,t=support?.forward;
    if(n&&[n.x,n.y,n.z].every(Number.isFinite)){
      data.normal.set(n.x,n.y,n.z).normalize();data.forward.set(t?.x??Math.sin(heading),t?.y??0,t?.z??Math.cos(heading));data.forward.addScaledVector(data.normal,-data.forward.dot(data.normal));
      if(data.normal.lengthSq()>.5&&data.forward.lengthSq()>1e-10){data.forward.normalize();data.right.crossVectors(data.normal,data.forward).normalize();data.matrix.makeBasis(data.right,data.normal,data.forward);data.rest.setFromRotationMatrix(data.matrix);}
    }
    group.quaternion.copy(data.rest).slerp(data.upright,air);
  }
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
    const arrays = { position: [], normal: [], uv: [] },battleParts=[];let battleVertex=0;
    for (const part of parts) {
      part.updateMatrix();
      const geom = part.geometry.index ? part.geometry.toNonIndexed() : part.geometry.clone();
      geom.applyMatrix4(part.matrix);
      if(part.userData.battleRole)battleParts.push({role:part.userData.battleRole,start:battleVertex,count:geom.attributes.position.count});battleVertex+=geom.attributes.position.count;
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
    const mesh=new THREE.Mesh(merged,mat);if(battleParts.length)mesh.userData.battleParts=battleParts;root.add(mesh);
  }
}

export function createInsectModel(species, { inspection = false, sizePermille = null, fieldFlight = false } = {}) {
  const root = buildInsectModel(species, { inspection, fieldFlight });
  // Individual size is fixed at creation. Inspection framing may scale its root
  // further; animation must never replace that transform or redraw native art.
  const eligible=['hercules','rhino','stag','metallifer','giantstag','atlas'].includes(species);
  const factor=eligible&&Number.isInteger(sizePermille)&&sizePermille>=1000&&sizePermille<=1150?sizePermille/1000:1;
  root.userData.individualScale=factor;root.scale.setScalar(factor);
  return applyInsectReadability(root, { inspection, species });
}

function buildInsectModel(species, { inspection = false, fieldFlight = false } = {}) {
  if(species==='manticora'){const root=createManticoraModel({inspection});root.userData.species='manticora';return root;}
  if(species==='euchirus'){const root=createEuchirusModel({inspection});root.userData.species='euchirus';return root;}
  if(species==='miyama'){const root=createMiyamaModel({inspection});root.userData.species='miyama';return root;}
  if(species==='fivehorn'){const root=createFiveHornModel({inspection});root.userData.species='fivehorn';return root;}
  if(species==='goliath'){const root=createGoliathModel({inspection});root.userData.species='goliath';return root;}
  if(species==='elephant'){const root=createElephantModel({inspection});root.userData.species='elephant';return root;}
  if(species==='giantstag'){const root=createGiantStagModel({inspection});root.userData.species='giantstag';return root;}
  if(species==='atlas'){const root=createAtlasModel({inspection});root.userData.species='atlas';return root;}
  if(species==='metallifer'){
    const root=createMetalliferModel({inspection});root.userData.species='metallifer';return root;
  }
  if(species==='longhorn'){
    const root=createLonghornModel({inspection});root.userData.species='longhorn';return root;
  }
  if(species==='jewel'){
    const root=createJewelModel({inspection});root.userData.species='jewel';return root;
  }
  if(species==='swallowtail'){
    const root=createSwallowtailModel({inspection});root.userData.species='swallowtail';return root;
  }
  if(species==='bee'){
    const root=createBeeModel({inspection});root.userData.species='bee';return root;
  }
  if(species==='stag'){
    const root=createStagModel({inspection});root.userData.species='stag';return root;
  }
  if(species==='rhino'){
    const root=fieldFlight&&!inspection?createRhinoFlightModel({inspection}):createRhinoModel({inspection});root.userData.species='rhino';return root;
  }
  if(species==='ladybird'){
    const root=createLadybirdModel({inspection});root.userData.species='ladybird';return root;
  }
  if(species==='mantis'){
    const root=createMantisModel({inspection});root.userData.species='mantis';return root;
  }
  if(species==='divingbeetle'){
    const model=createDivingModel({inspection});model.userData.species=species;
    // This model owns its texture, unlike the cached maps of the old species.
    const materials=new Set();model.traverse(node=>{if(node.material?.map)materials.add(node.material);});
    for(const material of materials){const texture=material.map;let disposed=false;material.addEventListener('dispose',()=>{if(!disposed){disposed=true;texture.dispose();}});}
    return model;
  }
  if(species==='dungbeetle')return createDungBeetleModel({inspection});
  const group=new THREE.Group();group.name=`${species}-${inspection?'inspection':'field'}`;
  const visual=new THREE.Group();group.add(visual);
  (species==='firefly'?firefly:species==='leafcutterant'?leafCutterAnt:species==='waterstrider'?waterStrider:species==='leafinsect'?leafInsect:species==='hercules'?hercules:species==='grasshopper'?grasshopper:species==='morpho'?morpho:species==='dragonfly'?dragonfly:species==='cicada'?cicada:butterfly)(visual,!inspection);
  batchBody(visual);
  // Field readability only: inspection framing and the simulation capture centre stay unchanged.
  if (!inspection) visual.scale.setScalar(FIELD_VISUAL_SCALE[species] ?? 1);
  group.userData.species=species;group.userData.inspection=inspection;group.userData.visual=visual;
  group.userData.wings=visual.userData.wings;
  if(species==='hercules')group.userData.herculesGait=visual.userData.gait;
  if(species==='leafinsect')group.userData.leafGait=visual.userData.gait;
  // Perched cicadas climb with the head upwards, dorsal wing surface facing out.
  if(species==='cicada'&&!inspection) visual.rotation.x=-Math.PI/2;
  group.traverse(child=>{if(child.isMesh){child.castShadow=false;child.receiveShadow=false;}});
  return group;
}

export function updateInsectModel(group, item, time = 0, support = null) {
  if(group.userData.species==='fivehorn'){
    if(!group.userData.inspection)group.visible=!item.caught;
    return updateFiveHornModel(group,{position:{x:item.x,y:item.y,z:item.z},heading:item.heading,pitch:item.pitch,walkPhase:item.walkPhase,walkSpeed:item.walkSpeed,headLift:item.headLift,warningBlend:item.warningBlend,phase:item.fiveHornPhase,caught:item.caught});
  }
  if(group.userData.species==='elephant'){
    if(!group.userData.inspection)group.visible=!item.caught;
    return updateElephantModel(group,{position:{x:item.x,y:item.y,z:item.z},heading:item.heading,pitch:item.pitch,walkPhase:item.walkPhase,walkSpeed:item.walkSpeed,headLift:item.headLift,warningBlend:item.warningBlend,phase:item.elephantPhase,caught:item.caught});
  }
  if(group.userData.species==='goliath'){
    if(!group.userData.inspection)group.visible=!item.caught;
    return updateGoliathModel(group,{position:{x:item.x,y:item.y,z:item.z},heading:item.heading,pitch:item.pitch,walkPhase:item.walkPhase,walkSpeed:item.walkSpeed,warningBlend:item.warningBlend,phase:item.goliathPhase,caught:item.caught});
  }
  if(group.userData.species==='giantstag'){
    if(!group.userData.inspection)group.visible=!item.caught;
    return updateGiantStagModel(group,{position:{x:item.x,y:item.y,z:item.z},heading:item.heading,pitch:item.pitch,walkPhase:item.walkPhase,walkSpeed:item.walkSpeed,jawOpen:item.jawOpen,warningBlend:item.warningBlend,phase:item.giantStagPhase,caught:item.caught});
  }
  if(group.userData.species==='atlas'){
    if(!group.userData.inspection)group.visible=!item.caught;
    return updateAtlasModel(group,{position:{x:item.x,y:item.y,z:item.z},heading:item.heading,walkPhase:item.walkPhase,walkSpeed:item.walkSpeed,headLift:item.headLift,phase:item.atlasPhase,caught:item.caught});
  }
  if(group.userData.species==='metallifer'){
    if(!group.userData.inspection)group.visible=!item.caught;
    return updateMetalliferModel(group,{position:{x:item.x,y:item.y,z:item.z},heading:item.heading,walkPhase:item.walkPhase,walkSpeed:item.walkSpeed,jawOpen:item.jawOpen,phase:item.metalliferPhase,caught:item.caught});
  }
  if(group.userData.species==='miyama'){
    if(!group.userData.inspection)group.visible=!item.caught;
    return updateMiyamaModel(group,{position:{x:item.x,y:item.y,z:item.z},orientation:item.orientation,walkPhase:item.walkPhase,walkSpeed:item.walkSpeed,jawOpen:item.jawOpen,warningBlend:item.warningBlend,phase:item.miyamaPhase,caught:item.caught});
  }
  if(group.userData.species==='manticora'){
    if(!group.userData.inspection)group.visible=!item.caught;
    return updateManticoraModel(group,{position:{x:item.x,y:item.y,z:item.z},orientation:item.orientation,walkPhase:item.walkPhase,walkSpeed:item.walkSpeed,jawOpen:item.jawOpen,turnFeet:item.turnFeet,phase:item.manticoraPhase,caught:item.caught});
  }
  if(group.userData.species==='euchirus'){
    if(!group.userData.inspection)group.visible=!item.caught;
    return updateEuchirusModel(group,{position:{x:item.x,y:item.y,z:item.z},orientation:item.orientation,walkPhase:item.walkPhase,walkSpeed:item.walkSpeed,jawOpen:item.jawOpen,warningBlend:item.warningBlend,phase:item.euchirusPhase,caught:item.caught});
  }
  if(group.userData.species==='longhorn'){
    if(!group.userData.inspection)group.visible=!item.caught;
    return updateLonghornModel(group,{position:{x:item.x,y:item.y,z:item.z},orientation:item.orientation,walkPhase:item.walkPhase,walkSpeed:item.walkSpeed,phase:item.longhornPhase,caught:item.caught});
  }
  if(group.userData.species==='jewel'){
    if(!group.userData.inspection)group.visible=!item.caught;
    return updateJewelModel(group,{position:{x:item.x,y:item.y,z:item.z},heading:item.heading,pitch:item.pitch,walkPhase:item.walkPhase,walkSpeed:item.walkSpeed,phase:item.jewelPhase,caught:item.caught});
  }
  if(group.userData.species==='swallowtail'){
    if(!group.userData.inspection)group.visible=!item.caught;
    return updateSwallowtailModel(group,{position:{x:item.x,y:item.y,z:item.z},orientation:item.orientation,wingOpen:item.wingOpen,wingPhase:item.wingPhase,flapBlend:item.flapBlend,legTuck:item.legTuck,phase:item.swallowtailPhase,caught:item.caught});
  }
  if(group.userData.species==='bee'){
    if(!group.userData.inspection)group.visible=!item.caught;
    return updateBeeModel(group,{position:{x:item.x,y:item.y,z:item.z},heading:item.heading,pitch:item.pitch,wingOpen:item.wingOpen,wingPhase:item.wingPhase,legTuck:item.legTuck,phase:item.beePhase,caught:item.caught});
  }
  if(group.userData.species==='stag'){
    if(!group.userData.inspection)group.visible=!item.caught;
    return updateStagModel(group,{position:{x:item.x,y:item.y,z:item.z},heading:item.heading,pitch:item.pitch,walkPhase:item.walkPhase,walkSpeed:item.walkSpeed,jawOpen:item.jawOpen,phase:item.stagPhase,caught:item.caught});
  }
  if(group.userData.species==='rhino'){
    if(!group.userData.inspection)group.visible=!item.caught;
    return (group.userData.flightRig?updateRhinoFlightModel:updateRhinoModel)(group,{position:{x:item.x,y:item.y,z:item.z},heading:item.heading,pitch:item.pitch,walkPhase:item.walkPhase,walkSpeed:item.walkSpeed,phase:item.rhinoPhase,warningBlend:item.warningBlend,caught:item.caught,flightPose:item.flightPose});
  }
  if(group.userData.species==='ladybird'){
    if(!group.userData.inspection)group.visible=!item.caught;
    return updateLadybirdModel(group,{position:{x:item.x,y:item.y,z:item.z},heading:item.heading,pitch:item.pitch,walkPhase:item.walkPhase,elytraOpen:item.elytraOpen,hindwingDeploy:item.hindwingDeploy,hindwingSweep:item.hindwingSweep,wingPhase:item.wingPhase,legTuck:item.legTuck});
  }
  if(group.userData.species==='mantis'){
    if(!group.userData.inspection)group.visible=!item.caught;
    return updateMantisModel(group,{position:{x:item.x,y:item.y,z:item.z},heading:item.heading,pitch:item.pitch,wingOpen:item.wingOpen,wingPhase:item.wingPhase,legTuck:item.legTuck,headYaw:item.headYaw});
  }
  if(group.userData.species==='divingbeetle'){
    if(!group.userData.inspection)group.visible=!item.caught;
    return updateDivingModel(group,{position:{x:item.x,y:item.y,z:item.z},heading:item.heading,pitch:item.pitch,strokePhase:item.strokePhase});
  }
  if(group.userData.species==='dungbeetle')return updateDungBeetleModel(group,item);
  const inspection=group.userData.inspection;
  const species=group.userData.species;
  if(!inspection) {
    group.visible=!item.caught;
    group.position.set(item.x,item.y,item.z);
    group.rotation.y=item.heading||0;
  }
  const visual=group.userData.visual;
  if(species==='firefly'){updateFirefly(group,item,inspection,support);return;}
  if(species==='leafcutterant'){updateLeafCutterAnt(group,item,inspection,support);return;}
  if(species==='waterstrider'){updateWaterStrider(group,item,inspection);return;}
  if(species==='leafinsect'){updateLeafInsect(group,item,inspection);return;}
  if(species==='hercules') {
    const phase=inspection?0:(Number.isFinite(item.walkPhase)?item.walkPhase:0),turning=!inspection&&!item.caught&&item.state==='turning';
    const progress=turning?Math.min(1,Math.max(0,item.turnProgress||0)):0,cycle=phase/(Math.PI*2)+(turning?progress*6:0);
    const gait=group.userData.herculesGait,factor=group.userData.individualScale??1;
    // Per-model rendering anchors, never simulation state. Teleports, capture,
    // or discontinuous test poses reset safely instead of stretching a leg.
    const cycleDelta=cycle-gait.cycle,phaseDelta=cycleDelta-Math.round(cycleDelta);
    const reset=inspection||!gait.ready||item.caught||gait.position.distanceToSquared(group.position)>.0025*factor*factor||gait.rotation.angleTo(group.quaternion)>.25||Math.abs(phaseDelta)>.4;
    gait.inverse.copy(group.quaternion).invert();
    for(const leg of visual.userData.legs){
      const q=((cycle+leg.offset)%1+1)%1,swing=q>.6?(q-.6)/.4:0,isSwing=q>.6;
      const baseQ=((phase/(Math.PI*2)+leg.offset)%1+1)%1,baseSwing=baseQ>.6?(baseQ-.6)/.4:0;
      const stride=baseQ<=.6?.015-.05*baseQ:-.015+.03*baseSwing*baseSwing*(3-2*baseSwing);
      // Swing targets tuck inward 6mm during turns; planted feet never slide.
      leg.target.set(leg.side*(turning?.099:.105),-.06,leg.baseZ+(turning?stride:isSwing?.015:stride));
      leg.target.multiplyScalar(factor).applyQuaternion(group.quaternion).add(group.position);
      if(reset){
        leg.foot.set(leg.side*.105,-.06+.012*Math.sin(Math.PI*swing)**2,leg.baseZ+stride);
        leg.worldFoot.copy(leg.foot).multiplyScalar(factor).applyQuaternion(group.quaternion).add(group.position);
        leg.anchor.copy(leg.worldFoot);leg.anchor.y=group.position.y-.06*factor;leg.swingStart.copy(leg.anchor);
      } else if(isSwing){
        if(!leg.wasSwing)leg.swingStart.copy(leg.worldFoot);
        const blend=swing*swing*(3-2*swing);
        leg.worldFoot.copy(leg.swingStart).lerp(leg.target,blend);leg.worldFoot.y=group.position.y+factor*(-.06+.012*Math.sin(Math.PI*swing)**2);
        leg.foot.copy(leg.worldFoot).sub(group.position).applyQuaternion(gait.inverse).divideScalar(factor);
      } else {
        if(leg.wasSwing)leg.anchor.copy(leg.target);
        leg.worldFoot.copy(leg.anchor);leg.foot.copy(leg.worldFoot).sub(group.position).applyQuaternion(gait.inverse).divideScalar(factor);
      }
      // The largest individuals can reach the adjoining sloped octagonal bark
      // while turning. Conform each planted tip instead of floating above it.
      if(!inspection&&typeof support?.footHeightAt==='function'){
        const woodY=support.footHeightAt(leg.worldFoot.x,leg.worldFoot.z);
        if(Number.isFinite(woodY)){
          const lift=isSwing?.012*factor*Math.sin(Math.PI*swing)**2:0;
          leg.worldFoot.y=woodY+lift;if(!isSwing)leg.anchor.y=woodY;
          leg.foot.copy(leg.worldFoot).sub(group.position).applyQuaternion(gait.inverse).divideScalar(factor);
        }
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
  // Restrained game-readable preparation, not a measured pre-flight behaviour.
  // Only a genuinely perched, uncaught field insect may add the small hinge
  // motion; body/support placement and all existing flight poses stay unchanged.
  const perchedWarning=flight<.01||(species==='morpho'&&item.state==='feeding');
  const warning=!inspection&&!item.caught&&item.resting===true&&perchedWarning&&item.awarenessStage==='warning'
    ?Math.max(0,Math.min(1,Number.isFinite(item.alertBlend)?item.alertBlend:0)):0;
  const wings=group.userData.wings||[];
  for(const pivot of wings) {
    const side=pivot.userData.side;
    if(species==='morpho') {
      const restAngle=1.30+Math.sin(time*1.1+(item.phase||0))*.07;
      const flap=.10+Math.sin(phase+(pivot.userData.back?.22:0))*1.15;
      const inspectionAngle=.55+Math.sin(time*.7)*.12;
      // A small opening of the upright wings makes a wary perch readable.
      // Only the wing hinges move; size, body/feet and existing flight stay exact.
      // Fruit landings can still fade their flap blend while perched; the cue
      // emerges continuously with that fade instead of being silently hidden.
      pivot.rotation.z=side*(inspection?inspectionAngle:restAngle*(1-flight)+flap*flight-warning*(1-Math.min(1,Math.max(0,flight)))*(.24+.035*Math.sin(time*10)));
    } else if(species==='butterfly') {
      const restAngle=.60+Math.sin(time*2+(item.phase||0))*.18;
      const flightAngle=.2+Math.sin(phase)*.82;
      // Small faster hinge preparation distinguishes a wary perch from rest;
      // it never changes the feet, inspection pose or an existing flight.
      const angle=inspection?.12+Math.sin(time*1.4)*.06:restAngle*(1-flight)+flightAngle*flight+warning*(.28+.07*Math.sin(time*14));
      pivot.rotation.z=side*angle;
    } else if(species==='dragonfly') {
      const restAngle=.16+Math.sin(time*2.2+(item.phase||0)+(pivot.userData.back?.5:0))*.035;
      const flightAngle=Math.sin(phase+(pivot.userData.back?1.2:0))*.238;
      pivot.rotation.z=side*(inspection?Math.sin(time*1.1)*.015:restAngle*(1-flight)+flightAngle*flight+warning*.08);
      // A fixed, shallow opposite incidence on fore/hind wings avoids four
      // edge-on planes from the front. This is display geometry, not steering.
      if (!inspection) pivot.rotation.x=(pivot.userData.back?-.18:.18)*(1-flight);
    } else {
      const restMotion=Math.sin(time*1.7+(item.phase||0))*.028;
      pivot.rotation.z=-side*(.32+(inspection?Math.sin(time)*.018:restMotion*(1-flight)+flight*.2*Math.sin(phase)+(species==='cicada'?warning*.08:0)));
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
