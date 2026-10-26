/** Display values and supported-foot pose; No species-specific speed, activity or diet claims. */
export const MANTICORA_DIMENSIONS=Object.freeze({bodyLength:.180,totalLength:.249,bodyWidth:.120,rootAboveSupport:.055,cycleDistance:.04,stanceFraction:.5,upperLegLength:.080,lowerLegLength:.085,restJawOpen:.25,maxJawAngle:.12});
const f=(v,d=0)=>Number.isFinite(v)?v:d,pt=(x,y,z)=>({x,y,z}),smooth=t=>t*t*(3-2*t);
export function sampleManticoraPose(state={}){
 const D=MANTICORA_DIMENSIONS,legs=[];
 if(state.turnFeet&&(!Array.isArray(state.turnFeet)||state.turnFeet.length!==6))throw new TypeError('Expected six stepped-turn feet');
 for(const side of[-1,1])for(let i=0;i<3;i++){
  let q=((f(state.walkPhase)/(2*Math.PI)+(i%2===(side===1?0:1)?0:.5))%1+1)%1;if(q<1e-12||q>1-1e-12)q=0;else if(Math.abs(q-.5)<1e-12)q=.5;
  let contact=q<=.5;const travel=contact?.25-q:-.25+.5*smooth((q-.5)*2),lift=contact?0:.009*Math.sin(Math.PI*(q-.5)*2)**2;
  const hip=pt(side*[.023,.043,.040][i],-.015,[.013,-.038,-.074][i]);let foot=pt(side*.125,-D.rootAboveSupport+lift,[.105,-.015,-.130][i]+D.cycleDistance*travel);
  if(state.turnFeet){const t=state.turnFeet[legs.length];if(!t||!['x','y','z'].every(k=>Number.isFinite(t[k]))||typeof t.contact!=='boolean')throw new TypeError('Invalid stepped turn foot');foot=pt(t.x,t.y,t.z);contact=t.contact;}
  const dx=foot.x-hip.x,dy=foot.y-hip.y,dz=foot.z-hip.z,r=Math.hypot(dx,dy,dz);
  if(r>D.upperLegLength+D.lowerLegLength)throw new RangeError('Manticora native reach exceeded');
  const a=(D.upperLegLength**2-D.lowerLegLength**2+r*r)/(2*r),h=Math.sqrt(D.upperLegLength**2-a*a),n=Math.hypot(dx,dz),bend=i===2?-side:side,knee=pt(hip.x+dx*a/r-bend*dz/n*h,hip.y+dy*a/r,hip.z+dz*a/r+bend*dx/n*h);
  legs.push({id:`${['front','middle','hind'][i]}-${side}`,role:['front','middle','hind'][i],side,hip,knee,foot,contact});
 }
 const q=state.orientation||{},x=f(q.x),y=f(q.y),z=f(q.z),w=f(q.w,1),n=Math.hypot(x,y,z,w)||1,jawOpen=Math.max(0,Math.min(1,f(state.jawOpen,D.restJawOpen)));
 return{position:pt(f(state.position?.x),f(state.position?.y),f(state.position?.z)),orientation:{x:x/n,y:y/n,z:z/n,w:Math.hypot(x,y,z,w)?w/n:1},legs,jawOpen,jaws:[-1,1].map(side=>({side,angle:side*D.maxJawAngle*(jawOpen-D.restJawOpen)}))};
}
