/** Pure rule tests only: not animation, real-animal behavior or playtest evidence. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createBattle,takeTurn,cancelBattle,availableActions,BATTLE_ACTIONS,BATTLE_SPECIES,BATTLE_LIMITS} from '../src/beetle-battle.js';
const species=Object.keys(BATTLE_SPECIES),actions=Object.keys(BATTLE_ACTIONS);
const fresh=(p='rhino',o='hercules')=>createBattle({playerSpecies:p,opponentSpecies:o});
const key=s=>[s.turn,s.position,s.playerEnergy,s.opponentEnergy,s.intent].join('/');
// Explore every legal action from each distinct rule state. History not used by
// the COM is intentionally excluded from the key; all nine species matchups remain.
const audits=[];
for(const player of species)for(const opponent of species){
 const queue=[fresh(player,opponent)],seen=new Set(),active=[],terminal=[],pairs=new Set();
 for(let n=0;n<queue.length;n++){
  const s=queue[n];if(s.phase==='finished'){terminal.push(s);continue;}if(seen.has(key(s)))continue;seen.add(key(s));active.push(s);
  for(const action of availableActions(s)){pairs.add(action+'/'+s.intent);queue.push(takeTurn(s,action));}
 }
 audits.push({player,opponent,active,terminal,pairs});
}
const everyState=audits.flatMap(a=>[...a.active,...a.terminal]);
function frozenTree(x){if(!x||typeof x!=='object')return;assert.ok(Object.isFrozen(x));Object.values(x).forEach(frozenTree);}

test('only existing three eligible beetles enter; the returned decision and Japanese cue are already committed',()=>{
 assert.deepEqual(species,['hercules','rhino','stag']);assert.deepEqual(BATTLE_LIMITS,{energy:4,ring:4,turns:9});
 for(const p of species)for(const o of species){const s=fresh(p,o);assert.equal(s.phase,'choosing');assert.equal(s.turn,1);assert.equal(s.exchanges,0);assert.equal(s.position,0);assert.equal(s.playerEnergy,4);assert.equal(s.opponentEnergy,4);assert.ok(actions.includes(s.intent));assert.ok(s.cue.length>10);assert.equal(s.winner,null);assert.equal(s.lastExchange,null);}
 for(const value of ['butterfly','bee','constructor','__proto__',undefined,null,0])assert.throws(()=>createBattle({playerSpecies:value,opponentSpecies:'rhino'}),TypeError);
});
test('all action matchups occur; energy, signed ring progress and at-most-nine-exchange termination stay bounded',()=>{
 assert.equal(audits.length,9);const combinations=new Set();
 for(const audit of audits){audit.pairs.forEach(p=>combinations.add(p));assert.ok(audit.active.length>0);assert.ok(audit.terminal.length>0);}
 assert.equal(combinations.size,9);
 for(const s of everyState){assert.ok(Number.isInteger(s.position)&&Math.abs(s.position)<=4);assert.ok(Number.isInteger(s.playerEnergy)&&s.playerEnergy>=0&&s.playerEnergy<=4);assert.ok(Number.isInteger(s.opponentEnergy)&&s.opponentEnergy>=0&&s.opponentEnergy<=4);assert.ok(s.exchanges<=9);if(s.phase==='choosing'){assert.ok(s.exchanges<9);assert.ok(Math.abs(s.position)<4);assert.ok(availableActions(s).includes('brace'));}else{assert.equal(s.intent,null);assert.equal(s.cue,'');assert.ok(Math.abs(s.position)===4||s.exchanges===9);assert.equal(s.winner,s.position>0?'player':s.position<0?'opponent':'draw');}}
});
test('push costs two, evade costs one, brace restores two; the opponent spends its previously displayed action',()=>{
 for(const audit of audits)for(const s of audit.active)for(const action of availableActions(s)){
  const after=takeTurn(s,action),last=after.lastExchange;
  assert.equal(last.opponentAction,s.intent);assert.equal(after.playerEnergy,action==='brace'?Math.min(4,s.playerEnergy+2):s.playerEnergy-BATTLE_ACTIONS[action].cost);
  assert.equal(after.opponentEnergy,s.intent==='brace'?Math.min(4,s.opponentEnergy+2):s.opponentEnergy-BATTLE_ACTIONS[s.intent].cost);
  if(action==='evade'&&s.intent==='brace')assert.equal(last.delta,-1);
  if(action==='brace'&&s.intent==='evade')assert.equal(last.delta,1);
  if(action===s.intent&&action!=='push')assert.equal(last.delta,0);
 }
});
test('roles are small and conditional: opening horns, rested push, and stag edge counter',()=>{
 const openingHercules=takeTurn(fresh('hercules','hercules'),'push'),openingStag=takeTurn(fresh('stag','hercules'),'push');
 assert.equal(openingHercules.lastExchange.delta,0);assert.equal(openingStag.lastExchange.delta,-1,'long horns prevent the opening push disadvantage');
 const rhino=audits.flatMap(a=>a.active).find(s=>s.playerSpecies==='rhino'&&s.turn>1&&s.playerEnergy===4&&s.intent==='brace'&&s.position<=1);
 assert.ok(rhino);assert.equal(takeTurn(rhino,'push').lastExchange.delta,2);
 const tired=audits.flatMap(a=>a.active).find(s=>s.playerSpecies==='rhino'&&s.playerEnergy===2&&s.intent==='brace'&&s.position<=2);
 assert.ok(tired);assert.equal(takeTurn(tired,'push').lastExchange.delta,1);
 const edge=audits.flatMap(a=>a.active).find(s=>s.playerSpecies==='stag'&&s.position<=-2&&s.playerEnergy>=1&&s.intent==='push');
 assert.ok(edge);assert.equal(takeTurn(edge,'evade').lastExchange.delta,2);
 const center=audits.flatMap(a=>a.active).find(s=>s.playerSpecies==='stag'&&s.position===0&&s.playerEnergy>=1&&s.intent==='push');
 assert.ok(center);assert.equal(takeTurn(center,'evade').lastExchange.delta,1);
});
test('every species matchup has winning and losing legal lines; no fixed-action-with-recharge policy always wins',()=>{
 for(const audit of audits){assert.ok(audit.terminal.some(s=>s.winner==='player'),`${audit.player} can beat ${audit.opponent}`);assert.ok(audit.terminal.some(s=>s.winner==='opponent'),`${audit.player} can lose to ${audit.opponent}`);}
 for(const player of species)for(const fixed of actions){const results=[];for(const opponent of species){let s=fresh(player,opponent);while(s.phase==='choosing')s=takeTurn(s,availableActions(s).includes(fixed)?fixed:'brace');results.push(s.winner);}assert.notEqual(results.filter(r=>r==='player').length,3,`${player}: ${fixed} must not always win`);}
});
test('decisions are deterministic and input-independent; snapshots and rule metadata are deeply immutable',()=>{
 const original=fresh(),before=JSON.stringify(original),branches=availableActions(original).map(action=>takeTurn(original,action));
 assert.equal(JSON.stringify(original),before);for(const next of branches){assert.equal(next.lastExchange.opponentAction,original.intent);frozenTree(next);assert.notEqual(next,original);assert.deepEqual(next,takeTurn(fresh(),next.lastExchange.playerAction));}
 frozenTree(original);frozenTree(BATTLE_SPECIES);frozenTree(BATTLE_ACTIONS);frozenTree(BATTLE_LIMITS);assert.throws(()=>{original.playerEnergy=99;},TypeError);
 const clone=structuredClone(branches.find(s=>s.phase==='choosing'));assert.deepEqual(takeTurn(clone,'brace'),takeTurn(branches.find(s=>s.phase==='choosing'),'brace'));
});
test('cancel at the first decision, a later decision, or after an outcome clears results without touching the original',()=>{
 const first=fresh(),later=takeTurn(first,'brace'),finished=audits[0].terminal[0];
 for(const s of [first,later,finished]){const before=JSON.stringify(s),cancelled=cancelBattle(s);assert.equal(cancelled.phase,'cancelled');assert.equal(cancelled.winner,null);assert.equal(cancelled.finishReason,null);assert.equal(cancelled.intent,null);assert.equal(cancelled.cue,'');assert.equal(cancelled.position,s.position);assert.equal(cancelled.playerEnergy,s.playerEnergy);assert.equal(cancelled.opponentEnergy,s.opponentEnergy);assert.deepEqual(availableActions(cancelled),[]);assert.equal(JSON.stringify(s),before);assert.deepEqual(cancelBattle(cancelled),cancelled);assert.throws(()=>takeTurn(cancelled,'brace'),RangeError);frozenTree(cancelled);}
});
test('invalid, nonfinite, forged-intent, terminal and unaffordable inputs cannot consume a turn',()=>{
 const s=fresh(),before=JSON.stringify(s);for(const action of ['unknown','__proto__',null,undefined,1])assert.throws(()=>takeTurn(s,action),TypeError);
 for(const field of ['position','playerEnergy','opponentEnergy','turn','exchanges'])for(const value of [NaN,Infinity,-Infinity,1.25,-99,99]){const invalid={...s,[field]:value};assert.throws(()=>takeTurn(invalid,'brace'),TypeError);assert.throws(()=>cancelBattle(invalid),TypeError);}
 assert.throws(()=>takeTurn({...s,intent:'brace'},'push'),TypeError);assert.throws(()=>takeTurn({...s,cue:'別の予備動作'},'push'),TypeError);
 const empty=audits[0].active.find(s=>s.playerEnergy===0);assert.ok(empty);const emptyBefore=JSON.stringify(empty);assert.throws(()=>takeTurn(empty,'push'),RangeError);assert.throws(()=>takeTurn(empty,'evade'),RangeError);assert.equal(JSON.stringify(empty),emptyBefore);
 assert.throws(()=>takeTurn(audits[0].terminal[0],'brace'),RangeError);assert.equal(JSON.stringify(s),before);
 const badHistory={...takeTurn(s,'brace')};badHistory.lastExchange={...badHistory.lastExchange,delta:NaN};assert.throws(()=>takeTurn(badHistory,'brace'),TypeError);
});
