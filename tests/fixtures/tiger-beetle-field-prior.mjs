import {priorInsects as priorGrasshopperLaunch} from './grasshopper-launch-prior.mjs';
/** Pure 053 additions-only inverse; no git history or private evidence needed. */
import assert from 'node:assert/strict';import {createHash}from 'node:crypto';
const hash=s=>createHash('sha256').update(s).digest('hex');
const records={
  "hash": "9d93ccc55e2c2736ed7156deaec1d44f29ea5bbc1314eaa2e0517832f7bed5ad",
  "replacements": [
    [
      "// TIGER_BEETLE_BEGIN\nimport {createTigerBeetleStudy} from './tiger-beetle-study.js';\nimport {TIGER_BEETLE_STOPS} from './tiger-beetle-layout.js';\n// TIGER_BEETLE_END\n// GIRAFFE_INDIVIDUAL_BEGIN\nimport {GIRAFFE_STAG_BRANCH",
      "// GIRAFFE_INDIVIDUAL_BEGIN\nimport {GIRAFFE_STAG_BRANCH"
    ],
    [
      "// TIGER_BEETLE_BEGIN\n// Sophiodela japonica is appended without changing existing species metadata.\n// TIGER_BEETLE_END\nexport const SPECIES = Object.freeze({",
      "export const SPECIES = Object.freeze({"
    ],
    [
      "export const SPECIES = Object.freeze({\n  // TIGER_BEETLE_BEGIN\n  tigerbeetle:{name:'ハンミョウ（ナミハンミョウ）',label:'ハンミョウ',scientificName:'Sophiodela japonica',size:'試作の胴と頭は約18cm。見つけやすくした表示補正で、実物の寸法ではありません。今回は固定の未計測個体です。',observation:'本州・四国・九州の林道や裸地などで見られます。青・赤・緑の光沢、大きな眼と顎、長い脚が特徴です。近づくと短く飛んで先の地面へ降りる姿が知られています。飛ぶ経路や反応の秒数はゲーム上の調整です。',hint:'東の土道を探して。飛んだ先を追い、静かに近づいて止まった姿をねらおう。',color:'#267e8a'},\n  // TIGER_BEETLE_END",
      "export const SPECIES = Object.freeze({"
    ],
    [
      "// TIGER_BEETLE_BEGIN\nexport function createInsects(heightAt = () => 0, { homes: habitatHomes = homes, extraHomes = [], individuals = [], dragonflyAmbient = [], grasshopperSupports = [], herculesSupports = [], leafSupports = [], striderSupports = [], antSupports = [], fireflySupports = [], dungSupports = [], divingSupports = [], giantWaterbugSupports = [], mantisSupports = [], ladybirdSupports = [], rhinoSupports = [], stagSupports = [], metalliferSupports = [], atlasSupports = [], giantStagSupports = [], elephantSupports = [], goliathSupports = [], fiveHornSupports = [], beeSupports = [], swallowtailSupports = [], jewelSupports = [], longhornSupports = [], miyamaSupports = [], euchirusSupports = [], manticoraSupports = [], rainbowStagSupports = [], europeStagSupports = [], wetapungaSupports = [], giraffeStagSupports = [], tigerBeetleSupports = [], logFruitStation = null, bounds = 75, hasLineOfSight = () => true } = {}) {\n// TIGER_BEETLE_END",
      "export function createInsects(heightAt = () => 0, { homes: habitatHomes = homes, extraHomes = [], individuals = [], dragonflyAmbient = [], grasshopperSupports = [], herculesSupports = [], leafSupports = [], striderSupports = [], antSupports = [], fireflySupports = [], dungSupports = [], divingSupports = [], giantWaterbugSupports = [], mantisSupports = [], ladybirdSupports = [], rhinoSupports = [], stagSupports = [], metalliferSupports = [], atlasSupports = [], giantStagSupports = [], elephantSupports = [], goliathSupports = [], fiveHornSupports = [], beeSupports = [], swallowtailSupports = [], jewelSupports = [], longhornSupports = [], miyamaSupports = [], euchirusSupports = [], manticoraSupports = [], rainbowStagSupports = [], europeStagSupports = [], wetapungaSupports = [], giraffeStagSupports = [], logFruitStation = null, bounds = 75, hasLineOfSight = () => true } = {}) {"
    ],
    [
      "  const flightBounds = Number.isFinite(bounds) && bounds > 6 ? Math.min(75, bounds) : 75;\n  // TIGER_BEETLE_BEGIN\n  const tigerBeetleGroups=new Map(),tigerBeetles=new Map();\n  try{\n    const record=(v,keys)=>{if(!v||![Object.prototype,null].includes(Object.getPrototypeOf(v))||Reflect.ownKeys(v).length!==keys.length||!keys.every(k=>Object.hasOwn(v,k)&&'value'in Object.getOwnPropertyDescriptor(v,k)))throw new Error();};\n    const array=(v,length)=>{if(!Array.isArray(v)||Object.getPrototypeOf(v)!==Array.prototype||(length!==undefined&&v.length!==length)||Reflect.ownKeys(v).length!==v.length+1)throw new Error();return Array.from({length:v.length},(_,i)=>{const d=Object.getOwnPropertyDescriptor(v,String(i));if(!d||!('value'in d))throw new Error();return d.value;});};\n    const groups=array(tigerBeetleSupports).map(g=>{record(g,['stops']);const stops=array(g.stops,3).map((s,i)=>{record(s,['position','orientation']);record(s.position,['x','y','z']);record(s.orientation,['x','y','z','w']);for(const key of['position','orientation'])for(const k of Object.keys(s[key]))if(!Number.isFinite(s[key][k])||Math.abs(s[key][k]-TIGER_BEETLE_STOPS[i][key][k])>1e-9)throw new Error();if(Math.abs(s.position.x)>flightBounds||Math.abs(s.position.z)>flightBounds)throw new Error();return{position:{...s.position},orientation:{...s.orientation}};});createTigerBeetleStudy({stops});return{stops};});\n    const rows=initialHomes.map((row,index)=>({row,index})).filter(({row})=>row[0]==='tigerbeetle');if(rows.length!==groups.length||rows.length>1)throw new Error();\n    if(rows.length){const{row:[,x,z,a],index}=rows[0],p=groups[0].stops[0].position;if(index!==31||initialHomes.length!==32||profiles.has('insect-32')||Math.hypot(p.x-x,p.y-heightAt(x,z)-a,p.z-z)>1e-6)throw new Error();tigerBeetleGroups.set(index,groups[0]);}\n  }catch{throw new TypeError('Invalid tiger-beetle supports');}\n  // TIGER_BEETLE_END",
      "  const flightBounds = Number.isFinite(bounds) && bounds > 6 ? Math.min(75, bounds) : 75;"
    ],
    [
      "    // TIGER_BEETLE_BEGIN\n    tigerBeetles.clear();\n    // TIGER_BEETLE_END\n    time = 0; held = null; catches = 0; previousPlayer = null; caughtFrom = null; items.length = 0;",
      "    time = 0; held = null; catches = 0; previousPlayer = null; caughtFrom = null; items.length = 0;"
    ],
    [
      "      // TIGER_BEETLE_BEGIN\n      if(species==='tigerbeetle'){\n        const item=items[items.length-1],support=tigerBeetleGroups.get(index);tigerBeetles.set(item.id,{study:createTigerBeetleStudy({stops:support.stops})});syncTigerBeetle(item);item.homeHeading=item.heading;\n      }\n      // TIGER_BEETLE_END\n      if (species === 'grasshopper') {",
      "      if (species === 'grasshopper') {"
    ],
    [
      "  // TIGER_BEETLE_BEGIN\n  function syncTigerBeetle(item){\n    const s=tigerBeetles.get(item.id).study.state,q=s.orientation;\n    item.x=s.position.x;item.y=s.position.y;item.z=s.position.z;item.orientation={...q};item.heading=Math.atan2(2*(q.x*q.z+q.w*q.y),1-2*(q.x*q.x+q.y*q.y));\n    item.walkPhase=s.walkPhase;item.walkSpeed=0;item.flightPose={...s.flightPose};item.tigerBeetlePhase=s.phase;item.tigerBeetleStop=s.stopIndex;item.tigerBeetleTarget=s.targetIndex;\n    item.state=item.caught?'caught':s.phase;item.resting=!['takeoff','flying','landing'].includes(s.phase);item.flightBlend=s.flightPose.elytra;item.warningBlend=s.phase==='warning'?s.flightPose.elytra/.12:0;\n  }\n  function updateTigerBeetle(item,dt,player,p){\n    if(dt<=0)return;const beetle=tigerBeetles.get(item.id);if(branchThreat(item,player,p))beetle.study.disturb(p);beetle.study.update(dt);syncTigerBeetle(item);\n  }\n  // TIGER_BEETLE_END\n  function syncWetapunga(item){",
      "  function syncWetapunga(item){"
    ],
    [
      "    // TIGER_BEETLE_BEGIN\n    if(item.species==='tigerbeetle'){tigerBeetles.get(item.id).study.release();syncTigerBeetle(item);return;}\n    // TIGER_BEETLE_END\n    if (item.species === 'swallowtail') { swallowtails.get(item.id).study.release();syncSwallowtail(item);return; }",
      "    if (item.species === 'swallowtail') { swallowtails.get(item.id).study.release();syncSwallowtail(item);return; }"
    ],
    [
      "      // TIGER_BEETLE_BEGIN\n      ((CAPTURE_AWARENESS[item.species] && !awarenessInFlight(item) && !awarenessSettling(item) && time >= item.nextScareAt) || (item.species==='giantwaterbug'&&item.giantWaterbugPhase==='resting') || (item.species==='wetapunga'&&!['finishing','retreating'].includes(item.wetapungaPhase)) || (item.species==='tigerbeetle'&&item.tigerBeetlePhase==='resting') || herculesNetEligible(item) || (item.species==='rainbowstag'&&!['warning','retreating'].includes(item.rainbowStagPhase)) || (item.species==='giraffestag'&&!['warning','retreating'].includes(item.giraffeStagPhase)) || (item.species==='europestag'&&!['warning','retreating'].includes(item.europeStagPhase)) || (item.species==='manticora'&&!['warning','running'].includes(item.manticoraPhase)) || (item.species==='euchirus'&&!['warning','retreating'].includes(item.euchirusPhase)) || (item.species==='miyama'&&!['warning','retreating'].includes(item.miyamaPhase)) || (item.species==='fivehorn'&&!['warning','retreating'].includes(item.fiveHornPhase)) || (item.species==='goliath'&&!['warning','retreating'].includes(item.goliathPhase)) || (item.species==='elephant'&&!['warning','retreating'].includes(item.elephantPhase)) || (item.species==='giantstag'&&!['warning','retreating'].includes(item.giantStagPhase)) || (item.species==='atlas'&&!['warning','retreating'].includes(item.atlasPhase)) || (item.species==='rhino'&&rhinos.get(item.id)?.reactive) || (item.species==='stag'&&stags.get(item.id)?.reactive)) && distance <= NET_STARTLE.range && dot >= NET_STARTLE.minDot);\n      // TIGER_BEETLE_END",
      "      ((CAPTURE_AWARENESS[item.species] && !awarenessInFlight(item) && !awarenessSettling(item) && time >= item.nextScareAt) || (item.species==='giantwaterbug'&&item.giantWaterbugPhase==='resting') || (item.species==='wetapunga'&&!['finishing','retreating'].includes(item.wetapungaPhase)) || herculesNetEligible(item) || (item.species==='rainbowstag'&&!['warning','retreating'].includes(item.rainbowStagPhase)) || (item.species==='giraffestag'&&!['warning','retreating'].includes(item.giraffeStagPhase)) || (item.species==='europestag'&&!['warning','retreating'].includes(item.europeStagPhase)) || (item.species==='manticora'&&!['warning','running'].includes(item.manticoraPhase)) || (item.species==='euchirus'&&!['warning','retreating'].includes(item.euchirusPhase)) || (item.species==='miyama'&&!['warning','retreating'].includes(item.miyamaPhase)) || (item.species==='fivehorn'&&!['warning','retreating'].includes(item.fiveHornPhase)) || (item.species==='goliath'&&!['warning','retreating'].includes(item.goliathPhase)) || (item.species==='elephant'&&!['warning','retreating'].includes(item.elephantPhase)) || (item.species==='giantstag'&&!['warning','retreating'].includes(item.giantStagPhase)) || (item.species==='atlas'&&!['warning','retreating'].includes(item.atlasPhase)) || (item.species==='rhino'&&rhinos.get(item.id)?.reactive) || (item.species==='stag'&&stags.get(item.id)?.reactive)) && distance <= NET_STARTLE.range && dot >= NET_STARTLE.minDot);"
    ],
    [
      "    // TIGER_BEETLE_BEGIN\n    if(item.species==='tigerbeetle'){if(!tigerBeetles.get(item.id).study.disturb(p))return null;syncTigerBeetle(item);return item;}\n    // TIGER_BEETLE_END\n    if(item.species==='giantwaterbug'){if(!giantWaterbugs.get(item.id).study.disturb('net-miss'))return null;syncGiantWaterbug(item);return item;}",
      "    if(item.species==='giantwaterbug'){if(!giantWaterbugs.get(item.id).study.disturb('net-miss'))return null;syncGiantWaterbug(item);return item;}"
    ],
    [
      "      // TIGER_BEETLE_BEGIN\n      if(item.species==='tigerbeetle'){if(!item.caught)updateTigerBeetle(item,dt,player,p);continue;}\n      // TIGER_BEETLE_END\n      if (item.species === 'swallowtail') { if (!item.caught) updateSwallowtail(item,dt,player,p); continue; }",
      "      if (item.species === 'swallowtail') { if (!item.caught) updateSwallowtail(item,dt,player,p); continue; }"
    ],
    [
      "    // TIGER_BEETLE_BEGIN\n    if(held.species==='tigerbeetle'){tigerBeetles.get(held.id).study.capture();syncTigerBeetle(held);}\n    // TIGER_BEETLE_END\n    if (held.species === 'swallowtail') { swallowtails.get(held.id).study.capture();syncSwallowtail(held); }",
      "    if (held.species === 'swallowtail') { swallowtails.get(held.id).study.capture();syncSwallowtail(held); }"
    ]
  ],
  "blocks": 13,
  "blockHash": "5df5057f945646fa666700ae0df744ab211bf5be1cb5bcb48bc0025e81783564"
};
export function priorInsects(source){let s=priorGrasshopperLaunch(source).replace(/(from\s*['"]\.\/[^'"?\n]+)(?:\?[^'"\n]*)?(['"])/g,'$1$2');const blocks=s.match(/^[ \t]*\/\/ TIGER_BEETLE_BEGIN\n[\s\S]*?^[ \t]*\/\/ TIGER_BEETLE_END\n/gm)||[];assert.equal(blocks.length,records.blocks);assert.equal(hash(blocks.join('')),records.blockHash);for(const [added,old]of [...records.replacements].reverse()){assert.equal(s.split(added).length-1,1);s=s.replace(added,old);}assert.equal(s.includes('TIGER_BEETLE_'),false);assert.equal(hash(s),records.hash);return s;}
