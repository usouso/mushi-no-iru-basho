import {inverseCicadaThorax} from './cicada-thorax-prior.mjs';
/** Exact050 display-only inverse; no git, runtime imports or test registration. */
import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const hash=s=>createHash('sha256').update(s).digest('hex'),normalize=s=>s.replace(/(from\s*['"]\.\/[^'"?\n]+)(?:\?[^'"\n]*)?(['"])/g,'$1$2');
export function inverseCicadaClearance(source){source=inverseCicadaThorax(source);const marker=/^([ \t]*)\/\/ CICADA_CLEARANCE_BEGIN\n[\s\S]*?^\1\/\/ CICADA_CLEARANCE_END\n/gm,blocks=source.match(marker)||[];assert.equal(blocks.length,2);assert.equal(hash(normalize(blocks.join(''))),'788a0e89344db124706cd1a481a1344b847ab4ef9b84fd071472e8a6feb538aa');source=source.replace(marker,'');assert.equal(hash(normalize(source)),'ed251db95cf8e1f76d47eda8578056a079623a07943c1230e8ae553c5c2e9c27');return source;}
