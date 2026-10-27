# 0.61.0 ギンヤンマ（雄） — 限定検査

既存の温帯池の西岸に1匹だけ追加。岸で縦の茎にとまる→離れて池上を巡回→茎に戻る、という一巡です。38種・10区画・相撲16種。新種は固定・未計測・相撲対象外で、旧32個体の番号や出現場所、gen9の13個体記録／11種の最大記録は変更しません。

## 出典と表現の限界
- [国交省 矢部川](https://www.qsr.mlit.go.jp/chikugo/siryo/02-kawa/02_yabe/rikujoukontyurui/ginyanma.html)：緑の胸・複眼、雄の青い腹基部、開けた池沼。掲載の縦茎にとまる姿を参考に、輪郭を自作。
- [宮内庁 皇居東御苑](https://www.kunaicho.go.jp/visit/higashigyoen/list-creatures/ginyanma.html)：池上の巡回、夏の飛翔・休息。
- [東京都公園協会 八丈](https://www.tokyo-park.or.jp/park/hachijo/creature/detail/0520.html)：よく飛び、枝等につかまって休む。
国内資料の学名は Anax parthenope julius。Anax julius とする扱いもあり、分類が全資料で統一済みとはしません。写真の転載・テクスチャ化・トレースはしていません。

模型は独立4翅・2触角・胸由来の6脚。頭から腹端約.28m／開翅約.48mは判読用の表示設計で、自然寸法ではありません。縦茎の具体位置、14秒の巡回、休止時間、警戒距離は観察用のゲーム調整。自然の秒数・反応距離・個体の毎回同じ茎への帰還を再現した測定モデルではありません。餌・ヤゴ・産卵・新音は追加していません。

## 再実行
Node.js24、repo root:
```sh
node --test tests/anax-*.test.mjs
node --test tests/journal-capacity.test.mjs tests/aggregate-main.test.mjs tests/goliath-individual-integration.test.mjs tests/goliath-individual-prior-chain.test.mjs tests/butterfly-ambient-integration.test.mjs tests/published-graph.test.mjs
```
既存全テストのglobを合格したという意味ではありません。ネットワーク・追加依存・private履歴なし。テストは本番から読み込まれません。

模型／実支持面・純粋状態／実fieldとLOS／図鑑互換／実mainの入力経路を分けて検査。mainのDOM・WebGL renderer・audio・storage・locksは代用品です。実際のSpace判定を使うケースでもカメラを合法な岸位置へテスト設定しており、人間が初見で見つけた証拠ではありません。

捕獲は休止と空中の両方、観察→記録→放虫→再捕獲、pause/hidden、既存37メモ・16仲間・gen9記録を保護。旧readerの未知種拒否／quota／他タブCAS安全を確認。journalには保存後readback機構を新設していません。3画面比の144観察姿勢を数値投影し、最初に発見した狭い縦画面の翅切れを新種だけの倍率上限で修正しています。

CPU模型の頂点と脚接触・有限な姿勢検査は、実WebGLの透過翅・草との重なり・実音・実ブラウザ永続化・パッド・自然さ・遊び心地の保証ではありません。既存README／13音源・ライセンス・CSS・保存キーは変更しません。
