# 0.50.0 — セミ表示だけの幹クリアランス

既存4匹のアブラゼミの離陸・帰還時に、胴や脚が元の実幹へ深く入る具体的不具合を修正します。34種／10区画／相撲15種、22.9cmの表示全長、模型・材質・4翅・6脚・simulation/root/heading/経路・capture・save・音は不変更。生物の飛び方の完全再現ではありません。

## 再実行
Node24系、repository rootから。追加依存・git履歴不要。testsは本番からimportしません。

```sh
node --test tests/cicada-clearance-*.test.mjs tests/published-graph.test.mjs
node --test --test-name-pattern='strict additive inverse|literal inverses' tests/dragonfly-landing-simulation.test.mjs tests/europe-individual-native.test.mjs
```

16個の限定条件（render5/native5/main3/旧sourceguard2/配信graph1）。単一の全repo suite合格ではありません。最終配信束の再検査は同じ条件を重複加算しません。

## 実装と上限
cicada-only adapterで、元bark anchorから.25m内を補正し、.45mまでにゼロへ減衰。rootを動かさずvisualの外向き平行移動だけを行います。最大8cm、検査で最大43.114mm。静止・警戒・捕獲中・観察・無anchor・離れた飛行には適用しません。無効な座標を拒否し、遠方まで無限の平面で押し返しません。

実geometry15node/4146頂点の符号付平面距離を調べます。4匹同時最大16584 scalar iterations、per-vertex allocationとruntime Raycasterは0。CPU数でありGPU性能保証ではありません。

## nativeとmainの確認
4home×30/120Hzの8trace、104 selected poses（32return）、旧新計854880本の実9facet幹triangle ray。旧最大侵入45.364mm→新1.275mmで、後者は従来の丸い脚先rim1.272mmと区別して記録。ゼロ侵入と偽りません。胴は10.05mm以上、4翅は38.72mm以上の間隔。静止24足中心は1nm以内で旧位置維持。fast/quiet接近と放虫の別経路も限定点検。

追加補正のframe差は120Hzで最大5.777mm、30Hzで20.378mm、粗いdt=.1で40.285mm。元のpose移動自体の滑らかさや全時間連続衝突は保証しません。

actual mainでは静止・離陸・帰還の実Space/range/LOS捕獲→pointer観察→放虫→再捕獲、4匹目メモ・旧33種メモ/15仲間/gen6九個体/最大記録保持、10地域往来/reload、pause/hidden/volume0を確認。audio同service・fixture constructor spy1。既存caught wingPhase clockはそのままで、翅まで永久凍結したとは言いません。

DOM/WebGL/audio/Map-storageはdouble。実GPU・実音・実ブラウザ永続保存・gamepad・人間の自然さ/楽しさは未検証。README、13音源、license、外部通信と依存は不変更。
