/**
 * theme_id ベースで関連絵巻を抽出する汎用ユーティリティ
 *
 * 1. 自分自身を除外（scroll_id）
 * 2. 同一 theme_id を優先
 * 3. なければ同一 era または type でフォールバック
 *
 * @param {Array} scrollList - 絵巻一覧（scroll_id, theme_id, era, eraen, type, typeen を持つ想定）
 * @param {Object} current - 現在表示中の絵巻（scroll_id, theme_id, era, eraen, type, typeen）
 * @param {number} limit - 返す最大件数
 * @returns {Array} 関連絵巻リスト
 */
export function getRelatedScrolls(scrollList, current, limit = 8) {
  if (!scrollList || !Array.isArray(scrollList) || scrollList.length === 0) {
    return [];
  }

  const currentScrollId =
    current?.scroll_id ?? current?.titleen ?? null;
  const currentThemeId = current?.theme_id ?? null;
  const currentEra = current?.era ?? current?.eraen ?? "";
  const currentType = current?.type ?? current?.typeen ?? "";

  // 1. 自分自身を除外
  const others = scrollList.filter(
    (s) => (s.scroll_id ?? s.titleen) !== currentScrollId
  );

  if (others.length === 0) return [];

  // 2. 同一 theme_id を優先
  if (currentThemeId) {
    const sameTheme = others.filter((s) => s.theme_id === currentThemeId);
    if (sameTheme.length > 0) {
      return sameTheme.slice(0, limit);
    }
  }

  // 3. フォールバック: 同一 era または type
  const sameEra = others.filter(
    (s) =>
      (s.era ?? s.eraen ?? "") === currentEra ||
      (s.eraen ?? s.era ?? "") === currentEra
  );
  const sameType = others.filter(
    (s) =>
      (s.type ?? s.typeen ?? "") === currentType ||
      (s.typeen ?? s.type ?? "") === currentType
  );

  const fallback = [...new Set([...sameEra, ...sameType])];
  return fallback.slice(0, limit);
}

/**
 * 表示用にアイテムを正規化（SingleCardC / EditionLinks 用）
 */
export function normalizeScrollForDisplay(item) {
  if (!item) return null;
  return {
    ...item,
    titleen: item.titleen ?? item.scroll_id ?? "",
    title: item.title ?? "",
    thumb: item.thumb ?? item.thumbnail ?? "",
    edition: item.edition ?? "",
  };
}
