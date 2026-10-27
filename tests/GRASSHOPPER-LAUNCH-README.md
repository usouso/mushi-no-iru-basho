# バッタ離陸初フレームの限定修正

本番の変更は `insects.js` の方位補間に `if(u>0)` を付ける1分岐です。開始したそのtickでは進行度0でrootと6足が地面に止まっています。以前はそこで向きだけ変えて足を滑らせていました。

root軌道、支持面、離陸時刻、距離、弧、警戒、網、模型・脚、個体数、記録・音は変更しません。u=1は最後の空中移動区間を終えるtickなので従来補間を保っています。これは蹴り出し全体の生体力学を再制作するものではありません。

```sh
node --test tests/grasshopper-launch.test.mjs tests/grasshopper-launch-native.test.mjs tests/grasshopper-launch-main.test.mjs tests/published-graph.test.mjs
node --test --test-name-pattern='^strict pure' tests/tiger-beetle-field.test.mjs
```

独立CPU検査は実シミュレーションと旧版を対にし、意図した方位以外のstate/root軌道の一致、初tickのnative足頂点、少数の途中・着地姿勢と元地形の接触を扱います。actual-main検査はテスト用DOM・Audio・保存代替を使った本番モジュール評価で、実WebGL画面ではありません。古い固定件数の全テストを一括合格とするものではありません。

後の人間試遊では、跳び出しが地面の上の横回転に見えないかを確認します。実画面・実音・自然さ・操作感は未検証です。
