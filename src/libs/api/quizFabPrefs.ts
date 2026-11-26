/**
 * 観察力クイズ FAB の表示設定（端末単位・localStorage）
 */

const KEY = "emaki_quiz_fab_hidden_v1";

export function isQuizFabHidden() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

/** @param {boolean} hidden */
export function setQuizFabHidden(hidden) {
  if (typeof window === "undefined") return;
  try {
    if (hidden) window.localStorage.setItem(KEY, "1");
    else window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
