const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const OGP_WIDTH = 1200;
const OGP_HEIGHT = 630;

const metadataCache = require("../data/image-metadata-cache/image-metadata-cache.json");
const withdrawn = require("../libs/constants/withdrawnTitleen.json");

const outDir = path.join(process.cwd(), "public", "ogp");

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

function parseArgs(argv) {
  const checkOnly = argv.includes("--check");
  const titleenFilter = argv.find((arg) => arg !== "--check" && !arg.startsWith("-"));
  return { checkOnly, titleenFilter };
}

(async () => {
  const { checkOnly, titleenFilter } = parseArgs(process.argv.slice(2));
  fs.mkdirSync(outDir, { recursive: true });

  let active = metadataCache.filter((item) => !withdrawn.includes(item.titleen));
  if (titleenFilter) {
    active = active.filter((item) => item.titleen === titleenFilter);
    if (active.length === 0) {
      console.error(`No cache entry for titleen='${titleenFilter}'`);
      process.exit(1);
    }
  }

  let generated = 0;
  const skipped = [];

  for (const item of active) {
    const srcPath = resolveLocalImage(item.thumb);
    if (!srcPath) {
      skipped.push(item.titleen);
      console.log(`SKIP (no local source image): ${item.titleen}`);
      continue;
    }
    if (!checkOnly) {
      await renderOgImage(srcPath, `${item.titleen}.jpg`);
    } else {
      console.log(`OK (source exists): ${item.titleen}`);
    }
    generated++;
  }

  console.log(
    `\nDone: ${generated} emaki OGP ${checkOnly ? "verified" : "generated"}. Skipped: ${
      skipped.join(", ") || "none"
    }`
  );

  if (checkOnly && skipped.length > 0) {
    process.exit(1);
  }
})();
