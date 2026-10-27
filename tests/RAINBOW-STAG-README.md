# ニジイロクワガタ雄 — Phalacrognathus muelleri（0.40.0）

独立した北東オーストラリア雨林の小再現区画 `australia` に、固定・未計測の `insect-1` を置く統合契約です。東南アジアの既存林への自然同居とは扱いません。丸い背と上向く大顎を持つ長顎雄の定性的な自作表現です。

## データの範囲

- species `rainbowstag`、図鑑30種・仲間／相撲13種の登録。
- 仲間は `originKind:'legacy'`、originEncounterId / sizePermille / measureVersion は全てnull。1種1匹、明示返却／既存同種入替の規則を保持し、別originを捏造しません。
- 既存g1/g2/g3/g4、現在8枠の散策、schema2／保存キーを変更しません。Manticoraの旧固定nullとg4計測の双方を従来どおり受け入れます（同種2匹の同時所有ではありません）。新種の生成個体／測定を追加しません。
- 旧29図鑑記事、旧12種profile／ルールを保持。500文字の任意メモ・場所120文字はそのまま。全30種に応じた有限JSON上限は120872文字。既存rawを削除しません。
- 相撲roleは形の説明「丸い背と上向く大顎」のみ。新能力値・勝敗補正なし。自然の闘争再現とは主張しません。

## 生態と表示の区別

[Queensland DPI収録の原著抄録](https://era.dpi.qld.gov.au/id/eprint/524/) と [Museums Victoriaの雄成虫標本](https://collections.museumsvictoria.com.au/specimens/1292484) は北Queenslandの雨林／地域を確認する根拠です。幼虫と腐朽木の関係を成虫食性へ読み替えません。成虫の自然食物・活動時刻・休止高度・自然mmはこの制作では未確定です。

低い倒木で短く歩く配置・歩速・警戒はゲーム調整です。模型の胴頭.18／体軸.27はゲーム表示値で、自然測定値や記録サイズではありません。写真転載／トレース／外部textureなし。内部後翅は未造形であり、生物学的に後翅が無いという意味ではありません。

## 保存検査の境界

```sh
node --test tests/rainbow-stag-data.test.mjs
```

追加依存なし、MapStorageと明示lockによる新保存6条件。実ブラウザ保存や実ユーザーデータには触れません。模型・支持・実main・新種間相撲は下記の別統合検査で確認しています。このdata合格だけでfieldや対戦の完成、実GPU・実音・人間試遊の合格とはしません。

## 統合結果と試し方

0.40.0では、区画選択／散策中の移動から「北東オーストラリア・雨林の小再現区画」へ入れます。倒木の上を探し、右クリックで静かに近づいて Space で網。観察から放すか、仲間として連れて見守り型の虫相撲へ進めます。任意メモと場所は従来の図鑑に残ります。新たな食物・餌・飛行・育成・ネット機能は追加しません。

模型4／歩行4／区画4／共有field5／保存6／相撲3／実main4／既存data登録13／旧main等の影響5／旧battle保護2／配信graph1の、計51の限定検査群が合格。初回fixture不備を訂正した再実行は重複加算していません。旧main11ファイルの図鑑カード件数は静的に整合しただけで、各file全体を新たに合格とはしていません。

相撲は新種を含む25組・両終局の50clipで接点／native脚／場外表示を有限時点で確認。13種目の保持と旧12仲間・旧29メモ・g4の8散策枠を残した実main一巡、再読込・返却・保存失敗をMapStorageで確認しました。3画面比率の実模型の投影も確認しましたが、実ブラウザの描画／永続保存／実音の確認ではありません。

```sh
node --test tests/rainbow-stag-*.test.mjs tests/australia-habitat.test.mjs
```

この小区画は倒木1本と定性的な広葉樹の配置で、北Queenslandの特定地点や植生群落を精密再現していません。全体の地続き化もまだ行っていません。実画面では、倒木と虫の色の見分けやすさ、短い歩行／退避の自然さ、相撲の接触と小刻みな足運びを確認する必要があります。旧種の尺度・動作・捕獲判定・音13本は維持しています。

形の参考は[Queensland Museumの標本展示](https://artsandculture.google.com/asset/hgH2rJwRzBR1cg) と [Dattariの原記載の著者公開再録](https://www.researchgate.net/publication/305722434_Dattari_1886_an_overlooked_reference_on_Phalacrognathus_muelleri_Macleay_1885_Australia%27s_most_beautiful_stag_beetle_Coleoptera_Lucanidae)。写真・文章・図版を素材として転載せず、丸い背と上向き二叉顎を独自座標で近似しています。
