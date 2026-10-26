/** Small, non-lethal insect-sumo rules. All numbers are game tuning, not biology.
 * No clock, random source, renderer, storage, collection mutation or hidden input.
 * The opponent commits to its visible intent before the next player decision.
 */
const own=(object,key)=>Object.prototype.hasOwnProperty.call(object,key);
const freeze=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
export const BATTLE_LIMITS=freeze({energy:4,ring:4,turns:9});
export const BATTLE_SPECIES=freeze({
 hercules:{label:'ヘラクレスオオカブト',role:'長い角の出だし',help:'1手目の押しが1歩強い。'},
 rhino:{label:'カブトムシ',role:'ためて押す力',help:'体力が満タンのとき、押しが1歩強い。'},
 stag:{label:'ノコギリクワガタ',role:'端からの切り返し',help:'自分の端に近いとき、押しをかわした反撃が1歩強い。'}
});
export const BATTLE_ACTIONS=freeze({
 push:{label:'押す',cost:2,help:'体力2。構えを押し込む。かわされると反撃を受ける。'},
 evade:{label:'かわす',cost:1,help:'体力1。押しに反撃。相手が構えていると1歩譲る。'},
 brace:{label:'構える',cost:0,help:'体力2回復。押しを1歩軽減するが、完全には止めない。'}
});
const patterns={hercules:['push','evade','brace','push'],rhino:['push','brace','push','evade'],stag:['evade','push','brace','push']};
const cues={push:'相手は脚を踏ん張り、前へ押す構えです。',evade:'相手は重心を横へ移し、かわす構えです。',brace:'相手は低く腰を落とし、構えて体力を戻します。'};
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const integer=(value,min,max)=>Number.isInteger(value)&&value>=min&&value<=max;
function coreValid(s){return s&&typeof s==='object'&&own(BATTLE_SPECIES,s.playerSpecies)&&own(BATTLE_SPECIES,s.opponentSpecies)&&integer(s.playerEnergy,0,4)&&integer(s.opponentEnergy,0,4)&&integer(s.position,-4,4)&&integer(s.turn,1,9)&&integer(s.exchanges,0,9)&&s.turn===Math.min(9,s.exchanges+1);}
function chooseIntent(s){
 // These decisions use only the already-visible state, never this turn's input.
 if(s.opponentEnergy===0)return 'brace';
 if(s.opponentSpecies==='stag'&&s.position>=2&&s.playerEnergy>=2)return 'evade';
 if(s.opponentEnergy<2)return 'brace';
 if(s.playerEnergy===0)return 'push';
 const action=patterns[s.opponentSpecies][(s.turn-1)%4];
 return s.opponentEnergy>=BATTLE_ACTIONS[action].cost?action:'brace';
}
function validLastExchange(s){
 const last=s.lastExchange;if(s.exchanges===0)return last===null;
 if(!last||typeof last!=='object'||Object.keys(last).length!==11)return false;
 return last.number===s.exchanges&&own(BATTLE_ACTIONS,last.playerAction)&&own(BATTLE_ACTIONS,last.opponentAction)&&integer(last.positionBefore,-3,3)&&last.positionAfter===s.position&&integer(last.delta,-3,3)&&last.delta===last.positionAfter-last.positionBefore&&integer(last.playerEnergyBefore,0,4)&&integer(last.opponentEnergyBefore,0,4)&&last.playerEnergyAfter===s.playerEnergy&&last.opponentEnergyAfter===s.opponentEnergy&&typeof last.reason==='string'&&last.reason.length<=200;
}
function assertState(s){
 if(!coreValid(s)||!validLastExchange(s)||!['choosing','finished','cancelled'].includes(s.phase))throw new TypeError('Invalid battle state');
 if(s.phase==='choosing'){
  if(s.exchanges>=9||Math.abs(s.position)>=4||s.winner!==null||s.finishReason!==null||s.intent!==chooseIntent(s)||s.cue!==cues[s.intent])throw new TypeError('Invalid committed battle intent');
 }else if(s.intent!==null||s.cue!=='')throw new TypeError('Terminal battle cannot carry an intent');
 if(s.phase==='cancelled'&&(s.winner!==null||s.finishReason!==null))throw new TypeError('Cancelled battle cannot have a result');
 if(s.phase==='finished'){
  const winner=s.position>0?'player':s.position<0?'opponent':'draw';
  if(s.exchanges===0||s.winner!==winner||(s.finishReason==='ring-out'?Math.abs(s.position)!==4:s.finishReason!=='turn-limit'||s.exchanges!==9))throw new TypeError('Invalid battle result');
 }
}
function baseCopy(s){return{phase:s.phase,playerSpecies:s.playerSpecies,opponentSpecies:s.opponentSpecies,playerEnergy:s.playerEnergy,opponentEnergy:s.opponentEnergy,position:s.position,turn:s.turn,exchanges:s.exchanges,intent:s.intent,cue:s.cue,lastExchange:s.lastExchange?{...s.lastExchange}:null,winner:s.winner,finishReason:s.finishReason};}
function commitIntent(s){s.intent=chooseIntent(s);s.cue=cues[s.intent];return freeze(s);}
export function createBattle({playerSpecies,opponentSpecies}={}){
 if(!own(BATTLE_SPECIES,playerSpecies)||!own(BATTLE_SPECIES,opponentSpecies))throw new TypeError('Only battle-eligible beetles may enter');
 return commitIntent({phase:'choosing',playerSpecies,opponentSpecies,playerEnergy:4,opponentEnergy:4,position:0,turn:1,exchanges:0,intent:null,cue:'',lastExchange:null,winner:null,finishReason:null});
}
export function availableActions(s){assertState(s);return freeze(s.phase==='choosing'?Object.keys(BATTLE_ACTIONS).filter(action=>s.playerEnergy>=BATTLE_ACTIONS[action].cost):[]);}
function pushStrength(species,energy,turn){return 2+(species==='rhino'&&energy===4||species==='hercules'&&turn===1?1:0);}
function counterStrength(species,ownPosition){return 1+(species==='stag'&&ownPosition<=-2?1:0);}
function newEnergy(energy,action){return action==='brace'?Math.min(4,energy+2):energy-BATTLE_ACTIONS[action].cost;}
export function takeTurn(s,action){
 assertState(s);
 if(s.phase!=='choosing')throw new RangeError('The battle is not accepting a turn');
 if(!own(BATTLE_ACTIONS,action))throw new TypeError('Unknown battle action');
 if(s.playerEnergy<BATTLE_ACTIONS[action].cost)throw new RangeError('Not enough energy');
 const opponentAction=s.intent; // Already committed; do not recompute from action.
 const playerStrength=pushStrength(s.playerSpecies,s.playerEnergy,s.turn),opponentStrength=pushStrength(s.opponentSpecies,s.opponentEnergy,s.turn);
 let delta=0,reason='互いに間合いを保ちました。';
 if(action==='push'&&opponentAction==='push'){delta=playerStrength-opponentStrength;reason=delta===0?'押し合い、同じ場所で踏みとどまりました。':delta>0?'押し合いで、こちらが1歩押し込みました。':'押し合いで、相手に1歩押し込まれました。';}
 else if(action==='push'&&opponentAction==='brace'){delta=playerStrength-1;reason='相手の構えを押し込みました。';}
 else if(action==='brace'&&opponentAction==='push'){delta=-(opponentStrength-1);reason='構えて押しを1歩軽減。押し込まれましたが、体力を戻しました。';}
 else if(action==='evade'&&opponentAction==='push'){delta=counterStrength(s.playerSpecies,s.position);reason='押しをかわして切り返しました。';}
 else if(action==='push'&&opponentAction==='evade'){delta=-counterStrength(s.opponentSpecies,-s.position);reason='押しをかわされ、切り返されました。';}
 else if(action==='evade'&&opponentAction==='brace'){delta=-1;reason='相手は押さずに構えていました。かわす動きで1歩譲りました。';}
 else if(action==='brace'&&opponentAction==='evade'){delta=1;reason='相手のかわしに動じず、足場を1歩取りました。';}
 else if(action==='brace'&&opponentAction==='brace')reason='互いに構え、体力を戻しました。';
 const next=baseCopy(s),position=clamp(s.position+delta,-4,4);
 next.playerEnergy=newEnergy(s.playerEnergy,action);next.opponentEnergy=newEnergy(s.opponentEnergy,opponentAction);next.position=position;next.exchanges++;
 next.lastExchange={number:s.turn,playerAction:action,opponentAction,positionBefore:s.position,positionAfter:position,delta:position-s.position,playerEnergyBefore:s.playerEnergy,opponentEnergyBefore:s.opponentEnergy,playerEnergyAfter:next.playerEnergy,opponentEnergyAfter:next.opponentEnergy,reason};
 next.turn=Math.min(9,next.exchanges+1);
 if(Math.abs(position)===4||next.exchanges===9){next.phase='finished';next.intent=null;next.cue='';next.winner=position>0?'player':position<0?'opponent':'draw';next.finishReason=Math.abs(position)===4?'ring-out':'turn-limit';return freeze(next);}
 return commitIntent(next);
}
export function cancelBattle(s){assertState(s);return freeze({...baseCopy(s),phase:'cancelled',intent:null,cue:'',winner:null,finishReason:null});}
