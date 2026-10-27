# 0.48.0 欧州クワガタの保存された個体差

既存Lucanus cervusの雄1表現に、既存の個体差の仕組みを接続。新種・区画・相撲ルール・音・依存を追加しません。33種／9区画／相撲14種。実物35〜75mmという既存資料の目安と、基準100〜115のゲーム表示指数を明確に分けます。個体差は自然個体群の分布を測定した値ではありません。

## 再実行
Node24系、rootから。追加依存・git履歴不要。本番はtestsをimportしません。

```sh
node --test tests/europe-individual-*.test.mjs tests/published-graph.test.mjs
node --test tests/europe-stag-study.test.mjs tests/europe-stag-habitat.test.mjs
node --test tests/expedition.test.mjs tests/giant-individual-data.test.mjs tests/atlas-individual-data.test.mjs tests/manticora-individual-data.test.mjs tests/atlas-encounter-data.test.mjs tests/giant-waterbug-data.test.mjs tests/wetapunga-data.test.mjs tests/europe-stag-data.test.mjs tests/rainbow-stag-data.test.mjs tests/manticora-data.test.mjs tests/atlas-individual-layout.test.mjs tests/individual-roster.test.mjs tests/individual-roster-migration.test.mjs
node --test --test-name-pattern='old ten profiles' tests/euchirus-data.test.mjs
node --test --test-name-pattern='strict additive inverse|literal inverse|fixed Europe registration|047-only inverse' tests/dragonfly-landing-simulation.test.mjs tests/dragonfly-ambient.test.mjs tests/giant-waterbug-field.test.mjs tests/europe-stag-field.test.mjs tests/wetapunga-field.test.mjs
```

126個の限定条件が成功：新規data5/native6/field5/battle3/main3、関連旧data90、既存study/habitat8、旧sourceguard5、配信graph1。再実行や頂点・組合せを追加条件数に数えません。全repo suite合格ではありません。昔の一部テストには048以前からの種数・旧slot数期待が残るため、全件実行済と誤記しません。

## 個体・保存
生成gen6はEuropeを9件目へ追加。旧gen1〜5の5/6/7/8/8件、既存seed/counterの先頭8個体のdraw/ID/hashは同じ。新genは明示的な次の散策が保存・読戻し確認できた後だけactiveになり、既存散策を読込んだだけでは追加されません。空の保存は既存手順で一度作成します。

同じencounterはscene移動・観察・再読込でもsize/site/motionSeed不変。別の散策では既存counterが変わり、新たな出会いになります。EuropeのIDはg6、sizePermille1000〜1150、siteIndex0〜2、motionSeedはuint32です。サイズによる勝敗ボーナスはありません。

保存キー・schema2・CAS/移行方式・削除方針を変更していません。旧33図鑑のメモ、14種の仲間、v1元データ、旧best/測定履歴を保護。古い047クライアントが新gen6や計測Europeの仲間を読んでも、fresh/staleとも未知rawを上書きしません。最大fixtureは3997文字で既存上限16384を変更していません。quota・読戻し不確実・書込後例外・他タブ競合・locks欠如を限定検証。Map/WebLocks代替であり、実ブラウザ永続保存の保証ではありません。

## 支持と描画
倒木の形を変えず、開始位置を世界X−.12/0/+.12mに変えます。可動laneは世界X[-.34,.34]mのまま。大きさに合わせroot高と歩幅を同時に補正し、相対boundsの数値だけを広げて枝外を歩かせることはしません。速度の補正も歩幅整合のゲーム調整で、自然の速さや強さの測定ではありません。

元の自作模型・骨長・共通歩行coreは不変。native6条件で6480フレーム/216支持姿勢、60姿勢360実ray、旧固定study8条件を確認。旧profileなしの独自support許容は維持し、計測済profileだけを正規lane/位置/9fieldへ厳密照合。field5条件は6size/site profile、36姿勢198支持ray、全6phaseの捕獲/返却と元固定操作を検証。

## 実入力と相撲の限定検査
actual main3条件：本物のgen5 fixture→保存完了後gen6、quiet Spaceと実range/LOS捕獲、計測一度、意図的な同種置換、COM/cancel、gen6のAtlas別支持B、移動/reload/返却/再捕獲、別encounterを誤hideしないこと。最大個体はinspection3aspect・846144native頂点で枠内（最大absNDC-X約.706）。DOM/音声/WebGL/Mapは代替です。

battle3条件：最大Europeと14相手、両役27組、normal/正負ringoutの81clipから270姿勢。実skin接点、骨長、支持脚、縦横画角、場外終端を検査。サイズ有無216state比較でルール結果が同一。pause/cancel/reset/disposeと別field/inspectorの非変更を確認。有限姿勢であり、81試合の全frameや連続衝突を検証したものではありません。

古いsource goldenは新値で作り直さず、048限定差分の正確な逆変換で同じSHAへ戻す仕組みです。旧registryのEuropeサイズ説明だけは今回の承認済変更を明示比較し、他項目はそのままです。

## 未検証と不変範囲
実GPUでの自然さ・発見性・UI重なり、実音、実ブラウザ保存/gamepad、人間の楽しさは未確認。CPUの極小接触誤差は手続きgeometryの一致で、生物学的精度ではありません。
README、音13本とcredits/license、他32種の模型・既存相撲ルール、外部通信は変更なし。モデル形状・生息地追加や餌・時計・強化育成を含みません。
