/** Pure automatic-sumo checks. Not real-animal strength or GPU/playtest evidence. */
import test from 'node:test';
import assert from 'node:assert/strict';
import * as rules from '../src/beetle-battle.js';
const {createBattle,advanceBattle,cancelBattle,BATTLE_SPECIES,BATTLE_LIMITS}=rules;
const species=Object.keys(BATTLE_SPECIES),motions=['push','brace','evade'];
const fresh=(playerSpecies='rhino',opponentSpecies='hercules',seed=1)=>createBattle({playerSpecies,opponentSpecies,seed});
const tick=s=>advanceBattle(s,2+(s.exchanges+1)*1.6-s.elapsed);
function frozen(x){if(!x||typeof x!=='object')return;assert.ok(Object.isFrozen(x));Object.values(x).forEach(frozen);}
function play(p,o,seed){let s=fresh(p,o,seed);const history=[s];while(s.phase==='watching'){s=tick(s);history.push(s);}return history;}
const audits=[];for(const p of species)for(const o of species)for(let seed=0;seed<128;seed++)audits.push({p,o,seed,history:play(p,o,seed)});

test('only seven eligible beetles and the automatic API remain; create fixes the uint32 seed',()=>{
 assert.deepEqual(Object.keys(rules).sort(),['BATTLE_LIMITS','BATTLE_SPECIES','advanceBattle','cancelBattle','createBattle'].sort());
 assert.deepEqual(species,['hercules','rhino','stag','metallifer','atlas','giantstag','elephant']);assert.equal(BATTLE_LIMITS.maxSeconds,59.6);
 for(const p of species)for(const o of species){const s=fresh(p,o,0xffffffff);assert.equal(s.phase,'watching');assert.equal(s.seed,0xffffffff);assert.equal(s.elapsed,0);assert.equal(s.turn,1);assert.equal(s.exchanges,0);assert.equal(s.position,0);assert.equal(s.lastExchange,null);assert.equal(s.winner,null);assert.ok(motions.includes(s.intent));frozen(s);}
 assert.equal(createBattle({playerSpecies:'stag',opponentSpecies:'rhino'}).seed,1);
 for(const v of ['butterfly','constructor','__proto__',null,undefined,0])assert.throws(()=>createBattle({playerSpecies:v,opponentSpecies:'rhino'}),TypeError);
 for(const seed of [-1,1.25,0x100000000,NaN,Infinity,null,'1'])assert.throws(()=>fresh('rhino','stag',seed),TypeError);
});

test('intro and fixed exchanges advance only with simulation seconds, never with render calls or manual input',()=>{
 const s=fresh(),before=JSON.stringify(s),intro=advanceBattle(s,2),ready=advanceBattle(intro,1.599);
 assert.equal(intro.exchanges,0);assert.equal(ready.exchanges,0);
 const first=advanceBattle(ready,.001);assert.equal(first.elapsed,3.6);assert.equal(first.exchanges,1);assert.equal(first.lastExchange.number,1);
 let split=s;for(let i=0;i<36;i++)split=advanceBattle(split,.1);assert.deepEqual(split,first);
 let thirty=s;for(let i=0;i<108;i++)thirty=advanceBattle(thirty,1/30);assert.deepEqual(thirty,first);
 let sixty=s;for(let i=0;i<216;i++)sixty=advanceBattle(sixty,1/60);assert.ok(Math.abs(sixty.elapsed-first.elapsed)<1e-6);assert.deepEqual(sixty.lastExchange,first.lastExchange);
 for(let i=0;i<100;i++)assert.equal(advanceBattle(s,0),s);
 assert.equal(JSON.stringify(s),before);frozen(first);assert.throws(()=>{first.position=99;},TypeError);
});

