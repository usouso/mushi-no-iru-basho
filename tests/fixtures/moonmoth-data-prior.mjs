/** Frozen063 complete-source inverse. Node built-ins only; no history dependency. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
export function priorJournal(source){
 const current=", 'xylotrupes', 'anax', 'moonmoth'", prior=", 'xylotrupes', 'anax'";
 assert.equal(source.split(current).length-1,1,'064 journal addition exactly once');
 const restored=source.replace(current,prior);
 assert.equal(createHash('sha256').update(restored).digest('hex'),'66c19216fc7c7f4bee3c2a352878b478c65b09320df73d222ee3a3febfe9b726','complete frozen063 journal source');
 return restored;
}
