/**
 * Cloudinary 配信 URL。変換は必ずスラッシュ区切りにする。
 * カンマ区切りは next/image の srcset を分割し、
 * `/kusouzu/q_75/...` のような相対パス 404 をクローラーが踏む原因になる。
 */
export const CLOUDINARY_UPLOAD_BASE =
  "https://res.cloudinary.com/dw2gjxrrf/image/upload";

export function buildCloudinaryUrl(src, transforms = []) {
  const publicId = String(src || "").replace(/^\//, "");
  const segs = ["fl_progressive", ...transforms.filter(Boolean), publicId];
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
      `w_${width}`,
      "ar_16:9",
      "c_fill",
      gravity,
      "f_auto",
      `q_${quality || 75}`,
      "co_black",
      "e_gradient_fade:y_-0.4",
    ]);
}
