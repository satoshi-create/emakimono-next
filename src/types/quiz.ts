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