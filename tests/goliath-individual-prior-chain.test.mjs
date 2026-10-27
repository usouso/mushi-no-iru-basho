/** Current input remains reconstructible to the frozen predecessors; goldens unchanged. */
import test from 'node:test';import fs from'node:fs';
import * as xyl from './fixtures/xylotrupes-prior.mjs';
import {priorInsects}from'./fixtures/xylotrupes-field-prior.mjs';
import {priorIndividualLayout}from'./fixtures/rainbow-individual-field-prior.mjs';
import {priorExpedition}from'./fixtures/rainbow-individual-prior.mjs';
const read=n=>fs.readFileSync(new URL('../src/'+n,import.meta.url),'utf8');
test('059 exact inverses chain through previous field/data/view fixtures without weakening old complete hashes',()=>{priorInsects(read('insects.js'));priorIndividualLayout(read('individual-layout.js'));priorExpedition(read('expedition.js'));xyl.priorRoster(read('individual-roster.js'));xyl.priorView(read('battle-view.js'));});
