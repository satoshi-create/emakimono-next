import { getEffectiveScrollLeft } from "@/utils/emakiTransformScroll";

/**
 * sectionsCache（useEmakiScroll が構築）と仮想 scrollLeft から読取位置のシーン id を返す。
 * DOM 読み取りなし（算術のみ）。再生中の先読み index 更新用。
 *
 * @param {HTMLElement | null} articleEl
 * @param {{ current: number | null }} virtualScrollLeftRef
 * @param {{ current: { baseScrollLeft: number; items: { id: number; offset: number }[] } | null }} sectionsCacheRef
 * @param {number} [fallbackIndex]
 * @returns {number}
 */
export const getSceneIndexFromScrollCache = (
  articleEl,
  virtualScrollLeftRef,
  sectionsCacheRef,
  fallbackIndex = 0
) => {
  const cache = sectionsCacheRef?.current;
  if (!cache?.items?.length) return fallbackIndex;

  const scrollDelta =
    getEffectiveScrollLeft(articleEl, virtualScrollLeftRef) -
    cache.baseScrollLeft;

  let closestId = null;
  let closestDistance = Infinity;

  cache.items.forEach(({ id, offset }) => {
    const distance = Math.abs(offset - scrollDelta);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestId = id;
    }
  });

  if (closestId === null || isNaN(closestId)) return fallbackIndex;
  return closestId;
};
