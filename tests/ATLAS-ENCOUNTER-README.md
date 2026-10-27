# 保存された散策ごとの Atlas 2地点 — 0.42.0

## 限定変更
新規または明示「次の散策」の保存成功後に使う世代5だけ、同じAtlas一枠を入口Aと西の実枝Bから選びます。両枝はその世代の静的背景に常設し、虫は1匹だけです。選択はseed/counter専用チャネル、同じ場所の連続も許します。既存8個体のID・表示サイズ・motion/site乱数は変えません。旧世代1〜4は元のAと景観を保持。

追加は既存西幹に接続する木部1 mesh/32 triangles/0 texture。旧A・他の虫・寸法・脚・相撲・音・捕獲範囲は変更しません。低い枝の座標や速度はゲーム上の展示設計で、野生の休息高度や反応の測定値ではありません。

## 再実行
Node24標準機能と同梱Threeで、リポジトリ直下から:

```
node --test tests/atlas-encounter-data.test.mjs tests/atlas-alternate-habitat.test.mjs tests/atlas-encounter-main.test.mjs tests/published-graph.test.mjs
```

新data5、支持4、実main3、graph1。別に旧client互換3条件、影響した旧data17条件・旧main10条件を実行。全suiteの再実行ではありません。旧Atlas最大inspectionケースは明示した旧世代4入力へ整合しただけで、再走査していません。テストはruntimeから読み込みません。

## 保存と再現性
世代5は同じschema/key/8枠を使います。旧世界は保存成功まで置換せず、quota/read/CAS失敗は元snapshot・scene・rawを保ちます。書込み後のreadbackが不明な場合、元sceneを維持しつつ、書けた可能性のあるrawを危険に巻き戻しません。旧v1は削除せず、旧最高記録・測定ID・仲間も保持します。

旧040クライアントは未知世代5の散策をread-only扱いして自動上書きせず、固定旧世界へfallbackします。既知g3Atlas仲間は読めるので、別IDの固定未計測Atlasが野外にも見える場合があります。同encounterの複製ではありませんが、旧clientが新配置を理解できるとは主張しません。新042では保持した同encounterは野外に表示しません。

## 検査と限界
実三角形の幹接続、42姿勢/198支持ray、最大表示1.15・3site・退避/復帰端、脚骨長、南北からの合法capture/反対幹の遮蔽、入口と周回経路を有限確認しました。実mainのメモリDOM検査は最大B捕獲→測定→保持→COM取消→全7区画/reload→明示返却→再捕獲、旧A保全、nextと保存失敗を含みます。モデル/inspectionは不変です。

WebGL・葉による見た目の遮り・初見で西へ寄道できるか・実音・ブラウザ永続保存・パッド実機・面白さは未検証。CPUの距離やrayは視認性合格の代替ではありません。
