import { getDb } from "@/db";
import { emakiLikes } from "@/db/schema";
import {
  ensureDbConfigured,
  ensureMethod,
  parseNonEmptyString,
  sendApiError,
} from "@/libs/api/dbApi";
import { getVisitorHash } from "@/libs/api/visitorHash";
import { and, eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

// =============================================================================
// エントリポイント（POST: 絵巻単位のいいね登録・冪等処理）
// =============================================================================

export default async function handler(req, res) {
  if (!ensureMethod(req, res, "POST") || !ensureDbConfigured(res)) {
    return;
  }

  const emakiId = parseNonEmptyString(req.body?.emakiId);
  if (!emakiId) {
    return sendApiError(res, 400, "Invalid emakiId");
  }

  const visitorHash = getVisitorHash(req);

  try {
    const db = getDb();
    const existing = await db
      .select({ id: emakiLikes.id })
      .from(emakiLikes)
      .where(
        and(
          eq(emakiLikes.emakiId, emakiId),
          eq(emakiLikes.visitorHash, visitorHash)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return res.status(200).json({ ok: true, alreadyLiked: true });
    }

    await db.insert(emakiLikes).values({
      id: uuidv4(),
      emakiId,
      visitorHash,
    });

    return res.status(201).json({ ok: true, alreadyLiked: false });
  } catch (error) {
    console.error("POST /api/likes/emaki failed:", error);
    return sendApiError(res, 500, "Failed to save like");
  }
}