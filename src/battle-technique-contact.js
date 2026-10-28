/** Bounded bilateral stag grip over existing geometry. No rendered contact
 * markers, added colliders, model scaling, jaw stretching or body deformation.
 * Call at the opposed, unpitched calibration pose; the resulting two material
 * points remain valid under a shared rigid transform of both organisms, or
 * receiver rotation about its local lateral (X) contact line.
 */
const T=window.THREE;
const headCenters={rhino:[0,.012,.070],stag:[0,0,.065]};

function readVertex(mesh,index,out=new T.Vector3()){
 return out.fromBufferAttribute(mesh.geometry.attributes.position,index).applyMatrix4(mesh.matrixWorld);
}
function worldMaterialPoint(point,out=new T.Vector3()){
 const a=point.mesh.geometry.attributes.position;
 out.set(0,0,0);
 for(let k=0;k<3;k++)out.addScaledVector(new T.Vector3().fromBufferAttribute(a,point.indices[k]),point.weights[k]);
 return out.applyMatrix4(point.mesh.matrixWorld);
}
function headSides(rig){
 rig.syncSurfaces();
 const center=new T.Vector3(...headCenters[rig.species]),points=[];
 // Intersect actual triangles in both directions, independent of rendering
 // material sidedness. The nearest hit is the outside of the complete torso.
 for(const side of [-1,1]){
  const origin=center.clone();origin.x=side;
  origin.applyMatrix4(rig.model.matrixWorld);
  const direction=new T.Vector3(-side,0,0).transformDirection(rig.model.matrixWorld);
  const ray=new T.Ray(origin,direction),a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),hit=new T.Vector3();let best=null;
  for(const mesh of rig.torsoMeshes){
   const attr=mesh.geometry.attributes.position,index=mesh.geometry.index;
   for(let n=0;n<(index?.count??attr.count);n+=3){
    const indices=[0,1,2].map(k=>index?index.getX(n+k):n+k);
    readVertex(mesh,indices[0],a);readVertex(mesh,indices[1],b);readVertex(mesh,indices[2],c);
    if(!ray.intersectTriangle(a,b,c,false,hit))continue;
    const distance=origin.distanceToSquared(hit);
    if(best&&distance>=best.distance)continue;
    const bary=new T.Triangle(a,b,c).getBarycoord(hit,new T.Vector3());
    best={mesh,indices,weights:bary.toArray(),triangleIndex:n/3,side,distance};
   }
  }
  if(!best)throw new Error(`Missing actual ${rig.species} head-side surface`);
  points.push(best);
 }
 return points;
}
function jawTips(rig){
 rig.syncSurfaces();const inverse=rig.model.matrixWorld.clone().invert();
 return [-1,1].map(side=>{
  const jaw=rig.jaws.find(j=>j.side===side);
  if(!jaw)throw new Error('Bilateral grip requires two stag mandibles');
  // Bind to the actual zero-radius terminal vertices in each native mesh.
  // These coordinates identify the existing endpoint, never synthesize one.
  const expected=new T.Vector3(side*.014,-.010,.210);let best=null;
  const previous=jaw.pivot.rotation.y;jaw.pivot.rotation.y=0;rig.syncSurfaces();
  jaw.pivot.traverse(mesh=>{
   if(!mesh.isMesh)return;
   const attr=mesh.geometry.attributes.position;
   for(let i=0;i<attr.count;i++){
    const p=readVertex(mesh,i).applyMatrix4(inverse),distance=p.distanceToSquared(expected);
    if(!best||distance<best.distance)best={mesh,index:i,side,distance};
   }
  });
  jaw.pivot.rotation.y=previous;rig.syncSurfaces();
  if(!best||best.distance>1e-10)throw new Error('Native stag mandible endpoint was not found');
  return best;
 });
}

export function createJawGrip(attackerRig,receiverRig){
 if(attackerRig.species!=='stag'||!headCenters[receiverRig.species])throw new TypeError('Jaw grip supports stag attacking rhino/stag only');
 const tips=jawTips(attackerRig),surfaces=headSides(receiverRig);
 const oldAngles=attackerRig.jaws.map(j=>j.pivot.rotation.y);
 const width=worldMaterialPoint(surfaces[0]).distanceTo(worldMaterialPoint(surfaces[1]));
 const aperture=amount=>{attackerRig.setJaws(amount);return readVertex(tips[0].mesh,tips[0].index).distanceTo(readVertex(tips[1].mesh,tips[1].index));};
 let low=-.08,high=.65;
 try{
  if(width<aperture(low)||width>aperture(high))throw new RangeError('Receiver head width is outside unscaled stag jaw aperture');
  for(let i=0;i<42;i++){const middle=(low+high)/2;if(aperture(middle)<width)low=middle;else high=middle;}
 }finally{
  attackerRig.jaws.forEach((j,i)=>{j.pivot.rotation.y=oldAngles[i];});attackerRig.syncSurfaces();
 }
 const jawAmount=(low+high)/2;
 const receiverLocalMidpoint=worldMaterialPoint(surfaces[0]).add(worldMaterialPoint(surfaces[1])).multiplyScalar(.5).applyMatrix4(receiverRig.model.matrixWorld.clone().invert());
 function contacts(){
  attackerRig.syncSurfaces();receiverRig.syncSurfaces();
  // Opposed creatures reverse left/right. Keep endpoint pairing explicit.
  return tips.map((tip,i)=>{
   const surface=surfaces[1-i],weapon=readVertex(tip.mesh,tip.index),body=worldMaterialPoint(surface);
   return{side:tip.side,weapon,body,distance:weapon.distanceTo(body),jawMesh:tip.mesh,jawVertex:tip.index,bodyMesh:surface.mesh,bodyTriangle:surface.triangleIndex,bodyIndices:[...surface.indices],bodyWeights:[...surface.weights]};
  });
 }
 function alignmentDelta(out=new T.Vector3()){
  const pairs=contacts();return out.copy(pairs[0].weapon).add(pairs[1].weapon).sub(pairs[0].body).sub(pairs[1].body).multiplyScalar(.5);
 }
 function align(receiverAnchor=receiverRig.model.parent){
  if(!receiverAnchor)throw new TypeError('Receiver anchor is required');
  attackerRig.setJaws(jawAmount);
  const delta=alignmentDelta(),world=receiverAnchor.getWorldPosition(new T.Vector3()).add(delta);
  receiverAnchor.position.copy(receiverAnchor.parent?receiverAnchor.parent.worldToLocal(world):world);
  receiverAnchor.updateWorldMatrix(true,true);
  const pairs=contacts();return{pairs,maxError:Math.max(...pairs.map(p=>p.distance)),delta};
 }
 return{jawAmount,width,receiverLocalMidpoint,tips,surfaces,contacts,alignmentDelta,align};
}
