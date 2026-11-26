const prefix = "pull_prompt_";

function key(emakiId, kind) {
  return `${prefix}${kind}_${emakiId}`;
}

/** @param {string} emakiId @param {"share"|"mid_feedback"} kind */
export function hasDismissedPullPrompt(emakiId, kind) {
  if (typeof window === "undefined" || !emakiId) return false;
  return sessionStorage.getItem(key(emakiId, kind)) === "1";
}

/** @param {string} emakiId @param {"share"|"mid_feedback"} kind */
export function markPullPromptDismissed(emakiId, kind) {
  if (typeof window === "undefined" || !emakiId) return;
  sessionStorage.setItem(key(emakiId, kind), "1");
}
