/**
 * Cloudinary 画像URL用の定数とユーティリティ
 * images.src が emakimono/... 等の相対パスの場合、ベースURLと結合してフルURLを生成
 */
export const CLOUDINARY_BASE_URL =
  "https://res.cloudinary.com/dw2gjxrrf/image/upload/";

/**
 * 相対パス（emakimono/... 等）の場合はベースURLと結合、既に http の場合はそのまま返す
 * @param {string} src - Supabase 等から取得した src（相対 or 完全URL）
 * @returns {string} 表示用の完全URL
 */
export function resolveCloudinarySrc(src) {
  if (!src || typeof src !== "string") return "";
  if (src.startsWith("http://") || src.startsWith("https://")) {
    return src;
  }
  // 相対パス: emakimono/... や v123/... 等
  return `${CLOUDINARY_BASE_URL}${src}`;
}
