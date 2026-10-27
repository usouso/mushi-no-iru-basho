import test from 'node:test';import fs from 'node:fs';import{priorMain}from'./fixtures/rainbow-individual-main-prior.mjs';
test('only exact gen8 Atlas availability and rainbow inspector scale changes reconstruct frozen056 main',()=>{priorMain(fs.readFileSync(new URL('../src/main.js',import.meta.url),'utf8'));});
