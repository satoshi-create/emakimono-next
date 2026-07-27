const prefix = "scroll_feedback_";

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
