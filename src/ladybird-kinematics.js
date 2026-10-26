/** Display-only dimensions and pure pose. No biological timing claim. */
export const LADYBIRD_DIMENSIONS=Object.freeze({bodyLength:.08,rootAboveSupport:.012,cycleDistance:.018,stanceFraction:.5,wingPanelLength:.017,wingWidth:.012});
const f=(v,d=0)=>Number.isFinite(v)?v:d,c=v=>Math.max(0,Math.min(1,f(v))),smooth=v=>v*v*(3-2*v),pt=(x,y,z)=>({x,y,z});
export function sampleLadybirdPose(state={}){
 const open=c(state.elytraOpen),deploy=c(state.hindwingDeploy),sweep=c(state.hindwingSweep),tuck=c(state.legTuck),fold=1-deploy,legs=[],wings=[];
 for(const side of [-1,1]){
  for(let i=0;i<3;i++){
   const role=['front','middle','hind'][i],q=((f(state.walkPhase)/(2*Math.PI)+(i%2===(side===1?0:1)?0:.5))%1+1)%1;
   const stance=q<=.5,travel=stance?.25-q:-.25+.5*smooth((q-.5)*2),lift=stance?0:.004*Math.sin(Math.PI*(q-.5)*2)**2;
   const hip=pt(side*.014,-.004,[.018,0,-.018][i]),foot=pt(side*.032,-.012+lift,[.024,0,-.026][i]+.018*travel);
   const dx=foot.x-hip.x,dy=foot.y-hip.y,dz=foot.z-hip.z,reach=Math.hypot(dx,dy,dz),height=Math.sqrt(Math.max(0,.018**2-reach**2/4)),flat=Math.hypot(dx,dz),sign=i===0?side:-side;
   const knee=pt((hip.x+foot.x)/2+sign*(-dz/flat)*height,(hip.y+foot.y)/2,(hip.z+foot.z)/2+sign*(dx/flat)*height);
   const a=side*tuck*.35,co=Math.cos(a),si=Math.sin(a);for(const p of[knee,foot]){const x=p.x-hip.x,y=p.y-hip.y;p.x=hip.x+co*x-si*y;p.y=hip.y+si*x+co*y;}
   legs.push({id:`${role}-${side}`,role,side,hip,knee,foot,contact:tuck===0&&(stance||q===.5)});
  }
  // Unequal finite hinge bands prevent coplanar layers and tip/previous-hinge contact.
  const middleFold=Math.PI*smooth(c(fold*2-1)),tipFold=Math.PI*smooth(c(fold*2)),points=[];let y=.005,z=.017;
  for(let panel=0;panel<3;panel++){const angle=[0,middleFold,middleFold+tipFold][panel];if(panel===1)y+=.001;if(panel===2){y+=.0005*(Math.cos(middleFold)+Math.sin(middleFold));z+=.0005*(Math.sin(middleFold)-Math.cos(middleFold));}const endY=y+.017*Math.sin(angle),endZ=z-.017*Math.cos(angle);points.push({start:pt(side*.008,y,z),end:pt(side*.008,endY,endZ)});y=endY;z=endZ;}
  wings.push({side,elytraOpen:open,sweep,pitch:.35*Math.sin(Math.PI*sweep/2),flap:Math.sin(f(state.wingPhase))*.25*sweep*deploy,panels:points});
 }
 return{body:{position:pt(f(state.position?.x),f(state.position?.y),f(state.position?.z)),heading:f(state.heading),pitch:f(state.pitch)},legs,wings};
}
