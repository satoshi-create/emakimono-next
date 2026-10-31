import type { QuizDefinition, QuizId } from "@/types/quiz";
import { CHOJU_GIGA_KOU_QUIZ } from "./choujuGigaKouQuiz";
import { CHOJU_GIGA_OTSU_QUIZ } from "./choujuGigaOtsuQuiz";
import { CHOJU_GIGA_HEI_QUIZ } from "./choujuGigaHeiQuiz";
import { CHOJU_GIGA_TEI_QUIZ } from "./choujuGigaTeiQuiz";

export { getQuizRank } from "./choujuGigaKouQuiz";

export { getQuizNavigation } from "./recommendation";

// 各巻にシリーズメタデータを注入
CHOJU_GIGA_KOU_QUIZ.seriesId = "choju-giga";
CHOJU_GIGA_KOU_QUIZ.seriesTitleJa = "鳥獣戯画シリーズ";
CHOJU_GIGA_KOU_QUIZ.seriesTitleEn = "Chōjū-giga Series";
CHOJU_GIGA_KOU_QUIZ.seriesOrder = 1;
CHOJU_GIGA_KOU_QUIZ.shortTitleJa = "甲巻";
CHOJU_GIGA_KOU_QUIZ.shortTitleEn = "Scroll I";

CHOJU_GIGA_OTSU_QUIZ.seriesId = "choju-giga";
CHOJU_GIGA_OTSU_QUIZ.seriesTitleJa = "鳥獣戯画シリーズ";
CHOJU_GIGA_OTSU_QUIZ.seriesTitleEn = "Chōjū-giga Series";
CHOJU_GIGA_OTSU_QUIZ.seriesOrder = 2;
CHOJU_GIGA_OTSU_QUIZ.shortTitleJa = "乙巻";
CHOJU_GIGA_OTSU_QUIZ.shortTitleEn = "Scroll II";

CHOJU_GIGA_HEI_QUIZ.seriesId = "choju-giga";
CHOJU_GIGA_HEI_QUIZ.seriesTitleJa = "鳥獣戯画シリーズ";
CHOJU_GIGA_HEI_QUIZ.seriesTitleEn = "Chōjū-giga Series";
CHOJU_GIGA_HEI_QUIZ.seriesOrder = 3;
CHOJU_GIGA_HEI_QUIZ.shortTitleJa = "丙巻";
CHOJU_GIGA_HEI_QUIZ.shortTitleEn = "Scroll III";

CHOJU_GIGA_TEI_QUIZ.seriesId = "choju-giga";
CHOJU_GIGA_TEI_QUIZ.seriesTitleJa = "鳥獣戯画シリーズ";
CHOJU_GIGA_TEI_QUIZ.seriesTitleEn = "Chōjū-giga Series";
CHOJU_GIGA_TEI_QUIZ.seriesOrder = 4;
CHOJU_GIGA_TEI_QUIZ.shortTitleJa = "丁巻";
CHOJU_GIGA_TEI_QUIZ.shortTitleEn = "Scroll IV";

export const ALL_QUIZZES: QuizDefinition[] = [
  CHOJU_GIGA_KOU_QUIZ,
  CHOJU_GIGA_OTSU_QUIZ,
  CHOJU_GIGA_HEI_QUIZ,
  CHOJU_GIGA_TEI_QUIZ,
];

export const QUIZ_BY_ID: Record<QuizId, QuizDefinition> = {
  "chouju_giga_kou_observe_v1": CHOJU_GIGA_KOU_QUIZ,
  "chouju-giga-otsu": CHOJU_GIGA_OTSU_QUIZ,
  "chouju-giga-hei": CHOJU_GIGA_HEI_QUIZ,
  "chouju-giga-tei": CHOJU_GIGA_TEI_QUIZ,
};

export const QUIZ_BY_TITLEEN: Record<string, QuizDefinition> = {
  "Chōjū-jinbutsu-giga_first": CHOJU_GIGA_KOU_QUIZ,
  "Chōjū-jinbutsu-giga_second": CHOJU_GIGA_OTSU_QUIZ,
  "Chōjū-jinbutsu-giga_third": CHOJU_GIGA_HEI_QUIZ,
  "Chōjū-jinbutsu-giga_fourth": CHOJU_GIGA_TEI_QUIZ,
};

export function getQuizForTitleen(
  titleen: string | undefined,
): QuizDefinition | null {
  if (!titleen) return null;
  return QUIZ_BY_TITLEEN[titleen] ?? null;
}

export function getQuizById(
  id: QuizId | string | undefined,
): QuizDefinition | null {
  if (!id) return null;
  return (QUIZ_BY_ID as Record<string, QuizDefinition>)[id] ?? null;
}
