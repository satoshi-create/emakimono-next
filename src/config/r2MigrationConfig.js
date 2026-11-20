// =============================================================================
// Cloudflare R2 配信設定（デフォルト R2・未移行作品のみ Cloudinary）
// =============================================================================

/**
 * 緊急キルスイッチ:
 * R2 側で障害や大量 404 が発生した際、false にするだけで全作品を即座に Cloudinary へ戻す
 */
export const ENABLE_R2_DELIVERY = true;

/**
 * 旧 Cloudinary のみ配信（R2 未移行）の titleen ブラックリスト（完全一致）
 * ※ 部分一致（includes）は jigokusoushi が kusoushi に誤爆する原因になるため厳禁
 */
export const LEGACY_CLOUDINARY_WORK_TITLES = new Set([
  "jigokusoushi_anzyuin",
  "gakisoushi_kawamoto",
  "jigokusoushi_masuda_kou",
  "eshi-no-soshi_tohaku",
  "kusouzu_wellcome_noble_lady",
  "hyakki_no_zu_nichibun",
  "hyakki_kokkai_a",
  "hyakki_utokyo",
  "naomoto_moushibumi_ekotoba",
  "genji-monogatari-emaki-tokugawa",
]);

/**
 * @param {string | undefined | null} titleen
 * @returns {boolean}
 */
export function shouldUseR2Delivery(titleen) {
  if (!ENABLE_R2_DELIVERY) return false;
  if (titleen == null || titleen === "") return true;

  const normalized = String(titleen);
  if (LEGACY_CLOUDINARY_WORK_TITLES.has(normalized)) return false;

  const slugUnderscore = normalized.replace(/-/g, "_");
  const slugHyphen = normalized.replace(/_/g, "-");
  if (
    slugUnderscore !== normalized &&
    LEGACY_CLOUDINARY_WORK_TITLES.has(slugUnderscore)
  ) {
    return false;
  }
  if (
    slugHyphen !== normalized &&
    LEGACY_CLOUDINARY_WORK_TITLES.has(slugHyphen)
  ) {
    return false;
  }

  return true;
}

/**
 * @deprecated 名前はカナリア時代のまま。`has(titleen)` は shouldUseR2Delivery と同義（cloudinaryUrl 互換）
 */
export const R2_CANARY_WORK_TITLES = {
  has(key) {
    return shouldUseR2Delivery(key);
  },
};