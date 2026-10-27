# 白チョウの散策タイミングと帰還表示 — 0.60.0

8匹の既存モンシロチョウだけ。新種・大きさ・場所・飛行軌道・捕獲距離・警戒ルール・音は増減しません。保存済みworldSeed/outingCounterから独立したbutterfly-ambient-v1 domainで秒数を導き、既存gen9/13 encounter/11 bestを変更・書換えしません。新キーなし。

```sh
node --test tests/butterfly-ambient*.test.mjs
node --test tests/goliath-individual-integration.test.mjs tests/goliath-individual-prior-chain.test.mjs tests/published-graph.test.mjs
```

最初のinsect-1は休止12〜14秒/offset0。他7匹は休止9〜13秒、offsetは0以上rest−2未満。全8匹で開始後最低2秒は同じ花、以後6秒の既存飛行を繰り返します。旧full-period候補では開始直後に経路を追う1frame11.16cmの移動が出たため、この初期範囲へ限定。既存位置式・旧保存なしfallbackの動作は変えません。秒数はゲーム調整で、自然頻度の再現ではありません。null散策は旧タイミング、成功した明示的な新散策だけプロフィールを変更し、移動・reloadは同じ設定/従来のclock再開方式です。

## 限定確認

pure helper/field 8条件：fullsafe counter、厳密8個体/旧home一致、prototype/accessor/duplicate拒否、2秒初期静止、旧fallback全論理状態と他種、捕獲/返却/保存、表示値の独立recurrence。旧model/field/mainの完全ソース逆変換を保持。

awareness4条件：走って近づくと予兆→連続した逃避、静歩行の捕獲、実opaque LOS越しに影響しない、近い空振り1個体だけ、.7秒後の照準修正で再捕獲。飛行中の個体に『止まった予兆が見える』とは主張しません。

帰還中の位置は変えず、5〜50mmの距離から表示専用butterflyWingBlendを導き、翅の式だけに渡します。旧logical flightBlend、alert、heading、rangeには戻しません。旧帰還27〜48mmでflightBlend.066〜.156だった箇所を補正。native3条件、8個体1249姿勢/4286568頂点、非翅skin exact。48足rayは既存花曲面に最大.698mm、従来2mm帯内。32代表姿勢で翅と花の三角形cross0。全草や透明textureとの連続collision証明ではありません。

旧genericは捕獲中もwingPhaseが進むため、field非表示中の全翅freezeは主張しません。位置・表示blendは保持、独立観察は従来通り。返却初tick同位置、次tick連続。main2条件では実Space/LOS空中捕獲→観察→放虫、同じ音owner、メモ・仲間・gen9raw保持、移動/reload/newouting、quota/readback不確定を確認。

CPU実mesh比較画像を制作者が確認しましたが、GPUの透明度/照明、実羽ばたき知覚、聴感、実ブラウザ保存、読みやすさや楽しさは未検証です。既存全種テストの反復ではなく今回に関係する条件だけを扱います。
