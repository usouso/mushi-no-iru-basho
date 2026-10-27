# 0.49.0 ギラファ雄とFlores参考小区画

RBINSがProsopocoilus giraffa keisukei名で公開するFlores雄標本を参考にした、ギラファノコギリクワガタの自作模型です。ゲーム学名欄はProsopocoilus giraffa。分類資料によって亜種・綴りの扱いが異なり、全資料で同じ分類が採用されるとは断言しません。34種／10区画／相撲15種です。

## 再実行
Node24系、rootから。追加依存・git履歴不要。本番はtestsをimportしません。

```sh
node --test tests/giraffe-stag-*.test.mjs tests/published-graph.test.mjs
node --test tests/journal-capacity.test.mjs tests/giant-waterbug-data.test.mjs tests/wetapunga-data.test.mjs tests/europe-individual-data.test.mjs tests/europe-stag-data.test.mjs tests/rainbow-stag-data.test.mjs tests/manticora-data.test.mjs tests/individual-roster.test.mjs tests/individual-roster-migration.test.mjs tests/expedition.test.mjs
node --test --test-name-pattern='strict additive inverse|literal inverse|fixed Europe registration|047-only inverse|048 explicit inverse|literal inverses' tests/dragonfly-landing-simulation.test.mjs tests/dragonfly-ambient.test.mjs tests/giant-waterbug-field.test.mjs tests/europe-stag-field.test.mjs tests/wetapunga-field.test.mjs tests/europe-individual-field.test.mjs tests/europe-individual-native.test.mjs
```

103個の限定条件が成功：模型5/study4/field5/foundation4/data5/battle4/main4、関連旧data64、旧sourceguard7、配信graph1。失敗したfixtureの訂正後は影響条件だけ再実行しており、単一103件一括実行の意味ではありません。最終nativeでbattle geometryとfoundation skinを再確認、重複件数を加算しません。旧main15本の現在カード数33→34、旧Europe battleの現登録数14→15は静的整合のみ。全repo suite合格ではありません。

## 模型と資料
頭胴約20cm、大顎先まで約40cmの表示用模型。脚を含む軸方向全体は約43.6cm。実物の寸法ではありません。今回は固定未計測で、サイズによる強化や新しい生成世代を加えていません。

幅広く角張った黒い頭と前胸、比較的平行に長く伸びる太い顎、内側の主歯・小歯・先端分岐を自作。既存ノコギリ・Metallifer・Europeと実triangleの正面/側面/背面/斜めを比較しました。13mesh/2206triangles/texture0、6脚の骨長固定、実socket pivot/tip頂点/contact triangleを持ちます。写真はコピー・トレース・texture化・同梱していません。

[RBINS公式標本](https://virtualcollections.naturalsciences.be/virtual-collections/entomology/coleoptera/lucanidae/prosopocoilus-giraffa-keisukei-mizunuma-and-nagai-1991)の写真内産地表記Floresと雄の形を参考にしています。2画像ファイルには同じ斜め写真があり、独立2個体の確認ではありません。歯・触角節・棘の細部は作者近似、隠れた後翅は未模型化です。

対象亜種の野外食性・活動時間・林内の位置を今回の一次資料から確認できなかったため、樹液好き・夜行性・特定植生などを図鑑へ断言していません。小林縁・枝・歩速は観察用の参考再現です。既存Sulawesi等へ自然分布として混ぜません。

## 場所・支持・捕獲
小区画19mesh/736triangles/texture0。実横枝上面.80m、長1.6m/top半幅.22m、root高.86m、worldXのlane±.24m。幹と枝・葉柄の接続、足の実ray、回り込み路のcolliderを限定検証。正面と側面は捕獲LOSが通り、裏側は実葉が遮ります。葉を無視する捕獲はありません。

通常歩行→現半歩を完了→短い警戒→反対方向へ退避。警戒.22秒、退避.12m、通常.02m/s・退避.14m/sはゲーム調整です。既存quiet/速度/距離/LOSによる気づきを使い、新種だけ別無敵・必中にはしません。6phaseの捕獲freezeと同姿勢からの放虫を確認。field35姿勢159支持ray、foundation24姿勢144ray、模型の固定骨/顎/socket/支持を別条件で点検しています。極小数値誤差は手続きgeometryの一致で、生物学的精度ではありません。

## 一巡・相撲・保存
actual main4条件はspawnから1.5mの実quiet歩行、Space/range/LOS捕獲、34カードと任意メモ、15番目の仲間へ保持して自動COM/cancel、旧9地域往来/reload/明示返却/再捕獲を実行。最大角度を含む3画面比288姿勢・1495296頂点で観察枠内、maxabsNDC-X約.737、Y約.689です。実pixelsではありません。

battle4条件：15相手両役29組、normal/正負ringout87clipから290選択姿勢。実接点、native脚・骨、床・場外・縦横画角、cancel/reset/disposeを確認。Euchirusの長前脚pairだけは既存専用viewへ委譲し、共有rig全体を書き換えていません。旧14経路・規則・代表28結果を保持。相撲の押し合いはゲーム上の演出で、野外の強さを測定したものではありません。全frame連続衝突や87試合の全一巡の意味ではありません。

journalと固定rosterのallowlist/originだけを追加。生成gen6九個体・旧gen1〜5・既存8species最大記録、旧33メモ・14仲間・v1元rawを保持。新種の計測IDはg1〜g7とも受理しません。保存key/schema/CAS/移行方式/削除方針を変えず、旧048fresh/staleクライアントは未知の34/15rawを上書きしません。最大stress132120文字は旧上限132992にも収まり、現式による上限137034です。式自体は不変更。

## 資源の限定確認
Floresとmeadow/understoryを3往復。旧world全geometry/materialのdispose、旧sceneから全root除去、旧simulation時計停止、旧models非参照を実listenerで確認。Flores32geometry/23material、meadow391/247、understory112/45を破棄。3framesのモデル更新は現在の個体数×3のみで、全地域の虫を毎frame更新しません。

audio serviceは同instance、fixture AudioContext constructor spy数1のまま。実AudioContext/GPU memory/GC回収の検証ではありません。前の観察標本は非描画sceneに最大1個だけ保持し、次観察で旧資源を破棄する既存bounded cacheです。野外へ重複出現する個体や往復ごとの累積保持とは区別しています。

## 未検証
実GPUの見つけやすさ・色・自然な動き・UI重なり、実音、実ブラウザ永続保存/gamepad、人間の楽しさは未確認。有限native/CPU検査とDOM/Map/WebGL/audio代替を実機検査と混同しません。新費用/依存/ネット通信はなし。既存README・音13本・license・他33種の模型は不変更。
