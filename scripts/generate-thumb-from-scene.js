/**
 * Generate thumb webp from a Cloudinary scene (non-Figma path).
 *
 * Usage:
 *   node scripts/generate-thumb-from-scene.js tsukumogami --public-id tsukumogami__tsukumogami_1_02__02 --crop west
 *   node scripts/generate-thumb-from-scene.js scrolls/tsukumogami/scroll_config.yaml
 */

const fs = require("fs");
const path = require("path");
const https = require("https");
const sharp = require("sharp");

const THUMB_WIDTH = 1066;
const THUMB_HEIGHT = 600;
const DEFAULT_CLOUD = process.env.CLOUDINARY_CLOUD_NAME || "dw2gjxrrf";
const REPO_ROOT = process.cwd();
const OUT_DIR = path.join(REPO_ROOT, "public", "thumb");

const CROP_MAP = {
  west: "west",
  left: "west",
  centre: "centre",
  center: "centre",
  east: "east",
  right: "east",
};

function parseArgs(argv) {
  const args = { crop: "centre", configPath: null, publicId: null, titleen: null };
  const positional = [];
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--crop" && argv[i + 1]) {
      args.crop = argv[++i];
    } else if (token === "--public-id" && argv[i + 1]) {
      args.publicId = argv[++i];
    } else {
      positional.push(token);
    }
  }
  if (positional[0]) {
    if (positional[0].endsWith(".yaml") || positional[0].includes("scroll_config")) {
      args.configPath = path.resolve(REPO_ROOT, positional[0]);
    } else {
      args.titleen = positional[0];
    }
  }
  return args;
}

function readScalar(text, key) {
  const match = text.match(new RegExp(`^\\s*${key}:\\s*"?([^"\\n#]+)"?\\s*$`, "m"));
  return match ? match[1].trim() : null;
}

function loadConfig(configPath) {
  const text = fs.readFileSync(configPath, "utf8");
  const thumbBlock = text.match(/^\s*thumbScene:\s*\n((?:\s+.+\n?)+)/m);
  const thumbScene = {};
  if (thumbBlock) {
    for (const line of thumbBlock[1].split("\n")) {
      const m = line.match(/^\s+(\w+):\s*"?([^"\n#]+)"?\s*$/);
      if (m) thumbScene[m[1]] = m[2].trim();
    }
  }
  return {
    scroll_id: readScalar(text, "scroll_id"),
    volume_num: Number(readScalar(text, "volume_num") || 1),
    metadata: {
      titleen: readScalar(text, "titleen"),
      thumbScene,
    },
  };
}

function resolvePublicId(config, cliPublicId) {
  if (cliPublicId) return cliPublicId;
  const scene = config?.metadata?.thumbScene || {};
  if (scene.public_id) return scene.public_id;
  const scrollId = config.scroll_id;
  if (!scrollId) return null;
  const volume = Number(config.volume_num || 1);
  const chapter = Number(scene.chapter || scene.scene_id || 1);
  const ordinal = Number(scene.ordinal || 1);
  return `${scrollId}__${scrollId}_${volume}_${String(chapter).padStart(2, "0")}__${String(ordinal).padStart(2, "0")}`;
}

function cloudinaryUrl(publicId) {
  return `https://res.cloudinary.com/${DEFAULT_CLOUD}/image/upload/emakimono/${publicId}.jpg`;
}

function download(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          res.resume();
          return;
        }
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => resolve(Buffer.concat(chunks)));
      })
      .on("error", reject);
  });
}

async function generate({ titleen, publicId, crop }) {
  const position = CROP_MAP[String(crop).toLowerCase()] || "centre";
  const outPath = path.join(OUT_DIR, `${titleen}_thumb.webp`);
  const url = cloudinaryUrl(publicId);
  console.log(`Fetching: ${url}`);
  const buffer = await download(url);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  await sharp(buffer)
    .resize(THUMB_WIDTH, THUMB_HEIGHT, { fit: "cover", position })
    .webp({ quality: 82 })
    .toFile(outPath);
  const stat = fs.statSync(outPath);
  console.log(`OK: ${outPath} (${Math.round(stat.size / 1024)} KB, crop=${position})`);
  console.log(`Set metadata.thumb: /thumb/${titleen}_thumb.webp and re-sync if needed.`);
}

(async () => {
  const args = parseArgs(process.argv.slice(2));
  let config = null;
  let titleen = args.titleen;

  if (args.configPath) {
    config = loadConfig(args.configPath);
    titleen = config.metadata.titleen || path.basename(path.dirname(args.configPath));
    if (config.metadata.thumbScene?.crop && !process.argv.includes("--crop")) {
      args.crop = config.metadata.thumbScene.crop;
    }
  }

  if (!titleen) {
    console.error(
      "Usage: node scripts/generate-thumb-from-scene.js {titleen} [--public-id ID] [--crop west|centre|east]"
    );
    process.exit(1);
  }

  const publicId = resolvePublicId(config, args.publicId);
  if (!publicId) {
    console.error(
      "Missing public_id. Pass --public-id or metadata.thumbScene in scroll_config.yaml"
    );
    process.exit(1);
  }

  try {
    await generate({ titleen, publicId, crop: args.crop });
  } catch (err) {
    console.error(`FAILED: ${err.message}`);
    process.exit(1);
  }
})();
