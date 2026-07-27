import crypto from "crypto";

/**
 * Anonymous visitor fingerprint for deduplicating likes (server-side only).
 * @param {import('http').IncomingMessage} req
 */
export function getVisitorHash(req) {
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
