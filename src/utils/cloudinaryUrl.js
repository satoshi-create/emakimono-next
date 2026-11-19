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
import { shouldUseR2Delivery } from "@/config/r2MigrationConfig";

export const CLOUDINARY_UPLOAD_BASE =
  "https://res.cloudinary.com/dw2gjxrrf/image/upload";

// Cloudflare Worker (R2 プロキシ) のベース URL
export const R2_UPLOAD_BASE =
  "https://assets.emakimono.com";

/**
 * R2 配信対象かどうかを判定する（未移行作品以外は R2・部分一致禁止）
 */
function isR2DeliveryTarget(publicId, options = {}) {
  // 1. 明示指定（フォールバック時の "cloudinary" 強制やメタデータ上の "r2" 指定）を最優先
  if (options?.delivery === "r2") return true;
  if (options?.delivery === "cloudinary") return false;

  // 2. 作品の titleen が渡されている場合
  if (options?.workTitleEn) {
    return shouldUseR2Delivery(options.workTitleEn);
  }

  // 3. 後方互換（options 未指定の既存2引数呼び出し向け）:
  //    "emakimono/{slug}__" の {slug} 部分のみを厳密抽出して titleen 相当で判定
  const normalized = String(publicId || "").replace(/^v\d+\//, "");
  const match = normalized.match(/^(?:emakimono\/)?([^/_]+?)__/);
  if (!match) return shouldUseR2Delivery(null);

  const slugHyphen = match[1];
  const slugUnderscore = slugHyphen.replace(/-/g, "_");
  return (
    shouldUseR2Delivery(slugHyphen) || shouldUseR2Delivery(slugUnderscore)
  );
}

function resolveWorkTitleEn(publicId, options = {}) {
  if (options?.workTitleEn) {
    return String(options.workTitleEn);
  }
  const normalized = String(publicId || "").replace(/^v\d+\//, "");
  const match = normalized.match(/^(?:emakimono\/)?([^/_]+?)__/);
  return match ? match[1] : null;
}

function isWorkInLocalPreviewList(workTitleEn) {
  const raw =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_LOCAL_PREVIEW_SCROLLS
      : "";
  if (!raw || !workTitleEn) return false;
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .includes(workTitleEn);
}

function shouldUseLocalDelivery(publicId, options = {}) {
  if (
    String(publicId || "").startsWith("/dev-scroll-images/") ||
    String(publicId || "").replace(/^\//, "").startsWith("dev-scroll-images/")
  ) {
    return true;
  }
  if (options?.delivery === "local") return true;
  const workTitleEn = resolveWorkTitleEn(publicId, options);
  return isWorkInLocalPreviewList(workTitleEn);
}

function extractLocalImageFileName(publicId, r2Key) {
  if (r2Key) {
    const key = String(r2Key).replace(/^\//, "");
    const segment = key.split("/").pop();
    if (segment) return segment;
  }
  const id = String(publicId || "").replace(/^\//, "").replace(/^v\d+\//, "");
  const segment = id.split("/").pop();
  return segment || id;
}

export function buildCloudinaryUrl(src, transforms = [], options = {}) {
  if (typeof src === "string" && src.startsWith("/dev-scroll-images/")) {
    return src;
  }
  let publicId = String(src || "").replace(/^\//, "");

  if (shouldUseLocalDelivery(publicId, options)) {
    const workTitleEn = resolveWorkTitleEn(publicId, options);
    const baseName = extractLocalImageFileName(publicId, options?.r2Key);
    if (workTitleEn && baseName) {
      return `/dev-scroll-images/${workTitleEn}/${baseName}`;
    }
  }

  // Cloudflare Worker / R2 経由でキャッシュ付き WebP を直接配信
  if (isR2DeliveryTarget(publicId, options)) {
    if (options?.r2Key) {
      return `${R2_UPLOAD_BASE}/${String(options.r2Key).replace(/^\//, "")}`;
    }
    let r2Key = publicId
      .replace(/^v\d+\//, "")
      .replace(/\.(jpg|jpeg|png)$/i, ".webp");
    if (!r2Key.startsWith("emakimono/")) {
      r2Key = `emakimono/${r2Key}`;
    }

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