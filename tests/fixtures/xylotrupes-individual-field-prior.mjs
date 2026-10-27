import {priorInsects as before064Insects} from './moonmoth-field-prior.mjs';
/** Exact 062 inverse to frozen061; literals, marker digest, full source hash. */
import assert from 'node:assert/strict';import{createHash}from'node:crypto';
const hash=s=>createHash('sha256').update(s).digest('hex');
export const normalizeXylotrupesIndividual=s=>s.replace(/(from\s*['"]\.\/[^'"?\n]+)(?:\?[^'"\n]*)?(['"])/g,'$1$2');
const pairs={
  "xylotrupes-layout": [
    [
      "// XYLOTRUPES_INDIVIDUAL_BEGIN\nexport const XYLOTRUPES_SITES=Object.freeze([-.04,0,.04]);\n// XYLOTRUPES_INDIVIDUAL_END\nexport const XYLOTRUPES_BRANCH=",
      "export const XYLOTRUPES_BRANCH="
    ]
  ],
  "xylotrupes-study": [
    [
      "// XYLOTRUPES_INDIVIDUAL_BEGIN\n if(!options||![Object.prototype,null].includes(Object.getPrototypeOf(options))||Reflect.ownKeys(options).some(k=>!['position','orientation','retreatBounds','scale','motionSeed'].includes(k)||!('value'in Object.getOwnPropertyDescriptor(options,k))))throw new TypeError('Invalid xylotrupes study options');\n// XYLOTRUPES_INDIVIDUAL_END",
      " if(!options||![Object.prototype,null].includes(Object.getPrototypeOf(options))||Reflect.ownKeys(options).some(k=>!['position','orientation','retreatBounds'].includes(k)||!('value'in Object.getOwnPropertyDescriptor(options,k))))throw new TypeError('Invalid xylotrupes study options');"
    ],
    [
      "// XYLOTRUPES_INDIVIDUAL_BEGIN\n const {scale=1,motionSeed=1729,position={x:0,y:D.rootAboveSupport*scale,z:0},orientation={x:0,y:0,z:0,w:1},retreatBounds={min:-.12,max:.12}}=options;\n// XYLOTRUPES_INDIVIDUAL_END",
      " const {position={x:0,y:D.rootAboveSupport,z:0},orientation={x:0,y:0,z:0,w:1},retreatBounds={min:-.12,max:.12}}=options;"
    ],
    [
      "// XYLOTRUPES_INDIVIDUAL_BEGIN\n if(!Number.isFinite(scale)||scale<1||scale>1.15||!Number.isInteger(motionSeed)||motionSeed<0||motionSeed>0xffffffff)throw new TypeError('Invalid xylotrupes individual scalars');\n if(!record(position,['x','y','z'])||Object.values(position).some(v=>Math.abs(v)>1e4)||!record(orientation,['x','y','z','w'])||Math.abs(Math.hypot(orientation.x,orientation.y,orientation.z,orientation.w)-1)>1e-8||!record(retreatBounds,['min','max'])||((retreatBounds.min<-.12||retreatBounds.max>.12)&&!(Object.hasOwn(options,'scale')&&Object.hasOwn(options,'motionSeed')&&[-.04,.04].some(site=>Math.abs(retreatBounds.min-(-.12-site))<1e-10&&Math.abs(retreatBounds.max-(.12-site))<1e-10))))throw new TypeError('Invalid xylotrupes fixed support');\n// XYLOTRUPES_INDIVIDUAL_END",
      " if(!record(position,['x','y','z'])||Object.values(position).some(v=>Math.abs(v)>1e4)||!record(orientation,['x','y','z','w'])||Math.abs(Math.hypot(orientation.x,orientation.y,orientation.z,orientation.w)-1)>1e-8||!record(retreatBounds,['min','max'])||retreatBounds.min<-.12||retreatBounds.max>.12)throw new TypeError('Invalid xylotrupes fixed support');"
    ],
    [
      "// XYLOTRUPES_INDIVIDUAL_BEGIN\n const core=createBranchRetreatStudy({species:'xylotrupes',position:{x:0,y:D.rootAboveSupport*scale,z:0},heading:Math.PI/2,scale,motionSeed,retreatBounds,cycleDistance:D.cycleDistance,rootAboveSupport:D.rootAboveSupport,warningSeconds:XYLOTRUPES_MOTION.warningSeconds,retreatDistance:XYLOTRUPES_MOTION.retreatDistance,retreatSpeed:XYLOTRUPES_MOTION.retreatSpeed,boundedStepFinish:true});\n// XYLOTRUPES_INDIVIDUAL_END",
      " const core=createBranchRetreatStudy({species:'xylotrupes',position:{x:0,y:D.rootAboveSupport,z:0},heading:Math.PI/2,scale:1,motionSeed:1729,retreatBounds,cycleDistance:D.cycleDistance,rootAboveSupport:D.rootAboveSupport,warningSeconds:XYLOTRUPES_MOTION.warningSeconds,retreatDistance:XYLOTRUPES_MOTION.retreatDistance,retreatSpeed:XYLOTRUPES_MOTION.retreatSpeed,boundedStepFinish:true});"
    ],
    [
      "// XYLOTRUPES_INDIVIDUAL_BEGIN\n function state(){const{heading,pitch,...s}=core.state,d=s.walkPhase/TAU*D.cycleDistance*scale;return{...s,position:{x:origin.x+axis.x*d,y:origin.y,z:origin.z+axis.z*d},orientation:{...q},headLift:s.warningBlend};}\n// XYLOTRUPES_INDIVIDUAL_END",
      " function state(){const{heading,pitch,...s}=core.state,d=s.walkPhase/TAU*D.cycleDistance;return{...s,position:{x:origin.x+axis.x*d,y:origin.y,z:origin.z+axis.z*d},orientation:{...q},headLift:s.warningBlend};}"
    ]
  ],
  "individual-layout": [
    [
      "// XYLOTRUPES_INDIVIDUAL_BEGIN\nimport {XYLOTRUPES_SITES} from './xylotrupes-layout.js';\n// XYLOTRUPES_INDIVIDUAL_END\n// GOLIATH_INDIVIDUAL_BEGIN\nimport",
      "// GOLIATH_INDIVIDUAL_BEGIN\nimport"
    ],
    [
      "// XYLOTRUPES_INDIVIDUAL_BEGIN\nconst ROOT_HEIGHT=Object.freeze({hercules:.06,rhino:.05,stag:.045,metallifer:0,giantstag:.045,atlas:.055,manticora:.055,europestag:.055,giraffestag:.060,rainbowstag:.050,goliath:.055,xylotrupes:.055});\n// XYLOTRUPES_INDIVIDUAL_END",
      "const ROOT_HEIGHT=Object.freeze({hercules:.06,rhino:.05,stag:.045,metallifer:0,giantstag:.045,atlas:.055,manticora:.055,europestag:.055,giraffestag:.060,rainbowstag:.050,goliath:.055});"
    ],
    [
      "// XYLOTRUPES_INDIVIDUAL_BEGIN\nconst SUPPORT=Object.freeze({hercules:'herculesSupports',rhino:'rhinoSupports',stag:'stagSupports',metallifer:'metalliferSupports',giantstag:'giantStagSupports',atlas:'atlasSupports',manticora:'manticoraSupports',europestag:'europeStagSupports',giraffestag:'giraffeStagSupports',rainbowstag:'rainbowStagSupports',goliath:'goliathSupports',xylotrupes:'xylotrupesSupports'});\n// XYLOTRUPES_INDIVIDUAL_END",
      "const SUPPORT=Object.freeze({hercules:'herculesSupports',rhino:'rhinoSupports',stag:'stagSupports',metallifer:'metalliferSupports',giantstag:'giantStagSupports',atlas:'atlasSupports',manticora:'manticoraSupports',europestag:'europeStagSupports',giraffestag:'giraffeStagSupports',rainbowstag:'rainbowStagSupports',goliath:'goliathSupports'});"
    ],
    [
      "  // XYLOTRUPES_INDIVIDUAL_BEGIN\n  if(e.species==='xylotrupes'){\n   const offset=XYLOTRUPES_SITES[e.siteIndex],axis=support.axis,limits=support.retreatBounds;\n   if(!axis||![axis.x,axis.y,axis.z,limits?.min,limits?.max].every(Number.isFinite)||Math.abs(axis.y)>1e-8||Math.abs(Math.hypot(axis.x,axis.y,axis.z)-1)>1e-8||limits.min>=limits.max)throw new TypeError('Xylotrupes physical lane missing');\n   support.home={x:old.x+axis.x*offset,y:old.y+ROOT_HEIGHT.xylotrupes*(factor-1),z:old.z+axis.z*offset};support.retreatBounds={min:limits.min-offset,max:limits.max-offset};\n   row[1]=support.home.x;row[2]=support.home.z;row[3]=support.home.y-heightAt(row[1],row[2]);continue;\n  }\n  // XYLOTRUPES_INDIVIDUAL_END\n  if(e.species==='goliath'){",
      "  if(e.species==='goliath'){"
    ]
  ],
  "insects": [
    [
      "// XYLOTRUPES_INDIVIDUAL_BEGIN\nimport {XYLOTRUPES_SUPPORT,XYLOTRUPES_SITES} from './xylotrupes-layout.js';\n// XYLOTRUPES_INDIVIDUAL_END",
      "import {XYLOTRUPES_SUPPORT} from './xylotrupes-layout.js';"
    ],
    [
      "// XYLOTRUPES_INDIVIDUAL_BEGIN\n  xylotrupes:{name:'オーストラリアのサイカブト（雄）',label:'豪州サイカブト',scientificName:'Xylotrupes australicus',size:'試作表示は胴と頭が約20cm、角込みの前後長が約28cm。実物の寸法ではなく表示補正です。旧散策の固定個体は未計測です。明示的に次の散策へ進み保存が成功した後は、同種の表示指数100〜115で個体差を記録します。',observation:'オーストラリアのクイーンズランドの資料がある甲虫です。雄の頭角と胸角、幅広い胴を見比べてみましょう。低い枝と短い歩行・退避はゲーム上の観察配置です。成虫の食事・活動時刻・自然の微環境や反応速度は再現していません。',hint:'豪州参考区画の短い観察枝を横から見て。上下の角と、枝を支える6本の脚を探してみよう。',color:'#493a31'},\n// XYLOTRUPES_INDIVIDUAL_END",
      "  xylotrupes:{name:'オーストラリアのサイカブト（雄）',label:'豪州サイカブト',scientificName:'Xylotrupes australicus',size:'試作表示は胴と頭が約20cm、角込みの前後長が約28cm。実物の寸法ではなく表示補正です。固定の未計測個体です。',observation:'オーストラリアのクイーンズランドの資料がある甲虫です。雄の頭角と胸角、幅広い胴を見比べてみましょう。低い枝と短い歩行・退避はゲーム上の観察配置です。成虫の食事・活動時刻・自然の微環境や反応速度は再現していません。',hint:'豪州参考区画の短い観察枝を横から見て。上下の角と、枝を支える6本の脚を探してみよう。',color:'#493a31'},"
    ],
    [
      "// XYLOTRUPES_INDIVIDUAL_BEGIN\n    if(Object.getPrototypeOf(individuals)!==Array.prototype||individuals.length>(australiaPair?2:1)||Reflect.ownKeys(individuals).length!==individuals.length+1)throw new TypeError('Invalid rainbow-stag individual profiles');\n// XYLOTRUPES_INDIVIDUAL_END",
      "    if(Object.getPrototypeOf(individuals)!==Array.prototype||individuals.length>1||Reflect.ownKeys(individuals).length!==individuals.length+1)throw new TypeError('Invalid rainbow-stag individual profiles');"
    ],
    [
      "  for(const e of individuals){\n    // XYLOTRUPES_INDIVIDUAL_BEGIN\n    const xylDescriptor=e&&Object.getOwnPropertyDescriptor(e,'species');\n    if(xylDescriptor?.value==='xylotrupes'){\n      const keys=['species','habitat','runtimeSlotId','populationSlotId','encounterId','sizePermille','motionSeed','siteIndex','measureVersion'];\n      if(![Object.prototype,null].includes(Object.getPrototypeOf(e))||Reflect.ownKeys(e).length!==keys.length||!keys.every(k=>Object.hasOwn(e,k)&&'value'in Object.getOwnPropertyDescriptor(e,k)))throw new TypeError('Invalid xylotrupes individual profile');\n      const match=typeof e.encounterId==='string'&&/^g10-[0-9a-f]{8}-o([1-9][0-9]{0,15})-australia-xylotrupes$/.exec(e.encounterId);\n      if(!australiaPair||e.habitat!=='australia'||e.runtimeSlotId!=='insect-2'||e.populationSlotId!=='xylotrupes'||!match||!Number.isSafeInteger(Number(match[1]))||profiles.has(e.runtimeSlotId)||!Number.isInteger(e.sizePermille)||e.sizePermille<1000||e.sizePermille>1150||!Number.isInteger(e.motionSeed)||e.motionSeed<0||e.motionSeed>0xffffffff||e.measureVersion!==1||!Number.isInteger(e.siteIndex)||e.siteIndex<0||e.siteIndex>=XYLOTRUPES_SITES.length)throw new TypeError('Xylotrupes individual does not match Australia slot');\n      profiles.set(e.runtimeSlotId,{...e});continue;\n    }\n    // XYLOTRUPES_INDIVIDUAL_END\n",
      "  for(const e of individuals){\n"
    ],
    [
      "  // XYLOTRUPES_INDIVIDUAL_BEGIN\n  if(profiles.get('insect-2')?.species==='xylotrupes'&&profiles.get('insect-1')?.species!=='rainbowstag')throw new TypeError('Xylotrupes individual requires paired rainbow profile');\n  // XYLOTRUPES_INDIVIDUAL_END\n  const flightBounds = Number.isFinite(bounds)",
      "  const flightBounds = Number.isFinite(bounds)"
    ],
    [
      "// XYLOTRUPES_INDIVIDUAL_BEGIN\n      const profile=profiles.get('insect-2'),measured=profile?.species==='xylotrupes',factor=measured?profile.sizePermille/1000:1,site=measured?XYLOTRUPES_SITES[profile.siteIndex]:0;\n      const expected=measured?{...XYLOTRUPES_SUPPORT,home:{x:XYLOTRUPES_SUPPORT.home.x+site,y:XYLOTRUPES_SUPPORT.home.y+.055*(factor-1),z:XYLOTRUPES_SUPPORT.home.z},retreatBounds:{min:-.12-site,max:.12-site}}:XYLOTRUPES_SUPPORT;\n      for(const key of['home','orientation','axis','retreatBounds'])for(const k of Object.keys(expected[key]))if(!Number.isFinite(g[key][k])||Math.abs(g[key][k]-expected[key][k])>1e-10)throw new Error();\n// XYLOTRUPES_INDIVIDUAL_END",
      "      for(const key of['home','orientation','axis','retreatBounds'])for(const k of Object.keys(XYLOTRUPES_SUPPORT[key]))if(!Number.isFinite(g[key][k])||Math.abs(g[key][k]-XYLOTRUPES_SUPPORT[key][k])>1e-10)throw new Error();"
    ],
    [
      "// XYLOTRUPES_INDIVIDUAL_BEGIN\n      const {row:[,x,z,altitude]}=rows[0],ground=heightAt(x,z);if(!Number.isFinite(ground)||Math.hypot(g.home.x-x,g.home.y-ground-altitude,g.home.z-z)>1e-7||Math.abs(x)+.12>flightBounds||Math.abs(z)>flightBounds)throw new Error();\n// XYLOTRUPES_INDIVIDUAL_END",
      "      const {row:[,x,z,altitude]}=rows[0],ground=heightAt(x,z);if(!Number.isFinite(ground)||Math.hypot(g.home.x-x,g.home.y-ground-altitude,g.home.z-z)>1e-7||Math.abs(x)+.12>flightBounds||Math.abs(z)>flightBounds||profiles.has('insect-2'))throw new Error();"
    ],
    [
      "// XYLOTRUPES_INDIVIDUAL_BEGIN\n      createXylotrupesStudy({position:support.home,orientation:support.orientation,retreatBounds:support.retreatBounds,...(measured?{scale:factor,motionSeed:profile.motionSeed}:{})});xylotrupesGroups.set(1,support);\n// XYLOTRUPES_INDIVIDUAL_END",
      "      createXylotrupesStudy({position:support.home,orientation:support.orientation,retreatBounds:support.retreatBounds});xylotrupesGroups.set(1,support);"
    ],
    [
      "// XYLOTRUPES_INDIVIDUAL_BEGIN\n    if(rows.length){const{row:[,x,z,altitude],index}=rows[0],g=groups[0];if((rainbowMeasured&&(index!==0||(profiles.size!==1&&!(australiaPair&&profiles.size===2&&profiles.get('insect-2')?.species==='xylotrupes'))))||Math.hypot(g.home.x-x,g.home.y-heightAt(x,z)-altitude,g.home.z-z)>1e-6)throw new Error();rainbowStagGroups.set(index,g);}\n// XYLOTRUPES_INDIVIDUAL_END",
      "    if(rows.length){const{row:[,x,z,altitude],index}=rows[0],g=groups[0];if((rainbowMeasured&&(index!==0||profiles.size!==1))||Math.hypot(g.home.x-x,g.home.y-heightAt(x,z)-altitude,g.home.z-z)>1e-6)throw new Error();rainbowStagGroups.set(index,g);}"
    ],
    [
      "// XYLOTRUPES_INDIVIDUAL_BEGIN\n        xylotrupesStudies.set(item.id,{study:createXylotrupesStudy({position:support.home,orientation:support.orientation,retreatBounds:support.retreatBounds,...(profile?.species==='xylotrupes'?{scale:profile.sizePermille/1000,motionSeed:profile.motionSeed}:{})})});syncXylotrupes(item);\n// XYLOTRUPES_INDIVIDUAL_END",
      "        xylotrupesStudies.set(item.id,{study:createXylotrupesStudy({position:support.home,orientation:support.orientation,retreatBounds:support.retreatBounds})});syncXylotrupes(item);"
    ]
  ]
};
const hashes={"xylotrupes-layout": "1f0916cd31c324520c244d4ec57c28ae8cab78cd575322636941d3f1327f2ace", "xylotrupes-study": "890b21c05d697b0d6d7d49ba9c54fe6c48ad678bf9dd9c5be1982b3c05c5db45", "individual-layout": "6dd66d88e56f4e7ff1f07405381cc3b3d2c3f12c94cb5ad92846c6f6d24262ab", "insects": "95f70fbaa8923c7807c88e8510601f41cb90a7ea79cb6ee2b10b6732cd217597"};
const checks={"xylotrupes-layout": [1, "576304f5a126f606345ce2f62c3f6bf2b88252b36fd79f50b0aa3ab61a5189c8"], "xylotrupes-study": [5, "91a80ccebb55b6717eefda786b9a430a11bac0a07936da82731bec0df4eca36c"], "individual-layout": [4, "63edfec85926cc3c7d4e6020db16f43f9ff95cee7e027be7efc02f2bb137c5d3"], "insects": [10, "9a70852cdc1e85b1f914f44bb7cf67aab74d761b59ad9faf6a1b5272745652b6"]};
function inverse(source,name){if(name==='insects'&&source.includes('MOONMOTH_FIELD_BEGIN'))source=before064Insects(source);let s=normalizeXylotrupesIndividual(source);const blocks=s.match(/^[ \t]*\/\/ XYLOTRUPES_INDIVIDUAL_BEGIN\n[\s\S]*?^[ \t]*\/\/ XYLOTRUPES_INDIVIDUAL_END/gm)||[];assert.equal(blocks.length,checks[name][0]);assert.equal(hash(blocks.join('')),checks[name][1]);for(const[current,old]of [...pairs[name]].reverse()){assert.equal(s.split(current).length-1,1,'062 literal exact once');s=s.replace(current,old);}assert.equal(s.includes('XYLOTRUPES_INDIVIDUAL_'),false);assert.equal(hash(s),hashes[name]);return s;}
export const priorInsects=s=>inverse(s,'insects');
export const priorStudy=s=>inverse(s,'xylotrupes-study');
export const priorLayout=s=>inverse(s,'xylotrupes-layout');
export const priorIndividualLayout=s=>inverse(s,'individual-layout');
