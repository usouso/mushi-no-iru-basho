# 0.51.0 — セミの胸部と脚の局所修正

[Smithsonian自然史博物館](https://naturalhistory.si.edu/education/teaching-resources/life-science/what-insect)で示される、昆虫の脚が胸につく基本形に沿う修正です。元模型の後脚は腹に付いていたため、セミ専用生成で中・後脚の上側4円柱だけを胸へ繋ぎました。脚節の自然な角度や長さを測定した再現ではありません。

## 再実行
Node24系、rootから。追加依存・git履歴不要。testsは本番からimportしません。

```sh
node --test tests/cicada-thorax-*.test.mjs tests/cicada-clearance-main.test.mjs tests/published-graph.test.mjs
node --test --test-name-pattern='strict additive inverse|literal inverses' tests/dragonfly-landing-simulation.test.mjs tests/europe-individual-native.test.mjs
```

15個の現在候補の限定条件：model4/native5/current-main3/旧sourceguard2/graph1。別に旧050render5と旧050native sourceguard1＋capture/release1を厳密逆変換した旧形でreplayします。それは現051形の検査件数ではありません。最終配信束の再検査も重複加算しません。全repo suite合格ではありません。

## 形と支持
4上脚の位置/法線だけ変更。前上脚2、全下脚6、膝と足端、体/眼/触角/4翅/材質/UV/結合構造は保持。15geometry/1382trianglesのまま、実外寸0.2289999986m（表示補正約22.9cm）はexact。全33他種の共有関数を変更していません。

4上脚の中心と実skin5辺の24rayで、実胸triangleから外へ出ることを確認。胸が腹の出口より最低1.823mm先まで残り、隠れた始点だけの変更ではありません。6膝は実skinが接続し、別脚15組に交差なし。旧新の実triangleを腹面と左右斜めのCPU図で確認しました。画像はゲームのGPU画面ではなく、texture/alpha/Line細部を省いた平面陰影です。

現4homeの24足capと1440下脚頂点・丸いrimのworld位置/幹gapは旧050と同一。050の離陸/帰還から影響しうる20時点、82200本の実幹rayで最小gap−1.290153mm（既存rim許容内）、補正offset差0。連続全時間・全環境衝突の証明ではありません。

current-main3は現在模型を使って静止/離陸/帰還のSpace/range/LOS捕獲、pointer観察、放虫/再捕獲、旧記録/15仲間/gen6九個体、10地域往来/reload、pause/hidden/muteを再確認。DOM/Map/WebGL/audioはdoubleで、実機保存や音の検証ではありません。

## 保持するもの
050のclearance helper・simulation/root/path/警戒/捕獲/保存/音、README/style/13音源/license、依存と外部通信は不変更。共有legs()/segment()も不変更。34種／10区画／相撲15種。実GPUの自然さ・色・見つけやすさ、実音、ブラウザ保存/gamepad、人間の楽しさは未確認です。
