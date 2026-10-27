import {priorJournal as before058Journal} from './xylotrupes-prior.mjs';
/** Frozen054 journal reconstructed by its sole 055 allowlist inverse.
 * Node built-ins only; no runtime imports, git/history or private paths. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
export function priorJournal(source){
 if(source.includes(", 'xylotrupes'"))source=before058Journal(source);
 const added=", 'orchidmantis'";
 assert.equal(source.split(added).length-1,1,'055 journal registry fragment exactly once');
 const prior=source.replace(added,'');
 assert.equal(createHash('sha256').update(prior).digest('hex'),'7496a4c93dabd4b0a6330b0e86dec8252518e782862ba86e3ddb1ae2c9631ce4','complete frozen054 journal');
 return prior;
}
