/** Original display kinematics, not measured hydrodynamics. Local +Z is forward;
 * root Y=0 is water. Reuse `out` to sample without allocating per frame. */
const point=()=>({x:0,y:0,z:0});
export function createStriderPose(){return{legs:[-1,1].flatMap(side=>['front','middle','rear'].map(role=>({side,role,hip:point(),knee:point(),foot:point(),contact:true,rowing:false}))) };}
const set=(p,x,y,z)=>{p.x=x;p.y=y;p.z=z;};
const smooth=t=>t*t*(3-2*t);
export function sampleStriderPose(item,out=createStriderPose()){
  const active=item?.state==='rowing'&&!item.caught,p=active&&Number.isFinite(item.strokePhase)?Math.max(0,Math.min(1,item.strokePhase)):0;
  for(const leg of out.legs){
    const s=leg.side;leg.contact=true;leg.rowing=false;
    if(leg.role==='front'){
      set(leg.hip,s*.008,.026,.030);set(leg.knee,s*.025,.018,.039);set(leg.foot,s*.035,0,.050);
    }else if(leg.role==='rear'){
      set(leg.hip,s*.009,.025,-.026);set(leg.knee,s*.074,.014,-.070);set(leg.foot,s*.120,0,-.095);
    }else{
      const recovery=active&&p>.55&&p<1,t=p<=.55?smooth(p/.55):1-smooth((p-.55)/.45),lift=recovery?.014*Math.sin(Math.PI*(p-.55)/.45)**2:0;
      set(leg.hip,s*.010,.027,.006);set(leg.foot,s*(.170-.014*Math.sin(Math.PI*t)),lift,.035-.100*t);
      set(leg.knee,s*.086,.017+lift*.4,.012-.040*t);
      leg.contact=!recovery;leg.rowing=active&&p>0&&p<=.55;
    }
  }return out;
}
