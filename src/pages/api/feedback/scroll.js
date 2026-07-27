import { getDb } from "@/db";
import { scrollFeedback } from "@/db/schema";
import { SCROLL_FEEDBACK_CHOICES } from "@/libs/constants/scrollFeedback";
import { ensureDbConfigured, ensureMethod } from "@/libs/api/dbApi";
import { getVisitorHash } from "@/libs/api/visitorHash";
import { v4 as uuidv4 } from "uuid";

export default async function handler(req, res) {
  if (!ensureMethod(req, res, "POST") || !ensureDbConfigured(res)) {
    return;
  }

  const { emakiId, choice, sceneIndex, scrollRatio, locale } = req.body ?? {};

  if (!emakiId || typeof emakiId !== "string" || emakiId.length > 128) {
    return res.status(400).json({ message: "Invalid emakiId" });
  }

  if (!choice || !SCROLL_FEEDBACK_CHOICES.includes(choice)) {
    return res.status(400).json({ message: "Invalid choice" });
  }

  const index = Number(sceneIndex);
  if (!Number.isInteger(index) || index < 0) {
    return res.status(400).json({ message: "Invalid sceneIndex" });
  }

  let ratio = null;
  if (scrollRatio != null) {
    const parsed = Number(scrollRatio);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
      return res.status(400).json({ message: "Invalid scrollRatio" });
    }
    ratio = Math.round(parsed * 1000) / 1000;
  }

  const db = getDb();

  try {
    await db.insert(scrollFeedback).values({
      id: uuidv4(),
      emakiId,
      choice,
      sceneIndex: index,
      scrollRatio: ratio,
      locale: typeof locale === "string" ? locale.slice(0, 8) : null,
      visitorHash: getVisitorHash(req),
    });

    return res.status(201).json({ ok: true });
  } catch (error) {
    console.error("POST /api/feedback/scroll failed:", error);
    return res.status(500).json({ message: "Failed to save scroll feedback" });
  }
}
