import {priorJournal as before055Journal} from './orchid-mantis-prior.mjs';
/** Frozen052 journal reconstructed by its sole 053 allowlist inverse.
 * Node built-ins only; no runtime imports, git/history or private paths. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
export function priorJournal(source){
 source=before055Journal(source);
 const added=", 'tigerbeetle'";
 assert.equal(source.split(added).length-1,1,'053 journal registry fragment exactly once');
 const prior=source.replace(added,'');
 assert.equal(createHash('sha256').update(prior).digest('hex'),'82c14b3515902117ec0c445e23d0337ecf82348035ff5be7312985978812de87','complete frozen052 journal');
 return prior;
}
