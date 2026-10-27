/** A bounded, local rendering correction, not cicada takeoff biomechanics.
 * Resting feet already meet the real trunk. During the old orientation blend,
 * projecting the actual rigid body/legs and moving wings avoids their sweeping
 * inward through that known facet. No simulation field or geometry is changed. */
export const CICADA_CLEARANCE = Object.freeze({maxOffset:.08,restSkinTolerance:.0012,fullRadius:.25,zeroRadius:.45});
const cache=new WeakMap(),finite=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&Number.isFinite(p.z);
const smooth=x=>x*x*(3-2*x);
export function applyCicadaClearance(group,item,support,flight) {
  if(group.userData.species!=='cicada'||group.userData.inspection||item.caught||!(flight>0)||!Number.isFinite(flight)||support?.kind!=='bark'||!finite(support.point)||!finite(support.normal)||!finite(item.home)||![item.x,item.y,item.z].every(Number.isFinite))return 0;
  const distance=Math.hypot(item.x-item.home.x,item.y-item.home.y,item.z-item.home.z),D=CICADA_CLEARANCE;
  if(distance>=D.zeroRadius||Math.hypot(support.point.x-item.home.x,support.point.y-item.home.y,support.point.z-item.home.z)>.15)return 0;
  const length=Math.hypot(support.normal.x,support.normal.y,support.normal.z);
  if(length<1e-10||!Number.isFinite(length))return 0;
  const nx=support.normal.x/length,ny=support.normal.y/length,nz=support.normal.z/length;
  // Match the old bark pose's valid vertical-tangent requirement.
  if(1-ny*ny<1e-10)return 0;
  const visual=group.userData.visual;
  let state=cache.get(group);
  if(!state){const nodes=[];visual.traverse(node=>{if((node.isMesh||node.isLine)&&node.geometry?.attributes.position)nodes.push(node);});state={nodes,inverse:new window.THREE.Matrix4()};cache.set(group,state);}
  group.updateMatrixWorld(true);
  let minimum=Infinity;
  for(const node of state.nodes){
    const e=node.matrixWorld.elements,p=node.geometry.attributes.position;
    // Transform one plane into each local geometry, not every vertex to world.
    const a=nx*e[0]+ny*e[1]+nz*e[2],b=nx*e[4]+ny*e[5]+nz*e[6],c=nx*e[8]+ny*e[9]+nz*e[10];
    const d=nx*(e[12]-support.point.x)+ny*(e[13]-support.point.y)+nz*(e[14]-support.point.z);
    for(let i=0;i<p.count;i++)minimum=Math.min(minimum,a*p.getX(i)+b*p.getY(i)+c*p.getZ(i)+d);
  }
  const fade=1-smooth(Math.max(0,Math.min(1,(distance-D.fullRadius)/(D.zeroRadius-D.fullRadius))));
  const offset=Math.min(D.maxOffset,Math.max(0,-minimum-D.restSkinTolerance))*fade;
  if(!(offset>0))return 0;
  // Inverse linear transform preserves an outward WORLD displacement even when
  // a caller places the model under a transformed parent; root stays untouched.
  const e=state.inverse.copy(group.matrixWorld).invert().elements;
  visual.position.x+=(e[0]*nx+e[4]*ny+e[8]*nz)*offset;
  visual.position.y+=(e[1]*nx+e[5]*ny+e[9]*nz)*offset;
  visual.position.z+=(e[2]*nx+e[6]*ny+e[10]*nz)*offset;
  return offset;
}
