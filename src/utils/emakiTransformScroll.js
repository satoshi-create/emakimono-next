/**
 * 自動再生 rAF 用: ネイティブ article.scrollLeft を直接更新する。
 */

/** @returns {number} */
export const computeMinScrollLeft = (articleEl) =>
  -(articleEl.scrollWidth - articleEl.clientWidth);

/** @param {number} scrollLeft */
export const setArticleScrollLeft = (articleEl, scrollLeft) => {
  if (!articleEl) return;
  articleEl.scrollLeft = Math.round(scrollLeft);
};

export const syncEdgeRefsFromScrollLeft = (
  scrollLeft,
  minScrollLeft,
  isAtStartRef,
  isAtEndRef
) => {
  const maxScrollLeft = -minScrollLeft;
  if (maxScrollLeft <= 0) return;

  const atStart =
    Math.abs(scrollLeft) < 5 || scrollLeft >= maxScrollLeft - 5;
  const atEnd =
    Math.abs(scrollLeft) >= maxScrollLeft - 5 ||
    (scrollLeft < 0 && Math.abs(scrollLeft) >= maxScrollLeft - 5);

  if (atStart !== isAtStartRef.current) isAtStartRef.current = atStart;
  if (atEnd !== isAtEndRef.current) isAtEndRef.current = atEnd;
};
