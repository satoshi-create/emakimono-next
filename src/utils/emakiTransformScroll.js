/**
 * 再生中は scrollLeft の代わりに内側 track の transform で横移動（scroll イベントを出さない）。
 * 停止時に scrollLeft へ同期して手動スクロールと整合させる。
 */

/** @returns {number} */
export const getEffectiveScrollLeft = (articleEl, virtualScrollRef) => {
  if (virtualScrollRef?.current != null) {
    return virtualScrollRef.current;
  }
  return articleEl?.scrollLeft ?? 0;
};

/** @returns {number} */
export const computeMinScrollLeft = (articleEl) =>
  -(articleEl.scrollWidth - articleEl.clientWidth);

/** row-reverse + 負 scrollLeft: ネイティブ scrollLeft=-N と同視覚は translateX(+N) */
export const applyTransformScroll = (scrollTrackEl, scrollLeft) => {
  if (!scrollTrackEl) return;
  scrollTrackEl.style.transform = `translate3d(${-scrollLeft}px, 0, 0)`;
};

export const clearTransformScroll = (scrollTrackEl) => {
  if (!scrollTrackEl) return;
  scrollTrackEl.style.transform = "";
  scrollTrackEl.style.willChange = "";
};

export const beginTransformPlayback = (articleEl, scrollTrackEl, virtualScrollRef) => {
  if (!articleEl || !scrollTrackEl || !virtualScrollRef) return;
  const left = articleEl.scrollLeft;
  virtualScrollRef.current = left;
  // ネイティブ scroll と transform の二重オフセットを防ぐ
  articleEl.scrollLeft = 0;
  scrollTrackEl.style.willChange = "transform";
  applyTransformScroll(scrollTrackEl, left);
};

export const endTransformPlayback = (articleEl, scrollTrackEl, virtualScrollRef) => {
  if (!articleEl || !virtualScrollRef) return;
  if (virtualScrollRef.current != null) {
    articleEl.scrollLeft = virtualScrollRef.current;
  }
  virtualScrollRef.current = null;
  clearTransformScroll(scrollTrackEl);
};

/** @param {number} scrollLeft */
export const setPlaybackScrollLeft = (
  articleEl,
  scrollTrackEl,
  virtualScrollRef,
  scrollLeft
) => {
  if (!virtualScrollRef) return;
  virtualScrollRef.current = scrollLeft;
  applyTransformScroll(scrollTrackEl, scrollLeft);
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
