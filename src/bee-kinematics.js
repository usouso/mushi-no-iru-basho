/** Original worker-bee display pose. Dimensions/animation are game tuning, not natural measurements. */
export const BEE_DIMENSIONS=Object.freeze({bodyLength:.12,rootAboveSupport:.025,upperLegLength:.030,lowerLegLength:.029});
const f=(x,d=0)=>Number.isFinite(x)?x:d,c=x=>Math.max(0,Math.min(1,f(x))),pt=(x,y,z)=>({x,y,z});
export function sampleBeePose(state={}){
 const open=c(state.wingOpen),tuck=c(state.legTuck),legs=[];
 for(const side of[-1,1])for(let i=0;i<3;i++){
  const z=[.025,.012,0][i],hip=pt(side*.012,-.007,z),foot=pt(side*(.035*(1-tuck)+.016*tuck),-.025*(1-tuck)-.022*tuck,[.035,0,-.035][i]*(1-tuck)+(z-.005)*tuck);
  const dx=foot.x-hip.x,dy=foot.y-hip.y,dz=foot.z-hip.z,r=Math.hypot(dx,dy,dz),a=(.030**2-.029**2+r*r)/(2*r),h=Math.sqrt(Math.max(0,.030**2-a*a)),n=Math.hypot(dx,dz),bend=side;
  const knee=pt(hip.x+dx*a/r-bend*dz/n*h,hip.y+dy*a/r,hip.z+dz*a/r+bend*dx/n*h);
  legs.push({id:`${['front','middle','hind'][i]}-${side}`,role:['front','middle','hind'][i],side,hip,knee,foot,contact:tuck===0,pollenBasket:i===2});
 }
 const wings=[-1,1].flatMap(side=>['fore','hind'].map(role=>({side,role,sweep:side*(1-open)*1.15,flap:side*((1-open)*.12+open*.55*Math.sin(f(state.wingPhase)))})));
 return{body:{position:pt(f(state.position?.x),f(state.position?.y),f(state.position?.z)),heading:f(state.heading),pitch:f(state.pitch)},legs,wings};
}
