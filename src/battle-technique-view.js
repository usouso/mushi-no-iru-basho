import {createInsectModel} from './insect-models.js?v=0.67.0&b=06ee2abee345';
import {createBattleRig} from './battle-pose.js?v=0.67.0&b=06ee2abee345';
import {createJawGrip} from './battle-technique-contact.js?v=0.67.0&b=06ee2abee345';
import {sampleTechniqueTimeline, BATTLE_TECHNIQUE_TIMING, RING_OUT_TECHNIQUE_TIMING} from './battle-technique-timeline.js?v=0.67.0&b=06ee2abee345';
/** Two original paired move families over existing independent beetle models.
 * Presentation only: resolved rules/collection/field simulation remain unchanged. */
const T=window.THREE,finite=(n,f=0)=>Number.isFinite(n)?n:f,clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const smooth=x=>{const u=clamp(x,0,1);return u*u*(3-2*u);},ramp=(t,a,b)=>smooth((t-a)/(b-a));
export function createTechniqueBattleView({playerSpecies,opponentSpecies,playerSizePermille=null,opponentSizePermille=null,aspect=1}={}){
 if(!['rhino','stag'].includes(playerSpecies)||!['rhino','stag'].includes(opponentSpecies))throw new TypeError('Technique lab currently supports rhino/stag pairs only');
 const scene=new T.Scene();scene.background=new T.Color('#647368');scene.add(new T.HemisphereLight('#f7f1db','#475640',1.15));const sun=new T.DirectionalLight('#ffe9c8',1.2);sun.position.set(-2,4,3);scene.add(sun);const fill=new T.DirectionalLight('#cce2e4',.5);fill.position.set(3,2,-2);scene.add(fill);
 const camera=new T.OrthographicCamera(-1,1,1,-1,.01,20);camera.position.set(0,1.25,2);camera.lookAt(0,0,0);camera.updateMatrixWorld(true);
 const scratch=new T.Box3(),fit=new T.Box3(),corner=new T.Vector3(),target=new T.Vector3(),weapon=new T.Vector3();
 function beetle(species,name,heading,sizePermille){const anchor=new T.Group();anchor.name=name;const model=createInsectModel(species,{inspection:true,sizePermille});anchor.add(model);scene.add(anchor);model.updateMatrixWorld(true);scratch.setFromObject(model);const front=scratch.max.z,height=scratch.max.y-scratch.min.y;const body=model.userData.visual?.userData.bodyBounds;if(body)scratch.copy(body).applyMatrix4(model.userData.visual.matrixWorld);else scratch.setFromObject(model.userData.bodyMesh);const bodyCenter=scratch.getCenter(new T.Vector3());anchor.rotation.y=heading;return{species,anchor,model,front,height,bodyCenter,heading,baseX:0,restY:0,rig:null};}
 const player=beetle(playerSpecies,'battle-player',Math.PI/2,playerSizePermille),opponent=beetle(opponentSpecies,'battle-opponent',-Math.PI/2,opponentSizePermille),entries={player,opponent};
 player.baseX=-.01-player.front;opponent.baseX=.01+opponent.front;
 function place(e,x,y,z=0,pitch=0,roll=0){e.anchor.position.set(x,y,z);e.anchor.rotation.set(pitch,e.heading,roll,'YXZ');e.anchor.updateMatrixWorld(true);}
 for(const e of[player,opponent]){place(e,e.baseX,0);scratch.setFromObject(e.anchor);e.restY=-scratch.min.y;place(e,e.baseX,e.restY);e.rig=createBattleRig(e.model,e.species,{groundedKnees:true});e.rig.resetFeet();}
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

 const calibrations=new Map();
 function calibrate(side){
  const attack=entries[side],receive=attack===player?opponent:player;
  for(const e of[player,opponent]){e.rig.restore();place(e,e.baseX,e.restY);}
  let grip=null,baseHead=0,basePitch=0;
  if(attack.species==='stag'){
   grip=createJawGrip(attack.rig,receive.rig);attack.rig.setJaws(grip.jawAmount);
   const desired=grip.contacts().reduce((sum,p)=>sum+p.body.y,0)/2;let lo=-.35,hi=.15;
   for(let n=0;n<32;n++){const a=(lo+hi)/2;place(attack,attack.baseX,attack.restY,0,a);const y=grip.contacts().reduce((sum,p)=>sum+p.weapon.y,0)/2;if(y>desired)lo=a;else hi=a;}
   basePitch=(lo+hi)/2;place(attack,attack.baseX,attack.restY,0,basePitch);
  }else{
   const desired=receive.rig.contactWorld().y;let lo=.40,hi=1;
   for(let n=0;n<32;n++){const a=(lo+hi)/2;attack.rig.setWeaponPitch(a);if(attack.rig.weaponWorld().y>desired)lo=a;else hi=a;}
   baseHead=(lo+hi)/2;attack.rig.setWeaponPitch(baseHead);
  }
  const offset=grip?grip.alignmentDelta():attack.rig.weaponWorld().sub(receive.rig.contactWorld());
  const result={grip,baseHead,basePitch,attackOffset:new T.Vector3(-offset.x*.5,0,-offset.z*.5),receiveOffset:new T.Vector3(offset.x*.5,0,offset.z*.5)};
  calibrations.set(side,result);return result;
 }
 calibrate('player');calibrate('opponent');
 function neutral(e,position){e.rig.restore();place(e,e.baseX+position,e.restY);}
 function reset(){if(disposed)return;hasRendered=false;ringFocusSide=null;lastOutcomeKey=null;scene.userData.battleRingOut=null;exchangeKey=null;age=0;started=false;contactSent=false;settledSent=false;for(const e of[player,opponent]){neutral(e,0);e.rig.resetFeet();e.supportAnchors=null;}dust.visible=false;lastPresentation={events:[],finished:false,age:0,stage:'settled',settled:true,contactActive:false,exchangeNumber:0,actor:null,family:null,ringOutVisible:false,ringOutSide:null};}
 function getPresentation(){return{...lastPresentation,events:[]};}
 function update(snapshot={},dt=0,{reducedMotion=false,clipAge=null}={}){
  if(disposed)return{...getPresentation(),events:[]};const step=clamp(finite(dt),0,.1),last=snapshot.phase==='cancelled'?null:snapshot.lastExchange,key=last?`${last.number??snapshot.exchanges}:${finite(last.positionBefore)}:${finite(last.positionAfter)}`:null,events=[];
  const declaredWinner=snapshot.winner==='player'||snapshot.winner==='opponent',ringOut=snapshot.phase==='finished'&&declaredWinner&&snapshot.finishReason==='ring-out'&&(snapshot.winner==='player'?snapshot.position===4:snapshot.position===-4),ringOutSide=ringOut?(snapshot.winner==='player'?'opponent':'player'):null,timing=ringOut?RING_OUT_TECHNIQUE_TIMING:BATTLE_TECHNIQUE_TIMING,settleAt=timing.settledSeconds,outcomeKey=`${snapshot.phase}:${snapshot.winner}:${snapshot.finishReason}`;
  if(hasRendered&&step===0&&key===exchangeKey&&lastReduced===reducedMotion&&lastPosition===snapshot.position&&lastOutcomeKey===outcomeKey)return{...getPresentation(),events:[]};
  hasRendered=true;lastReduced=reducedMotion;lastPosition=snapshot.position;lastOutcomeKey=outcomeKey;ringFocusSide=ringOutSide;
  if(key!==exchangeKey){exchangeKey=key;age=0;started=false;contactSent=false;settledSent=false;for(const e of[player,opponent]){e.rig.resetFeet();e.supportAnchors=null;}}
  if(last&&step>0){if(!started){started=true;events.push({type:'started',key,exchange:last});}else age=Math.min(settleAt,age+step);if(Number.isFinite(clipAge))age=Math.max(age,Math.min(settleAt,clipAge));if(age>=timing.contactSeconds&&!contactSent){contactSent=true;events.push({type:'contact',key,exchange:last});}if(age>=settleAt-1e-10&&!settledSent){age=settleAt;settledSent=true;events.push({type:'settled',key,exchange:last});}}
  const pose=sampleTechniqueTimeline(last,age,{playerSpecies,opponentSpecies,reducedMotion,ringOut}),position=ringOut?(ringOutSide==='opponent'?positiveOutEnd:negativeOutEnd):mapPosition(snapshot.position),before=last?mapPosition(last.positionBefore):position;
  const attack=entries[pose.actor]||player,receive=attack===player?opponent:player,sign=attack===player?1:-1,cal=calibrations.get(pose.actor||'player'),jaw=attack.species==='stag';
  function attached(at){
   const q=sampleTechniqueTimeline(last,at,{playerSpecies,opponentSpecies,ringOut}),reach=ramp(at,.18,.46),ready=ramp(at,0,.18),lift=q.lift,twist=q.twist;
   const aPitch=jaw?cal.basePitch*ready-.06*lift:0,yaw=jaw?sign*.35*twist:0;
   place(attack,attack.baseX+before+cal.attackOffset.x*reach,attack.restY,cal.attackOffset.z*reach,aPitch);attack.anchor.rotation.y=attack.heading+yaw;attack.anchor.updateMatrixWorld(true);
   attack.rig.setWeaponPitch(jaw?0:cal.baseHead*ready-.70*lift);attack.rig.setJaws(jaw?cal.grip.jawAmount*reach+.25*q.prepare:0);
   place(receive,receive.baseX+before+cal.receiveOffset.x*reach,receive.restY,cal.receiveOffset.z*reach,(jaw?(receive.species==='stag'?.30:.35):-.25)*lift);receive.anchor.rotation.y=receive.heading+yaw;receive.anchor.updateMatrixWorld(true);receive.rig.setWeaponPitch(receive.species==='rhino'?-.10*lift:0);receive.rig.setJaws(receive.species==='stag'?.4*reach:0);
   const shift=cal.grip?cal.grip.alignmentDelta():attack.rig.weaponWorld().sub(receive.rig.contactWorld());receive.anchor.position.addScaledVector(shift,reach);receive.anchor.updateMatrixWorld(true);
   return q;
  }
  if(!pose.active||reducedMotion){for(const e of[player,opponent]){neutral(e,position);e.rig.resetFeet();e.supportAnchors=null;}}
  else{
   const supportStart=timing.contactSeconds-.08;
   if(!player.supportAnchors||!opponent.supportAnchors){
    // Evaluate canonical exchange start and the exact engagement-start pose.
    // No frame, event, clock or random draw is advanced by these samples.
    attached(0);for(const e of[player,opponent])e.rig.resetFeet();
    attached(supportStart);for(const e of[player,opponent])e.supportAnchors=e.rig.sampleSupportFeet({age:supportStart,yaw:e.anchor.rotation.y});
   }
   let air=0;
   if(age<=timing.releaseSeconds){const q=attached(age);air=Math.max(q.lift,q.twist);}
   else{
    attached(timing.releaseSeconds);const aStart={p:attack.anchor.position.clone(),q:attack.anchor.quaternion.clone()},rStart={p:receive.anchor.position.clone(),q:receive.anchor.quaternion.clone()};
    const u=ramp(age,timing.releaseSeconds,timing.groundSeconds),finish=ramp(age,timing.releaseSeconds,timing.recoverySeconds),aEnd=new T.Vector3(attack.baseX+position,attack.restY,0),rEnd=new T.Vector3(receive.baseX+position,receive.restY,0),aQ=new T.Quaternion().setFromEuler(new T.Euler(0,attack.heading,0,'YXZ')),rQ=new T.Quaternion().setFromEuler(new T.Euler(0,receive.heading,0,'YXZ'));
    attack.anchor.position.copy(aStart.p).lerp(aEnd,finish);attack.anchor.quaternion.copy(aStart.q).slerp(aQ,finish);attack.rig.setWeaponPitch((cal.baseHead-.70*(pose.technique==='hold'?0:1))*(1-finish));attack.rig.setJaws(jaw?(cal.grip.jawAmount+.25*pose.release)*(1-finish):0);attack.anchor.updateMatrixWorld(true);
    receive.anchor.position.copy(rStart.p).lerp(rEnd,u);if(pose.technique!=='hold')receive.anchor.position.y+=.045*Math.sin(Math.PI*u);receive.anchor.position.y-=.004*pose.landing;receive.anchor.quaternion.copy(rStart.q).slerp(rQ,u);receive.rig.setWeaponPitch(receive.species==='rhino'&&pose.technique!=='hold'?-.10*(1-u):0);receive.rig.setJaws(receive.species==='stag'?.4*(1-u):0);receive.anchor.updateMatrixWorld(true);
    // Keep the carried native stance during flight; do not reach toward a
    // remote floor target halfway through the throw. Establish fresh planted
    // supports at the landing position before the small compression/recovery.
    air=pose.technique==='hold'?0:age<timing.groundSeconds?1:0;
   }
   for(const e of[player,opponent]){
    const landed=e===receive&&pose.technique!=='hold'&&age>=timing.groundSeconds;
    if(landed)e.rig.resetFeet();
    e.rig.updateFeet({dt:step,age:landed?0:age,yaw:e.anchor.rotation.y,stage:landed?'settled':pose.stage,lift:0,attacker:e===attack,recovery:pose.recovery,airborne:e===receive?air:0,supportRelease:ramp(age,timing.releaseSeconds,timing.releaseSeconds+.08),supportEngage:age<=timing.releaseSeconds?ramp(age,supportStart,timing.contactSeconds):0,supportAnchors:age>supportStart?e.supportAnchors:null});
   }
  }
  const pairs=jaw?cal.grip.contacts():null;attack.rig.weaponWorld(weapon);receive.rig.contactWorld(target);if(pairs){weapon.copy(pairs[0].weapon);target.copy(pairs[0].body);}
  scene.userData.battleContact={actor:pose.actor,family:pose.family,stage:pose.stage,active:pose.contactActive,weaponPoint:weapon.clone(),bodyPoint:target.clone(),distance:pairs?Math.max(...pairs.map(p=>p.distance)):weapon.distanceTo(target),pairs,weaponMesh:pairs?.[0].jawMesh||attack.rig.weapon.mesh,bodyMesh:pairs?.[0].bodyMesh||receive.rig.contactPatch.mesh};
  scene.userData.battleTechnique={technique:pose.technique,age,receiver:receive===player?'player':'opponent',lift:pose.lift,twist:pose.twist,airborneFeet:receive.rig.legs.filter(l=>!l.contact).length};
  dust.visible=!reducedMotion&&pose.contactActive&&age<.70;if(dust.visible){dust.position.copy(target);const p=(age-.46)/.24;dustMaterial.opacity=.28*(1-p);dust.children.forEach((m,i)=>{const a=i*Math.PI/2;m.position.set(Math.cos(a)*(.004+p*.04),.004+Math.sin(p*Math.PI)*.008,Math.sin(a)*(.004+p*.03));});}
  let ringOutVisible=false;if(ringOutSide){const loser=entries[ringOutSide],sign=ringOutSide==='opponent'?1:-1,body=loser.rig.torsoBox(new T.Box3()),inner=sign>0?body.min.x:-body.max.x;let outsideSupport=0;for(const leg of loser.rig.legs){const p=leg.foot.clone().applyMatrix4(leg.mesh.matrixWorld);if(sign*p.x>ringRadius+.012&&Math.abs(p.y)<2e-5)outsideSupport++;}ringOutVisible=inner>ringRadius+.012&&outsideSupport>=3;scene.userData.battleRingOut={side:ringOutSide,ringRadius,innerBodyEdge:inner,outsideSupport,visible:ringOutVisible};}else scene.userData.battleRingOut=null;
  const finished=snapshot.phase==='finished'&&pose.settled&&(!declaredWinner||ringOut&&ringOutVisible),moveName=pose.technique==='horn-lift'?'角すくい投げ':pose.technique==='jaw-turn'?'大あごひねり':'組み合い',receiverName=pose.technique==='hold'?'踏ん張る':pose.stage==='drive'?(jaw?'崩される':'持ち上がる'):['release','recover'].includes(pose.stage)?'受け身':'踏ん張る';
  lastPresentation={events,finished,ringOutVisible,ringOutSide,exchangeNumber:last?.number??snapshot.exchanges??0,age,stage:pose.stage,contactActive:pose.contactActive,settled:pose.settled,actor:last?pose.actor:null,family:last?pose.family:null,technique:pose.technique,moveName,receiverName};frameBeetles();return{...lastPresentation};
 }
 function dispose(){if(disposed)return;disposed=true;for(const e of[player,opponent])e.rig.dispose();const geometries=new Set(),materials=new Set();scene.traverse(n=>{if(n.geometry)geometries.add(n.geometry);if(n.material)for(const m of Array.isArray(n.material)?n.material:[n.material])materials.add(m);});for(const g of geometries)g.dispose();for(const m of materials)m.dispose();scene.clear();}
 reset();resize(aspect);update({phase:'watching',position:0,lastExchange:null},0,{reducedMotion:true});return{scene,camera,update,resize,dispose,reset,getPresentation};
}
