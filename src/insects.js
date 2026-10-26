import {createElephantStudy} from './elephant-study.js?v=0.27.0&b=572abb81497f';
import {ELEPHANT_DIMENSIONS as ELEPHANT} from './elephant-kinematics.js?v=0.27.0&b=572abb81497f';
import {createGiantStagStudy} from './giant-stag-study.js?v=0.27.0&b=572abb81497f';
import {GIANT_STAG_DIMENSIONS as GIANT_STAG} from './giant-stag-kinematics.js?v=0.27.0&b=572abb81497f';
import {createAtlasStudy,ATLAS_MOTION} from './atlas-study.js?v=0.27.0&b=572abb81497f';
import {ATLAS_DIMENSIONS as ATLAS} from './atlas-kinematics.js?v=0.27.0&b=572abb81497f';
import { individualScale } from './individual-layout.js?v=0.27.0&b=572abb81497f';
/** Pure, deterministic insect simulation. All coordinates are metres; y is absolute. */
import { CAPTURE_AWARENESS, NET_STARTLE, clearAwareness, advanceAwareness } from './capture-awareness.js?v=0.27.0&b=572abb81497f';
import { createLonghornStudy } from './longhorn-study.js?v=0.27.0&b=572abb81497f';
import { createJewelStudy } from './jewel-study.js?v=0.27.0&b=572abb81497f';
import { createSwallowtailStudy } from './swallowtail-study.js?v=0.27.0&b=572abb81497f';
import { createBeeStudy } from './bee-study.js?v=0.27.0&b=572abb81497f';
import { BEE_DIMENSIONS as BEE } from './bee-kinematics.js?v=0.27.0&b=572abb81497f';
import { createMetalliferStudy, METALLIFER_MOTION as METALLIFER } from './metallifer-study.js?v=0.27.0&b=572abb81497f';
import { createStagStudy } from './stag-study.js?v=0.27.0&b=572abb81497f';
import { STAG_DIMENSIONS as STAG } from './stag-kinematics.js?v=0.27.0&b=572abb81497f';
import { createRhinoStudy } from './rhino-study.js?v=0.27.0&b=572abb81497f';
import {createRhinoFlightStudy} from './rhino-flight-study.js?v=0.27.0&b=572abb81497f';
import { RHINO_DIMENSIONS as RHINO } from './rhino-kinematics.js?v=0.27.0&b=572abb81497f';
import { createLadybirdStudy } from './ladybird-study.js?v=0.27.0&b=572abb81497f';
import { LADYBIRD_DIMENSIONS as LADYBIRD } from './ladybird-kinematics.js?v=0.27.0&b=572abb81497f';
import { createMantisStudy } from './mantis-study.js?v=0.27.0&b=572abb81497f';
import { MANTIS_DIMENSIONS as MANTIS } from './mantis-kinematics.js?v=0.27.0&b=572abb81497f';
import { createDivingStudy } from './diving-study.js?v=0.27.0&b=572abb81497f';
import { createDungContactStudy } from './dung-contact-study.js?v=0.27.0&b=572abb81497f';
import { DUNG_DIMENSIONS as DUNG } from './dung-kinematics.js?v=0.27.0&b=572abb81497f';
export const SPECIES = Object.freeze({
  butterfly: { name: 'モンシロチョウ', label: 'モンシロチョウ', size: '初期試作の野外表示サイズ：開いた翅が約32cm（実際の虫の実寸ではありません）', observation: '白い翅の先に黒い模様。花のまわりをゆっくり飛び、蜜を吸うときは同じ場所にとまります。翅の開き方にも注目してみましょう。', hint: '草花の上でひと休み。ゆっくり近づくと観察できます。', color: '#f5efd5' },
  dragonfly: { name: 'アキアカネ', label: 'アキアカネ', size: '初期試作の野外表示サイズ：開いた翅が約40cm（実際の虫の実寸ではありません）', observation: '赤みのある細長い腹と、透きとおる四枚の翅。枝先などにとまると翅を横に開きます。飛び立ったあと、近くのとまり場所に戻ることもあります。', hint: '池のほとりの草先を探して。とまった瞬間がねらい目です。', color: '#b95136' },
  cicada: { name: 'アブラゼミ', label: 'アブラゼミ', size: '初期試作の野外表示サイズ：頭・触角から翅先まで約22.9cm（実際の虫の実寸ではありません）', observation: '茶色の翅を屋根のように重ねて、木の幹にとまっています。木肌に似た色なので、輪郭や大きな目を手がかりに探してみましょう。', hint: '大きな木の幹に注目。足音をひそめると逃げにくくなります。', color: '#8b6244' },
  morpho: { name: 'ペレイデスモルフォ', label: 'モルフォ', scientificName: 'Morpho helenor peleides', size: '自然の開張の紹介目安は約13〜20cm。試作の野外表示は約48cm（実寸ではありません）', observation: '中南米の熱帯の森林や川沿いに見られるチョウ。成虫は熟して傷んだ果実の汁を吸います。青い翅の表と、眼状紋のある褐色の裏を見比べてみましょう。青色は翅の微細な構造と光の作用によるものです。', hint: '林縁や小川沿いの明るい場所を探して。止まると翅を立て、茶色の裏が見えます。', color: '#377fc0' },
  grasshopper: { name: 'ショウリョウバッタ', label: 'ショウリョウバッタ', scientificName: 'Acrida cinerea', size: '自然の体長の紹介目安は雄約3.5cm、雌約8〜9cm。試作の胴と頭の表示長は約26cm（脚・触角を除き、実寸ではありません）', observation: 'イネ科の草が生える草原にすみ、植物の葉を食べます。細長い体、先の細い頭、長い後ろ脚が特徴です。跳んだ先を見つけて、止まった姿をそっと観察してみましょう。', hint: '草の足元を探して。跳んだ先を目で追い、止まったところへそっと近づこう。', color: '#81975a' },
  hercules: { name: 'ヘラクレスオオカブト（中米型）', label: 'ヘラクレスオオカブト', scientificName: 'Dynastes hercules septentrionalis（UF/IFASの分類表記）', size: 'ヘラクレスオオカブトの紹介では、雄の角を含む全長が17cm以上に達する個体もいます。試作表示は角込み全長約42cm、角を除く胴と頭は約22cm（実寸ではありません）', observation: '雄には頭と胸に長い角があり、雌には角がありません。成虫は腐熟した果実を食べ、薄明や夜間に飛びます。この試作では低い倒木で日中の休止や歩行を観察でき、モルフォ用の果実台には移動せず、倒木上の果実のそばへ歩いて休む見本を観察できます。食べる口の動きは再現していません。中米型を題材とし、種・亜種の分類には資料による扱いの違いがあります。', hint: '低い倒木の上を探して。止まった姿と、ゆっくり動く脚を観察してみよう。', color: '#8d8b4d' },
  leafinsect: { name: 'オオコノハムシ（雌）', label: 'オオコノハムシ', scientificName: 'Pulchriphyllium giganteum（旧名 Phyllium giganteum）', size: '自然の体長の紹介目安は約11cm。試作の胴と頭の表示長は約30cm（脚・触角を除き、実寸ではありません）', observation: '葉のように広がった体や脚、葉脈に似た模様をもつ虫です。この題材の成虫雌は飛ばず、ゆっくり揺れながら歩きます。低い枝は観察用の再現区画の配置で、自然の代表的な生息高度を示すものではありません。', hint: '葉の輪郭を見比べて。小さな揺れと足運びに気づいたら、そっと近づこう。', color: '#8caa50' },
  waterstrider: { name: 'アメンボ', label: 'アメンボ', scientificName: 'Aquarius paludum', size: '自然の体長の紹介目安は11〜16mm。試作の胴と頭は約10cm、脚を広げた幅は約34cm（表示補正であり、実寸ではありません）', observation: '池などの水面にすむ虫です。中脚を漕いで進み、そのあと水面を滑ります。この試作では池の小さな区画で休止と短い滑走を観察でき、飛翔や跳躍は扱いません。脚の小さな波紋は動きを見つける手掛かりで、流体の精密な再現ではありません。', hint: '岸で水面を見下ろして。細い脚と、ひと漕ぎのあとの滑りを探してみよう。', color: '#514935' },
  leafcutterant: { name: 'ハキリアリ', label: 'ハキリアリ', scientificName: 'Atta cephalotes（採餌する働きアリ）', size: '働きアリには大きさの違いがあり、この運搬個体の自然体長は一点値に固定していません。試作表示は胴と頭が約10cm、運ぶ葉片が約14×9cm（実寸ではありません）', observation: '大顎で葉片を運ぶ働きアリです。持ち帰る葉は、巣内で餌となる菌を育てるために使われます。この試作は、葉を運ぶ姿と空荷の姿で地面を歩く様子を観察する見本です。採葉・受渡し・巣内の作業は再現していません。', hint: '地面を進む小さな葉片を追って。葉の下の大顎と6本の脚を見つけてみよう。', color: '#8d4e2f' },
  firefly: { name: 'ヘイケボタル（雄）', label: 'ヘイケボタル', scientificName: 'Aquatica lateralis（旧属名 Luciola lateralis）', size: '自然の雄成虫の体長の紹介目安は約9mm。試作の胴と頭の表示長は約10cm（脚・触角を除き、実寸ではありません）', observation: '水辺近くの草むらで見られる小さな甲虫です。黒い上翅と、淡い赤色の前胸にある中央の黒い帯が特徴です。雄の腹端側の腹面には2区画の発光器があります。この試作の弱い一定光は器官を示す仮表示で、自然の発光波形や点滅周期を再現していません。', hint: '草葉の上で休む姿を探して。短く飛んだ先を追い、そっと近づいてみよう。', color: '#b6c98a' },
  dungbeetle: { name: 'フンコロガシ', label: 'フンコロガシ', scientificName: 'Kheper lamarcki（Scarabaeus (Kheper) lamarcki とも表記）', size: '研究の実験条件では直径約3cmの球と体長が概ね同程度でした。種全体の寸法範囲ではありません。試作の胴と頭・球の直径はそれぞれ約16cm（表示補正であり、実寸ではありません）', observation: '南部アフリカで研究されている昼行性の球転がし種です。前脚で地面を押し、中脚と後脚で球を支えながら後ろ向きに進みます。この試作は平坦な短い直線を進んで休む動作見本で、球作り・埋球・方向選びは再現していません。捕獲中の球の停止はゲーム上の処理です。', hint: '地面を転がる球を探して。球の向こうの甲虫と、地面や球に掛ける脚を見てみよう。', color: '#574936' },
  divingbeetle: { name: 'ゲンゴロウ（雌）', label: 'ゲンゴロウ', scientificName: 'Cybister chinensis', size: '自然の体長の紹介目安は34〜42mm。試作の胴と頭の表示長は約14cm（脚・触角を除く表示補正であり、実寸ではありません）', observation: '池などで暮らす水生の甲虫です。腹端を水面に出して呼吸し、オール状の後脚を左右そろえて漕ぎます。この試作は雌の姿を題材とした浅い水中の動作見本で、潜水の秒数や楕円の経路は自然の行動を測定したものではありません。飛翔や捕食は再現していません。', hint: '池の浅い場所を、岸からそっと見下ろして。水面の呼吸姿勢と、水中で漕ぐ後脚を探してみよう。', color: '#51513a' },
  mantis: { name: 'オオカマキリ（雄）', label: 'オオカマキリ', scientificName: 'Tenodera sinensis', size: '自然の雄の体長は、およそ7〜9cmほどの資料例があります。全地域の最小最大値ではありません。試作の胴と頭の表示長は約26cm（脚・触角を除く表示補正であり、実寸ではありません）', observation: '草や枝で昆虫を待ち伏せするカマキリです。三角形の頭と細長い胸をもち、前脚は昆虫をつかまえるための脚です。この試作は飛ぶことのできる緑色の成虫雄を題材に、4本の歩脚で休む姿と、翅を開いて隣の葉へ短く飛ぶ見本を表現しています。休止の秒数や飛行経路はゲーム上の調整で、捕食や攻撃は再現していません。', hint: '草葉の緑にまぎれた三角形の頭を探して。静かに近づき、畳んだ前脚と4本の歩脚を見てみよう。', color: '#8d9e54' },
  ladybird: { name: 'ナナホシテントウ', label: 'ナナホシテントウ', scientificName: 'Coccinella septempunctata', size: '自然の体長の紹介目安は5〜8.6mm。試作の胴と頭の表示長は約8cm（脚・触角を除く表示補正であり、実寸ではありません）', observation: '赤い上翅に黒い斑点をもつテントウムシです。6本の脚と4枚の翅があり、成虫も幼虫もアブラムシを食べます。この試作は葉の上で短く歩き、上翅と後翅を広げて隣の葉へ飛ぶ動作見本です。着地後は上翅を閉じてから後翅を収納する順序を簡略化して示し、精密な折畳みや殻の外に長く残る後翅の引込み、捕食は再現していません。秒数や距離はゲーム上の調整です。', hint: '草葉の上の赤い丸い姿を探して。6本の脚と、上翅の下に収まる後翅を見てみよう。', color: '#bd4035' },
  rhino: { name: 'カブトムシ（雄）', label: 'カブトムシ', scientificName: 'Trypoxylus dichotomus', size: '自然の体長の紹介目安は30〜55mm（角を除く種の資料値で、雄だけの最小最大値ではありません）。試作表示は胴と頭が約18cm、角込みの前後長が約30cm（実寸ではありません）', observation: '成虫はクヌギなどの樹液に集まる甲虫です。雄は頭と胸に角をもち、長い頭角の先は四叉、短い胸角の先は二叉になります。この試作では夜の低い太枝を歩き、近づき続けると角を構えてから上翅を開き、後翅で短く飛び立ちます。6本の脚と2枚ずつの上翅・後翅を見てみましょう。翅の折り畳みは簡略化した模型です。反応距離・飛行経路・同じ枝への帰還はゲーム上の調整で、摂食動作は再現していません。', hint: '夜の木の低い太枝を探して。角の分かれ方と、枝をつかむ6本の脚を見てみよう。', color: '#593c2d' },
  stag: { name: 'ノコギリクワガタ（雄）', label: 'ノコギリクワガタ', scientificName: 'Prosopocoilus inclinatus', size: '大きさや大顎の形には個体差があります。試作表示は大顎を除く胴と頭が約18cm、大顎を含む前後長が約30cm（実寸ではありません）', observation: '主に夜に活動し、木の樹液に集まるクワガタです。この試作は湾曲した左右の大顎をもつ大型の雄を題材にしています。大顎は角ではなく口器で、内側に鋸状の歯があります。模型の歯の数は自然の歯数を確定したものではありません。低い太枝は観察用の配置です。短い歩行と、接近すると大顎を控えめに開いて後ずさる動きはゲーム上の表現で、精密な威嚇や逃避の再現ではありません。飛行・摂食・戦闘は扱いません。', hint: '夜の木の枝分かれを見て。左右に湾曲する大顎と、その内側の歯を探してみよう。', color: '#74482e' },
  longhorn: { name: 'ゴマダラカミキリ（雌を参考にした姿）', label: 'ゴマダラカミキリ', scientificName: 'Anoplophora malasiaca（参照資料の表記）', size: '自然の成虫体長は24〜35mmまたは25〜35mmという機関資料があります（測定端点は未確認）。試作表示は胴と頭が約16cm、左右の触角は各約19cmの折線長（別々の表示補正であり、実寸ではありません）', observation: '黒い体に白い毛の斑紋があり、節の目立つ長い触角をもつカミキリムシです。成虫は緑枝の樹皮や葉を食べ、幼虫は樹皮の内側から材部を食べます。学名は参照した機関資料の表記で、分類上の扱いの違いはこの試作では確定していません。低い太幹の一面で6脚を添えて休み、短く前進・後退する観察見本です。太い古い樹皮での摂食、幹一周の登木、飛行・産卵は再現せず、姿勢や歩行速度はゲーム上の調整です。', hint: '昼の木の幹を横から見て。白い斑紋と長い触角、樹皮に添う6本の脚を探してみよう。', color: '#343c40' },
  jewel: { name: 'ヤマトタマムシ', label: 'ヤマトタマムシ', scientificName: 'Chrysochroa fulgidissima', size: '自然の体長の紹介目安は3〜4cm（測定端点・雌雄別の範囲は未確認）。試作表示は胴と頭が約16cm、胴幅約5cm（脚・触角を除く表示補正であり、実寸ではありません）', observation: '緑色の光沢と赤紫の縦縞をもつ、細長い甲虫です。成虫は日中に活動して生きた葉を食べ、幼虫は木材を食べます。光沢は光や見る角度で変わる構造色で、発光ではありません。この試作は6本の脚で低い生葉の上を短く前進・後退し、閉じた上翅と収納した後翅を観察する見本です。低い葉は観察用の配置で、自然の代表的な生息高度ではありません。飛行・摂食は再現せず、速度や接近反応はゲーム上の調整です。', hint: '昼の生木の低い葉を探して。細長い体の光沢と、葉につく6本の脚を見てみよう。', color: '#638d59' },
  swallowtail: { name: 'ナミアゲハ（夏型の雄）', label: 'ナミアゲハ', scientificName: 'Papilio xuthus', size: '自然の前翅長の紹介目安は35〜60mm（翅の付け根から先端までで、開張ではありません）。試作表示は開張約40cm、胴と頭が約10cm（別々の表示補正であり、実寸ではありません）', observation: '黒とクリーム色の模様をもつチョウで、4枚の翅のうち後翅には尾状突起があります。この夏型雄の翅の表では、尾の近くに橙赤色の斑点を付けていません。地面で吸水する観察例がありますが、この種の野外の吸水は研究ではまれとされています。試作は湿った地面で休み、近くへ短く飛ぶ見本です。口器の接地や吸水は再現せず、休止時間・飛行経路はゲーム上の調整です。', hint: '池岸の湿った地面を探して。立てた翅の輪郭と、後翅の尾をそっと観察しよう。', color: '#e6d794' },
  bee: { name: 'ニホンミツバチ（働き蜂）', label: 'ニホンミツバチ', scientificName: 'Apis cerana japonica', size: '自然の働き蜂の体長は10〜13mmという紹介がありますが、測定端点は未確認です。試作の胴と頭の表示長は約12cm（脚・触角を除く表示補正であり、実寸ではありません）', observation: '花を訪れるミツバチの働き蜂です。6本の脚と4枚の翅があり、飛ぶときは同じ側の前翅と後翅が連動します。後脚には花粉を運ぶ花粉籠があります。この試作は花の上で休み、隣の花へ短く飛ぶ動作見本です。口器による吸蜜接触や精密な翅の結合機構は再現していません。巣・攻撃・刺傷は扱わず、羽ばたきや接近への反応はゲーム上の調整です。', hint: '花の上で休む小さな姿を探して。4枚の翅と、後脚の花粉籠を見てみよう。', color: '#a88849' },
  atlas: { name: 'アトラスオオカブト（雄）', label: 'アトラスオオカブト', scientificName: 'Chalcosoma atlas', size: '基準模型は胴と頭が約20cm、角を含む前後長が約38cm。見分けるための表示補正であり、実物の寸法ではありません。この種は初回の固定個体で、大きさの計測は未対応です。', observation: '東南アジアの熱帯雨林にすむカブトムシです。雄の頭の角1本と、胸の角2本を見比べてみましょう。成虫は熟して傷んだ果実や樹液を利用し、主に夜から夕方に活動すると紹介されています。この明るい区画と低い枝は観察用の配置です。角を構えて後退する距離・速さはゲーム上の近似で、人への野生の反応を測定した再現ではありません。飛行と摂食は扱いません。', hint: '東南アジア林の入口、右側の明るい太枝。三本の角を探し、急いで近づくと後退するので横からそっと。', color: '#66563c' },
  metallifer: { name: 'メタリフェルホソアカクワガタ（雄）', label: 'メタリフェルホソアカクワガタ', scientificName: 'Cyclommatus metallifer', size: '試作の表示寸法は胴と頭が約16cm、大顎を含む前後長が約36.7cm（脚を含む外形は約38.6cm）。見分けるための表示補正であり、実物の寸法ではありません。', observation: 'インドネシア原産のクワガタです。雄の長い大顎と、内側の大きな歯を見比べてみましょう。低い枝は観察用の配置です。この試作の短い前進・後退と顎の反応はゲーム上の表現で、野外の活動時刻・食性・逃避を確定した再現ではありません。飛行と摂食は扱いません。', hint: '東南アジア林の入口近く、低い太枝を見て。金褐色の体と、長く伸びた左右の大顎を探してみよう。', color: '#98784b' },
  giantstag: { name: 'オオクワガタ（雄）', label: 'オオクワガタ', scientificName: 'Dorcus hopei binodulosus（参照標本の表記）', size: '雄の資料例は大顎先端から上翅末端まで27〜76.1mm。すべての個体の最小最大値ではありません。模型は胴と頭約18.5cm、大顎込み約29cmの表示補正で、実寸ではありません。大きさ指数は同種のゲーム内比較です。以前の未計測個体の値は作り直しません。', observation: '黒い幅広の頭と、内側に大きな歯がある太い大顎をもつクワガタです。昼は樹洞などに隠れ、夜に広葉樹の樹液を利用します。大顎の長さや形は個体により異なります。この試作は低い樹皮際を短く歩き、近づくと顎を構えて隙間側へ退く観察用の表現です。人への反応距離・速さはゲーム調整で、飛行・摂食は再現していません。', hint: '夜の樹液の木、左の低い樹皮際を見て。隙間へ退いたら横へ回るか、少し離れて待ち、静かに近づこう。', color: '#303b3a' },
  elephant: { name: 'ゾウカブト（雄）', label: 'ゾウカブト', scientificName: 'Megasoma elephas', size: '資料の雄79標本では角込み53〜137mm、角を除く体長41〜90mm。細かな測定端点は未確認で、すべての個体の範囲ではありません。模型は胴頭約23cm、体軸方向の角込み約35cmという表示補正で、実寸ではありません。今回は固定の未計測個体です。', observation: '中南米の熱帯林にすむ、幅広く丸い体のカブトムシです。雄の前へ伸びて先が上を向く頭角と、左右の短い胸角を見比べてみましょう。短い毛に覆われた体表を、試作では色むらと鈍い反射で近似しています。成虫が生木の枝で樹液を利用する観察記録があり、腐朽木で育つ幼虫とは暮らしが異なります。低い傾斜枝の登降と接近への反応は観察用のゲーム表現で、飛行・摂食は再現していません。', hint: '中米熱帯林の入口から左へ。果実のある倒木のさらに西、低い斜めの枝で丸い体を探そう。', color: '#88704b' }
});

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const homes = [
  ['butterfly', 0, 5, 1.15], ['butterfly', -4.8, 5.6, 1.15], ['butterfly', 5, -3, 1.3],
  ['butterfly', -17, -1, 1.25], ['butterfly', 12, -13, 1.2], ['butterfly', -26, -21, 1.15],
  ['butterfly', 10.5, -.2, 1.25],
  ['dragonfly', 18, -14, 1.4], ['dragonfly', 19, -24, 1.25], ['dragonfly', 29, -13, 1.35],
  ['dragonfly', 31, -24, 1.2], ['dragonfly', 22, -29, 1.3], ['dragonfly', 10, -19, 1.2],
  ['cicada', -9.42, -7.82, 1.65], ['cicada', -10.45, -7.67, 2.05],
  ['cicada', -10.17, -8.57, 1.4], ['cicada', -9.75, -7.48, 2.7],
  ['butterfly', -6.8, 8.4, 1.2]
];

