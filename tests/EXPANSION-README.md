# 6種・2区画・保存互換の配信物回帰

Node.js 24.22.1で検証。repoのrootで:

```sh
node --test tests/*.test.mjs
```

`npm install`、package.json、private git履歴、外部ネットワークは不要。テスト用公開APIはメモリ上のソースへだけ追加し、配信ファイルは変更しません。ゲームはtestsを読み込みません。

J／Esc／右保持と見回し案内、2区画切替、6種の捕獲→観察→放虫、果実を置く／片付ける／期限終了、遮蔽adapter、図鑑と任意メモ、同一配信tokenを確認します。

保存は `mushi-journal-v2` 専用です。認識できるv1データは一方向移行し、旧キーを更新・削除しません。未知・破損データや他タブの編集を上書きしない、成功markerを同じ書込みに含める、Web Locks非対応／失敗時にmemory-onlyになることをMapで検査します。`tests/fixtures/journal-locks.mjs` は非同期exclusive callbackを再現する明示mockであり、実ブラウザの排他保証を検査したものではありません。保存通知がtextarea／caretを作り直さないことも確認します。

実Three.jsの座標・行列に対し、DOM、Canvas塗り、音、pointer lock、WebGL renderer、ゲームパッド、storage／Web Locksは代用品です。標的近くにカメラを設定するケースを含みます。**実画面・実音・実機FPS・実パッド・ブラウザ保存・自然さ・発見性の合格ではありません。**

音試聴brief1は本候補に含めません。後日の実機手順はrootの `PLAYTEST-JA.md`。実ユーザーストレージを消す／壊す／書き換える検査は不要です。
