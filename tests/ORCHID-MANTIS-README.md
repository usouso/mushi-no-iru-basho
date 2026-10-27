# ハナカマキリ成虫雌：葉上の限定探索

原著写真で成虫雌と明記された Hymenopus coronatus を参考にした独自模型1表現です。既存東南アジア区画に独立した葉1枚と茎を足し、旧7個体の支持を奪いません。36種／10区画／相撲15種。保存世代・測定対象・仲間・音は不変更です。

## 実行

既存の Node 24、リポジトリ直下から実行。テストは本番には読み込みません。

```sh
node --test tests/orchid-mantis-*.test.mjs
node --test tests/journal-capacity.test.mjs tests/published-graph.test.mjs
```

全ての旧世代固定テストを一括合格と主張するものではありません。限定逆変換が新しい追加だけを除去し、固定した旧版SHAを要求します。

## 表現の境界

- 胴頭22cmはゲーム表示寸法で自然の測定値ではありません。既存緑カマキリの大きさは変更しません。成虫の幅広い淡色前翅と中後脚の葉片状の腿節を作り、幼虫の反った腹端は流用しません。
- 4本の中後脚が葉を支え、前2本は折り畳んだ捕獲脚。脚の付け根・骨長・腿節の広がり・実葉面との接触を検査します。4脚は1本ずつ振り出す簡易歩行で、停止時の足滑りを避けます。
- 成虫の前後2対の翅を模型に持ちますが、閉翅だけの簡易表現です。飛行・精密な膜翅の収納機構は作っていません。「成虫雌は飛べない」とも断定しません。
- 近接時の小さな捕獲脚姿勢と短い葉上移動はゲーム調整。自然の防御速度・距離を測定したものではありません。警戒・歩行途中でも既存の網とLOSで捕獲できます。見えているのに捕れない保護時間は加えません。
- 図鑑の新しい1種だけを許可リストに追加。既存のメモ・個体差・仲間を削除・初期化せず、旧版で未知記録を読み込んだ場合の上書き拒否も確認します。容量計算式そのものは変えません。
- actual-main は本番ソースと実Three形状を、DOM・音・保存・WebGL rendererのテスト用代替で評価します。CPU図や三角形の接触検査は実ゲーム画面の代わりではありません。実画面・実音・実保存耐久性・ゲームパッド・自然さ・見つける楽しさは未検証です。

## 一次資料と不確かな範囲

- Bäumler, Gorb & Büsse (2023), [Extrinsic and intrinsic musculature of the raptorial forelegs in Mantodea](https://doi.org/10.1002/jmor.21590)。[Kiel大学公開PDF](https://macau.uni-kiel.de/servlets/MCRFileNodeServlet/macau_derivate_00005596/Journal%20of%20Morphology%20-%202023%20-%20B%C3%A4umler%20-%20Extrinsic%20and%20intrinsic%20musculature%20of%20the%20raptorial%20forelegs%20in%20Mantodea%20Insecta.pdf) Fig.2g/hの成虫雌雄を実見。飼育由来の解剖・写真であり、写真の蘭を野生の必須生息場所とは扱いません。
- O’Hanlon, Holwell & Herberstein (2014), [Pollinator Deception in the Orchid Mantis](https://doi.org/10.1086/673858)：マレー半島の森林での幼虫雌を使った実験。緑の植生の上で花から離しても誘引が成立しますが、成虫の野生食性全体や捕食率には一般化しません。
- O’Hanlon, Li & Norma-Rashid (2013), [Coloration and morphology](https://doi.org/10.1665/034.022.0106)：[著者所属機関の要旨](https://researchers.mq.edu.au/en/publications/coloration-and-morphology-of-the-orchid-mantis-ihymenopus-coronat/)を参照。全文図版まで確認したとはしていません。

全分布域、日周、野生での好適な葉の高さ、成虫の餌構成、自然の体長分布は今回断定しません。特定の蘭だけに住む・必ず花で待つ、というルールもありません。資料写真は配信せず、模写トレースやテクスチャ化は行っていません。
