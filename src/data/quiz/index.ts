import type { QuizDefinition, QuizId } from "@/types/quiz";
import { CHOJU_GIGA_KOU_QUIZ } from "./choujuGigaKouQuiz";
import { CHOJU_GIGA_OTSU_QUIZ } from "./choujuGigaOtsuQuiz";
import { CHOJU_GIGA_HEI_QUIZ } from "./choujuGigaHeiQuiz";
import { CHOJU_GIGA_TEI_QUIZ } from "./choujuGigaTeiQuiz";

export { getQuizRank } from "./choujuGigaKouQuiz";

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
