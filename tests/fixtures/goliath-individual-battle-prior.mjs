import {priorXylBattleSource as before062View} from './xylotrupes-individual-battle-prior.mjs';
/** Exact inverse of the scaled-Goliath-only knee-option addition; frozen058 remains the oracle. */
import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
function once(s,a,b){assert.equal(s.split(a).length-1,1,'exact single new-Goliath clause');return s.replace(a,b);}
export function priorGoliathBattleView(s){if(s.includes('xylotrupesPress:true'))s=before062View('battle-view.js',s);s=once(s," const scaledGoliathPair=[player,opponent].some(e=>e.species==='goliath'&&e.model.userData.individualScale>1);\n",'');s=once(s,"||scaledAtlasPair||scaledGoliathPair||playerSpecies==='xylotrupes'","||scaledAtlasPair||playerSpecies==='xylotrupes'");s=s.replace(/\?v=[0-9.]+&b=[a-f0-9]+/g,'');assert.equal(createHash('sha256').update(s).digest('hex'),'84296f56760f8186238fed45edef0cf0d9936c46d96a0836f02a61a3eb45810a');return s;}
