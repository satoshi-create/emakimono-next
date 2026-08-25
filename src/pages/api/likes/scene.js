import { getDb } from "@/db";
import { sceneLikes } from "@/db/schema";
import { ensureDbConfigured } from "@/libs/api/dbApi";
import { getVisitorHash } from "@/libs/api/visitorHash";
import { and, eq, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

async function selectSceneLikeCount(db, emakiId, index) {
  const result = await db
    .select({ count: sql`count(*)` })
    .from(sceneLikes)
    .where(
      and(eq(sceneLikes.emakiId, emakiId), eq(sceneLikes.sceneIndex, index))
    );

  return Number(result[0]?.count ?? 0);
}

export default async function handler(req, res) {
  if (!ensureDbConfigured(res)) {
    return;
  }

  if (req.method === "GET") {
    const { emakiId } = req.query ?? {};
    if (!emakiId || typeof emakiId !== "string" || emakiId.length > 128) {
      return res.status(400).json({ message: "Invalid emakiId" });
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
      return res.status(500).json({ message: "Failed to load scene likes" });
    }
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
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
    return res.status(500).json({ message: "Failed to save scene like" });
  }
}
