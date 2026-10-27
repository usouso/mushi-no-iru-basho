# 0.52.0 — ギラファの保存された個体差

既存ギラファ1枠だけをgen7末尾へ追加し、10個体・9種の計測対象にしました（ヘラクレス2個体を含む）。34種／10区画／相撲15種は不変更。表示指数100〜115、枝上3開始点、保存したmotionSeedの間合いで、観察/reload/旅行では再抽選しません。新しい散策の書込み・読戻し成功後だけ入替。新種・餌・時間帯・世界形状・通信・依存は増やしていません。

## 再実行
Node24系、rootから。git履歴不要、本番はtestsをimportしません。

```sh
node --test tests/giraffe-individual-*.test.mjs tests/published-graph.test.mjs
node --test tests/individual-roster.test.mjs tests/individual-roster-migration.test.mjs tests/cicada-clearance-main.test.mjs
node --test tests/giraffe-stag-study.test.mjs
node --test --test-name-pattern='strict additive inverse|literal inverses|^strict050 inverse|^strict inverse retains|^exact source inverse' tests/dragonfly-landing-simulation.test.mjs tests/europe-individual-native.test.mjs tests/cicada-thorax-model.test.mjs tests/cicada-thorax-native.test.mjs tests/cicada-clearance-native.test.mjs
```

48個の限定条件：newdata5/field6/native3/battle4/newmain3/既存roster14/既存cicada-main3/旧sourceguard5＋歴史固定study4/配信graph1。繰返し・訂正後再実行は重複加算せず、単一48件commandや全repo suite合格ではありません。昔のgen6/9件を「現在の生成仕様」として固定する一部oldtest本文は未改訂・未実行で、全tests globの合格を主張しません。旧世代のgoldensは新fixtureでそのまま保護します。

## 保存と個体
旧gen1〜6、先頭9件のpurpose別draw・世代ID・最大記録・元rawを保持。gen6はslice9固定、gen7は末尾ギラファだけ。新IDはg7/Flores/既存insect-1限定、9キーprofileを厳密にcopy/検証。キー/schema/cap16384は不変更、最大counter十件全計測/9best fixture4455文字。旧051fresh/staleは未知gen7のouting/計測rosterを上書きせず、quota/readback不確定/CAS/missing-locks等でも元情報を削除しません。Atlas A/B支持選択は既存g5 hashdomainのままgen7を許可。

同じ種の旧仲間を持っていても別遠征の新個体は出現します。保持中の現encounterだけ不在、既存同種の置換と返却は明示操作。旧個体の返却で現在の別個体を移動・複製しません。大きい表示に戦闘bonusは付けません。生態説明は不変更、実寸や野生個体群の分布とは別のgame調整です。

## 枝・脚・観察
start worldX−.12/0/.12、物理lane±.24固定、root=.80+.060×倍率。strideも.04×倍率。scale/seed省略時は従来1/1729で全stateが同じ。模型/材質/native骨/共有core/世界形状は不変更。最大足範囲を実branch triangle27rayで検証し、足の縦/横軸も実geometryへ合わせています。

native40外形pose/240footray、実field4320frames/144samples/864footrayで固定骨・接地・stance維持。相対laneが移ってもworld端は不変。current-mainの長顎中心をroot-localへ戻し二重拡大を防止、resizeも個体倍率保持。3画面144pose/747648頂点で最大NDC-X .7391/Y .6873。縦画面は顎を切らないaspect capを優先し、そこで必ず15%の見かけ差を残すとは主張しません。

## 相撲と一巡
最大ギラファ×最大オオクワガタの両役だけ、従来7横位置で接点を作れずconstructor失敗を再現。元7位置は先に維持し、その拡大pairのみ末尾±.10m候補を追加（最大9）。実顎triangle接点がなければ依然fail。別pair・旧倍率の動きやルールを変更していません。

最終31size組合せ（15種両役29＋mixedself2）/93clips/310選択pose、3448700native頂点、99接点、最大接点gap1.14e−8m、最終body場外余白.060m以上。旧view厳密inverseと12代表pose/presentation不変、size有無の規則一致を確認。全frameや93実試合の意味ではありません。

actual-main3：gen6固定→gen7保存成功→max115捕獲/自己最大→明示置換→COMcancel→AtlasB/地域往来→reload→返却再捕獲、計測一度だけ。quota/readback失敗で旧worldを維持。既存cicada-main3もgen6 fixtureのまま現在runtimeで確認。全てDOM/Map/WebGL/audioのdoubleを含み、実GPU・実音・本物のブラウザ保存/ゲームパッド・人間の喜びは未検証。

README/style/13音源とlicenseは不変更、ファイル削除なし。
