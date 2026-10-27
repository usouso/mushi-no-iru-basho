# 0.46.0 トンボの帰還中の翅だけを補正

既存6匹の通常巡回からの帰還表示だけを直します。32種・8区画・相撲14種、保存・音・捕獲条件・警戒のルールは変更しません。

## 再実行
Node24系、rootから。追加依存・git履歴は不要です。

```sh
node --test tests/dragonfly-landing-*.test.mjs tests/capture-awareness.test.mjs tests/published-graph.test.mjs
node --test --test-name-pattern='literal inverse|fixed Europe registration' tests/dragonfly-ambient.test.mjs tests/giant-waterbug-field.test.mjs tests/europe-stag-field.test.mjs
```

新規simulation6・native2・main3、旧awareness8・固定golden guards3、配信graph1の計23個の限定条件です。全旧suiteではありません。同じ検査の再実行や組合せ数を追加件数へ加算しません。

## 小さな変更
旧位置・heading・flightBlendを計算した後、通常帰還中のhome残差が5mmより大きいときだけ表示用dragonflyArrivingを立てます。別のdragonflyWingBlendで、5〜50mmのsmoothstepにより最大.65の翅動作下限へ滑らかに補間します。これは独自の表示値で、自然の測定値ではありません。

共有state/resting/flightBlendは一切書き換えません。共有flightBlendは胴のpitchにも使われるため、その値を増やすと脚の支持まで動いてしまうからです。rendererは新blendを翅角と翅の浅い前後傾きだけに使います。帰還中の『止まって警戒』の翅表現は抑えますが、警戒時計・逃走・捕獲を抑えません。捕獲中・観察は既存姿勢を使い、fieldの新値はfreeze。移動／再読込では旧時計と同じく初期化し、新たな保存値にはしません。

5mmは表示切替の暫定閾値であり、物理接触・画面での接地の保証ではありません。到着判定のために根をsnapさせたり葉・脚を動かしたりしません。

## 限定証拠
- simulation6条件：25,080paired tickで旧control全フィールドが一致。新しい2表示値だけは比較対象から明示的に分離。36個の途中捕獲／返却組合せ、12個の空振り／接近組合せ、dt境界と旧飛行・観察fallbackも確認。
- 旧awareness8条件と固定source guards3条件：追加markerの厳密な逆変換、元の固定hashを保持。公開ZIPにないgit履歴を使わず、基準版のimport queryだけを正規化します。
- native2条件：6タイミング群×6匹の36条件組合せ、252姿勢、35,280翅頂点。胴と6脚の行列が旧入力と完全一致。到着近辺108回×6脚確認で最大gap約1.149mm。翅と近傍不透明支持物の110,880 AABB対は全て非重複、最小隔たり約4.477mmだったため、実対象の詳細三角形判定は0回。辺交差関数自身は別の有限fixtureで検査しています。
- main3条件：帰還残差45.07mmで実Space/LOS捕獲、観察90frame freeze、同姿勢返却から最初の移動3.849mm。実空振りから11frame、通常歩行から15frameで既存の逃避へ進み、帰還表示が無敵や新しい待ち時間を作らないことを確認。pause／区画旅行／reloadでraw・設定・profileを保持。
- productiongraph1条件：160moduleと全内容token閉包。既存2moduleだけの意味差分で、他158moduleは元の内容を維持します。

## 未検証
実GPU・実音・実ブラウザの永続保存・gamepad・自然な羽ばたきや捕まえる楽しさは未確認です。DOM/WebGL/audio/Map代替と有限geometryを使う検査です。CPUの旧新比較図は支持物と翅だけの投影で、実ゲーム画像ではありません。全offset／全時刻の連続衝突、透明な葦のalphaと風の全域確認はしていません。044からの透明草の見え方の留保を解決済みとはしません。

README・既存13音・ライセンス・外部通信は変更しません。テストは本番から読み込みません。
