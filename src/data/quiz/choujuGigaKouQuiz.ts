import { CHOUJU_GIGA_HUB_PATH } from "@/libs/constants/links";
import type { QuizDefinition, QuizId } from "@/types/quiz";

/** 鳥獣人物戯画 甲巻（first）向け観察力クイズ。jump.chapter は emaki-text-data の段番号と一致 */
export const CHOJU_GIGA_KOU_QUIZ: QuizDefinition = {
  id: "chouju_giga_kou_observe_v1",
  titleen: "Chōjū-jinbutsu-giga_first",
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
      type: "scroll",
      titleen: "Chōjū-jinbutsu-giga_second",
      labelJa: "乙巻を鑑賞する",
      labelEn: "View Scroll II",
    },
    {
      type: "scroll",
      titleen: "Chōjū-jinbutsu-giga_third",
      labelJa: "丙巻を鑑賞する",
      labelEn: "View Scroll III",
    },
    {
      type: "path",
      path: CHOUJU_GIGA_HUB_PATH,
      labelJa: "鳥獣戯画一覧へ",
      labelEn: "Chōjū-giga hub",
    },
  ],
  questions: [
    {
      id: "q1",
      order: 1,
      promptJa:
        "絵巻物は、時間の流れに合わせてどちら向きに巻き広げながら見ていく？",
      promptEn:
        "In which direction do you unroll an emaki as the story progresses?",
      choices: [
        { id: "A", labelJa: "左から右", labelEn: "Left to right" },
        { id: "B", labelJa: "右から左", labelEn: "Right to left" },
        { id: "C", labelJa: "上から下", labelEn: "Top to bottom" },
      ],
      correctIndex: 1,
      explanationJa:
        "日本の伝統的な文字は縦書きで右から左へ進むため、絵巻物も「右から左」へ時間が流れます。",
      explanationEn:
        "Traditional Japanese text is written vertically and progresses right to left, so emaki stories also flow from right to left.",
    },
    {
      id: "q2",
      order: 2,
      promptJa:
        "一般的な絵巻には物語を説明する文章（詞書）がありますが、鳥獣戯画（甲巻）にはどんな文章が書かれている？",
      promptEn:
        "Most emaki include narrative text (kotobagaki). What text appears in Chōjū-giga (Scroll I)?",
      choices: [
        {
          id: "A",
          labelJa: "セリフが詳しく書かれている",
          labelEn: "Detailed dialogue is written",
        },
        {
          id: "B",
          labelJa: "和歌が書かれている",
          labelEn: "Waka poems are written",
        },
        {
          id: "C",
          labelJa: "最初から最後まで一切書かれていない",
          labelEn: "No text at all from start to finish",
        },
      ],
      correctIndex: 2,
      explanationJa:
        "鳥獣戯画甲巻には詞書が一切ありません。文字がないからこそ、動物たちの表情や動きだけで豊かなストーリーが伝わります。",
      explanationEn:
        "Scroll I of Chōjū-giga has no kotobagaki at all. Without words, the animals’ expressions and gestures carry the story.",
    },
    {
      id: "q3",
      order: 3,
      promptJa:
        "ウサギとカエルが相撲を取るシーン。投げ飛ばされたウサギを見て、勝ったカエルは何をしている？",
      promptEn:
        "In the rabbit–frog sumo scene, what is the winning frog doing after tossing the rabbit?",
      choices: [
        {
          id: "A",
          labelJa: "口から気炎（息）を吐いて大笑いしている",
          labelEn: "Laughing hard, breath steaming from its mouth",
        },
        {
          id: "B",
          labelJa: "心配して駆け寄る",
          labelEn: "Running over in concern",
        },
        {
          id: "C",
          labelJa: "審判と握手",
          labelEn: "Shaking hands with the referee",
        },
      ],
      correctIndex: 0,
      explanationJa:
        "カエルの口から伸びる細い線は、吐き出した息や笑い声を視覚化したもの。現代の「吹き出し」や「効果線」のルーツと言われています。",
      explanationEn:
        "The thin lines from the frog’s mouth visualize exhaled breath or laughter—often cited as an early ancestor of speech balloons and speed lines.",
      jump: { type: "chapter", chapter: 6 },
      jumpLabelJa: "相撲のシーンを見る",
      jumpLabelEn: "See the sumo scene",
    },
    {
      id: "q4",
      order: 4,
      promptJa:
        "川遊びや弓比べのシーンで、弓の「的（まと）」に使われている植物は何？",
      promptEn:
        "In the stream / ceremonial archery scene, what plant is used as the archery target?",
      choices: [
        { id: "A", labelJa: "バナナの皮", labelEn: "A banana peel" },
        { id: "B", labelJa: "ハス（蓮）の葉", labelEn: "A lotus leaf" },
        { id: "C", labelJa: "笹の葉", labelEn: "A bamboo leaf" },
      ],
      correctIndex: 1,
      explanationJa:
        "丸いハスの葉を的に見立てて弓矢で競い合っています。草花を器用に使って人間の貴族の遊びを真似（パロディ）しています。",
      explanationEn:
        "A round lotus leaf stands in as the target. Clever use of plants parodies aristocratic pastimes.",
      jump: { type: "chapter", chapter: 2 },
      jumpLabelJa: "弓比べのシーンを見る",
      jumpLabelEn: "See the archery scene",
    },
    {
      id: "q5",
      order: 5,
      promptJa:
        "鳥獣戯画（甲巻）を全部広げると、およそどれくらいの長さ（全長）になる？",
      promptEn:
        "About how long is Chōjū-giga (Scroll I) when fully unrolled?",
      choices: [
        { id: "A", labelJa: "約2メートル", labelEn: "About 2 meters" },
        { id: "B", labelJa: "約11メートル", labelEn: "About 11 meters" },
        { id: "C", labelJa: "約50メートル", labelEn: "About 50 meters" },
      ],
      correctIndex: 1,
      explanationJa:
        "本物の甲巻は全長約11.5mもあります。昔の人は肩幅（約60cm）ずつ広げては巻き戻しながら楽しんでいました。乙巻では馬や牛など別の動物たちが登場します。",
      explanationEn:
        "The real Scroll I is about 11.5 m long. Viewers traditionally opened about a shoulder-width (≈60 cm) at a time. Scroll II features other animals such as horses and oxen.",
      jump: {
        type: "scroll",
        titleen: "Chōjū-jinbutsu-giga_second",
        chapter: 1,
      },
      jumpLabelJa: "乙巻の冒頭（馬）を見る",
      jumpLabelEn: "See Scroll II opening (horse)",
    },
  ],
};

const QUIZ_BY_ID: Record<QuizId, QuizDefinition> = {
  [CHOJU_GIGA_KOU_QUIZ.id]: CHOJU_GIGA_KOU_QUIZ,
};

export const QUIZ_BY_TITLEEN: Record<string, QuizDefinition> = {
  [CHOJU_GIGA_KOU_QUIZ.titleen]: CHOJU_GIGA_KOU_QUIZ,
};

export function getQuizById(quizId: string): QuizDefinition | null {
  return QUIZ_BY_ID[quizId as QuizId] ?? null;
}

export function getQuizForTitleen(titleen: string): QuizDefinition | null {
  return QUIZ_BY_TITLEEN[titleen] ?? null;
}

export function getQuizRank(quiz: QuizDefinition, score: number) {
  return (
    quiz.ranks.find((r) => score >= r.minCorrect && score <= r.maxCorrect) ??
    quiz.ranks[quiz.ranks.length - 1]
  );
}
