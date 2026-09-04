/**
 * 観察力クイズの進行を sessionStorage に永続化（同一巻最小化・他巻ジャンプ再開用）
 */

export const QUIZ_SESSION_KEY = "emaki_quiz_session_v1";

/**
 * @returns {import("@/types/quiz").QuizSessionState|null}
 */
export function loadQuizSession() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(QUIZ_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.quizId !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * @param {import("@/types/quiz").QuizSessionState} session
 */
export function saveQuizSession(session) {
  if (typeof window === "undefined" || !session) return;
  try {
    window.sessionStorage.setItem(QUIZ_SESSION_KEY, JSON.stringify(session));
  } catch {
    // quota / private mode — ignore
  }
}

export function clearQuizSession() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(QUIZ_SESSION_KEY);
  } catch {
    // ignore
  }
}

/**
 * @param {import("@/types/quiz").QuizDefinition} quiz
 * @param {string} hostTitleen
 * @returns {import("@/types/quiz").QuizSessionState}
 */
export function createQuizSession(quiz, hostTitleen) {
  return {
    quizId: quiz.id,
    quizVersion: quiz.version,
    hostTitleen,
    index: 0,
    selectedIndex: null,
    answers: [],
    jumpCount: 0,
    done: false,
    pendingJump: null,
  };
}
