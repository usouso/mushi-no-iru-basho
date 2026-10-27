import {priorTigerModel} from './tiger-beetle-integration-prior.mjs';
import {priorInsects as priorTigerInsects} from './tiger-beetle-field-prior.mjs';
/** Pure 052 inverse: exact owned additions only; frozen051 goldens remain unchanged. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const hash=s=>createHash('sha256').update(s).digest('hex');
export const normalizeGiraffeIndividual=s=>s.replace(/(from\s*['"]\.\/[^'"?\n]+)(?:\?[^'"\n]*)?(['"])/g,'$1$2');
const records={
  "src/giraffe-stag-study.js": {
    "hash": "4d08d4acfff61b27dde5388fe4e5afe6f7f20d0047df2c26df5d38921243e89b",
    "replacements": [
      [
        "// GIRAFFE_INDIVIDUAL_BEGIN\n/** Authored branch display, not field biology. Optional scale/seed preserve the same gait; no flight/feeding options. Field caller owns canonical world-lane validation. */\n// GIRAFFE_INDIVIDUAL_END",
        "/** Fixed authored branch study; warning .22s, retreat .12m / .14m/s are game tuning, not field biology. Caller owns approach and LOS. No size/profile/flight/feeding options. */"
      ],
      [
        " // GIRAFFE_INDIVIDUAL_BEGIN\n if(!options||![Object.prototype,null].includes(Object.getPrototypeOf(options))||Reflect.ownKeys(options).some(k=>!['position','orientation','retreatBounds','scale','motionSeed'].includes(k)||!('value'in Object.getOwnPropertyDescriptor(options,k))))throw new TypeError('Invalid giraffe-stag options');\n const {scale=1,motionSeed=1729,position={x:0,y:D.rootAboveSupport*scale,z:0},orientation={x:0,y:0,z:0,w:1},retreatBounds={min:-.24,max:.24}}=options;\n if(!Number.isFinite(scale)||scale<1||scale>1.15||!Number.isInteger(motionSeed)||motionSeed<0||motionSeed>0xffffffff)throw new TypeError('Invalid giraffe-stag display scale or motion seed');\n const measured=Object.hasOwn(options,'scale')||Object.hasOwn(options,'motionSeed');\n if(!record(retreatBounds,['min','max'])||(measured?(retreatBounds.min<-.36-1e-10||retreatBounds.max>.36+1e-10||retreatBounds.max-retreatBounds.min>.48+1e-10):(retreatBounds.min<-.24||retreatBounds.max>.24)))throw new TypeError('Invalid giraffe-stag lane');\n if(!record(position,['x','y','z'])||Object.values(position).some(x=>Math.abs(x)>1e4)||!record(orientation,['x','y','z','w'])||Math.abs(Math.hypot(orientation.x,orientation.y,orientation.z,orientation.w)-1)>1e-6)throw new TypeError('Invalid giraffe-stag fixed support');\n // GIRAFFE_INDIVIDUAL_END\n",
        " if(!options||![Object.prototype,null].includes(Object.getPrototypeOf(options))||Reflect.ownKeys(options).some(k=>!['position','orientation','retreatBounds'].includes(k)||!('value'in Object.getOwnPropertyDescriptor(options,k))))throw new TypeError('Invalid giraffe-stag options');\n const {position={x:0,y:D.rootAboveSupport,z:0},orientation={x:0,y:0,z:0,w:1},retreatBounds={min:-.24,max:.24}}=options,scale=1,motionSeed=1729;\n if(!record(retreatBounds,['min','max'])||retreatBounds.min<-.24||retreatBounds.max>.24)throw new TypeError('Invalid giraffe-stag lane');\n if(!record(position,['x','y','z'])||Object.values(position).some(x=>Math.abs(x)>1e4)||!record(orientation,['x','y','z','w'])||Math.abs(Math.hypot(orientation.x,orientation.y,orientation.z,orientation.w)-1)>1e-6)throw new TypeError('Invalid giraffe-stag fixed support');\n"
      ]
    ],
    "blocks": 2,
    "blockHash": "932f89494dbc3bc77f69d30e8b59e741f1987f84f02f44963578fc4187b0015c"
  },
  "src/giraffe-stag-habitat.js": {
    "hash": "7c9b103f095d83ea151b922adcb3f0f8c96c4bbdb4a2965e65f36b784d473297",
    "replacements": [
      [
        " // GIRAFFE_INDIVIDUAL_BEGIN\n for(const d of[S.retreatBounds.min,0,S.retreatBounds.max])for(const z of[-.12*1.15,0,.12*1.15])for(const x of[-.115*1.15,0,.115*1.15]){const p=new T.Vector3(d+z,B.top+.2,-x);ray.set(p,down);const h=ray.intersectObject(branch,false)[0];if(!h?.face||h.face.normal.clone().transformDirection(branch.matrixWorld).y<.999999||Math.abs(h.point.y-B.top)>1e-6)throw new Error('Actual horizontal giraffe-stag foot envelope required');top=h.point.y;rays++;}\n // GIRAFFE_INDIVIDUAL_END",
        " for(const d of[S.retreatBounds.min,0,S.retreatBounds.max])for(const x of[-.12,0,.12])for(const z of[-.115,0,.115]){const p=new T.Vector3(d+z,B.top+.2,-x);ray.set(p,down);const h=ray.intersectObject(branch,false)[0];if(!h?.face||h.face.normal.clone().transformDirection(branch.matrixWorld).y<.999999||Math.abs(h.point.y-B.top)>1e-6)throw new Error('Actual horizontal giraffe-stag foot envelope required');top=h.point.y;rays++;}"
      ]
    ],
    "blocks": 1,
    "blockHash": "c3cc6b6fb965e876764d29e1e1ff0e5bef06c6b63040fd24eedab8e657807c92"
  },
  "src/giraffe-stag-layout.js": {
    "hash": "20b2223c028c08700f11ae2de5ab86d920a2283ff6e4a3ad13d5d768b3d899d3",
    "replacements": [
      [
        "// GIRAFFE_INDIVIDUAL_BEGIN\nexport const GIRAFFE_STAG_SITES=Object.freeze([-.12,0,.12]);\n// GIRAFFE_INDIVIDUAL_END\nexport const GIRAFFE_STAG_APPROACH=Object.freeze({x:0,z:1.5});",
        "export const GIRAFFE_STAG_APPROACH=Object.freeze({x:0,z:1.5});"
      ]
    ],
    "blocks": 1,
    "blockHash": "d78ce4e78f2ab9b7bd102394d2cf95350960e04237df2122cb3961bc85849251"
  },
  "src/insects.js": {
    "hash": "340283937de3613add149f43e961a862542d9c20428a7d4b607d287636e7ef39",
    "replacements": [
      [
        "// GIRAFFE_INDIVIDUAL_BEGIN\nimport {GIRAFFE_STAG_BRANCH,GIRAFFE_STAG_SUPPORT,GIRAFFE_STAG_SITES} from './giraffe-stag-layout.js';\n// GIRAFFE_INDIVIDUAL_END\n// GIRAFFE_STAG_BEGIN\nimport {createGiraffeStagStudy} from './giraffe-stag-study.js';",
        "// GIRAFFE_STAG_BEGIN\nimport {createGiraffeStagStudy} from './giraffe-stag-study.js';"
      ],
      [
        "  // GIRAFFE_INDIVIDUAL_BEGIN\n  giraffestag:{name:'ギラファノコギリクワガタ（雄）',label:'ギラファノコギリクワガタ',scientificName:'Prosopocoilus giraffa',size:'試作表示は頭と胴が約20cm、大顎先まで約40cm。実物の寸法ではなく表示補正です。新しい散策の保存成功後は大きさの表示指数を記録します（同種の基準100）。以前の固定個体は未計測のままです。',observation:'インドネシアのフローレス島で採集された雄の標本を参考にしています。長く伸びた大顎の形を、いろいろな向きから観察してみよう。この林の枝や歩く動きは、観察しやすくしたゲーム用の参考再現です。',hint:'観察用の低い横枝を横から探して。長い大顎の先まで、そっと見比べてみよう。',color:'#29251f'},\n  // GIRAFFE_INDIVIDUAL_END",
        "  giraffestag:{name:'ギラファノコギリクワガタ（雄）',label:'ギラファノコギリクワガタ',scientificName:'Prosopocoilus giraffa',size:'試作表示は頭と胴が約20cm、大顎先まで約40cm。実物の寸法ではなく表示補正で、今回は固定の未計測個体です。',observation:'インドネシアのフローレス島で採集された雄の標本を参考にしています。長く伸びた大顎の形を、いろいろな向きから観察してみよう。この林の枝や歩く動きは、観察しやすくしたゲーム用の参考再現です。',hint:'観察用の低い横枝を横から探して。長い大顎の先まで、そっと見比べてみよう。',color:'#29251f'},"
      ],
      [
        "  // GIRAFFE_INDIVIDUAL_BEGIN\n  // Only Flores enforces a plain, owned dense profile array here; old regions keep their contract.\n  if(initialHomes.length===1&&initialHomes[0][0]==='giraffestag'){\n    if(Object.getPrototypeOf(individuals)!==Array.prototype||individuals.length>1||Reflect.ownKeys(individuals).length!==individuals.length+1)throw new TypeError('Invalid giraffe-stag individual profiles');\n    for(let i=0;i<individuals.length;i++){const d=Object.getOwnPropertyDescriptor(individuals,String(i));if(!d||!('value'in d))throw new TypeError('Invalid giraffe-stag individual profile accessor');}\n  }\n  // GIRAFFE_INDIVIDUAL_END\n  for(const e of individuals){\n    // GIRAFFE_INDIVIDUAL_BEGIN\n    const giraffeDescriptor=e&&Object.getOwnPropertyDescriptor(e,'species');\n    if(initialHomes.length===1&&initialHomes[0][0]==='giraffestag'&&giraffeDescriptor?.value!=='giraffestag')throw new TypeError('Invalid giraffe-stag individual profile species');\n    if(giraffeDescriptor?.value==='giraffestag'){\n      const keys=['species','habitat','runtimeSlotId','populationSlotId','encounterId','sizePermille','motionSeed','siteIndex','measureVersion'];\n      if(![Object.prototype,null].includes(Object.getPrototypeOf(e))||Reflect.ownKeys(e).length!==keys.length||!keys.every(k=>Object.hasOwn(e,k)&&'value'in Object.getOwnPropertyDescriptor(e,k)))throw new TypeError('Invalid giraffe-stag individual profile');\n      const match=typeof e.encounterId==='string'&&/^g7-[0-9a-f]{8}-o([1-9][0-9]{0,15})-flores-giraffestag$/.exec(e.encounterId);\n      if(e.habitat!=='flores'||e.runtimeSlotId!=='insect-1'||e.populationSlotId!=='giraffestag'||initialHomes.length!==1||initialHomes[0][0]!=='giraffestag'||profiles.has(e.runtimeSlotId)||!Number.isInteger(e.sizePermille)||e.sizePermille<1000||e.sizePermille>1150||!Number.isInteger(e.motionSeed)||e.motionSeed<0||e.motionSeed>0xffffffff||e.measureVersion!==1||!Number.isInteger(e.siteIndex)||e.siteIndex<0||e.siteIndex>=GIRAFFE_STAG_SITES.length||!match||!Number.isSafeInteger(Number(match[1])))throw new TypeError('Giraffe-stag individual profile does not match home');\n      profiles.set(e.runtimeSlotId,{...e});continue;\n    }\n    // GIRAFFE_INDIVIDUAL_END",
        "  for(const e of individuals){"
      ],
      [
        "    // GIRAFFE_INDIVIDUAL_BEGIN\n    const giraffeProfile=profiles.get('insect-1'),giraffeMeasured=giraffeProfile?.species==='giraffestag';\n    // GIRAFFE_INDIVIDUAL_END\n    const groups=array(giraffeStagSupports).map(g=>{",
        "    const groups=array(giraffeStagSupports).map(g=>{"
      ],
      [
        "      // GIRAFFE_INDIVIDUAL_BEGIN\n      if(![...Object.values(home),...Object.values(axis),...Object.values(retreatBounds),ground].every(Number.isFinite)||Math.abs(home.x)>flightBounds||Math.abs(home.z)>flightBounds||home.y<ground+.060-1e-8||Math.hypot(axis.x-1,axis.y,axis.z)>1e-8)throw new Error();\n      if(giraffeMeasured){\n        const site=GIRAFFE_STAG_SITES[giraffeProfile.siteIndex],factor=giraffeProfile.sizePermille/1000,lane=GIRAFFE_STAG_SUPPORT.retreatBounds;\n        if(Math.hypot(home.x-site,home.y-GIRAFFE_STAG_BRANCH.top-.060*factor,home.z)>1e-7||Math.abs(home.x+axis.x*retreatBounds.min-lane.min)>1e-10||Math.abs(home.x+axis.x*retreatBounds.max-lane.max)>1e-10)throw new Error();\n      }else if(Math.hypot(home.x,home.y-.86,home.z)>1e-7||Math.abs(retreatBounds.min+.24)>1e-10||Math.abs(retreatBounds.max-.24)>1e-10)throw new Error();\n      // GIRAFFE_INDIVIDUAL_END",
        "      if(![...Object.values(home),...Object.values(axis),...Object.values(retreatBounds),ground].every(Number.isFinite)||Math.abs(home.x)>flightBounds||Math.abs(home.z)>flightBounds||home.y<ground+.060-1e-8||Math.hypot(home.x,home.y-.86,home.z)>1e-7||Math.hypot(axis.x-1,axis.y,axis.z)>1e-8||Math.abs(retreatBounds.min+.24)>1e-10||Math.abs(retreatBounds.max-.24)>1e-10)throw new Error();"
      ],
      [
        "      // GIRAFFE_INDIVIDUAL_BEGIN\n      const q=createGiraffeStagStudy({position:home,orientation,retreatBounds,...(giraffeMeasured?{scale:giraffeProfile.sizePermille/1000,motionSeed:giraffeProfile.motionSeed}:{})}).state.orientation,expected={x:2*(q.x*q.z+q.w*q.y),y:2*(q.y*q.z-q.w*q.x),z:1-2*(q.x*q.x+q.y*q.y)};\n      // GIRAFFE_INDIVIDUAL_END",
        "      const q=createGiraffeStagStudy({position:home,orientation,retreatBounds}).state.orientation,expected={x:2*(q.x*q.z+q.w*q.y),y:2*(q.y*q.z-q.w*q.x),z:1-2*(q.x*q.x+q.y*q.y)};"
      ],
      [
        "    // GIRAFFE_INDIVIDUAL_BEGIN\n    if(rows.length){const{row:[,x,z,altitude],index}=rows[0],g=groups[0];if(index!==0||initialHomes.length!==1||(giraffeMeasured?profiles.size!==1:profiles.size!==0)||Math.hypot(g.home.x-x,g.home.y-heightAt(x,z)-altitude,g.home.z-z)>1e-6)throw new Error();giraffeStagGroups.set(index,g);}\n    // GIRAFFE_INDIVIDUAL_END",
        "    if(rows.length){const{row:[,x,z,altitude],index}=rows[0],g=groups[0];if(index!==0||initialHomes.length!==1||profiles.size||Math.hypot(g.home.x-x,g.home.y-heightAt(x,z)-altitude,g.home.z-z)>1e-6)throw new Error();giraffeStagGroups.set(index,g);}"
      ],
      [
        "        // GIRAFFE_INDIVIDUAL_BEGIN\n        giraffeStags.set(item.id,{study:createGiraffeStagStudy({position:support.home,orientation:support.orientation,retreatBounds:support.retreatBounds,...(profile?{scale:profile.sizePermille/1000,motionSeed:profile.motionSeed}:{})})});syncGiraffeStag(item);\n        // GIRAFFE_INDIVIDUAL_END",
        "        giraffeStags.set(item.id,{study:createGiraffeStagStudy({position:support.home,orientation:support.orientation,retreatBounds:support.retreatBounds})});syncGiraffeStag(item);"
      ]
    ],
    "blocks": 9,
    "blockHash": "d26b09e511a5fb92ba6eed92d496cc273fc3850ec92af2279f05fcd1413877c3"
  },
  "src/insect-models.js": {
    "hash": "2ea45d9085bc4d5fe0c242a1e35393986e55487b9c64dac1153d1bc9d9ff8108",
    "replacements": [
      [
        "  // GIRAFFE_INDIVIDUAL_BEGIN\n  const eligible=['hercules','rhino','stag','metallifer','giantstag','atlas','manticora','europestag','giraffestag'].includes(species);\n  // GIRAFFE_INDIVIDUAL_END",
        "  const eligible=['hercules','rhino','stag','metallifer','giantstag','atlas','manticora','europestag'].includes(species);"
      ]
    ],
    "blocks": 1,
    "blockHash": "b60f95072e8833444d4c57faafa8b5e97218048afdd7b1be47879e9fac4ea61d"
  }
};
function prior(source,file){
 let s=normalizeGiraffeIndividual(source);const r=records[file],blocks=s.match(/^[ \t]*\/\/ GIRAFFE_INDIVIDUAL_BEGIN\n[\s\S]*?^[ \t]*\/\/ GIRAFFE_INDIVIDUAL_END\n/gm)||[];
 assert.equal(blocks.length,r.blocks,file+' marker count');assert.equal(hash(blocks.join('')),r.blockHash,file+' added blocks');
 for(const [added,old]of [...r.replacements].reverse()){assert.equal(s.split(added).length-1,1,file+' exact literal occurrence');s=s.replace(added,old);}
 assert.equal(s.includes('GIRAFFE_INDIVIDUAL_'),false,file+' no residual marker');assert.equal(hash(s),r.hash,file+' frozen051 source');return s;
}
export const priorModel=s=>prior(priorTigerModel(s),'src/insect-models.js');
export const priorInsects=s=>prior(priorTigerInsects(s),'src/insects.js');
export const priorStudy=s=>prior(s,'src/giraffe-stag-study.js');
export const priorHabitat=s=>prior(s,'src/giraffe-stag-habitat.js');
export const priorLayout=s=>prior(s,'src/giraffe-stag-layout.js');
