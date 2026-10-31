import type { QuizDefinition } from "@/types/quiz";

/** 鳥獣人物戯画 丁巻（fourth）向け観察力クイズ */
export const CHOJU_GIGA_TEI_QUIZ: QuizDefinition = {
  id: "chouju-giga-tei",
  titleen: "Chōjū-jinbutsu-giga_fourth",
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
      promptJa: "鳥獣戯画「丁巻」に登場するキャラクターについて、正しい説明はどれでしょう？",
      promptEn: "Which description is correct regarding the characters appearing in Scroll 4 (Tei)?",
      choices: [
        { id: "c1", labelJa: "甲巻のように兎や蛙がたくさん登場する", labelEn: "Many rabbits and frogs appear, just like in Scroll 1" },
        { id: "c2", labelJa: "動物は一切登場せず、人間しか描かれていない", labelEn: "No animals appear at all; only humans are depicted" },
        { id: "c3", labelJa: "妖怪やお化けが街を行進している", labelEn: "Monsters and yokai are marching through the streets" },
        { id: "c4", labelJa: "鳥の羽を生やした人間が登場する", labelEn: "Humans with bird wings appear" }
      ],
      correctIndex: 1,
      explanationJa: "「鳥獣人物戯画」の名を持ちながら、丁巻には動物が一切描かれておらず、全編を通して人間たちの儀式や競技、風刺劇のみで構成されています。",
      explanationEn: "Despite being part of the Chōjū-giga, Scroll 4 features only humans, focusing entirely on satire of rituals and contests.",
      jump: { type: "chapter", chapter: 1 },
      jumpLabelJa: "丁巻の冒頭シーンを見る",
      jumpLabelEn: "View Beginning of Scroll 4"
    },
    {
      id: "q2",
      order: 2,
      promptJa: "「公卿たちの論義の座」の場面で、座っている貴人たちのうち1人だけに施された特別な描き方は何でしょう？",
      promptEn: "What special painting technique was applied to only one of the courtiers in the debate scene?",
      choices: [
        { id: "c1", labelJa: "1人だけ金箔が貼られている", labelEn: "Only one noble is covered in gold leaf" },
        { id: "c2", labelJa: "1人だけ実在の人物の特徴をリアルに写した「似絵（にせえ）」のように描かれている", labelEn: "Only one noble is depicted realistically in the Nise-e portrait style" },
        { id: "c3", labelJa: "1人だけ顔が真っ黒に塗りつぶされている", labelEn: "Only one noble's face is blacked out" },
        { id: "c4", labelJa: "1人だけ後ろを向いて寝ている", labelEn: "Only one noble is asleep facing backward" }
      ],
      correctIndex: 1,
      explanationJa: "第8段「公卿たちの論義の座」では、簡略化された他の貴人の顔立ちに対し、1人だけ実在の特定の人物をモデルにしたかのようなリアルな肖像画風（似絵）のタッチで描かれています。",
      explanationEn: "In Chapter 8, while courtiers are drawn in simplified caricature, one individual is depicted in a realistic portrait style (Nise-e).",
      jump: { type: "chapter", chapter: 8 },
      jumpLabelJa: "公卿たちの論義シーンを見る",
      jumpLabelEn: "View Court Nobles Scene"
    },
    {
      id: "q3",
      order: 3,
      promptJa: "丁巻全体の絵のタッチ（描線）の特徴として最もふさわしいものはどれでしょう？",
      promptEn: "Which description best characterizes the brushwork style throughout Scroll 4?",
      choices: [
        { id: "c1", labelJa: "細い線で幾重にも塗り重ねられた精密画", labelEn: "Delicate and heavily layered precision painting" },
        { id: "c2", labelJa: "腕の立つ絵師が一気に走り書きしたような、勢いとスピード感のある筆致", labelEn: "Vigorous, rapid, and expressive brushstrokes painted at high speed" },
        { id: "c3", labelJa: "定規を使ったような幾何学的で直線的な線", labelEn: "Geometric straight lines drawn with a ruler" },
        { id: "c4", labelJa: "墨を使わず赤や青の極彩色のみで描かれている", labelEn: "Bright colors painted without using black ink" }
      ],
      correctIndex: 1,
      explanationJa: "丁巻は甲・乙・丙巻の端正な描線とは異なり、まるで一気に描き殴ったかのような、荒々しくも卓越したスピード感のある筆致（草名・略筆）が特徴です。第4段の流鏑馬などでその疾走感がよく表れています。",
      explanationEn: "Scroll 4 is marked by dynamic, rough, and rapid brushwork. Chapter 4's Yabusame mounted archery vividly displays this dynamic speed.",
      jump: { type: "chapter", chapter: 4 },
      jumpLabelJa: "疾走する流鏑馬の場面を見る",
      jumpLabelEn: "View Yabusame Scene"
    },
    {
      id: "q4",
      order: 4,
      promptJa: "丁巻の第2段で描かれている、法師や呪術者たちが奇跡や法力を競い合う場面を何と呼ぶでしょう？",
      promptEn: "In Chapter 2 of Scroll 4, what is the contest of mystical powers and miracles called?",
      choices: [
        { id: "c1", labelJa: "験くらべ（げんくらべ）", labelEn: "Genkurabe (Contest of Mystical Prowess)" },
        { id: "c2", labelJa: "腕相撲", labelEn: "Arm wrestling" },
        { id: "c3", labelJa: "詩の朗読会", labelEn: "Poetry reading" },
        { id: "c4", labelJa: "かるた大会", labelEn: "Karuta contest" }
      ],
      correctIndex: 0,
      explanationJa: "第2段「神秘の験くらべ」では、奇術や呪術の力で奇跡を起こして勝負する様子がユーモラスに描かれ、当時の宗教界や説話のパロディが展開されています。",
      explanationEn: "Chapter 2 depicts 'Genkurabe', where ascetics compete in supernatural feats, parodying contemporary religious tales.",
      jump: { type: "chapter", chapter: 2 },
      jumpLabelJa: "神秘の験くらべを見る",
      jumpLabelEn: "View Genkurabe Scene"
    },
    {
      id: "q5",
      order: 5,
      promptJa: "鳥獣人物戯画（甲・乙・丙・丁の全4巻）をすべて鑑賞・理解したあなたに贈られる称号は何でしょう？",
      promptEn: "What title is awarded to you for exploring and mastering all four scrolls of Chōjū-giga?",
      choices: [
        { id: "c1", labelJa: "鳥獣戯画 完全制覇マスター", labelEn: "Grand Master of Chōjū-giga" },
        { id: "c2", labelJa: "新米ウサギ", labelEn: "Novice Rabbit" },
        { id: "c3", labelJa: "見習いカエル", labelEn: "Apprentice Frog" },
        { id: "c4", labelJa: "ただの旅人", labelEn: "Casual Traveler" }
      ],
      correctIndex: 0,
      explanationJa: "平安の動物風刺（甲）、動物図鑑（乙）、人間と動物の二重構造（丙）、鎌倉の人間風刺劇（丁）という、鳥獣人物戯画全4巻の全貌をマスターしました！",
      explanationEn: "Congratulations! You have mastered the full spectrum of all four scrolls: Kou, Otsu, Hei, and Tei!"
    }
  ],
  resultLinks: [
    {
      type: "path",
      path: "/Chōjū-jinbutsu-giga_first?quiz=1",
      labelJa: "鳥獣戯画 甲巻（最初）へ戻る",
      labelEn: "Return to Scroll 1 (Kou)",
    },
    {
      type: "scroll",
      titleen: "Chōjū-jinbutsu-giga_third",
      labelJa: "鳥獣戯画 丙巻を見る",
      labelEn: "View Chōjū-jinbutsu-giga Scroll 3",
    },
    {
      type: "path",
      path: "/type/emaki",
      labelJa: "絵巻一覧に戻る",
      labelEn: "Back to Emaki List",
    },
  ]
};
