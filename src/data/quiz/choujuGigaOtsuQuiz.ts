import type { QuizDefinition } from "@/types/quiz";

/** 鳥獣人物戯画 乙巻（second）向け観察力クイズ */
export const CHOJU_GIGA_OTSU_QUIZ: QuizDefinition = {
  id: "chouju-giga-otsu",
  titleen: "Chōjū-jinbutsu-giga_second",
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
  resultLinks: [
    {
      type: "path",
      path: "/Chōjū-jinbutsu-giga_first?quiz=1",
      labelJa: "鳥獣戯画 甲巻クイズに挑戦する",
      labelEn: "Try Chōjū-jinbutsu-giga Scroll 1 Quiz",
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
  ],
  questions: [
    {
      id: "q1",
      order: 1,
      promptJa:
        "鳥獣戯画「乙巻」の前半と後半には大きな違いがあります。後半に登場するのはどんな動物たちでしょう？",
      promptEn:
        "What kind of creatures appear in the second half of the second scroll?",
      choices: [
        {
          id: "c1",
          labelJa: "服を着て人間の真似をする猿や兎",
          labelEn: "Monkeys and rabbits dressed in human clothes",
        },
        {
          id: "c2",
          labelJa: "象や虎、龍や麒麟などの異国の動物や空想上の霊獣",
          labelEn: "Exotic animals like elephants and mythical beasts like dragons",
        },
        {
          id: "c3",
          labelJa: "小鳥や昆虫などの小さな生き物",
          labelEn: "Small creatures like little birds and insects",
        },
        {
          id: "c4",
          labelJa: "魚やタコなどの海の生き物",
          labelEn: "Sea creatures like fish and octopuses",
        },
      ],
      correctIndex: 1,
      explanationJa:
        "乙巻の前半には馬や牛、犬など日本に実在する身近な動物が描かれ、後半には当時日本にいなかった象や虎、空想上の霊獣（麒麟・獏・龍など）が登場します。",
      explanationEn:
        "The first half features domestic Japanese animals, while the second half features exotic and mythical beasts.",
      jump: {
        type: "scroll",
        titleen: "Chōjū-jinbutsu-giga_second",
        chapter: 14,
      },
      jumpLabelJa: "英知の象のシーンを見る",
      jumpLabelEn: "View the Wise Elephant scene",
    },
    {
      id: "q2",
      order: 2,
      promptJa:
        "乙巻に描かれた「象（ゾウ）」をよく見ると、実物とは少し違うユーモラスな特徴があります。それは何でしょう？",
      promptEn:
        "What unique characteristic is depicted on the elephant in the second scroll?",
      choices: [
        {
          id: "c1",
          labelJa: "耳がウサギのように長く立っている",
          labelEn: "Long ears like a rabbit",
        },
        {
          id: "c2",
          labelJa: "背中に鳥の羽が生えている",
          labelEn: "Bird wings on its back",
        },
        {
          id: "c3",
          labelJa:
            "足の先や鼻のシワなど、絵師が見たことのない姿を想像と伝聞で補っている",
          labelEn:
            "Details filled in from imagination and rumor as the painter had never seen one",
        },
        {
          id: "c4",
          labelJa: "首がキリンのように長い",
          labelEn: "A long neck like a giraffe",
        },
      ],
      correctIndex: 2,
      explanationJa:
        "平安時代の絵師は本物の生きた象を見たことがなかったため、仏画や中国からの伝聞をもとに、想像力を膨らませて描いたと言われています。",
      explanationEn:
        "Painters in the Heian period had never seen a live elephant, so they drew them based on hearsay and imported Buddhist art.",
      jump: {
        type: "scroll",
        titleen: "Chōjū-jinbutsu-giga_second",
        chapter: 14,
      },
      jumpLabelJa: "象の描写を見る",
      jumpLabelEn: "Observe the Elephant",
    },
    {
      id: "q3",
      order: 3,
      promptJa:
        "悪夢を食べてくれると言い伝えられる中国由来の霊獣「獏（バク）」。乙巻ではどのような姿で描かれているでしょう？",
      promptEn: "How is the nightmare-eating Baku depicted in the scroll?",
      choices: [
        {
          id: "c1",
          labelJa: "鼻は象、目はサイ、尾は牛、足は虎のような合成された姿",
          labelEn:
            "A composite body with an elephant trunk, rhino eyes, ox tail, and tiger paws",
        },
        {
          id: "c2",
          labelJa: "現代の動物園にいる白黒模様のマレーバクそのものの姿",
          labelEn: "Identical to a modern Malayan tapir",
        },
        {
          id: "c3",
          labelJa: "大きな魚に角が生えた姿",
          labelEn: "A large horned fish",
        },
        {
          id: "c4",
          labelJa: "炎をまとった黒い犬の姿",
          labelEn: "A black dog covered in flames",
        },
      ],
      correctIndex: 0,
      explanationJa:
        "古代中国の伝説上の霊獣・獏は、様々な動物の特徴を組み合わせた姿と伝えられており、乙巻でもその伝承に基づいた幻想的な姿で描かれています。",
      explanationEn:
        "The mythical Baku is traditionally depicted as a composite chimera of various animals.",
      jump: {
        type: "scroll",
        titleen: "Chōjū-jinbutsu-giga_second",
        chapter: 15,
      },
      jumpLabelJa: "霊獣 獏のシーンを見る",
      jumpLabelEn: "View Baku scene",
    },
    {
      id: "q4",
      order: 4,
      promptJa: "甲巻と乙巻の大きな作風の違いとして正しいものはどれでしょう？",
      promptEn:
        "What is the major stylistic difference between Scroll 1 (Kou) and Scroll 2 (Otsu)?",
      choices: [
        {
          id: "c1",
          labelJa: "乙巻には全面に鮮やかな極彩色が塗られている",
          labelEn: "Scroll 2 is fully colored in bright pigments",
        },
        {
          id: "c2",
          labelJa:
            "甲巻のような擬人化（二足歩行）はほぼなく、四足歩行の動物本来の生態や姿が描かれている",
          labelEn:
            "Unlike Scroll 1, there is little anthropomorphism, focusing on quadrupedal animals",
        },
        {
          id: "c3",
          labelJa: "乙巻には詳細なストーリーを語る長文の詞書がある",
          labelEn: "Scroll 2 contains long narrative text",
        },
        {
          id: "c4",
          labelJa: "乙巻には人間しか登場しない",
          labelEn: "Scroll 2 only depicts humans",
        },
      ],
      correctIndex: 1,
      explanationJa:
        "甲巻が動物を擬人化して風刺劇を描いたのに対し、乙巻は動物たちが本来の四足歩行で描かれ、一種の「動物図鑑」や絵師の手習いのような性格を持っています。",
      explanationEn:
        "While Scroll 1 anthropomorphizes animals, Scroll 2 depicts them in natural four-legged stances like a compendium.",
    },
    {
      id: "q5",
      order: 5,
      promptJa:
        "乙巻に登場する「麒麟（きりん）」は、現代の首の長いキリンではなく霊獣です。どんな特徴を持っているでしょう？",
      promptEn:
        "What are the features of the mythical Kirin depicted in the scroll?",
      choices: [
        {
          id: "c1",
          labelJa: "鹿のような体、牛の尾、馬の蹄を持ち、背中に鱗がある",
          labelEn: "Deer-like body, ox tail, horse hooves, and scales on its back",
        },
        {
          id: "c2",
          labelJa: "全身が鳥の羽で覆われ空を飛ぶ",
          labelEn: "Covered in bird feathers and flying through the sky",
        },
        {
          id: "c3",
          labelJa: "頭が二つある大蛇",
          labelEn: "A two-headed serpent",
        },
        {
          id: "c4",
          labelJa: "黄金の甲羅を持つカメ",
          labelEn: "A turtle with a golden shell",
        },
      ],
      correctIndex: 0,
      explanationJa:
        "中国の吉兆を示す聖獣・麒麟は、鹿の胴体に牛の尾、馬の蹄、頭に角を持つ姿とされ、優れた君主の治世に現れると信じられていました。",
      explanationEn:
        "The mythical Kirin has a deer's body, an ox's tail, and horse hooves, symbolizing peace and auspicious signs.",
      jump: {
        type: "scroll",
        titleen: "Chōjū-jinbutsu-giga_second",
        chapter: 8,
      },
      jumpLabelJa: "霊獣 麒麟のシーンを見る",
      jumpLabelEn: "View Kirin scene",
    },
  ],
};
