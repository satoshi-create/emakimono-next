import { getDb } from "@/db";
import { sceneLikes } from "@/db/schema";
import { ensureDbConfigured, ensureMethod } from "@/libs/api/dbApi";
import { getVisitorHash } from "@/libs/api/visitorHash";
import { and, eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export default async function handler(req, res) {
  if (!ensureMethod(req, res, "POST") || !ensureDbConfigured(res)) {
    return;
  }

  const { emakiId, sceneIndex, action } = req.body ?? {};
  if (!emakiId || typeof emakiId !== "string" || emakiId.length > 128) {
    return res.status(400).json({ message: "Invalid emakiId" });
  }

  const index = Number(sceneIndex);
  if (!Number.isInteger(index) || index < 0) {
    return res.status(400).json({ message: "Invalid sceneIndex" });
  }

  if (action !== "like" && action !== "unlike") {
    return res.status(400).json({ message: "Invalid action" });
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
      return res.status(200).json({ ok: true, liked: false });
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

    return res.status(200).json({ ok: true, liked: true });
  } catch (error) {
    console.error("POST /api/likes/scene failed:", error);
    return res.status(500).json({ message: "Failed to save scene like" });
  }
}
