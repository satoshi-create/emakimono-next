// =============================================================================
// Cloudflare R2 段階移行（カナリアリリース）設定
// =============================================================================

/**
 * 緊急キルスイッチ:
 * R2 側で障害や大量 404 が発生した際、false にするだけで全作品を即座に Cloudinary へ戻す
 */
export const ENABLE_R2_DELIVERY = true;

/**
 * 作品単位（titleen の完全一致）で R2 配信を許可するホワイトリスト
 * ※ 部分一致（includes）は jigokusoushi が kusoushi に誤爆する原因になるため厳禁
 */
export const R2_CANARY_WORK_TITLES = new Set([
  "choju-giga-yamazaki-kou",
  "choju-giga-yamazaki-otu",
  "choju-giga-yamazaki-hei",
  "choju-giga-yamazaki-tei",
  "kuso-zu",
  "kusoushi",
  "kusouzu",
  "nine-stages-of-decay-empress-danrin",
  "tsukumogami",
]);
