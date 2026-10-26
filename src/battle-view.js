import {createManticoraBattleView} from './manticora-battle-view.js?v=0.37.0&b=4d59dc9955d7';
import {createEuchirusBattleView} from './euchirus-battle-view.js?v=0.37.0&b=4d59dc9955d7';
import {createInsectModel} from './insect-models.js?v=0.37.0&b=4d59dc9955d7';
import {createBattleRig} from './battle-pose.js?v=0.37.0&b=4d59dc9955d7';
import {BATTLE_CHOREOGRAPHY,RING_OUT_CHOREOGRAPHY,sampleBattleChoreography} from './battle-choreography.js?v=0.37.0&b=4d59dc9955d7';
/** Paired original sumo presentation, not battle rules or a licensed technique.
 * Contact is one constrained timeline shared by attacker and receiver. */
const T=window.THREE,ELIGIBLE=new Set(['rhino','stag','hercules','metallifer','atlas','giantstag','elephant','goliath','fivehorn','miyama']);
const finite=(n,f=0)=>Number.isFinite(n)?n:f,clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function createBattleView({playerSpecies,opponentSpecies,playerSizePermille=null,opponentSizePermille=null,aspect=1}={}){
 if(playerSpecies==='euchirus'||opponentSpecies==='euchirus')return createEuchirusBattleView({playerSpecies,opponentSpecies,playerSizePermille,opponentSizePermille,aspect});
 if(playerSpecies==='manticora'||opponentSpecies==='manticora')return createManticoraBattleView({playerSpecies,opponentSpecies,playerSizePermille,opponentSizePermille,aspect});
 if(!ELIGIBLE.has(playerSpecies)||!ELIGIBLE.has(opponentSpecies))throw new TypeError('Battle view requires supported beetles');
 const scene=new T.Scene();scene.background=new T.Color('#647368');scene.add(new T.HemisphereLight('#f7f1db','#475640',1.15));const sun=new T.DirectionalLight('#ffe9c8',1.2);sun.position.set(-2,4,3);scene.add(sun);const fill=new T.DirectionalLight('#cce2e4',.5);fill.position.set(3,2,-2);scene.add(fill);
 const camera=new T.OrthographicCamera(-1,1,1,-1,.01,20);camera.position.set(0,1.25,2);camera.lookAt(0,0,0);camera.updateMatrixWorld(true);
 const scratch=new T.Box3(),fit=new T.Box3(),corner=new T.Vector3(),target=new T.Vector3(),weapon=new T.Vector3();
 function beetle(species,name,heading,sizePermille){const anchor=new T.Group();anchor.name=name;const model=createInsectModel(species,{inspection:true,sizePermille});anchor.add(model);scene.add(anchor);model.updateMatrixWorld(true);scratch.setFromObject(model);const front=scratch.max.z,height=scratch.max.y-scratch.min.y;const body=model.userData.visual?.userData.bodyBounds;if(body)scratch.copy(body).applyMatrix4(model.userData.visual.matrixWorld);else scratch.setFromObject(model.userData.bodyMesh);const bodyCenter=scratch.getCenter(new T.Vector3());anchor.rotation.y=heading;return{species,anchor,model,front,height,bodyCenter,heading,baseX:0,restY:0,rig:null};}
 const player=beetle(playerSpecies,'battle-player',Math.PI/2,playerSizePermille),opponent=beetle(opponentSpecies,'battle-opponent',-Math.PI/2,opponentSizePermille),entries={player,opponent};
 const scaledGiantPair=[player,opponent].some(e=>e.species==='giantstag'&&e.model.userData.individualScale>1);
 const scaledAtlasPair=[player,opponent].some(e=>e.species==='atlas'&&e.model.userData.individualScale>1);
 player.baseX=-.01-player.front;opponent.baseX=.01+opponent.front;
 function place(e,x,y,z=0,pitch=0,roll=0){e.anchor.position.set(x,y,z);e.anchor.rotation.set(pitch,e.heading,roll,'YXZ');e.anchor.updateMatrixWorld(true);}
 for(const e of[player,opponent]){place(e,e.baseX,0);scratch.setFromObject(e.anchor);e.restY=-scratch.min.y;place(e,e.baseX,e.restY);e.rig=createBattleRig(e.model,e.species,{groundedKnees:scaledGiantPair&&e.species==='giantstag'||scaledAtlasPair});e.rig.resetFeet();}
 scratch.setFromObject(player.anchor);fit.copy(scratch);scratch.setFromObject(opponent.anchor);fit.union(scratch);const radius=Math.max(.65,Math.abs(fit.min.x),Math.abs(fit.max.x))+.36;
 const ringRadius=radius*.78;
 const positiveEnd=ringRadius-corner.copy(opponent.bodyCenter).applyMatrix4(opponent.anchor.matrixWorld).x,negativeEnd=-ringRadius-corner.copy(player.bodyCenter).applyMatrix4(player.anchor.matrixWorld).x;
 function outwardEnd(e,sign){const box=e.rig.torsoBox(new T.Box3()),feet=e.rig.legs.map(l=>l.foot.clone().applyMatrix4(l.mesh.matrixWorld).x);return sign>0?Math.max(ringRadius+.035-box.min.x,ringRadius+.025-Math.min(...feet)):Math.min(-ringRadius-.035-box.max.x,-ringRadius-.025-Math.max(...feet));}
 const positiveOutEnd=outwardEnd(opponent,1),negativeOutEnd=outwardEnd(player,-1);
 // Preserve the winning line; add only a safe floor beyond it, never a fall.
 let platformRadius=radius;for(const offset of[positiveOutEnd,negativeOutEnd])for(const e of[player,opponent]){scratch.setFromObject(e.anchor);for(const x of[scratch.min.x,scratch.max.x])for(const z of[scratch.min.z,scratch.max.z])platformRadius=Math.max(platformRadius,Math.hypot(x+offset,z)+.08);}
 const side=new T.MeshStandardMaterial({color:'#695344',roughness:.96}),top=new T.MeshStandardMaterial({color:'#a18766',roughness:.92});const stump=new T.Mesh(new T.CylinderGeometry(platformRadius,platformRadius*1.015,.14,48),[side,top,top]);stump.name='battle-stump';stump.position.y=-.07;scene.add(stump);
 const ring=new T.Mesh(new T.TorusGeometry(ringRadius,.003,6,64),new T.MeshStandardMaterial({color:'#f1eddf',roughness:1}));ring.name='battle-ring';ring.rotation.x=Math.PI/2;ring.position.y=.001;scene.add(ring);
 const mapPosition=value=>{const p=clamp(finite(value),-4,4);return p>=0?p/4*positiveEnd:-p/4*negativeEnd;},closeSize=fit.getSize(new T.Vector3()).addScalar(.20);
 const dust=new T.Group();dust.name='battle-contact-dust';scene.add(dust);const dustGeometry=new T.SphereGeometry(.006,5,3),dustMaterial=new T.MeshBasicMaterial({color:'#bfa67e',transparent:true,opacity:0,depthWrite:false});for(let i=0;i<4;i++)dust.add(new T.Mesh(dustGeometry,dustMaterial));dust.visible=false;
 let hasRendered=false,lastReduced=false,lastPosition=null,lastOutcomeKey=null,ringFocusSide=null,disposed=false,viewAspect=1,exchangeKey=null,age=0,started=false,contactSent=false,settledSent=false,lastPresentation={events:[],finished:false,age:0,stage:'settled',settled:true,contactActive:false,exchangeNumber:0,actor:null,family:null,ringOutVisible:false,ringOutSide:null};
 function frameBeetles(){scratch.setFromObject(player.anchor);fit.copy(scratch);scratch.setFromObject(opponent.anchor);fit.union(scratch);const centre=fit.getCenter(new T.Vector3()),safe=fit.clone().expandByScalar(.035),stable=new T.Box3().setFromCenterAndSize(centre,closeSize);safe.union(stable);if(ringFocusSide){const sign=ringFocusSide==='opponent'?1:-1;for(const z of[-.18,0,.18])safe.expandByPoint(new T.Vector3(sign*Math.sqrt(ringRadius*ringRadius-z*z),.001,z));}let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;camera.updateMatrixWorld(true);for(const x of[safe.min.x,safe.max.x])for(const y of[safe.min.y,safe.max.y])for(const z of[safe.min.z,safe.max.z]){corner.set(x,y,z).applyMatrix4(camera.matrixWorldInverse);minX=Math.min(minX,corner.x);maxX=Math.max(maxX,corner.x);minY=Math.min(minY,corner.y);maxY=Math.max(maxY,corner.y);}const span=Math.max((maxX-minX)/(.88*viewAspect),(maxY-minY)/.58),cx=(minX+maxX)/2,cy=(minY+maxY)/2;camera.left=cx-span*viewAspect/2;camera.right=cx+span*viewAspect/2;camera.top=cy+span/2;camera.bottom=cy-span/2;camera.updateProjectionMatrix();}
 function resize(next){if(disposed)return;viewAspect=clamp(finite(next,1),.1,10);frameBeetles();}
 function reset(){if(disposed)return;hasRendered=false;ringFocusSide=null;lastOutcomeKey=null;scene.userData.battleRingOut=null;exchangeKey=null;age=0;started=false;contactSent=false;settledSent=false;for(const e of[player,opponent]){e.rig.restore();place(e,e.baseX,e.restY);e.rig.resetFeet();}dust.visible=false;lastPresentation={events:[],finished:false,age:0,stage:'settled',settled:true,contactActive:false,exchangeNumber:0,actor:null,family:null,ringOutVisible:false,ringOutSide:null};}
 function getPresentation(){return{...lastPresentation,events:[]};}
 function update(snapshot={},dt=0,{reducedMotion=false,clipAge=null}={}){
  if(disposed)return{...getPresentation(),events:[]};const step=clamp(finite(dt),0,.1),last=snapshot.phase==='cancelled'?null:snapshot.lastExchange,key=last?`${last.number??snapshot.exchanges}:${finite(last.positionBefore)}:${finite(last.positionAfter)}`:null,events=[];
  const declaredWinner=snapshot.winner==='player'||snapshot.winner==='opponent',ringOut=snapshot.phase==='finished'&&declaredWinner&&snapshot.finishReason==='ring-out'&&(snapshot.winner==='player'?snapshot.position===4:snapshot.position===-4),ringOutSide=ringOut?(snapshot.winner==='player'?'opponent':'player'):null,settleAt=ringOut?RING_OUT_CHOREOGRAPHY.settledSeconds:BATTLE_CHOREOGRAPHY.settledSeconds,outcomeKey=`${snapshot.phase}:${snapshot.winner}:${snapshot.finishReason}`;
  if(hasRendered&&step===0&&key===exchangeKey&&lastReduced===reducedMotion&&lastPosition===snapshot.position&&lastOutcomeKey===outcomeKey)return{...getPresentation(),events:[]};
  hasRendered=true;lastReduced=reducedMotion;lastPosition=snapshot.position;lastOutcomeKey=outcomeKey;ringFocusSide=ringOutSide;
  if(key!==exchangeKey){exchangeKey=key;age=0;started=false;contactSent=false;settledSent=false;for(const e of[player,opponent])e.rig.resetFeet();}
  if(last&&step>0){if(!started){started=true;events.push({type:'started',key,exchange:last});}else age=Math.min(settleAt,age+step);if(Number.isFinite(clipAge))age=Math.max(age,Math.min(settleAt,clipAge));if(age>=BATTLE_CHOREOGRAPHY.contactSeconds&&!contactSent){contactSent=true;events.push({type:'contact',key,exchange:last});}if(age>=settleAt-1e-10&&!settledSent){age=settleAt;settledSent=true;events.push({type:'settled',key,exchange:last});}}
  const choreography=sampleBattleChoreography(last,age,{playerSpecies,opponentSpecies,reducedMotion,ringOut}),position=ringOut?(ringOutSide==='opponent'?positiveOutEnd:negativeOutEnd):mapPosition(snapshot.position),before=last?mapPosition(last.positionBefore):position,display=before+(position-before)*choreography.translation;
  const attack=entries[choreography.actor]||player,receive=attack===player?opponent:player,sign=attack===player?1:-1;
  if(!choreography.active||reducedMotion){for(const e of[player,opponent]){e.rig.restore();place(e,e.baseX+position,e.restY);e.rig.resetFeet();}}
  else{
   const c=choreography.contact,lift=choreography.drive,prepare=choreography.crouch,jaw=choreography.family==='jaw',defPitch=ringOut?-.03*c-.04*lift:-.05*c-.10*lift,defRoll=jaw?(ringOut?.025:.07)*lift:0;
   const rear=new T.Vector3(0,-receive.restY,-.065*receive.rig.scale).applyEuler(new T.Euler(defPitch,0,defRoll,'YXZ'));
   place(receive,receive.baseX+display,-rear.y,0,defPitch,defRoll);receive.rig.setJaws(.04*c+.06*lift);receive.rig.setWeaponPitch(0);
   const pitch=(['elephant','goliath','fivehorn'].includes(attack.species)?0:attack.species==='atlas'?.08:attack.species==='rhino'?.12:['stag','giantstag','miyama'].includes(attack.species)?0:jaw?.10:.20)*prepare-(jaw?.10:['rhino','atlas','elephant','goliath','fivehorn'].includes(attack.species)?.04:.15)*lift;
   place(attack,attack.baseX+display,attack.restY-.006*prepare,0,pitch,jaw?-.025*lift:0);attack.rig.setJaws(.20*prepare-(attack.species==='miyama'?.10:.16)*c+.035*lift);attack.rig.setWeaponPitch(.65*prepare-.08*lift);
   attack.rig.resetContactTargets();receive.rig.resetContactTargets();
   if(attack.species==='goliath'){attack.rig.selectFrontWeapon(sign);if(receive.species==='miyama')receive.rig.selectFrontJawContact(-sign);else receive.rig.selectFrontContact(-sign);}
   if(attack.species==='fivehorn'){attack.rig.selectFrontWeapon(sign,-1.5);receive.rig.selectFrontContact(-sign,1.5);}
   receive.rig.contactWorld(target);attack.rig.weaponWorld(weapon);const offset=target.clone().sub(weapon);attack.anchor.position.x+=offset.x*c*.5;receive.anchor.position.x-=offset.x*c*.5;attack.anchor.position.z+=offset.z*c*.5;receive.anchor.position.z-=offset.z*c*.5;attack.anchor.position.y+=offset.y*c;attack.anchor.updateMatrixWorld(true);receive.anchor.updateMatrixWorld(true);
   // Keep the rigid abdomen/head above the stage; the receiver follows the same
   // tiny vertical correction so designated weapon contact cannot separate.
   let low=attack.rig.torsoBox(scratch).min.y;if(['elephant','goliath','fivehorn'].includes(attack.species)){const mesh=attack.rig.weapon.mesh,a=mesh.geometry.attributes.position;for(let i=0;i<a.count;i++)low=Math.min(low,corner.fromBufferAttribute(a,i).applyMatrix4(mesh.matrixWorld).y);}if(low<.002){const correction=.002-low;attack.anchor.position.y+=correction;if(c>.999)receive.anchor.position.y+=correction;attack.anchor.updateMatrixWorld(true);receive.anchor.updateMatrixWorld(true);}
   // Keep the curved jaw shafts just below the receiving belly. This is a
   // 1.5mm render-contact clearance, not a different capture or battle rule.
   // The existing 2mm torso-floor margin leaves the rigid body above the table.
   if(attack.species==='miyama'){attack.anchor.position.y-=.0015*c;attack.anchor.updateMatrixWorld(true);}
   // A final horizontal shove advances by real steps; do not keep the hind
   // feet pinned to the earlier contact point while the torso crosses the line.
   const footStage=ringOut&&age>=.62&&choreography.stage==='drive'?'release':choreography.stage;
   for(const e of[player,opponent])e.rig.updateFeet({dt:step,age,yaw:e.heading,stage:footStage,lift:e===receive&&!ringOut?lift:0,attacker:e===attack,recovery:choreography.footRecovery});
  }
  attack.rig.weaponWorld(weapon);receive.rig.contactWorld(target);
  const contactInfo={actor:choreography.actor,family:choreography.family,stage:choreography.stage,active:choreography.contactActive,weaponPoint:weapon.clone(),bodyPoint:target.clone(),distance:weapon.distanceTo(target),weaponMesh:attack.rig.weapon.mesh,bodyMesh:receive.rig.contactPatch.mesh};scene.userData.battleContact=contactInfo;
  dust.visible=!reducedMotion&&choreography.contactActive&&age<.70;if(dust.visible){dust.position.copy(target);const p=(age-.46)/.24;dustMaterial.opacity=.28*(1-p);dust.children.forEach((m,i)=>{const a=i*Math.PI/2;m.position.set(Math.cos(a)*(.004+p*.04),.004+Math.sin(p*Math.PI)*.008,Math.sin(a)*(.004+p*.03));});}
  let ringOutVisible=false;if(ringOutSide){const loser=entries[ringOutSide],sign=ringOutSide==='opponent'?1:-1,body=loser.rig.torsoBox(new T.Box3()),inner=sign>0?body.min.x:-body.max.x;let outsideSupport=0;for(const leg of loser.rig.legs){const p=leg.foot.clone().applyMatrix4(leg.mesh.matrixWorld);if(sign*p.x>ringRadius+.012&&Math.abs(p.y)<2e-5)outsideSupport++;}ringOutVisible=inner>ringRadius+.012&&outsideSupport>=3;scene.userData.battleRingOut={side:ringOutSide,ringRadius,innerBodyEdge:inner,outsideSupport,visible:ringOutVisible};}else scene.userData.battleRingOut=null;
  const finished=snapshot.phase==='finished'&&choreography.settled&&(!declaredWinner||ringOut&&ringOutVisible);
  lastPresentation={events,finished,ringOutVisible,ringOutSide,exchangeNumber:last?.number??snapshot.exchanges??0,age,stage:choreography.stage,contactActive:choreography.contactActive,settled:choreography.settled,actor:last?choreography.actor:null,family:last?choreography.family:null};frameBeetles();return{...lastPresentation};
 }
 function dispose(){if(disposed)return;disposed=true;for(const e of[player,opponent])e.rig.dispose();const geometries=new Set(),materials=new Set();scene.traverse(n=>{if(n.geometry)geometries.add(n.geometry);if(n.material)for(const m of Array.isArray(n.material)?n.material:[n.material])materials.add(m);});for(const g of geometries)g.dispose();for(const m of materials)m.dispose();scene.clear();}
 resize(aspect);update({phase:'watching',position:0,lastExchange:null},0,{reducedMotion:true});return{scene,camera,update,resize,dispose,reset,getPresentation};
}
