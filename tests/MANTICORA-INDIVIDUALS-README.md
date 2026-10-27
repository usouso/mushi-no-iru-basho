# 0.38.0 — 地上の個体差と自己最大

Manticora latipennis に、既存の安定した散策個体を接続します。新種・模型・勝敗規則・音源は追加しません。

## 境界
- 同じ保存キー/形式2を維持。進行中generator1/2/3は5/6/7枠のまま。新規開始と明示した「次の散策へ」だけgenerator4・8枠へ進みます。
- 追加は `g4-…-savanna-manticora`、既存7枠のID/drawは同じ。乱数をframe毎に引かず、観察/再読込/区画移動でサイズ・開始点・動きのseedは変わりません。
- 大きさは同種の表示指数100〜115。自然の測定mm・自然分布・戦闘力ではありません。大きい個体が約10%の上側帯に出るのは既存のゲーム調整です。
- 裸地の同じ経路内で3開始点。高さ/歩幅/半歩停止/旋回の倍率を揃え、模型だけ大きくして足を滑らせる処理を避けます。旧フンコロガシと玉は動かしません。
- 捕獲→記録once→仲間→相撲→返却/再捕獲を接続。旧固定の未計測仲間を自動交換しません。保存失敗では旧世界/旧rawを維持し、不確定な書込を取り消したり無断で上書きしません。

## 検査

Node 24、追加依存なし。リポジトリ直下で:

```sh
node --test tests/manticora-individual-study.test.mjs tests/manticora-individual-field.test.mjs tests/manticora-individual-data.test.mjs tests/manticora-individual-battle.test.mjs tests/manticora-individual-main.test.mjs tests/published-graph.test.mjs
```

保存7条件、study4、field4、相撲3、main4、配信graph。実足/骨/接点を使う有限CPU検査と、DOM/音/描画/ストレージの代用によるmain検査です。相撲adapter/元模型/勝敗ルールは037から変更せず、最大値・中間値・大小self組で確認。旧source guard・旧5/6/7進行fixtureは保持し、新規/明示次散策の期待だけ更新しています。

実WebGL・実音・実ブラウザ保存・実パッド・楽しいかは未検証。最大模型の見え方、同じ裸地内の小さな開始差が探索として十分か、長い旋回の自然さは試遊が必要です。テスト件数を体感の保証とは扱いません。
