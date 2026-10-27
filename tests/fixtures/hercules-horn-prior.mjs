import {priorMoonmothModel} from './moonmoth-main-prior.mjs';
/** Exact 063 root-control inverse; self-contained frozen062 source hash. */
import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
export const normalizeHerculesHorn=s=>s.replace(/(from\s*['"]\.\/[^'"?\n]+)(?:\?[^'"\n]*)?(['"])/g,'$1$2');
export function priorModel(source){if(source.includes('MOONMOTH_MODEL_BEGIN'))source=priorMoonmothModel(source);let s=normalizeHerculesHorn(source);const next="[[0,.030,.030],[0,.080,.135],[0,.063,.237],[0,.035,.310]]",old="[[0,.055,.030],[0,.080,.135],[0,.063,.237],[0,.035,.310]]";assert.equal(s.split(next).length-1,1);s=s.replace(next,old);assert.equal(createHash('sha256').update(s).digest('hex'),"69cccfda3fbb288b19bc138d9567870601e8c441ba61eb1d0368352e545cf570");return s;}
