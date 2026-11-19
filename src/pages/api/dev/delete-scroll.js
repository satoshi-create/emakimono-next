import fs from "fs";
import path from "path";

const ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

function isValidId(value) {
  if (typeof value !== "string" || value === "" || value.includes("..") || value.includes("/")) {
    return false;
  }
  return ID_PATTERN.test(value);
}

function rmPathIfExists(targetPath, deleted) {
  if (!fs.existsSync(targetPath)) return;
  const stat = fs.statSync(targetPath);
  if (stat.isDirectory()) {
    fs.rmSync(targetPath, { recursive: true, force: true });
  } else {
    fs.unlinkSync(targetPath);
  }
  deleted.push(targetPath);
}

function unlinkMatchingPrefix(dir, prefix, deleted) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir);
  for (const name of entries) {
    if (!name.startsWith(prefix)) continue;
    const full = path.join(dir, name);
    rmPathIfExists(full, deleted);
  }
}

function pruneOrderJson(orderPath, titleen, deleted) {
  if (!fs.existsSync(orderPath)) return;
  const raw = fs.readFileSync(orderPath, "utf8");
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return;
  }
  if (!Array.isArray(data)) return;

  const before = data.length;
  const next = data.filter((item) => {
    if (typeof item === "string") return item !== titleen;
    if (item && typeof item === "object" && "titleen" in item) return item.titleen !== titleen;
    return true;
  });

  if (next.length === before) return;

  fs.writeFileSync(orderPath, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  deleted.push(`${orderPath} (entry: ${titleen})`);
}

export default function handler(req, res) {
  if (process.env.NODE_ENV !== "development") {
    return res.status(403).json({ ok: false, error: "Development only" });
  }

  if (req.method !== "POST" && req.method !== "DELETE") {
    res.setHeader("Allow", "POST, DELETE");
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  const body = req.body ?? {};
  const titleen = body.titleen;
  const scrollId = body.scrollId ?? titleen;

  if (!isValidId(titleen) || !isValidId(scrollId)) {
    return res.status(400).json({ ok: false, error: "Invalid titleen or scrollId" });
  }

  const root = process.cwd();
  const deleted = [];

  const scrollDirs = [path.join(root, "scrolls", scrollId)];
  if (scrollId !== titleen) {
    scrollDirs.push(path.join(root, "scrolls", titleen));
  }
  for (const dir of scrollDirs) {
    rmPathIfExists(dir, deleted);
  }

  const metaJson = path.join(root, "src/data/scroll-metadata/scrolls", `${titleen}.json`);
  rmPathIfExists(metaJson, deleted);

  const textJson = path.join(root, "src/data/scroll-texts", `${titleen}.json`);
  rmPathIfExists(textJson, deleted);

  const devImages = path.join(root, "public/dev-scroll-images", titleen);
  rmPathIfExists(devImages, deleted);

  const thumbDir = path.join(root, "public/thumb");
  rmPathIfExists(path.join(thumbDir, `${titleen}_thumb.webp`), deleted);
  unlinkMatchingPrefix(thumbDir, `${titleen}_`, deleted);

  const ogpDir = path.join(root, "public/ogp");
  rmPathIfExists(path.join(ogpDir, `${titleen}_ogp.png`), deleted);
  unlinkMatchingPrefix(ogpDir, `${titleen}_`, deleted);

  const orderPath = path.join(root, "src/data/scroll-metadata/scrolls", "_order.json");
  pruneOrderJson(orderPath, titleen, deleted);

  return res.status(200).json({ ok: true, titleen, deleted });
}