import {priorMoonmothMain} from './moonmoth-main-prior.mjs';
import {priorModel as before063Model} from './hercules-horn-prior.mjs';
import assert from 'node:assert/strict';import{createHash}from'node:crypto';
const records={
  "main.js": {
    "pairs": [
      [
        "[5,6,7,8,9,10].includes(activeOuting?.generatorVersion)",
        "[5,6,7,8,9].includes(activeOuting?.generatorVersion)",
        2
      ],
      [
        "if(inspectModel.userData.species==='xylotrupes')inspectModel.scale.setScalar(Math.min(3.4*(inspectModel.userData.individualScale||1),inspectCamera.aspect*4.4));",
        "if(inspectModel.userData.species==='xylotrupes')inspectModel.scale.setScalar(Math.min(3.4,inspectCamera.aspect*4.4));",
        1
      ]
    ],
    "hash": "2dcd9c2061d6cb829ca0f307db147388a806526db6bf9fcd74055270cf82c10b"
  },
  "insect-models.js": {
    "pairs": [
      [
        "'giraffestag','rainbowstag','goliath','xylotrupes'].includes(species)",
        "'giraffestag','rainbowstag','goliath'].includes(species)",
        1
      ]
    ],
    "hash": "6d22ee820b23bb0087b8f4a21589ddd2b880c58d58a6ff42597a229569432ed3"
  },
  "atlas-encounter-layout.js": {
    "pairs": [
      [
        "generations 5 through 10",
        "generations 5 through 9",
        1
      ],
      [
        "[1,2,3,4,5,6,7,8,9,10].includes(snapshot.generatorVersion)",
        "[1,2,3,4,5,6,7,8,9].includes(snapshot.generatorVersion)",
        1
      ]
    ],
    "hash": "60dd8e434cc21c35f8494eda5c11ac8f7ff775c670184db86160ce4f3e79950f"
  }
};
export function prior(name,source){if(name==='main.js'&&source.includes('MOONMOTH_MAIN_BEGIN'))source=priorMoonmothMain(source);if(name==='insect-models.js'&&source.includes('[[0,.030,.030],[0,.080,.135]'))source=before063Model(source);let s=source.replace(/\?v=[0-9.]+&b=[a-f0-9]+/g,'');const r=records[name];assert.ok(r);for(const[now,old,count]of r.pairs){assert.equal(s.split(now).length-1,count);s=s.split(now).join(old);}assert.equal(createHash('sha256').update(s).digest('hex'),r.hash);return s;}
export const priorModel=s=>prior('insect-models.js',s);export const priorMain=s=>prior('main.js',s);export const priorAtlas=s=>prior('atlas-encounter-layout.js',s);
