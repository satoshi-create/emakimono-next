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

// Cloudflare Worker (R2 プロキシ) のベース URL
export const R2_UPLOAD_BASE =
  "https://assets.emakimono.com";

/**
 * 山崎本 甲巻かどうかを判定
 */
function isYamazakiKou(publicId) {
  return publicId.includes("choju-giga-yamazaki-kou");
}

export function buildCloudinaryUrl(src, transforms = []) {
  let publicId = String(src || "").replace(/^\//, "");

  // 山崎本 甲巻: Cloudflare Worker 経由でキャッシュ付き WebP を直接配信
  if (isYamazakiKou(publicId)) {
    const r2Key = publicId
      .replace(/^v\d+\//, "")
      .replace(/\.jpg$/, ".webp");

    return `${R2_UPLOAD_BASE}/${r2Key}`;
  }

  // それ以外の絵巻: 従来の Cloudinary 配信を維持
  const uploadPath = [
    "fl_progressive",
    ...transforms.filter(Boolean).map((s) => String(s).replace(/,/g, "%2C")),
    publicId,
  ].join("/");

  return `${CLOUDINARY_UPLOAD_BASE}/${uploadPath}`;
}

export function cloudinaryThumbLoader({ src, width, quality }) {
  return buildCloudinaryUrl(src, [
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