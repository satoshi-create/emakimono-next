import { getDb } from "@/db";
import { polaroidBoardItems, polaroidBoards } from "@/db/schema";
import {
  ensureDbConfigured,
  ensureMethod,
  parseNonEmptyString,
  sendApiError,
} from "@/libs/api/dbApi";
import { getVisitorHash } from "@/libs/api/visitorHash";
import { asc, eq } from "drizzle-orm";

// =============================================================================
// 1. DBレコード → フロントエンド互換アイテム形式への変換
// =============================================================================

export function serializeBoardItem(
  row,
  currentVisitorHash,
  currentClientId = "",
  isBoardAdmin = false
) {
  const isOwner = Boolean(
    isBoardAdmin ||
      (currentClientId &&
        row.visitorHash &&
        (row.visitorHash === currentClientId ||
          row.visitorHash.endsWith(`:${currentClientId}`))) ||
      (!currentClientId &&
        currentVisitorHash &&
        row.visitorHash === currentVisitorHash)
  );
  return {
    id: row.id,
    scrollId: row.scrollId,
    sceneIndex: row.sceneIndex,
    src: row.src,
    pan: { x: row.panX, y: row.panY },
    zoom: Number(row.zoom) || 1,
    coverScale: Number(row.coverScale) || 1,
    theme: row.theme || "classic",
    displayTitle: row.displayTitle || "",
    displayChapter: row.displayChapter || "",
    message: row.message || "",
    boardX: row.boardX,
    boardY: row.boardY,
    rotate: Number(row.rotate) || 0,
    zIndex: row.zIndex,
    likeCount: Number(row.likeCount) || 0,
    authorName: row.authorName || "",
    canEdit: isOwner,
    createdAt: row.createdAt ? new Date(row.createdAt).getTime() : Date.now(),
  };
}

// =============================================================================
// 2. メソッド別ハンドラ（GET: ボード＆全カード取得 / PATCH: タイトル更新）
// =============================================================================

async function handleGet(req, res, boardId) {
  try {
    const db = getDb();
    const boards = await db
      .select()
      .from(polaroidBoards)
      .where(eq(polaroidBoards.id, boardId))
      .limit(1);

    if (boards.length === 0) {
      return sendApiError(res, 404, "Board not found");
    }

    const rows = await db
      .select()
      .from(polaroidBoardItems)
      .where(eq(polaroidBoardItems.boardId, boardId))
      .orderBy(asc(polaroidBoardItems.zIndex), asc(polaroidBoardItems.createdAt));

    const visitorHash = getVisitorHash(req);
    const currentClientId =
      parseNonEmptyString(
        req.headers["x-board-client-id"] || req.query?.clientId,
        80
      ) || "";
    const expectedAdminKey = process.env.NEXT_PUBLIC_BOARD_ADMIN_KEY;
    const providedAdminKey = req.headers["x-board-admin-key"];
    const isBoardAdmin = Boolean(
      expectedAdminKey && providedAdminKey === expectedAdminKey
    );
    const board = boards[0];

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({
      board: {
        id: board.id,
        title: board.title,
        description: board.description || "",
        visibility: board.visibility || "unlisted",
        isOwner: board.createdByHash === visitorHash,
        createdAt: board.createdAt ? new Date(board.createdAt).getTime() : Date.now(),
      },
      items: rows.map((row) =>
        serializeBoardItem(row, visitorHash, currentClientId, isBoardAdmin)
      ),
    });
  } catch (error) {
    console.error("GET /api/board/[id] failed:", error);
    return sendApiError(res, 500, "Failed to fetch board");
  }
}

async function handlePatch(req, res, boardId) {
  const hasTitle = Object.prototype.hasOwnProperty.call(req.body || {}, "title");
  const hasDescription = Object.prototype.hasOwnProperty.call(
    req.body || {},
    "description"
  );

    const expectedAdminKey = process.env.NEXT_PUBLIC_BOARD_ADMIN_KEY;
    const providedAdminKey = req.headers["x-board-admin-key"];
    if (!expectedAdminKey || providedAdminKey !== expectedAdminKey) {
      return sendApiError(res, 403, "Admin permission required to update board");
    }

    const title = hasTitle ? parseNonEmptyString(req.body?.title, 100) : null;
    if (hasTitle && !title) {
      return sendApiError(res, 400, "Invalid title");
    }

  const description = hasDescription
    ? String(req.body?.description ?? "").trim().slice(0, 500)
    : null;

  if (!hasTitle && !hasDescription) {
    return sendApiError(res, 400, "No updatable fields provided");
  }

  try {
    const db = getDb();
    const existing = await db
      .select({ id: polaroidBoards.id })
      .from(polaroidBoards)
      .where(eq(polaroidBoards.id, boardId))
      .limit(1);

    if (existing.length === 0) {
      return sendApiError(res, 404, "Board not found");
    }

    const updates = {};
    if (hasTitle) updates.title = title;
    if (hasDescription) updates.description = description;

    await db
      .update(polaroidBoards)
      .set(updates)
      .where(eq(polaroidBoards.id, boardId));

      return res.status(200).json({ ok: true, ...updates });
    } catch (error) {
      console.error("PATCH /api/board/[id] failed:", error);
      return sendApiError(res, 500, "Failed to update board");
    }
  }

  async function handleDelete(req, res, boardId) {
    const expectedAdminKey = process.env.NEXT_PUBLIC_BOARD_ADMIN_KEY;
    const providedAdminKey = req.headers["x-board-admin-key"];
    const isDev = process.env.NODE_ENV === "development";
    if (!isDev && (!expectedAdminKey || providedAdminKey !== expectedAdminKey)) {
      return sendApiError(res, 403, "Admin permission required to delete board");
    }

    try {
      const db = getDb();
      const existing = await db
        .select({ id: polaroidBoards.id })
        .from(polaroidBoards)
        .where(eq(polaroidBoards.id, boardId))
        .limit(1);

      if (existing.length === 0) {
        return sendApiError(res, 404, "Board not found");
      }

      await db
        .delete(polaroidBoardItems)
        .where(eq(polaroidBoardItems.boardId, boardId));
      await db
        .delete(polaroidBoards)
        .where(eq(polaroidBoards.id, boardId));

      return res.status(200).json({ ok: true, deletedId: boardId });
    } catch (error) {
      console.error("DELETE /api/board/[id] failed:", error);
      return sendApiError(res, 500, "Failed to delete board");
    }
  }

  // =============================================================================
  // 3. エントリポイント
  // =============================================================================

  export default async function handler(req, res) {
    if (!ensureDbConfigured(res)) return;
    if (!ensureMethod(req, res, ["GET", "PATCH", "DELETE"])) return;

    const boardId = parseNonEmptyString(req.query.id, 64);
    if (!boardId) {
      return sendApiError(res, 400, "Invalid board id");
    }

    if (req.method === "GET") {
      return handleGet(req, res, boardId);
    }
    if (req.method === "DELETE") {
      return handleDelete(req, res, boardId);
    }
    return handlePatch(req, res, boardId);
  }