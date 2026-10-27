# 0.64.0 オオミズアオ（雄） — 限定検査

夜の林縁の道沿いに、淡い4枚の翅・長い2本の尾・羽毛状の触角を持つ1匹を追加。枝で休む→翅を少し持ち上げて警戒→枝から離れる→短く飛ぶ→連続して戻る、という一巡です。39種・10区画・相撲16種。新種は固定・未計測・相撲対象外で、既存night6個体の番号／配置／時間、gen10の14個体記録／12種の最大記録は変更しません。

## 生態資料と表現範囲
- [TAKAO599MUSEUM](https://www.takao599museum.jp/treasures/selected/3054/?lang=ja)：淡い翅、雄の羽毛状触角と長い尾、成虫の口の退化。掲載写真の性別は明記されていないため、写真を雄と断定せず、記述された雄の形質を採用しました。
- [神奈川県立生命の星・地球博物館](https://nh.kanagawa-museum.jp/sizen/konchuuZukan/syousaijouhou.php?entryno=KPM-NKA011380&subno=AF)：Actias aliena、夜の灯火への飛来。
- [山形県立博物館研究報告38号](https://www.yamagata-museum.jp/wp-content/uploads/2025/03/%E7%A0%94%E7%A9%B6%E5%A0%B1%E5%91%8A%E7%AC%AC%EF%BC%93%EF%BC%98%E5%8F%B7.pdf) 紙面15頁：国内種の学名の整理。古い資料のActias artemisを無条件の同物異名として図鑑に混ぜません。

模型は自作、写真転載・テクスチャ化・輪郭トレースなし。14mesh/2828triangles、独立した前後4翅、後翅一体の尾、胸由来6脚、2触角。表示は頭と胴約.16m・開翅約.42m・尾を含む長さ約.32mで、実物mmの測定表示ではありません。場所、休止6/5秒、警戒.3秒、飛行6秒、反応距離は観察用のゲーム調整です。自然の秒数・特定枝への帰還を測定再現したモデルではありません。食餌・灯火トラップ・新音源・新区画は追加しません。

## 再実行
Node.js24、repo root:
```sh
node --test tests/moonmoth-*.test.mjs
node --test tests/journal-capacity.test.mjs tests/aggregate-main.test.mjs tests/hercules-horn-integration.test.mjs tests/xylotrupes-individual-integration.test.mjs tests/anax-integration.test.mjs tests/butterfly-ambient-integration.test.mjs tests/goliath-individual-prior-chain.test.mjs tests/published-graph.test.mjs
```

自己完結・外部依存なし。テストは本番から読み込みません。古い全test globの合格を主張する手順ではありません。旧38種のmetadata/メモ、16仲間、gen10保存を保持。図鑑の容量は既存の種数依存式によって153160→157184 charsへ変わり、式・キー・未知種保護を変更しません。旧readerは未知種を含む新記録を上書きしないこと、quota/他タブ競合時の既存raw保持を確認します。

模型／支持三角形・純粋状態／実field／factory adapter／実mainを分離。休止・飛行捕獲、警戒時の翅変化と脚固定、捕獲中の全時計停止、同姿勢返却、同じ音オブジェクト、区画切替の破棄を検査。mainの入力は実Space判定を使いますが、標的への合法な足元位置をテストで設定しており、初見で発見できた証拠ではありません。狭い画面を含む3画面比144観察姿勢は数値投影上で収まりました。

実WebGL・夜の見つけやすさ・翅の重なりの自然さ・実音・実ブラウザ保存/Web Locks・パッド・遊び心地は未検証です。CPU頂点・fakeDOM/音/storageは実機合格ではありません。既存README・13音源・ライセンス・CSSは不変。
