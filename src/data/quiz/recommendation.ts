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
  const currentSeriesId = currentQuiz?.seriesId ?? "choju-giga";

  // 1. 同一シリーズのクイズを巻順（seriesOrder）で抽出（アプローチ2用）
  const seriesQuizzes = ALL_QUIZZES.filter(
    (q) => (q.seriesId ?? "choju-giga") === currentSeriesId
  ).sort((a, b) => (a.seriesOrder ?? 0) - (b.seriesOrder ?? 0));

  // 2. 他シリーズのクイズを動的抽出（アプローチ3用: 将来の別作品用）
  const otherQuizzes = ALL_QUIZZES.filter(
    (q) => (q.seriesId ?? "choju-giga") !== currentSeriesId && q.id !== currentQuizId
  );

  return {
    seriesTitleJa: currentQuiz?.seriesTitleJa ?? "鳥獣戯画シリーズ",
    seriesTitleEn: currentQuiz?.seriesTitleEn ?? "Chōjū-giga Series",
    seriesQuizzes,
    recommendedQuizzes: otherQuizzes.slice(0, 2),
  };
}
