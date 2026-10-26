import {createStriderPose,sampleStriderPose} from './strider-kinematics.js?v=0.23.0&b=6eab031e296e';
import {WATER_LEVEL,WATER_FOOT_RADIUS,WATER_PATCH} from './water-layout.js?v=0.23.0&b=6eab031e296e';
const THREE=window.THREE;
/** Additive meadow adapter: no geometry, RNG, collision or existing insect mutation. */
export function createWaterHabitat(world,scene){
  if(typeof world?.heightAt!=='function'||!scene?.isScene)throw new TypeError('Water habitat needs a meadow world and scene');
  const water=scene.children.find(o=>o.isMesh&&o.geometry?.type==='CircleGeometry'&&o.material?.isShaderMaterial&&o.material.uniforms?.uTime&&Math.abs(o.geometry.attributes.position.getX(0)-24)<1e-5&&Math.abs(o.geometry.attributes.position.getY(0)-WATER_LEVEL)<1e-6);
  const ground=world.captureOccluders?.[0];
  if(!water||!ground?.isMesh)throw new Error('Existing meadow water and ground meshes are required');
  water.updateWorldMatrix(true,false);ground.updateWorldMatrix(true,false);
  const ray=new THREE.Raycaster(),down=new THREE.Vector3(0,-1,0);
  function surface(mesh,x,z){ray.set(new THREE.Vector3(x,2,z),down);ray.far=5;return ray.intersectObject(mesh,false)[0]?.point.y;}
  // Nine cheap fail-fast samples only. Dense swept foot-envelope validation
  // belongs in tests, not in habitat entry or the render loop.
  let minDepth=Infinity;
  const probes=[[WATER_PATCH.x,WATER_PATCH.z]];
  for(let i=0;i<8;i++){const a=i*Math.PI/4;probes.push([WATER_PATCH.x+Math.cos(a)*(WATER_PATCH.radiusX+WATER_FOOT_RADIUS),WATER_PATCH.z+Math.sin(a)*(WATER_PATCH.radiusZ+WATER_FOOT_RADIUS)]);}
  for(const[x,z]of probes){
    const top=surface(water,x,z),bottom=surface(ground,x,z);
    if(!Number.isFinite(top)||!Number.isFinite(bottom)||Math.abs(top-WATER_LEVEL)>1e-6||top-bottom<.05)throw new Error('Water-strider support must lie above real submerged terrain');
    minDepth=Math.min(minDepth,top-bottom);
  }
  const home=Object.freeze({x:WATER_PATCH.x,y:WATER_LEVEL,z:WATER_PATCH.z}),center=Object.freeze({x:home.x,z:home.z});
  const supports=Object.freeze([Object.freeze({home,center,radiusX:WATER_PATCH.radiusX,radiusZ:WATER_PATCH.radiusZ})]);
  const homes=Object.freeze([Object.freeze(['waterstrider',home.x,home.z,home.y-world.heightAt(home.x,home.z)])]);
  const normal=Object.freeze({x:0,y:1,z:0});
  function supportAt(item){if(!item||!Number.isFinite(item.x)||!Number.isFinite(item.z))return null;const dx=(item.x-center.x)/WATER_PATCH.radiusX,dz=(item.z-center.z)/WATER_PATCH.radiusZ;if(dx*dx+dz*dz>1+1e-7)return null;return{kind:'water',point:{x:item.x,y:WATER_LEVEL,z:item.z},normal};}
  // Two very small, unlit-by-emission partial arcs, visible only during the
  // middle legs' brief power stroke. No permanent insect-centred target ring.
  const arcPoints=[];for(let i=0;i<=20;i++){const a=-Math.PI*.7+i/20*Math.PI*1.4;arcPoints.push(new THREE.Vector3(Math.cos(a),0,Math.sin(a)));}
  const arc=new THREE.BufferGeometry().setFromPoints(arcPoints);
  const ripples=[-1,1].map(side=>{const line=new THREE.Line(arc,new THREE.LineBasicMaterial({color:'#a5afa0',transparent:true,opacity:0,depthWrite:false}));line.name=`water-strider-stroke-${side<0?'left':'right'}`;line.visible=false;line.renderOrder=3;scene.add(line);return line;});
  const pose=createStriderPose();
  function update(items,time){
    for(const line of ripples)line.visible=false;
    if(!Number.isFinite(time)||!Array.isArray(items))return;
    const item=items.find(item=>item?.species==='waterstrider'&&!item.caught&&item.state==='rowing'&&supportAt(item));
    if(!item||![item.heading,item.strokePhase,item.y].every(Number.isFinite))return;
    sampleStriderPose(item,pose);
    const phase=Math.max(0,Math.min(1,item.strokePhase/.55)),opacity=Math.sin(phase*Math.PI)*.16,radius=.018+.018*phase,c=Math.cos(item.heading),s=Math.sin(item.heading);
    for(const leg of pose.legs){if(leg.role!=='middle'||!leg.rowing||!leg.contact)continue;const line=ripples[leg.side<0?0:1];line.position.set(item.x+c*leg.foot.x+s*leg.foot.z,WATER_LEVEL+.0008,item.z-s*leg.foot.x+c*leg.foot.z);line.rotation.y=item.heading;line.scale.setScalar(radius);line.material.opacity=opacity;line.visible=opacity>.001;}
  }
  return{homes,supports,supportAt,meshes:Object.freeze(ripples),stats:{supportSamples:probes.length,minSampledDepth:minDepth,footRadius:WATER_FOOT_RADIUS,maxRippleEntries:2,maxRippleLineSegments:40,addedTriangles:0,addedTextures:0},update};
}
