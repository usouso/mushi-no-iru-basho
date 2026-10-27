import {inverseCicadaClearance} from './cicada-clearance-prior.mjs';
/** Exact 049 factory-only inverse to frozen048; no runtime imports or test registration. */
import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const hash=s=>createHash('sha256').update(s).digest('hex'),normalize=s=>s.replace(/(from\s*['"]\.\/[^'"?\n]+)(?:\?[^'"\n]*)?(['"])/g,'$1$2');
export function inverseGiraffeStagModel(source){source=inverseCicadaClearance(source);const marker=/^[ \t]*\/\/ GIRAFFE_STAG_MODEL_BEGIN\n[\s\S]*?^[ \t]*\/\/ GIRAFFE_STAG_MODEL_END\n/gm,blocks=source.match(marker)||[];assert.equal(blocks.length,3);assert.equal(hash(normalize(blocks.join(''))),'839b2e534537d6fbc33d133bf83d158d890660d0be58877a48792ebea5a6c515');source=source.replace(marker,'');assert.equal(hash(normalize(source)),'1d2f588ac9200c0c3e49bf695a0a6d38a8dc2d13a6d0417437db21927c059cea');return source;}
