import {priorAtlas as before062Atlas} from './xylotrupes-individual-integration-prior.mjs';
import {priorMain as before060Main} from './butterfly-ambient-main-prior.mjs';
import {priorButterflyModel as before060Model} from './butterfly-ambient-model-prior.mjs';
import assert from 'node:assert/strict';import{createHash}from'node:crypto';
const records={
  "goliath-layout.js": {
    "hash": "a58a8f05d8d23358a381255aa9b354af69e0a167aae1abe980c9b2157edc565b",
    "replacements": [
      [
        "// GOLIATH_INDIVIDUAL_BEGIN\n// Saved display starts within the same branch, not natural site frequencies.\nexport const GOLIATH_INDIVIDUAL_OFFSETS=Object.freeze([-.08,0,.08]);\n// GOLIATH_INDIVIDUAL_END\nexport const GOLIATH_RETREAT_BOUNDS=",
        "export const GOLIATH_RETREAT_BOUNDS="
      ]
    ]
  },
  "insect-models.js": {
    "hash": "4fd48979f0054a47fe12d9d0ed157b8f702790e99277d4c64f8579fa314093bb",
    "replacements": [
      [
        "'giraffestag','rainbowstag','goliath'].includes(species)",
        "'giraffestag','rainbowstag'].includes(species)"
      ]
    ]
  },
  "main.js": {
    "hash": "d7b6f5d4aa3da980306745a5b226cd360f2421eb86d8dcd98731b695526130dc",
    "replacements": [
      [
        "[5,6,7,8,9].includes(activeOuting?.generatorVersion)",
        "[5,6,7,8].includes(activeOuting?.generatorVersion)",
        2
      ]
    ]
  },
  "atlas-encounter-layout.js": {
    "hash": "7a7c6ae27ca6e9d7fd54d407c758f7d17195686b953f735c5f4eb5caa25230ee",
    "replacements": [
      [
        "generations 5 through 9",
        "generations 5 through 8"
      ],
      [
        "[1,2,3,4,5,6,7,8,9].includes(snapshot.generatorVersion)",
        "[1,2,3,4,5,6,7,8].includes(snapshot.generatorVersion)"
      ]
    ]
  }
};
export function prior(name,source){if(name==='atlas-encounter-layout.js'&&source.includes('generations 5 through 10'))source=before062Atlas(source);if(name==='main.js'&&source.includes('BUTTERFLY_AMBIENT_MAIN_BEGIN'))source=before060Main(source);if(name==='insect-models.js'&&source.includes('BUTTERFLY_ARRIVAL_RENDER_BEGIN'))source=before060Model(source);let s=source.replace(/\?v=[0-9.]+&b=[a-f0-9]+/g,'');const r=records[name];assert.ok(r);for(const[now,old,count=1]of r.replacements){assert.equal(s.split(now).length-1,count);s=s.split(now).join(old);}assert.equal(createHash('sha256').update(s).digest('hex'),r.hash);return s;}
export const priorModel=s=>prior('insect-models.js',s);export const priorMain=s=>prior('main.js',s);export const priorLayout=s=>prior('goliath-layout.js',s);export const priorAtlas=s=>prior('atlas-encounter-layout.js',s);
