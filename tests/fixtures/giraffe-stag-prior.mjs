import {priorJournal as before053Journal} from './tiger-beetle-prior.mjs';
import {priorRoster as before052Roster} from './giraffe-individual-prior.mjs';
/** Reconstruct frozen048 with exact-once 049 registry inverses and fixed hashes.
 * Node standard library only; no local history, storage or runtime imports. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const hash=s=>createHash('sha256').update(s).digest('hex');
const semantic=s=>s.replace(/\?v=[0-9.]+&b=[a-f0-9]+/g,'');
function inverse(source,pairs,expected){let out=semantic(source);for(const [current,prior]of pairs){assert.equal(out.split(current).length-1,1,'049 inverse fragment exactly once: '+current);out=out.replace(current,prior);}assert.equal(hash(out),expected,'complete frozen048 source, not a guessed parser');return out;}
export const priorJournal=source=>inverse(before053Journal(source),[[", 'giraffestag'",'']],'efccb681d7cbccbd8998fb0b8b8344f55913cf77ac68ba84fd2d2d8211cbea28');
export const priorGiraffeRoster=source=>inverse(before052Roster(source),[[",'giraffestag'",''],[",giraffestag:'flores'",''],[" && (entry.species!=='giraffestag'||entry.originIndividualId==='insect-1')",'']],'e05112cfe0b07f4a84bc52f16f98564f4e3bb3c764c1a9ee714071a3853955ca');
export const priorBattle=source=>inverse(source,[[",\n giraffestag:{label:'ギラファノコギリクワガタ（雄）',role:'長く伸びる大顎',help:'Prosopocoilus giraffa の雄。フローレス島の雄標本を参考にした模型です。押し合いはゲーム上の動作です。'}",'']],'adb94de9eaf4e7c4e60c573cd4d1fbac0a6a451e05c749c0d97db9c4f28bb0cd');
