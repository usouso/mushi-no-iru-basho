/** A small display gait, not measured anatomy or rigid-bone biomechanics.
 * Signed travelled distance drives phase. Stance feet cancel body translation;
 * stopping at a half-cycle leaves all six feet on the support plane.
 */
export const METALLIFER_GAIT=Object.freeze({cycleDistance:.04,stanceFraction:.5,swingLift:.006});
const f=(value,fallback=0)=>Number.isFinite(value)?value:fallback,point=(x,y,z)=>({x,y,z}),smooth=t=>t*t*(3-2*t);
export function sampleMetalliferPose(state={}){
 const legs=[];
 for(const side of[-1,1])for(let i=0;i<3;i++){
  const offset=i%2===(side===1?0:1)?0:.5;
  let q=((f(state.walkPhase)/(2*Math.PI)+offset)%1+1)%1;if(q<1e-12||q>1-1e-12)q=0;else if(Math.abs(q-.5)<1e-12)q=.5;
  const contact=q<=.5,initial=offset===0?.25:-.25,travel=((contact?.25-q:-.25+.5*smooth((q-.5)*2))-initial)*METALLIFER_GAIT.cycleDistance,lift=contact?0:METALLIFER_GAIT.swingLift*Math.sin(Math.PI*(q-.5)*2)**2;
  const hip=point(side*[.020,.023,.022][i],[.043,.040,.041][i],[.026,-.018,-.052][i]);
  const knee=point(side*.054,.034+lift*.45,[.055,-.013,-.078][i]+travel*.45);
  const ankle=point(side*.073,.005+lift,[.077,-.020,-.098][i]+travel),foot=point(side*.079,lift,[.083,-.021,-.104][i]+travel);
  legs.push({role:['front','middle','hind'][i],side,hip,knee,ankle,foot,contact});
 }
 return{body:{position:point(f(state.position?.x),f(state.position?.y),f(state.position?.z)),heading:f(state.heading)},legs,jawOpen:Math.max(0,Math.min(1,f(state.jawOpen,.15)))};
}
