import {createInsectModel} from './insect-models.js?v=0.18.0&b=f75693c4884e';

/** Small presentation-only sumo table. Automatic exchanges are supplied
 * by the pure watching/finished/cancelled battle snapshot. This is a restrained push/stance illustration,
 * not a new realistic walking/fighting simulation. No renderer or audio owned.
 */
const T=window.THREE;
const ELIGIBLE=new Set(['rhino','stag','hercules','metallifer']);
const finite=(value,fallback=0)=>Number.isFinite(value)?value:fallback;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

export function createBattleView({playerSpecies,opponentSpecies,aspect=1}={}){
 if(!ELIGIBLE.has(playerSpecies)||!ELIGIBLE.has(opponentSpecies))throw new TypeError('Battle view requires supported beetles');
 const scene=new T.Scene();scene.background=new T.Color('#647368');
 scene.add(new T.HemisphereLight('#f7f1db','#475640',1.15));
 const sun=new T.DirectionalLight('#ffe9c8',1.2);sun.position.set(-2,4,3);scene.add(sun);
 const fill=new T.DirectionalLight('#cce2e4',.5);fill.position.set(3,2,-2);scene.add(fill);
 const camera=new T.OrthographicCamera(-1,1,1,-1,.01,20);camera.position.set(0,1.25,2);camera.lookAt(0,0,0);camera.updateMatrixWorld(true);
 const scratch=new T.Box3(),fit=new T.Box3(),otherBox=new T.Box3(),corner=new T.Vector3();
 function beetle(species,name,heading){
  const anchor=new T.Group();anchor.name=name;
  const model=createInsectModel(species,{inspection:true});model.scale.setScalar(1);anchor.add(model);scene.add(anchor);
  model.updateMatrixWorld(true);scratch.setFromObject(model);
  const front=scratch.max.z,height=scratch.max.y-scratch.min.y;
  const bodyBounds=model.userData.visual?.userData.bodyBounds;
  if(bodyBounds)scratch.copy(bodyBounds);else if(model.userData.bodyMesh)scratch.setFromObject(model.userData.bodyMesh);
  const bodyCenter=scratch.getCenter(new T.Vector3());
  anchor.rotation.y=heading;return{anchor,model,front,height,bodyCenter,baseX:0};
 }
 const player=beetle(playerSpecies,'battle-player',Math.PI/2),opponent=beetle(opponentSpecies,'battle-opponent',-Math.PI/2);
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
 // Conservative content box includes the entire table and all allowed stance/
 // push displacement. Fit it above the lower result area, even in portrait.
 fit.min.set(-radius*1.08,-.14,-radius*1.08);fit.max.set(radius*1.08,Math.max(player.height,opponent.height)+.12,radius*1.08);
 let disposed=false,displayPosition=0,exchangeAge=1,exchangeKey=null;
 function resize(nextAspect){
  if(disposed)return;
  const a=clamp(finite(nextAspect,1),.1,10);let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
  camera.updateMatrixWorld(true);
  for(const x of[fit.min.x,fit.max.x])for(const y of[fit.min.y,fit.max.y])for(const z of[fit.min.z,fit.max.z]){
   corner.set(x,y,z).applyMatrix4(camera.matrixWorldInverse);minX=Math.min(minX,corner.x);maxX=Math.max(maxX,corner.x);minY=Math.min(minY,corner.y);maxY=Math.max(maxY,corner.y);
  }
  // NDC x [-.90,.90], y [-.08,.84]: 46% of screen height is reserved
  // beneath the table. Caller owns the compact result/cancel panel and its layout.
  const span=Math.max((maxX-minX)/(.90*a),(maxY-minY)/.46),cy=(minY+maxY)/2-.38*span/2,cx=(minX+maxX)/2;
  camera.left=cx-span*a/2;camera.right=cx+span*a/2;camera.top=cy+span/2;camera.bottom=cy-span/2;camera.updateProjectionMatrix();
 }
 function update(snapshot={},dt=0,{reducedMotion=false}={}){
  if(disposed)return;
  const step=clamp(finite(dt),0,.1),position=mapPosition(snapshot.position);
  const last=snapshot.lastExchange,key=last?`${finite(snapshot.exchanges)}:${finite(last.positionBefore)}:${finite(last.positionAfter)}:${finite(last.delta)}`:null;
  if(key!==exchangeKey){exchangeKey=key;exchangeAge=0;}
  exchangeAge=Math.min(1,exchangeAge+step);
  const resolving=!!last&&exchangeAge<.65,p=clamp(exchangeAge/.65,0,1),ease=p*p*(3-2*p);
  displayPosition=reducedMotion?position:resolving?mapPosition(last.positionBefore)+(position-mapPosition(last.positionBefore))*ease:position;
  // Show BOTH automatic resolved actions; never preview a future decision. Under
  // reduced motion this is one fixed action pose, not an oscillating clip.
  const amount=resolving?(reducedMotion?1:Math.sin(p*Math.PI)):0;
  function actionPose(entry,sign,action){
   const push=action==='push',evade=action==='evade',brace=action==='brace';
   const approach=(push?.035:brace?-.012:0)*amount*sign;
   const lean=(push?-.055:brace?.035:0)*amount*sign;
   place(entry,entry.baseX+displayPosition+approach,sign*Math.PI/2+(evade?.16*amount*sign:0),lean,evade?.09*amount*sign:0);
  }
  actionPose(player,1,resolving?last.playerAction:null);
  actionPose(opponent,-1,resolving?last.opponentAction:null);
  // The illustrative approach must never drive real horn/jaw geometry through
  // its opponent. Correct only the pair's separation, independently of rules.
  scratch.setFromObject(player.anchor);otherBox.setFromObject(opponent.anchor);
  const overlap=.004-(otherBox.min.x-scratch.max.x);
  if(overlap>0){player.anchor.position.x-=overlap/2;opponent.anchor.position.x+=overlap/2;player.anchor.updateMatrixWorld(true);opponent.anchor.updateMatrixWorld(true);}
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
