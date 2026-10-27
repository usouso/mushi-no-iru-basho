# 0.44.0 アキアカネの待ち時間差

草地の既存6匹だけを対象とする表示・行動タイミングの調整です。31種・8区画・相撲14種は変更しません。

## 変わるもの／変えないもの
保存済み散策のworldSeedとoutingCounter、固定IDから、休止8〜12秒と周期内offsetを独立したhashで導出します。飛行は同じ6秒、半径・上昇式・幾何phase・体格・葉・逃避経路は同じ。新保存キーやgeneratorはありません。snapshot無し／初回保存失敗は旧タイミングへ戻り、一時乱数を作りません。新散策も完全な書込みとreadback成功後だけ反映します。

個体の設定は旅行／再読込／観察で引き直しませんが、時計そのものは保存しない旧仕様です。同じ瞬間の位置から再開するという意味ではありません。

## 再実行
Node24系、rootから。依存追加はありません。

```sh
node --test tests/dragonfly-ambient.test.mjs tests/dragonfly-ambient-main.test.mjs tests/dragonfly-ambient-skin.test.mjs tests/published-graph.test.mjs
```

新規16条件＋配信graph1条件です。skin検査は有限サンプルの実geometry比較で、約2分を要します。全旧suiteではありません。

## 実施範囲
- pure/helper・実simulation **10条件**：極端seed/counter、コピー・無効値、6匹×休止候補×dt、捕獲／返却／settling優先、profile無し旧時系列。
- 既存capture-awareness **8条件**：警戒・静歩・空振りの既存反応。
- 旧Europe sourceguard **1条件**：044の正確な追加literalのみ逆変換し、元のgoldenを変更せず保持。
- actual main **4条件**：初回／保存済み／旅行／reload／新散策、書込み後readback前は旧active、quota／不明readbackで旧world保持、実SpaceとLOSの飛行中捕獲・観察・連続返却。12,240時系列点、返却後最初の移動約3.85mm。read/CASの過去ケースは今回再実行していません。
- actual native skin **2条件**：78個体×タイミング組合せ、12,738姿勢。不透明物体／支持葉との通常接触を除く有限辺交差0。収束後の156回の6脚検査、最大足面差約0.569mm。
- 配信graph **1条件**：155module、全query tokenと内容fingerprintの閉包。

計**26個の限定public条件**。78組合せや頂点数を独立テスト件数として加算しません。元の043模型／31種全動作／全保存suiteを反復していません。

## 重要な未検証と既存の挙動
旧平滑化のため、stateがrestingへ切り替わる最初のframeは葉から約21cm離れることがあり、厳しい収束条件まで約1.9〜2秒かかります。検査はその後の実6脚を確認しており、「resting直後に接地済み」とは主張しません。位置を葉へsnapさせる変更はしていません。

透明な葦カードの板ポリゴンとの交差は旧043にもあります。今回の広い時刻サンプルでは別のトンボでも板交差がありました。textureの穴やshaderの風をCPUで再現していないため、実際の葦への貫通とも、視覚的に悪化していないとも断定できません。既存の不透明solid／支持葉の有限検査とは別です。連続時間の全衝突、GPU、音、人間の自然さ／捕まえる楽しさ、実ブラウザ保存、gamepadは未確認です。

## 生態との区別
[宮内庁のアキアカネ観察](https://www.kunaicho.go.jp/visit/higashigyoen/list-creatures/akiakane.html)は林縁・芝地や池での飛翔と休憩の参考、[TAKAO599MUSEUM](https://www.takao599museum.jp/treasures/insects/%E3%83%88%E3%83%B3%E3%83%9C%E7%A7%91/2709/?lang=ja)は色と季節移動の参考です。8〜12秒、6秒、hash分布はゲーム調整で自然の測定値ではありません。季節移動を今回再現せず、茶色い胸と赤い腹の現モデルも変えていません。

README・既存13音とライセンス・保存元bytes・外部通信を変更しません。テストは本番から読み込みません。
