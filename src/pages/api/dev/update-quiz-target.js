import fs from "fs";
import path from "path";

function clampAndRound(val) {
  const n = Number(val);
  if (Number.isNaN(n)) return null;
  const clamped = Math.min(100, Math.max(0, n));
  return Math.round(clamped * 10) / 10;
}

function formatScale(val) {
  const n = Number(val);
  if (Number.isNaN(n)) return 4.6;
  return Math.round(n * 10) / 10;
}

function normalizeTarget(raw) {
  const x = clampAndRound(raw?.x);
  const y = clampAndRound(raw?.y);
  const w = clampAndRound(raw?.w);
  const h = clampAndRound(raw?.h);
  if (x === null || y === null || w === null || h === null) return null;
  const scale =
    raw?.scale === undefined || raw?.scale === null
      ? 4.6
      : formatScale(raw.scale);
  return { x, y, w, h, scale };
}

function replaceQuestionTarget(source, questionId, target) {
  const idMarker = `id: "${questionId}"`;
  const startIdx = source.indexOf(idMarker);
  if (startIdx === -1) return null;

  const nextBlock = source.indexOf("\n    {\n      id:", startIdx + idMarker.length);
  const endIdx = nextBlock === -1 ? source.length : nextBlock;
  const block = source.slice(startIdx, endIdx);

  const replacement = `target: { x: ${target.x}, y: ${target.y}, w: ${target.w}, h: ${target.h}, scale: ${target.scale} }`;
  const targetRe = /target:\s*\{[^}]*\}/;
  if (!targetRe.test(block)) return null;

  const newBlock = block.replace(targetRe, replacement);
  return source.slice(0, startIdx) + newBlock + source.slice(endIdx);
}

const QUIZ_FILE = path.join(
  process.cwd(),
  "src/data/quiz/rakuchuRakugaiFunakiQuiz.ts"
);

export default function handler(req, res) {
  if (process.env.NODE_ENV !== "development") {
    return res.status(403).json({ error: "Development only" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { updates, questionId, target } = req.body ?? {};

  const items = Array.isArray(updates)
    ? updates
    : questionId && target
      ? [{ questionId, target }]
      : [];

  if (items.length === 0) {
    return res.status(400).json({ error: "No updates" });
  }

  let source;
  try {
    source = fs.readFileSync(QUIZ_FILE, "utf8");
  } catch {
    return res.status(500).json({ error: "Quiz file not found" });
  }

  let updatedCount = 0;

  for (const item of items) {
    const qid = String(item?.questionId ?? "").trim();
    if (!qid) continue;

    const normalized = normalizeTarget(item?.target);
    if (!normalized) continue;

    const next = replaceQuestionTarget(source, qid, normalized);
    if (next === null) continue;

    source = next;
    updatedCount += 1;
  }

  if (updatedCount === 0) {
    return res.status(400).json({ error: "No matching questions updated" });
  }

  try {
    fs.writeFileSync(QUIZ_FILE, source, "utf8");
  } catch {
    return res.status(500).json({ error: "Failed to write quiz file" });
  }

  return res.status(200).json({ ok: true, updatedCount });
}