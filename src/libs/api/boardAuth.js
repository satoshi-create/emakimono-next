import { getVisitorHash } from "./visitorHash";

// =============================================================================
// 1. 管理者キー・リクエストアクター解決（全ボードAPI共通）
// =============================================================================

/**
 * リクエストヘッダーと環境変数から操作者（管理者 / 投稿者クライアント）情報を解決する
 * 環境変数名は NEXT_PUBLIC_BOARD_ADMIN_KEY に統一し、APIごとのキー不一致を防ぐ
 */
export function resolveBoardActor(req) {
  const visitorHash = getVisitorHash(req) || "";
  const rawClientId = req.headers?.["x-board-client-id"];
  const clientId =
    typeof rawClientId === "string" ? rawClientId.trim().slice(0, 80) : "";

  const expectedAdminKey = process.env.NEXT_PUBLIC_BOARD_ADMIN_KEY || "";
  const providedAdminKey = req.headers?.["x-board-admin-key"];
  const isBoardAdmin = Boolean(
    expectedAdminKey && providedAdminKey === expectedAdminKey
  );

  // DB保存用の複合ハッシュ（clientId がある場合は IPハッシュと結合）
  const storedVisitorHash = clientId
    ? `${visitorHash}:${clientId}`.slice(0, 64)
    : visitorHash;

  return {
    visitorHash,
    clientId,
    storedVisitorHash,
    isBoardAdmin,
  };
}

// =============================================================================
// 2. アイテム単位の編集・削除権限判定（Pure Logic）
// =============================================================================

/**
 * 対象アイテムに対して現在のリクエスト操作者が変更・削除権限を持つか判定する
 */
export function canModifyBoardItem(actor, item) {
  if (!actor || !item) return false;
  if (actor.isBoardAdmin) return true;

  const storedHash = item.visitorHash || "";
  if (actor.visitorHash && storedHash === actor.visitorHash) {
    return true;
  }
  if (
    actor.clientId &&
    (storedHash === actor.clientId || storedHash.endsWith(`:${actor.clientId}`))
  ) {
    return true;
  }
  return false;
}