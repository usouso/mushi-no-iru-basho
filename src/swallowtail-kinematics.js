/** Original display pose, not measured Papilio wingbeat/stance timing. Quaternion is the only root orientation. */
export const SWALLOWTAIL_DIMENSIONS=Object.freeze({bodyLength:.10,wingSpan:.40,rootAboveSupport:.035,upperLegLength:.028,lowerLegLength:.030,safeWingAngle:.35,restWingAngle:1.15,flapAmplitude:.65,fullFlapClearance:.14});
const f=(v,d=0)=>Number.isFinite(v)?v:d,c=v=>Math.max(0,Math.min(1,f(v))),pt=(x,y,z)=>({x,y,z});
export function sampleSwallowtailPose(state={}){
 const open=c(state.wingOpen),flap=c(state.flapBlend),tuck=c(state.legTuck),legs=[];
 for(const side of[-1,1])for(let i=0;i<3;i++){
  const z=[.025,.007,-.012][i],hip=pt(side*.009,-.009,z),foot=pt(side*(.030*(1-tuck)+.018*tuck),-.035*(1-tuck)-.024*tuck,[.030,0,-.035][i]*(1-tuck)+(z-.006)*tuck);
  const dx=foot.x-hip.x,dy=foot.y-hip.y,dz=foot.z-hip.z,r=Math.hypot(dx,dy,dz),a=(.028**2-.030**2+r*r)/(2*r),h=Math.sqrt(Math.max(0,.028**2-a*a)),n=Math.hypot(dx,dz),bend=side;
  const knee=pt(hip.x+dx*a/r-bend*dz/n*h,hip.y+dy*a/r,hip.z+dz*a/r+bend*dx/n*h);
  legs.push({id:`${['front','middle','hind'][i]}-${side}`,role:['front','middle','hind'][i],side,hip,knee,foot,contact:tuck===0});
 }
 // Before clearance permits a downstroke, move only through the upward .35..1.15 arc.
 const phase=f(state.wingPhase),safeStroke=.35+.4*(1-Math.cos(phase)),angle=(1-open)*1.15+open*((1-flap)*safeStroke+flap*.65*Math.sin(phase)),q=state.orientation||{},x=f(q.x),y=f(q.y),z=f(q.z),w=f(q.w,1),length=Math.hypot(x,y,z,w)||1;
 return{body:{position:pt(f(state.position?.x),f(state.position?.y),f(state.position?.z)),orientation:{x:x/length,y:y/length,z:z/length,w:(Math.hypot(x,y,z,w)?w:1)/length}},legs,wings:[-1,1].flatMap(side=>['fore','hind'].map(role=>({side,role,angle:side*angle})))};
}
