# 0.63.0 ヘラクレスの胸角基部

胸角が胴から少なくとも9.048mm浮いていた実模型の欠陥を修正。胸角の先頭control point Yだけ .055→.030 に変え、既存胸部に根元が接続する形にしました。橋渡しの隠し模型や、角全体の拡大縮小は追加していません。

先端18頂点・他control point・他部位・脚・材質・mesh数・表示倍率・捕獲/保存/相撲規則は維持。TubeGeometryのarc-length再サンプルにより、先端以外の遠位頂点には最大1.840mmの変化、全horn AABB上端には+.221mmの変化があります。全頂点や全bboxが不変だとはしません。胸内交差は根元の接続部に限定し、角を丸ごと隠していません。前2脚の根元接続は今回の修正対象外です。

Node24・repo root:
```sh
node --test tests/hercules-horn-*.test.mjs tests/xylotrupes-individual-integration.test.mjs tests/published-graph.test.mjs
```
追加依存・外部通信・private履歴は不要。本番はtestを読込みません。

- actual native2群：scale1000/1150、field/inspection。12基部skin頂点が実胸内、22接続edgehits、基部以外の埋込みなし。CPU前後図も確認。
- representative battle1群：Rhino/Met/Xyl/長顎specialに絞った16設定32clips96姿勢。root・全足・非胸角skin・先端・結果は旧062とexact、contactの丸めは5.55e-17m。骨・床・場外の従来閾値を維持し、実胸角面に接触するケースも含みます。
- actual main1群：合法ground+1.28mの視点からquiet Space/LOS捕獲→観察・回転→同姿勢放虫→再捕獲→直接仲間COM/cancel→区画往復。保存・旧メモ・同audio ownerを維持。旧捕獲補助で強制捕獲したものではありません。
- 新差分だけの厳密旧source逆変換、既存直前guard、配信graphを確認。旧全suiteや全対戦matrixの再走ではありません。

CPU数値と投影は実GPU描画・自然さ・実音・実ブラウザ保存・遊び心地の保証ではありません。38種・10区画・相撲16種・gen10/14個体/12最大記録、README/CSS/13音源/ライセンス/保存キーは不変。