test('all forty-nine matchups finish automatically within 59.6 seconds, with finite bounded progress and both winners across fixed test seeds',()=>{
 const pairs=new Map();let ringouts=0,timeouts=0;
 for(const {p,o,history} of audits){const key=p+'/'+o;if(!pairs.has(key))pairs.set(key,new Set());const end=history.at(-1);pairs.get(key).add(end.winner);
  assert.equal(end.phase,'finished');assert.ok(end.elapsed>=16.4&&end.elapsed<=59.6);assert.ok(end.elapsed<=BATTLE_LIMITS.maxSeconds);assert.ok(end.exchanges>=9&&end.exchanges<=BATTLE_LIMITS.turns);
  if(end.finishReason==='ring-out'){ringouts++;assert.equal(Math.abs(end.position),4);}else{timeouts++;assert.equal(end.finishReason,'time-limit');assert.equal(end.exchanges,BATTLE_LIMITS.turns);}
  assert.equal(end.winner,end.finishReason==='ring-out'?(end.position>0?'player':'opponent'):'draw');
  for(const s of history){assert.ok(Number.isFinite(s.position)&&Math.abs(s.position)<=4);assert.ok(Number.isFinite(s.elapsed));for(const energy of [s.playerEnergy,s.opponentEnergy])assert.ok(Number.isInteger(energy)&&energy>=0&&energy<=4);if(s.lastExchange){assert.ok(Math.abs(s.lastExchange.delta)<=.450000001);assert.equal(s.lastExchange.positionAfter,s.position);assert.ok(Math.abs(s.lastExchange.positionBefore+s.lastExchange.delta-s.position)<1e-8);}}
 }
 assert.equal(pairs.size,49);for(const [key,winners] of pairs){assert.ok(winners.has('player'),key);assert.ok(winners.has('opponent'),key);}assert.ok(ringouts>0&&timeouts>0);
 // Counts are test coverage, not an estimate of natural or game spawn rarity.
});

test('seed repeatability and terminal results survive dt subdivision, huge steps and plain JSON roundtrips',()=>{
 const sequences=new Set();
 for(const p of species)for(const o of species)for(const seed of [0,1,23,0xffffffff]){
  const s=fresh(p,o,seed),whole=advanceBattle(s,Number.MAX_VALUE);assert.deepEqual(whole,advanceBattle(fresh(p,o,seed),100));
  let split=s;while(split.phase==='watching')split=advanceBattle(split,.1);assert.deepEqual(split,whole);
  let sixty=s;for(let i=0;sixty.phase==='watching'&&i<3700;i++)sixty=advanceBattle(sixty,1/60);assert.deepEqual(sixty,whole);
  const midway=advanceBattle(s,7.25);assert.deepEqual(advanceBattle(JSON.parse(JSON.stringify(midway)),100),whole);
  assert.equal(advanceBattle(whole,999),whole);assert.equal(whole.intent,null);assert.equal(whole.cue,'');frozen(whole);sequences.add(JSON.stringify([whole.position,whole.exchanges,whole.lastExchange]));
 }
 assert.ok(sequences.size>20,'different fixed seeds produce different matches, not frame-count randomness');
});

test('push, brace and regrip are automatic poses with footing/energy, not a random rock-paper-scissors table',()=>{
 const pairs=new Map();for(const {history} of audits)for(let i=1;i<history.length;i++){
  const before=history[i-1],after=history[i],last=after.lastExchange,key=last.playerAction+'/'+last.opponentAction;if(!pairs.has(key))pairs.set(key,new Set());pairs.get(key).add(Math.sign(last.delta));
  assert.ok(motions.includes(last.playerAction)&&motions.includes(last.opponentAction));
  for(const [which,action] of [['player',last.playerAction],['opponent',last.opponentAction]])assert.equal(after[which+'Energy'],action==='push'?Math.max(0,before[which+'Energy']-1):Math.min(4,before[which+'Energy']+(action==='brace'?2:1)));
 }
 assert.equal(pairs.size,9);for(const [pair,directions] of pairs){assert.ok(directions.has(-1)&&directions.has(1),`${pair} must not imply a guaranteed counter/win`);}
});

