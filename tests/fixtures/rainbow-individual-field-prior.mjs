import {priorIndividualLayout as before059Layout} from './goliath-individual-field-prior.mjs';
import {priorModel as before058Model} from './xylotrupes-integration-prior.mjs';
import {priorInsects as before058Insects} from './xylotrupes-field-prior.mjs';
/** Pure 057 inverse: exact marked additions, complete frozen056 hashes; no git/history. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const hash=s=>createHash('sha256').update(s).digest('hex');
export const normalizeRainbowIndividual=s=>s.replace(/(from\s*['"]\.\/[^'"?\n]+)(?:\?[^'"\n]*)?(['"])/g,'$1$2');
const records={
  "rainbow-stag-layout.js": {
    "hash": "5eb31addfb5c95fea9251d39f828901d852308552e96093ba2f438e2b9efc944",
    "replacements": [
      [
        "// RAINBOW_INDIVIDUAL_BEGIN\nexport const RAINBOW_STAG_SITES=Object.freeze([-.12,0,.12]);\n// RAINBOW_INDIVIDUAL_END\n",
        ""
      ]
    ],
    "blocks": 1,
    "blockHash": "45591f48f2302018cabb8335951125a4e3d2ba97f6b7b6f5ef92f8b531fa3deb"
  },
  "rainbow-stag-study.js": {
    "hash": "75ce5e466fb9bf4a008d54d1a47c4eeaaec85e6ef5edb65b555e744ba51fcf1e",
    "replacements": [
      [
        "// RAINBOW_INDIVIDUAL_BEGIN\nexport function createRainbowStagStudy(options={}){\n // New scalar channels are owned data, never accessors. Existing extra options\n // and profileless support behaviour remain as before; field owns world bounds.\n for(const key of['scale','motionSeed']){const d=options&&Object.getOwnPropertyDescriptor(options,key);if(d&&!('value'in d))throw new TypeError('Invalid rainbow-stag scalar accessor');}\n const {scale=1,position={x:0,y:D.rootAboveSupport*scale,z:0},orientation={x:0,y:0,z:0,w:1},retreatBounds={min:-.34,max:.34},motionSeed=1729}=options;\n if(!Number.isFinite(scale)||scale<1||scale>1.15)throw new TypeError('Invalid rainbow-stag display scale');\n// RAINBOW_INDIVIDUAL_END",
        "export function createRainbowStagStudy({position={x:0,y:D.rootAboveSupport,z:0},orientation={x:0,y:0,z:0,w:1},retreatBounds={min:-.34,max:.34},motionSeed=1729}={}){"
      ],
      [
        " // RAINBOW_INDIVIDUAL_BEGIN\n const core=createBranchRetreatStudy({boundedStepFinish:true,species:'rainbowstag',position:{x:0,y:D.rootAboveSupport*scale,z:0},heading:Math.PI/2,scale,motionSeed,retreatBounds,cycleDistance:D.cycleDistance,rootAboveSupport:D.rootAboveSupport,warningSeconds:RAINBOW_STAG_MOTION.warningSeconds,retreatDistance:RAINBOW_STAG_MOTION.retreatDistance,retreatSpeed:RAINBOW_STAG_MOTION.retreatSpeed,jawRest:D.restJawOpen,jawWarning:.65});\n // RAINBOW_INDIVIDUAL_END",
        " const core=createBranchRetreatStudy({boundedStepFinish:true,species:'rainbowstag',position:{x:0,y:D.rootAboveSupport,z:0},heading:Math.PI/2,scale:1,motionSeed,retreatBounds,cycleDistance:D.cycleDistance,rootAboveSupport:D.rootAboveSupport,warningSeconds:RAINBOW_STAG_MOTION.warningSeconds,retreatDistance:RAINBOW_STAG_MOTION.retreatDistance,retreatSpeed:RAINBOW_STAG_MOTION.retreatSpeed,jawRest:D.restJawOpen,jawWarning:.65});"
      ],
      [
        " // RAINBOW_INDIVIDUAL_BEGIN\n function state(){const {heading,pitch,...s}=core.state,d=s.walkPhase/(2*Math.PI)*D.cycleDistance*scale;return{...s,position:{x:origin.x+axis.x*d,y:origin.y,z:origin.z+axis.z*d},orientation:{...q}};}\n // RAINBOW_INDIVIDUAL_END",
        " function state(){const {heading,pitch,...s}=core.state,d=s.walkPhase/(2*Math.PI)*D.cycleDistance;return{...s,position:{x:origin.x+axis.x*d,y:origin.y,z:origin.z+axis.z*d},orientation:{...q}};}"
      ]
    ],
    "blocks": 3,
    "blockHash": "9f49a1c833c8c4c2f7fba8c6eadbb5c2e0a785dc66ec96c4b72340eeedb26a87"
  },
  "rainbow-stag-habitat.js": {
    "hash": "a8d554c80a3e05b38c1bdde6e79e7e2c0321f9d1584e424190aaecd02a53e4a3",
    "replacements": [
      [
        " // RAINBOW_INDIVIDUAL_BEGIN\n for(const d of[L.min,0,L.max])for(const x of[-.105*1.15,0,.105*1.15])for(const z of[-.105*1.15,0,.105*1.15]){const p=hit.point.clone().add(new T.Vector3(d+z,0,-x));ray.set(p.clone().add(new T.Vector3(0,.2,0)),new T.Vector3(0,-1,0));const h=ray.intersectObject(log,false)[0];if(!h?.face||h.face.normal.y<.999999||h.point.distanceTo(p)>1e-6)throw new Error('Rainbow foot envelope leaves real top facet');}\n // RAINBOW_INDIVIDUAL_END",
        " for(const d of[L.min,0,L.max])for(const x of[-.105,0,.105])for(const z of[-.105,0,.105]){const p=hit.point.clone().add(new T.Vector3(d+z,0,-x));ray.set(p.clone().add(new T.Vector3(0,.2,0)),new T.Vector3(0,-1,0));const h=ray.intersectObject(log,false)[0];if(!h?.face||h.face.normal.y<.999999||h.point.distanceTo(p)>1e-6)throw new Error('Rainbow foot envelope leaves real top facet');}"
      ]
    ],
    "blocks": 1,
    "blockHash": "86a04fd7da3c081d839f2e72034679a34870e3c251865b0358331643bc49ebf6"
  },
  "individual-layout.js": {
    "hash": "014a2ac8f8298c6eb928016d620263ca93a10c8252b633d9ae11413479d552f7",
    "replacements": [
      [
        "// RAINBOW_INDIVIDUAL_BEGIN\nimport {RAINBOW_STAG_SITES} from './rainbow-stag-layout.js';\n// RAINBOW_INDIVIDUAL_END\n",
        ""
      ],
      [
        "// RAINBOW_INDIVIDUAL_BEGIN\nconst ROOT_HEIGHT=Object.freeze({hercules:.06,rhino:.05,stag:.045,metallifer:0,giantstag:.045,atlas:.055,manticora:.055,europestag:.055,giraffestag:.060,rainbowstag:.050});\n// RAINBOW_INDIVIDUAL_END",
        "const ROOT_HEIGHT=Object.freeze({hercules:.06,rhino:.05,stag:.045,metallifer:0,giantstag:.045,atlas:.055,manticora:.055,europestag:.055,giraffestag:.060});"
      ],
      [
        "// RAINBOW_INDIVIDUAL_BEGIN\nconst SUPPORT=Object.freeze({hercules:'herculesSupports',rhino:'rhinoSupports',stag:'stagSupports',metallifer:'metalliferSupports',giantstag:'giantStagSupports',atlas:'atlasSupports',manticora:'manticoraSupports',europestag:'europeStagSupports',giraffestag:'giraffeStagSupports',rainbowstag:'rainbowStagSupports'});\n// RAINBOW_INDIVIDUAL_END",
        "const SUPPORT=Object.freeze({hercules:'herculesSupports',rhino:'rhinoSupports',stag:'stagSupports',metallifer:'metalliferSupports',giantstag:'giantStagSupports',atlas:'atlasSupports',manticora:'manticoraSupports',europestag:'europeStagSupports',giraffestag:'giraffeStagSupports'});"
      ],
      [
        "  // RAINBOW_INDIVIDUAL_BEGIN\n  // Only the home changes: the three starts share one unchanged physical log.\n  if(e.species==='rainbowstag'){\n   const offset=RAINBOW_STAG_SITES[e.siteIndex],axis=support.axis,limits=support.retreatBounds;\n   if(!axis||![axis.x,axis.y,axis.z,limits?.min,limits?.max].every(Number.isFinite)||Math.abs(axis.y)>1e-8||Math.abs(Math.hypot(axis.x,axis.y,axis.z)-1)>1e-8||limits.min>=limits.max)throw new TypeError('Rainbow-stag physical lane missing');\n   support.home={x:old.x+axis.x*offset,y:old.y+ROOT_HEIGHT.rainbowstag*(factor-1),z:old.z+axis.z*offset};\n   support.retreatBounds={min:limits.min-offset,max:limits.max-offset};\n   row[1]=support.home.x;row[2]=support.home.z;row[3]=support.home.y-heightAt(row[1],row[2]);\n   continue;\n  }\n  // RAINBOW_INDIVIDUAL_END\n",
        ""
      ]
    ],
    "blocks": 4,
    "blockHash": "bf7043c7dd52a992f079048d6eaf2569b2f8c5741d389aad34aaa621f25bad03"
  },
  "insect-models.js": {
    "hash": "150e031ed6084cb5cc46ee0024be33c157dac7b1127466c93cebfbf432c9b366",
    "replacements": [
      [
        "  // RAINBOW_INDIVIDUAL_BEGIN\n  const eligible=['hercules','rhino','stag','metallifer','giantstag','atlas','manticora','europestag','giraffestag','rainbowstag'].includes(species);\n  // RAINBOW_INDIVIDUAL_END",
        "  const eligible=['hercules','rhino','stag','metallifer','giantstag','atlas','manticora','europestag','giraffestag'].includes(species);"
      ]
    ],
    "blocks": 1,
    "blockHash": "91692501399950c816e5615ffd916deafd2469ca6bed91e3bc4ee5a31e984f2d"
  },
  "insects.js": {
    "hash": "fe61c9f64154fad32c792bfc82752f2cd51fc6076a8236c58c76712763504ab7",
    "replacements": [
      [
        "// RAINBOW_INDIVIDUAL_BEGIN\nimport {RAINBOW_LANE,RAINBOW_STAG_SITES} from './rainbow-stag-layout.js';\n// RAINBOW_INDIVIDUAL_END\n",
        ""
      ],
      [
        "  // RAINBOW_INDIVIDUAL_BEGIN\n  rainbowstag:{name:'ニジイロクワガタ（雄）',label:'ニジイロクワガタ',scientificName:'Phalacrognathus muelleri',size:'試作表示は胴と頭が約18cm、大顎先まで約27cm。実物の寸法ではなく表示補正です。新しい散策の保存成功後は表示指数100〜115の個体差があります。以前の固定個体は未計測のままです。',observation:'北東オーストラリアの熱帯雨林にすむクワガタで、幼虫は腐朽した木で育ちます。丸みのある背と、光の角度で変わる色を見比べてみましょう。成虫を低い倒木に置いた短い歩行はゲーム上の観察配置です。成虫の食事・活動時刻や、野生の反応速度は再現していません。',hint:'雨林の低い倒木を横から見て。丸い背と、前方へ伸びる大顎を探して。',color:'#68854e'},\n  // RAINBOW_INDIVIDUAL_END",
        "  rainbowstag:{name:'ニジイロクワガタ（雄）',label:'ニジイロクワガタ',scientificName:'Phalacrognathus muelleri',size:'試作表示は胴と頭が約18cm、大顎先まで約27cm。実物の寸法ではなく表示補正です。今回は固定の未計測個体です。',observation:'北東オーストラリアの熱帯雨林にすむクワガタで、幼虫は腐朽した木で育ちます。丸みのある背と、光の角度で変わる色を見比べてみましょう。成虫を低い倒木に置いた短い歩行はゲーム上の観察配置です。成虫の食事・活動時刻や、野生の反応速度は再現していません。',hint:'雨林の低い倒木を横から見て。丸い背と、前方へ伸びる大顎を探して。',color:'#68854e'},"
      ],
      [
        "  // RAINBOW_INDIVIDUAL_BEGIN\n  if(initialHomes.length===1&&initialHomes[0][0]==='rainbowstag'){\n    if(Object.getPrototypeOf(individuals)!==Array.prototype||individuals.length>1||Reflect.ownKeys(individuals).length!==individuals.length+1)throw new TypeError('Invalid rainbow-stag individual profiles');\n    for(let i=0;i<individuals.length;i++){const d=Object.getOwnPropertyDescriptor(individuals,String(i));if(!d||!('value'in d))throw new TypeError('Invalid rainbow-stag individual profile accessor');}\n  }\n  // RAINBOW_INDIVIDUAL_END\n",
        ""
      ],
      [
        "    // RAINBOW_INDIVIDUAL_BEGIN\n    const rainbowDescriptor=e&&Object.getOwnPropertyDescriptor(e,'species');\n    if(initialHomes.length===1&&initialHomes[0][0]==='rainbowstag'&&rainbowDescriptor?.value!=='rainbowstag')throw new TypeError('Invalid rainbow-stag individual profile species');\n    if(rainbowDescriptor?.value==='rainbowstag'){\n      const keys=['species','habitat','runtimeSlotId','populationSlotId','encounterId','sizePermille','motionSeed','siteIndex','measureVersion'];\n      if(![Object.prototype,null].includes(Object.getPrototypeOf(e))||Reflect.ownKeys(e).length!==keys.length||!keys.every(k=>Object.hasOwn(e,k)&&'value'in Object.getOwnPropertyDescriptor(e,k)))throw new TypeError('Invalid rainbow-stag individual profile');\n      const match=typeof e.encounterId==='string'&&/^g8-[0-9a-f]{8}-o([1-9][0-9]{0,15})-australia-rainbowstag$/.exec(e.encounterId);\n      if(e.habitat!=='australia'||e.runtimeSlotId!=='insect-1'||e.populationSlotId!=='rainbowstag'||initialHomes.length!==1||initialHomes[0][0]!=='rainbowstag'||profiles.has(e.runtimeSlotId)||!Number.isInteger(e.sizePermille)||e.sizePermille<1000||e.sizePermille>1150||!Number.isInteger(e.motionSeed)||e.motionSeed<0||e.motionSeed>0xffffffff||e.measureVersion!==1||!Number.isInteger(e.siteIndex)||e.siteIndex<0||e.siteIndex>=RAINBOW_STAG_SITES.length||!match||!Number.isSafeInteger(Number(match[1])))throw new TypeError('Rainbow-stag individual profile does not match home');\n      profiles.set(e.runtimeSlotId,{...e});continue;\n    }\n    // RAINBOW_INDIVIDUAL_END\n",
        ""
      ],
      [
        "    // RAINBOW_INDIVIDUAL_BEGIN\n    const rainbowProfile=profiles.get('insect-1'),rainbowMeasured=rainbowProfile?.species==='rainbowstag';\n    // RAINBOW_INDIVIDUAL_END\n",
        ""
      ],
      [
        "      // RAINBOW_INDIVIDUAL_BEGIN\n      if(rainbowMeasured){\n        const site=RAINBOW_STAG_SITES[rainbowProfile.siteIndex],factor=rainbowProfile.sizePermille/1000,L=RAINBOW_LANE;\n        if(![...Object.values(home),...Object.values(axis),...Object.values(retreatBounds),ground].every(Number.isFinite)||Math.hypot(home.x-L.surface.x-site,home.y-L.surface.y-L.rootAboveSupport*factor,home.z-L.surface.z)>1e-7||Math.hypot(axis.x-1,axis.y,axis.z)>1e-8||Math.abs(home.x+axis.x*retreatBounds.min-L.min)>1e-10||Math.abs(home.x+axis.x*retreatBounds.max-L.max)>1e-10)throw new Error();\n      }else{\n      if(![...Object.values(home),...Object.values(axis),...Object.values(retreatBounds),ground].every(Number.isFinite)||Math.abs(home.x)>flightBounds||Math.abs(home.z)>flightBounds||home.y<ground+.05-1e-8||home.y>ground+1.5||retreatBounds.min<-.34-1e-10||retreatBounds.max>.34+1e-10)throw new Error();\n      }\n      // RAINBOW_INDIVIDUAL_END",
        "      if(![...Object.values(home),...Object.values(axis),...Object.values(retreatBounds),ground].every(Number.isFinite)||Math.abs(home.x)>flightBounds||Math.abs(home.z)>flightBounds||home.y<ground+.05-1e-8||home.y>ground+1.5||retreatBounds.min<-.34-1e-10||retreatBounds.max>.34+1e-10)throw new Error();"
      ],
      [
        "      // RAINBOW_INDIVIDUAL_BEGIN\n      const q=createRainbowStagStudy({position:home,orientation,retreatBounds,...(rainbowMeasured?{scale:rainbowProfile.sizePermille/1000,motionSeed:rainbowProfile.motionSeed}:{})}).state.orientation,expected={x:2*(q.x*q.z+q.w*q.y),y:2*(q.y*q.z-q.w*q.x),z:1-2*(q.x*q.x+q.y*q.y)};\n      // RAINBOW_INDIVIDUAL_END",
        "      const q=createRainbowStagStudy({position:home,orientation,retreatBounds}).state.orientation,expected={x:2*(q.x*q.z+q.w*q.y),y:2*(q.y*q.z-q.w*q.x),z:1-2*(q.x*q.x+q.y*q.y)};"
      ],
      [
        "    // RAINBOW_INDIVIDUAL_BEGIN\n    if(rows.length){const{row:[,x,z,altitude],index}=rows[0],g=groups[0];if((rainbowMeasured&&(index!==0||profiles.size!==1))||Math.hypot(g.home.x-x,g.home.y-heightAt(x,z)-altitude,g.home.z-z)>1e-6)throw new Error();rainbowStagGroups.set(index,g);}\n    // RAINBOW_INDIVIDUAL_END",
        "    if(rows.length){const{row:[,x,z,altitude],index}=rows[0],g=groups[0];if(Math.hypot(g.home.x-x,g.home.y-heightAt(x,z)-altitude,g.home.z-z)>1e-6)throw new Error();rainbowStagGroups.set(index,g);}"
      ],
      [
        "        // RAINBOW_INDIVIDUAL_BEGIN\n        const profile=profiles.get(item.id);\n        rainbowStags.set(item.id,{study:createRainbowStagStudy({position:support.home,orientation:support.orientation,retreatBounds:support.retreatBounds,...(profile?{scale:profile.sizePermille/1000,motionSeed:profile.motionSeed}:{})})});syncRainbowStag(item);\n        // RAINBOW_INDIVIDUAL_END",
        "        rainbowStags.set(item.id,{study:createRainbowStagStudy({position:support.home,orientation:support.orientation,retreatBounds:support.retreatBounds})});syncRainbowStag(item);"
      ]
    ],
    "blocks": 9,
    "blockHash": "7d74c2d17bb9270c73d3d428e9874eed1fabf55d710f339b08808412885bb209"
  }
};
export function prior(source,file){
 let s=normalizeRainbowIndividual(source);const r=records[file];assert.ok(r,'known 057 source');
 const blocks=s.match(/^[ \t]*\/\/ RAINBOW_INDIVIDUAL_BEGIN\n[\s\S]*?^[ \t]*\/\/ RAINBOW_INDIVIDUAL_END/gm)||[];
 assert.equal(blocks.length,r.blocks,file+' marker count');assert.equal(hash(blocks.join('')),r.blockHash,file+' marked block hash');
 for(const [added,old]of [...r.replacements].reverse()){assert.equal(s.split(added).length-1,1,file+' literal exact once');s=s.replace(added,old);}
 assert.equal(s.includes('RAINBOW_INDIVIDUAL_'),false);assert.equal(hash(s),r.hash,file+' frozen056 source');return s;
}
export const priorModel=s=>prior(s.includes('XYLOTRUPES_MODEL_BEGIN')?before058Model(s):s,'insect-models.js');
export const priorInsects=s=>prior(s.includes('XYLOTRUPES_BEGIN')?before058Insects(s):s,'insects.js');
export const priorStudy=s=>prior(s,'rainbow-stag-study.js');
export const priorHabitat=s=>prior(s,'rainbow-stag-habitat.js');
export const priorLayout=s=>prior(s,'rainbow-stag-layout.js');
export const priorIndividualLayout=s=>prior(s.includes('GOLIATH_INDIVIDUAL_BEGIN')?before059Layout(s):s,'individual-layout.js');
