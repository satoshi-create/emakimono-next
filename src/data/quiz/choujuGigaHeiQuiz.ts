import type { QuizDefinition } from "@/types/quiz";

/** 鳥獣人物戯画 丙巻（third）向け観察力クイズ */
export const CHOJU_GIGA_HEI_QUIZ: QuizDefinition = {
  id: "chouju-giga-hei",
  titleen: "Chōjū-jinbutsu-giga_third",
  version: 1,
  ranks: [
    {
      id: "master",
      minCorrect: 5,
      maxCorrect: 5,
      labelJa: "絵巻マスター",
      labelEn: "Emaki Master",
    },
    {
      id: "observer",
      minCorrect: 3,
      maxCorrect: 4,
      labelJa: "観察の達人",
      labelEn: "Keen Observer",
    },
    {
      id: "beginner",
      minCorrect: 0,
      maxCorrect: 2,
      labelJa: "絵巻ビギナー",
      labelEn: "Emaki Beginner",
    },
  ],
  questions: [
    {
      id: "q1",
      order: 1,
      promptJa: "鳥獣戯画「丙巻」の構成について、甲巻・乙巻にはない最大の特徴は何でしょう？",
      promptEn: "What is the most distinct feature of the composition in Scroll 3 (Hei)?",
      choices: [
        { id: "c1", labelJa: "全編にわたって文字（詞書）しか書かれていない", labelEn: "It consists only of written narrative without paintings" },
        { id: "c2", labelJa: "前半に「人間」、後半に「動物」が登場する二部構成になっている", labelEn: "It has a two-part structure featuring humans in the first half and animals in the second half" },
        { id: "c3", labelJa: "すべて夜の風景として黒く塗られている", labelEn: "Everything is painted in pitch black as night scenes" },
        { id: "c4", labelJa: "中国の皇帝の歴史が描かれている", labelEn: "It depicts the history of Chinese emperors" }
      ],
      correctIndex: 1,
      explanationJa: "丙巻は前半（第1〜7段）が囲碁や双六など庶民の遊戯を描く「人間戯画」、後半（第8〜14段）が動物たちが登場する「動物戯画」という二部構成になっています。",
      explanationEn: "Scroll 3 features caricatures of humans playing games in the first half (ch 1-7) and animals in the second half (ch 8-14).",
      jump: { type: "chapter", chapter: 1 },
      jumpLabelJa: "前半 人間の遊戯（囲碁）を見る",
      jumpLabelEn: "View First Half: Human Games"
    },
    {
      id: "q2",
      order: 2,
      promptJa: "近代の修理で判明した、丙巻の「前半（人間）」と「後半（動物）」に関する驚きの事実とは何でしょう？",
      promptEn: "What surprising fact about Scroll 3 was revealed during modern conservation?",
      choices: [
        { id: "c1", labelJa: "外国から輸入された紙に描かれていた", labelEn: "It was painted on imported foreign paper" },
        { id: "c2", labelJa: "元々は1枚の和紙の「表」と「裏」にそれぞれ描かれていた", labelEn: "The two parts were originally painted on the front and back of the exact same sheets of paper" },
        { id: "c3", labelJa: "絵の下に金塊が隠されていた", labelEn: "Gold ingots were hidden beneath the scroll sheets" },
        { id: "c4", labelJa: "水に濡らすと絵が消える仕掛けになっていた", labelEn: "The illustrations disappeared when dipped in water" }
      ],
      correctIndex: 1,
      explanationJa: "和紙の表に人間、裏に動物が描かれており、江戸時代に紙を薄く2枚に剥ぎ分ける「相剥（あいへ）ぎ」の技術で1本の巻物に仕立て直されました。第8段（闘鶏）から後半の動物編が始まります。",
      explanationEn: "Originally painted on the recto and verso of single sheets, they were later split into two using paper-splitting techniques. Animal scenes begin at chapter 8.",
      jump: { type: "chapter", chapter: 8 },
      jumpLabelJa: "後半 動物戯画の始まりを見る",
      jumpLabelEn: "View Beginning of Animal Scenes"
    },
    {
      id: "q3",
      order: 3,
      promptJa: "丙巻の前半で描かれている、互いに首に紐をかけて引っ張り合い、我慢比べをする競技は何でしょう？",
      promptEn: "What endurance contest depicted in the first half involves opponents pulling ropes tied around their necks?",
      choices: [
        { id: "c1", labelJa: "首引き（くびひき）", labelEn: "Neck Tug-of-war (Kubihiki)" },
        { id: "c2", labelJa: "二人羽織", labelEn: "Nininbaori" },
        { id: "c3", labelJa: "綱引き", labelEn: "Standard Tug-of-war" },
        { id: "c4", labelJa: "相撲", labelEn: "Sumo wrestling" }
      ],
      correctIndex: 0,
      explanationJa: "第5段「首引き ― 忍耐の試練」では、首に縄を掛け合って踏ん張る庶民の真剣かつユーモラスな力比べが描かれています。",
      explanationEn: "Chapter 5 depicts 'Kubihiki', where opponents strain against each other with a rope looped around their necks in a test of endurance.",
      jump: { type: "chapter", chapter: 5 },
      jumpLabelJa: "首引きのシーンを見る",
      jumpLabelEn: "View Neck-pulling Scene"
    },
    {
      id: "q4",
      order: 4,
      promptJa: "丙巻の第10段で、猿たちが真剣な表情で馬にまたがって競い合っている行事は何でしょう？",
      promptEn: "In chapter 10 of Scroll 3, what event shows monkeys intensely riding horses across the field?",
      choices: [
        { id: "c1", labelJa: "競馬（くらべうま）", labelEn: "Horse racing (Kurabeuma)" },
        { id: "c2", labelJa: "流鏑馬（やぶさめ）", labelEn: "Yabusame (Mounted archery)" },
        { id: "c3", labelJa: "ポロ競技", labelEn: "Polo match" },
        { id: "c4", labelJa: "牛車引き", labelEn: "Ox-cart racing" }
      ],
      correctIndex: 0,
      explanationJa: "第10段「猿たちの競馬祭り」では、貴族の宮廷行事であった競馬を猿たちが行うという見立てで、疾走感とユーモア豊かに描かれています。",
      explanationEn: "Chapter 10 depicts monkeys staging their own version of aristocratic horse racing (Kurabeuma), combining speed with comedy.",
      jump: { type: "chapter", chapter: 10 },
      jumpLabelJa: "猿たちの競馬を見る",
      jumpLabelEn: "View Monkeys' Horse Racing"
    },
    {
      id: "q5",
      order: 5,
      promptJa: "鳥獣戯画（全4巻）のうち、動物が一切登場せず「人間しか出てこない」巻はどれでしょう？",
      promptEn: "Among all four scrolls of Chōjū-giga, which scroll features ONLY humans with zero animals?",
      choices: [
        { id: "c1", labelJa: "甲巻", labelEn: "Scroll 1 (Kou)" },
        { id: "c2", labelJa: "乙巻", labelEn: "Scroll 2 (Otsu)" },
        { id: "c3", labelJa: "丙巻", labelEn: "Scroll 3 (Hei)" },
        { id: "c4", labelJa: "丁巻", labelEn: "Scroll 4 (Tei)" }
      ],
      correctIndex: 3,
      explanationJa: "「鳥獣戯画」という名称でありながら、続く「丁巻」には動物が全く登場せず、すべて人間の滑稽な儀式や勝負事が描かれています。",
      explanationEn: "Despite the title 'Birds and Beasts', Scroll 4 (Tei) features absolutely no animals, depicting only human ceremonies and antics."
    }
  ],
  resultLinks: [
    {
      type: "path",
      path: "/Chōjū-jinbutsu-giga_fourth?quiz=1",
      labelJa: "鳥獣戯画 丁巻クイズに挑戦する",
      labelEn: "Try Chōjū-jinbutsu-giga Scroll 4 Quiz",
    },
    {
      type: "scroll",
      titleen: "Chōjū-jinbutsu-giga_fourth",
      labelJa: "鳥獣戯画 丁巻を見る",
      labelEn: "View Chōjū-jinbutsu-giga Scroll 4",
    },
    {
      type: "path",
      path: "/Chōjū-jinbutsu-giga_second?quiz=1",
      labelJa: "鳥獣戯画 乙巻クイズに挑戦する",
      labelEn: "Try Chōjū-jinbutsu-giga Scroll 2 Quiz",
    },
    {
      type: "path",
      path: "/type/emaki",
      labelJa: "絵巻一覧に戻る",
      labelEn: "Back to Emaki List",
    },
  ]
};
