# ニジイロクワガタ：保存済み個体差

既存の1個体・同じ倒木を使い、保存に成功した次の散策から表示指数100〜115・3開始点・歩きの間合いを追加。大きさによる戦闘ボーナスはありません。実寸mm・自然での行動速度・出現確率の測定結果ではありません。

## 実行

既存Node24、repository直下。テストはゲームへ読み込みません。

```sh
node --test tests/rainbow-individual-*.test.mjs
node --test tests/orchid-mantis-data.test.mjs tests/orchid-mantis-integration.test.mjs tests/published-graph.test.mjs
```

全過去版の固定種数テストを一括合格とするものではありません。新逆変換は追加部分を厳密に戻し、旧ソースの全SHAを保ちます。ハナカマキリ保存テストは旧gen7 fixtureを明示して保持し、現在gen8の追加1件だけを別に検証します。

## 保持するもの

- 旧gen1〜7のID・draw・raw・最大記録。gen7は元の10件、gen8だけ11件／測定10種。store version2・キー・cap16384・仲間15種と1種1枠は不変更。
- Atlasの開始支持の計算domainはg5のまま。gen8でも両支持を生成し、保存済みの選択を使います。
- quota/CAS/locks不足/未来形式/不正値は保護。新散策は書込と正確な読戻し成功後にだけactive worldへ反映。書いた後に読めない場合は新rawの可能性を消さず、旧worldを維持して追加書込を止めます。
- 旧固定ニジイロの仲間は未計測のまま。新個体は同じruntime slotだけで旧個体扱いせず、保持済み個体はfieldに二重出現させません。前の散策の仲間を返しても、新散策の別個体は消しません。
- 足の高さとstrideを同じ倍率で合わせ、同じ物理laneに留めます。native形状・骨・色・共通歩行core・対戦ルール・音は変更しません。

## 限定した検査

保存5群、field/study7群、native3群、battle4群、actual-main3群と厳密main逆変換1群。別に既存36種保存4群と旧factory/main逆変換1群、配信graphを確認します。後からのartifact反復は別件として加算しません。

対戦は最大Rainbowの29 ordered pairsと混合自己対戦2構成、310代表姿勢で実接点・脚・床・場外・frustumを確認。15×15全組合せ全連続姿勢の保証ではありません。サイズ1000の15旧姿勢とルールを固定。Metalliferのtube脚は骨中心検査の対象外で、skin/支持/到達性は検査対象です。

actual-mainは旧固定→新散策→最大個体のquiet Space捕獲→観察回転→計測→明示置換→COM取消→区画移動→reload→返却・再捕獲まで。DOM・Map保存・WebGL描画・音・locksはテスト用代替、開始位置は合法な近傍へ配置しています。全フィールドを人が歩いた証拠ではありません。実画面・実音・端末保存の耐久性・gamepad・楽しさは未確認です。
