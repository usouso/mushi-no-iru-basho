/** Dedicated flat-ground / rotating-ball contact study; metres, not measured gait data. */
export const DUNG_DIMENSIONS=Object.freeze({bodyLength:.16,bodyWidth:.09,bodyHeight:.05,bodyHeightAboveGround:.08,bodyOffset:-.16,bodyPitch:.45,ballRadius:.08,pathLength:1.8,cycleDistance:.04,frontUpper:.055,frontLower:.055,middleUpper:.075,middleLower:.070,hindUpper:.055,hindLower:.055});
const D=DUNG_DIMENSIONS,TAU=Math.PI*2;
const add=(a,b)=>({x:a.x+b.x,y:a.y+b.y,z:a.z+b.z}),sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y,z:a.z-b.z}),scale=(a,s)=>({x:a.x*s,y:a.y*s,z:a.z*s}),dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
const unit=a=>scale(a,1/Math.hypot(a.x,a.y,a.z));
const rotateX=(p,a)=>({x:p.x,y:p.y*Math.cos(a)-p.z*Math.sin(a),z:p.y*Math.sin(a)+p.z*Math.cos(a)});
const smooth=t=>t*t*(3-2*t);
// Same endpoint tangent as a material point on the rotating ball. Repositioning
// is a continuous outside-sphere arc, never a chord through its interior.
const hermite=(a,b,m,t)=>(2*t*t*t-3*t*t+1)*a+(-2*t*t*t+3*t*t)*b+(2*t*t*t-3*t*t+t)*m;
function knee(hip,foot,upper,lower,side){
 const delta=sub(foot,hip),length=Math.hypot(delta.x,delta.y,delta.z);if(length<1e-8||length>=upper+lower||length<=Math.abs(upper-lower))throw new RangeError('Dung leg target outside fixed reach');
 const axis=scale(delta,1/length),preferred={x:side,y:.45,z:-.2},bend=unit(sub(preferred,scale(axis,dot(preferred,axis)))),along=(upper*upper-lower*lower+length*length)/(2*length),height=Math.sqrt(Math.max(0,upper*upper-along*along));
 return add(add(hip,scale(axis,along)),scale(bend,height));
}
function bodyPoint(local,position){const p=rotateX(local,D.bodyPitch);return add(position,{x:-p.x,y:p.y,z:-p.z});}
export function sampleDungPose(state){
 const distance=state?.distance;if(!Number.isFinite(distance)||distance<0||distance>D.pathLength+1e-9)throw new TypeError('Invalid dung distance');
 const body={position:{x:0,y:D.bodyHeightAboveGround,z:distance+D.bodyOffset},heading:Math.PI,pitch:D.bodyPitch};
 const ball={id:'ball-1',position:{x:0,y:D.ballRadius,z:distance},radius:D.ballRadius,angle:distance/D.ballRadius};
 const legs=[];
 for(const side of [-1,1]){
  const offset=side<0?0:.5,phase=distance/D.cycleDistance+offset,cycle=Math.floor(phase+1e-10),q=Math.max(0,phase-cycle),duty=.65,touchdown=(cycle-offset)*D.cycleDistance;
  const hip=bodyPoint({x:-side*.026,y:-.004,z:.052},body.position),anchor={x:side*.065,y:0,z:touchdown+D.bodyOffset-.052+.013};
  const contact=q<=duty,u=contact?0:(q-duty)/(1-duty),foot=contact?{...anchor}:{x:anchor.x,y:.012*Math.sin(Math.PI*u)**2,z:anchor.z+D.cycleDistance*smooth(u)};
  legs.push({id:`front-${side}`,role:'front',side,surface:'ground',hip,knee:knee(hip,foot,D.frontUpper,D.frontLower,side),foot,contact,contactNormal:{x:0,y:1,z:0},anchor,phase:q,upperLength:D.frontUpper,lowerLength:D.frontLower});
 }
 for(const [index,role,side]of [[0,'middle',-1],[1,'hind',1],[2,'middle',1],[3,'hind',-1]]){
  const offset=index/4,phase=distance/D.cycleDistance+offset,cycle=Math.floor(phase+1e-10),q=Math.max(0,phase-cycle),duty=.75,touchdown=(cycle-offset)*D.cycleDistance;
  const base={x:side*.60,y:.35,z:-Math.sqrt(1-.60**2-.35**2)},contact=q<=duty,u=contact?0:(q-duty)/(1-duty);
  const angle=contact?q*D.cycleDistance/D.ballRadius:hermite(duty*D.cycleDistance/D.ballRadius,0,(1-duty)*D.cycleDistance/D.ballRadius,u);
  const normal=rotateX(base,angle),lift=contact?0:.012*Math.sin(Math.PI*u)**2,foot=add(ball.position,scale(normal,D.ballRadius+lift));
  const anchor=scale(rotateX(base,-touchdown/D.ballRadius),D.ballRadius),hip=bodyPoint({x:-side*.028,y:0,z:role==='middle'?.008:-.047},body.position),upper=role==='middle'?D.middleUpper:D.hindUpper,lower=role==='middle'?D.middleLower:D.hindLower;
  legs.push({id:`${role}-${side}`,role,side,surface:'ball',hip,knee:knee(hip,foot,upper,lower,side),foot,contact,contactNormal:normal,anchor,phase:q,upperLength:upper,lowerLength:lower});
 }
 return{body,ball,legs,caught:!!state.caught};
}
