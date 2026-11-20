import { getDb } from "@/db";
import { sceneLikes } from "@/db/schema";
import {
  ensureDbConfigured,
  ensureMethod,
  parseNonEmptyString,
  sendApiError,
} from "@/libs/api/dbApi";
import { getVisitorHash } from "@/libs/api/visitorHash";
import { and, eq, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

// =============================================================================
// 1. DB クエリヘルパー
// =============================================================================

async function selectSceneLikeCount(db, emakiId, index) {
  const result = await db
    .select({ count: sql`count(*)` })
    .from(sceneLikes)
    .where(
      and(eq(sceneLikes.emakiId, emakiId), eq(sceneLikes.sceneIndex, index))
    );

  return Number(result[0]?.count ?? 0);
}

// =============================================================================
// 2. メソッド別ハンドラ（GET: シーン別集計 / POST: いいね登録・解除）
// =============================================================================

async function handleGet(req, res) {
  const emakiId = parseNonEmptyString(req.query?.emakiId, 128);
  if (!emakiId) {
    return sendApiError(res, 400, "Invalid emakiId");
  }

  const db = getDb();

  try {
    const rows = await db
      .select({
        sceneIndex: sceneLikes.sceneIndex,
        count: sql`count(*)`,
      })
      .from(sceneLikes)
      .where(eq(sceneLikes.emakiId, emakiId))
      .groupBy(sceneLikes.sceneIndex);

    const counts = rows.reduce((acc, row) => {
      acc[row.sceneIndex] = Number(row.count ?? 0);
      return acc;
    }, {});

    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    return res.status(200).json({ counts });
  } catch (error) {
    console.error("GET /api/likes/scene failed:", error);
    return sendApiError(res, 500, "Failed to load scene likes");
  }
}

async function handlePost(req, res) {
  const emakiId = parseNonEmptyString(req.body?.emakiId, 128);
  const sceneIndex = req.body?.sceneIndex;
  const action = req.body?.action;

  if (!emakiId) {
    return sendApiError(res, 400, "Invalid emakiId");
  }

  const index = Number(sceneIndex);
  if (!Number.isInteger(index) || index < 0) {
    return sendApiError(res, 400, "Invalid sceneIndex");
  }

  if (action !== "like" && action !== "unlike") {
    return sendApiError(res, 400, "Invalid action");
  }

  const visitorHash = getVisitorHash(req);
  const db = getDb();

  try {
    const whereClause = and(
      eq(sceneLikes.emakiId, emakiId),
      eq(sceneLikes.sceneIndex, index),
      eq(sceneLikes.visitorHash, visitorHash)
    );

    if (action === "unlike") {
      await db.delete(sceneLikes).where(whereClause);
      const count = await selectSceneLikeCount(db, emakiId, index);
      return res.status(200).json({ ok: true, liked: false, count });
    }

    const existing = await db
      .select({ id: sceneLikes.id })
      .from(sceneLikes)
      .where(whereClause)
      .limit(1);

    if (existing.length === 0) {
      await db.insert(sceneLikes).values({
        id: uuidv4(),
        emakiId,
        sceneIndex: index,
        visitorHash,
      });
    }

    const count = await selectSceneLikeCount(db, emakiId, index);
    return res.status(200).json({ ok: true, liked: true, count });
  } catch (error) {
    console.error("POST /api/likes/scene failed:", error);
    return sendApiError(res, 500, "Failed to save scene like");
  }
}

// =============================================================================
// 3. エントリポイント
// =============================================================================

export default async function handler(req, res) {
  if (!ensureDbConfigured(res)) return;
  if (!ensureMethod(req, res, ["GET", "POST"])) return;

  if (req.method === "GET") {
    return handleGet(req, res);
  }
  return handlePost(req, res);
}