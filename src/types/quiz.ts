/**
 * =============================================================================
 * 1. クイズ完了サマリー・スコア分布型定義 (QuizSummaryStat)
 * =============================================================================
 */
export interface QuizSummaryStat {
  totalCompletions: number;
  scoreDistribution: Record<string, number>;
}

/**
 * =============================================================================
 * 2. クイズ設問別正答率統計型定義 (QuizQuestionStat)
 * =============================================================================
 */
export interface QuizQuestionStat {
  attempts: number;
  correctRate: number;
}

/**
 * =============================================================================
 * 3. クイズ1タイトル分の統計エントリ型定義 (QuizStatEntry)
 * =============================================================================
 */
export interface QuizStatEntry {
  summary: QuizSummaryStat;
  questions: Record<string, QuizQuestionStat>;
}

/**
 * =============================================================================
 * 4. クイズ統計マスター全体型定義 (QuizStatsMaster)
 * =============================================================================
 */
export interface QuizStatsMaster {
  _comment?: string;
  version: number;
  canonicalQuizStatKeys: Record<string, string>;
  quizzes: Record<string, QuizStatEntry>;
}

/**
 * =============================================================================
 * 5. クイズ定義マスター型定義 (QuizId / QuizDefinition)
 * -----------------------------------------------------------------------------
 * src/data/quiz/*.ts および src/data/quiz/index.ts で使用されるクイズ構造契約。
 * =============================================================================
 */
export type QuizId =
  | "chouju_giga_kou_observe_v1"
  | "chouju-giga-otsu"
  | "chouju-giga-hei"
  | "chouju-giga-tei"
  | "hyakki-yagyo-utokyo"
  | "hyakki-kokkai-a"
  | "hyakki-no-zu-nichibun"
  | "tsukumogami"
  | "kusouzumaki"
  | "kusouzu-kobayasieieitaku"
  | "genji-monogatari-tokugawa"
  | "rakuchu-rakugai-funaki"
  | "rakuchu-rakugai-fukuoka-quiz"
  | "rakuchu-rakugai-met-quiz"
  | (string & {});

export interface QuizRankRule {
  id: string;
  minCorrect: number;
  maxCorrect: number;
  labelJa: string;
  labelEn: string;
  descriptionJa?: string;
  descriptionEn?: string;
  [key: string]: unknown;
}

export interface QuizResultLink {
  type: string;
  path?: string;
  slug?: string;
  labelJa: string;
  labelEn: string;
  [key: string]: unknown;
}

export interface QuizQuestionOption {
  id?: string;
  labelJa?: string;
  labelEn?: string;
  textJa?: string;
  textEn?: string;
  [key: string]: unknown;
}

export interface QuizQuestionItem {
  id: string;
  questionJa?: string;
  questionEn?: string;
  promptJa?: string;
  promptEn?: string;
  options?: QuizQuestionOption[] | string[];
  answer?: string | number;
  correctAnswer?: string | number;
  correctIndex?: number;
  explanationJa?: string;
  explanationEn?: string;
  jump?: {
    chapter?: string | number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface QuizDefinition {
  id: QuizId;
  titleen: string;
  titleJa?: string;
  titleEn?: string;
  version?: number;
  ranks?: QuizRankRule[];
  resultLinks?: QuizResultLink[];
  questions: QuizQuestionItem[];
  seriesId?: string;
  seriesTitleJa?: string;
  seriesTitleEn?: string;
  seriesOrder?: number;
  shortTitleJa?: string;
  shortTitleEn?: string;
  [key: string]: unknown;
}