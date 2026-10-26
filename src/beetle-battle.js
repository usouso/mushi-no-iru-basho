/** Automatic, non-lethal insect sumo. Numbers describe game presentation, not
 * measured animal strength, natural size distributions or fighting ability.
 * Only fixed exchange times consume the seeded variation; render-frame count,
 * inputs, real clocks, model scale and collection data never decide a result.
 */
const own=(object,key)=>Object.prototype.hasOwnProperty.call(object,key);
const freeze=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const rounded=value=>Math.round(value*1e9)/1e9;
const integer=(value,min,max)=>Number.isInteger(value)&&value>=min&&value<=max;
const finite=(value,min,max)=>Number.isFinite(value)&&value>=min&&value<=max;
const motions=new Set(['push','brace','evade']);
export const BATTLE_LIMITS=freeze({energy:4,ring:4,turns:12,introSeconds:2,exchangeSeconds:1.6,maxSeconds:21.2,maxStep:.45});
export const BATTLE_SPECIES=freeze({
 hercules:{label:'ヘラクレスオオカブト',role:'長い角で出だしを作る',help:'角を合わせた直後の押し合いが少し得意。'},
 rhino:{label:'カブトムシ',role:'踏ん張って押し直す',help:'踏ん張った後の押し直しが少し得意。'},
 stag:{label:'ノコギリクワガタ',role:'端で踏みとどまる',help:'端に近づいたときの踏ん張りが少し得意。'},
 metallifer:{label:'メタリフェルホソアカクワガタ',role:'長い顎を掛け直す',help:'顎を掛け直した後の押し合いが少し得意。'}
});
// Integer mixing is deliberately independent of Math.random and wall time.
// Domain-separated slots give a repeatable temperament and exchange variation.
function sample(seed,slot){let x=(seed^Math.imul(slot+1,0x9e3779b9))>>>0;x^=x>>>16;x=Math.imul(x,0x7feb352d);x^=x>>>15;x=Math.imul(x,0x846ca68b);x^=x>>>16;return(x>>>0)/4294967296;}
function traits(seed,side){return{drive:(sample(seed,side*3)-.5)*.48,grip:(sample(seed,side*3+1)-.5)*.16,tempo:Math.floor(sample(seed,side*3+2)*5)};}
function motion(energy,number,tempo){if(energy<1||((number+tempo)%5===3&&energy<3))return'brace';return(number+tempo)%5===0?'evade':'push';}
function nextEnergy(energy,action){return action==='push'?Math.max(0,energy-1):Math.min(4,energy+(action==='brace'?2:1));}
function roleBonus(species,number,ownPosition,action,previous){
 if(species==='hercules'&&number<=3)return .10;
 if(species==='rhino'&&action==='push'&&previous==='brace')return .10;
 if(species==='stag'&&ownPosition<=-1.5)return .10;
 if(species==='metallifer'&&action==='push'&&previous==='evade')return .10;
 return 0;
}
function effort(s,side,action,t){
 const player=side===0,energy=player?s.playerEnergy:s.opponentEnergy;
 const species=player?s.playerSpecies:s.opponentSpecies,position=player?s.position:-s.position;
 const previous=s.lastExchange?.[player?'playerAction':'opponentAction'];
 // All three poses contribute pressure and footing: there is no RPS win table.
 // A pause to brace/regrip can lose ground, but is not a guaranteed counter.
 const base=action==='push'?1.06+.025*energy:action==='brace'?.94+t.grip:1.00+t.grip*.5;
 const variation=(sample(s.seed,16+s.exchanges*2+side)-.5)*.30;
 return base+t.drive+variation+roleBonus(species,s.exchanges+1,position,action,previous);
}
const nextTime=s=>rounded(BATTLE_LIMITS.introSeconds+(s.exchanges+1)*BATTLE_LIMITS.exchangeSeconds);
function validLast(s){
 const last=s.lastExchange;if(s.exchanges===0)return last===null;
 return last&&typeof last==='object'&&last.number===s.exchanges&&motions.has(last.playerAction)&&motions.has(last.opponentAction)&&finite(last.positionBefore,-4,4)&&Math.abs(last.positionBefore)<4&&last.positionAfter===s.position&&finite(last.delta,-.450000001,.450000001)&&Math.abs(last.delta-(last.positionAfter-last.positionBefore))<1e-8&&typeof last.reason==='string'&&last.reason.length>0&&last.reason.length<=200;
}
function assertState(s){
 if(!s||typeof s!=='object'||!own(BATTLE_SPECIES,s.playerSpecies)||!own(BATTLE_SPECIES,s.opponentSpecies)||!integer(s.seed,0,0xffffffff)||!integer(s.playerEnergy,0,4)||!integer(s.opponentEnergy,0,4)||!finite(s.position,-4,4)||!integer(s.exchanges,0,12)||s.turn!==Math.min(12,s.exchanges+1)||!finite(s.elapsed,0,21.2)||!['watching','finished','cancelled'].includes(s.phase)||!validLast(s))throw new TypeError('Invalid automatic battle state');
 if(s.exchanges>0&&s.elapsed<rounded(2+s.exchanges*1.6))throw new TypeError('Battle history is ahead of its clock');
 if(s.phase==='watching'){
  if(s.exchanges>=12||Math.abs(s.position)>=4||s.elapsed>=nextTime(s)||s.winner!==null||s.finishReason!==null||!motions.has(s.intent)||typeof s.cue!=='string')throw new TypeError('Invalid watching battle state');
 }else if(s.intent!==null||s.cue!=='')throw new TypeError('Terminal battle cannot carry a motion');
 if(s.phase==='cancelled'&&(s.winner!==null||s.finishReason!==null))throw new TypeError('Cancelled battle cannot have a result');
 if(s.phase==='finished'){
  const winner=s.position>0?'player':s.position<0?'opponent':'draw';
  if(s.exchanges<9||s.elapsed!==rounded(2+s.exchanges*1.6)||s.winner!==winner||(s.finishReason==='ring-out'?Math.abs(s.position)!==4:s.finishReason!=='turn-limit'||s.exchanges!==12))throw new TypeError('Invalid automatic battle result');
 }
}
function copy(s){return{phase:s.phase,playerSpecies:s.playerSpecies,opponentSpecies:s.opponentSpecies,seed:s.seed,playerEnergy:s.playerEnergy,opponentEnergy:s.opponentEnergy,position:s.position,turn:s.turn,exchanges:s.exchanges,elapsed:s.elapsed,intent:s.intent,cue:s.cue,lastExchange:s.lastExchange?{...s.lastExchange}:null,winner:s.winner,finishReason:s.finishReason};}
function describe(s){s.intent=motion(s.opponentEnergy,s.exchanges+1,traits(s.seed,1).tempo);s.cue=s.exchanges===0?'角や顎を合わせています。操作せず、そのまま見守れます。':'押し合いながら、足場と角や顎の掛かりを整えています。';return s;}
export function createBattle({playerSpecies,opponentSpecies,seed=1}={}){
 if(!own(BATTLE_SPECIES,playerSpecies)||!own(BATTLE_SPECIES,opponentSpecies))throw new TypeError('Only battle-eligible beetles may enter');
 if(!integer(seed,0,0xffffffff))throw new TypeError('Battle seed must be an unsigned 32-bit integer');
 return freeze(describe({phase:'watching',playerSpecies,opponentSpecies,seed,playerEnergy:4,opponentEnergy:4,position:0,turn:1,exchanges:0,elapsed:0,intent:null,cue:'',lastExchange:null,winner:null,finishReason:null}));
}
function exchange(s){
 const p=traits(s.seed,0),o=traits(s.seed,1),number=s.exchanges+1;
 const playerAction=motion(s.playerEnergy,number,p.tempo),opponentAction=motion(s.opponentEnergy,number,o.tempo);
 let delta=rounded(clamp((effort(s,0,playerAction,p)-effort(s,1,opponentAction,o))*1.8,-.45,.45));
 // Negligible shifts read as a held position rather than flickering decimal wins.
 if(Math.abs(delta)<.025)delta=0;
 const position=rounded(clamp(s.position+delta,-4,4));delta=rounded(position-s.position);
 let reason=delta===0?'互いに踏みとどまり、足場を整えました。':delta>0?'こちらがじわりと押し込みました。':'相手にじわりと押し込まれました。';
 if(playerAction==='evade'||opponentAction==='evade')reason+=' 角や顎の掛かりを直しています。';
 else if(playerAction==='brace'||opponentAction==='brace')reason+=' 脚を踏ん張って支えています。';
 s.playerEnergy=nextEnergy(s.playerEnergy,playerAction);s.opponentEnergy=nextEnergy(s.opponentEnergy,opponentAction);s.position=position;s.exchanges=number;s.turn=Math.min(12,number+1);
 s.lastExchange={number,playerAction,opponentAction,positionBefore:rounded(position-delta),positionAfter:position,delta,reason};
 if(Math.abs(position)===4||number===12){s.phase='finished';s.intent=null;s.cue='';s.winner=position>0?'player':position<0?'opponent':'draw';s.finishReason=Math.abs(position)===4?'ring-out':'turn-limit';}
 else describe(s);
}
export function advanceBattle(s,dt){
 assertState(s);
 if(s.phase!=='watching'||!Number.isFinite(dt)||dt<=0)return s;
 const next=copy(s);let target=rounded(Math.min(BATTLE_LIMITS.maxSeconds,s.elapsed+Math.min(dt,BATTLE_LIMITS.maxSeconds)));
 // At most twelve events, even for Number.MAX_VALUE. Time is snapped only to
 // nanosecond precision to remove ordinary decimal-sum noise, not to frames.
 // Snap a sub-microsecond sum error at a scheduled boundary. This keeps 30/60
 // Hz subdivisions on the same exchange rather than one frame late.
 while(next.phase==='watching'&&nextTime(next)<=target+1e-6){next.elapsed=nextTime(next);target=Math.max(target,next.elapsed);exchange(next);}
 if(next.phase==='watching')next.elapsed=target;
 return freeze(next);
}
export function cancelBattle(s){assertState(s);if(s.phase!=='watching')return s;return freeze({...copy(s),phase:'cancelled',intent:null,cue:'',winner:null,finishReason:null});}
