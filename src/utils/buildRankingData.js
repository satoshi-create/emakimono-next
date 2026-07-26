import emakisMetadata from "@/data/image-metadata-cache/image-metadata-cache.json";
import { isWithdrawnScroll } from "@/libs/constants/withdrawnScrolls";
import { removeNestedEmakisObj } from "@/utils/func";

function flattenAndRemoveNullAndUndefined(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.flatMap((item) => {
    if (Array.isArray(item)) {
      return flattenAndRemoveNullAndUndefined(item);
    }
    return item !== null && item !== undefined ? [item] : [];
  });
}

/**
 * Merge GA page views with emaki metadata for ranking display.
 * @param {{ pathName: string, pageView: number }[]} pageViews
 * @param {number} [limit=30]
 */
export function buildRankingData(pageViews, limit = 30) {
  const flatEmakis = emakisMetadata
    .filter((item) => !isWithdrawnScroll(item.titleen))
    .map((item) => removeNestedEmakisObj(item));

  const merged = pageViews
    .map(({ pathName, pageView }) => {
      if (isWithdrawnScroll(pathName)) return null;
      const match = flatEmakis.filter((item) => item.titleen === pathName);
      if (!match.length) return null;
      return match.map((item) => ({ ...item, pathName, pageView }));
    })
    .filter(Boolean);

  return flattenAndRemoveNullAndUndefined(merged).slice(0, limit);
}