export function createInsects(heightAt = () => 0, { homes: habitatHomes = homes, extraHomes = [], individuals = [], grasshopperSupports = [], herculesSupports = [], leafSupports = [], striderSupports = [], antSupports = [], fireflySupports = [], dungSupports = [], divingSupports = [], mantisSupports = [], ladybirdSupports = [], rhinoSupports = [], stagSupports = [], metalliferSupports = [], atlasSupports = [], giantStagSupports = [], elephantSupports = [], beeSupports = [], swallowtailSupports = [], jewelSupports = [], longhornSupports = [], logFruitStation = null, bounds = 75, hasLineOfSight = () => true } = {}) {
  // Optional geometry adapter: the pure simulation never reads renderer meshes.
  if (typeof hasLineOfSight !== 'function') throw new TypeError('Invalid line-of-sight adapter');
  const validHomes = rows => Array.isArray(rows) && rows.every(row => Array.isArray(row) && typeof row[0] === 'string' && Object.prototype.hasOwnProperty.call(SPECIES,row[0]) && row.length === 4 && [row[1],row[2],row[3]].every(Number.isFinite));
  if (!validHomes(habitatHomes) || !habitatHomes.length || !validHomes(extraHomes)) throw new TypeError('Invalid habitat homes');
  const initialHomes = [...habitatHomes,...extraHomes].map(row=>[...row]);
  const profiles=new Map();
  if(!Array.isArray(individuals)||individuals.length>6)throw new TypeError('Invalid individual profiles');
  for(const e of individuals){
    const index=Number(e?.runtimeSlotId?.replace('insect-',''))-1;
    if(!e||!/^insect-[1-9]\d{0,5}$/.test(e.runtimeSlotId)||!['hercules','rhino','stag','metallifer','giantstag'].includes(e.species)||initialHomes[index]?.[0]!==e.species||profiles.has(e.runtimeSlotId)||!Number.isInteger(e.sizePermille)||e.sizePermille<1000||e.sizePermille>1150||!Number.isInteger(e.motionSeed)||e.motionSeed<0||e.motionSeed>0xffffffff||e.measureVersion!==1||typeof e.encounterId!=='string'||!(e.species==='giantstag'?e.runtimeSlotId==='insect-6'&&/^g2-[0-9a-f]{8}-o[1-9][0-9]{0,15}-night-giantstag$/.test(e.encounterId):/^g1-[0-9a-f]{8}-o[1-9][0-9]{0,15}-(tropical|night|understory)-(hercules-a|hercules-b|rhino|stag|metallifer)$/.test(e.encounterId)))throw new TypeError('Individual profile does not match home');
    profiles.set(e.runtimeSlotId,{...e});
  }
  const flightBounds = Number.isFinite(bounds) && bounds > 6 ? Math.min(75, bounds) : 75;
  const hopperSupports = new Map(), hoppers = new Map();
  try {
    if (!Array.isArray(grasshopperSupports)) throw new Error();
    const point = value => {
      if (!value || ![Object.prototype,null].includes(Object.getPrototypeOf(value)) || !['x','y','z'].every(key=>Object.prototype.hasOwnProperty.call(value,key) && 'value' in Object.getOwnPropertyDescriptor(value,key) && Number.isFinite(value[key]))) throw new Error();
      const {x,y,z}=value,ground=heightAt(x,z);
      if (Math.abs(x)>flightBounds || Math.abs(z)>flightBounds || !Number.isFinite(ground) || y<ground || y>ground+.3) throw new Error();
      return {x,y,z};
    };
    const groups=grasshopperSupports.map(group=>{
      if (!group || !Array.isArray(group.points) || group.points.length!==3) throw new Error();
      const home=point(group.home),points=group.points.map(point);
      if (Math.hypot(home.x-points[0].x,home.y-points[0].y,home.z-points[0].z)>1e-6) throw new Error();
      for(let a=0;a<3;a++)for(let b=a+1;b<3;b++){const distance=Math.hypot(points[a].x-points[b].x,points[a].z-points[b].z);if(distance<.3 || distance>2.7+1e-6)throw new Error();}
      return {home,points};
    });
    const used=new Set();
    initialHomes.forEach(([species,x,z,altitude],index)=>{
      if(species!=='grasshopper')return;
      const y=heightAt(x,z)+altitude,matches=groups.map((group,i)=>({group,i})).filter(({group})=>Math.hypot(group.home.x-x,group.home.y-y,group.home.z-z)<=1e-6);
      if(matches.length!==1 || used.has(matches[0].i))throw new Error();
      used.add(matches[0].i);hopperSupports.set(index,matches[0].group.points);
    });
    if(used.size!==groups.length)throw new Error();
  } catch { throw new TypeError('Invalid grasshopper supports'); }
  const beetleSupports=new Map(),beetles=new Map();
  try {
    if(!Array.isArray(herculesSupports))throw new Error();
    const point=value=>{
      if(!value || ![Object.prototype,null].includes(Object.getPrototypeOf(value)) || !['x','y','z'].every(key=>Object.prototype.hasOwnProperty.call(value,key) && 'value' in Object.getOwnPropertyDescriptor(value,key) && Number.isFinite(value[key])))throw new Error();
      const {x,y,z}=value,ground=heightAt(x,z);if(Math.abs(x)>flightBounds || Math.abs(z)>flightBounds || !Number.isFinite(ground) || y<ground || y>ground+3)throw new Error();return{x,y,z};
    };
    const groups=herculesSupports.map(group=>{
      if(!group || !Array.isArray(group.axis) || group.axis.length!==2)throw new Error();
      const home=point(group.home),axis=group.axis.map(point),dx=axis[1].x-axis[0].x,dz=axis[1].z-axis[0].z,length=Math.hypot(dx,dz);
      if(length<.4 || length>2 || Math.abs(axis[0].y-axis[1].y)>1e-6 || Math.abs(home.y-axis[0].y)>1e-6)throw new Error();
      const ux=dx/length,uz=dz/length,s=(home.x-axis[0].x)*ux+(home.z-axis[0].z)*uz;
      if(s<0 || s>length || Math.hypot(home.x-axis[0].x-ux*s,home.z-axis[0].z-uz*s)>1e-6)throw new Error();
      return{home,axis,length,ux,uz,homeS:s};
    });
    const used=new Set();initialHomes.forEach(([species,x,z,altitude],index)=>{
      if(species!=='hercules')return;const y=heightAt(x,z)+altitude,matches=groups.map((group,i)=>({group,i})).filter(({group})=>Math.hypot(group.home.x-x,group.home.y-y,group.home.z-z)<=1e-6);
      if(matches.length!==1 || used.has(matches[0].i))throw new Error();used.add(matches[0].i);beetleSupports.set(index,matches[0].group);
    });if(used.size!==groups.length)throw new Error();
  } catch { throw new TypeError('Invalid hercules supports'); }
  const leafGroups=new Map(),leaves=new Map();
  try {
    // This new contract accepts only explicit plain data, never inherited or
    // accessor coordinates. Copy all supports so callers cannot move a perch.
    const record=(value,keys)=>{
      if(!value||![Object.prototype,null].includes(Object.getPrototypeOf(value))||Reflect.ownKeys(value).length!==keys.length||!keys.every(key=>Object.prototype.hasOwnProperty.call(value,key)&&'value' in Object.getOwnPropertyDescriptor(value,key)))throw new Error();
    };
    const array=(value,length)=>{
      if(!Array.isArray(value)||Object.getPrototypeOf(value)!==Array.prototype||(length!==undefined&&value.length!==length)||Reflect.ownKeys(value).length!==value.length+1)throw new Error();
      return Array.from({length:value.length},(_,i)=>{const d=Object.getOwnPropertyDescriptor(value,String(i));if(!d||!('value' in d))throw new Error();return d.value;});
    };
    const point=value=>{record(value,['x','y','z']);const{x,y,z}=value;if(![x,y,z].every(Number.isFinite))throw new Error();const ground=heightAt(x,z);if(!Number.isFinite(ground)||Math.abs(x)>flightBounds||Math.abs(z)>flightBounds||y<ground||y>ground+3)throw new Error();return{x,y,z};};
    const groups=array(leafSupports).map(group=>{
      record(group,['home','axis']);const home=point(group.home),axis=array(group.axis,2).map(point),dx=axis[1].x-axis[0].x,dz=axis[1].z-axis[0].z,length=Math.hypot(dx,dz);
      if(length<.5-1e-6||length>.7+1e-6||Math.abs(axis[0].y-axis[1].y)>1e-6||Math.abs(home.y-axis[0].y)>1e-6)throw new Error();
      const ux=dx/length,uz=dz/length,homeS=(home.x-axis[0].x)*ux+(home.z-axis[0].z)*uz;
      if(homeS<0||homeS>length||Math.hypot(home.x-axis[0].x-ux*homeS,home.z-axis[0].z-uz*homeS)>1e-6)throw new Error();
      return{home,axis,length,ux,uz,homeS};
    });
    const used=new Set();initialHomes.forEach(([species,x,z,altitude],index)=>{
      if(species!=='leafinsect')return;const y=heightAt(x,z)+altitude,matches=groups.map((group,i)=>({group,i})).filter(({group})=>Math.hypot(group.home.x-x,group.home.y-y,group.home.z-z)<=1e-6);
      if(matches.length!==1||used.has(matches[0].i))throw new Error();used.add(matches[0].i);leafGroups.set(index,matches[0].group);
    });if(used.size!==groups.length)throw new Error();
  } catch { throw new TypeError('Invalid leaf supports'); }
  const striderGroups=new Map(),striders=new Map();
  try {
    const record=(value,keys)=>{if(!value||![Object.prototype,null].includes(Object.getPrototypeOf(value))||Reflect.ownKeys(value).length!==keys.length||!keys.every(key=>Object.prototype.hasOwnProperty.call(value,key)&&'value' in Object.getOwnPropertyDescriptor(value,key)))throw new Error();};
    const array=value=>{if(!Array.isArray(value)||Object.getPrototypeOf(value)!==Array.prototype||Reflect.ownKeys(value).length!==value.length+1)throw new Error();return Array.from({length:value.length},(_,i)=>{const d=Object.getOwnPropertyDescriptor(value,String(i));if(!d||!('value' in d))throw new Error();return d.value;});};
    const groups=array(striderSupports).map(group=>{
      record(group,['home','center','radiusX','radiusZ']);record(group.home,['x','y','z']);record(group.center,['x','z']);
      const home={...group.home},center={...group.center},radiusX=group.radiusX,radiusZ=group.radiusZ;
      if(![home.x,home.y,home.z,center.x,center.z,radiusX,radiusZ].every(Number.isFinite)||radiusX<=0||radiusZ<=0||radiusX>1||radiusZ>1||Math.abs(center.x)+radiusX>flightBounds||Math.abs(center.z)+radiusZ>flightBounds)throw new Error();
      if(((home.x-center.x)/radiusX)**2+((home.z-center.z)/radiusZ)**2>1+1e-10)throw new Error();
      for(const p of [home,center]){const ground=heightAt(p.x,p.z);if(!Number.isFinite(ground)||home.y<ground||home.y>ground+3)throw new Error();}
      return{home,center,radiusX,radiusZ};
    });
    const used=new Set();initialHomes.forEach(([species,x,z,altitude],index)=>{
      if(species!=='waterstrider')return;const y=heightAt(x,z)+altitude,matches=groups.map((group,i)=>({group,i})).filter(({group})=>Math.hypot(group.home.x-x,group.home.y-y,group.home.z-z)<=1e-6);
      if(matches.length!==1||used.has(matches[0].i))throw new Error();used.add(matches[0].i);striderGroups.set(index,matches[0].group);
    });if(used.size!==groups.length)throw new Error();
  } catch { throw new TypeError('Invalid strider supports'); }
  const antGroups=new Map(),ants=new Map();
  try {
    const record=(value,keys)=>{if(!value||![Object.prototype,null].includes(Object.getPrototypeOf(value))||Reflect.ownKeys(value).length!==keys.length||!keys.every(key=>Object.prototype.hasOwnProperty.call(value,key)&&'value' in Object.getOwnPropertyDescriptor(value,key)))throw new Error();};
    const array=value=>{if(!Array.isArray(value)||Object.getPrototypeOf(value)!==Array.prototype||Reflect.ownKeys(value).length!==value.length+1)throw new Error();return Array.from({length:value.length},(_,i)=>{const d=Object.getOwnPropertyDescriptor(value,String(i));if(!d||!('value' in d))throw new Error();return d.value;});};
    const groups=array(antSupports).map(group=>{
      record(group,['home','route','carryingLeaf']);if(typeof group.carryingLeaf!=='boolean')throw new Error();record(group.home,['x','y','z']);const home={...group.home};
      if(!Object.values(home).every(Number.isFinite)||!Number.isFinite(heightAt(home.x,home.z))||Math.abs(home.y-heightAt(home.x,home.z))>1e-6)throw new Error();
      const route=array(group.route).map(p=>{record(p,['x','z']);const{x,z}=p;if(![x,z].every(Number.isFinite)||Math.abs(x)>flightBounds||Math.abs(z)>flightBounds||!Number.isFinite(heightAt(x,z)))throw new Error();return{x,z};});
      if(route.length<5||route.length>9||Math.hypot(route[0].x-route.at(-1).x,route[0].z-route.at(-1).z)>1e-9)throw new Error();
      const segments=[];let length=0;
      for(let i=1;i<route.length;i++){
        const a=route[i-1],b=route[i],distance=Math.hypot(b.x-a.x,b.z-a.z);
        if(distance<.06||distance>3.01||Math.abs(distance/.015-Math.round(distance/.015))>1e-6)throw new Error();
        const ux=(b.x-a.x)/distance,uz=(b.z-a.z)/distance;
        for(let n=0;n<=Math.ceil(distance/.03);n++){const t=n/Math.ceil(distance/.03);if(!Number.isFinite(heightAt(a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t)))throw new Error();}
        segments.push({a,b,start:length,end:length+distance,length:distance,ux,uz});length+=distance;
      }
      const span=Math.max(Math.max(...route.map(p=>p.x))-Math.min(...route.map(p=>p.x)),Math.max(...route.map(p=>p.z))-Math.min(...route.map(p=>p.z)));
      if(length<4||length>6.5||span<2||span>3.01)throw new Error();
      const matches=segments.map(seg=>{const d=(home.x-seg.a.x)*seg.ux+(home.z-seg.a.z)*seg.uz;return{d,s:seg.start+d,gap:Math.hypot(home.x-seg.a.x-seg.ux*d,home.z-seg.a.z-seg.uz*d),seg};}).filter(m=>m.d>=-1e-8&&m.d<=m.seg.length+1e-8&&m.gap<1e-6);
      if(!matches.length||Math.abs(matches[0].s/.015-Math.round(matches[0].s/.015))>1e-6)throw new Error();
      return{home,route,segments,length,carryingLeaf:group.carryingLeaf,homeS:matches[0].s%length};
    });
    if(groups.length&&(groups.length!==4||groups.filter(g=>g.carryingLeaf).length!==2))throw new Error();
    for(let i=0;i<groups.length;i++)for(let j=0;j<i;j++){const a=groups[i],b=groups[j],gap=Math.abs(a.homeS-b.homeS);if(JSON.stringify(a.route)!==JSON.stringify(b.route)||Math.min(gap,a.length-gap)<.24-1e-8)throw new Error();}
    const used=new Set();initialHomes.forEach(([species,x,z,altitude],index)=>{
      if(species!=='leafcutterant')return;const y=heightAt(x,z)+altitude,matches=groups.map((group,i)=>({group,i})).filter(({group})=>Math.hypot(group.home.x-x,group.home.y-y,group.home.z-z)<=1e-6);
      if(matches.length!==1||used.has(matches[0].i))throw new Error();used.add(matches[0].i);antGroups.set(index,matches[0].group);
    });if(used.size!==groups.length)throw new Error();
  } catch { throw new TypeError('Invalid ant supports'); }
  const fireflyGroups=new Map(),fireflies=new Map();
  try {
    const record=(v,keys)=>{if(!v||![Object.prototype,null].includes(Object.getPrototypeOf(v))||Reflect.ownKeys(v).length!==keys.length||!keys.every(k=>Object.prototype.hasOwnProperty.call(v,k)&&'value' in Object.getOwnPropertyDescriptor(v,k)))throw new Error();};
    const array=v=>{if(!Array.isArray(v)||Object.getPrototypeOf(v)!==Array.prototype||Reflect.ownKeys(v).length!==v.length+1)throw new Error();return Array.from({length:v.length},(_,i)=>{const d=Object.getOwnPropertyDescriptor(v,String(i));if(!d||!('value' in d))throw new Error();return d.value;});};
    const point=v=>{record(v,['x','y','z']);const{x,y,z}=v,ground=heightAt(x,z);if(![x,y,z,ground].every(Number.isFinite)||Math.abs(x)>flightBounds||Math.abs(z)>flightBounds||y<ground+.3||y>ground+2.5)throw new Error();return{x,y,z};};
    const groups=array(fireflySupports).map(g=>{
      record(g,['home','points','normal']);record(g.normal,['x','y','z']);const normal={...g.normal};if(!Object.values(normal).every(Number.isFinite)||Math.abs(Math.hypot(normal.x,normal.y,normal.z)-1)>1e-6||normal.y<=0)throw new Error();const home=point(g.home),points=array(g.points).map(point);
      if(points.length!==2||Math.hypot(home.x-points[0].x,home.y-points[0].y,home.z-points[0].z)>1e-6)throw new Error();
      const distance=Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y,points[0].z-points[1].z);if(distance<.3||distance>1.5)throw new Error();
      return{home,points,normal,ceiling:Math.max(...points.map(p=>p.y))+.45};
    });
    if(groups.length&&groups.length!==3)throw new Error();
    const used=new Set();initialHomes.forEach(([species,x,z,altitude],index)=>{
      if(species!=='firefly')return;const y=heightAt(x,z)+altitude,matches=groups.map((group,i)=>({group,i})).filter(({group})=>Math.hypot(group.home.x-x,group.home.y-y,group.home.z-z)<=1e-6);
      if(matches.length!==1||used.has(matches[0].i))throw new Error();used.add(matches[0].i);fireflyGroups.set(index,matches[0].group);
    });if(used.size!==groups.length)throw new Error();
  } catch { throw new TypeError('Invalid firefly supports'); }
  const dungGroups=new Map(),dungStudies=new Map();
  try {
    const record=(value,keys)=>{if(!value||![Object.prototype,null].includes(Object.getPrototypeOf(value))||Reflect.ownKeys(value).length!==keys.length||!keys.every(key=>Object.prototype.hasOwnProperty.call(value,key)&&'value' in Object.getOwnPropertyDescriptor(value,key)))throw new Error();};
    const point=value=>{record(value,['x','y','z']);const{x,y,z}=value;if(![x,y,z].every(Number.isFinite))throw new Error();return{x,y,z};};
    if(!Array.isArray(dungSupports)||dungSupports.length>1||Reflect.ownKeys(dungSupports).length!==dungSupports.length+1)throw new Error();
    const groups=Array.from({length:dungSupports.length},(_,i)=>{
      const descriptor=Object.getOwnPropertyDescriptor(dungSupports,String(i));if(!descriptor||!('value' in descriptor))throw new Error();
      const group=descriptor.value;record(group,['home','origin']);const home=point(group.home),origin=point(group.origin);
      if(Math.hypot(home.x-origin.x,home.y-origin.y-DUNG.bodyHeightAboveGround,home.z-origin.z-DUNG.bodyOffset)>1e-6)throw new Error();
      // This study is a flat, finite lane, not a terrain-following solver.
      for(const dx of [-.2,0,.2])for(const dz of [-.3,0,DUNG.pathLength,DUNG.pathLength+.2]){
        const x=origin.x+dx,z=origin.z+dz,ground=heightAt(x,z);
        if(Math.abs(x)>flightBounds||Math.abs(z)>flightBounds||!Number.isFinite(ground)||Math.abs(ground-origin.y)>1e-6)throw new Error();
      }
      return{home,origin};
    });
    const rows=initialHomes.map((row,index)=>({row,index})).filter(({row})=>row[0]==='dungbeetle');
    if(rows.length!==groups.length)throw new Error();
    if(rows.length){const{row:[,x,z,altitude],index}=rows[0],group=groups[0];if(Math.hypot(group.home.x-x,group.home.y-heightAt(x,z)-altitude,group.home.z-z)>1e-6)throw new Error();dungGroups.set(index,group);}
  } catch { throw new TypeError('Invalid dung beetle supports'); }
  const divingGroups=new Map(),divers=new Map();
  try {
    const record=(value,keys)=>{if(!value||![Object.prototype,null].includes(Object.getPrototypeOf(value))||Reflect.ownKeys(value).length!==keys.length||!keys.every(key=>Object.prototype.hasOwnProperty.call(value,key)&&'value' in Object.getOwnPropertyDescriptor(value,key)))throw new Error();};
    const point=value=>{record(value,['x','y','z']);if(!Object.values(value).every(Number.isFinite))throw new Error();return{...value};};
    if(!Array.isArray(divingSupports)||Object.getPrototypeOf(divingSupports)!==Array.prototype||divingSupports.length>1||Reflect.ownKeys(divingSupports).length!==divingSupports.length+1)throw new Error();
    const groups=Array.from({length:divingSupports.length},(_,i)=>{
      const descriptor=Object.getOwnPropertyDescriptor(divingSupports,String(i));if(!descriptor||!('value' in descriptor))throw new Error();
      const g=descriptor.value;record(g,['home','center','waterY']);record(g.center,['x','z']);const home=point(g.home),center={...g.center},waterY=g.waterY;
      if(![center.x,center.z,waterY].every(Number.isFinite)||Math.abs(center.x)+.42>flightBounds||Math.abs(center.z)+.27>flightBounds)throw new Error();
      const initial=createDivingStudy({center,waterY}).state.position,ground=heightAt(home.x,home.z);
      if(Math.hypot(home.x-initial.x,home.y-initial.y,home.z-initial.z)>1e-6||!Number.isFinite(ground)||ground>=home.y)throw new Error();
      return{home,center,waterY};
    });
    const rows=initialHomes.map((row,index)=>({row,index})).filter(({row})=>row[0]==='divingbeetle');if(rows.length!==groups.length)throw new Error();
    if(rows.length){const{row:[,x,z,altitude],index}=rows[0],group=groups[0];if(Math.hypot(group.home.x-x,group.home.y-heightAt(x,z)-altitude,group.home.z-z)>1e-6)throw new Error();divingGroups.set(index,group);}
  } catch { throw new TypeError('Invalid diving beetle supports'); }
  const mantisGroups=new Map(),mantises=new Map();
  try {
    const record=(v,keys)=>{if(!v||![Object.prototype,null].includes(Object.getPrototypeOf(v))||Reflect.ownKeys(v).length!==keys.length||!keys.every(k=>Object.prototype.hasOwnProperty.call(v,k)&&'value' in Object.getOwnPropertyDescriptor(v,k)))throw new Error();};
    const array=v=>{if(!Array.isArray(v)||Object.getPrototypeOf(v)!==Array.prototype||Reflect.ownKeys(v).length!==v.length+1)throw new Error();return Array.from({length:v.length},(_,i)=>{const d=Object.getOwnPropertyDescriptor(v,String(i));if(!d||!('value' in d))throw new Error();return d.value;});};
    const point=v=>{record(v,['x','y','z']);const{x,y,z}=v,ground=heightAt(x,z);if(![x,y,z,ground].every(Number.isFinite)||Math.abs(x)>flightBounds||Math.abs(z)>flightBounds||y<ground+MANTIS.rootAboveSupport||y>ground+3)throw new Error();return{x,y,z};};
    const groups=array(mantisSupports).map(g=>{
      record(g,['home','perches']);const home=point(g.home),perches=array(g.perches).map(p=>{record(p,['position','heading']);if(!Number.isFinite(p.heading))throw new Error();return{position:point(p.position),heading:p.heading};});
      const first=createMantisStudy(perches).state.position;if(Math.hypot(first.x-home.x,first.y-home.y,first.z-home.z)>1e-6)throw new Error();return{home,perches};
    });
    const rows=initialHomes.map((row,index)=>({row,index})).filter(({row})=>row[0]==='mantis');if(groups.length>1||rows.length!==groups.length)throw new Error();
    if(rows.length){const{row:[,x,z,altitude],index}=rows[0],g=groups[0];if(Math.hypot(g.home.x-x,g.home.y-heightAt(x,z)-altitude,g.home.z-z)>1e-6)throw new Error();mantisGroups.set(index,g);}
  } catch { throw new TypeError('Invalid mantis supports'); }
  const ladybirdGroups=new Map(),ladybirds=new Map();
  try {
    const record=(v,keys)=>{if(!v||![Object.prototype,null].includes(Object.getPrototypeOf(v))||Reflect.ownKeys(v).length!==keys.length||!keys.every(k=>Object.prototype.hasOwnProperty.call(v,k)&&'value' in Object.getOwnPropertyDescriptor(v,k)))throw new Error();};
    const array=v=>{if(!Array.isArray(v)||Object.getPrototypeOf(v)!==Array.prototype||Reflect.ownKeys(v).length!==v.length+1)throw new Error();return Array.from({length:v.length},(_,i)=>{const d=Object.getOwnPropertyDescriptor(v,String(i));if(!d||!('value' in d))throw new Error();return d.value;});};
    const point=v=>{record(v,['x','y','z']);const{x,y,z}=v,ground=heightAt(x,z);if(![x,y,z,ground].every(Number.isFinite)||Math.abs(x)>flightBounds||Math.abs(z)>flightBounds||y<ground+LADYBIRD.rootAboveSupport||y>ground+3)throw new Error();return{x,y,z};};
    const groups=array(ladybirdSupports).map(g=>{
      record(g,['home','perches']);const home=point(g.home),perches=array(g.perches).map(p=>{record(p,['position','heading']);if(!Number.isFinite(p.heading))throw new Error();return{position:point(p.position),heading:p.heading};});
      const first=createLadybirdStudy(perches).state.position;if(Math.hypot(first.x-home.x,first.y-home.y,first.z-home.z)>1e-6)throw new Error();return{home,perches};
    });
    const rows=initialHomes.map((row,index)=>({row,index})).filter(({row})=>row[0]==='ladybird');if(groups.length>1||rows.length!==groups.length)throw new Error();
    if(rows.length){const{row:[,x,z,altitude],index}=rows[0],g=groups[0];if(Math.hypot(g.home.x-x,g.home.y-heightAt(x,z)-altitude,g.home.z-z)>1e-6)throw new Error();ladybirdGroups.set(index,g);}
  } catch { throw new TypeError('Invalid ladybird supports'); }
  const swallowtailGroups=new Map(),swallowtails=new Map();
  try {
    const record=(v,keys)=>{if(!v||![Object.prototype,null].includes(Object.getPrototypeOf(v))||Reflect.ownKeys(v).length!==keys.length||!keys.every(k=>Object.prototype.hasOwnProperty.call(v,k)&&'value' in Object.getOwnPropertyDescriptor(v,k)))throw new Error();};
    const array=v=>{if(!Array.isArray(v)||Object.getPrototypeOf(v)!==Array.prototype||Reflect.ownKeys(v).length!==v.length+1)throw new Error();return Array.from({length:v.length},(_,i)=>{const d=Object.getOwnPropertyDescriptor(v,String(i));if(!d||!('value' in d))throw new Error();return d.value;});};
    // Analytic heightAt differs from the triangulated support: this is a coarse
    // world-height guard, not a contact test. The adapter supplies actual roots.
    const point=v=>{record(v,['x','y','z']);const{x,y,z}=v,ground=heightAt(x,z);if(![x,y,z,ground].every(Number.isFinite)||Math.abs(x)>flightBounds||Math.abs(z)>flightBounds||y<ground-.1||y>ground+3)throw new Error();return{x,y,z};};
    const groups=array(swallowtailSupports).map(g=>{
      record(g,['home','perches']);const home=point(g.home),perches=array(g.perches).map(p=>{record(p,['position','orientation']);record(p.orientation,['x','y','z','w']);return{position:point(p.position),orientation:{...p.orientation}};});
      const first=createSwallowtailStudy(perches).state.position;if(Math.hypot(first.x-home.x,first.y-home.y,first.z-home.z)>1e-6)throw new Error();return{home,perches};
    });
    const rows=initialHomes.map((row,index)=>({row,index})).filter(({row})=>row[0]==='swallowtail');if(groups.length>1||rows.length!==groups.length)throw new Error();
    if(rows.length){const{row:[,x,z,altitude],index}=rows[0],g=groups[0];if(Math.hypot(g.home.x-x,g.home.y-heightAt(x,z)-altitude,g.home.z-z)>1e-6)throw new Error();swallowtailGroups.set(index,g);}
  } catch { throw new TypeError('Invalid swallowtail supports'); }
  const beeGroups=new Map(),bees=new Map();
  try {
    const record=(v,keys)=>{if(!v||![Object.prototype,null].includes(Object.getPrototypeOf(v))||Reflect.ownKeys(v).length!==keys.length||!keys.every(k=>Object.prototype.hasOwnProperty.call(v,k)&&'value' in Object.getOwnPropertyDescriptor(v,k)))throw new Error();};
    const array=v=>{if(!Array.isArray(v)||Object.getPrototypeOf(v)!==Array.prototype||Reflect.ownKeys(v).length!==v.length+1)throw new Error();return Array.from({length:v.length},(_,i)=>{const d=Object.getOwnPropertyDescriptor(v,String(i));if(!d||!('value' in d))throw new Error();return d.value;});};
    const point=v=>{record(v,['x','y','z']);const{x,y,z}=v,ground=heightAt(x,z);if(![x,y,z,ground].every(Number.isFinite)||Math.abs(x)>flightBounds||Math.abs(z)>flightBounds||y<ground+BEE.rootAboveSupport||y>ground+3)throw new Error();return{x,y,z};};
    const groups=array(beeSupports).map(g=>{
      record(g,['home','flowers']);const home=point(g.home),flowers=array(g.flowers).map(p=>{record(p,['position','heading']);if(!Number.isFinite(p.heading))throw new Error();return{position:point(p.position),heading:p.heading};});
      const first=createBeeStudy(flowers).state.position;if(Math.hypot(first.x-home.x,first.y-home.y,first.z-home.z)>1e-6)throw new Error();return{home,flowers};
    });
    const rows=initialHomes.map((row,index)=>({row,index})).filter(({row})=>row[0]==='bee');if(groups.length>1||rows.length!==groups.length)throw new Error();
    if(rows.length){const{row:[,x,z,altitude],index}=rows[0],g=groups[0];if(Math.hypot(g.home.x-x,g.home.y-heightAt(x,z)-altitude,g.home.z-z)>1e-6)throw new Error();beeGroups.set(index,g);}
  } catch { throw new TypeError('Invalid bee supports'); }
  const longhornGroups=new Map(),longhorns=new Map();
  try {
    const record=(v,keys)=>{if(!v||![Object.prototype,null].includes(Object.getPrototypeOf(v))||Reflect.ownKeys(v).length!==keys.length||!keys.every(k=>Object.prototype.hasOwnProperty.call(v,k)&&'value' in Object.getOwnPropertyDescriptor(v,k)))throw new Error();};
    const array=v=>{if(!Array.isArray(v)||Object.getPrototypeOf(v)!==Array.prototype||Reflect.ownKeys(v).length!==v.length+1)throw new Error();return Array.from({length:v.length},(_,i)=>{const d=Object.getOwnPropertyDescriptor(v,String(i));if(!d||!('value' in d))throw new Error();return d.value;});};
    const groups=array(longhornSupports).map(g=>{
      record(g,['home','orientation']);record(g.home,['x','y','z']);record(g.orientation,['x','y','z','w']);
      const home={...g.home},orientation={...g.orientation},{x,y,z}=home,ground=heightAt(x,z);
      // A coarse world-height limit is not a bark contact or world-up constraint.
      if(![x,y,z,ground].every(Number.isFinite)||Math.abs(x)>flightBounds||Math.abs(z)>flightBounds||y<ground-.1||y>ground+3)throw new Error();
      const q=createLonghornStudy({position:home,orientation}).state.orientation;
      if(Math.abs(x+2*(q.x*q.z+q.w*q.y)*.06)>flightBounds||Math.abs(z+(1-2*(q.x*q.x+q.y*q.y))*.06)>flightBounds)throw new Error();
      return{home,orientation};
    });
    const rows=initialHomes.map((row,index)=>({row,index})).filter(({row})=>row[0]==='longhorn');if(groups.length>1||rows.length!==groups.length)throw new Error();
    if(rows.length){const{row:[,x,z,altitude],index}=rows[0],g=groups[0];if(Math.hypot(g.home.x-x,g.home.y-heightAt(x,z)-altitude,g.home.z-z)>1e-6)throw new Error();longhornGroups.set(index,g);}
  } catch { throw new TypeError('Invalid longhorn supports'); }
  const jewelGroups=new Map(),jewels=new Map();
  try {
    const record=(v,keys)=>{if(!v||![Object.prototype,null].includes(Object.getPrototypeOf(v))||Reflect.ownKeys(v).length!==keys.length||!keys.every(k=>Object.prototype.hasOwnProperty.call(v,k)&&'value' in Object.getOwnPropertyDescriptor(v,k)))throw new Error();};
    const array=v=>{if(!Array.isArray(v)||Object.getPrototypeOf(v)!==Array.prototype||Reflect.ownKeys(v).length!==v.length+1)throw new Error();return Array.from({length:v.length},(_,i)=>{const d=Object.getOwnPropertyDescriptor(v,String(i));if(!d||!('value' in d))throw new Error();return d.value;});};
    const groups=array(jewelSupports).map(g=>{
      record(g,['home','heading']);record(g.home,['x','y','z']);const home={...g.home},heading=g.heading,{x,y,z}=home,ground=heightAt(x,z);
      // Coarse analytic world-height guard only; actual leaf contact belongs to the adapter.
      if(![x,y,z,heading,ground].every(Number.isFinite)||Math.abs(x)>flightBounds||Math.abs(z)>flightBounds||y<ground-.1||y>ground+3||Math.abs(x+Math.sin(heading)*.06)>flightBounds||Math.abs(z+Math.cos(heading)*.06)>flightBounds)throw new Error();
      createJewelStudy({position:home,heading});return{home,heading};
    });
    const rows=initialHomes.map((row,index)=>({row,index})).filter(({row})=>row[0]==='jewel');if(groups.length>1||rows.length!==groups.length)throw new Error();
    if(rows.length){const{row:[,x,z,altitude],index}=rows[0],g=groups[0];if(Math.hypot(g.home.x-x,g.home.y-heightAt(x,z)-altitude,g.home.z-z)>1e-6)throw new Error();jewelGroups.set(index,g);}
  } catch { throw new TypeError('Invalid jewel supports'); }
  const rhinoGroups=new Map(),rhinos=new Map();
  try {
    const record=(v,keys)=>{if(!v||![Object.prototype,null].includes(Object.getPrototypeOf(v))||Reflect.ownKeys(v).length!==keys.length||!keys.every(k=>Object.prototype.hasOwnProperty.call(v,k)&&'value' in Object.getOwnPropertyDescriptor(v,k)))throw new Error();};
    const array=v=>{if(!Array.isArray(v)||Object.getPrototypeOf(v)!==Array.prototype||Reflect.ownKeys(v).length!==v.length+1)throw new Error();return Array.from({length:v.length},(_,i)=>{const d=Object.getOwnPropertyDescriptor(v,String(i));if(!d||!('value' in d))throw new Error();return d.value;});};
    const groups=array(rhinoSupports).map(g=>{
      record(g,[...(Object.prototype.hasOwnProperty.call(g,'retreatLimits')?['home','heading','retreatLimits']:['home','heading']),...(Object.prototype.hasOwnProperty.call(g,'flightRoute')?['flightRoute']:[])]);record(g.home,['x','y','z']);const home={...g.home},heading=g.heading,{x,y,z}=home,ground=heightAt(x,z);
      if(![x,y,z,heading,ground].every(Number.isFinite)||Math.abs(x)>flightBounds||Math.abs(z)>flightBounds||y<ground+RHINO.rootAboveSupport||y>ground+3||Math.abs(x+Math.sin(heading)*.12)>flightBounds||Math.abs(z+Math.cos(heading)*.12)>flightBounds)throw new Error();
      let retreatBounds=null;
      if(Object.prototype.hasOwnProperty.call(g,'retreatLimits')){record(g.retreatLimits,['min','max']);const{min,max}=g.retreatLimits,axis=x*Math.sin(heading)+z*Math.cos(heading);
        if(![min,max].every(Number.isFinite)||min>=max||max-min>2||min>axis||max<axis+.12||[min-axis,max-axis].some(d=>Math.abs(x+Math.sin(heading)*d)>flightBounds||Math.abs(z+Math.cos(heading)*d)>flightBounds))throw new Error();
        retreatBounds={min:min-axis,max:max-axis};
      }
      const flightRoute=g.flightRoute??null;
      if(flightRoute!==null&&(flightRoute!=='rhino-east-loop-v1'||!retreatBounds||Math.abs(heading-Math.PI/2)>1e-8||Math.abs(z-2)>1e-8||x< -4.10||x> -3.36||Math.abs(x+retreatBounds.min+4.10)>1e-8||Math.abs(x+retreatBounds.max+3.36)>1e-8))throw new Error();
      createRhinoStudy({position:home,heading,...(retreatBounds?{retreatBounds}:{})});return{home,heading,retreatBounds,flightRoute};
    });
    const rows=initialHomes.map((row,index)=>({row,index})).filter(({row})=>row[0]==='rhino');if(groups.length>1||rows.length!==groups.length)throw new Error();
    if(rows.length){const{row:[,x,z,altitude],index}=rows[0],g=groups[0];if(Math.hypot(g.home.x-x,g.home.y-heightAt(x,z)-altitude,g.home.z-z)>1e-6)throw new Error();rhinoGroups.set(index,g);}
  } catch { throw new TypeError('Invalid rhino supports'); }
  const stagGroups=new Map(),stags=new Map();
  try {
    const record=(v,keys)=>{if(!v||![Object.prototype,null].includes(Object.getPrototypeOf(v))||Reflect.ownKeys(v).length!==keys.length||!keys.every(k=>Object.prototype.hasOwnProperty.call(v,k)&&'value' in Object.getOwnPropertyDescriptor(v,k)))throw new Error();};
    const array=v=>{if(!Array.isArray(v)||Object.getPrototypeOf(v)!==Array.prototype||Reflect.ownKeys(v).length!==v.length+1)throw new Error();return Array.from({length:v.length},(_,i)=>{const d=Object.getOwnPropertyDescriptor(v,String(i));if(!d||!('value' in d))throw new Error();return d.value;});};
    const groups=array(stagSupports).map(g=>{
      record(g,Object.prototype.hasOwnProperty.call(g,'retreatLimits')?['home','heading','retreatLimits']:['home','heading']);record(g.home,['x','y','z']);const home={...g.home},heading=g.heading,{x,y,z}=home,ground=heightAt(x,z);
      if(![x,y,z,heading,ground].every(Number.isFinite)||Math.abs(x)>flightBounds||Math.abs(z)>flightBounds||y<ground+STAG.rootAboveSupport||y>ground+3||Math.abs(x+Math.sin(heading)*.12)>flightBounds||Math.abs(z+Math.cos(heading)*.12)>flightBounds)throw new Error();
      let retreatBounds=null;
      if(Object.prototype.hasOwnProperty.call(g,'retreatLimits')){record(g.retreatLimits,['min','max']);const{min,max}=g.retreatLimits,axis=x*Math.sin(heading)+z*Math.cos(heading);
        if(![min,max].every(Number.isFinite)||min>=max||max-min>2||min>axis||max<axis+.12||[min-axis,max-axis].some(d=>Math.abs(x+Math.sin(heading)*d)>flightBounds||Math.abs(z+Math.cos(heading)*d)>flightBounds))throw new Error();
        retreatBounds={min:min-axis,max:max-axis};
      }
      createStagStudy({position:home,heading,...(retreatBounds?{retreatBounds}:{})});return{home,heading,retreatBounds};
    });
    const rows=initialHomes.map((row,index)=>({row,index})).filter(({row})=>row[0]==='stag');if(groups.length>1||rows.length!==groups.length)throw new Error();
    if(rows.length){const{row:[,x,z,altitude],index}=rows[0],g=groups[0];if(Math.hypot(g.home.x-x,g.home.y-heightAt(x,z)-altitude,g.home.z-z)>1e-6)throw new Error();stagGroups.set(index,g);}
  } catch { throw new TypeError('Invalid stag supports'); }
  const metalliferGroups=new Map(),metallifers=new Map();
  try {
    const record=(v,keys)=>{if(!v||![Object.prototype,null].includes(Object.getPrototypeOf(v))||Reflect.ownKeys(v).length!==keys.length||!keys.every(k=>Object.prototype.hasOwnProperty.call(v,k)&&'value' in Object.getOwnPropertyDescriptor(v,k)))throw new Error();};
    const array=v=>{if(!Array.isArray(v)||Object.getPrototypeOf(v)!==Array.prototype||Reflect.ownKeys(v).length!==v.length+1)throw new Error();return Array.from({length:v.length},(_,i)=>{const d=Object.getOwnPropertyDescriptor(v,String(i));if(!d||!('value' in d))throw new Error();return d.value;});};
    const groups=array(metalliferSupports).map(g=>{
      record(g,['home','heading']);record(g.home,['x','y','z']);const home={...g.home},heading=g.heading,{x,y,z}=home,ground=heightAt(x,z);
      if(![x,y,z,heading,ground].every(Number.isFinite)||Math.abs(x)>flightBounds||Math.abs(z)>flightBounds||y<ground+METALLIFER.rootAboveSupport||y>ground+3||Math.abs(x+Math.sin(heading)*.12)>flightBounds||Math.abs(z+Math.cos(heading)*.12)>flightBounds)throw new Error();
      createMetalliferStudy({position:home,heading});return{home,heading};
    });
    const rows=initialHomes.map((row,index)=>({row,index})).filter(({row})=>row[0]==='metallifer');if(groups.length>1||rows.length!==groups.length)throw new Error();
    if(rows.length){const{row:[,x,z,altitude],index}=rows[0],g=groups[0];if(Math.hypot(g.home.x-x,g.home.y-heightAt(x,z)-altitude,g.home.z-z)>1e-6)throw new Error();metalliferGroups.set(index,g);}
  } catch { throw new TypeError('Invalid metallifer supports'); }
  const atlasGroups=new Map(),atlases=new Map();
  try {
    const record=(v,keys)=>{if(!v||![Object.prototype,null].includes(Object.getPrototypeOf(v))||Reflect.ownKeys(v).length!==keys.length||!keys.every(k=>Object.prototype.hasOwnProperty.call(v,k)&&'value' in Object.getOwnPropertyDescriptor(v,k)))throw new Error();};
    const array=v=>{if(!Array.isArray(v)||Object.getPrototypeOf(v)!==Array.prototype||Reflect.ownKeys(v).length!==v.length+1)throw new Error();return Array.from({length:v.length},(_,i)=>{const d=Object.getOwnPropertyDescriptor(v,String(i));if(!d||!('value' in d))throw new Error();return d.value;});};
    const groups=array(atlasSupports).map(g=>{
      record(g,['home','heading']);record(g.home,['x','y','z']);const home={...g.home},heading=g.heading,{x,y,z}=home,ground=heightAt(x,z);
      if(![x,y,z,heading,ground].every(Number.isFinite)||Math.abs(x)>flightBounds||Math.abs(z)>flightBounds||y<ground+ATLAS.rootAboveSupport||y>ground+3||Math.abs(x-Math.sin(heading)*ATLAS_MOTION.retreatRange)>flightBounds||Math.abs(z-Math.cos(heading)*ATLAS_MOTION.retreatRange)>flightBounds||Math.abs(x+Math.sin(heading)*.12)>flightBounds||Math.abs(z+Math.cos(heading)*.12)>flightBounds)throw new Error();
      createAtlasStudy({position:home,heading});return{home,heading};
    });
    const rows=initialHomes.map((row,index)=>({row,index})).filter(({row})=>row[0]==='atlas');if(groups.length>1||rows.length!==groups.length)throw new Error();
    if(rows.length){const{row:[,x,z,altitude],index}=rows[0],g=groups[0];if(Math.hypot(g.home.x-x,g.home.y-heightAt(x,z)-altitude,g.home.z-z)>1e-6)throw new Error();atlasGroups.set(index,g);}
  } catch { throw new TypeError('Invalid atlas supports'); }
  const giantStagGroups=new Map(),giantStags=new Map();
  try {
    const record=(v,keys)=>{if(!v||![Object.prototype,null].includes(Object.getPrototypeOf(v))||Reflect.ownKeys(v).length!==keys.length||!keys.every(k=>Object.prototype.hasOwnProperty.call(v,k)&&'value' in Object.getOwnPropertyDescriptor(v,k)))throw new Error();};
    const array=v=>{if(!Array.isArray(v)||Object.getPrototypeOf(v)!==Array.prototype||Reflect.ownKeys(v).length!==v.length+1)throw new Error();return Array.from({length:v.length},(_,i)=>{const d=Object.getOwnPropertyDescriptor(v,String(i));if(!d||!('value' in d))throw new Error();return d.value;});};
    const groups=array(giantStagSupports).map(g=>{
      record(g,['home','heading','retreatBounds']);record(g.home,['x','y','z']);record(g.retreatBounds,['min','max']);
      const home={...g.home},heading=g.heading,retreatBounds={...g.retreatBounds},{x,y,z}=home,ground=heightAt(x,z);
      if(![x,y,z,heading,ground,retreatBounds.min,retreatBounds.max].every(Number.isFinite)||Math.abs(x)>flightBounds||Math.abs(z)>flightBounds||y<ground+GIANT_STAG.rootAboveSupport||y>ground+3)throw new Error();
      for(const d of [retreatBounds.min,retreatBounds.max])if(Math.abs(x+Math.sin(heading)*d)>flightBounds||Math.abs(z+Math.cos(heading)*d)>flightBounds)throw new Error();
      createGiantStagStudy({position:home,heading,retreatBounds});return{home,heading,retreatBounds};
    });
    const rows=initialHomes.map((row,index)=>({row,index})).filter(({row})=>row[0]==='giantstag');if(groups.length>1||rows.length!==groups.length)throw new Error();
    if(rows.length){const{row:[,x,z,altitude],index}=rows[0],g=groups[0];if(Math.hypot(g.home.x-x,g.home.y-heightAt(x,z)-altitude,g.home.z-z)>1e-6)throw new Error();giantStagGroups.set(index,g);}
  } catch { throw new TypeError('Invalid giant stag supports'); }
  const elephantGroups=new Map(),elephants=new Map();
  try {
    const record=(v,keys)=>{if(!v||![Object.prototype,null].includes(Object.getPrototypeOf(v))||Reflect.ownKeys(v).length!==keys.length||!keys.every(k=>Object.prototype.hasOwnProperty.call(v,k)&&'value' in Object.getOwnPropertyDescriptor(v,k)))throw new Error();};
    const array=v=>{if(!Array.isArray(v)||Object.getPrototypeOf(v)!==Array.prototype||Reflect.ownKeys(v).length!==v.length+1)throw new Error();return Array.from({length:v.length},(_,i)=>{const d=Object.getOwnPropertyDescriptor(v,String(i));if(!d||!('value' in d))throw new Error();return d.value;});};
    const point=v=>{record(v,['x','y','z']);const p={...v},ground=heightAt(p.x,p.z);if(![p.x,p.y,p.z,ground].every(Number.isFinite)||Math.abs(p.x)>flightBounds||Math.abs(p.z)>flightBounds||p.y<ground+ELEPHANT.rootAboveSupport*.8||p.y>ground+3)throw new Error();return p;};
    const groups=array(elephantSupports).map(g=>{record(g,['home','axis']);const home=point(g.home),axis=array(g.axis).map(point);if(axis.length!==2)throw new Error();createElephantStudy({home,axis});return{home,axis};});
    const rows=initialHomes.map((row,index)=>({row,index})).filter(({row})=>row[0]==='elephant');if(groups.length>1||rows.length!==groups.length)throw new Error();
    if(rows.length){const{row:[,x,z,altitude],index}=rows[0],g=groups[0];if(Math.hypot(g.home.x-x,g.home.y-heightAt(x,z)-altitude,g.home.z-z)>1e-6)throw new Error();elephantGroups.set(index,g);}
  } catch { throw new TypeError('Invalid elephant supports'); }
  let logStation=null;
  if(logFruitStation!==null)try {
    const record=(v,keys)=>{if(!v||![Object.prototype,null].includes(Object.getPrototypeOf(v))||Reflect.ownKeys(v).length!==keys.length||!keys.every(k=>Object.prototype.hasOwnProperty.call(v,k)&&'value' in Object.getOwnPropertyDescriptor(v,k)))throw new Error();};
    const point=v=>{record(v,['x','y','z']);if(!Object.values(v).every(Number.isFinite))throw new Error();return{...v};};
    record(logFruitStation,['supportHome','target','heading']);const home=point(logFruitStation.supportHome),target=point(logFruitStation.target),heading=logFruitStation.heading;
    const matches=[...beetleSupports].filter(([,g])=>Math.hypot(g.home.x-home.x,g.home.y-home.y,g.home.z-home.z)<1e-6);if(matches.length!==1||!Number.isFinite(heading))throw new Error();
    const[index,support]=matches[0],s=(target.x-support.axis[0].x)*support.ux+(target.z-support.axis[0].z)*support.uz;
    if(s<0||s>support.length+1e-6||Math.abs(target.y-home.y)>1e-6||Math.hypot(target.x-support.axis[0].x-support.ux*s,target.z-support.axis[0].z-support.uz*s)>1e-6||Math.abs(Math.sin(heading)*support.uz-Math.cos(heading)*support.ux)>1e-6)throw new Error();
    logStation={index,target,s:clamp(s,0,support.length),heading};
  } catch { throw new TypeError('Invalid log fruit station'); }
  const items = [];
  let time = 0;
  let held = null;
  let companionOrigins = [];
  let catches = 0;
  let previousPlayer = null;
  let caughtFrom = null;
  let bait = null;
  let logFruit=null,logVisit=null,logCooldown=0;
  const baitCooldown = new Map();
  const eye = p => ({ x: p.x, y: Number.isFinite(p.y) ? p.y : heightAt(p.x, p.z) + 1.65, z: p.z });
  function reset() {
    logFruit=null;logVisit=null;logCooldown=0;
    bait = null; baitCooldown.clear(); hoppers.clear(); beetles.clear(); leaves.clear(); striders.clear(); ants.clear(); fireflies.clear(); dungStudies.clear(); divers.clear(); mantises.clear(); ladybirds.clear(); rhinos.clear(); stags.clear(); metallifers.clear(); atlases.clear(); giantStags.clear(); elephants.clear(); bees.clear(); swallowtails.clear(); jewels.clear(); longhorns.clear();
    time = 0; held = null; catches = 0; previousPlayer = null; caughtFrom = null; items.length = 0;
    initialHomes.forEach(([species, x, z, altitude], index) => {
      const y = heightAt(x, z) + altitude;
      items.push({ id: `insect-${index + 1}`, species, x, y, z, home: { x, y, z },
        heading: species === 'cicada' ? Math.atan2(x + 10, z + 8) + Math.PI : index * 2.399,
        state: 'resting', resting: true, caught: false, phase: index * 1.837,
        wingPhase: index * 1.837, flightBlend: 0, fleeUntil: 0, releaseUntil: 0,
        fleeX: x, fleeZ: z, age: 0, beginner: index === 0,
        homeHeading: species === 'cicada' ? Math.atan2(x + 10, z + 8) + Math.PI : index * 2.399,
        alert: 0, nextScareAt: 0, settleUntil: 0, departures: 0, excursion: null });
      const profile=profiles.get(`insect-${index+1}`);
      if(profile){const item=items[items.length-1];Object.assign(item,{encounterId:profile.encounterId,sizePermille:profile.sizePermille,measureVersion:1,motionSeed:profile.motionSeed,populationSlotId:profile.populationSlotId});item.phase=item.wingPhase=profile.motionSeed/4294967296*TAU;}
      if (CAPTURE_AWARENESS[species]) clearAwareness(items[items.length - 1]);
      if (species === 'grasshopper') {
        const item=items[items.length-1];item.airborne=false;item.jumpProgress=0;item.jumpStart=null;item.jumpEnd=null;
        hoppers.set(item.id,{points:hopperSupports.get(index),perchIndex:0,jump:null});
      }
      if (species === 'hercules') {
        const item=items[items.length-1],support=beetleSupports.get(index);
        item.heading=item.homeHeading=Math.atan2(support.ux,support.uz);item.walkPhase=0;item.walkSpeed=0;item.turnProgress=0;
        beetles.set(item.id,{support,s:support.homeS,move:null,nextMoveAt:item.encounterId?3+(item.motionSeed%700)/100:30+5*(1+Math.sin(item.phase)),reactAfter:0,near:false});
      }
      if (species === 'leafinsect') {
        const item=items[items.length-1],support=leafGroups.get(index);
        item.heading=item.homeHeading=Math.atan2(support.ux,support.uz);item.walkPhase=0;item.walkSpeed=0;item.turnProgress=0;item.leafSway=0;
        leaves.set(item.id,{support,s:support.homeS,move:null,nextMoveAt:10+5*(1+Math.sin(item.phase)),pauseUntil:0,reactAfter:0,near:false,retreated:false});
      }
      if (species === 'leafcutterant') {
        const item=items[items.length-1],support=antGroups.get(index),seg=support.segments.find(seg=>support.homeS<seg.end-1e-8)||support.segments.at(-1);
        item.x=support.home.x;item.y=support.home.y;item.z=support.home.z;item.home={...support.home};
        item.heading=item.homeHeading=Math.atan2(seg.ux,seg.uz);item.walkPhase=0;item.walkSpeed=0;item.turnProgress=0;item.turnAngle=0;item.routePhase=support.homeS/support.length;item.carryingLeaf=support.carryingLeaf;
        ants.set(item.id,{support,s:support.homeS,move:null,nextMoveAt:.6,threatened:false});
      }
      if (species === 'firefly') {
        const item=items[items.length-1],support=fireflyGroups.get(index);
        item.x=support.home.x;item.y=support.home.y;item.z=support.home.z;item.home={...support.home};item.heading=item.homeHeading=0;
        item.flightProgress=0;item.flightStart=null;item.flightEnd=null;item.airBlend=0;
        fireflies.set(item.id,{support,perch:0,move:null,nextMoveAt:8+2*(1+Math.sin(item.phase)),threat:0,reactAfter:0});
      }
      if (species === 'mantis') {
        const item=items[items.length-1],support=mantisGroups.get(index);
        mantises.set(item.id,{study:createMantisStudy(support.perches),near:false});syncMantis(item);item.homeHeading=item.heading;
      }
      if (species === 'longhorn') {
        const item=items[items.length-1],support=longhornGroups.get(index);
        longhorns.set(item.id,{study:createLonghornStudy({position:support.home,orientation:support.orientation}),near:false});syncLonghorn(item);
      }
      if (species === 'jewel') {
        const item=items[items.length-1],support=jewelGroups.get(index);
        jewels.set(item.id,{study:createJewelStudy({position:support.home,heading:support.heading}),near:false});syncJewel(item);item.homeHeading=item.heading;
      }
      if (species === 'rhino') {
        const item=items[items.length-1],support=rhinoGroups.get(index);
        item.rhinoFlightEnabled=!!support.flightRoute;
        rhinos.set(item.id,{study:(item.rhinoFlightEnabled?createRhinoFlightStudy:createRhinoStudy)({position:support.home,heading:support.heading,scale:individualScale(item),motionSeed:item.motionSeed??null,...(support.retreatBounds?{retreatBounds:support.retreatBounds}:{})}),near:false,reactive:!!support.retreatBounds});syncRhino(item);item.homeHeading=item.heading;
      }
      if (species === 'stag') {
        const item=items[items.length-1],support=stagGroups.get(index);
        stags.set(item.id,{study:createStagStudy({position:support.home,heading:support.heading,scale:individualScale(item),motionSeed:item.motionSeed??null,...(support.retreatBounds?{retreatBounds:support.retreatBounds}:{})}),near:false,reactive:!!support.retreatBounds});syncStag(item);item.homeHeading=item.heading;
      }
      if (species === 'metallifer') {
        const item=items[items.length-1],support=metalliferGroups.get(index);
        metallifers.set(item.id,{study:createMetalliferStudy({position:support.home,heading:support.heading,scale:individualScale(item),motionSeed:item.motionSeed??null}),near:false});syncMetallifer(item);item.homeHeading=item.heading;
      }
      if (species === 'atlas') {
        const item=items[items.length-1],support=atlasGroups.get(index);
        atlases.set(item.id,{study:createAtlasStudy({position:support.home,heading:support.heading,scale:individualScale(item),motionSeed:item.motionSeed??null}),near:false});syncAtlas(item);item.homeHeading=item.heading;
      }
      if (species === 'elephant') {
        const item=items[items.length-1],support=elephantGroups.get(index);
        elephants.set(item.id,{study:createElephantStudy(support)});syncElephant(item);item.homeHeading=item.heading;
      }
      if (species === 'giantstag') {
        const item=items[items.length-1],support=giantStagGroups.get(index);
        giantStags.set(item.id,{study:createGiantStagStudy({position:support.home,heading:support.heading,retreatBounds:support.retreatBounds,scale:individualScale(item),motionSeed:item.motionSeed??null})});syncGiantStag(item);item.homeHeading=item.heading;
      }
      if (species === 'ladybird') {
        const item=items[items.length-1],support=ladybirdGroups.get(index);
        ladybirds.set(item.id,{study:createLadybirdStudy(support.perches),near:false});syncLadybird(item);item.homeHeading=item.heading;
      }
      if (species === 'swallowtail') {
        const item=items[items.length-1],support=swallowtailGroups.get(index);
        swallowtails.set(item.id,{study:createSwallowtailStudy(support.perches),near:false});syncSwallowtail(item);
      }
      if (species === 'bee') {
        const item=items[items.length-1],support=beeGroups.get(index);
        bees.set(item.id,{study:createBeeStudy(support.flowers),near:false});syncBee(item);item.homeHeading=item.heading;
      }
      if (species === 'divingbeetle') {
        const item=items[items.length-1],support=divingGroups.get(index);
        divers.set(item.id,{study:createDivingStudy(support),disturbed:false});syncDiving(item);item.homeHeading=item.heading;
      }
      if (species === 'dungbeetle') {
        const item=items[items.length-1],support=dungGroups.get(index);
        dungStudies.set(item.id,{origin:support.origin,study:createDungContactStudy()});
        item.dungOrigin={...support.origin};syncDung(item);item.homeHeading=item.heading;
      }
      if (species === 'waterstrider') {
        const item=items[items.length-1],support=striderGroups.get(index);
        item.x=support.home.x;item.y=support.home.y;item.z=support.home.z;item.home={...support.home};item.fleeX=item.x;item.fleeZ=item.z;item.strokePhase=0;item.skateSpeed=0;
        striders.set(item.id,{support,move:null,nextMoveAt:5+2*(1+Math.sin(item.phase)),reactAfter:0,handledThreat:false});
      }
    });
    setCompanions(companionOrigins);
  }
  reset();

  function syncLonghorn(item) {
    const s=longhorns.get(item.id).study.state;
    item.x=s.position.x;item.y=s.position.y;item.z=s.position.z;item.orientation={...s.orientation};
    item.walkPhase=s.walkPhase;item.walkSpeed=s.walkSpeed;item.direction=s.direction;item.longhornPhase=s.phase;
    item.state=item.caught?'caught':s.phase;item.resting=s.phase==='resting';
  }
  function updateLonghorn(item,dt,player,p) {
    if(dt<=0)return;
    const longhorn=longhorns.get(item.id),near=!!p&&Math.hypot(p.x-item.x,p.z-item.z)<(player.quiet?.75:1.4)&&Math.abs(p.y-item.y)<2.5;
    if(near&&!longhorn.near)longhorn.study.disturb();longhorn.near=near;
    longhorn.study.update(dt);syncLonghorn(item);
  }

  function syncJewel(item) {
    const s=jewels.get(item.id).study.state;
    item.x=s.position.x;item.y=s.position.y;item.z=s.position.z;item.heading=s.heading;item.pitch=s.pitch;
    item.walkPhase=s.walkPhase;item.walkSpeed=s.walkSpeed;item.direction=s.direction;item.jewelPhase=s.phase;
    item.state=item.caught?'caught':s.phase;item.resting=s.phase==='resting';
  }
  function updateJewel(item,dt,player,p) {
    if(dt<=0)return;
    const jewel=jewels.get(item.id),near=!!p&&Math.hypot(p.x-item.x,p.z-item.z)<(player.quiet?.75:1.4)&&Math.abs(p.y-item.y)<2.5;
    if(near&&!jewel.near)jewel.study.disturb();jewel.near=near;
    jewel.study.update(dt);syncJewel(item);
  }

  function syncRhino(item) {
    const s=rhinos.get(item.id).study.state;
    item.x=s.position.x;item.y=s.position.y;item.z=s.position.z;item.heading=s.heading;item.pitch=s.pitch;
    item.walkPhase=s.walkPhase;item.walkSpeed=s.walkSpeed;item.direction=s.direction;item.warningBlend=s.warningBlend||0;item.rhinoPhase=s.phase;
    item.flightPose=s.flightPose;item.state=item.caught?'caught':s.phase;item.resting=!['walking','retreating','flying'].includes(s.phase);
  }
  // Branch reactions are enabled only by a measured support envelope. Their
  // warning radii/speeds are game tuning, not wild reaction-distance claims.
  function branchThreat(item,player,p) {
    if(!p)return false;const distance=Math.hypot(p.x-item.x,p.z-item.z),speed=Number.isFinite(player?.speed)?Math.max(0,player.speed):0;
    const radius=player?.quiet?1.05:speed>4?4.0:3.0;
    return distance<radius&&Math.abs(p.y-item.y)<2.5&&(speed>.12||distance<.55)&&hasLineOfSight(p,item)===true;
  }
  function updateRhino(item,dt,player,p) {
    if(dt<=0)return;
    const rhino=rhinos.get(item.id);
    if(rhino.reactive){if(branchThreat(item,player,p))rhino.study.disturb(p);}
    else{const near=!!p&&Math.hypot(p.x-item.x,p.z-item.z)<(player?.quiet?.75:1.4)&&Math.abs(p.y-item.y)<2.5;if(near&&!rhino.near)rhino.study.disturb();rhino.near=near;}
    rhino.study.update(dt);syncRhino(item);
  }

  function syncStag(item) {
    const s=stags.get(item.id).study.state;
    item.x=s.position.x;item.y=s.position.y;item.z=s.position.z;item.heading=s.heading;item.pitch=s.pitch;
    item.walkPhase=s.walkPhase;item.walkSpeed=s.walkSpeed;item.direction=s.direction;item.jawOpen=s.jawOpen;item.warningBlend=s.warningBlend||0;item.stagPhase=s.phase;
    item.state=item.caught?'caught':s.phase;item.resting=!['walking','retreating'].includes(s.phase);
  }
  function updateStag(item,dt,player,p) {
    if(dt<=0)return;
    const stag=stags.get(item.id);
    if(stag.reactive){if(branchThreat(item,player,p))stag.study.disturb(p);}
    else{const near=!!p&&Math.hypot(p.x-item.x,p.z-item.z)<(player?.quiet?.75:1.4)&&Math.abs(p.y-item.y)<2.5;if(near&&!stag.near)stag.study.disturb();stag.near=near;}
    stag.study.update(dt);syncStag(item);
  }

  function syncElephant(item) {
    const s=elephants.get(item.id).study.state;
    item.x=s.position.x;item.y=s.position.y;item.z=s.position.z;item.heading=s.heading;item.pitch=s.pitch;
    item.walkPhase=s.walkPhase;item.walkSpeed=s.walkSpeed;item.direction=s.direction;item.headLift=s.headLift||0;item.warningBlend=s.warningBlend||0;item.elephantPhase=s.phase;
    item.state=item.caught?'caught':s.phase;item.resting=!['walking','retreating'].includes(s.phase);
  }
  function updateElephant(item,dt,player,p) {
    if(dt<=0)return;const beetle=elephants.get(item.id);if(branchThreat(item,player,p))beetle.study.disturb(p);beetle.study.update(dt);syncElephant(item);
  }

  function syncGiantStag(item) {
    const s=giantStags.get(item.id).study.state;
    item.x=s.position.x;item.y=s.position.y;item.z=s.position.z;item.heading=s.heading;item.pitch=s.pitch;
    item.walkPhase=s.walkPhase;item.walkSpeed=s.walkSpeed;item.direction=s.direction;item.jawOpen=s.jawOpen;item.warningBlend=s.warningBlend||0;item.giantStagPhase=s.phase;
    item.state=item.caught?'caught':s.phase;item.resting=!['walking','retreating'].includes(s.phase);
  }
  function updateGiantStag(item,dt,player,p) {
    if(dt<=0)return;const beetle=giantStags.get(item.id);
    if(branchThreat(item,player,p))beetle.study.disturb(p);
    beetle.study.update(dt);syncGiantStag(item);
  }

  function syncMetallifer(item) {
    const s=metallifers.get(item.id).study.state;
    item.x=s.position.x;item.y=s.position.y;item.z=s.position.z;item.heading=s.heading;item.pitch=s.pitch;
    item.walkPhase=s.walkPhase;item.walkSpeed=s.walkSpeed;item.direction=s.direction;item.jawOpen=s.jawOpen;item.metalliferPhase=s.phase;
    item.state=item.caught?'caught':s.phase;item.resting=s.phase!=='walking';
  }
  function updateMetallifer(item,dt,player,p) {
    if(dt<=0)return;
    const metallifer=metallifers.get(item.id),near=!!p&&Math.hypot(p.x-item.x,p.z-item.z)<(player.quiet?.75:1.4)&&Math.abs(p.y-item.y)<2.5;
    if(near&&!metallifer.near)metallifer.study.disturb();metallifer.near=near;
    metallifer.study.update(dt);syncMetallifer(item);
  }

  function syncAtlas(item) {
    const s=atlases.get(item.id).study.state;
    item.x=s.position.x;item.y=s.position.y;item.z=s.position.z;item.heading=s.heading;item.pitch=s.pitch;
    item.walkPhase=s.walkPhase;item.walkSpeed=item.caught?0:s.walkSpeed;item.direction=s.direction;item.headLift=s.headLift;item.atlasPhase=s.phase;
    item.state=item.caught?'caught':s.phase;item.resting=!['walking','retreating'].includes(s.phase);
  }
  function updateAtlas(item,dt,player,p) {
    if(dt<=0)return;
    const atlas=atlases.get(item.id),dx=p?p.x-item.x:0,dz=p?p.z-item.z:0,distance=Math.hypot(dx,dz);
    // A fixed forward-facing route cannot honestly flee away from a rear threat.
    // Front/side approach gets the visible warning; circling is fair counterplay.
    const facing=dx*Math.sin(item.heading)+dz*Math.cos(item.heading),speed=Number.isFinite(player?.speed)?player.speed:0;
    const radius=player?.quiet?1.05:speed>4?3.7:2.9;
    const near=!!p&&distance<radius&&facing>=-.15&&Math.abs(p.y-item.y)<2.5&&(speed>.12||distance<.7)&&hasLineOfSight(p,item)===true;
    if(near&&!atlas.near)atlas.study.disturb();atlas.near=near;
    atlas.study.update(dt);syncAtlas(item);
  }

  function syncSwallowtail(item) {
    const s=swallowtails.get(item.id).study.state;
    item.x=s.position.x;item.y=s.position.y;item.z=s.position.z;item.orientation={...s.orientation};
    item.wingOpen=s.wingOpen;item.wingPhase=s.wingPhase;item.flapBlend=s.flapBlend;item.legTuck=s.legTuck;item.swallowtailPhase=s.phase;
    item.state=item.caught?'caught':s.phase;item.resting=s.phase!=='flying';
  }
  function updateSwallowtail(item,dt,player,p) {
    if(dt<=0)return;
    const swallowtail=swallowtails.get(item.id),near=!!p&&Math.hypot(p.x-item.x,p.z-item.z)<(player.quiet?.7:1.3)&&Math.abs(p.y-item.y)<2.5;
    if(near&&!swallowtail.near)swallowtail.study.depart();swallowtail.near=near;
    swallowtail.study.update(dt);syncSwallowtail(item);
  }

  function syncBee(item) {
    const s=bees.get(item.id).study.state;
    item.x=s.position.x;item.y=s.position.y;item.z=s.position.z;item.heading=s.heading;item.pitch=s.pitch;
    item.wingOpen=s.wingOpen;item.wingPhase=s.wingPhase;item.legTuck=s.legTuck;item.beePhase=s.phase;
    item.state=item.caught?'caught':s.phase;item.resting=s.phase!=='flying';
  }
  function updateBee(item,dt,player,p) {
    if(dt<=0)return;
    const bee=bees.get(item.id),near=!!p&&Math.hypot(p.x-item.x,p.z-item.z)<(player.quiet?.7:1.3)&&Math.abs(p.y-item.y)<2.5;
    if(near&&!bee.near)bee.study.depart();bee.near=near;
    bee.study.update(dt);syncBee(item);
  }

  function syncLadybird(item) {
    const s=ladybirds.get(item.id).study.state;
    item.x=s.position.x;item.y=s.position.y;item.z=s.position.z;item.heading=s.heading;item.pitch=s.pitch;
    item.elytraOpen=s.elytraOpen;item.hindwingDeploy=s.hindwingDeploy;item.hindwingSweep=s.hindwingSweep;
    item.wingPhase=s.wingPhase;item.legTuck=s.legTuck;item.walkPhase=s.walkPhase;item.walkSpeed=s.walkSpeed;item.ladybirdPhase=s.phase;
    item.state=item.caught?'caught':s.phase;item.resting=s.phase!=='flying';
  }
  function updateLadybird(item,dt,player,p) {
    if(dt<=0)return;
    const bird=ladybirds.get(item.id),near=!!p&&Math.hypot(p.x-item.x,p.z-item.z)<(player.quiet?.65:1.2)&&Math.abs(p.y-item.y)<2.5;
    if(near&&!bird.near)bird.study.depart();bird.near=near;
    bird.study.update(dt);syncLadybird(item);
  }

  function syncMantis(item) {
    const s=mantises.get(item.id).study.state;
    item.x=s.position.x;item.y=s.position.y;item.z=s.position.z;item.heading=s.heading;item.pitch=s.pitch;
    item.wingOpen=s.wingOpen;item.wingPhase=s.wingPhase;item.legTuck=s.legTuck;item.headYaw=s.headYaw;item.mantisPhase=s.phase;
    item.state=item.caught?'caught':s.phase;item.resting=s.phase!=='flying';
  }
  function updateMantis(item,dt,player,p) {
    if(dt<=0)return;
    const mantis=mantises.get(item.id),near=!!p&&Math.hypot(p.x-item.x,p.z-item.z)<(player.quiet?.8:1.65)&&Math.abs(p.y-item.y)<2.5;
    if(near&&!mantis.near)mantis.study.depart(p);mantis.near=near;
    mantis.study.update(dt);syncMantis(item);
  }

  function syncDiving(item) {
    const state=divers.get(item.id).study.state;
    item.x=state.position.x;item.y=state.position.y;item.z=state.position.z;item.heading=state.heading;item.pitch=state.pitch;
    item.strokePhase=state.strokePhase;item.divingPhase=state.phase;item.state=item.caught?'caught':state.phase;item.resting=state.phase==='surface'||item.caught;
  }
  function updateDiving(item,dt,player,p) {
    if(dt<=0)return;
    const diver=divers.get(item.id),near=p&&!player.quiet&&Number.isFinite(player.speed)&&player.speed>2.2&&Math.hypot(p.x-item.x,p.z-item.z)<1.5&&Math.abs(p.y-item.y)<2.5;
    if(!near)diver.disturbed=false;
    else if(!diver.disturbed&&diver.study.dive())diver.disturbed=true;
    diver.study.update(dt);syncDiving(item);
  }

  function syncDung(item) {
    const {study,origin}=dungStudies.get(item.id),state=study.state,body=study.pose.body;
    item.x=body.position.x+origin.x;item.y=body.position.y+origin.y;item.z=body.position.z+origin.z;
    item.heading=body.heading;item.pitch=body.pitch;item.dungDistance=state.distance;
    item.state=state.status;item.resting=state.status!=='rolling';
  }
  function dungBall() {
    const entry=dungStudies.values().next().value;if(!entry)return null;
    const ball=entry.study.state.ball,origin=entry.origin;
    return{...ball,position:{x:ball.position.x+origin.x,y:ball.position.y+origin.y,z:ball.position.z+origin.z}};
  }

  const flightStyle = {
    butterfly: { duration: 6.6, reach: 3.0, lift: .85, flutter: .22, frequency: 4.6 },
    dragonfly: { duration: 5.2, reach: 3.7, lift: .55, flutter: .055, frequency: 2.4 },
    cicada: { duration: 6.0, reach: 3.2, lift: .95, flutter: .035, frequency: 3.1 },
    // A slower, wider wavering loop is a play tuning value, not a measured flight constant.
    morpho: { duration: 8.4, reach: 3.4, lift: .65, flutter: .18, frequency: 3.6 }
  };
  const finitePlayer = p => p && Number.isFinite(p.x) && Number.isFinite(p.z) ? eye(p) : null;
  function boundedControl(item, point) {
    // Excursions remain local, even if the insect was caught while already flying.
    const dx = point.x - item.home.x, dz = point.z - item.home.z, distance = Math.hypot(dx, dz);
    const scale = distance > 5.5 ? 5.5 / distance : 1;
    return { x: clamp(item.home.x + dx * scale, -flightBounds, flightBounds), y: point.y, z: clamp(item.home.z + dz * scale, -flightBounds, flightBounds) };
  }
  function depart(item, reason, player) {
    if (item.species === 'swallowtail') { swallowtails.get(item.id).study.release();syncSwallowtail(item);return; }
    if (item.species === 'bee') { bees.get(item.id).study.release();syncBee(item);return; }
    if (item.species === 'stag') { stags.get(item.id).study.release();syncStag(item);return; }
    if (item.species === 'metallifer') { metallifers.get(item.id).study.release();syncMetallifer(item);return; }
    if (item.species === 'elephant') { elephants.get(item.id).study.release();syncElephant(item);return; }
    if (item.species === 'giantstag') { giantStags.get(item.id).study.release();syncGiantStag(item);return; }
    if (item.species === 'atlas') { atlases.get(item.id).study.release();syncAtlas(item);return; }
    if (item.species === 'longhorn') { longhorns.get(item.id).study.release();syncLonghorn(item);return; }
    if (item.species === 'jewel') { jewels.get(item.id).study.release();syncJewel(item);return; }
    if (item.species === 'rhino') { rhinos.get(item.id).study.release();syncRhino(item);return; }
    if (item.species === 'ladybird') { ladybirds.get(item.id).study.release();syncLadybird(item);return; }
    if (item.species === 'mantis') { mantises.get(item.id).study.release();syncMantis(item);return; }
    if (item.species === 'divingbeetle') { divers.get(item.id).study.release();syncDiving(item);return; }
    if (item.species === 'dungbeetle') { dungStudies.get(item.id).study.release();syncDung(item);return; }
    if (item.species === 'grasshopper') { beginJump(item,reason,player); return; }
    if (item.species === 'hercules') { beginBeetleWalk(item,reason,player); return; }
    if (item.species === 'leafinsect') { beginLeafWalk(item,reason,player); return; }
    if (item.species === 'waterstrider') { beginSkate(item,reason,player); return; }
    if (item.species === 'leafcutterant') { beginAntWalk(item); return; }
    if (item.species === 'firefly') { beginFireflyFlight(item,reason); return; }
    if (bait?.visitorId === item.id) detachVisitor();
    const style = flightStyle[item.species], p = finitePlayer(player);
    let dx = p ? item.x - p.x : Math.sin(item.heading), dz = p ? item.z - p.z : Math.cos(item.heading);
    let length = Math.hypot(dx, dz);
    if (length < .001) { dx = Math.sin(item.phase + 1); dz = Math.cos(item.phase + 1); length = 1; }
    dx /= length; dz /= length;
    let sideX = -dz, sideZ = dx;
    if (item.species === 'cicada') {
      // The oak's outward normal takes priority over a player standing behind the
      // trunk. Both Bezier controls stay on the home-facing side of that plane.
      const rx = item.home.x + 10, rz = item.home.z + 8, radial = Math.hypot(rx, rz) || 1;
      const nx = rx / radial, nz = rz / radial;
      sideX = -nz; sideZ = nx;
      if (dx*nx + dz*nz < .2) {
        // With the player outside the bark, sidestep and rise rather than flying
        // through the trunk or charging straight through the player's position.
        const tangent = dx*sideX + dz*sideZ;
        const sign = Math.abs(tangent) > .05 ? Math.sign(tangent) : Math.sin(item.phase + (item.departures+1)*1.6) >= 0 ? 1 : -1;
        dx = nx*.22 + sideX*sign*.98; dz = nz*.22 + sideZ*sign*.98;
      } else { dx = nx*.85 + dx*.35; dz = nz*.85 + dz*.35; }
      length = Math.hypot(dx, dz); dx /= length; dz /= length;
    }
    const duration = style.duration * (reason === 'startled' ? .78 : 1);
    const reach = style.reach * (reason === 'startled' ? .85 : 1);
    const turn = Math.sin(item.phase + (++item.departures) * 1.6) >= 0 ? 1 : -1;
    const start = { x: item.x, y: item.y, z: item.z };
    // A fruit visitor can be farther than the ordinary home-local flight radius.
    // Keep its first escape control local to the actual capture/startle position.
    const firstControl = { x: start.x + dx * reach * 1.35, y: Math.max(start.y, item.home.y) + style.lift, z: start.z + dz * reach * 1.35 };
    const c1 = item.species === 'morpho' && Math.hypot(start.x-item.home.x,start.z-item.home.z)>5.5 ? fieldControl(firstControl) : boundedControl(item, firstControl);
    const c2 = boundedControl(item, { x: item.home.x + dx * reach * 1.1 + sideX * turn * .65, y: item.home.y + style.lift * 1.15, z: item.home.z + dz * reach * 1.1 + sideZ * turn * .65 });
    item.excursion = { reason, startedAt: time, duration, start, c1, c2, sideX, sideZ, turn };
    item.state = reason; item.resting = false; item.alert = 0;
    if (CAPTURE_AWARENESS[item.species]) {
      item.awarenessStage = 'fleeing'; item.warningElapsed = 0; item.netStartleOrigin = null;
    }
    item.nextScareAt = time + (reason === 'released' ? .85 : 2.0);
    item.fleeUntil = reason === 'startled' ? time + duration : 0;
    // This is a flight deadline, not immunity and not a stationary seven-second hold.
    item.releaseUntil = reason === 'released' ? time + duration : 0;
    item.fleeX = c1.x; item.fleeZ = c1.z;
  }
  function fieldControl(point) {
    return { x: clamp(point.x,-flightBounds,flightBounds), y: point.y, z: clamp(point.z,-flightBounds,flightBounds) };
  }
  function finishLogVisit() {
    logVisit=null;logCooldown=time+40;
    if(logFruit){logFruit.visitorId=null;logFruit.status='waiting';logFruit.nextInviteAt=time+18;}
  }
  function stopLogStep(item) {
    const beetle=beetles.get(item.id),move=beetle.move;if(!move)return;
    if(item.state==='turning'){
      // Complete the current foot-stepping turn before changing destination.
      move.distance=0;move.end={x:item.x,y:item.y,z:item.z};move.endS=beetle.s;move.targetPhase=item.walkPhase;return;
    }
    const targetHalf=Math.ceil(item.walkPhase/Math.PI-1e-9),left=Math.max(0,(targetHalf-item.walkPhase/Math.PI)*.025*individualScale(item));
    if(left<1e-8){restBeetle(item);return;}
    const total=Math.min(move.distance,move.travelled+left),ratio=total/move.distance;
    move.end={x:move.start.x+(move.end.x-move.start.x)*ratio,y:move.start.y,z:move.start.z+(move.end.z-move.start.z)*ratio};move.endS=move.startS+(move.endS-move.startS)*ratio;move.distance=total;move.targetPhase=targetHalf*Math.PI;
  }
  function requestLogReturn() {
    if(!logVisit||!['approaching','resting'].includes(logVisit.stage))return;
    logVisit.stage='settling';const item=items.find(i=>i.id===logVisit.id);if(item&&!item.caught)stopLogStep(item);
    if(logFruit)logFruit.status='returning';
  }
  function placeLogFruit(value) {
    if(!logStation||logFruit)return false;
    try {if(!value||![Object.prototype,null].includes(Object.getPrototypeOf(value))||Reflect.ownKeys(value).length!==1||!Object.prototype.hasOwnProperty.call(value,'type')||!('value' in Object.getOwnPropertyDescriptor(value,'type'))||value.type!=='fermented-fruit')return false;} catch{return false;}
    logFruit={type:'fermented-fruit',expiresAt:time+90,nextInviteAt:time+4,visitorId:logVisit?.id||null,status:logVisit?'returning':'waiting'};return true;
  }
  function removeLogFruit() {if(!logFruit)return false;logFruit=null;requestLogReturn();return true;}
  function updateLogFruit(p) {
    if(!logFruit)return;
    if(time>=logFruit.expiresAt-1e-9){removeLogFruit();return;}
    if(logVisit||time<logFruit.nextInviteAt||time<logCooldown)return;
    logFruit.nextInviteAt=time+3.5;
    if(p&&Math.hypot(p.x-logStation.target.x,p.z-logStation.target.z)<=2.8)return;
    const item=items[logStation.index],beetle=beetles.get(item.id);
    if(item.caught||!item.resting||item.state!=='resting'||beetle.move)return;
    logVisit={id:item.id,returnS:beetle.s,stage:'approaching',until:0};logFruit.visitorId=item.id;logFruit.status='approaching';
    beginBeetleWalk(item,'log-approach',null,logStation.s,logStation.heading);
  }
  function controlLogVisit(item,near,player) {
    if(!logVisit||logVisit.id!==item.id)return false;
    const beetle=beetles.get(item.id);
    if(near&&logVisit.stage!=='retreat'){logVisit.stage='retreat';stopLogStep(item);if(logFruit)logFruit.status='returning';}
    if(beetle.move)return true;
    if(logVisit.stage==='retreat'){finishLogVisit();beginBeetleWalk(item,'near',player);return true;}
    if(logVisit.stage==='settling'){logVisit.stage='returning';beginBeetleWalk(item,'log-return',null,logVisit.returnS);return true;}
    if(logVisit.stage==='returning'){finishLogVisit();return true;}
    if(logVisit.stage==='approaching'){
      if(Math.abs(beetle.s-logStation.s)>.025+1e-8){requestLogReturn();return true;}
      const delta=Math.atan2(Math.sin(logStation.heading-item.heading),Math.cos(logStation.heading-item.heading));
      if(Math.abs(delta)>.01){beginBeetleWalk(item,'log-approach',null,beetle.s,logStation.heading);return true;}
      logVisit.stage='resting';logVisit.until=time+7;if(logFruit)logFruit.status='resting';
    }else if(time>=logVisit.until)requestLogReturn();
    return true;
  }
  function detachVisitor() {
    if (!bait) return null;
    const visitor = items.find(item => item.id === bait.visitorId) || null;
    if (visitor) { baitCooldown.set(visitor.id,time+40);bait.nextInviteAt=time+18; }
    bait.visitorId = null; bait.status = 'waiting'; bait.feedUntil = 0;
    return visitor;
  }
  function placeBait(value) {
    if (bait) return false;
    try {
      if (!value || typeof value !== 'object' || ![Object.prototype,null].includes(Object.getPrototypeOf(value))) return false;
      const keys = Reflect.ownKeys(value);
      if (keys.length !== 4 || !['type','x','y','z'].every(key => Object.prototype.hasOwnProperty.call(value,key) && 'value' in Object.getOwnPropertyDescriptor(value,key))) return false;
      const {type,x,y,z} = value, ground = Number.isFinite(x) && Number.isFinite(z) ? heightAt(x,z) : NaN;
      if (type !== 'fermented-fruit' || ![x,y,z,ground].every(Number.isFinite) || Math.abs(x)>flightBounds || Math.abs(z)>flightBounds || y<ground+.45 || y>ground+3) return false;
      bait = {type,x,y,z,expiresAt:time+90,nextInviteAt:time+4,attempts:0,visitorId:null,status:'waiting',feedUntil:0};
      return true;
    } catch { return false; }
  }
  function removeBait() {
    if (!bait) return false;
    const visitor = detachVisitor(); bait = null;
    if (visitor && !visitor.caught) depart(visitor,'returning',previousPlayer);
    return true;
  }
  function updateBait(player,p) {
    if (!bait) return;
    if (time >= bait.expiresAt-1e-9) { removeBait(); return; }
    if (bait.status === 'feeding' && time >= bait.feedUntil) {
      const visitor = detachVisitor(); if (visitor && !visitor.caught) depart(visitor,'returning',player);
    }
    if (bait.visitorId || time < bait.nextInviteAt) return;
    bait.nextInviteAt = time + 3.5;
    if (p && Math.hypot(p.x-bait.x,p.z-bait.z)<=2.8) return;
    const attempt = ++bait.attempts;
    const candidates = items.filter(item => item.species === 'morpho' && !item.caught && item.resting && item.state === 'resting' && !item.excursion && item.alert === 0 && time >= item.nextScareAt && time >= (baitCooldown.get(item.id)||0) && Math.hypot(item.x-bait.x,item.z-bait.z)<=14 && Math.sin(item.phase+attempt*1.9)>-.25);
    candidates.sort((a,b)=>Math.hypot(a.x-bait.x,a.z-bait.z)-Math.hypot(b.x-bait.x,b.z-bait.z));
    const item = candidates[0]; if (!item) return;
    const start = {x:item.x,y:item.y,z:item.z}, end = {x:bait.x,y:bait.y,z:bait.z};
    const dx=end.x-start.x,dz=end.z-start.z,distance=Math.hypot(dx,dz),sideX=distance ? -dz/distance : 1,sideZ=distance ? dx/distance : 0;
    const c1=fieldControl({x:start.x+dx*.3+sideX*.65,y:Math.max(start.y,end.y)+.65,z:start.z+dz*.3+sideZ*.65});
    const c2=fieldControl({x:end.x-dx*.2-sideX*.35,y:end.y+.45,z:end.z-dz*.2-sideZ*.35});
    item.excursion={reason:'bait-approach',startedAt:time,duration:3+distance*.45,start,c1,c2,end,sideX,sideZ,turn:1};
    item.state='bait-approach';item.resting=false;item.alert=0;
    bait.visitorId=item.id; bait.status='approaching';
  }

  // Grasshoppers use local ground supports, never the flying insects' home loop.
  // Durations, lift and reaction radii are play tuning, not biological measurements.
  function beginJump(item,reason,player) {
    const hopper=hoppers.get(item.id),p=finitePlayer(player),start={x:item.x,y:item.y,z:item.z};
    const choices=hopper.points.map((end,index)=>({end,index,distance:Math.hypot(end.x-start.x,end.z-start.z)})).filter(choice=>choice.index!==hopper.perchIndex && choice.distance>.2 && choice.distance<=2.7+1e-6);
    choices.sort((a,b)=>p ? Math.hypot(b.end.x-p.x,b.end.z-p.z)-Math.hypot(a.end.x-p.x,a.end.z-p.z) || a.index-b.index : (a.index-hopper.perchIndex+3)%3-(b.index-hopper.perchIndex+3)%3);
    const choice=choices[0];if(!choice)return false;
    hopper.jump={start,end:choice.end,index:choice.index,startedAt:time,duration:.7+.2*choice.distance/2.7,lift:.6};
    item.jumpStart={...start};item.jumpEnd={...choice.end};
    item.departures++;item.state='jumping';item.resting=false;item.airborne=true;item.jumpProgress=0;item.alert=0;item.flightBlend=0;
    item.fleeUntil=reason==='startled'?time+hopper.jump.duration:0;item.releaseUntil=reason==='released'?time+hopper.jump.duration:0;
    return true;
  }
  function updateGrasshopper(item,dt,player,p) {
    const hopper=hoppers.get(item.id);
    if(!hopper.jump){
      let rate=0;
      if(p){
        const near=Math.hypot(item.x-p.x,item.z-p.z),gap=Math.max(0,item.y-(p.y+.25),heightAt(p.x,p.z)+.015-item.y);
        const speed=Number.isFinite(player.speed)?Math.max(0,player.speed):0;
        if(Math.hypot(near,gap)<.36)rate=10;
        else if(speed>=.12 && gap<1.5){const radius=player.quiet?.9:speed>4?3.0:2.2;if(near<radius)rate=(player.quiet?1.8:speed>4?4:2.5)*(1+(radius-near)/radius);}
      }
      item.alert=clamp(item.alert+dt*(rate||-3),0,1.2);
      if(rate && item.alert>=1 && time>=item.nextScareAt)beginJump(item,'startled',player);
    }
    const jump=hopper.jump;
    if(!jump){item.state='resting';item.resting=true;item.airborne=false;item.jumpProgress=0;return;}
    const u=clamp((time-jump.startedAt)/jump.duration,0,1);
    item.x=jump.start.x+(jump.end.x-jump.start.x)*u;
    item.z=jump.start.z+(jump.end.z-jump.start.z)*u;
    item.y=jump.start.y+(jump.end.y-jump.start.y)*u+4*jump.lift*u*(1-u);
    const heading=Math.atan2(jump.end.x-jump.start.x,jump.end.z-jump.start.z);
    item.heading+=Math.atan2(Math.sin(heading-item.heading),Math.cos(heading-item.heading))*(1-Math.exp(-dt*10));
    item.jumpProgress=u;item.airborne=true;item.resting=false;item.state='jumping';item.flightBlend=0;
    if(u>=1){item.x=jump.end.x;item.y=jump.end.y;item.z=jump.end.z;hopper.perchIndex=jump.index;hopper.jump=null;item.jumpStart=null;item.jumpEnd=null;item.state='resting';item.resting=true;item.airborne=false;item.jumpProgress=0;item.nextScareAt=time+1.7;item.alert=0;}
  }

  // Daytime beetles stay on one horizontal support; optional log visits never fly.
  // Stop distances are shortened by <25mm to retain a both-tripods-grounded phase.
  function restBeetle(item) {
    const beetle=beetles.get(item.id);beetle.move=null;beetle.nextMoveAt=time+(item.encounterId?4+3*(1+Math.sin(item.phase+item.departures*1.3)):30+5*(1+Math.sin(item.phase+item.departures*1.3)));beetle.reactAfter=time+10;
    item.state='resting';item.resting=true;item.walkSpeed=0;item.turnProgress=0;
  }
  function beginBeetleWalk(item,reason,player,targetS=null,targetHeading=null) {
    const beetle=beetles.get(item.id),support=beetle.support,p=finitePlayer(player);
    const projected=p?(p.x-support.axis[0].x)*support.ux+(p.z-support.axis[0].z)*support.uz:beetle.s;
    let direction=targetS!==null?(targetS>=beetle.s?1:-1):p?(beetle.s>=projected?1:-1):(item.departures%2?-1:1);
    let available=direction>0?support.length-beetle.s:beetle.s;
    if(reason==='spontaneous' && available<.25){direction=-direction;available=direction>0?support.length-beetle.s:beetle.s;}
    const halfStep=.025*individualScale(item),half=item.walkPhase/Math.PI,desired=Math.min(available,targetS===null?.25+.05*(item.departures%5):Math.abs(targetS-beetle.s));
    let targetHalf=Math.floor(half+desired/halfStep+1e-9),distance=Math.max(0,(targetHalf-half)*halfStep);
    if(distance<1e-8&&targetS===null){
      // After a mid-stride capture at an edge, at most 25mm in the other safe
      // direction can finish the foot placement; never reset the gait phase.
      targetHalf=Math.ceil(half-1e-9);distance=Math.max(0,(targetHalf-half)*halfStep);
      const other=direction>0?beetle.s:support.length-beetle.s;
      if(distance<1e-8 || distance>other+1e-9){restBeetle(item);return false;}
      direction=-direction;
    }
    if(targetS!==null&&distance<1e-8&&(targetHeading===null||Math.abs(Math.atan2(Math.sin(targetHeading-item.heading),Math.cos(targetHeading-item.heading)))<.01)){restBeetle(item);return false;}
    const endS=clamp(beetle.s+direction*distance,0,support.length),start={x:item.x,y:item.y,z:item.z};
    const end={x:support.axis[0].x+support.ux*endS,y:start.y,z:support.axis[0].z+support.uz*endS};
    const heading=distance<1e-8&&targetHeading!==null?targetHeading:Math.atan2(direction*support.ux,direction*support.uz),delta=Math.atan2(Math.sin(heading-item.heading),Math.cos(heading-item.heading));
    const speed=.12+.03*(1+Math.sin(item.phase+item.departures*.73));
    beetle.move={reason,start,end,startS:beetle.s,endS,distance,travelled:0,targetPhase:targetHalf*Math.PI,speed,turnStart:item.heading,delta,startedAt:time,turnDuration:Math.abs(delta)<.01?0:.5+.5*Math.abs(delta)/Math.PI};
    item.departures++;item.state=beetle.move.turnDuration?'turning':'walking';item.resting=false;item.walkSpeed=0;item.turnProgress=0;item.alert=0;item.flightBlend=0;
    return true;
  }
  function updateHercules(item,dt,player,p) {
    const beetle=beetles.get(item.id),near=!!p && Math.hypot(item.x-p.x,item.z-p.z)<(player.quiet?.8:1.5) && Math.abs(item.y-p.y)<2;
    const arrived=near&&!beetle.near;beetle.near=near;
    const guided=logVisit?.id===item.id?(dt>0?controlLogVisit(item,near,player):true):false;
    if(!guided && arrived && beetle.move?.reason==='spontaneous'){
      // A newly close observer interrupts an unprovoked walk at the next
      // grounded half-cycle, rather than making the beetle push into them.
      const move=beetle.move,targetHalf=Math.ceil(item.walkPhase/Math.PI-1e-9),left=Math.max(0,(targetHalf-item.walkPhase/Math.PI)*.025*individualScale(item));
      if(left<1e-8)restBeetle(item);
      else{const total=Math.min(move.distance,move.travelled+left),ratio=total/move.distance;move.end={x:move.start.x+(move.end.x-move.start.x)*ratio,y:move.start.y,z:move.start.z+(move.end.z-move.start.z)*ratio};move.endS=move.startS+(move.endS-move.startS)*ratio;move.distance=total;move.targetPhase=targetHalf*Math.PI;}
    }
    if(!guided&&!beetle.move){
      if(arrived && time>=beetle.reactAfter)beginBeetleWalk(item,'near',player);
      else if(!near && time>=beetle.nextMoveAt)beginBeetleWalk(item,'spontaneous',null);
    }
    const move=beetle.move;if(!move){item.walkSpeed=0;return;}
    if(item.state==='turning'){
      const u=clamp((time-move.startedAt)/move.turnDuration,0,1);item.heading=move.turnStart+move.delta*u;item.turnProgress=u;item.walkSpeed=0;
      if(u<1)return;item.state='walking';return;
    }
    if(move.distance<1e-8){restBeetle(item);return;}
    const advance=Math.min(move.speed*dt,Math.max(0,move.distance-move.travelled));
    move.travelled+=advance;const u=clamp(move.travelled/move.distance,0,1);
    item.x=move.start.x+(move.end.x-move.start.x)*u;item.y=move.start.y;item.z=move.start.z+(move.end.z-move.start.z)*u;
    beetle.s=move.startS+(move.endS-move.startS)*u;item.walkPhase+=advance/(.05*individualScale(item))*TAU;item.walkSpeed=dt>0?advance/dt:0;item.state='walking';item.resting=false;
    if(move.distance-move.travelled<1e-10){item.x=move.end.x;item.z=move.end.z;beetle.s=move.endS;item.walkPhase=move.targetPhase;restBeetle(item);}
  }

  // Female leaf insects never enter a flight/jump state. The short axis,
  // timing, sway and reaction distances are observation/game tuning only.
  // .04m gait cycles stop on half-cycles, when both model tripods are grounded.
  function restLeaf(item) {
    const leaf=leaves.get(item.id);leaf.move=null;leaf.nextMoveAt=time+10+5*(1+Math.sin(item.phase+item.departures*1.1));
    item.state='resting';item.resting=true;item.walkSpeed=0;item.turnProgress=0;
  }
  function beginLeafWalk(item,reason,player) {
    const leaf=leaves.get(item.id),support=leaf.support,p=finitePlayer(player);
    const projected=p?(p.x-support.axis[0].x)*support.ux+(p.z-support.axis[0].z)*support.uz:leaf.s;
    let direction=p?(leaf.s>=projected?1:-1):(item.departures%2?-1:1),available=direction>0?support.length-leaf.s:leaf.s;
    if(reason==='spontaneous'&&available<.06){direction=-direction;available=direction>0?support.length-leaf.s:leaf.s;}
    const half=item.walkPhase/Math.PI,desired=Math.min(available,.08+.02*(item.departures%6));
    let targetHalf=Math.floor(half+desired/.02+1e-9),distance=Math.max(0,(targetHalf-half)*.02);
    // At an endpoint a grounded insect stays still. A mid-stride release may
    // need at most 20mm in the other supported direction to finish foot contact;
    // neither its actual capture position nor its gait phase is reset.
    if(distance<1e-8){
      targetHalf=Math.ceil(half-1e-9);distance=Math.max(0,(targetHalf-half)*.02);
      const other=direction>0?leaf.s:support.length-leaf.s;
      if(distance<1e-8||distance>other+1e-9){restLeaf(item);return false;}direction=-direction;
    }
    const endS=clamp(leaf.s+direction*distance,0,support.length),start={x:item.x,y:item.y,z:item.z};
    const end={x:support.axis[0].x+support.ux*endS,y:start.y,z:support.axis[0].z+support.uz*endS};
    const heading=Math.atan2(direction*support.ux,direction*support.uz),delta=Math.atan2(Math.sin(heading-item.heading),Math.cos(heading-item.heading));
    leaf.move={reason,start,end,startS:leaf.s,endS,distance,travelled:0,targetPhase:targetHalf*Math.PI,speed:.025+.0075*(1+Math.sin(item.phase+item.departures*.71)),turnStart:item.heading,delta,startedAt:time,turnDuration:Math.abs(delta)<.01?0:1.4+.8*Math.abs(delta)/Math.PI};
    if(reason!=='spontaneous'){leaf.retreated=true;leaf.reactAfter=time+8;}
    item.departures++;item.state=leaf.move.turnDuration?'turning':'walking';item.resting=false;item.walkSpeed=0;item.turnProgress=0;item.alert=0;item.flightBlend=0;return true;
  }
  function pauseLeafAtContact(item) {
    const leaf=leaves.get(item.id),move=leaf.move;if(!move)return;
    const targetHalf=Math.ceil(item.walkPhase/Math.PI-1e-9),left=Math.max(0,(targetHalf-item.walkPhase/Math.PI)*.02);
    if(left<1e-8){restLeaf(item);return;}
    const total=Math.min(move.distance,move.travelled+left),ratio=total/move.distance;
    move.end={x:move.start.x+(move.end.x-move.start.x)*ratio,y:move.start.y,z:move.start.z+(move.end.z-move.start.z)*ratio};move.endS=move.startS+(move.endS-move.startS)*ratio;move.distance=total;move.targetPhase=targetHalf*Math.PI;
  }
  function updateLeaf(item,dt,player,p) {
    const leaf=leaves.get(item.id),distance=p?Math.hypot(item.x-p.x,item.z-p.z):Infinity,near=!!p&&distance<2.2&&Math.abs(item.y-p.y)<2;
    if(near&&!leaf.near){
      leaf.pauseUntil=time+2;
      if(leaf.move?.reason==='released')leaf.retreated=true;
      else{leaf.retreated=false;pauseLeafAtContact(item);}
    }
    leaf.near=near;if(!near)leaf.retreated=false;
    const sway=(near?0:.035*Math.sin(time*1.05+item.phase));item.leafSway+=(sway-item.leafSway)*Math.min(1,dt*2);
    if(!leaf.move){
      if(near){
        item.state='still';item.resting=true;item.walkSpeed=0;
        // Quiet approach retains a broad capture window. Even very close
        // observers first get a pause; retreat uses the same slow gait speed.
        if(distance<(player.quiet?.55:.7)&&!leaf.retreated&&time>=leaf.pauseUntil&&time>=leaf.reactAfter){leaf.retreated=true;leaf.reactAfter=time+8;beginLeafWalk(item,'near',player);}
      }else if(time>=leaf.nextMoveAt)beginLeafWalk(item,'spontaneous',null);
      else{item.state='resting';item.resting=true;item.walkSpeed=0;}
    }
    const move=leaf.move;if(!move)return;
    if(item.state==='turning'){
      const u=clamp((time-move.startedAt)/move.turnDuration,0,1);item.heading=move.turnStart+move.delta*u;item.turnProgress=u;item.walkSpeed=0;
      if(u<1)return;item.state='walking';return;
    }
    const advance=Math.min(move.speed*dt,Math.max(0,move.distance-move.travelled));move.travelled+=advance;const u=clamp(move.travelled/move.distance,0,1);
    item.x=move.start.x+(move.end.x-move.start.x)*u;item.y=move.start.y;item.z=move.start.z+(move.end.z-move.start.z)*u;leaf.s=move.startS+(move.endS-move.startS)*u;
    item.walkPhase+=advance/.04*TAU;item.walkSpeed=dt>0?advance/dt:0;item.state='walking';item.resting=false;
    if(move.distance-move.travelled<1e-10){item.x=move.end.x;item.z=move.end.z;leaf.s=move.endS;item.walkPhase=move.targetPhase;restLeaf(item);}
  }

  // The new surface species has its own finite impulse/glide, not the flight,
  // grasshopper jump or leaf gait. Times/speeds/radii are game tuning only.
  function restStrider(item) {
    const strider=striders.get(item.id);strider.move=null;strider.nextMoveAt=time+5+2*(1+Math.sin(item.phase+item.departures*1.3));
    item.state='resting';item.resting=true;item.strokePhase=0;item.skateSpeed=0;item.flightBlend=0;
  }
  function beginSkate(item,reason,player) {
    const strider=striders.get(item.id),support=strider.support,p=finitePlayer(player),start={x:item.x,y:item.y,z:item.z};
    const choices=Array.from({length:16},(_,index)=>{
      const angle=item.phase+(item.departures+1)*2.399+index*TAU/16,end={x:support.center.x+support.radiusX*.86*Math.sin(angle),y:start.y,z:support.center.z+support.radiusZ*.86*Math.cos(angle)},dx=end.x-start.x,dz=end.z-start.z,distance=Math.hypot(dx,dz);
      return{end,dx,dz,distance,index,away:p?dx*(start.x-p.x)+dz*(start.z-p.z):0};
    }).filter(choice=>choice.distance>.015&&(!p||choice.away>=-1e-10));
    if(p)choices.sort((a,b)=>b.away-a.away||a.index-b.index);
    const choice=choices[0];if(!choice){restStrider(item);return false;}
    const distance=Math.min(choice.distance,.10+.02*(item.departures%7)),ratio=distance/choice.distance,end={x:start.x+choice.dx*ratio,y:start.y,z:start.z+choice.dz*ratio};
    // An ellipse is convex: the entire straight segment between these two
    // supported positions remains inside, without a late boundary clamp/snap.
    const rowDuration=.28,glideDuration=.92;
    strider.move={start,end,distance,startedAt:time,rowDuration,glideDuration,peakSpeed:2*distance/(rowDuration+glideDuration),heading:Math.atan2(choice.dx,choice.dz),reason};
    if(reason!=='spontaneous'){strider.handledThreat=true;strider.reactAfter=time+2.5;}
    item.departures++;item.state='rowing';item.resting=false;item.strokePhase=0;item.skateSpeed=0;item.flightBlend=0;item.alert=0;return true;
  }
  function updateStrider(item,dt,player,p) {
    const strider=striders.get(item.id);
    const distance=p?Math.hypot(item.x-p.x,item.z-p.z):Infinity,ground=p?heightAt(p.x,p.z):0,gap=p?Math.max(0,item.y-(p.y+.25),ground+.015-item.y):Infinity;
    const speed=Number.isFinite(player?.speed)?Math.max(0,player.speed):0;
    const threatened=!!p&&gap<1.5&&(Math.hypot(distance,gap)<.24||(!player.quiet&&speed>4&&distance<1.1));
    if(!threatened)strider.handledThreat=false;
    if(!strider.move){
      if(threatened&&!strider.handledThreat&&time>=strider.reactAfter){strider.handledThreat=true;strider.reactAfter=time+2.5;beginSkate(item,'startled',player);}
      else if(!threatened&&time>=strider.nextMoveAt)beginSkate(item,'spontaneous',null);
    }
    const move=strider.move;if(!move)return;
    const elapsed=Math.max(0,time-move.startedAt),row=move.rowDuration,glide=move.glideDuration;
    let travelled,speedNow;
    if(elapsed<row){const t=elapsed;travelled=move.peakSpeed*t*t/(2*row);speedNow=move.peakSpeed*t/row;item.strokePhase=t/row;item.state='rowing';}
    else{const t=Math.min(glide,elapsed-row);travelled=move.peakSpeed*(row/2+t-t*t/(2*glide));speedNow=move.peakSpeed*(1-t/glide);item.strokePhase=0;item.state='gliding';}
    const u=clamp(travelled/move.distance,0,1);item.x=move.start.x+(move.end.x-move.start.x)*u;item.y=move.start.y;item.z=move.start.z+(move.end.z-move.start.z)*u;
    item.heading+=clamp(Math.atan2(Math.sin(move.heading-item.heading),Math.cos(move.heading-item.heading)),-dt*5.5,dt*5.5);item.skateSpeed=speedNow;item.resting=false;item.flightBlend=0;
    if(elapsed>=row+glide){item.x=move.end.x;item.y=move.end.y;item.z=move.end.z;restStrider(item);}
  }

  function encounterAlertRate(item, player, p, dt) {
    if (!p) return 0;
    const near = Math.hypot(item.x-p.x, item.z-p.z);
    const verticalGap = Math.max(0, item.y-(p.y+.25), heightAt(p.x,p.z)+.15-item.y);
    if (verticalGap > 1.5) return 0;
    const intrusion = Math.hypot(near,verticalGap) < .36;
    const speed = Number.isFinite(player.speed) ? Math.max(0,player.speed) : 0;
    if (speed < .12 && !intrusion) return 0;
    const profile = CAPTURE_AWARENESS[item.species], quiet = !!player.quiet;
    let radius = quiet ? profile.quietRadius : speed > 4 ? profile.dashRadius : profile.walkRadius;
    if (previousPlayer && dt > 0 && (Math.hypot(item.x-previousPlayer.x,item.z-previousPlayer.z)-near)/dt < -.15) radius *= .7;
    if (near >= radius || hasLineOfSight(p,item) !== true) return 0;
    if (intrusion) return 10;
    return (quiet ? 1.8 : speed > 4 ? 4 : 2.5) * (1+(radius-near)/radius);
  }

  // Morpho flight/fruit visits use the same continuous route after a reaction.
  // Do not restart an excursion or the ordinary airborne loop while following it.
  const awarenessInFlight = item => !!item.excursion || (item.species === 'morpho' && !item.resting);
  // A fruit visitor may react as soon as it is feeding. The ordinary home-landing
  // recovery timer is not an extra three seconds of immunity on the fruit table.
  const awarenessSettling = item => time < item.settleUntil && !(item.species === 'morpho' && item.state === 'feeding' && item.resting && bait?.visitorId === item.id);

  // Called by the input owner only AFTER an actual failed capture. One visible
  // nearby insect can react; held, occluded and already airborne ones cannot.
  function startleFromNet(origin, direction) {
    const p = finitePlayer(origin);
    if (held || !p || !Number.isFinite(p.y) || !direction ||
        ![direction.x,direction.y,direction.z].every(Number.isFinite) ||
        Math.hypot(direction.x,direction.y,direction.z) < .001) return null;
    const list = candidates(p,direction).filter(({item,distance,dot}) =>
      ((CAPTURE_AWARENESS[item.species] && !awarenessInFlight(item) && !awarenessSettling(item) && time >= item.nextScareAt) || (item.species==='elephant'&&!['warning','retreating'].includes(item.elephantPhase)) || (item.species==='giantstag'&&!['warning','retreating'].includes(item.giantStagPhase)) || (item.species==='atlas'&&!['warning','retreating'].includes(item.atlasPhase)) || (item.species==='rhino'&&rhinos.get(item.id)?.reactive) || (item.species==='stag'&&stags.get(item.id)?.reactive)) && distance <= NET_STARTLE.range && dot >= NET_STARTLE.minDot);
    list.sort((a,b) => a.distance-b.distance);
    const item = list.find(candidate => hasLineOfSight(p,candidate.item) === true)?.item;
    if (!item) return null;
    if(item.species==='elephant'){if(!elephants.get(item.id).study.disturb(p))return null;syncElephant(item);return item;}
    if(item.species==='giantstag'){if(!giantStags.get(item.id).study.disturb(p))return null;syncGiantStag(item);return item;}
    if(item.species==='atlas'){if(!atlases.get(item.id).study.disturb())return null;syncAtlas(item);return item;}
    if(item.species==='rhino'){if(!rhinos.get(item.id).study.disturb(p))return null;syncRhino(item);return item;}
    if(item.species==='stag'){if(!stags.get(item.id).study.disturb(p))return null;syncStag(item);return item;}
    item.netStartleOrigin ||= {...p};
    item.alert = Math.max(.35,item.alert); item.awarenessStage = 'warning';
    return item;
  }

  function alertRate(item, player, p, dt) {
    if (!p) return 0;
    const near = Math.hypot(item.x - p.x, item.z - p.z);
    const verticalGap = Math.max(0, item.y - (p.y + .25), heightAt(p.x, p.z) + .15 - item.y);
    // Very close physical intrusion is not made invisible by quiet mode.
    if (Math.hypot(near, verticalGap) < .36) return 10;
    const speed = Number.isFinite(player.speed) ? Math.max(0, player.speed) : 0;
    if (speed < .12) return 0;
    const kind = item.species, quiet = !!player.quiet;
    let radius = quiet ? ({butterfly:.82,dragonfly:.94,cicada:1.02,morpho:.90}[kind]) :
      speed > 4 ? ({butterfly:2.65,dragonfly:3.0,cicada:3.25,morpho:3.0}[kind]) :
      ({butterfly:1.65,dragonfly:1.95,cicada:2.1,morpho:1.9}[kind]);
    // The first encounter is forgiving, not permanently immune to approaching it.
    if (item.beginner && item.age < 12 && item.departures === 0) radius *= .65;
    if (previousPlayer && dt > 0) {
      const oldDistance = Math.hypot(item.x - previousPlayer.x, item.z - previousPlayer.z);
      const closing = (oldDistance - near) / dt;
      if (closing < -.15) radius *= .7;
    }
    if (near >= radius || verticalGap > 1.5) return 0;
    const closeness = 1 + (radius - near) / radius;
    return (quiet ? 1.8 : speed > 4 ? 4 : 2.5) * closeness;
  }

  // Fixed workers use one clockwise two-lane ground loop, never opposing traffic.
  // Every vertex/home is on a 15mm half-cycle. .24m route headway is game tuning,
  // not colony/pathfinding simulation; a caught worker reserves its release spot.
  function restAnt(item,delay=.15) {
    const ant=ants.get(item.id);ant.move=null;ant.nextMoveAt=time+delay;
    item.state='resting';item.resting=true;item.walkSpeed=0;item.turnProgress=0;item.turnAngle=0;
  }
  function antGap(item) {
    const ant=ants.get(item.id);let gap=ant.support.length;
    for(const [id,other]of ants)if(id!==item.id)gap=Math.min(gap,(other.s-ant.s+ant.support.length)%ant.support.length);
    return gap;
  }
  function beginAntWalk(item) {
    const ant=ants.get(item.id),support=ant.support;
    if(ant.move){item.state=ant.move.elapsed<ant.move.turnDuration?'turning':'walking';item.resting=false;item.walkSpeed=0;return;}
    const seg=support.segments.find(seg=>ant.s<seg.end-1e-8);
    const heading=Math.atan2(seg.ux,seg.uz),delta=Math.atan2(Math.sin(heading-item.heading),Math.cos(heading-item.heading));
    ant.move={seg,endS:seg.end,turnStart:item.heading,delta,elapsed:0,turnDuration:Math.abs(delta)<1e-8?0:Math.max(.35,Math.ceil(Math.abs(delta)/(Math.PI/6)-1e-9)/3),stopPhase:null};
    item.state=ant.move.turnDuration?'turning':'walking';item.resting=false;item.walkSpeed=0;item.turnProgress=0;item.turnAngle=delta;item.departures++;
  }
  function updateAnt(item,dt,player,p) {
    if(dt<=0)return;
    const ant=ants.get(item.id),distance=p?Math.hypot(item.x-p.x,item.z-p.z):Infinity;
    const threat=!!p&&Math.abs(item.y-p.y)<2&&(distance<.28||(!player.quiet&&player.speed>4&&distance<.75));
    if(threat&&!ant.threatened&&ant.move&&item.state==='walking'){
      // A modest pause finishes the current half-step; never turn into the other lane.
      ant.move.stopPhase=Math.ceil(item.walkPhase/Math.PI-1e-9)*Math.PI;
    }
    ant.threatened=threat;
    if(!ant.move){
      if(time<ant.nextMoveAt)return;
      if(antGap(item)<.255-1e-8){item.state='waiting';item.resting=true;return;}
      beginAntWalk(item);
    }
    const move=ant.move;if(!move)return;
    if(item.state==='turning'){
      move.elapsed+=dt;const u=clamp(move.elapsed/move.turnDuration,0,1);item.heading=move.turnStart+move.delta*u;item.turnProgress=u;item.walkSpeed=0;
      if(u>=1)item.state='walking';return;
    }
    const half=item.walkPhase/Math.PI,grounded=Math.abs(half-Math.round(half))<1e-8;
    if(grounded&&antGap(item)<.255-1e-8){item.state='waiting';item.resting=true;item.walkSpeed=0;return;}
    const nextHalf=Math.floor(half+1e-8)+1,halfLeft=Math.max(0,(nextHalf-half)*.015);
    const left=move.endS-ant.s,phaseLeft=move.stopPhase===null?Infinity:Math.max(0,(move.stopPhase-item.walkPhase)/TAU*.03),advance=Math.min(.055*dt,left,phaseLeft,halfLeft);
    const nextS=ant.s+advance,along=nextS-move.seg.start,x=move.seg.a.x+move.seg.ux*along,z=move.seg.a.z+move.seg.uz*along,y=heightAt(x,z);
    if(!Number.isFinite(y)){item.walkSpeed=0;return;}
    ant.s=nextS;item.x=x;item.y=y;item.z=z;item.routePhase=ant.s/ant.support.length;item.walkPhase+=advance/.03*TAU;item.walkSpeed=advance/dt;item.resting=false;item.state='walking';
    if(left-advance<1e-9){
      const end=move.seg.b;item.x=end.x;item.z=end.z;item.y=heightAt(end.x,end.z);ant.s=move.endS>=ant.support.length-1e-8?0:move.endS;
      item.routePhase=ant.s/ant.support.length;item.walkPhase=Math.round(item.walkPhase/Math.PI)*Math.PI;
      restAnt(item);
    }else if(phaseLeft-advance<1e-9){item.walkPhase=move.stopPhase;restAnt(item,1.25);}
  }

  // A male firefly's finite local flight is separate from the old flight rules.
  // Wing preparation/closure happens on a real leaf; airborne release has no
  // stationary opening hold. No pulse, light phase or independent timer exists.
  function beginFireflyFlight(item,reason) {
    const fly=fireflies.get(item.id),support=fly.support;
    const supported=support.points.findIndex(p=>Math.hypot(item.x-p.x,item.y-p.y,item.z-p.z)<1e-7);
    const target=supported>=0?1-supported:1-fly.perch,end={...support.points[target]},start={x:item.x,y:item.y,z:item.z};
    const heading=Math.atan2(end.x-start.x,end.z-start.z),delta=Math.atan2(Math.sin(heading-item.heading),Math.cos(heading-item.heading)),normal=support.normal;
    const c1=supported>=0?{x:start.x+normal.x*.3,y:start.y+normal.y*.3+.2,z:start.z+normal.z*.3}:{x:start.x,y:Math.min(support.ceiling,start.y+.2),z:start.z};
    const c2={x:end.x+normal.x*.3,y:end.y+normal.y*.3+.2,z:end.z+normal.z*.3};
    for(const control of [c1,c2]){control.x=clamp(control.x,-flightBounds,flightBounds);control.z=clamp(control.z,-flightBounds,flightBounds);control.y=Math.min(control.y,support.ceiling);}
    fly.move={start,end,c1,c2,target,elapsed:0,opening:0,closing:0,blendStart:item.flightBlend,airStart:item.airBlend,headingStart:item.heading,heading:item.heading+delta,phase:supported>=0?'opening':'flight',duration:3.6+.4*(1+Math.sin(item.phase+item.departures))};
    item.flightStart={...start};item.flightEnd={...end};item.flightProgress=0;item.resting=supported>=0;item.state=supported>=0?'opening':'flying';item.departures++;fly.threat=0;fly.reactAfter=time+2;
  }
  function updateFirefly(item,dt,player,p) {
    if(dt<=0)return;
    const fly=fireflies.get(item.id);
    if(!fly.move){
      const near=p?Math.hypot(item.x-p.x,item.z-p.z):Infinity,vertical=p?Math.abs(item.y-p.y):Infinity;
      const speed=Number.isFinite(player?.speed)?Math.max(0,player.speed):0;
      const threat=vertical<1.8&&(near<.35||(!player?.quiet&&speed>4&&near<1.8)||(!player?.quiet&&speed>.1&&near<.8));
      fly.threat=threat?fly.threat+dt:0;
      if(fly.threat>=.25&&time>=fly.reactAfter)beginFireflyFlight(item,'startled');
      else if(time>=fly.nextMoveAt)beginFireflyFlight(item,'spontaneous');
      else return;
    }
    const move=fly.move;
    if(move.phase==='opening'){
      move.opening+=dt;const u=clamp(move.opening/.7,0,1);item.flightBlend=move.blendStart+(1-move.blendStart)*u;item.resting=true;
      if(u>=1){move.phase='flight';move.blendStart=1;item.state='flying';item.resting=false;}return;
    }
    if(move.phase==='closing'){
      move.closing+=dt;item.flightBlend=1-clamp(move.closing/.7,0,1);item.resting=true;
      if(move.closing>=.7){fly.move=null;fly.perch=move.target;fly.nextMoveAt=time+8+3*(1+Math.sin(item.phase+item.departures));fly.reactAfter=time+1;item.flightBlend=0;item.state='resting';item.flightProgress=0;item.flightStart=null;item.flightEnd=null;item.airBlend=0;}return;
    }
    move.elapsed+=dt;const u=clamp(move.elapsed/move.duration,0,1),q=u*u*(3-2*u),v=1-q;
    for(const key of ['x','y','z'])item[key]=v*v*v*move.start[key]+3*v*v*q*move.c1[key]+3*v*q*q*move.c2[key]+q*q*q*move.end[key];
    item.flightProgress=u;item.flightBlend=move.blendStart+(1-move.blendStart)*clamp(move.elapsed/.3,0,1);item.wingPhase+=dt*42;item.resting=false;item.state=u>.7?'landing':'flying';
    const smooth=t=>t*t*(3-2*t);
    item.airBlend=(move.airStart+(1-move.airStart)*smooth(clamp(u/.2,0,1)))*smooth(clamp((1-u)/.2,0,1));
    if(u<.3)item.heading=move.headingStart+(move.heading-move.headingStart)*smooth(u/.3);
    else{const homeDelta=Math.atan2(Math.sin(-move.heading),Math.cos(-move.heading));item.heading=move.heading+homeDelta*smooth(clamp((u-.7)/.3,0,1));}
    if(u>=1){item.x=move.end.x;item.y=move.end.y;item.z=move.end.z;move.phase='closing';item.state='closing';item.resting=true;item.flightBlend=1;}
  }

  function update(dt, player) {
    dt = clamp(Number.isFinite(dt) ? dt : 0, 0, .1);
    time += dt;
    const p = finitePlayer(player);
    updateBait(player,p);
    if(dt>0)updateLogFruit(p);
    for (const item of items) {
      item.age += dt;
      if (item.species === 'swallowtail') { if (!item.caught) updateSwallowtail(item,dt,player,p); continue; }
      if (item.species === 'bee') { if (!item.caught) updateBee(item,dt,player,p); continue; }
      if (item.species === 'stag') { if (!item.caught) updateStag(item,dt,player,p); continue; }
      if (item.species === 'metallifer') { if (!item.caught) updateMetallifer(item,dt,player,p); continue; }
      if (item.species === 'elephant') { if (!item.caught) updateElephant(item,dt,player,p); continue; }
      if (item.species === 'giantstag') { if (!item.caught) updateGiantStag(item,dt,player,p); continue; }
      if (item.species === 'atlas') { if (!item.caught) updateAtlas(item,dt,player,p); continue; }
      if (item.species === 'longhorn') { if (!item.caught) updateLonghorn(item,dt,player,p); continue; }
      if (item.species === 'jewel') { if (!item.caught) updateJewel(item,dt,player,p); continue; }
      if (item.species === 'rhino') { if (!item.caught) updateRhino(item,dt,player,p); continue; }
      if (item.species === 'ladybird') { if (!item.caught) updateLadybird(item,dt,player,p); continue; }
      if (item.species === 'mantis') { if (!item.caught) updateMantis(item,dt,player,p); continue; }
      if (item.species === 'divingbeetle') { if (!item.caught) updateDiving(item,dt,player,p); continue; }
      if (item.species === 'dungbeetle') { if (!item.caught) { dungStudies.get(item.id).study.update(dt);syncDung(item); } continue; }
      if (item.species === 'grasshopper') { if (!item.caught) updateGrasshopper(item,dt,player,p); continue; }
      if (item.species === 'hercules') { if (!item.caught) updateHercules(item,dt,player,p); continue; }
      if (item.species === 'leafinsect') { if (!item.caught) updateLeaf(item,dt,player,p); continue; }
      if (item.species === 'waterstrider') { if (!item.caught) updateStrider(item,dt,player,p); continue; }
      if (item.species === 'leafcutterant') { if (!item.caught) updateAnt(item,dt,player,p); continue; }
      if (item.species === 'firefly') { if (!item.caught) updateFirefly(item,dt,player,p); continue; }
      item.wingPhase += dt * (item.species === 'morpho' ? 8.5 : item.species === 'butterfly' ? 12 : 70);
      if (item.caught) continue;
      if (CAPTURE_AWARENESS[item.species]) {
        const inFlight = awarenessInFlight(item), settling = awarenessSettling(item);
        const rate = inFlight || settling ? 0 : encounterAlertRate(item,player,p,dt);
        const shouldFlee = advanceAwareness(item,dt,rate,inFlight,settling);
        if (shouldFlee && time >= item.nextScareAt) depart(item,'startled',item.netStartleOrigin || player);
      } else {
        const rate = alertRate(item, player, p, dt);
        item.alert = clamp(item.alert + dt * (rate || -3), 0, 1.2);
        if (rate && item.alert >= 1 && time >= item.nextScareAt) depart(item, 'startled', player);
      }
      let tx = item.home.x, ty = item.home.y, tz = item.home.z;
      let resting = true, flightStrength = 0, landing = false;
      if (item.excursion) {
        const route = item.excursion, u = clamp((time - route.startedAt) / route.duration, 0, 1);
        if (u < 1) {
          const v = 1 - u, style = flightStyle[item.species], end = route.end || item.home;
          tx = v*v*v*route.start.x + 3*v*v*u*route.c1.x + 3*v*u*u*route.c2.x + u*u*u*end.x;
          ty = v*v*v*route.start.y + 3*v*v*u*route.c1.y + 3*v*u*u*route.c2.y + u*u*u*end.y;
          tz = v*v*v*route.start.z + 3*v*v*u*route.c1.z + 3*v*u*u*route.c2.z + u*u*u*end.z;
          const envelope = Math.sin(Math.PI*u), flutter = Math.sin((time-route.startedAt)*style.frequency + item.phase)*style.flutter*envelope;
          tx += route.sideX*flutter; tz += route.sideZ*flutter;
          ty += Math.sin((time-route.startedAt)*style.frequency*1.3)*style.flutter*.45*envelope;
          ty = Math.max(ty, heightAt(tx,tz) + .45);
          resting = false; landing = u > .78;
          item.state = landing ? 'landing' : route.reason;
          flightStrength = landing ? clamp((1-u)/.22, .12, 1) : 1;
        } else {
          item.excursion = null; item.settleUntil = time + 3;
          if (CAPTURE_AWARENESS[item.species]) item.awarenessStage = 'settling';
        }
      }
      const atBait = !item.excursion && bait?.visitorId === item.id;
      if (atBait) {
        tx=bait.x;ty=bait.y;tz=bait.z;
        const distance=Math.hypot(tx-item.x,ty-item.y,tz-item.z);
        resting=distance<.035;landing=!resting;flightStrength=resting?0:clamp(distance/.55,0,.5);
        item.state=resting?'feeding':'landing';
        if (resting && bait.status !== 'feeding') { bait.status='feeding';bait.feedUntil=time+7; }
      } else if (!item.excursion) {
        const settling = time < item.settleUntil;
        const homeDistance = Math.hypot(item.x-item.home.x,item.y-item.home.y,item.z-item.home.z);
        if (settling && homeDistance > .055) {
          resting = false; landing = true; item.state = 'landing'; flightStrength = clamp(homeDistance/.55, 0, .5);
        } else if (!settling && item.species !== 'cicada') {
          // Ordinary unprovoked perch / loop timing stays the same as v0.1.5.
          const period = item.species === 'morpho' ? 22 : item.species === 'butterfly' ? 17 : 15;
          const cycle = (time + (item.beginner ? 0 : item.phase * 2)) % period;
          const restTime = item.species === 'morpho' ? 13 : item.species === 'butterfly' ? 11 : 9;
          if (cycle > restTime) {
            resting = false;
            const u = (cycle - restTime) / (period - restTime), envelope = Math.sin(u * Math.PI);
            const radius = item.species === 'morpho' ? 2.5 : item.species === 'butterfly' ? 1.35 : 2.2;
            tx += Math.cos(u * TAU + item.phase) * radius * envelope;
            tz += Math.sin(u * TAU + item.phase) * radius * envelope;
            ty += envelope * (.35 + .14 * Math.sin(u * TAU * 2));
          }
          item.state = resting ? 'resting' : 'flying'; flightStrength = resting ? 0 : 1;
        } else item.state = 'resting';
      }
      // Perched bodies stay on their support; wing motion remains in the renderer.
      const smoothing = 1 - Math.exp(-dt * (item.state === 'startled' ? 3.2 : 5));
      const dx = tx - item.x, dz = tz - item.z;
      let targetHeading = null;
      if (atBait) targetHeading = 0;
      else if (item.species === 'cicada' && (resting || landing)) targetHeading = item.homeHeading;
      else if (!resting && Math.hypot(dx, dz) > .015) targetHeading = Math.atan2(dx, dz);
      if (targetHeading !== null) {
        const delta = Math.atan2(Math.sin(targetHeading - item.heading), Math.cos(targetHeading - item.heading));
        item.heading += delta * (1 - Math.exp(-dt * 4));
      }
      item.x += dx * smoothing; item.y += (ty - item.y) * smoothing; item.z += dz * smoothing;
      item.resting = resting;
      item.flightBlend += (flightStrength - item.flightBlend) * Math.min(1, dt * 8);
    }
    previousPlayer = p;
  }

  function candidates(player, direction) {
    if (!player || !direction || held) return [];
    const p = eye(player);
    const dl = Math.hypot(direction.x, direction.y, direction.z) || 1;
    return items.filter(i => !i.caught).map(item => {
      const dx = item.x - p.x, dy = item.y - p.y, dz = item.z - p.z;
      const distance = Math.hypot(dx, dy, dz);
      const dot = (dx * direction.x + dy * direction.y + dz * direction.z) / (Math.max(.001, distance) * dl);
      return { item, distance, dot };
    });
  }
  function describe(candidate) {
    const { item, distance, dot } = candidate;
    const catchable = distance <= 2.6 && dot >= .82;
    return { item, distance, catchable, reason: catchable ? 'あみが届きます' : distance > 2.6 ? 'そっと近づいてみよう' : '虫に向かってあみを構えよう' };
  }
  function findTarget(player, direction) {
    const list = candidates(player, direction).filter(c => c.distance <= 17 && c.dot > (c.distance <= 2.6 ? .82 : .97));
    list.sort((a,b) => ((1 - a.dot) * 18 + a.distance * .025) - ((1 - b.dot) * 18 + b.distance * .025));
    const from=player?eye(player):null,target=list.find(c=>hasLineOfSight(from,c.item) === true);
    return target ? describe(target) : null;
  }
  function swing(player, direction) {
    if (held) return { ok: false, reason: '観察した虫を、先に逃がしてあげよう' };
    const list = candidates(player, direction).filter(c => c.distance <= 2.6 && c.dot >= .82);
    list.sort((a,b) => (1-a.dot)*8+a.distance - ((1-b.dot)*8+b.distance));
    // Only the new small ant group needs HUD/worker identity disambiguation.
    // No ant in the capture cone means the established eight-species path is exact.
    const shown=list.some(c=>c.item.species==='leafcutterant')?findTarget(player,direction):null;
    let blocked=0;
    const from=player?eye(player):null,candidate=shown?.catchable&&shown.item.species==='leafcutterant'?list.find(c=>c.item===shown.item):list.find(c=>{
      const visible=hasLineOfSight(from,c.item);if(visible===false)blocked++;return visible===true;
    });
    if (!candidate) {
      // Only explicit vetoes establish obstruction; invalid adapter answers do not.
      if(list.length>0&&blocked===list.length)return {ok:false,reason:'空振り。遮るもののない角度から、あみを構えてみよう'};
      const target = findTarget(player, direction);
      return { ok: false, reason: target ? target.reason : '空振り。虫に向かって、もう少し近くで' };
    }
    held = candidate.item; if (CAPTURE_AWARENESS[held.species]) clearAwareness(held); if (bait?.visitorId === held.id) detachVisitor(); held.caught = true; held.state = 'caught'; caughtFrom = eye(player); catches++;
    if (held.species === 'swallowtail') { swallowtails.get(held.id).study.capture();syncSwallowtail(held); }
    if (held.species === 'bee') { bees.get(held.id).study.capture();syncBee(held); }
    if (held.species === 'stag') { stags.get(held.id).study.capture();syncStag(held); }
    if (held.species === 'metallifer') { metallifers.get(held.id).study.capture();syncMetallifer(held); }
    if (held.species === 'elephant') { elephants.get(held.id).study.capture();syncElephant(held); }
    if (held.species === 'giantstag') { giantStags.get(held.id).study.capture();syncGiantStag(held); }
    if (held.species === 'atlas') { atlases.get(held.id).study.capture();syncAtlas(held); }
    if (held.species === 'longhorn') { longhorns.get(held.id).study.capture();syncLonghorn(held); }
    if (held.species === 'jewel') { jewels.get(held.id).study.capture();syncJewel(held); }
    if (held.species === 'rhino') { rhinos.get(held.id).study.capture();syncRhino(held); }
    if (held.species === 'ladybird') { ladybirds.get(held.id).study.capture();syncLadybird(held); }
    if (held.species === 'mantis') { mantises.get(held.id).study.capture();syncMantis(held); }
    if (held.species === 'divingbeetle') { divers.get(held.id).study.capture();syncDiving(held); }
    if (held.species === 'dungbeetle') { dungStudies.get(held.id).study.capture();syncDung(held); }
    if (held.species === 'grasshopper') { hoppers.get(held.id).jump=null;held.airborne=false;held.jumpProgress=0;held.resting=true; }
    if (logVisit?.id===held.id)finishLogVisit();
    if (held.species === 'hercules') { beetles.get(held.id).move=null;held.walkSpeed=0;held.resting=true; }
    if (held.species === 'leafinsect') { leaves.get(held.id).move=null;held.walkSpeed=0;held.resting=true; }
    if (held.species === 'waterstrider') { striders.get(held.id).move=null;held.skateSpeed=0;held.resting=true; }
    if (held.species === 'leafcutterant') { held.walkSpeed=0;held.resting=true; }
    return { ok: true, item: held };
  }
  function release(player) {
    if (!held) return null;
    const item = held;
    item.caught = false;
    // Keep the actual capture position, including a catch made in mid-flight.
    // Start a continuous departure; never teleport to home or freeze on a perch.
    depart(item, 'released', finitePlayer(player) || caughtFrom || previousPlayer);
    held = null; caughtFrom = null;
    return item;
  }

  // A retained insect is absent from the field, not the current inspection.
  // Keep existing capture/update/audio checks on caught, with an explicit tag.
  function markCompanion(item) {
    if (item.companion) return;
    item.companion=true;item.caught=true;item.state='caught';
    if(item.species==='rhino')rhinos.get(item.id).study.capture();
    if(item.species==='stag')stags.get(item.id).study.capture();
    if(item.species==='metallifer')metallifers.get(item.id).study.capture();
    if(item.species==='elephant')elephants.get(item.id).study.capture();
    if(item.species==='giantstag')giantStags.get(item.id).study.capture();
    if(item.species==='atlas')atlases.get(item.id).study.capture();
    if(item.species==='hercules'){beetles.get(item.id).move=null;item.walkSpeed=0;}
  }
  function setCompanions(origins=[],player) {
    if(!Array.isArray(origins))throw new TypeError('Invalid companion origins');
    companionOrigins=origins.filter(o=>o&&['hercules','rhino','stag','metallifer','atlas','giantstag','elephant'].includes(o.species)&&typeof o.id==='string').map(o=>({id:o.id,species:o.species}));
    for(const item of items){
      const retained=companionOrigins.some(o=>o.id===item.id&&o.species===item.species);
      if(retained&&item!==held)markCompanion(item);
      else if(!retained&&item.companion){item.companion=false;item.caught=false;depart(item,'released',finitePlayer(player)||previousPlayer);}
    }
  }
  function retain() {
    if(!held||!['hercules','rhino','stag','metallifer','atlas','giantstag','elephant'].includes(held.species))return null;
    const item=held;held=null;caughtFrom=null;markCompanion(item);
    if(!companionOrigins.some(o=>o.id===item.id))companionOrigins.push({id:item.id,species:item.species});
    return item;
  }

  return { items, update, findTarget, swing, startleFromNet, release, retain, setCompanions, reset, placeBait, removeBait, placeLogFruit, removeLogFruit, get logFruit() { return logFruit?{active:true,type:logFruit.type,remaining:Math.max(0,logFruit.expiresAt-time),visitorId:logFruit.visitorId,status:logFruit.status}:null; }, get dungBall() { return dungBall(); }, get bait() { return bait ? {active:true,type:bait.type,x:bait.x,y:bait.y,z:bait.z,remaining:Math.max(0,bait.expiresAt-time),visitorId:bait.visitorId,status:bait.status} : null; }, get caught() { return held; }, get time() { return time; }, get catches() { return catches; } };
}
