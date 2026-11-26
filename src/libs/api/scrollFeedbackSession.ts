const prefix = "scroll_feedback_";
const dismissedPrefix = "scroll_feedback_dismissed_";

// 巻末到達フィードバック通知（EndPrompt / Panel 共通）の識別キー
export const SCROLL_END_FEEDBACK_KEY = "scroll_end_feedback";

export function getScrollFeedbackSessionKey(emakiId) {
  return `${prefix}${emakiId}`;
}

export function hasSubmittedScrollFeedback(emakiId) {
  if (typeof window === "undefined" || !emakiId) return false;
  return sessionStorage.getItem(getScrollFeedbackSessionKey(emakiId)) === "1";
}

export function markScrollFeedbackSubmitted(emakiId) {
  if (typeof window === "undefined" || !emakiId) return;
  sessionStorage.setItem(getScrollFeedbackSessionKey(emakiId), "1");
}

// 識別キー（通知の種類 × 絵巻ID）へ正規化する
export function getFeedbackDismissKey(key, emakiId) {
  return emakiId ? `${key}:${emakiId}` : key;
}

export function getScrollEndFeedbackKey(emakiId) {
  return getFeedbackDismissKey(SCROLL_END_FEEDBACK_KEY, emakiId);
}

// ユーザーが一度閉じた通知は、セッション中は再トリガー・再表示しない
export function isFeedbackDismissed(key) {
  if (typeof window === "undefined" || !key) return false;
  try {
    return sessionStorage.getItem(`${dismissedPrefix}${key}`) === "1";
  } catch (e) {
    return false;
  }
}

export function dismissFeedback(key) {
  if (typeof window === "undefined" || !key) return;
  try {
    sessionStorage.setItem(`${dismissedPrefix}${key}`, "1");
  } catch (e) {
    // sessionStorage 不可（プライベートモード等）でも例外を握りつぶして継続
  }
}

export function resetFeedbackDismissed(key) {
  if (typeof window === "undefined" || !key) return;
  try {
    sessionStorage.removeItem(`${dismissedPrefix}${key}`);
  } catch (e) {
    // noop
  }
}
