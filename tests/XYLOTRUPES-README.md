# Xylotrupes australicus 雄：低い枝から虫相撲へ

37種目・16番目の仲間／相撲種を、既存豪州参考区画の別支持枝へ追加。既存のニジイロクワガタや倒木・区画往来を変えません。新個体は固定の未計測、gen8／11 encounter／10 bestは不変更です。新餌・飛行・音・地域・戦闘ボーナスは追加しません。

## 再実行

既存Node24、repository直下。テストは本番へ読み込みません。

```sh
node --test tests/xylotrupes-*.test.mjs
node --test tests/journal-capacity.test.mjs tests/aggregate-main.test.mjs tests/published-graph.test.mjs
```

過去の固定種数suiteの一括合格ではありません。strict逆変換で今回追加だけを取り除き、旧完全source SHAを保持します。

## 一次資料と表現境界

- [Rowland (2011), Notes on nomenclature in Xylotrupes](https://www.zin.ru/animalia/coleoptera/pdf/rowland_2011_nomenclature_xylotrupes_dynastinae.pdf)：基亜種のQueensland記録、旧gideon／ulysses内で扱われた分類史、太く反曲する頭角末端を確認しました。同原著のFig.5/6は別種で、対象模型へ流用していません。
- [Auckland Museumの標本紹介](https://www.aucklandmuseum.com/discover/stories/blog/2023/clarke%2C-the-christmas-collector)：同定標本AMNZ180361の幅広い暗色上翅と二叉胸角を実見しました。写真は配信・トレース・テクスチャ化しません。上方の一視点では下の頭角が一部隠れるので、精密な高さ比の復元を主張しません。
- 成虫の食性・活動時刻・特定の雨林樹種／倒木利用は今回未確認です。旧名だけが一致する別資料の生態を無条件に移しません。低枝・短い歩行と警戒は観察用ゲーム設定です。

自作模型は胴頭20cm、角先を含む実mesh軸約28.324cmの表示補正で、自然の体長ではありません。実胸に6脚、触角2、頭と前胸に根を持つ別々の二叉角、閉じた前後4枚の翅。17mesh／2770tri／texture0。根・固定骨・実skin・収納膜・角の有限動作を点検し、CPU四面図を実見しています。実GPU画像ではありません。

支持は枝と地面まで繋がる支柱2mesh／48tri。旧経路284点・旧ニジイロLOS45本を保持。fieldでは旧単独rainbowと、正規の2種配列だけを区別し、新slot2へ不正な計測profileを入れません。捕獲・放虫で姿勢を保ちます。

## 保存と相撲の限定検査

旧36メモ・15仲間・gen8 rawを保持。37メモ／16仲間は既存容量式で扱い、旧版・未知形式・quota／CAS／読戻し不確定で勝手に削除・上書きしません。

自動相撲は種登録だけで旧15種のルール・450 seeded終局結果を維持。新31 ordered pairs／310代表姿勢で実角接点・足・骨長・場外・frustumを確認。新種を含むgeneric pairだけ既存grounded-knee処理を使い、床clampによる旧rhino脚の変形を避けます。Miyamaが押す一姿勢には既存の1.5mm視覚clearanceがあり、全接点が距離0とはしていません。旧45 native姿勢はexact。

actual-mainは実Space／LOSの捕獲→37番目の記録→16番目の仲間として直接COM→取消→移動／reload→明示返却・再捕獲。144 native観察姿勢と1往復のfield／支持所有資源を確認します。inspection共有材質は既存のmesh単位破棄方式で、参照数分のdisposeイベントになる点を区別しています。

## 集約入口の意味

`aggregate-main` の3群は、明示37種のregistry・登録API、全10区画66個体の往来と資源所有、採用13音のmock decodeとlifecycleです。全種登録は成功捕獲結果をstubしたmain経路で、37種全てを実際に探して捕まえた試遊ではありません。物理捕獲は各種の限定main検査と区別します。

DOM・Map保存・WebGL描画・WebAudio・locksのテスト用代替を使用します。実画面・実音・ブラウザ保存耐久性・gamepad・自然さ・楽しさは未確認。有限姿勢の検査は全連続衝突の数学的証明ではありません。
