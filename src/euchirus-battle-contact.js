import {sampleEuchirusPose,EUCHIRUS_DIMENSIONS as D} from './euchirus-kinematics.js?v=0.64.0&b=3616c2fe808e';
import {updateEuchirusModel} from './euchirus-model.js?v=0.64.0&b=3616c2fe808e';
/** Euchirus-only contact choreography; not observed combat.
 * The caller owns the opponent and its grounded retreat animation. No rule,
 * clock, outcome or species registry is owned by this geometry helper. */
const T=window.THREE,V=p=>new T.Vector3(p.x,p.y,p.z),point=v=>({x:v.x,y:v.y,z:v.z}),clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
function solve(front,foot,direction){
 const hip=V(front.hip),ankle=foot.clone().addScaledVector(direction,.030),delta=ankle.clone().sub(hip),r=delta.length(),U=D.frontUpperLength,L=D.frontLowerLength;
 if(r<=Math.abs(U-L)+1e-8||r>=U+L-1e-8)throw new RangeError('Native foreleg cannot reach this contact; move staging, not bones');
 const a=(U*U-L*L+r*r)/(2*r),h=Math.sqrt(U*U-a*a),n=Math.hypot(delta.x,delta.z);if(n<1e-8)throw new RangeError('Degenerate foreleg bending plane');
 const knee=hip.clone().addScaledVector(delta,a/r).add(new T.Vector3(front.side*delta.z/n,0,-front.side*delta.x/n).multiplyScalar(h));
 return{...front,hip:point(hip),knee:point(knee),ankle:point(ankle),foot:point(foot),tarsus:point(foot)};
}
/** Uses actual indexed mesh vertices. targets may be supplied by an offline
 * audited pair preset; automatic selection is a geometric proposal, NOT a
 * collision certificate. Actor must be upright, native scale, at rest. */
export function createEuchirusContactPlan({actor,opponent,targetMeshes,targets=null,retreatDistance=.020}){
 if(actor?.userData?.species!=='euchirus'||!opponent||!targetMeshes?.length)throw new TypeError('Actor, opponent and actual target meshes required');
 if(!Number.isFinite(retreatDistance)||retreatDistance<0||retreatDistance>.030)throw new RangeError('Bounded contact lab retreat only');
 actor.updateMatrixWorld(true);opponent.updateMatrixWorld(true);
 if(Math.abs(actor.scale.x-1)+Math.abs(actor.scale.y-1)+Math.abs(actor.scale.z-1)>1e-9||actor.quaternion.angleTo(new T.Quaternion())>1e-9)throw new RangeError('Lab actor is upright native scale');
 const inv=actor.matrixWorld.clone().invert(),base=sampleEuchirusPose(),contacts=[];
 for(const side of[-1,1]){
  const normal=new T.Vector3(side*.45,.12,-1).normalize();let chosen=targets?.find(x=>x.side===side),best=-Infinity;
  if(!chosen)for(const mesh of targetMeshes){const a=mesh.geometry.attributes.position;for(let index=0;index<a.count;index++){const world=new T.Vector3().fromBufferAttribute(a,index).applyMatrix4(mesh.matrixWorld),local=world.clone().applyMatrix4(inv);if(side*local.x<.015||side*local.x>.12||local.y<-.025||local.y>.10)continue;const score=world.dot(normal);if(score>best){best=score;chosen={mesh,index,side};}}}
  if(!chosen||!targetMeshes.includes(chosen.mesh)||!Number.isInteger(chosen.index)||chosen.index<0||chosen.index>=chosen.mesh.geometry.attributes.position.count)throw new RangeError('No actual front contact vertex');
  const world=new T.Vector3().fromBufferAttribute(chosen.mesh.geometry.attributes.position,chosen.index).applyMatrix4(chosen.mesh.matrixWorld),local=world.clone().applyMatrix4(inv);
  contacts.push({...chosen,side,localPoint:point(new T.Vector3().fromBufferAttribute(chosen.mesh.geometry.attributes.position,chosen.index)),actorPoint:point(local),normal:point(normal)});
 }
 const plan={actorPosition:point(actor.position),contacts,retreatDistance,base};
 for(const progress of[0,.15,.3,.475,.65,.825,1])sampleEuchirusContactPose(plan,progress);
 return plan;
}
export function sampleEuchirusContactPose(plan,progress){
 if(!Number.isFinite(progress))throw new TypeError('Finite normalized progress required');const p=clamp(progress),reach=p<.3?smooth(p/.3):p<=.65?1:1-smooth((p-.65)/.35),push=smooth((p-.3)/.35)*plan.retreatDistance,contact=p>=.3&&p<=.65;
 const legs=plan.base.legs.map(front=>{if(front.role!=='front')return{...front};const c=plan.contacts.find(x=>x.side===front.side),target=V(c.actorPoint).add(new T.Vector3(0,0,push)),foot=V(front.foot).lerp(target,reach);foot.y+=.025*Math.sin(Math.PI*reach);const direction=V(front.ankle).sub(V(front.foot)).normalize().lerp(V(c.normal),reach).normalize(),leg=solve(front,foot,direction);leg.contact=p===0||p===1;leg.opponentContact=contact;return leg;});
 return{progress:p,legs,opponentOffset:{x:0,y:0,z:push},contact,phase:p<.3?'reach':p<=.65?'push':p<1?'replace':'rest'};
}
// Reuse the prototype's existing buffer layout. Geometry/material identity and
// segment widths/bow are preserved; no extra meshes or scale-based extension.
function writeLeg(leg,p){const attr=leg.mesh.geometry.attributes.position;for(const sec of leg.sections){const from=V(p[sec.from]),to=V(p[sec.to]),axis=to.clone().sub(from).normalize(),v=new T.Vector3().crossVectors(axis,new T.Vector3(0,1,0)).normalize(),u=new T.Vector3().crossVectors(v,axis).normalize(),outward=new T.Vector3(p.side,0,0).addScaledVector(axis,-p.side*axis.x).normalize();for(let k=0;k<leg.rings;k++){const t=k/(leg.rings-1),center=from.clone().lerp(to,t).addScaledVector(outward,sec.bend*Math.sin(Math.PI*t)),radius=sec.to==='foot'&&k===leg.rings-1?0:sec.radius*(1-.3*t);for(let j=0;j<leg.N;j++){const a=j/leg.N*Math.PI*2,q=center.clone().addScaledVector(u,radius*Math.cos(a)).addScaledVector(v,radius*Math.sin(a));attr.setXYZ(sec.offset+k*leg.N+j,q.x,q.y,q.z);}}attr.setXYZ(sec.offset+leg.rings*leg.N,from.x,from.y,from.z);attr.setXYZ(sec.offset+leg.rings*leg.N+1,to.x,to.y,to.z);}
 for(const key of['hip','knee','ankle','tarsus','foot'])leg[key]={...p[key]};leg.root={...p.hip};leg.contact=p.contact;leg.mesh.userData.contact=p.contact;leg.mesh.userData.opponentContact=p.opponentContact;attr.needsUpdate=true;leg.mesh.geometry.computeVertexNormals();leg.mesh.geometry.computeBoundingSphere();leg.mesh.geometry.computeBoundingBox();}
