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
import {
  ENABLE_R2_DELIVERY,
  R2_CANARY_WORK_TITLES,
} from "@/config/r2MigrationConfig";

export const CLOUDINARY_UPLOAD_BASE =
  "https://res.cloudinary.com/dw2gjxrrf/image/upload";

// Cloudflare Worker (R2 プロキシ) のベース URL
export const R2_UPLOAD_BASE =
  "https://assets.emakimono.com";

/**
 * R2 配信対象かどうかを判定する（作品単位カナリア判定・部分一致禁止）
 */
function isR2DeliveryTarget(publicId, options = {}) {
  if (!ENABLE_R2_DELIVERY) return false;

  // 1. 明示指定（フォールバック時の "cloudinary" 強制やメタデータ上の "r2" 指定）を最優先
  if (options?.delivery === "r2") return true;
  if (options?.delivery === "cloudinary") return false;

  // 2. 作品の titleen が渡されている場合は完全一致で判定
  if (options?.workTitleEn && R2_CANARY_WORK_TITLES.has(options.workTitleEn)) {
    return true;
  }

  // 3. 後方互換（options 未指定の既存2引数呼び出し向け）:
  //    "emakimono/{slug}__" の {slug} 部分のみを厳密抽出して完全一致照合
  const normalized = String(publicId || "").replace(/^v\d+\//, "");
  const match = normalized.match(/^emakimono\/([^_]+?)__/);
  if (!match) return false;

  const slugHyphen = match[1];
  const slugUnderscore = slugHyphen.replace(/-/g, "_");
  return (
    R2_CANARY_WORK_TITLES.has(slugHyphen) ||
    R2_CANARY_WORK_TITLES.has(slugUnderscore)
  );
}

export function buildCloudinaryUrl(src, transforms = [], options = {}) {
  let publicId = String(src || "").replace(/^\//, "");

  // Cloudflare Worker / R2 経由でキャッシュ付き WebP を直接配信
  if (isR2DeliveryTarget(publicId, options)) {
    if (options?.r2Key) {
      return `${R2_UPLOAD_BASE}/${String(options.r2Key).replace(/^\//, "")}`;
    }
    const r2Key = publicId
      .replace(/^v\d+\//, "")
      .replace(/\.(jpg|jpeg|png)$/i, ".webp");

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