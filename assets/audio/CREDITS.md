# 試聴セット brief1 — 音素材クレジット

ローカル試聴用の未公開候補です。以下は提供元の申告と確認できた上流ライセンスを区別した記録であり、全ファイルの由来を独立に認証したものではありません。実聴による確認は未実施です。

## 網の効果音

`sfx_net_swing_01.ogg`、`sfx_net_swing_02.ogg`、`sfx_net_swing_03.ogg`

提供者は **SFX Kit by Wyzowl version 1.0.0** の次の素材を加工したと申告しています。公式 [README](https://github.com/wyzowl/sfx-kit/blob/92780e7ab0cdfb557497a988089c47f46e8c7412/README.md) とファイル一覧で版・3ファイル・[CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/) を確認しています。改変・再配布が認められ、クレジットは任意です。上流はコードによる合成音と説明しており、実録音ではありません。

| 使用音 | 申告された元ファイル（上流の `sounds/` 以下） |
| --- | --- |
| `sfx_net_swing_01.ogg` | [whooshes/whoosh-fast-medium.wav](https://github.com/wyzowl/sfx-kit/blob/92780e7ab0cdfb557497a988089c47f46e8c7412/sounds/whooshes/whoosh-fast-medium.wav) |
| `sfx_net_swing_02.ogg` | [whooshes/whoosh-medium-soft.wav](https://github.com/wyzowl/sfx-kit/blob/92780e7ab0cdfb557497a988089c47f46e8c7412/sounds/whooshes/whoosh-medium-soft.wav) |
| `sfx_net_swing_03.ogg` | [swishes-and-zips/swish-medium.wav](https://github.com/wyzowl/sfx-kit/blob/92780e7ab0cdfb557497a988089c47f46e8c7412/sounds/swishes-and-zips/swish-medium.wav) |

提供時の加工は、decode・モノラル化・先頭から約0.25／0.50／0.20秒の切り出し・低域cut・peak −10dB調整・両端fadeと申告されています。そのWAVから、追加の音量調整をせず Ogg Vorbis に変換しました。リンクのcommitは今回の照合時点であり、提供者の元取得commitは不明です。元ファイル対応は制作記録に基づく申告で、加工済み音の派生関係をbyteレベルで独立証明したものではありません。

## 捕獲音と温帯BGM

`sfx_capture_01.ogg`、`bgm_temperate_preview_01.ogg`

提供者は **FluidR3 GM SoundFont — Frank Wen**（Debian/Ubuntu `fluid-soundfont-gm 3.1-5.3`）を **FluidSynth 2.3.4** で演奏した生成音と申告しています。捕獲音はmarimbaの2音、BGMはpiano・nylon guitar・fluteで、本人制作の原譜を使い、他のSoundFontは使用していないとの申告です。実使用SF2や制作工程を独立に同定したものではありません。

[公式配布の同版copyright](https://metadata.ftp-master.debian.org/changelogs//main/f/fluid-soundfont/fluid-soundfont_3.1-5.3_copyright) と原著 [COPYING](https://sources.debian.org/src/fluid-soundfont/3.1-5.3/COPYING/) で、SoundFontの **MIT** ライセンスを確認しています。同梱の [FluidR3-MIT-LICENSE.txt](FluidR3-MIT-LICENSE.txt) は、著作権表示と許諾・免責全文を保持しています。SoundFont本体、Debian packaging、FluidSynth本体は同梱していません。演奏プログラムのライセンスと音源のライセンスは別です。

## 提供者によるオリジナル生成音（申告）

`insect_aburazemi_call_01.ogg`、`insect_grasshopper_takeoff_01.ogg`、`insect_grasshopper_takeoff_02.ogg`、`insect_grasshopper_landing_01.ogg`、`insect_grasshopper_landing_02.ogg`、`insect_beetle_walk_01.ogg`、`insect_beetle_walk_02.ogg`、`insect_beetle_walk_03.ogg`

提供者は自作の合成・生成音で権利上の制約なしと申告しています。セミ音も実録ではありません。この記載は提供者の申告であり、第三者資料による制作過程の検証や独自の CC0/MIT 再許諾ではありません。

## 収録していない音

アブラゼミ実録 `insect_aburazemi_call_02` と別案 `sfx_capture_02` は、この試聴候補の assets には含めていません。以前の別セットとも混在させていません。

## 確認範囲

具体的な元ファイル・使用版についての追加申告と公式配布条件を照合しました。これは無条件の権利保証や実聴品質の認定ではありません。訂正README入りZIPの作成・音は不変という説明は提供者申告であり、訂正版ZIPの受領・既存音とのbyte比較は未実施です。
