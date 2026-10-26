/** Opt-in field-only departure rig. Original inspection/battle model is unchanged.
 * Folding panels and timings are a display approximation, not measured wing venation. */
import {createRhinoModel,updateRhinoModel} from './rhino-model.js?v=0.37.0&b=4d59dc9955d7';
import {sampleRhinoPose,RHINO_DIMENSIONS as D} from './rhino-kinematics.js?v=0.37.0&b=4d59dc9955d7';
const T=window.THREE,TAU=Math.PI*2;
const number=(v,d=0)=>Number.isFinite(v)?v:d,unit=v=>Math.max(0,Math.min(1,number(v)));
export const RHINO_FLIGHT_RIG=Object.freeze({rootAboveSupport:D.rootAboveSupport,panelLength:.072,panelGap:.0015,upperLength:D.upperLegLength,lowerLength:D.lowerLegLength,minimumFlightWingAngle:.20,maximumFlightWingAngle:.80});
function panel(side,distal,material){
 const L=RHINO_FLIGHT_RIG.panelLength,outline=distal?[[0,0],[.010,0],[.032,-.030],[.004,-L],[0,-L]]:[[0,0],[.001,-.004],[.030,-.030],[.010,-L],[0,-L]],p=[],index=[];
 for(const[x,z]of outline)p.push(side*x,0,z);
 for(let i=1;i<outline.length-1;i++)index.push(0,i,i+1);
 if(!distal){const k=p.length/3;p.push(0,0,-L,side*.010,0,-L,0,.0015,-L,side*.010,.0015,-L);index.push(k,k+1,k+2,k+1,k+3,k+2);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(index);g.computeVertexNormals();g.computeBoundingSphere();
 const mesh=new T.Mesh(g,material);mesh.name=`rhino-flight-hindwing-${side}-${distal?1:0}`;mesh.userData={role:'hindwing',side,panel:distal?1:0};return mesh;
}
function ownedDispose(root){let done=false;root.userData.dispose=()=>{if(done)return;done=true;const gs=new Set(),ms=new Set();root.traverse(m=>{if(m.geometry)gs.add(m.geometry);for(const mat of(Array.isArray(m.material)?m.material:[m.material]))if(mat)ms.add(mat);});for(const g of gs)g.dispose();for(const m of ms)m.dispose();};}
export function createRhinoFlightModel(options={}){
 const root=createRhinoModel(options);ownedDispose(root);if(root.userData.inspection)return root;
 root.name='rhino-field-flight-lab';const data=root.userData,elytra=[];
 for(const mesh of data.elytra){const side=mesh.userData.side,pivot=new T.Group();pivot.position.set(0,.025,.050);root.add(pivot);root.remove(mesh);mesh.position.set(0,-.025,-.050);pivot.add(mesh);elytra.push({pivot,mesh,side});}
 const material=data.hindwings[0].material;for(const mesh of data.hindwings){root.remove(mesh);mesh.geometry.dispose();}
 const wings=[];for(const side of[-1,1]){const hinge=new T.Group();hinge.position.set(side*.009,.002,-.008);root.add(hinge);const proximal=panel(side,false,material),fold=new T.Group(),distal=panel(side,true,material);fold.position.set(0,.0015,-RHINO_FLIGHT_RIG.panelLength);hinge.add(proximal,fold);fold.add(distal);wings.push({side,hinge,fold,proximal,distal});}
 data.hindwings=wings.flatMap(w=>[w.proximal,w.distal]);data.flightRig={elytra,wings,legScratch:{a:new T.Vector3(),b:new T.Vector3(),axis:new T.Vector3(),u:new T.Vector3(),v:new T.Vector3()},pose:null};
 updateRhinoFlightModel(root,{});return root;
}
function legGeometry(leg,p,s){const a=leg.mesh.geometry.attributes.position;for(let bone=0;bone<2;bone++){const start=bone?p.knee:p.hip,end=bone?p.foot:p.knee;s.a.set(start.x,start.y,start.z);s.b.set(end.x,end.y,end.z);s.axis.copy(s.b).sub(s.a).normalize();s.u.set(0,1,0);s.v.crossVectors(s.axis,s.u).normalize();s.u.crossVectors(s.v,s.axis).normalize();for(let e=0;e<2;e++){const base=e?s.b:s.a,r=bone===1&&e===1?0:bone===0?.003:.002;for(let i=0;i<6;i++){const t=i/6*TAU;a.setXYZ(bone*14+e*6+i,base.x+r*(Math.cos(t)*s.u.x+Math.sin(t)*s.v.x),base.y+r*(Math.cos(t)*s.u.y+Math.sin(t)*s.v.y),base.z+r*(Math.cos(t)*s.u.z+Math.sin(t)*s.v.z));}}a.setXYZ(bone*14+12,s.a.x,s.a.y,s.a.z);a.setXYZ(bone*14+13,s.b.x,s.b.y,s.b.z);}a.needsUpdate=true;leg.mesh.geometry.computeVertexNormals();leg.mesh.geometry.computeBoundingSphere();leg.mesh.userData.foot={...p.foot};}
export function updateRhinoFlightModel(root,state={}){
 if(root.userData.inspection)return root;
 updateRhinoModel(root,state.flightPose?{...state,caught:false}:state);const rig=root.userData.flightRig;if(!rig)return root;
 const f=state.flightPose||{},e=unit(f.elytra),u=unit(f.unfold),t=unit(f.tuck),phase=number(f.flapPhase),amplitude=unit(f.flapAmplitude);
 for(const shell of rig.elytra){shell.pivot.rotation.order='YXZ';shell.pivot.rotation.set(.60*e,-shell.side*.90*e,0);}
 for(const w of rig.wings){w.hinge.rotation.order='YXZ';w.hinge.rotation.set(.50*u+.30*Math.sin(phase)*u**4*amplitude,-w.side*Math.PI/3*u,0);w.fold.rotation.x=Math.PI*(1-u);}
 const pose=sampleRhinoPose(state);if(t>0)for(let i=0;i<6;i++){const p=pose.legs[i],h=p.hip,side=p.side,role=['front','middle','hind'].indexOf(p.role),target={x:side*.062,y:-.035,z:h.z+[.015,0,-.015][role]};p.foot={x:p.foot.x+(target.x-p.foot.x)*t,y:p.foot.y+(target.y-p.foot.y)*t,z:p.foot.z+(target.z-p.foot.z)*t};const dx=p.foot.x-h.x,dy=p.foot.y-h.y,dz=p.foot.z-h.z,r=Math.hypot(dx,dy,dz),a=(D.upperLegLength**2-D.lowerLegLength**2+r*r)/(2*r),height=Math.sqrt(Math.max(0,D.upperLegLength**2-a*a)),n=Math.hypot(dx,dz),bend=role===2?-side:side;p.knee={x:h.x+dx*a/r-bend*dz/n*height,y:h.y+dy*a/r,z:h.z+dz*a/r+bend*dx/n*height};legGeometry(root.userData.legs[i],p,rig.legScratch);}
 rig.pose=pose;root.rotation.order='YXZ';root.rotation.set(number(f.pitch),number(state.heading),number(f.roll));root.updateMatrixWorld(true);return root;
}
