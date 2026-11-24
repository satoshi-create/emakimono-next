import fs from "fs";
import path from "path";

// === 1. 定数・パス解決（Pure Logic） ===

export const SCROLL_METADATA_DIR = path.join(
  process.cwd(),
  "src/data/scroll-metadata/scrolls"
);

export const SCROLLS_WORKSPACE_DIR = path.join(process.cwd(), "scrolls");

/**
 * slug の表記ゆれ（ハイフン / アンダースコア）を含む候補から実在するメタデータ JSON の絶対パスを返す。
 * @param {string} slug
 * @returns {string | null}
 */
export function resolveScrollMetadataPath(slug) {
  const candidates = [
    slug,
    slug.replace(/-/g, "_"),
    slug.replace(/_/g, "-"),
  ];
  const seen = new Set();
  for (const candidate of candidates) {
    if (seen.has(candidate)) continue;
    seen.add(candidate);
    const filePath = path.join(SCROLL_METADATA_DIR, `${candidate}.json`);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }
  return null;
}

// === 2. メタデータ読み書き（FS Operations） ===

/**
 * @param {string} slug
 * @returns {{ filePath: string, data: object } | null}
 */
export function readScrollMetadata(slug) {
  const filePath = resolveScrollMetadataPath(slug);
  if (!filePath) return null;
  const raw = fs.readFileSync(filePath, "utf8");
  const data = JSON.parse(raw);
  return { filePath, data };
}

/**
 * @param {string} filePath
 * @param {object} data
 */
export function writeScrollMetadata(filePath, data) {
  const content = JSON.stringify(data, null, 2) + "\n";
  fs.writeFileSync(filePath, content, "utf8");
}