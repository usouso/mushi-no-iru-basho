# 0.47.0 ウェタプンガと小さなNZ林区画

Deinacrida heteracanthaの成虫雌1表現を、ニュージーランド北部の林を参考にした別区画へ追加。既存の豪州・東アジア等に自然分布として混載しません。33種／9区画／相撲14種です。新種は固定未計測、戦闘・餌・飛翔・跳躍・繁殖・昼夜時計を追加していません。

## 再実行
Node24系、rootから。追加依存・git履歴不要。

```sh
node --test tests/wetapunga-*.test.mjs tests/published-graph.test.mjs
node --test --test-name-pattern='journal article|both journal writers|only whitelist changes' tests/journal-capacity.test.mjs tests/manticora-data.test.mjs tests/rainbow-stag-data.test.mjs tests/europe-stag-data.test.mjs tests/giant-waterbug-data.test.mjs
node --test --test-name-pattern='strict additive inverse|literal inverse|fixed Europe registration' tests/dragonfly-landing-simulation.test.mjs tests/dragonfly-ambient.test.mjs tests/giant-waterbug-field.test.mjs tests/europe-stag-field.test.mjs
```

新規6ファイル28条件＋旧容量/保存5＋旧golden4＋配信graph1、計38個の限定条件。旧main15本のカード数32→33は静的整合のみで、15一巡を今回再実行したとは述べません。再実行や頂点・組合せ数は追加条件数に数えません。

## 形と場所
頭胴長約26cmの自作表示模型で、実物の寸法ではありません。長い糸状触角、大きな後腿、棘を表す後脛、幅広い前胸、翅のない分節腹、雌の産卵管と左右の尾毛を表現。産卵管を毒針や戦闘武器として扱いません。体節/棘の数、色・比率・歩容は独自近似です。15mesh／3,026triangles／texture0。

小区画は低い太枝、上の枝から垂れる枯シダ風3束、短い回り込み路。23mesh／910triangles／texture0、地面は水平、可動境界は各軸±7m。太枝の上面.94m、模型の足から根まで.065m。前面隙間と側面は実LOSが通り、別の角度では実葉が網を遮ります。葉を無視して捕まえる仕組みではありません。特定の野外地点や植生の測量再現ではありません。

## 動きと捕獲
.04mのsigned gaitで足の支持位置と根の移動を連動。通常.05m/s、退避.12m/sはゲーム調整値です。現半歩を完了してから逆方向へ動き、停止時は六脚支持。刺激された正逆歩行の有限サンプルで、半歩完了最大.500秒、最初の逆向き速度.501秒、刺激地点より1mm遠ざかるまで.800秒でした。数秒間の停止を足すことや、瞬間反転・ワープはしません。枝の端で逃げられない場合は止まり、近寄る方向へ偽退避しません。

速歩接近や近い空振りでは、近づく位置と反対へ短く退避。静歩なら休止中へ近づけます。捕獲は既存の距離・角度・LOSで決まり、退避中も捕獲できます。4phaseすべてで捕獲freezeと同姿勢からの放虫を確認しています。自然の歩行順序や反応秒数を測定したものではありません。

## 限定検査
- 模型5：193純姿勢、24native歩行姿勢、固定骨/支持脚、産卵管・脚・触角の限定非貫通、捕獲とinspectionfreeze。
- study5：支持足固定、半歩停止、境界、4phase捕獲/返却、30/60/120Hz、刺激方向/反応遅延。
- foundation4：実枝と幹/地面接続、51姿勢357,612頂点180足ray、短路のcollider余裕、実葉LOS、dispose。足gap最大約4.77e-9mは手続きmeshの一致で、生物学的精度ではありません。
- field5：strict支持コピー、元046の固定sourcehash、旧32registry/control不変、速歩/quiet/空振り/遮蔽、92native姿勢501支持ray、全phase捕獲と返却。
- data5＋影響旧5：旧32メモ・14仲間・gen5八個体/best/v1を保持。新33件のquota/CAS/未知種旧046fresh/stale保護。容量式や保存プロトコルは変えずwhitelist一語のみ。33行最大長fixtureは128233文字、旧32種上限128962にも729文字余裕。既存式による現在33種上限は132992です。
- actual main4：spawnから実quiet歩行とSpace/LOS捕獲、33カード/任意メモ、連続放虫/再捕獲、葉遮蔽と側面、速歩・quiet・空振り差、旧8区域へ8往復とreload/保存失敗保護。初回狭画面で長触角が枠外になる問題を検出し、この種だけaspect係数4.3→3.1へ訂正。実inspector1,009,728頂点、最大absNDC-X約.939へ収まりました。
- 旧sourcegolden4：047の厳密追加だけ逆変換。旧043/044/045/046の固定値を新値へ作り直していません。
- 配信graph1：165moduleと一つの内容token閉包。

## 一次資料
- [DOC種紹介](https://www.doc.govt.nz/nature/native-animals/invertebrates/weta/giant-weta-wetapunga/)：種・枯葉下の昼の休止・夜の移動。
- [DOC技術書](https://dxcprod.doc.govt.nz/globalassets/documents/getting-involved/translocation/translocation-best-practice-giant-weta.pdf)：種の区別、翅なし、雌の産卵管と尾毛。取得できた本文範囲を参考にし、PDF写真を視認したとはしません。
- [Te Papa](https://collections.tepapa.govt.nz/topic/1356)：姿と暮らし。古い保全区分や分布数を現在値として転用しません。
- [Auckland Zoo公式](https://www.aucklandzoo.co.nz/animals/weta-punga)：実際に確認した正面と斜め側面の別写真。飼育/給餌写真で、野生の支持や歩行順序の証拠ではありません。写真はゲームへコピー、トレース、texture化、同梱していません。

## 未検証
実GPUでの枯葉越しの発見性、色や脚の自然さ、UI重なり、実音、実ブラウザ永続保存・gamepad・人間の楽しさは未確認。main検査は本番ルール/入力/実geometryを使いますが、DOM/WebGL/audio/Mapは代替です。有限poseと保守AABBを連続全域衝突の証明とはしません。既存32種の全suiteを繰返していません。

README・音13本・ライセンス・外部通信は変更なし。テストは本番から読み込みません。
