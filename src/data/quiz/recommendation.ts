import { ALL_QUIZZES } from "./index";
import type { QuizDefinition } from "@/types/quiz";

export interface QuizNavigationData {
  seriesTitleJa: string;
  seriesTitleEn: string;
  seriesQuizzes: QuizDefinition[];
  recommendedQuizzes: QuizDefinition[];
}

/**
 * 現在のクイズIDをもとに、同シリーズの全巻リストと他作品の推薦クイズを抽出
 */
export function getQuizNavigation(currentQuizId?: string): QuizNavigationData {
  const currentQuiz = ALL_QUIZZES.find((q) => q.id === currentQuizId);
  const currentSeriesId = currentQuiz?.seriesId;

  // 1. 同一シリーズのクイズを巻順（seriesOrder）で抽出（アプローチ2用）
  const seriesQuizzes = currentSeriesId
    ? ALL_QUIZZES.filter((q) => q.seriesId === currentSeriesId).sort(
        (a, b) => (a.seriesOrder ?? 0) - (b.seriesOrder ?? 0)
      )
    : currentQuiz
    ? [currentQuiz]
    : [];

  // 現在のシリーズ以外のシリーズから代表クイズ（各シリーズ1件）を抽出
  const seenSeries = new Set<string>();
  const distinctRecommended: QuizDefinition[] = [];

  for (const q of ALL_QUIZZES) {
    if (q.seriesId && q.seriesId !== currentSeriesId && !seenSeries.has(q.seriesId)) {
      seenSeries.add(q.seriesId);
      distinctRecommended.push(q);
    }
  }

  return {
    seriesTitleJa: currentQuiz?.seriesTitleJa ?? "",
    seriesTitleEn: currentQuiz?.seriesTitleEn ?? "",
    seriesQuizzes,
    recommendedQuizzes: distinctRecommended.slice(0, 3),
  };
}
