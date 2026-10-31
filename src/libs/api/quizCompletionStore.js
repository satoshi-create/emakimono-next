const STORAGE_KEY = "emaki_completed_quiz_ids_v1";

/**
 * 完了したクイズID一覧を localStorage から取得
 * @returns {string[]}
 */
export function loadCompletedQuizIds() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Failed to load completed quiz ids:", e);
    return [];
  }
}

/**
 * クイズを完了済みとしてマークし localStorage に保存
 * @param {string} quizId
 * @returns {string[]} 更新後の完了クイズID一覧
 */
export function markQuizCompleted(quizId) {
  if (typeof window === "undefined" || !quizId) return [];
  try {
    const current = loadCompletedQuizIds();
    if (!current.includes(quizId)) {
      const updated = [...current, quizId];
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    }
    return current;
  } catch (e) {
    console.error("Failed to save completed quiz id:", e);
    return loadCompletedQuizIds();
  }
}
