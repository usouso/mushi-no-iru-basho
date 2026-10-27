import {priorModel as before057Model} from './rainbow-individual-field-prior.mjs';
import {priorMain as before057Main} from './rainbow-individual-main-prior.mjs';
/** Exact055 integration inverse to frozen054; no filesystem or Git-history dependency. */
import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const hash=s=>createHash('sha256').update(s).digest('hex'),norm=s=>s.replace(/\?v=[0-9.]+&b=[a-f0-9]+/g,'');
const records={
  "insect-models.js": {
    "marker": "MODEL",
    "count": 3,
    "blockHash": "7990b0fc9c3d43267105dc2997708082cf4e9d11bfe30403100a02a740fec551",
    "pairs": [],
    "priorHash": "a4b5f6f4890835a10ffbac9b2d901282a7661af7fe0a5bc501581027cc193213"
  },
  "main.js": {
    "marker": "MAIN",
    "count": 4,
    "blockHash": "39c174fa36ae90fa44cfcaf875b4be44826079d362708f40beb6e2e1de5fa451",
    "pairs": [
      [
        " const captureOccluders=[...(world.captureOccluders||[]),...(orchidMantisHabitat?.captureOccluders||[]),",
        " const captureOccluders=[...(world.captureOccluders||[]),"
      ],
      [
        " const scales={orchidmantis:4.8,tigerbeetle:4.8,",
        " const scales={tigerbeetle:4.8,"
      ],
      [
        "location:result.item.species==='orchidmantis'?'東南アジア林・道沿いの広い葉（再現区画）':result.item.species==='tigerbeetle'",
        "location:result.item.species==='tigerbeetle'"
      ],
      [
        "toast(item?.species==='orchidmantis'?`${SPECIES.orchidmantis.name}を、もとの葉へそっと返しました。`:item?.species==='tigerbeetle'",
        "toast(item?.species==='tigerbeetle'"
      ],
      [
        "function collides(x,z){for(const c of [...(world.colliders||[]),...(orchidMantisHabitat?.colliders||[]),",
        "function collides(x,z){for(const c of [...(world.colliders||[]),"
      ]
    ],
    "priorHash": "696758854adfb4ba001c744d216497a6052d4e865a4c292de1695df3cfbdde5d"
  }
};
function prior(source,file){let s=norm(source);const r=records[file],pattern=new RegExp('^[ \t]*// ORCHID_MANTIS_'+r.marker+'_BEGIN\n[\\s\\S]*?^[ \t]*// ORCHID_MANTIS_'+r.marker+'_END\n','gm'),blocks=s.match(pattern)||[];assert.equal(blocks.length,r.count);assert.equal(hash(blocks.join('')),r.blockHash);s=s.replace(pattern,'');for(const[a,b]of r.pairs){assert.equal(s.split(a).length-1,1);s=s.replace(a,b);}assert.equal(hash(s),r.priorHash);return s;}
export const priorOrchidModel=s=>prior(s.includes('RAINBOW_INDIVIDUAL_BEGIN')?before057Model(s):s,'insect-models.js');
export const priorOrchidMain=s=>prior(s.includes('[5,6,7,8].includes(activeOuting?.generatorVersion)')?before057Main(s):s,'main.js');
