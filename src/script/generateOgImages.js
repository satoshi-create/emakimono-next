const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const OGP_WIDTH = 1200;
const OGP_HEIGHT = 630;

// アクティブな絵巻一覧（取り下げ済みは除外）
const metadataCache = require("../data/image-metadata-cache/image-metadata-cache.json");
const withdrawn = require("../libs/constants/withdrawnTitleen.json");

const outDir = path.join(process.cwd(), "public", "ogp");

/** サムネの実ファイルを解決（public直下 / public/thumb の両方を試す） */
function resolveLocalImage(thumbPath) {
  if (!thumbPath) return null;
  const candidates = [
    path.join(process.cwd(), "public", thumbPath),
    path.join(process.cwd(), "public", "thumb", path.basename(thumbPath)),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) || null;
}

async function renderOgImage(srcPath, fileName) {
  await sharp(srcPath)
    .resize(OGP_WIDTH, OGP_HEIGHT, { fit: "cover", position: "centre" })
    .jpeg({ quality: 85, progressive: true })
    .toFile(path.join(outDir, fileName));
  console.log(`OK: ${fileName}`);
}

(async () => {
  fs.mkdirSync(outDir, { recursive: true });

  const active = metadataCache.filter(
    (item) => !withdrawn.includes(item.titleen)
  );

  let generated = 0;
  const skipped = [];

  for (const item of active) {
    const srcPath = resolveLocalImage(item.thumb);
    if (!srcPath) {
      skipped.push(item.titleen);
      console.log(`SKIP (no local source image): ${item.titleen}`);
      continue;
    }
    await renderOgImage(srcPath, `${item.titleen}.jpg`);
    generated++;
  }

  console.log(
    `\nDone: ${generated} emaki OGP generated. Skipped (Cloudinary fallback in OGP_IMAGE_FALLBACKS): ${
      skipped.join(", ") || "none"
    }`
  );
})();
