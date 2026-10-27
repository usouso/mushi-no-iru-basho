import {priorIndividualLayout as before062IndividualLayout} from './xylotrupes-individual-field-prior.mjs';
import {priorInsects as before060Insects} from './butterfly-ambient-prior.mjs';
/** Pure 059 owned inverse: exact blocks and complete frozen058 hashes. No git/history. */
import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const hash=s=>createHash('sha256').update(s).digest('hex');
export const normalizeGoliathIndividual=s=>s.replace(/(from\s*['"]\.\/[^'"?\n]+)(?:\?[^'"\n]*)?(['"])/g,'$1$2');
const records={
  "goliath-study.js": {
    "hash": "55c2745286e01c1fa5536d1bfd9aaf2410aeee53dd25ee5f021a7a2be312a2d2",
    "pairs": [
      [
        "// GOLIATH_INDIVIDUAL_BEGIN\nexport function createGoliathStudy(options={}){\n // Validate known option descriptors before scalar or nested support reads.\n if(!options||![Object.prototype,null].includes(Object.getPrototypeOf(options)))throw new TypeError('Invalid goliath options');\n for(const key of['position','heading','retreatBounds','scale','motionSeed'])if(key in options&&(!Object.hasOwn(options,key)||!('value'in Object.getOwnPropertyDescriptor(options,key))))throw new TypeError('Invalid goliath option accessor');\n const {scale=1,motionSeed=null,position={x:0,y:D.rootAboveSupport*scale,z:0},heading=0,retreatBounds}=options;\n if(!Number.isFinite(scale)||scale<1||scale>1.15||motionSeed!==null&&(!Number.isInteger(motionSeed)||motionSeed<0||motionSeed>0xffffffff))throw new TypeError('Invalid goliath display scale or motion seed');\n// GOLIATH_INDIVIDUAL_END",
        "export function createGoliathStudy({position={x:0,y:D.rootAboveSupport,z:0},heading=0,retreatBounds}={}){"
      ],
      [
        " // GOLIATH_INDIVIDUAL_BEGIN\n return createBranchRetreatStudy({boundedStepFinish:true,species:'goliath',position,heading,scale,motionSeed,retreatBounds,cycleDistance:D.cycleDistance,rootAboveSupport:D.rootAboveSupport,warningSeconds:GOLIATH_MOTION.warningSeconds,retreatDistance:GOLIATH_MOTION.retreatDistance,retreatSpeed:GOLIATH_MOTION.retreatSpeed});\n // GOLIATH_INDIVIDUAL_END",
        " return createBranchRetreatStudy({boundedStepFinish:true,species:'goliath',position,heading,scale:1,motionSeed:null,retreatBounds,cycleDistance:D.cycleDistance,rootAboveSupport:D.rootAboveSupport,warningSeconds:GOLIATH_MOTION.warningSeconds,retreatDistance:GOLIATH_MOTION.retreatDistance,retreatSpeed:GOLIATH_MOTION.retreatSpeed});"
      ],
      [
        "// GOLIATH_INDIVIDUAL_BEGIN\n/** Supported male on one real branch. Optional display scale and saved motion\n * do not represent natural size or strength. Response timing is game tuning. */\n// GOLIATH_INDIVIDUAL_END",
        "/** Fixed, unmeasured male on one real branch. Human-response distances, waits\n * and speeds are game tuning, not measured G. goliatus defensive behaviour. */"
      ]
    ],
    "blocks": 3,
    "blockHash": "44418884a6a3242e1421f1e3a059b470f1171de927e182a67a42fc32c3b83da8"
  },
  "individual-layout.js": {
    "hash": "d4fc47cd5a8d11572820cc70cfe71eecef86efa09afe15c1b07e87683f6a5ce0",
    "pairs": [
      [
        "// GOLIATH_INDIVIDUAL_BEGIN\nimport {GOLIATH_INDIVIDUAL_OFFSETS} from './goliath-layout.js';\n// GOLIATH_INDIVIDUAL_END\n",
        ""
      ],
      [
        "// GOLIATH_INDIVIDUAL_BEGIN\nconst ROOT_HEIGHT=Object.freeze({hercules:.06,rhino:.05,stag:.045,metallifer:0,giantstag:.045,atlas:.055,manticora:.055,europestag:.055,giraffestag:.060,rainbowstag:.050,goliath:.055});\n// GOLIATH_INDIVIDUAL_END",
        "const ROOT_HEIGHT=Object.freeze({hercules:.06,rhino:.05,stag:.045,metallifer:0,giantstag:.045,atlas:.055,manticora:.055,europestag:.055,giraffestag:.060,rainbowstag:.050});"
      ],
      [
        "// GOLIATH_INDIVIDUAL_BEGIN\nconst SUPPORT=Object.freeze({hercules:'herculesSupports',rhino:'rhinoSupports',stag:'stagSupports',metallifer:'metalliferSupports',giantstag:'giantStagSupports',atlas:'atlasSupports',manticora:'manticoraSupports',europestag:'europeStagSupports',giraffestag:'giraffeStagSupports',rainbowstag:'rainbowStagSupports',goliath:'goliathSupports'});\n// GOLIATH_INDIVIDUAL_END",
        "const SUPPORT=Object.freeze({hercules:'herculesSupports',rhino:'rhinoSupports',stag:'stagSupports',metallifer:'metalliferSupports',giantstag:'giantStagSupports',atlas:'atlasSupports',manticora:'manticoraSupports',europestag:'europeStagSupports',giraffestag:'giraffeStagSupports',rainbowstag:'rainbowStagSupports'});"
      ],
      [
        "  // GOLIATH_INDIVIDUAL_BEGIN\n  if(e.species==='goliath'){\n   const offset=GOLIATH_INDIVIDUAL_OFFSETS[e.siteIndex],heading=support.heading,limits=support.retreatBounds;\n   if(![heading,limits?.min,limits?.max].every(Number.isFinite)||limits.min>=limits.max)throw new TypeError('Goliath physical lane missing');\n   support.home={x:old.x+Math.sin(heading)*offset,y:old.y+ROOT_HEIGHT.goliath*(factor-1),z:old.z+Math.cos(heading)*offset};\n   support.retreatBounds={min:limits.min-offset,max:limits.max-offset};\n   row[1]=support.home.x;row[2]=support.home.z;row[3]=support.home.y-heightAt(row[1],row[2]);continue;\n  }\n  // GOLIATH_INDIVIDUAL_END\n",
        ""
      ]
    ],
    "blocks": 4,
    "blockHash": "4e12043470bb6786dd477929ae79a2f5b23cbec5804571cb551c9b5d679c163f"
  },
  "insects.js": {
    "hash": "907cd84b9c112ac3a89e8ab846b600b1d0de9a8da27ad809c32bbca0812bf433",
    "pairs": [
      [
        "// GOLIATH_INDIVIDUAL_BEGIN\nimport {GOLIATH_INDIVIDUAL_OFFSETS,GOLIATH_SITES,FOREST_TREES,GOLIATH_RETREAT_BOUNDS} from './goliath-layout.js';\n// GOLIATH_INDIVIDUAL_END\n",
        ""
      ],
      [
        "  // GOLIATH_INDIVIDUAL_BEGIN\n  const goliathForest=initialHomes.length===2&&initialHomes.every(row=>row[0]==='goliath');\n  if(goliathForest){\n    if(Object.getPrototypeOf(individuals)!==Array.prototype||individuals.length>2||Reflect.ownKeys(individuals).length!==individuals.length+1)throw new TypeError('Invalid goliath individual profiles');\n    for(let i=0;i<individuals.length;i++){const d=Object.getOwnPropertyDescriptor(individuals,String(i));if(!d||!('value'in d))throw new TypeError('Invalid goliath profile accessor');}\n  }\n  // GOLIATH_INDIVIDUAL_END\n",
        ""
      ],
      [
        "    // GOLIATH_INDIVIDUAL_BEGIN\n    const goliathDescriptor=e&&Object.getOwnPropertyDescriptor(e,'species');\n    if(goliathForest&&goliathDescriptor?.value!=='goliath')throw new TypeError('Invalid goliath profile species');\n    if(goliathDescriptor?.value==='goliath'){\n      const keys=['species','habitat','runtimeSlotId','populationSlotId','encounterId','sizePermille','motionSeed','siteIndex','measureVersion'];\n      if(![Object.prototype,null].includes(Object.getPrototypeOf(e))||Reflect.ownKeys(e).length!==keys.length||!keys.every(k=>Object.hasOwn(e,k)&&'value'in Object.getOwnPropertyDescriptor(e,k)))throw new TypeError('Invalid goliath individual profile');\n      const match=typeof e.encounterId==='string'&&/^g9-[0-9a-f]{8}-o([1-9][0-9]{0,15})-forest-goliath-([ab])$/.exec(e.encounterId),n=e.runtimeSlotId==='insect-1'?0:e.runtimeSlotId==='insect-2'?1:-1,letter=n===0?'a':'b';\n      if(!goliathForest||n<0||e.habitat!=='forest'||e.populationSlotId!=='goliath-'+letter||!match||match[2]!==letter||!Number.isSafeInteger(Number(match[1]))||profiles.has(e.runtimeSlotId)||!Number.isInteger(e.sizePermille)||e.sizePermille<1000||e.sizePermille>1150||!Number.isInteger(e.motionSeed)||e.motionSeed<0||e.motionSeed>0xffffffff||e.measureVersion!==1||!Number.isInteger(e.siteIndex)||e.siteIndex<0||e.siteIndex>=GOLIATH_INDIVIDUAL_OFFSETS.length)throw new TypeError('Goliath individual does not match forest slot');\n      profiles.set(e.runtimeSlotId,{...e});continue;\n    }\n    // GOLIATH_INDIVIDUAL_END\n",
        ""
      ],
      [
        "    // GOLIATH_INDIVIDUAL_BEGIN\n    const measuredGoliath=[...profiles.values()].some(e=>e.species==='goliath');\n    const groups=array(goliathSupports).map((g,n)=>{\n    // GOLIATH_INDIVIDUAL_END",
        "    const groups=array(goliathSupports).map(g=>{"
      ],
      [
        "      // GOLIATH_INDIVIDUAL_BEGIN\n      const candidate=profiles.get('insect-'+(n+1)),profile=candidate?.species==='goliath'?candidate:null;\n      if(measuredGoliath){\n        const site=GOLIATH_SITES[n],tree=site&&FOREST_TREES.find(t=>t.id===site.treeId),factor=profile?profile.sizePermille/1000:1,offset=profile?GOLIATH_INDIVIDUAL_OFFSETS[profile.siteIndex]:0;\n        if(!goliathForest||!site||!tree)throw new Error();\n        const baseY=heightAt(tree.x,tree.z)+site.surfaceAboveGround,ax=Math.sin(site.heading),az=Math.cos(site.heading),along=(x-site.x)*ax+(z-site.z)*az;\n        if(!Number.isFinite(baseY)||Math.hypot(x-site.x-ax*offset,y-baseY-GOLIATH.rootAboveSupport*factor,z-site.z-az*offset)>1e-7||Math.abs(heading-site.heading)>1e-10||Math.abs(along+retreatBounds.min-GOLIATH_RETREAT_BOUNDS.min)>1e-10||Math.abs(along+retreatBounds.max-GOLIATH_RETREAT_BOUNDS.max)>1e-10)throw new Error();\n      }\n      createGoliathStudy({position:home,heading,retreatBounds,...(profile?{scale:profile.sizePermille/1000,motionSeed:profile.motionSeed}:{})});return{home,heading,retreatBounds};\n      // GOLIATH_INDIVIDUAL_END",
        "      createGoliathStudy({position:home,heading,retreatBounds});return{home,heading,retreatBounds};"
      ],
      [
        "        // GOLIATH_INDIVIDUAL_BEGIN\n        const profile=profiles.get(item.id);\n        goliaths.set(item.id,{study:createGoliathStudy({position:support.home,heading:support.heading,retreatBounds:support.retreatBounds,...(profile?{scale:profile.sizePermille/1000,motionSeed:profile.motionSeed}:{})})});syncGoliath(item);item.homeHeading=item.heading;\n        // GOLIATH_INDIVIDUAL_END",
        "        goliaths.set(item.id,{study:createGoliathStudy({position:support.home,heading:support.heading,retreatBounds:support.retreatBounds})});syncGoliath(item);item.homeHeading=item.heading;"
      ],
      [
        "  // GOLIATH_INDIVIDUAL_BEGIN\n  goliath:{name:'ゴライアスオオツノハナムグリ（雄）',label:'ゴライアス',scientificName:'Goliathus goliatus',size:'試作表示は胴と頭が約22cm、頭角の先まで約25.5cm。自然の体長・体重を表す値ではありません。新しい散策の保存成功後は表示指数100〜115の個体差があります。以前の固定個体は未計測のままです。',observation:'中部アフリカの熱帯森林にすむ大きなハナムグリの仲間です。雄の頭には短いY字の角があり、雄同士の争いに使われます。白黒の縦模様のある前胸と、褐色の上翅を見比べてみましょう。成虫は樹液を利用します。この区画はカメルーンの森林縁を参考にした観察用の低い枝です。樹液跡は目印で、摂食や飛翔の動作はまだ再現していません。速度や接近反応はゲーム上の調整です。',hint:'明るい林縁の太い生木。白黒の胸と、短いY字の角を探して。',color:'#766040'},\n  // GOLIATH_INDIVIDUAL_END",
        "  goliath:{name:'ゴライアスオオツノハナムグリ（雄）',label:'ゴライアス',scientificName:'Goliathus goliatus',size:'試作表示は胴と頭が約22cm、頭角の先まで約25.5cm。自然の体長・体重を表す値ではありません',observation:'中部アフリカの熱帯森林にすむ大きなハナムグリの仲間です。雄の頭には短いY字の角があり、雄同士の争いに使われます。白黒の縦模様のある前胸と、褐色の上翅を見比べてみましょう。成虫は樹液を利用します。この区画はカメルーンの森林縁を参考にした観察用の低い枝です。樹液跡は目印で、摂食や飛翔の動作はまだ再現していません。速度や接近反応はゲーム上の調整です。',hint:'明るい林縁の太い生木。白黒の胸と、短いY字の角を探して。',color:'#766040'},"
      ]
    ],
    "blocks": 7,
    "blockHash": "b5ffa641e04145e7112cecb91f8b2a129d50a1785c59739ddf1c63ff73ad731c"
  }
};
function prior(source,file){if(file==='individual-layout.js'&&source.includes('XYLOTRUPES_INDIVIDUAL_BEGIN'))source=before062IndividualLayout(source);if(file==='insects.js'&&source.includes('BUTTERFLY_AMBIENT_BEGIN'))source=before060Insects(source);let s=normalizeGoliathIndividual(source);const r=records[file],blocks=s.match(/^[ \t]*\/\/ GOLIATH_INDIVIDUAL_BEGIN\n[\s\S]*?^[ \t]*\/\/ GOLIATH_INDIVIDUAL_END/gm)||[];
 assert.equal(blocks.length,r.blocks);assert.equal(hash(blocks.join('')),r.blockHash);
 for(const[current,old]of [...r.pairs].reverse()){assert.equal(s.split(current).length-1,1,'059 exact literal once');s=s.replace(current,old);}
 assert.equal(s.includes('GOLIATH_INDIVIDUAL_'),false);assert.equal(hash(s),r.hash,file+' frozen058');return s;}
export const priorInsects=s=>prior(s,'insects.js');
export const priorStudy=s=>prior(s,'goliath-study.js');
export const priorIndividualLayout=s=>prior(s,'individual-layout.js');
