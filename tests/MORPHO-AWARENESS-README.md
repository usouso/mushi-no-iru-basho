# モルフォの警戒と果実台への再訪

Node.js 24.22.1、追加依存なし。対象検査:

```sh
node --test tests/morpho-*.test.mjs tests/fruit-*.test.mjs tests/capture-awareness.test.mjs tests/capture-core.test.mjs tests/insect-warning-pose.test.mjs
```

- 入口の最初の個体も、速く近づくと射程の外から翅を少し開く予兆を出し、その後は連続した飛行で離れます。停止/静歩行で反応が変わり、至近距離への侵入や近い可視の空振りには反応します。
- 既存の自然飛行・果実台への飛行・逃避飛行を、追跡や連打で何度も再開始しません。虫の大きさ・翅の模様・6脚の支持・網の射程・ID・保存形式は変更していません。
- 果実台へ着いた直後も警戒できます。残った着地の羽ばたきと翅の予兆を滑らかに混ぜ、立っている虫の胴や脚は動かしません。飛び立つと予約を解除し、同じ個体の40秒再訪抑制を保ちます。
- 果実なしでも静かに近づいて捕れます。捕獲→観察→図鑑→返却、果実からの離脱と再訪を扱い、新しい餌や虫・音は追加していません。

警戒距離3.2m/ダッシュ4.2m/静歩行0.9m、予兆最低0.18秒、各待機時間は**ゲーム調整値で、生態の測定値ではありません**。モルフォの果実食・色・地域の参照は既存の Florida Museum 資料です。

- https://www.floridamuseum.ufl.edu/exhibits/blog/blue-morpho-butterflies-in-exhibit/
- https://www.floridamuseum.ufl.edu/science/science-fair-winner-publishes-new-study-on-butterfly-foraging-behavior/

CPUの状態・模型頂点・模擬DOM/WebAudio/保存検査は、実WebGL・実音・実ブラウザ保存や「緊張感が増した」という人の評価を保証しません。試遊は、青/褐色の翅の予兆に気付き、寄り方を変えて再挑戦したくなるかを確認してください。
