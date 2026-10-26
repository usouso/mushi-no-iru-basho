# 8種・3区画・保存互換の配信物回帰

Node.js 24.22.1で検証。repoのrootで:

```sh
node --test tests/*.test.mjs
```

`npm install`、package.json、private git履歴、外部ネットワークは不要。テスト用公開APIはメモリ上のソースへだけ追加し、配信ファイルは変更しません。ゲームはtestsを読み込みません。

J／Esc／右保持と見回し案内、3区画切替、8種の捕獲→観察→放虫、果実を置く／片付ける／期限終了、遮蔽adapter、図鑑と任意メモ、同一配信tokenを確認します。

保存は `mushi-journal-v2` 専用です。認識できるv1データは一方向移行し、旧キーを更新・削除しません。未知・破損データや他タブの編集を上書きしない、成功markerを同じ書込みに含める、Web Locks非対応／失敗時にmemory-onlyになることをMapで検査します。`tests/fixtures/journal-locks.mjs` は非同期exclusive callbackを再現する明示mockであり、実ブラウザの排他保証を検査したものではありません。保存通知がtextarea／caretを作り直さないことも確認します。

実Three.jsの座標・行列に対し、DOM、Canvas塗り、音、pointer lock、WebGL renderer、ゲームパッド、storage／Web Locksは代用品です。標的近くにカメラを設定するケースを含みます。**実画面・実音・実機FPS・実パッド・ブラウザ保存・自然さ・発見性の合格ではありません。**

オオコノハムシ雌は葉上で静止・揺れ・歩行する新種です。leaf-mainは同梱hercules-mainの既存ハーネスとjournal-locks fixtureを再利用し、テストだけを追加します。旧6種clientが新7種図鑑rawを上書きしないこともMapで確認します。モデル接地と旧6種形状不変の全CPU検査は別の制作工程で実施しており、この配信形の検査だけで全形状を検証したとはしません。

水面のアメンボを1個体追加。岸から下を向いた捕獲、水面への返却、漕ぎの波紋がpause中に進まないこと、旧7種clientが8種rawを上書きしないことを検査します。長い脚の観察像は新種だけ縦長窓へ縮尺追随します。CPU投影の検査は実画面の見やすさを保証しません。

brief1指定13音を同梱します。後日の実機手順はrootの `PLAYTEST-JA.md` と `AUDIO-PLAYTEST-JA.md`。実ユーザーストレージを消す／壊す／書き換える検査は不要です。

`integrated-audio-main.test.mjs` は実mainと実audioにmock fetch／decode／BufferSourceを接続し、区画別BGM、音量0・休止・非表示・BFcache復帰、捕獲音から放虫までを確認します。fixture内だけaudio moduleのimport.meta.urlを架空のsame-origin URLへ置き換え、本番ファイルは変更しません。13音の実OGGデコード・実聴は未検査です。asset-only fixtureの旧版queryはURL伝播用の固定値で、実配信tokenは別検査です。
