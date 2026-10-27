/** Original male Anax display rig. Metres and animation rates are game design, not biological measurements. */
export const ANAX_DIMENSIONS=Object.freeze({bodyLength:.280,wingSpan:.480,rootAboveSupport:.045,perchRadius:.025,upperLegLength:.040,lowerLegLength:.043});
const f=(v,d=0)=>Number.isFinite(v)?v:d,c=v=>Math.max(0,Math.min(1,f(v))),point=(x,y,z)=>({x,y,z});
export function sampleAnaxPose(state={}){
 const tuck=c(state.legTuck),flight=c(state.flightBlend),phase=f(state.wingPhase),legs=[];
 for(const side of[-1,1])for(let n=0;n<3;n++){
  const hip=point(side*.014,-.008,[.048,.027,.006][n]),restX=.025*Math.SQRT1_2,restY=-.070+.025*Math.SQRT1_2;
  const foot=point(side*(restX*(1-tuck)+.013*tuck),restY*(1-tuck)-.028*tuck,[.067,.027,-.014][n]*(1-tuck)+(hip.z+.008)*tuck);
  const dx=foot.x-hip.x,dy=foot.y-hip.y,dz=foot.z-hip.z,r=Math.hypot(dx,dy,dz),a=(.040**2-.043**2+r*r)/(2*r),h=Math.sqrt(Math.max(0,.040**2-a*a));
  // Project the outward lateral vector perpendicular to the bone chord.
  let bx=side-dx*(side*dx)/(r*r),by=-dy*(side*dx)/(r*r),bz=-dz*(side*dx)/(r*r);const b=Math.hypot(bx,by,bz);bx/=b;by/=b;bz/=b;
  const knee=point(hip.x+dx*a/r+bx*h,hip.y+dy*a/r+by*h,hip.z+dz*a/r+bz*h);
  legs.push({id:`${['front','middle','hind'][n]}-${side}`,role:['front','middle','hind'][n],side,hip,knee,foot,contact:tuck===0});
 }
 const wings=[-1,1].flatMap(side=>['fore','hind'].map(role=>({side,role,pivot:point(side*(role==='fore'?.017:.018),.016,role==='fore'?.042:.010),flap:side*(.04*(1-flight)+flight*.32*Math.sin(phase+(role==='hind'?Math.PI/2:0)))})));
 let q=state.orientation||{x:0,y:0,z:0,w:1};const length=Math.hypot(f(q.x),f(q.y),f(q.z),f(q.w,1))||1;q={x:f(q.x)/length,y:f(q.y)/length,z:f(q.z)/length,w:f(q.w,1)/length};
 return {position:point(f(state.position?.x),f(state.position?.y),f(state.position?.z)),orientation:q,legs,wings};
}
