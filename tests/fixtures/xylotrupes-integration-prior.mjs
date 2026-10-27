import {priorModel as before059Model,priorMain as before059Main} from './goliath-individual-integration-prior.mjs';
/** Exact058 additions to frozen057. Node builtins only, no history/private files. */
import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const hash=s=>createHash('sha256').update(s).digest('hex'),norm=s=>s.replace(/\?v=[0-9.]+&b=[a-f0-9]+/g,'');
const records={
  "insect-models.js": {
    "marker": "MODEL",
    "count": 3,
    "blockHash": "159f4a622c0ee51455dd81fb7e4ab85e14f05f112cf0bf33774f09b269af636d",
    "pairs": [],
    "priorHash": "7ed6dd6ba8b91b6ac551453f36c97552aebcba81abcc8fb0959045543b331feb"
  },
  "main.js": {
    "marker": "MAIN",
    "count": 4,
    "blockHash": "0fe5f5567604fa2cf9b021da42cba6cf45048b3aff8dce437adccb008a84927b",
    "pairs": [
      [
        " const captureOccluders=[...(world.captureOccluders||[]),...(xylotrupesHabitat?.captureOccluders||[]),",
        " const captureOccluders=[...(world.captureOccluders||[]),"
      ],
      [
        "function collides(x,z){for(const c of [...(world.colliders||[]),...(xylotrupesHabitat?.colliders||[]),",
        "function collides(x,z){for(const c of [...(world.colliders||[]),"
      ],
      [
        " const scales={xylotrupes:3.4,orchidmantis:4.8,",
        " const scales={orchidmantis:4.8,"
      ],
      [
        "location:result.item.species==='xylotrupes'?'豪州参考区画・観察用の低い枝':result.item.species==='orchidmantis'",
        "location:result.item.species==='orchidmantis'"
      ],
      [
        "item?.species==='xylotrupes'?`${SPECIES.xylotrupes.name}を、もとの枝へそっと返しました。`:item?.species==='orchidmantis'?",
        "item?.species==='orchidmantis'?"
      ],
      [
        "hint:'倒木の虹色、東の枝の二本角。横からそっと探そう。'",
        "hint:'倒木の上に、緑や紫の背。横からそっと近づいてみよう。'"
      ]
    ],
    "priorHash": "1bf5de1570c77dc46cf22e0cae82efee826b7e634b557a95e095dfd06312d3fe"
  }
};
function prior(source,file){let s=norm(source);const r=records[file],pattern=new RegExp('^[ \t]*// XYLOTRUPES_'+r.marker+'_BEGIN\n[\\s\\S]*?^[ \t]*// XYLOTRUPES_'+r.marker+'_END\n','gm'),blocks=s.match(pattern)||[];assert.equal(blocks.length,r.count);assert.equal(hash(blocks.join('')),r.blockHash);s=s.replace(pattern,'');for(const[a,b]of r.pairs){assert.equal(s.split(a).length-1,1);s=s.replace(a,b);}assert.equal(hash(s),r.priorHash);return s;}
export const priorModel=s=>prior(s.includes("'rainbowstag','goliath'].includes(species)")?before059Model(s):s,'insect-models.js');
export const priorMain=s=>prior(s.includes('[5,6,7,8,9].includes(activeOuting?.generatorVersion)')?before059Main(s):s,'main.js');
