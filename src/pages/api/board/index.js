import { getDb } from "@/db";
import { polaroidBoardItems, polaroidBoards } from "@/db/schema";
import {
  ensureDbConfigured,
  ensureMethod,
  parseNonEmptyString,
  sendApiError,
} from "@/libs/api/dbApi";
import { getVisitorHash } from "@/libs/api/visitorHash";
import { desc, eq, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

// =============================================================================
// 1. ヘルパー（短いルームID生成・初期アイテム変換）
// =============================================================================

function createShortBoardId() {
  return `b_${uuidv4().replace(/-/g, "").slice(0, 10)}`;
}

function normalizeInitialItem(raw, boardId, visitorHash, fallbackAuthor, index) {
  const scrollId = parseNonEmptyString(raw?.scrollId, 120);
  const src = parseNonEmptyString(raw?.src, 1000);
  if (!scrollId || !src) return null;

  const sceneIndex = Number.isInteger(Number(raw?.sceneIndex))
    ? Number(raw.sceneIndex)
    : 0;

  return {
    id: uuidv4(),
    boardId,
    scrollId,
    sceneIndex,
    src,
    panX: Math.round(Number(raw?.pan?.x ?? raw?.panX ?? 0)) || 0,
    panY: Math.round(Number(raw?.pan?.y ?? raw?.panY ?? 0)) || 0,
    zoom: String(Number(raw?.zoom ?? 1) || 1),
    coverScale: String(Number(raw?.coverScale ?? 1) || 1),
    theme: parseNonEmptyString(raw?.theme, 40) || "classic",
    displayTitle: parseNonEmptyString(raw?.displayTitle, 200) || "",
    displayChapter: parseNonEmptyString(raw?.displayChapter, 200) || "",
    message: typeof raw?.message === "string" ? raw.message.slice(0, 500) : "",
    boardX: Math.round(Number(raw?.boardX ?? 0)) || 0,
    boardY: Math.round(Number(raw?.boardY ?? 0)) || 0,
    rotate: String(Number(raw?.rotate ?? 0) || 0),
    zIndex: Number.isInteger(Number(raw?.zIndex)) ? Number(raw.zIndex) : index + 1,
    authorName:
      parseNonEmptyString(raw?.authorName, 40) || fallbackAuthor || "",
    visitorHash,
  };
}

// =============================================================================
// 2. エントリポイント（POST: コラボボード新規発行）
// =============================================================================

async function handleGetPublicBoards(res) {
  try {
    const db = getDb();
    const boards = await db
      .select({
        id: polaroidBoards.id,
        title: polaroidBoards.title,
        description: polaroidBoards.description,
        visibility: polaroidBoards.visibility,
        createdAt: polaroidBoards.createdAt,
        itemCount: sql`count(${polaroidBoardItems.id})`,
      })
      .from(polaroidBoards)
      .leftJoin(
        polaroidBoardItems,
        eq(polaroidBoards.id, polaroidBoardItems.boardId)
      )
      .where(eq(polaroidBoards.visibility, "public"))
      .groupBy(polaroidBoards.id)
      .orderBy(desc(polaroidBoards.createdAt))
      .limit(30);

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({
      boards: boards.map((b) => ({
        id: b.id,
        title: b.title,
        description: b.description || "",
        visibility: b.visibility,
        itemCount: Number(b.itemCount ?? 0),
        createdAt: b.createdAt ? new Date(b.createdAt).getTime() : Date.now(),
      })),
    });
  } catch (error) {
    console.error("GET /api/board failed:", error);
    return sendApiError(res, 500, "Failed to fetch public boards");
  }
}

export default async function handler(req, res) {
  if (!ensureDbConfigured(res)) return;
  if (!ensureMethod(req, res, ["GET", "POST"])) return;

  if (req.method === "GET") {
    return handleGetPublicBoards(res);
  }

    const title =
      parseNonEmptyString(req.body?.title, 100) || "みんなのポラロイドボード";
    const description = parseNonEmptyString(req.body?.description, 800) || "";
    const visibility = req.body?.visibility === "public" ? "public" : "unlisted";

    if (visibility === "public") {
      const expectedAdminKey = process.env.NEXT_PUBLIC_BOARD_ADMIN_KEY;
      const providedAdminKey = req.headers["x-board-admin-key"];
      if (!expectedAdminKey || providedAdminKey !== expectedAdminKey) {
        return sendApiError(res, 403, "Admin permission required to create public boards");
      }
    }
  const authorName = parseNonEmptyString(req.body?.authorName, 40) || "";
  const rawItems = Array.isArray(req.body?.items)
    ? req.body.items.slice(0, 30)
    : [];

  const boardId = createShortBoardId();
  const visitorHash = getVisitorHash(req);

  try {
    const db = getDb();

    await db.insert(polaroidBoards).values({
      id: boardId,
      title,
      description,
      visibility,
      createdByHash: visitorHash,
    });

    const initialRows = rawItems
      .map((item, idx) =>
        normalizeInitialItem(item, boardId, visitorHash, authorName, idx)
      )
      .filter(Boolean);

    if (initialRows.length > 0) {
      await db.insert(polaroidBoardItems).values(initialRows);
    }

    return res.status(201).json({
      ok: true,
      board: {
        id: boardId,
        title,
        description,
        visibility,
      },
      itemCount: initialRows.length,
    });
  } catch (error) {
    console.error("POST /api/board failed:", error);
    return sendApiError(res, 500, "Failed to create polaroid board");
  }
}
