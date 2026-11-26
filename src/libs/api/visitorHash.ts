import crypto from "crypto";
import type { IncomingMessage } from "http";

/** Anonymous visitor fingerprint for deduplicating likes (server-side only). */
export function getVisitorHash(req: IncomingMessage): string {
  const forwarded = req.headers["x-forwarded-for"];
  const ip =
    (typeof forwarded === "string"
      ? forwarded.split(",")[0]
      : Array.isArray(forwarded)
        ? forwarded[0]
        : ""
    )?.trim() ||
    req.socket?.remoteAddress ||
    "";
  const ua = req.headers["user-agent"] || "";
  return crypto
    .createHash("sha256")
    .update(`${ip}:${ua}`)
    .digest("hex")
    .slice(0, 32);
}
