/** Display-only tiger-beetle proposal. Durations, ratios and folding are not species measurements. */
export const TIGER_BEETLE_DIMENSIONS=Object.freeze({bodyLength:.18,bodyWidth:.062,rootAboveSupport:.05,cycleDistance:.04,stanceFraction:.5,upperLegLength:.075,lowerLegLength:.070,panelLength:.047,panelGap:.0015});
const n=(x,d=0)=>Number.isFinite(x)?x:d,unit=x=>Math.max(0,Math.min(1,n(x))),pt=(x,y,z)=>({x,y,z}),smooth=x=>x*x*(3-2*x);
export function sampleTigerBeetlePose(state={}){
 const D=TIGER_BEETLE_DIMENSIONS,f=state.flightPose||{},elytra=unit(f.elytra),unfold=unit(f.unfold),tuck=unit(f.tuck),amplitude=unit(f.flapAmplitude),phase=n(f.flapPhase),legs=[];
 for(const side of[-1,1])for(let i=0;i<3;i++){
  let q=((n(state.walkPhase)/(2*Math.PI)+(i%2===(side===1?0:1)?0:.5))%1+1)%1;if(q<1e-12||q>1-1e-12)q=0;else if(Math.abs(q-.5)<1e-12)q=.5;
  const contact=q<=.5,travel=contact?.25-q:-.25+.5*smooth((q-.5)*2),lift=contact?0:.009*Math.sin(Math.PI*(q-.5)*2)**2;
  const hip=pt(side*[.008,.012,.012][i],[-.007,-.013,-.016][i],[.030,.012,-.008][i]),ground=pt(side*.09,-D.rootAboveSupport+lift,[.095,0,-.100][i]+D.cycleDistance*travel),fold=pt(side*.060,-.027,[.045,-.008,-.066][i]);
  const foot=pt(ground.x+(fold.x-ground.x)*tuck,ground.y+(fold.y-ground.y)*tuck,ground.z+(fold.z-ground.z)*tuck),dx=foot.x-hip.x,dy=foot.y-hip.y,dz=foot.z-hip.z,r=Math.hypot(dx,dy,dz),a=(D.upperLegLength**2-D.lowerLegLength**2+r*r)/(2*r),h=Math.sqrt(Math.max(0,D.upperLegLength**2-a*a)),nz=Math.hypot(dx,dz),bend=i===2?-side:side;
  const knee=pt(hip.x+dx*a/r-bend*dz/nz*h,hip.y+dy*a/r,hip.z+dz*a/r+bend*dx/nz*h);
  legs.push({id:`${['front','middle','hind'][i]}-${side}`,role:['front','middle','hind'][i],side,hip,knee,foot,contact:contact&&tuck===0});
 }
 const a=state.orientation||{},x=n(a.x),y=n(a.y),z=n(a.z),w=n(a.w,1),len=Math.hypot(x,y,z,w)||1;
 return{body:{position:pt(n(state.position?.x),n(state.position?.y),n(state.position?.z)),orientation:{x:x/len,y:y/len,z:z/len,w:Math.hypot(x,y,z,w)?w/len:1}},legs,flight:{elytra,unfold,tuck,flapPhase:phase,flapAmplitude:amplitude,shellPitch:.95*elytra,shellSweep:1.05*elytra,wingPitch:(.40+.22*Math.sin(phase)*amplitude)*unfold,wingSweep:1.15*unfold,foldAngle:Math.PI*(1-unfold)}};
}
