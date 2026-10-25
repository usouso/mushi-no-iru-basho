# Issue #1 の回帰テスト

対象: https://github.com/usouso/mushi-no-iru-basho/issues/1

Node.js 24（検査環境: 24.22.1）の標準機能のみを使用します。npm install、外部依存、ビルド、認証は不要です。リポジトリのルートで実行してください。

```sh
node --test tests/issue-1-*.test.mjs
```

- `issue-1-journal-shortcut.test.mjs`: 実際の図鑑UIが閉じるボタンへフォーカスした直後のJ、メモ入力、IME・修飾キー、繰返し、Esc、View、移動入力。
- `issue-1-journal-main.test.mjs`: 実際のmainと各モジュールを使う図鑑開閉・フォーカス・メモ・移動の結合検査。
- `issue-1-controls-hint.test.mjs`: ロック中／解除中の共通操作ヒント、別の再開案内、左クリックの役割、宣言上の配置。

テスト用のDOM／音声／描画代用品を使用します。結合検査はメモリ上のmainに観測用exportを追加しますが、配信ソースや実行中のゲームには追加しません。ゲームからこのtestsフォルダを読み込む処理もありません。

**実ブラウザ、WebGL描画、物理ゲームパッド、初見の分かりやすさの合格を意味しません。** PRをClaudeがレビューし、ユーザーがマージを判断した後、公開版の実機確認はMuseが行う手順です。
