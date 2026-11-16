// =============================================================================
// 1. レイアウト定数（CSS .layer の --spot-edge-inset と EDGE_MARGIN は同値に保つ）
// =============================================================================

/** スポット層の端からの最小インセット（px） */
export const EDGE_MARGIN = 4;

/** ピン基点とバッジラベル間の gap（px） */
export const BADGE_GAP = 10;

/** スライス画像ファイル名の拡張子判定 */
export const IMAGE_FILE_EXT_RE = /\.(webp|jpe?g|png)$/i;

// =============================================================================
// 2. 未測定時のフォールバックと transform-origin（CLS 回避・端寄り反転）
// =============================================================================

/**
 * バッジ実測前に使う CSS calc オフセット。原則左上寄せ、端に近いとき反対側へ。
 * @param {number} x スポット X（%）
 * @param {number} y スポット Y（%）
 */
export function fallbackOffset(x, y) {
  return {
    offsetX:
      x <= 30 ? `calc(0% + ${BADGE_GAP}px)` : `calc(-100% - ${BADGE_GAP}px)`,
    offsetY:
      y <= 30 ? `calc(0% + ${BADGE_GAP}px)` : `calc(-100% - ${BADGE_GAP}px)`,
  };
}

/** offsetX/Y の calc 文字列から、アンカー点に接する角を不動点とする transform-origin */
export function transformOriginFor(offsetX, offsetY) {
  const horizontal = String(offsetX).includes("-100%") ? "right" : "left";
  const vertical = String(offsetY).includes("-100%") ? "bottom" : "top";
  return `${horizontal} ${vertical}`;
}

// =============================================================================
// 3. ポインタ座標 → スポット百分率（レイヤ矩形のみに依存する純粋計算）
// =============================================================================

/**
 * クライアント座標と getBoundingClientRect の結果から、スポット用 % 座標を算出。
 * 絵巻の負値空間を許容するため X/Y は -150〜250 にクランプ。
 */
export function percentFromPointerFromRect(clientX, clientY, rect) {
  if (!rect || !rect.width || !rect.height) return null;
  const x = ((clientX - rect.left) / rect.width) * 100;
  const y = ((clientY - rect.top) / rect.height) * 100;
  return {
    x: Math.round(Math.min(250, Math.max(-150, x)) * 10) / 10,
    y: Math.round(Math.min(250, Math.max(-150, y)) * 10) / 10,
  };
}

// =============================================================================
// 4. バッジ位置クランプ（実測 px：端ではみ出し時のみ反対側へ退避）
// =============================================================================

/**
 * スポット百分率とバッジサイズから offset / ガイド線オフセットを決める。
 * @param {object} params
 * @param {number} params.layerWidth
 * @param {number} params.layerHeight
 * @param {number} params.spotXPercent
 * @param {number} params.spotYPercent
 * @param {number} params.badgeWidth
 * @param {number} params.badgeHeight
 * @returns {{ offsetX: string, offsetY: string, guideX: number, guideY: number }}
 */
export function clampBadgePosition({
  layerWidth,
  layerHeight,
  spotXPercent,
  spotYPercent,
  badgeWidth,
  badgeHeight,
}) {
  const X = (layerWidth * spotXPercent) / 100;
  const Y = (layerHeight * spotYPercent) / 100;

  let offsetX = `calc(-100% - ${BADGE_GAP}px)`;
  if (X - badgeWidth - BADGE_GAP < EDGE_MARGIN) {
    offsetX = `calc(0% + ${BADGE_GAP}px)`;
  }

  let offsetY = `calc(-100% - ${BADGE_GAP}px)`;
  if (Y - badgeHeight - BADGE_GAP < EDGE_MARGIN) {
    offsetY = `calc(0% + ${BADGE_GAP}px)`;
  }

  const guideX = offsetX.startsWith("calc(-100%")
    ? -BADGE_GAP
    : badgeWidth + BADGE_GAP;
  const guideY = offsetY.startsWith("calc(-100%")
    ? -BADGE_GAP
    : badgeHeight + BADGE_GAP;

  return { offsetX, offsetY, guideX, guideY };
}

// =============================================================================
// 5. 識別子抽出（ルート slug・スライス画像名）
// =============================================================================

/**
 * 絵巻ページの slug を pathname から取得（末尾セグメント）。
 * @param {string} pathname 例: "/rakuchu_rakugai_met"
 */
export function getSlugFromPath(pathname) {
  if (!pathname || typeof pathname !== "string") return "";
  return pathname.split("/").filter(Boolean).pop() || "";
}

/**
 * <img> の src / currentSrc からスライス識別名を得る。
 * Next.js Image の `/_next/image?url=...` をデコードし、拡張子・クエリを除去。
 * @param {HTMLImageElement|null|undefined} imgEl
 * @param {string} [baseHref] URL 解決用（ブラウザでは location.href 相当）
 */
export function extractSliceImageName(imgEl, baseHref = "") {
  if (!imgEl) return null;
  let raw = imgEl.currentSrc || imgEl.src || "";
  if (!raw) return null;

  try {
    const parsed = new URL(raw, baseHref || undefined);
    const nestedUrl = parsed.searchParams.get("url");
    if (nestedUrl) raw = nestedUrl;
  } catch {
    // 相対パス等は後段でフォールバック
  }

  let path = raw;
  try {
    path = new URL(raw, baseHref || undefined).pathname;
  } catch {
    path = raw.split("?")[0].split("#")[0];
  }

  const base = path.split("/").pop() || "";
  const name = base.replace(IMAGE_FILE_EXT_RE, "");
  return name || null;
}