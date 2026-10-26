import {createInsectModel} from './insect-models.js?v=0.19.0&b=2b3a7a48ca63';

/** Small presentation-only sumo table. Automatic exchanges are supplied
 * by the pure watching/finished/cancelled battle snapshot. This is a restrained push/stance illustration,
 * with close framing and brief contact accents. No battle rules, renderer or audio owned.
 */
const T=window.THREE;
const ELIGIBLE=new Set(['rhino','stag','hercules','metallifer']);
const finite=(value,fallback=0)=>Number.isFinite(value)?value:fallback;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

export function createBattleView({playerSpecies,opponentSpecies,playerSizePermille=null,opponentSizePermille=null,aspect=1}={}){
 if(!ELIGIBLE.has(playerSpecies)||!ELIGIBLE.has(opponentSpecies))throw new TypeError('Battle view requires supported beetles');
 const scene=new T.Scene();scene.background=new T.Color('#647368');
 scene.add(new T.HemisphereLight('#f7f1db','#475640',1.15));
 const sun=new T.DirectionalLight('#ffe9c8',1.2);sun.position.set(-2,4,3);scene.add(sun);
 const fill=new T.DirectionalLight('#cce2e4',.5);fill.position.set(3,2,-2);scene.add(fill);
 const camera=new T.OrthographicCamera(-1,1,1,-1,.01,20);camera.position.set(0,1.25,2);camera.lookAt(0,0,0);camera.updateMatrixWorld(true);
 const scratch=new T.Box3(),fit=new T.Box3(),otherBox=new T.Box3(),corner=new T.Vector3();
 function beetle(species,name,heading,sizePermille){
  const anchor=new T.Group();anchor.name=name;
  const model=createInsectModel(species,{inspection:true,sizePermille});anchor.add(model);scene.add(anchor);
  model.updateMatrixWorld(true);scratch.setFromObject(model);
  const front=scratch.max.z,height=scratch.max.y-scratch.min.y;
  const bodyBounds=model.userData.visual?.userData.bodyBounds;
  if(bodyBounds)scratch.copy(bodyBounds).applyMatrix4(model.userData.visual.matrixWorld);else if(model.userData.bodyMesh)scratch.setFromObject(model.userData.bodyMesh);
  const bodyCenter=scratch.getCenter(new T.Vector3());
  const jaws=(model.userData.jaws||[]).map(jaw=>{const pivot=jaw.pivot||jaw;return{pivot,angle:pivot.rotation.y,side:jaw.side||Math.sign(pivot.position.x)};});
  anchor.rotation.y=heading;return{anchor,model,front,height,bodyCenter,jaws,baseX:0};
 }
 const player=beetle(playerSpecies,'battle-player',Math.PI/2,playerSizePermille),opponent=beetle(opponentSpecies,'battle-opponent',-Math.PI/2,opponentSizePermille);
 // Heads point toward the centre (+Z in each existing model). Keep horn/jaw
 // fronts separated; do not scale each body to the same fictional size.
 player.baseX=-.01-player.front;opponent.baseX=.01+opponent.front;
 function place(entry,x,yaw,lean,z=0){
  entry.anchor.position.set(x,0,z);entry.anchor.rotation.set(0,yaw,lean,'ZYX');
  entry.anchor.updateMatrixWorld(true);scratch.setFromObject(entry.anchor);
  entry.anchor.position.y=-scratch.min.y;entry.anchor.updateMatrixWorld(true);
 }
 place(player,player.baseX,Math.PI/2,0);place(opponent,opponent.baseX,-Math.PI/2,0);
 scratch.setFromObject(player.anchor);fit.copy(scratch);scratch.setFromObject(opponent.anchor);fit.union(scratch);
 const radius=Math.max(.65,Math.abs(fit.min.x),Math.abs(fit.max.x))+.36;
 const side=new T.MeshStandardMaterial({color:'#695344',roughness:.96});
 const top=new T.MeshStandardMaterial({color:'#a18766',roughness:.92});
 const stump=new T.Mesh(new T.CylinderGeometry(radius,radius*1.015,.14,48),[side,top,top]);stump.name='battle-stump';stump.position.y=-.07;scene.add(stump);
 const ringRadius=radius*.78;
 const ring=new T.Mesh(new T.TorusGeometry(ringRadius,.003,6,64),new T.MeshStandardMaterial({color:'#d5bf96',roughness:1}));ring.name='battle-ring';ring.rotation.x=Math.PI/2;ring.position.y=.001;scene.add(ring);
 const positiveEnd=ringRadius-corner.copy(opponent.bodyCenter).applyMatrix4(opponent.anchor.matrixWorld).x;
 const negativeEnd=-ringRadius-corner.copy(player.bodyCenter).applyMatrix4(player.anchor.matrixWorld).x;
 const mapPosition=value=>{const p=clamp(finite(value),-4,4);return p>=0?p/4*positiveEnd:-p/4*negativeEnd;};
 // Keep a constant close scale based on the insects, not the whole stump.
 // The stump may leave the viewport, like ground in a close arena shot. Both
 // complete beetles are fitted every stance, including long jaws and portrait.
 scratch.setFromObject(player.anchor);fit.copy(scratch);scratch.setFromObject(opponent.anchor);fit.union(scratch);
 const closeSize=fit.getSize(new T.Vector3()).addScalar(.20);
 const dust=new T.Group();dust.name='battle-contact-dust';scene.add(dust);
 const dustGeometry=new T.SphereGeometry(.009,5,3),dustMaterial=new T.MeshBasicMaterial({color:'#bfa67e',transparent:true,opacity:0,depthWrite:false});
 for(let i=0;i<6;i++){const mote=new T.Mesh(dustGeometry,dustMaterial);dust.add(mote);}dust.visible=false;
 let disposed=false,displayPosition=0,exchangeAge=1,exchangeKey=null,viewAspect=1;
 function frameBeetles(){
  scratch.setFromObject(player.anchor);fit.copy(scratch);scratch.setFromObject(opponent.anchor);fit.union(scratch);
  const centre=fit.getCenter(new T.Vector3()),safe=fit.clone().expandByScalar(.035),stable=new T.Box3().setFromCenterAndSize(centre,closeSize);safe.union(stable);
  let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
  camera.updateMatrixWorld(true);
  for(const x of[safe.min.x,safe.max.x])for(const y of[safe.min.y,safe.max.y])for(const z of[safe.min.z,safe.max.z]){
   corner.set(x,y,z).applyMatrix4(camera.matrixWorldInverse);minX=Math.min(minX,corner.x);maxX=Math.max(maxX,corner.x);minY=Math.min(minY,corner.y);maxY=Math.max(maxY,corner.y);
  }
  // Insects occupy the central arena; only compact edge UI is reserved.
  const span=Math.max((maxX-minX)/(.88*viewAspect),(maxY-minY)/.58),cy=(minY+maxY)/2,cx=(minX+maxX)/2;
  camera.left=cx-span*viewAspect/2;camera.right=cx+span*viewAspect/2;camera.top=cy+span/2;camera.bottom=cy-span/2;camera.updateProjectionMatrix();
 }
 function resize(nextAspect){if(disposed)return;viewAspect=clamp(finite(nextAspect,1),.1,10);frameBeetles();}
 function update(snapshot={},dt=0,{reducedMotion=false}={}){
  if(disposed)return;
  const step=clamp(finite(dt),0,.1),position=mapPosition(snapshot.position);
  const last=snapshot.lastExchange,key=last?`${finite(snapshot.exchanges)}:${finite(last.positionBefore)}:${finite(last.positionAfter)}:${finite(last.delta)}`:null;
  if(key!==exchangeKey){exchangeKey=key;exchangeAge=0;}
  exchangeAge=Math.min(1,exchangeAge+step);
  const resolving=!!last&&exchangeAge<.85;
  // A 70ms contact hold is presentation only: simulation time/results are not paused.
  const clipTime=exchangeAge<=.18?exchangeAge:exchangeAge<.25?.18:exchangeAge-.07;
  const progress=clamp((clipTime-.18)/.60,0,1),ease=progress*progress*(3-2*progress);
  displayPosition=reducedMotion?position:resolving?mapPosition(last.positionBefore)+(position-mapPosition(last.positionBefore))*ease:position;
  // Show BOTH automatic resolved actions; never preview a future decision. Under
  // reduced motion this is one fixed action pose, not an oscillating clip.
  const attack=clamp(clipTime/.18,0,1),decay=clamp((clipTime-.18)/.60,0,1);
  const amount=resolving&&!reducedMotion?(clipTime<.18?attack*attack*(3-2*attack):1-decay*decay*(3-2*decay)):0;
  function actionPose(entry,sign,action){
   const push=action==='push',evade=action==='evade',brace=action==='brace';
   const reaction=last&&last.delta*sign<0?-.025:0;
   const approach=((push?.055:brace?-.015:0)+reaction)*amount*sign;
   // Stay on all six feet: horizontal drive, sidestep and jaw grip, not a
   // whole-model airborne tilt. This is a short illustration, not new gait AI.
   for(const jaw of entry.jaws)jaw.pivot.rotation.y=jaw.angle+jaw.side*(push?.065:brace?.025:0)*amount;
   place(entry,entry.baseX+displayPosition+approach,sign*Math.PI/2+(evade?.22*amount*sign:0),0,evade?.105*amount*sign:0);
  }
  actionPose(player,1,resolving?last.playerAction:null);
  actionPose(opponent,-1,resolving?last.opponentAction:null);
  // The illustrative approach must never drive real horn/jaw geometry through
  // its opponent. Correct only the pair's separation, independently of rules.
  scratch.setFromObject(player.anchor);otherBox.setFromObject(opponent.anchor);
  const overlap=.004-(otherBox.min.x-scratch.max.x);
  if(overlap>0){player.anchor.position.x-=overlap/2;opponent.anchor.position.x+=overlap/2;player.anchor.updateMatrixWorld(true);opponent.anchor.updateMatrixWorld(true);}
  const puff=clamp((exchangeAge-.18)/.35,0,1);
  dust.visible=!reducedMotion&&resolving&&exchangeAge>=.18&&exchangeAge<.53&&(last.playerAction==='push'||last.opponentAction==='push');
  if(dust.visible){
   scratch.setFromObject(player.anchor);otherBox.setFromObject(opponent.anchor);dust.position.set((scratch.max.x+otherBox.min.x)/2,.006,(player.anchor.position.z+opponent.anchor.position.z)/2);
   dustMaterial.opacity=.42*(1-puff);
   dust.children.forEach((mote,i)=>{const a=i*Math.PI/3;mote.position.set(Math.cos(a)*(.015+puff*.12),Math.sin(puff*Math.PI)*(.012+i%2*.012),Math.sin(a)*(.015+puff*.08));mote.scale.setScalar(.7+puff*.9);});
  }
  frameBeetles();
 }
 function dispose(){
  if(disposed)return;disposed=true;const geometries=new Set(),materials=new Set();
  scene.traverse(node=>{if(node.geometry)geometries.add(node.geometry);if(node.material)for(const mat of Array.isArray(node.material)?node.material:[node.material])materials.add(mat);});
  for(const geometry of geometries)geometry.dispose();for(const material of materials)material.dispose();
  // The existing Hercules texture is shared by field and inspection models.
  // Never dispose texture maps or call a field-world disposal helper here.
  scene.clear();
 }
 resize(aspect);update({position:0,phase:'watching',lastExchange:null},0,{reducedMotion:true});
 return{scene,camera,update,resize,dispose};
}
