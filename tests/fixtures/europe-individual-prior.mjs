import {priorExpedition as before052Expedition,priorAtlasSupport as before052AtlasSupport} from './giraffe-individual-prior.mjs';
import {priorGiraffeRoster} from './giraffe-stag-prior.mjs';
/** Public, self-contained reconstruction of frozen047 parsers. No git/history IO.
 * Every inverse is exact-once and the complete historical source hash is fixed. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const semantic=s=>s.replace(/\?v=[0-9.]+&b=[a-f0-9]+/g,'');
const hash=s=>createHash('sha256').update(s).digest('hex');
function inverse(source,pairs,expected){let out=semantic(source);for(const [current,prior]of pairs){assert.equal(out.split(current).length-1,1,'048 inverse fragment exactly once: '+current);out=out.replace(current,prior);}assert.equal(hash(out),expected,'complete frozen047 source, not a permissive mock');return out;}
export function priorExpedition(source){return inverse(before052Expedition(source),[
 [",\n {populationSlotId:'europestag',species:'europestag',habitat:'europe',runtimeSlotId:'insect-1'}",''],
 ['const generationFourFiveSlots=EXPEDITION_SLOTS.slice(0,8);\n',''],
 ['version===4||version===5?generationFourFiveSlots:version===6?EXPEDITION_SLOTS:null','version===4||version===5?EXPEDITION_SLOTS:null'],
 ["species==='manticora'?4:species==='europestag'?6:1","species==='manticora'?4:1"],
 ['g([12346])','g([1234])'],['(tropical|night|understory|savanna|europe)','(tropical|night|understory|savanna)'],['|atlas|manticora|europestag)$','|atlas|manticora)$'],
 ['generatorVersion:6,worldSeed:seed','generatorVersion:5,worldSeed:seed'],
 ['![1,2,3,4,5,6].includes(data.generatorVersion)','![1,2,3,4,5].includes(data.generatorVersion)']
 ],'0b4e27a91eed5b3bf943ef0931eb4ef3f932a59d083bb909988c88f22bfe0fce');}
export function priorRoster(source){return inverse(priorGiraffeRoster(source),[[" if(entry.species==='europestag'){\n  const europe=/^g6-[0-9a-f]{8}-o([1-9][0-9]{0,15})-europe-europestag$/.exec(entry.originEncounterId);\n  return !!europe&&Number.isSafeInteger(Number(europe[1]))&&entry.originHabitat==='europe';\n }\n",'']],'9fdc0290dfe6df55dbf6eec32eaf97ba8f4317d35b2ca4076977659856680d2a');}
export function priorAtlasSupport(source){return inverse(before052AtlasSupport(source),[['generations 5 and 6 select','generation 5 selects'],['![1,2,3,4,5,6].includes(snapshot.generatorVersion)','![1,2,3,4,5].includes(snapshot.generatorVersion)']],'196d5e47437097a772e1e144b05c38845f54b15f2c18231312bd7c00bcfde52a');}