/** Self-pair exception: two real tapered forefoot endpoints meet, not chest
 * penetration. Both sets of four short legs keep their original world anchors.
 * The returned receiver is braced; the dedicated view supplies supported
 * replanting before handing it to the walking phase. */
export function createEuchirusSelfContactPlan({first,second,retreatDistance=.020}){
 if(first?.userData.species!=='euchirus'||second?.userData.species!=='euchirus'||!Number.isFinite(retreatDistance)||retreatDistance<0||retreatDistance>.020)throw new TypeError('Native self pair required');
 first.updateMatrixWorld(true);second.updateMatrixWorld(true);
 if(first.quaternion.angleTo(new T.Quaternion())>1e-9||second.quaternion.angleTo(new T.Quaternion(0,1,0,0))>1e-9||Math.abs(first.position.x-second.position.x)>1e-9||Math.abs(first.position.y-second.position.y)>1e-9||[first,second].some(m=>m.scale.toArray().some(s=>Math.abs(s-1)>1e-9)))throw new RangeError('Self lab requires upright, opposed native roots');
 const distance=second.position.z-first.position.z;if(distance<.58||distance>.62)throw new RangeError('Self contact staging must remain within .58–.62m');
 return{firstPosition:point(first.position),secondPosition:point(second.position),distance,retreatDistance,base:sampleEuchirusPose()};
}
function shortLeg(front,foot){const hip=V(front.hip),delta=foot.clone().sub(hip),r=delta.length(),U=.060,L=.055;if(r>=U+L||r<=Math.abs(U-L))throw new RangeError('Braced walking leg exceeds native reach');const a=(U*U-L*L+r*r)/(2*r),h=Math.sqrt(U*U-a*a),n=Math.hypot(delta.x,delta.z),bend=front.role==='hind'?-front.side:front.side,knee=hip.clone().addScaledVector(delta,a/r).add(new T.Vector3(-bend*delta.z/n,0,bend*delta.x/n).multiplyScalar(h));return{...front,knee:point(knee),ankle:point(foot),foot:point(foot),tarsus:point(foot),contact:true};}
export function sampleEuchirusSelfContactPose(plan,progress){
 if(!Number.isFinite(progress))throw new TypeError('Finite normalized progress required');const p=clamp(progress),reach=p<.3?smooth(p/.3):p<=.65?1:1-smooth((p-.65)/.35),push=smooth((p-.3)/.35)*plan.retreatDistance,contact=p>=.3&&p<=.65;
 const sides=[0,1].map(which=>{const legs=plan.base.legs.map(l=>{if(l.role!=='front')return which?shortLeg(l,V(l.foot).add(new T.Vector3(0,0,push))):{...l};const target=new T.Vector3(l.side*.115,0,plan.distance/2+push/2),foot=V(l.foot).lerp(target,reach);foot.y+=.015*Math.sin(Math.PI*reach);const direction=V(l.ankle).sub(V(l.foot)).normalize().lerp(new T.Vector3(0,0,-1),reach).normalize(),out=solve(l,foot,direction);out.contact=p===0||p===1;out.opponentContact=contact;return out;});return{position:{...(which?plan.secondPosition:plan.firstPosition),z:(which?plan.secondPosition.z+push:plan.firstPosition.z)},orientation:which?{x:0,y:1,z:0,w:0}:{x:0,y:0,z:0,w:1},legs};});
 return{progress:p,contact,push,sides};
}
// Explicit adapter hooks: solve native links from foot targets, never scale them.
export function solveEuchirusContactLeg(base,foot,direction=null){return base.role==='front'?solve(base,V(foot),direction?V(direction):V(base.ankle).sub(V(base.foot)).normalize()):shortLeg(base,V(foot));}
export function applyEuchirusContactLegs(root,state,legs){updateEuchirusModel(root,state);for(let i=0;i<6;i++)writeLeg(root.userData.legs[i],legs[i]);root.updateMatrixWorld(true);return root;}
