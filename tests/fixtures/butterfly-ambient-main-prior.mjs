import {priorAnaxMain} from './anax-main-prior.mjs';
import assert from'node:assert/strict';import{createHash}from'node:crypto';
const hash=s=>createHash('sha256').update(s).digest('hex');
export function priorMain(source){if(source.includes('ANAX_MAIN_BEGIN'))source=priorAnaxMain(source);let s=source.replace(/\?v=[0-9.]+&b=[a-f0-9]+/g,'');const re=/^[ \t]*\/\/ BUTTERFLY_AMBIENT_MAIN_BEGIN\n[\s\S]*?^[ \t]*\/\/ BUTTERFLY_AMBIENT_MAIN_END\n/gm,b=s.match(re)||[];assert.equal(b.length,2);assert.equal(hash(b.join('')),"e98b5c14b46f9248a7896edf99624d916bf7b4ea05f4261df95d78a6b9461153");s=s.replace(re,'');assert.equal(hash(s),"9b95933decc570940c33cc1c2a8f4bb97db76ec6183cca89250d9be5eb19553e");return s;}
