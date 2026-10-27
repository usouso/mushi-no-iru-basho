import {inverseGiraffeStagField} from './giraffe-stag-field-prior.mjs';
/** Exact 048-only inverse; frozen047 6382a55, no git or runtime import. */
import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const hash=s=>createHash('sha256').update(s).digest('hex'),normalized=s=>s.replace(/(from\s*['"]\.\/[^'"?\n]+)(?:\?[^'"\n]*)?(['"])/g,'$1$2');
const replacements=[
  [
    "雄の実物は大顎を含め35〜75mmと紹介されています。試作表示の基準は胴と頭が約19cm、大顎先まで約32cm。表示補正のサイズ指数100〜115は実寸や強さとは別で、新しい遠征では個体差を記録します。以前の固定個体は未計測のままです。",
    "雄の実物は大顎を含め35〜75mmと紹介されています。試作表示は胴と頭が約19cm、大顎先まで約32cm。表示補正であり、今回は固定の未計測個体です。"
  ],
  [
    "(!measured&&(retreatBounds.min<-.34-1e-10||retreatBounds.max>.34+1e-10))",
    "retreatBounds.min<-.34-1e-10||retreatBounds.max>.34+1e-10"
  ],
  [
    "createEuropeStagStudy({position:support.home,orientation:support.orientation,retreatBounds:support.retreatBounds,...(profile?{scale:profile.sizePermille/1000,motionSeed:profile.motionSeed}:{})})",
    "createEuropeStagStudy({position:support.home,orientation:support.orientation,retreatBounds:support.retreatBounds})"
  ]
];
export function inverseEuropeIndividuals(source){source=inverseGiraffeStagField(source);const marker=/^[ \t]*\/\/ EUROPE_INDIVIDUAL_BEGIN\n[\s\S]*?^[ \t]*\/\/ EUROPE_INDIVIDUAL_END\n/gm,blocks=source.match(marker)||[];assert.equal(blocks.length,4);assert.equal(hash(normalized(blocks.join(''))),'8027947557bcec92b8ad20633a478b2d0e2e1077830a4f0ebb8e916530f0cbc7');source=source.replace(marker,'');for(const [added,original]of replacements){assert.equal(source.split(added).length-1,1);source=source.replace(added,original);}assert.equal(hash(normalized(source)),'9dde2eeb0d264eede463468dc9c4091b806dc13250b927d5f5fc0cbe09db8b92','actual frozen047 insects source, normalized import queries only');return source;}
