/** Ring-out-only result regression. Pure game rules, not a rendered playtest. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {createBattle,advanceBattle,cancelBattle,BATTLE_LIMITS,BATTLE_SPECIES} from '../src/beetle-battle.js';
const fresh=seed=>createBattle({playerSpecies:'rhino',opponentSpecies:'stag',seed});
const atExchange=(s,n)=>advanceBattle(s,BATTLE_LIMITS.introSeconds+n*BATTLE_LIMITS.exchangeSeconds-s.elapsed);
const invalid=s=>{assert.throws(()=>advanceBattle(s,1),TypeError);assert.throws(()=>cancelBattle(s),TypeError);};

test('nine or twelve exchanges inside the ring never award the positional leader a win',()=>{
 for(const seed of [4,7])for(const count of [9,12]){
  const s=atExchange(fresh(seed),count);
  assert.equal(s.exchanges,count);assert.ok(Math.abs(s.position)<BATTLE_LIMITS.ring);
  assert.equal(s.phase,'watching');assert.equal(s.winner,null);assert.equal(s.finishReason,null);
  const cancelled=cancelBattle(s);assert.equal(cancelled.phase,'cancelled');assert.equal(cancelled.winner,null);
  invalid({...s,phase:'finished',intent:null,cue:'',winner:s.position>0?'player':'opponent',finishReason:'turn-limit'});
 }
});

test('safety limit is an explicit draw even at a nonzero position, and a retry starts an independent match',()=>{
 assert.equal(BATTLE_LIMITS.turns,36);assert.equal(BATTLE_LIMITS.maxSeconds,59.6);
 for(const seed of [4,7]){
  const s=advanceBattle(fresh(seed),Number.MAX_VALUE);
  assert.ok(Math.abs(s.position)>1&&Math.abs(s.position)<4);assert.equal(Math.sign(s.position),seed===4?1:-1);
  assert.equal(s.phase,'finished');assert.equal(s.winner,'draw');assert.equal(s.finishReason,'time-limit');
  assert.equal(s.exchanges,36);assert.equal(s.elapsed,59.6);
  assert.equal(advanceBattle(s,999),s);assert.equal(cancelBattle(s),s);
  invalid({...s,winner:s.position>0?'player':'opponent'});
  invalid({...s,finishReason:'turn-limit'});invalid({...s,finishReason:'ring-out'});
  invalid({...s,phase:'watching',winner:null,finishReason:null,intent:'push'});
  invalid({...s,phase:'cancelled',winner:null,finishReason:null});
  const retry=fresh(seed);assert.equal(retry.exchanges,0);assert.equal(retry.position,0);assert.equal(retry.winner,null);
  assert.deepEqual(advanceBattle(retry,100),s,'same seed repeats the same match, not a hidden retry advantage');
 }
});

test('only exact ring endpoints win, including a ring-out on the last permitted exchange',()=>{
 for(const [seed,expectedWinner,expectedCount] of [[0,'opponent',15],[1,'player',27],[9,'player',11],[49,'player',36]]){
  let s=fresh(seed),before=s;
  while(s.phase==='watching'){before=s;s=atExchange(s,s.exchanges+1);}
  assert.equal(s.exchanges,expectedCount);assert.equal(s.finishReason,'ring-out');assert.equal(s.winner,expectedWinner);
  assert.equal(s.position,expectedWinner==='player'?4:-4);assert.ok(Math.abs(before.position)<4);
  assert.equal(s.lastExchange.positionBefore,before.position);assert.ok(Math.abs(s.lastExchange.delta)<=BATTLE_LIMITS.maxStep+1e-9);
  assert.equal(advanceBattle(s,0),s);
  invalid({...s,winner:'draw'});invalid({...s,finishReason:'time-limit'});
  const inside=s.position*.999;
  invalid({...s,position:inside,lastExchange:{...s.lastExchange,positionAfter:inside,delta:inside-before.position}});
 }
});

test('the hash-verified 0.23 reference retains its first twelve exchanges; current non-stag motions remain identical',async()=>{
 const source=fs.readFileSync(new URL('../src/beetle-battle.js',import.meta.url),'utf8');
 const referenceSource=source.replace("if(species==='stag'&&ownPosition<=-1.5)return .05;","if(species==='stag'&&ownPosition<=-1.5)return .10;");
 assert.equal(createHash('sha256').update(referenceSource).digest('hex'),'8efcca57b8e5c24935fcac053661aed18ce81a250828f4ab901dcab727c6e55b','only the single edge coefficient may differ from 0.23');
 const reference=await import('data:text/javascript;base64,'+Buffer.from(referenceSource).toString('base64'));

 // Reference: 25 matchups × seeds 0/17/1234 from the pre-change rules.
 // Stops at an earlier ring-out; excludes only the deliberately changed end/turn metadata.
 const rows=[];
 const legacySpecies=['hercules','rhino','stag','metallifer','atlas'];
 for(const p of legacySpecies)for(const o of legacySpecies)for(const seed of [0,17,1234]){
  let s=reference.createBattle({playerSpecies:p,opponentSpecies:o,seed}),current=createBattle({playerSpecies:p,opponentSpecies:o,seed});
  for(let i=1;i<=12&&s.phase==='watching';i++){
   s=reference.advanceBattle(s,BATTLE_LIMITS.introSeconds+i*BATTLE_LIMITS.exchangeSeconds-s.elapsed);
   if(p!=='stag'&&o!=='stag'){current=atExchange(current,i);assert.deepEqual(current,s);}
   rows.push([p,o,seed,s.exchanges,s.position,s.playerEnergy,s.opponentEnergy,s.lastExchange]);
  }
 }
 assert.equal(rows.length,836);
 assert.equal(createHash('sha256').update(JSON.stringify(rows)).digest('hex'),'74ecce04ae832fe00025e9fac7d9a419e3e9dd960844cec53304e616a874a324');
});
