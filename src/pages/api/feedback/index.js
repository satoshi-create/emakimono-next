import { getDb } from "@/db";
import { feedback } from "@/db/schema";
import { ensureDbConfigured, ensureMethod } from "@/libs/api/dbApi";
import { v4 as uuidv4 } from "uuid";

const MAX_MESSAGE_LENGTH = 2000;

export default async function handler(req, res) {
  if (!ensureMethod(req, res, "POST") || !ensureDbConfigured(res)) {
    return;
  }

  const { message, pageUrl, emakiId, locale } = req.body ?? {};
  const trimmed =
    typeof message === "string" ? message.trim().slice(0, MAX_MESSAGE_LENGTH) : "";

  if (!trimmed) {
    return res.status(400).json({ message: "Message is required" });
  }

  const db = getDb();

  try {
    await db.insert(feedback).values({
      id: uuidv4(),
      message: trimmed,
      pageUrl: typeof pageUrl === "string" ? pageUrl.slice(0, 512) : null,
      emakiId:
        typeof emakiId === "string" && emakiId.length <= 128 ? emakiId : null,
      locale: typeof locale === "string" ? locale.slice(0, 8) : null,
    });

    return res.status(201).json({ ok: true });
  } catch (error) {
    console.error("POST /api/feedback failed:", error);
    return res.status(500).json({ message: "Failed to save feedback" });
  }
}
