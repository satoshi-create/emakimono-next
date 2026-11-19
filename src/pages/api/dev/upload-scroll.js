import fs from "fs";
import path from "path";

import { executeScrollUpload } from "@/lib/scroll-pipeline/runScrollPipeline";

export const config = {
  api: { bodyParser: { sizeLimit: "100mb" } },
};

// === 1. 定数・バリデーション・YAML生成 ===

const SCROLL_ID_RE = /^[a-zA-Z0-9_-]+$/;
const DATA_URL_BASE64_RE = /^data:image\/[^;]+;base64,/;

function validateScrollId(scrollId) {
  if (typeof scrollId !== "string" || !SCROLL_ID_RE.test(scrollId)) {
    return "Invalid scrollId";
  }
  return null;
}

function validateImages(images) {
  if (!Array.isArray(images) || images.length < 1) {
    return "images must be a non-empty array";
  }
  for (const item of images) {
    if (!item || typeof item.base64 !== "string" || !item.base64) {
      return "Each image requires base64";
    }
    if (item.ext != null && typeof item.ext !== "string") {
      return "image ext must be a string";
    }
  }
  return null;
}

function yamlQuote(str) {
  const s = String(str);
  const escaped = s
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r/g, "\\r")
    .replace(/\n/g, "\\n");
  return `"${escaped}"`;
}

function yamlScalar(value) {
  if (value === null || value === undefined) {
    return '""';
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === "string") {
    return yamlQuote(value);
  }
  return yamlQuote(String(value));
}

function yamlLine(key, value, indent) {
  const pad = " ".repeat(indent);
  return `${pad}${key}: ${yamlScalar(value)}`;
}

function serializeYamlValue(value, indent) {
  if (value === null || value === undefined) {
    return `${" ".repeat(indent)}${yamlScalar("")}`;
  }
  if (typeof value === "boolean" || typeof value === "number") {
    return `${" ".repeat(indent)}${yamlScalar(value)}`;
  }
  if (typeof value === "string") {
    return `${" ".repeat(indent)}${yamlScalar(value)}`;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return `${" ".repeat(indent)}[]`;
    }
    const isPrimitiveArray = value.every(
      (v) =>
        v === null ||
        typeof v === "string" ||
        typeof v === "number" ||
        typeof v === "boolean"
    );
    if (isPrimitiveArray) {
      const inner = value.map((v) => yamlScalar(v)).join(", ");
      return `${" ".repeat(indent)}[${inner}]`;
    }
    const lines = [];
    for (const item of value) {
      lines.push(`${" ".repeat(indent)}- ${serializeYamlObjectBody(item, indent + 2).trimStart()}`);
    }
    return lines.join("\n");
  }
  if (typeof value === "object") {
    return serializeYamlObject(value, indent);
  }
  return `${" ".repeat(indent)}${yamlScalar(String(value))}`;
}

function serializeYamlObjectBody(obj, indent) {
  const lines = [];
  for (const [key, val] of Object.entries(obj)) {
    if (val === undefined) continue;
    if (
      val !== null &&
      typeof val === "object" &&
      !Array.isArray(val)
    ) {
      lines.push(`${" ".repeat(indent)}${key}:`);
      lines.push(serializeYamlObject(val, indent + 2));
    } else if (Array.isArray(val)) {
      lines.push(`${" ".repeat(indent)}${key}:`);
      lines.push(serializeYamlValue(val, indent + 2));
    } else {
      lines.push(yamlLine(key, val, indent));
    }
  }
  return lines.join("\n");
}

function serializeYamlObject(obj, indent) {
  return serializeYamlObjectBody(obj, indent);
}

function serializeScene(scene) {
  const lines = [];
  lines.push("  - id: " + yamlScalar(scene.id));
  if (scene.title != null) lines.push(yamlLine("title", scene.title, 4));
  if (scene.titleen != null) lines.push(yamlLine("titleen", scene.titleen, 4));
  if (scene.range != null) {
    const range = Array.isArray(scene.range) ? scene.range : [scene.range];
    const inner = range.map((n) => yamlScalar(n)).join(", ");
    lines.push(`    range: [${inner}]`);
  }
  if (scene.text != null && scene.text !== "") {
    lines.push(yamlLine("text", scene.text, 4));
  }
  return lines.join("\n");
}

