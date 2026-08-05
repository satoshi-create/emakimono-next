const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const THUMB_WIDTH = 1066;
const THUMB_HEIGHT = 600;

// 作業ディレクトリ: Figma エクスポート画像を置く場所（.gitignore 対象）
const SRC_DIR = path.join(process.cwd(), "scrolls", "_tmp-thumb");
// 出力先: サムネ実ファイル
const OUT_DIR = path.join(process.cwd(), "public", "thumb");

/**
 * Figma エクスポート画像（PNG / JPG）を 1066x600 webp に変換し public/thumb へ保存する。
 *
 * 使い方:
 *   node scripts/generate-thumb-webp.js {titleen} [...titleen]
 *
 * 変換元: scrolls/_tmp-thumb/{titleen}_thumb.png または .jpg（PNG 優先）
 * 変換先: public/thumb/{titleen}_thumb.webp
 */
async function convert(titleen) {
  const candidates = [`${titleen}_thumb.png`, `${titleen}_thumb.jpg`].map((f) =>
    path.join(SRC_DIR, f)
  );
  const srcPath = candidates.find((c) => fs.existsSync(c));
  if (!srcPath) {
    console.log(`SKIP (no source PNG/JPG): ${titleen}`);
    return false;
  }
  const outPath = path.join(OUT_DIR, `${titleen}_thumb.webp`);
  await sharp(srcPath)
    .resize(THUMB_WIDTH, THUMB_HEIGHT, { fit: "cover", position: "centre" })
    .webp({ quality: 82 })
    .toFile(outPath);
  const stat = fs.statSync(outPath);
  console.log(`OK: ${outPath} (${Math.round(stat.size / 1024)} KB)`);
  return true;
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const targets = process.argv.slice(2);
  if (targets.length === 0) {
    console.error("Usage: node scripts/generate-thumb-webp.js {titleen} [...titleen]");
    process.exit(1);
  }

  let converted = 0;
  for (const titleen of targets) {
    if (await convert(titleen)) converted++;
  }
  console.log(`\nDone: ${converted}/${targets.length} thumbnails converted.`);
})();
