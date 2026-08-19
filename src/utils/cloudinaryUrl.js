/**
 * Cloudinary 配信 URL。
 * 同一変換ブロック内のカンマは %2C にエンコードする。
 * リテラルのカンマは next/image の srcset を分割し、相対パス 404 になる。
 * スラッシュは独立した変換チェーン（Cloudinary 公式の chained transformation）。
 */
export const CLOUDINARY_UPLOAD_BASE =
  "https://res.cloudinary.com/dw2gjxrrf/image/upload";

export function buildCloudinaryUrl(src, transforms = []) {
  const publicId = String(src || "").replace(/^\//, "");
  const segs = [
    "fl_progressive",
    ...transforms.filter(Boolean).map((s) => String(s).replace(/,/g, "%2C")),
    publicId,
  ];
  return `${CLOUDINARY_UPLOAD_BASE}/${segs.join("/")}`;
}

export function cloudinaryThumbLoader({ src, width, quality }) {
  return buildCloudinaryUrl(src, [
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
