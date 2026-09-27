// GENERATED FILE — 手動編集しない。再生成: npm run build:folklore
// 出典: scrolls/source/ebiki/ebiki.csv（一次資料）

import folkloreItems from "./folkloreItems";
import folkloreByTitleen from "./folkloreByTitleen";

const byId = Object.fromEntries(
  folkloreItems.map((item) => [item.item_id, item])
);

/** @param {string} titleen @param {string|number} chapter */
export function getFolkloreItemsByChapter(titleen, chapter) {
  if (!titleen) return [];
  const chapterKey = String(chapter ?? "");
  const ids = folkloreByTitleen[titleen]?.[chapterKey] ?? [];
  return ids.map((id) => byId[id]).filter(Boolean);
}

/** @param {string} id */
export function getFolkloreItemById(id) {
  if (!id) return null;
  return byId[id] ?? null;
}

/** @param {string} titleen */
export function getFolkloreItemsByTitleen(titleen) {
  if (!titleen || !folkloreByTitleen[titleen]) return [];
  const ids = Object.values(folkloreByTitleen[titleen]).flat();
  return ids.map((id) => byId[id]).filter(Boolean);
}

export { folkloreItems, folkloreByTitleen };
export default {
  folkloreItems,
  folkloreByTitleen,
  getFolkloreItemsByChapter,
  getFolkloreItemById,
  getFolkloreItemsByTitleen,
};