test('role differences are small and conditional; model dimensions and retained-insect data are not rule inputs',()=>{
 let opening=false,recharge=false,edge=false,regrip=false;
 for(const {history} of audits){for(const s of history){if(s.phase!=='watching')continue;
  const different=type=>tick({...s,playerSpecies:type});
  const baseline=different('hercules'),rhino=different('rhino'),stag=different('stag'),metallifer=different('metallifer');
  if(s.exchanges===0&&Math.abs(baseline.lastExchange.delta)<.4&&Math.abs(stag.lastExchange.delta)<.4){assert.ok(Math.abs(baseline.lastExchange.delta-stag.lastExchange.delta-.18)<.02500001);opening=true;}
  if(s.exchanges>=3&&s.lastExchange?.playerAction==='brace'&&rhino.lastExchange.playerAction==='push'&&rhino.lastExchange.delta>baseline.lastExchange.delta)recharge=true;
  if(s.exchanges>=3&&s.position<=-1.5&&stag.lastExchange.delta>baseline.lastExchange.delta)edge=true;
  if(s.exchanges>=3&&s.lastExchange?.playerAction==='evade'&&metallifer.lastExchange.playerAction==='push'&&metallifer.lastExchange.delta>baseline.lastExchange.delta)regrip=true;
  for(const other of [rhino,stag,metallifer])assert.ok(Math.abs(baseline.lastExchange.delta-other.lastExchange.delta)<=.23000001,'at most small role pressure plus dead-zone rounding');
 }}
 assert.ok(opening&&recharge&&edge&&regrip);
 const roster={entries:[{species:'rhino',size:999,level:99}]},before=JSON.stringify(roster),plain=fresh('rhino','stag',17);
 for(const size of [.01,1,100,NaN])assert.deepEqual(createBattle({playerSpecies:'rhino',opponentSpecies:'stag',seed:17,size,playerSize:size,opponentSize:1,roster}),plain);
 assert.equal(JSON.stringify(roster),before);for(const key of ['roster','size','level','health','experience','damage'])assert.ok(!Object.hasOwn(plain,key));frozen(BATTLE_SPECIES);frozen(BATTLE_LIMITS);
});

test('invalid state cannot advance; negative/nonfinite time is a no-op and a giant finite dt is bounded',()=>{
 const s=fresh(),before=JSON.stringify(s);for(const dt of [-1,-Infinity,Infinity,NaN,null,undefined,'5',{},0])assert.equal(advanceBattle(s,dt),s);
 const bad=[null,{}, {...s,seed:-1},{...s,phase:'choosing'},{...s,playerSpecies:'constructor'},{...s,position:NaN},{...s,playerEnergy:.5},{...s,exchanges:BATTLE_LIMITS.turns+1},{...s,elapsed:Infinity},{...s,winner:'player'},{...s,intent:'attack'}];
 const one=tick(s);bad.push({...one,elapsed:0},{...one,lastExchange:{...one.lastExchange,delta:NaN}},{...one,lastExchange:{...one.lastExchange,playerAction:'unknown'}});
 for(const value of bad){assert.throws(()=>advanceBattle(value,1),TypeError);assert.throws(()=>cancelBattle(value),TypeError);}
 const huge=advanceBattle(s,Number.MAX_VALUE);assert.equal(huge.phase,'finished');assert.ok(huge.exchanges<=BATTLE_LIMITS.turns&&huge.elapsed<=BATTLE_LIMITS.maxSeconds);assert.equal(JSON.stringify(s),before);
});

test('cancellation is immutable, terminal and idempotent; completed outcomes cannot be erased or replayed',()=>{
 for(const s of [fresh(),advanceBattle(fresh(),10)]){const before=JSON.stringify(s),cancelled=cancelBattle(s);assert.equal(cancelled.phase,'cancelled');assert.equal(cancelled.winner,null);assert.equal(cancelled.finishReason,null);assert.equal(cancelled.position,s.position);assert.equal(cancelled.elapsed,s.elapsed);assert.deepEqual(cancelled.lastExchange,s.lastExchange);assert.equal(advanceBattle(cancelled,100),cancelled);assert.equal(cancelBattle(cancelled),cancelled);assert.equal(JSON.stringify(s),before);frozen(cancelled);}
 const finished=advanceBattle(fresh(),100);assert.equal(cancelBattle(finished),finished);assert.equal(advanceBattle(finished,100),finished);
});
