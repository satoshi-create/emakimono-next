import { getDb } from "@/db";
import { polaroidBoardItems, polaroidBoards } from "@/db/schema";
import {
  ensureDbConfigured,
  ensureMethod,
  parseNonEmptyString,
  sendApiError,
} from "@/libs/api/dbApi";
import { getVisitorHash } from "@/libs/api/visitorHash";
import { serializeBoardItem } from "@/pages/api/board/[id]/index";
import { and, eq, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

const MAX_SHARED_BOARD_ITEMS = 60;

// =============================================================================
// 1. POST: コラボボードへポラロイドを1枚追加
// =============================================================================

async function handlePost(req, res, boardId) {
  const scrollId = parseNonEmptyString(req.body?.scrollId, 120);
  const src = parseNonEmptyString(req.body?.src, 1000);

  if (!scrollId || !src) {
    return sendApiError(res, 400, "Invalid scrollId or src");
  }

  const sceneIndex = Number.isInteger(Number(req.body?.sceneIndex))
    ? Number(req.body.sceneIndex)
    : 0;

  try {
    const db = getDb();

    const boards = await db
      .select({
        id: polaroidBoards.id,
        description: polaroidBoards.description,
      })
      .from(polaroidBoards)
      .where(eq(polaroidBoards.id, boardId))
      .limit(1);

    if (boards.length === 0) {
      return sendApiError(res, 404, "Board not found");
    }

    let isOnePerUser = false;
    const rawDesc = boards[0]?.description || "";
    const odaiMatch = rawDesc.match(/<!--odai:(\{[\s\S]*?\})-->/);
    if (odaiMatch) {
      try {
        const parsedOdai = JSON.parse(odaiMatch[1]);
        if (parsedOdai?.onePerUser === true) {
          isOnePerUser = true;
        }
      } catch {}
    }

    const countResult = await db
      .select({ count: sql`count(*)` })
      .from(polaroidBoardItems)
      .where(eq(polaroidBoardItems.boardId, boardId));

    const currentCount = Number(countResult[0]?.count ?? 0);
    if (currentCount >= MAX_SHARED_BOARD_ITEMS) {
      return sendApiError(
        res,
        400,
        `Board item limit (${MAX_SHARED_BOARD_ITEMS}) reached`
      );
    }

    const visitorHash = getVisitorHash(req);
    const itemId = uuidv4();
    const panX = Math.round(Number(req.body?.pan?.x ?? req.body?.panX ?? 0)) || 0;
    const panY = Math.round(Number(req.body?.pan?.y ?? req.body?.panY ?? 0)) || 0;
    const zoom = String(Number(req.body?.zoom ?? 1) || 1);
    const coverScale = String(Number(req.body?.coverScale ?? 1) || 1);
    const theme = parseNonEmptyString(req.body?.theme, 40) || "classic";
    const displayTitle = parseNonEmptyString(req.body?.displayTitle, 200) || "";
    const displayChapter = parseNonEmptyString(req.body?.displayChapter, 200) || "";
    const message =
      typeof req.body?.message === "string" ? req.body.message.slice(0, 500) : "";

    // 未指定時は少しずらしたデフォルト位置に配置
    const offset = (currentCount % 8) * 32;
    const boardX =
      req.body?.boardX !== undefined
        ? Math.round(Number(req.body.boardX)) || 0
        : -120 + offset;
    const boardY =
      req.body?.boardY !== undefined
        ? Math.round(Number(req.body.boardY)) || 0
        : -80 + offset;
    const rotate =
      req.body?.rotate !== undefined
        ? String(Number(req.body.rotate) || 0)
        : ((Math.random() - 0.5) * 6).toFixed(2);
      const zIndex = currentCount + 1;
      const authorName = parseNonEmptyString(req.body?.authorName, 40) || "";

      const expectedAdminKey = process.env.NEXT_PUBLIC_BOARD_ADMIN_KEY;
      const providedAdminKey = req.headers["x-board-admin-key"];
      const isBoardAdmin = Boolean(
        expectedAdminKey && providedAdminKey === expectedAdminKey
      );

      const clientId = parseNonEmptyString(req.body?.clientId, 80) || "";
      const storedVisitorHash = clientId
        ? `${visitorHash}:${clientId}`.slice(0, 64)
        : visitorHash;

      if (isOnePerUser && !isBoardAdmin) {
        const existingItems = await db
          .select({
            id: polaroidBoardItems.id,
            visitorHash: polaroidBoardItems.visitorHash,
            authorName: polaroidBoardItems.authorName,
          })
          .from(polaroidBoardItems)
          .where(eq(polaroidBoardItems.boardId, boardId));

        const alreadyPosted = existingItems.some(
          (row) =>
            (clientId &&
              row.visitorHash &&
              (row.visitorHash === clientId || row.visitorHash.endsWith(`:${clientId}`))) ||
            (!clientId && visitorHash && row.visitorHash === visitorHash) ||
            (authorName && row.authorName === authorName)
        );
        if (alreadyPosted) {
          return sendApiError(
            res,
            409,
            "このお題はお一人様1枚まで投稿できます（既にある自分のカードを削除すると再投稿できます）"
          );
        }
      }

      const newRow = {
        id: itemId,
        boardId,
        scrollId,
        sceneIndex,
        src,
        panX,
        panY,
        zoom,
        coverScale,
        theme,
        displayTitle,
        displayChapter,
        message,
        boardX,
        boardY,
        rotate,
        zIndex,
        authorName,
        visitorHash: storedVisitorHash,
        createdAt: new Date(),
      };

    await db.insert(polaroidBoardItems).values(newRow);

    return res.status(201).json({
      ok: true,
      item: serializeBoardItem(newRow, visitorHash),
    });
  } catch (error) {
    console.error("POST /api/board/[id]/items failed:", error);
    return sendApiError(res, 500, "Failed to add polaroid to board");
  }
}

// =============================================================================
// 2. PATCH: カードの位置（boardX/Y）・重なり順（zIndex）・メモ更新
// =============================================================================

async function handlePatch(req, res, boardId) {
  const itemId = parseNonEmptyString(req.body?.itemId, 64);
  if (!itemId) {
    return sendApiError(res, 400, "Invalid itemId");
  }

  const updates = {};
  if (req.body?.boardX !== undefined) {
    updates.boardX = Math.round(Number(req.body.boardX)) || 0;
  }
  if (req.body?.boardY !== undefined) {
    updates.boardY = Math.round(Number(req.body.boardY)) || 0;
  }
  if (req.body?.zIndex !== undefined && Number.isInteger(Number(req.body.zIndex))) {
    updates.zIndex = Number(req.body.zIndex);
  }
  if (typeof req.body?.message === "string") {
    updates.message = req.body.message.slice(0, 500);
  }

  if (Object.keys(updates).length === 0) {
    return sendApiError(res, 400, "No valid fields to update");
  }

  try {
    const db = getDb();

    // メモ更新は投稿者本人のみに制限（位置移動・前面化は全員で整理可能）
    if (updates.message !== undefined) {
      const visitorHash = getVisitorHash(req);
      const target = await db
        .select({ visitorHash: polaroidBoardItems.visitorHash })
        .from(polaroidBoardItems)
        .where(
          and(
            eq(polaroidBoardItems.id, itemId),
            eq(polaroidBoardItems.boardId, boardId)
          )
        )
        .limit(1);

      if (target.length === 0) {
        return sendApiError(res, 404, "Item not found");
      }
      if (target[0].visitorHash !== visitorHash) {
        return sendApiError(res, 403, "Only the author can edit this message");
      }
    }

    await db
      .update(polaroidBoardItems)
      .set(updates)
      .where(
        and(
          eq(polaroidBoardItems.id, itemId),
          eq(polaroidBoardItems.boardId, boardId)
        )
      );

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("PATCH /api/board/[id]/items failed:", error);
    return sendApiError(res, 500, "Failed to update board item");
  }
}

// =============================================================================
// 3. DELETE: 投稿者本人によるポラロイド削除
// =============================================================================

async function handleDelete(req, res, boardId) {
  const itemId = parseNonEmptyString(
    req.query?.itemId ?? req.body?.itemId,
    64
  );
  if (!itemId) {
    return sendApiError(res, 400, "Invalid itemId");
  }

  try {
    const db = getDb();
    const visitorHash = getVisitorHash(req);

    const target = await db
      .select({ visitorHash: polaroidBoardItems.visitorHash })
      .from(polaroidBoardItems)
      .where(
        and(
          eq(polaroidBoardItems.id, itemId),
          eq(polaroidBoardItems.boardId, boardId)
        )
      )
      .limit(1);

    if (target.length === 0) {
      return sendApiError(res, 404, "Item not found");
    }
    if (target[0].visitorHash !== visitorHash) {
      return sendApiError(res, 403, "Only the author can delete this item");
    }

    await db
      .delete(polaroidBoardItems)
      .where(
        and(
          eq(polaroidBoardItems.id, itemId),
          eq(polaroidBoardItems.boardId, boardId)
        )
      );

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/board/[id]/items failed:", error);
    return sendApiError(res, 500, "Failed to delete board item");
  }
}

// =============================================================================
// 4. エントリポイント
// =============================================================================

export default async function handler(req, res) {
  if (!ensureDbConfigured(res)) return;
  if (!ensureMethod(req, res, ["POST", "PATCH", "DELETE"])) return;

  const boardId = parseNonEmptyString(req.query.id, 64);
  if (!boardId) {
    return sendApiError(res, 400, "Invalid board id");
  }

  if (req.method === "POST") {
    return handlePost(req, res, boardId);
  }
  if (req.method === "PATCH") {
    return handlePatch(req, res, boardId);
  }
  return handleDelete(req, res, boardId);
}