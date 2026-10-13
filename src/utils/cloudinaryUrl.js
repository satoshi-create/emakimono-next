/**
 * Cloudinary 配信 URL。
 * 同一変換ブロック内のカンマは %2C にエンコードする。
 * リテラルのカンマは next/image の srcset を分割し、相対パス 404 になる。
 * スラッシュは独立した変換チェーン（Cloudinary 公式の chained transformation）。
 *
 * `src` はキャッシュ形式（naming-convention.md）:
 *   - 推奨: `v{version}/emakimono/{public_id}.jpg`（overwrite 後の CDN バスティング）
 *   - 旧: `emakimono/{public_id}.jpg`
 * 変換は version / public_id の前に置く:
 *   .../upload/{transforms}/v{version}/emakimono/{id}.jpg
 */
export const CLOUDINARY_UPLOAD_BASE =
  "https://res.cloudinary.com/dw2gjxrrf/image/upload";

/** Vercel CDN 経由のキャッシュプロキシ（案A）。段階導入: 甲巻のみ */
export const PROXY_UPLOAD_BASE = "/emaki-assets";

/**
 * 鳥獣人物戯画（甲巻）のみプロキシ対象。
 * Cloudinary public_id: choju-giga-yamazaki-kou__…
 * titleen 表記・略称も含めて誤爆を防ぐ。
 */
function shouldUseVercelCacheProxy(publicId) {
  const id = String(publicId || "").toLowerCase();
  return (
    id.includes("choju-giga-yamazaki-kou") ||
    id.includes("choju-first") ||
    id.includes("chōjū-jinbutsu-giga_first") ||
    id.includes("choju-jinbutsu-giga_first")
  );
}

export function buildCloudinaryUrl(src, transforms = []) {
  const publicId = String(src || "").replace(/^\//, "");
  // upload 以降は直 URL / プロキシで同一。rewrites の :path* にそのまま載る
  // 例: /emaki-assets/{transforms}/v{ver}/emakimono/{id}.jpg
  //  → …/image/upload/{transforms}/v{ver}/emakimono/{id}.jpg
  const uploadPath = [
    "fl_progressive",
    ...transforms.filter(Boolean).map((s) => String(s).replace(/,/g, "%2C")),
    publicId,
  ].join("/");
  const base = shouldUseVercelCacheProxy(publicId)
    ? PROXY_UPLOAD_BASE
    : CLOUDINARY_UPLOAD_BASE;
  return `${base}/${uploadPath}`;
}

export function cloudinaryThumbLoader({ src, width, quality }) {
  return buildCloudinaryUrl(src, [
    // c_limit: 要求幅が原寸を超えても拡大しない（過大配信の抑止）
    "c_limit",
    "f_auto",
    `w_${width}`,
    `q_${quality || 75}`,
  ]);
}

export function createCloudinaryHeroLoader(gravity = "g_face") {
  return ({ src, width, quality }) =>
    buildCloudinaryUrl(src, [
      `c_fill,w_${width},ar_16:9,${gravity}`,
      "f_auto",
      `q_${quality || 75}`,
      "co_black,e_gradient_fade:y_-0.4",
    ]);
}

/**
 * srcset 分割でサイト相対になった Cloudinary パスなら CDN 絶対 URL を返す。
 * 本物の /kusouzu/[slug] は /v数字/emakimono/ を含まない。
 * @param {string} pathname
 * @returns {string | null}
 */
export function toCloudinaryUploadRedirect(pathname) {
  const stripped = String(pathname || "").replace(/^\/(en|ja)(?=\/)/, "");
  const match = stripped.match(
    /^\/kusouzu\/((?:[a-z]{1,4}_[^/]+\/)+v\d+\/emakimono\/.+)$/i
  );
  if (!match) return null;
  return `${CLOUDINARY_UPLOAD_BASE}/${match[1]}`;
}
