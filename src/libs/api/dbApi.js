import { isDbConfigured } from "@/db";

// =============================================================================
// 1. 共通エラー・ガードレスポンス
// =============================================================================

/**
 * 統一フォーマットで JSON エラーを返却する
 * @param {import('next').NextApiResponse} res
 * @param {number} status
 * @param {string} message
 */
export function sendApiError(res, status, message) {
  res.status(status).json({ message });
  return false;
}

/**
 * Turso DB の接続設定有無を検証し、未設定時は 503 を返す
 * @param {import('next').NextApiResponse} res
 * @returns {boolean}
 */
export function ensureDbConfigured(res) {
  if (!isDbConfigured()) {
    return sendApiError(res, 503, "Database is not configured");
  }
  return true;
}

/**
 * 許可された HTTP メソッドかを検証し、不一致時は Allow ヘッダ付きで 405 を返す
 * @param {import('next').NextApiRequest} req
 * @param {import('next').NextApiResponse} res
 * @param {string | string[]} allowedMethods
 * @returns {boolean}
 */
export function ensureMethod(req, res, allowedMethods) {
  const methods = Array.isArray(allowedMethods) ? allowedMethods : [allowedMethods];
  if (!methods.includes(req.method)) {
    res.setHeader("Allow", methods);
    return sendApiError(res, 405, `Method ${req.method} Not Allowed`);
  }
  return true;
}

// =============================================================================
// 2. 入力バリデーションヘルパー
// =============================================================================

/**
 * 空でないトリム済み文字列を返す（不正値の場合は null）
 * @param {unknown} value
 * @param {number} [maxLength=200]
 * @returns {string | null}
 */
export function parseNonEmptyString(value, maxLength = 200) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) return null;
  return trimmed;
}