function buildScrollConfigYaml(scrollId, metadata, scenes) {
  const meta = metadata && typeof metadata === "object" ? metadata : {};
  const volumeNum = meta.volume_num != null ? meta.volume_num : 1;
  const folder = meta.folder != null ? meta.folder : "emakimono";

  const parts = [];
  parts.push(`scroll_id: ${yamlScalar(scrollId)}`);
  parts.push(`volume_num: ${yamlScalar(volumeNum)}`);
  if (meta.theme_id != null) {
    parts.push(`theme_id: ${yamlScalar(meta.theme_id)}`);
  }
  parts.push(`folder: ${yamlScalar(folder)}`);
  parts.push("");
  parts.push("metadata:");
  parts.push(serializeYamlObject(meta, 2));
  parts.push("");
  parts.push("scenes:");
  const sceneList = Array.isArray(scenes) ? scenes : [];
  if (sceneList.length === 0) {
    parts.push("  []");
  } else {
    for (const scene of sceneList) {
      parts.push(serializeScene(scene));
    }
  }
  return parts.join("\n") + "\n";
}

function normalizeImageExt(ext, base64) {
  if (typeof ext === "string" && ext.trim()) {
    return ext.replace(/^\./, "").toLowerCase();
  }
  const m = base64.match(/^data:image\/([^;]+);base64,/);
  if (m) {
    const subtype = m[1].toLowerCase();
    if (subtype === "jpeg") return "jpg";
    return subtype;
  }
  return "jpg";
}

function decodeImageBase64(base64) {
  const stripped = base64.replace(DATA_URL_BASE64_RE, "");
  return Buffer.from(stripped, "base64");
}

// === 2. ファイル書き出し・パイプライン実行 ===

function writeAuthoringFiles(scrollId, metadata, scenes, images) {
  const scrollDir = path.join(process.cwd(), "scrolls", scrollId);
  const imagesDir = path.join(scrollDir, "images");
  fs.mkdirSync(imagesDir, { recursive: true });

  images.forEach((item, index) => {
    const nn = String(index + 1).padStart(2, "0");
    const ext = normalizeImageExt(item.ext, item.base64);
    const filename = `${scrollId}_${nn}-1080.${ext}`;
    const filePath = path.join(imagesDir, filename);
    fs.writeFileSync(filePath, decodeImageBase64(item.base64));
  });

  const yaml = buildScrollConfigYaml(scrollId, metadata, scenes);
  const configPath = path.join(scrollDir, "scroll_config.yaml");
  fs.writeFileSync(configPath, yaml, "utf8");
}

function buildPipelineArgs(dryRun) {
  if (dryRun === true) {
    return ["--dry-run", "--ack-no-color-correction"];
  }
  return ["--storage", "r2", "--ack-no-color-correction", "--skip-build"];
}

export default async function handler(req, res) {
  if (process.env.NODE_ENV !== "development") {
    return res.status(403).json({ error: "Development only" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { scrollId, metadata, scenes, images, dryRun } = req.body ?? {};

  const scrollErr = validateScrollId(scrollId);
  if (scrollErr) {
    return res.status(400).json({ error: scrollErr });
  }

  const imagesErr = validateImages(images);
  if (imagesErr) {
    return res.status(400).json({ error: imagesErr });
  }

  if (metadata == null || typeof metadata !== "object") {
    return res.status(400).json({ error: "metadata is required" });
  }

  try {
    writeAuthoringFiles(scrollId, metadata, scenes, images);

    const args = buildPipelineArgs(dryRun);
    const { stdout, stderr, exitCode } = await executeScrollUpload({
      scrollId,
      args,
    });

    const titleen =
      typeof metadata.titleen === "string" && metadata.titleen
        ? metadata.titleen
        : scrollId;

    return res.status(200).json({
      ok: exitCode === 0,
      exitCode,
      stdout,
      stderr,
      scrollId,
      titleen,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
}