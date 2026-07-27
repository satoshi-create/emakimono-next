/**
 * Generate maskable / touch icons with safe-zone padding for PWA home screen.
 * Run: node scripts/generate-pwa-icons.mjs
 */
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const ICONS_DIR = path.join(ROOT, "public", "icons");
const SOURCE = path.join(ROOT, "public", "unused", "android-chrome-512x512.png");

const ICON_BG = "#ffffff";
/** Logo scale within canvas (~central 80% maskable safe circle) */
const SAFE_SCALE = 0.56;
const ANY_SCALE = 0.82;

async function buildIcon({ size, outName, scale, background }) {
  const trimmed = await sharp(SOURCE).trim().toBuffer();
  const logoSize = Math.round(size * scale);
  const logo = await sharp(trimmed)
    .resize(logoSize, logoSize, { fit: "contain", background })
    .png()
    .toBuffer();

  const left = Math.floor((size - logoSize) / 2);
  const top = Math.floor((size - logoSize) / 2);

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background,
    },
  })
    .composite([{ input: logo, left, top }])
    .png()
    .toFile(path.join(ICONS_DIR, outName));

  console.log(`Wrote ${outName} (${size}x${size}, logo ${logoSize}px)`);
}

async function main() {
  for (const size of [512, 192]) {
    await buildIcon({
      size,
      outName: `icon-maskable-${size}.png`,
      scale: SAFE_SCALE,
      background: ICON_BG,
    });
  }
  await buildIcon({
    size: 180,
    outName: "apple-touch-icon.png",
    scale: SAFE_SCALE,
    background: ICON_BG,
  });
  await buildIcon({
    size: 512,
    outName: "icon-512.png",
    scale: ANY_SCALE,
    background: ICON_BG,
  });
  await buildIcon({
    size: 192,
    outName: "icon-192.png",
    scale: ANY_SCALE,
    background: ICON_BG,
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
