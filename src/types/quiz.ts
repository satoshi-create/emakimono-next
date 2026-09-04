/** 観察力クイズ — 型の正本。実装: src/data/quiz/, src/components/emaki/quiz/ */

export type QuizId = "chouju_giga_kou_observe_v1";

export type QuizChoice = {
  id: string;
  labelJa: string;
  labelEn: string;
};

/** chapter / linkId = 同一巻。scroll = 他巻へ遷移してから chapter 解決 */
export type QuizJumpTarget =
  | { type: "chapter"; chapter: number | string }
  | { type: "linkId"; linkId: number }
  | {
      type: "scroll";
      titleen: string;
      chapter?: number | string;
      linkId?: number;
    };

export type QuizQuestion = {
  id: string;
  order: number;
  promptJa: string;
  promptEn: string;
  choices: QuizChoice[];
  /** choices 配列上の正解インデックス（0-based） */
  correctIndex: number;
  explanationJa: string;
  explanationEn: string;
  jump?: QuizJumpTarget;
  jumpLabelJa?: string;
  jumpLabelEn?: string;
};

export type QuizRankId = "master" | "observer" | "beginner";

export type QuizRankRule = {
  id: QuizRankId;
  minCorrect: number;
  maxCorrect: number;
  labelJa: string;
  labelEn: string;
};

/** 結果画面の回遊リンク */
export type QuizResultLink =
  | {
      type: "scroll";
      titleen: string;
      labelJa: string;
      labelEn: string;
    }
  | {
      type: "path";
      path: string;
      labelJa: string;
      labelEn: string;
    };

export type QuizDefinition = {
  id: QuizId;
  /** クイズ開始を出す titleen（エントリー巻） */
  titleen: string;
  version: number;
  questions: QuizQuestion[];
  ranks: QuizRankRule[];
  resultLinks?: QuizResultLink[];
};

export type QuizAnswerRecord = {
  questionId: string;
  choiceIndex: number;
  correct: boolean;
};

/** sessionStorage に保存する進行状態 */
export type QuizSessionState = {
  quizId: QuizId;
  quizVersion: number;
  /** 開始した巻の titleen */
  hostTitleen: string;
  index: number;
  selectedIndex: number | null;
  answers: QuizAnswerRecord[];
  jumpCount: number;
  done: boolean;
  /** 他巻ジャンプ後に適用する章移動 */
  pendingJump?: {
    titleen: string;
    chapter?: number | string;
    linkId?: number;
  } | null;
};
