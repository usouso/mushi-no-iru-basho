import {priorOrchidModel,priorOrchidMain} from './orchid-mantis-integration-prior.mjs';
/** Exact053 integration inverse to frozen052; no filesystem or Git-history dependency. */
import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const hash=s=>createHash('sha256').update(s).digest('hex'),norm=s=>s.replace(/\?v=[0-9.]+&b=[a-f0-9]+/g,'');
const records={
  "insect-models.js": {
    "marker": "MODEL",
    "count": 3,
    "blockHash": "e1ac49ae2ab27cde3e3c8a8449df723f5ff8ca11f7dcb53f28e3604b7b56308f",
    "pairs": [],
    "priorHash": "27b8622e2cff79680cb693c4dfbf8da67695f7d5e81e6ea807b6fe1b6c8bdc66"
  },
  "main.js": {
    "marker": "MAIN",
    "count": 4,
    "blockHash": "a0d54ea91fd2171a5cba3127ddc8f123bc08da721b7040d1f16f1d34f1ced8a9",
    "pairs": [
      [
        " const scales={tigerbeetle:4.8,giraffestag:3.4,",
        " const scales={giraffestag:3.4,"
      ],
      [
        "location:result.item.species==='tigerbeetle'?'温帯の草地・東の土道':result.item.species==='giraffestag'",
        "location:result.item.species==='giraffestag'"
      ],
      [
        "toast(item?.species==='tigerbeetle'?`${SPECIES.tigerbeetle.name}を、土道へそっと返しました。`:item?.species==='giraffestag'",
        "toast(item?.species==='giraffestag'"
      ]
    ],
    "priorHash": "bea8857a297a3459e5ab38f34d230d3df682bda0d80bf025aee815214bfaf540"
  }
};
function prior(source,file){let s=norm(source);const r=records[file],pattern=new RegExp('^[ \t]*// TIGER_BEETLE_'+r.marker+'_BEGIN\n[\\s\\S]*?^[ \t]*// TIGER_BEETLE_'+r.marker+'_END\n','gm'),blocks=s.match(pattern)||[];assert.equal(blocks.length,r.count);assert.equal(hash(blocks.join('')),r.blockHash);s=s.replace(pattern,'');for(const[a,b]of r.pairs){assert.equal(s.split(a).length-1,1);s=s.replace(a,b);}assert.equal(hash(s),r.priorHash);return s;}
export const priorTigerModel=s=>prior(priorOrchidModel(s),'insect-models.js');
export const priorTigerMain=s=>prior(priorOrchidMain(s),'main.js');
