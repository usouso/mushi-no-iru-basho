# 緑カマキリ：後脚付け根の限定修正

後脚2本の起点を腹から既存の中胸へ移します。runtimeは `mantis-kinematics.js` の hip Z 一数値のみです。前中脚・胴頭26cmの表示寸法・翅・材料・葉・経路・study・保存・音は変更しません。

後脚上節は約54.083mmから86.464mmへ変わり、下節52.134mm、膝・足・tuck軌道を保持します。これは模型の接続不備の補正で、自然計測に基づく節比率の再現ではありません。胸を広げたり腹を隠したりして接続を装っていません。

## 再実行

既存 Node 24、repository直下。テストは本番へ読み込みません。

```sh
node --test tests/mantis-thorax-*.test.mjs tests/mantis-study.test.mjs tests/published-graph.test.mjs
```

新model4条件は純旧kin fixtureとSHAを固定し、一数値を戻すと旧ソース完全一致。新上節以外の実メッシュ属性・材質・transform、膝／下脚／足をold/new比較します。12代表poseで胸接続と腹・4翅・中脚への禁止交差を点検します。

独立native3条件は実studyと実葉2枚の24姿勢でroot／膝／下脚／4足を比較。新上管と動く翅・葉の限定非交差を確認します。actual-main1条件は本番ソースで静止捕獲→回転観察→離陸→飛行捕獲→放虫→着地後再捕獲、既存36メモ・gen7個体差・15種仲間・audioContext単体を確認します。DOM・Map保存・WebGL描画・音はテスト用代替です。既存mantis-study4条件と配信graph1条件も対象です。

全過去版固定テストの一括合格ではありません。有限姿勢の非交差は全連続姿勢の数学的証明ではなく、CPU図はWebGL画面ではありません。実画面・実音・ブラウザ保存の耐久性・自然さ・遊び心地は未確認です。
