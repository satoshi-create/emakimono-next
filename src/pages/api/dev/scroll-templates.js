import fs from "fs";
import path from "path";

import { SCROLL_METADATA_DIR, SCROLLS_WORKSPACE_DIR } from "@/lib/scroll-pipeline/scrollMetadataFs";

// === 1. 定数・ファイル走査（FS Operations） ===

const ORDER_JSON = "_order.json";
const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".tif", ".tiff"]);

function readFileUtf8(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function yamlLabelFromContent(yaml, fallbackId) {
  const titleMatch = yaml.match(/^title:\s*"?([^"\n]+)"?\s*$/m);
  if (titleMatch) return titleMatch[1].trim();
  const titleenMatch = yaml.match(/^titleen:\s*"?([^"\n]+)"?\s*$/m);
  if (titleenMatch) return titleenMatch[1].trim();
  return fallbackId;
}

function listScrollConfigPaths() {
  const entries = [];
  const templatePath = path.join(SCROLLS_WORKSPACE_DIR, "_template", "scroll_config.yaml");
  if (fs.existsSync(templatePath)) {
    entries.push({ id: "_template", filePath: templatePath });
  }
  if (!fs.existsSync(SCROLLS_WORKSPACE_DIR)) {
    return entries;
  }
  const subdirs = fs
    .readdirSync(SCROLLS_WORKSPACE_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== "_template")
    .map((d) => d.name)
    .sort((a, b) => a.localeCompare(b));
  for (const name of subdirs) {
    const filePath = path.join(SCROLLS_WORKSPACE_DIR, name, "scroll_config.yaml");
    if (fs.existsSync(filePath)) {
      entries.push({ id: name, filePath });
    }
  }
  return entries;
}

function buildTemplatesList() {
  return listScrollConfigPaths().map(({ id, filePath }) => {
    const yaml = readFileUtf8(filePath);
    return { id, label: yamlLabelFromContent(yaml, id), yaml };
  });
}

function countImagesInScrollDir(scrollId) {
  const imagesDir = path.join(SCROLLS_WORKSPACE_DIR, scrollId, "images");
  if (!fs.existsSync(imagesDir)) return 0;
  return fs
    .readdirSync(imagesDir, { withFileTypes: true })
    .filter((d) => d.isFile() && IMAGE_EXT.has(path.extname(d.name).toLowerCase())).length;
}

function resolveScrollConfigPath(scrollId) {
  if (scrollId === "_template") {
    return path.join(SCROLLS_WORKSPACE_DIR, "_template", "scroll_config.yaml");
  }
  return path.join(SCROLLS_WORKSPACE_DIR, scrollId, "scroll_config.yaml");
}

function loadExistingScrolls() {
  if (!fs.existsSync(SCROLL_METADATA_DIR)) {
    return { existingScrolls: [], nextAvailableId: 1 };
  }
  const existingScrolls = [];
  let maxNumericId = 0;
  for (const name of fs.readdirSync(SCROLL_METADATA_DIR)) {
    if (!name.endsWith(".json") || name === ORDER_JSON) continue;
    const filePath = path.join(SCROLL_METADATA_DIR, name);
    try {
      const data = JSON.parse(readFileUtf8(filePath));
      const titleen = data.titleen;
      const id = data.id;
      const title = data.title ?? data.titleja ?? "";
      existingScrolls.push({
        titleen: titleen != null ? String(titleen) : "",
        id,
        title: title != null ? String(title) : "",
      });
      const n = typeof id === "number" ? id : Number(id);
      if (Number.isFinite(n) && n > maxNumericId) maxNumericId = n;
    } catch {
      // skip invalid json
    }
  }
  existingScrolls.sort((a, b) => String(a.titleen).localeCompare(String(b.titleen)));
  return { existingScrolls, nextAvailableId: maxNumericId + 1 };
}

// === 2. API ハンドラ ===

export default function handler(req, res) {
  if (process.env.NODE_ENV !== "development") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  const { existingScrolls, nextAvailableId } = loadExistingScrolls();
  const scrollId = typeof req.query.id === "string" ? req.query.id.trim() : "";

  if (scrollId) {
    const configPath = resolveScrollConfigPath(scrollId);
    if (!fs.existsSync(configPath)) {
      res.status(404).json({ error: "scroll_config.yaml not found", id: scrollId });
      return;
    }
    const yaml = readFileUtf8(configPath);
    const existingImageCount =
      scrollId === "_template" ? 0 : countImagesInScrollDir(scrollId);
    res.status(200).json({
      id: scrollId,
      yaml,
      existingImageCount,
      existingScrolls,
      nextAvailableId,
    });
    return;
  }

  res.status(200).json({
    templates: buildTemplatesList(),
    existingScrolls,
    nextAvailableId,
  });
}