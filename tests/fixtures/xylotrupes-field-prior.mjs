import {priorInsects as before059Insects} from './goliath-individual-field-prior.mjs';
/** Exact 058 field inverse to frozen057; no history/runtime/private file dependency. */
import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const hash=s=>createHash('sha256').update(s).digest('hex');
export const normalizeXylotrupesField=s=>s.replace(/(from\s*['"]\.\/[^'"?\n]+)(?:\?[^'"\n]*)?(['"])/g,'$1$2');
const pairs=[
  [
    "// XYLOTRUPES_FIELD_BEGIN\nimport {createXylotrupesStudy} from './xylotrupes-study.js';\nimport {XYLOTRUPES_SUPPORT} from './xylotrupes-layout.js';\n// XYLOTRUPES_FIELD_END\n",
    ""
  ],
  [
    "  // XYLOTRUPES_FIELD_BEGIN\n  xylotrupes:{name:'オーストラリアのサイカブト（雄）',label:'豪州サイカブト',scientificName:'Xylotrupes australicus',size:'試作表示は胴と頭が約20cm、角込みの前後長が約28cm。実物の寸法ではなく表示補正です。固定の未計測個体です。',observation:'オーストラリアのクイーンズランドの資料がある甲虫です。雄の頭角と胸角、幅広い胴を見比べてみましょう。低い枝と短い歩行・退避はゲーム上の観察配置です。成虫の食事・活動時刻・自然の微環境や反応速度は再現していません。',hint:'豪州参考区画の短い観察枝を横から見て。上下の角と、枝を支える6本の脚を探してみよう。',color:'#493a31'},\n  // XYLOTRUPES_FIELD_END\n",
    ""
  ],
  [
    "// XYLOTRUPES_FIELD_BEGIN\nexport function createInsects(heightAt = () => 0, { homes: habitatHomes = homes, extraHomes = [], individuals = [], dragonflyAmbient = [], grasshopperSupports = [], herculesSupports = [], leafSupports = [], striderSupports = [], antSupports = [], fireflySupports = [], dungSupports = [], divingSupports = [], giantWaterbugSupports = [], mantisSupports = [], ladybirdSupports = [], rhinoSupports = [], stagSupports = [], metalliferSupports = [], atlasSupports = [], giantStagSupports = [], elephantSupports = [], goliathSupports = [], fiveHornSupports = [], beeSupports = [], swallowtailSupports = [], jewelSupports = [], longhornSupports = [], miyamaSupports = [], euchirusSupports = [], manticoraSupports = [], rainbowStagSupports = [], xylotrupesSupports = [], europeStagSupports = [], wetapungaSupports = [], giraffeStagSupports = [], tigerBeetleSupports = [], orchidMantisSupports = [], logFruitStation = null, bounds = 75, hasLineOfSight = () => true } = {}) {\n// XYLOTRUPES_FIELD_END",
    "export function createInsects(heightAt = () => 0, { homes: habitatHomes = homes, extraHomes = [], individuals = [], dragonflyAmbient = [], grasshopperSupports = [], herculesSupports = [], leafSupports = [], striderSupports = [], antSupports = [], fireflySupports = [], dungSupports = [], divingSupports = [], giantWaterbugSupports = [], mantisSupports = [], ladybirdSupports = [], rhinoSupports = [], stagSupports = [], metalliferSupports = [], atlasSupports = [], giantStagSupports = [], elephantSupports = [], goliathSupports = [], fiveHornSupports = [], beeSupports = [], swallowtailSupports = [], jewelSupports = [], longhornSupports = [], miyamaSupports = [], euchirusSupports = [], manticoraSupports = [], rainbowStagSupports = [], europeStagSupports = [], wetapungaSupports = [], giraffeStagSupports = [], tigerBeetleSupports = [], orchidMantisSupports = [], logFruitStation = null, bounds = 75, hasLineOfSight = () => true } = {}) {"
  ],
  [
    "  // XYLOTRUPES_FIELD_BEGIN\n  const australiaPair=initialHomes.length===2&&initialHomes[0][0]==='rainbowstag'&&initialHomes[1][0]==='xylotrupes';\n  // XYLOTRUPES_FIELD_END\n",
    ""
  ],
  [
    "  // XYLOTRUPES_FIELD_BEGIN\n  if(australiaPair||initialHomes.length===1&&initialHomes[0][0]==='rainbowstag'){\n  // XYLOTRUPES_FIELD_END",
    "  if(initialHomes.length===1&&initialHomes[0][0]==='rainbowstag'){"
  ],
  [
    "    // XYLOTRUPES_FIELD_BEGIN\n    if((australiaPair||initialHomes.length===1&&initialHomes[0][0]==='rainbowstag')&&rainbowDescriptor?.value!=='rainbowstag')throw new TypeError('Invalid rainbow-stag individual profile species');\n    // XYLOTRUPES_FIELD_END",
    "    if(initialHomes.length===1&&initialHomes[0][0]==='rainbowstag'&&rainbowDescriptor?.value!=='rainbowstag')throw new TypeError('Invalid rainbow-stag individual profile species');"
  ],
  [
    "      // XYLOTRUPES_FIELD_BEGIN\n      if(e.habitat!=='australia'||e.runtimeSlotId!=='insect-1'||e.populationSlotId!=='rainbowstag'||(!australiaPair&&(initialHomes.length!==1||initialHomes[0][0]!=='rainbowstag'))||profiles.has(e.runtimeSlotId)||!Number.isInteger(e.sizePermille)||e.sizePermille<1000||e.sizePermille>1150||!Number.isInteger(e.motionSeed)||e.motionSeed<0||e.motionSeed>0xffffffff||e.measureVersion!==1||!Number.isInteger(e.siteIndex)||e.siteIndex<0||e.siteIndex>=RAINBOW_STAG_SITES.length||!match||!Number.isSafeInteger(Number(match[1])))throw new TypeError('Rainbow-stag individual profile does not match home');\n      // XYLOTRUPES_FIELD_END",
    "      if(e.habitat!=='australia'||e.runtimeSlotId!=='insect-1'||e.populationSlotId!=='rainbowstag'||initialHomes.length!==1||initialHomes[0][0]!=='rainbowstag'||profiles.has(e.runtimeSlotId)||!Number.isInteger(e.sizePermille)||e.sizePermille<1000||e.sizePermille>1150||!Number.isInteger(e.motionSeed)||e.motionSeed<0||e.motionSeed>0xffffffff||e.measureVersion!==1||!Number.isInteger(e.siteIndex)||e.siteIndex<0||e.siteIndex>=RAINBOW_STAG_SITES.length||!match||!Number.isSafeInteger(Number(match[1])))throw new TypeError('Rainbow-stag individual profile does not match home');"
  ],
  [
    "  // XYLOTRUPES_FIELD_BEGIN\n  const xylotrupesGroups=new Map(),xylotrupesStudies=new Map();\n  try{\n    const record=(v,keys)=>{if(!v||![Object.prototype,null].includes(Object.getPrototypeOf(v))||Reflect.ownKeys(v).length!==keys.length||!keys.every(k=>Object.hasOwn(v,k)&&'value'in Object.getOwnPropertyDescriptor(v,k)))throw new Error();};\n    if(!Array.isArray(xylotrupesSupports)||Object.getPrototypeOf(xylotrupesSupports)!==Array.prototype||Reflect.ownKeys(xylotrupesSupports).length!==xylotrupesSupports.length+1||xylotrupesSupports.length>1)throw new Error();\n    const rows=initialHomes.map((row,index)=>({row,index})).filter(({row})=>row[0]==='xylotrupes');\n    if(rows.length!==xylotrupesSupports.length||rows.length&&(!australiaPair||rows[0].index!==1))throw new Error();\n    if(rows.length){\n      const descriptor=Object.getOwnPropertyDescriptor(xylotrupesSupports,'0');if(!descriptor||!('value'in descriptor))throw new Error();const g=descriptor.value;\n      record(g,['home','orientation','axis','retreatBounds']);record(g.home,['x','y','z']);record(g.orientation,['x','y','z','w']);record(g.axis,['x','y','z']);record(g.retreatBounds,['min','max']);\n      for(const key of['home','orientation','axis','retreatBounds'])for(const k of Object.keys(XYLOTRUPES_SUPPORT[key]))if(!Number.isFinite(g[key][k])||Math.abs(g[key][k]-XYLOTRUPES_SUPPORT[key][k])>1e-10)throw new Error();\n      const {row:[,x,z,altitude]}=rows[0],ground=heightAt(x,z);if(!Number.isFinite(ground)||Math.hypot(g.home.x-x,g.home.y-ground-altitude,g.home.z-z)>1e-7||Math.abs(x)+.12>flightBounds||Math.abs(z)>flightBounds||profiles.has('insect-2'))throw new Error();\n      const support={home:{...g.home},orientation:{...g.orientation},axis:{...g.axis},retreatBounds:{...g.retreatBounds}};\n      createXylotrupesStudy({position:support.home,orientation:support.orientation,retreatBounds:support.retreatBounds});xylotrupesGroups.set(1,support);\n    }\n  }catch{throw new TypeError('Invalid xylotrupes supports');}\n  // XYLOTRUPES_FIELD_END\n",
    ""
  ],
  [
    "    // XYLOTRUPES_FIELD_BEGIN\n    xylotrupesStudies.clear();\n    // XYLOTRUPES_FIELD_END\n",
    ""
  ],
  [
    "      // XYLOTRUPES_FIELD_BEGIN\n      if(species==='xylotrupes'){\n        const item=items[items.length-1],support=xylotrupesGroups.get(index);\n        xylotrupesStudies.set(item.id,{study:createXylotrupesStudy({position:support.home,orientation:support.orientation,retreatBounds:support.retreatBounds})});syncXylotrupes(item);\n      }\n      // XYLOTRUPES_FIELD_END\n",
    ""
  ],
  [
    "  // XYLOTRUPES_FIELD_BEGIN\n  function syncXylotrupes(item){\n    const s=xylotrupesStudies.get(item.id).study.state,q=s.orientation;\n    item.x=s.position.x;item.y=s.position.y;item.z=s.position.z;item.orientation={...q};item.heading=Math.atan2(2*(q.x*q.z+q.w*q.y),1-2*(q.x*q.x+q.y*q.y));\n    item.walkPhase=s.walkPhase;item.walkSpeed=s.walkSpeed;item.direction=s.direction;item.xylotrupesPhase=s.phase;item.headLift=s.headLift;item.warningBlend=s.warningBlend;\n    item.state=item.caught?'caught':s.phase;item.resting=!['walking','retreating'].includes(s.phase);\n  }\n  function updateXylotrupes(item,dt,player,p){\n    if(dt<=0)return;const beetle=xylotrupesStudies.get(item.id);if(branchThreat(item,player,p))beetle.study.disturb(p);beetle.study.update(dt);syncXylotrupes(item);\n  }\n  // XYLOTRUPES_FIELD_END\n",
    ""
  ],
  [
    "    // XYLOTRUPES_FIELD_BEGIN\n    if(item.species==='xylotrupes'){xylotrupesStudies.get(item.id).study.release();syncXylotrupes(item);return;}\n    // XYLOTRUPES_FIELD_END\n",
    ""
  ],
  [
    "    // XYLOTRUPES_FIELD_BEGIN\n    if(item.species==='xylotrupes'){if(!xylotrupesStudies.get(item.id).study.disturb(p))return null;syncXylotrupes(item);return item;}\n    // XYLOTRUPES_FIELD_END\n",
    ""
  ],
  [
    "    // XYLOTRUPES_FIELD_BEGIN\n      if(item.species==='xylotrupes'){if(!item.caught)updateXylotrupes(item,dt,player,p);continue;}\n    // XYLOTRUPES_FIELD_END\n",
    ""
  ],
  [
    "    // XYLOTRUPES_FIELD_BEGIN\n    if(held.species==='xylotrupes'){xylotrupesStudies.get(held.id).study.capture();syncXylotrupes(held);}\n    // XYLOTRUPES_FIELD_END\n",
    ""
  ],
  [
    "    // XYLOTRUPES_FIELD_BEGIN\n    if(item.species==='xylotrupes')xylotrupesStudies.get(item.id).study.capture();\n    // XYLOTRUPES_FIELD_END\n",
    ""
  ],
  [
    "      // XYLOTRUPES_FIELD_BEGIN\n      ((CAPTURE_AWARENESS[item.species] && !awarenessInFlight(item) && !awarenessSettling(item) && time >= item.nextScareAt) || (item.species==='giantwaterbug'&&item.giantWaterbugPhase==='resting') || (item.species==='wetapunga'&&!['finishing','retreating'].includes(item.wetapungaPhase)) || (item.species==='tigerbeetle'&&item.tigerBeetlePhase==='resting') || (item.species==='orchidmantis'&&!['warning','retreating'].includes(item.orchidMantisPhase)) || herculesNetEligible(item) || (item.species==='xylotrupes'&&!['warning','retreating'].includes(item.xylotrupesPhase)) || (item.species==='rainbowstag'&&!['warning','retreating'].includes(item.rainbowStagPhase)) || (item.species==='giraffestag'&&!['warning','retreating'].includes(item.giraffeStagPhase)) || (item.species==='europestag'&&!['warning','retreating'].includes(item.europeStagPhase)) || (item.species==='manticora'&&!['warning','running'].includes(item.manticoraPhase)) || (item.species==='euchirus'&&!['warning','retreating'].includes(item.euchirusPhase)) || (item.species==='miyama'&&!['warning','retreating'].includes(item.miyamaPhase)) || (item.species==='fivehorn'&&!['warning','retreating'].includes(item.fiveHornPhase)) || (item.species==='goliath'&&!['warning','retreating'].includes(item.goliathPhase)) || (item.species==='elephant'&&!['warning','retreating'].includes(item.elephantPhase)) || (item.species==='giantstag'&&!['warning','retreating'].includes(item.giantStagPhase)) || (item.species==='atlas'&&!['warning','retreating'].includes(item.atlasPhase)) || (item.species==='rhino'&&rhinos.get(item.id)?.reactive) || (item.species==='stag'&&stags.get(item.id)?.reactive)) && distance <= NET_STARTLE.range && dot >= NET_STARTLE.minDot);\n      // XYLOTRUPES_FIELD_END",
    "      ((CAPTURE_AWARENESS[item.species] && !awarenessInFlight(item) && !awarenessSettling(item) && time >= item.nextScareAt) || (item.species==='giantwaterbug'&&item.giantWaterbugPhase==='resting') || (item.species==='wetapunga'&&!['finishing','retreating'].includes(item.wetapungaPhase)) || (item.species==='tigerbeetle'&&item.tigerBeetlePhase==='resting') || (item.species==='orchidmantis'&&!['warning','retreating'].includes(item.orchidMantisPhase)) || herculesNetEligible(item) || (item.species==='rainbowstag'&&!['warning','retreating'].includes(item.rainbowStagPhase)) || (item.species==='giraffestag'&&!['warning','retreating'].includes(item.giraffeStagPhase)) || (item.species==='europestag'&&!['warning','retreating'].includes(item.europeStagPhase)) || (item.species==='manticora'&&!['warning','running'].includes(item.manticoraPhase)) || (item.species==='euchirus'&&!['warning','retreating'].includes(item.euchirusPhase)) || (item.species==='miyama'&&!['warning','retreating'].includes(item.miyamaPhase)) || (item.species==='fivehorn'&&!['warning','retreating'].includes(item.fiveHornPhase)) || (item.species==='goliath'&&!['warning','retreating'].includes(item.goliathPhase)) || (item.species==='elephant'&&!['warning','retreating'].includes(item.elephantPhase)) || (item.species==='giantstag'&&!['warning','retreating'].includes(item.giantStagPhase)) || (item.species==='atlas'&&!['warning','retreating'].includes(item.atlasPhase)) || (item.species==='rhino'&&rhinos.get(item.id)?.reactive) || (item.species==='stag'&&stags.get(item.id)?.reactive)) && distance <= NET_STARTLE.range && dot >= NET_STARTLE.minDot);"
  ],
  [
    "    // XYLOTRUPES_FIELD_BEGIN\n    companionOrigins=origins.filter(o=>o&&['hercules','rhino','stag','metallifer','atlas','giantstag','elephant','goliath','fivehorn','miyama','euchirus','manticora','rainbowstag','xylotrupes','europestag','giraffestag'].includes(o.species)&&typeof o.id==='string').map(o=>({id:o.id,species:o.species}));\n    // XYLOTRUPES_FIELD_END",
    "    companionOrigins=origins.filter(o=>o&&['hercules','rhino','stag','metallifer','atlas','giantstag','elephant','goliath','fivehorn','miyama','euchirus','manticora','rainbowstag','europestag','giraffestag'].includes(o.species)&&typeof o.id==='string').map(o=>({id:o.id,species:o.species}));"
  ],
  [
    "    // XYLOTRUPES_FIELD_BEGIN\n    if(!held||!['hercules','rhino','stag','metallifer','atlas','giantstag','elephant','goliath','fivehorn','miyama','euchirus','manticora','rainbowstag','xylotrupes','europestag','giraffestag'].includes(held.species))return null;\n    // XYLOTRUPES_FIELD_END",
    "    if(!held||!['hercules','rhino','stag','metallifer','atlas','giantstag','elephant','goliath','fivehorn','miyama','euchirus','manticora','rainbowstag','europestag','giraffestag'].includes(held.species))return null;"
  ]
];
export function priorInsects(source){if(source.includes('GOLIATH_INDIVIDUAL_BEGIN'))source=before059Insects(source);let s=normalizeXylotrupesField(source);const blocks=s.match(/^[ \t]*\/\/ XYLOTRUPES_FIELD_BEGIN\n[\s\S]*?^[ \t]*\/\/ XYLOTRUPES_FIELD_END/gm)||[];
 assert.equal(blocks.length,19);assert.equal(hash(blocks.join('')),"19b0fc5260c15ebfa07450f0dbe746e39f888b7819e6f00a7c77700a56b763c5");
 for(const[current,old]of [...pairs].reverse()){assert.equal(s.split(current).length-1,1,'058 field exact literal once');s=s.replace(current,old);}
 assert.equal(s.includes('XYLOTRUPES_FIELD_'),false);assert.equal(hash(s),"e29e078307a0c6da8f739cc6ad56984d85e2408f02f00c7ead6ad8e97fc325c8");return s;}
