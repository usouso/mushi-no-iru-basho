# 0.62.0 豪州サイカブトの保存個体差

既存Xylotrupes australicusの1匹だけに、保存した新しい散策ごとの表示指数100〜115、同じ枝の3開始点、歩行リズムを追加。38種・10区画・相撲16種は不変です。姿・支持物・餌・自然生態の説明を増やしていません。指数は実寸mmでも強さ補正でもありません。

## 保存と捕獲
新generation10の末尾14番目に豪州区画 insect-2 を追加。旧generation1〜9は読み直しで増補・再抽選せず、既存13個体のID/抽選/最大記録を維持。既存散策がgen9なら旧固定個体は未計測のままです。「新しい散策」の保存とreadback成功後だけ新個体を表示します。単なる再読込みや観察画面では再抽選しません。

同じ枝の開始位置は−.04/0/+.04m、歩行範囲は元の±.12m。最大115%でも既存枝を拡大せず6足が支持面に収まるよう、rootとstrideを模型倍率に合わせます。古い固定仲間は自動的に新個体へ置換せず、選んで捕獲・置換した場合だけ記録を更新。以前の散策の仲間が新しい野外個体を同時に隠すこともありません。

## 相撲の限定修正
大きい個体の検査から、従来のgeneric押出し途中で受け手の脚が届かなくなる問題を発見。旧100%個体にも動的な到達不足があったため、Xylotrupesのgeneric対戦だけ既存の接地押し合いrendererへ統一しました。新IK・骨の伸縮・勝敗ルール変更ではありません。特殊な相手の既存分岐と、Xylを含まない対戦は維持。

短く接触してから離れ、脚で歩いて場外へ進む控えめな演出です。角skinを優先しますが、ノコギリ／ミヤマ相手には頭skinへの接触fallbackがあります。投げ上げ技を再現したとはしません。通常交換1.42秒、genericXyl場外演出は1.95→3.20秒になり、実際に場外へ出るまで結果表示・結果音を待ちます。接触音は1回。Metalliferの短い12mm歩幅を含む自然さは実画面で未検証です。

## 再実行
Node24・repo root:
```sh
node --test tests/xylotrupes-individual-*.test.mjs
node --test tests/anax-integration.test.mjs tests/goliath-individual-integration.test.mjs tests/goliath-individual-prior-chain.test.mjs tests/aggregate-main.test.mjs tests/published-graph.test.mjs
```
追加依存・外部通信・private git履歴なし。本番にtestsの読込なし。旧版の全glob合格を主張せず、変更に直結する条件と厳密な旧ソース逆変換を使います。

図鑑38メモ・16仲間・旧世代・大きさの最大記録、quota/CAS/不確定write、未対応oldreaderをMap/locks doublesで検査。上限16384charsは無変更で、14個体/12best最大counterは6123chars。CPU実geometryで枝接地・固定骨・旧固定個体と最大個体、実mainのSpace/LOS→記録→置換→COM/cancel→区画往復/reload→返却/再捕獲、3画面比の144観察姿勢、実production描画分岐の結果タイミングを確認します。

これらは実WebGL・実音・ブラウザ永続化／Web Locks・パッド・自然さ・遊び心地の保証ではありません。README／CSS／13音源・ライセンス／保存キーは維持。削除・初期化は不要です。
