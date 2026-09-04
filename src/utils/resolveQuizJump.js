/**
 * クイズ jump 定義 → ビューア linkId / 他巻遷移情報へ解決。
 */

/**
 * @param {{ chapter?: string|number, linkId: number }[]} emakis
 * @param {string|number} chapter
 * @returns {number|null}
 */
export function resolveLinkIdByChapter(emakis, chapter) {
  if (!Array.isArray(emakis) || chapter == null || chapter === "") return null;
  const key = String(chapter);
  const hit = emakis.find((s) => String(s.chapter) === key);
  return hit && typeof hit.linkId === "number" ? hit.linkId : null;
}

/**
 * @typedef {{
 *   kind: "local",
 *   linkId: number,
 *   chapter?: string|number,
 * } | {
 *   kind: "scroll",
 *   titleen: string,
 *   chapter?: string|number,
 *   linkId?: number,
 * }} ResolvedQuizJump
 */

/**
 * @param {{ chapter?: string|number, linkId: number }[]} emakis
 * @param {{ type: string, chapter?: string|number, linkId?: number, titleen?: string }|undefined} jump
 * @param {string} [currentTitleen]
 * @returns {ResolvedQuizJump|null}
 */
export function resolveQuizJump(emakis, jump, currentTitleen) {
  if (!jump) return null;

  if (jump.type === "scroll" && jump.titleen) {
    // 同一巻への scroll 指定はローカルジャンプに畳む
    if (currentTitleen && jump.titleen === currentTitleen) {
      if (typeof jump.linkId === "number") {
        return { kind: "local", linkId: jump.linkId, chapter: jump.chapter };
      }
      if (jump.chapter != null) {
        const linkId = resolveLinkIdByChapter(emakis, jump.chapter);
        if (linkId == null) return null;
        return { kind: "local", linkId, chapter: jump.chapter };
      }
      return null;
    }
    return {
      kind: "scroll",
      titleen: jump.titleen,
      chapter: jump.chapter,
      linkId: jump.linkId,
    };
  }

  if (jump.type === "linkId" && typeof jump.linkId === "number") {
    return { kind: "local", linkId: jump.linkId };
  }

  if (jump.type === "chapter") {
    const linkId = resolveLinkIdByChapter(emakis, jump.chapter);
    if (linkId == null) return null;
    return { kind: "local", linkId, chapter: jump.chapter };
  }

  return null;
}
