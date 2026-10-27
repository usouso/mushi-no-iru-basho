import {priorJournal as before064Journal} from './moonmoth-data-prior.mjs';
/** Frozen060 complete-source inverse. Node built-ins only; no history dependency. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
export function priorJournal(source){
 if(source.includes(", 'moonmoth'"))source=before064Journal(source);
 const current=", 'orchidmantis', 'xylotrupes', 'anax'", prior=", 'orchidmantis', 'xylotrupes'";
 assert.equal(source.split(current).length-1,1,'061 journal addition exactly once');
 const restored=source.replace(current,prior);
 assert.equal(createHash('sha256').update(restored).digest('hex'),'c33b06103dbdbb6e327310c97e23d5ea5672f1ff79618ef4c92fbe52d06b37e8','complete frozen060 journal source');
 return restored;
}
