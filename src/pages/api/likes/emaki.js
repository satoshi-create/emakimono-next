import { getDb } from "@/db";
import { emakiLikes } from "@/db/schema";
import { ensureDbConfigured, ensureMethod } from "@/libs/api/dbApi";
import { getVisitorHash } from "@/libs/api/visitorHash";
import { and, eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export default async function handler(req, res) {
  if (!ensureMethod(req, res, "POST") || !ensureDbConfigured(res)) {
    return;
  }

  const { emakiId } = req.body ?? {};
  if (!emakiId || typeof emakiId !== "string" || emakiId.length > 128) {
    return res.status(400).json({ message: "Invalid emakiId" });
  }

  const visitorHash = getVisitorHash(req);
  const db = getDb();

  try {
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
    return res.status(500).json({ message: "Failed to save like" });
  }
}
