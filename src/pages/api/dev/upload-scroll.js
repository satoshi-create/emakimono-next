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

const RAW_YAML_SCROLL_ID_RE = /scroll_id:\s*["']?([a-zA-Z0-9_-]+)["']?/;
const RAW_YAML_TITLEEN_RE = /titleen:\s*["']?([a-zA-Z0-9_-]+)["']?/;

function extractScrollIdFromRawYaml(rawYaml) {
  const m = rawYaml.match(RAW_YAML_SCROLL_ID_RE);
  return m ? m[1] : null;
}

function extractTitleenFromRawYaml(rawYaml) {
  const m = rawYaml.match(RAW_YAML_TITLEEN_RE);
  return m ? m[1] : null;
}

function validateImagesIfPresent(images) {
  if (!Array.isArray(images) || images.length === 0) {
    return null;
  }
  return validateImages(images);
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

function writeRawYamlAuthoringFiles(scrollId, rawYaml, images) {
  const scrollDir = path.join(process.cwd(), "scrolls", scrollId);
  const imagesDir = path.join(scrollDir, "images");
  fs.mkdirSync(imagesDir, { recursive: true });

  if (Array.isArray(images) && images.length >= 1) {
    images.forEach((item, index) => {
      const nn = String(index + 1).padStart(2, "0");
      const filename = `${scrollId}_${nn}-1080.jpg`;
      const filePath = path.join(imagesDir, filename);
      fs.writeFileSync(filePath, decodeImageBase64(item.base64));
    });
  }

  const configPath = path.join(scrollDir, "scroll_config.yaml");
  fs.writeFileSync(configPath, rawYaml, "utf8");
}

function resolveUploadMode(mode) {
  return mode === "local" ? "local" : "r2";
}

function buildPipelineArgs(dryRun, uploadMode) {
  if (dryRun === true) {
    return ["--dry-run", "--ack-no-color-correction"];
  }
  const args = ["--storage", "r2", "--ack-no-color-correction", "--skip-build"];
  if (uploadMode === "local") {
    args.push("--skip-upload");
  }
  return args;
}

function copyScrollImagesToPublicDev(scrollId, titleen) {
  const srcDir = path.join(process.cwd(), "scrolls", scrollId, "images");
  const destDir = path.join(
    process.cwd(),
    "public",
    "dev-scroll-images",
    titleen
  );
  fs.mkdirSync(destDir, { recursive: true });
  if (!fs.existsSync(srcDir)) {
    return;
  }
  for (const name of fs.readdirSync(srcDir)) {
    const src = path.join(srcDir, name);
    if (!fs.statSync(src).isFile()) {
      continue;
    }
    fs.copyFileSync(src, path.join(destDir, name));
  }
}

function defaultLocalThumbPublicPath(titleen) {
  const devDir = path.join(
    process.cwd(),
    "public",
    "dev-scroll-images",
    titleen
  );
  if (!fs.existsSync(devDir)) {
    return null;
  }
  const image = fs
    .readdirSync(devDir)
    .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
    .sort()[0];
  if (!image) {
    return null;
  }
  return `/dev-scroll-images/${titleen}/${image}`;
}

function patchMetadataJsonDeliveryLocal(filePath, titleen) {
  if (!fs.existsSync(filePath)) {
    return;
  }
  const raw = fs.readFileSync(filePath, "utf8");
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return;
  }
  if (!data || typeof data !== "object") {
    return;
  }
  data.delivery = "local";
  const thumb = defaultLocalThumbPublicPath(titleen);
  if (thumb) {
    data.thumb = thumb;
  }
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function applyLocalDeliveryToSyncedMetadata(titleen) {
  const metaRoot = path.join(process.cwd(), "src", "data", "scroll-metadata");
  patchMetadataJsonDeliveryLocal(
    path.join(metaRoot, "scrolls", `${titleen}.json`),
    titleen
  );
  patchMetadataJsonDeliveryLocal(
    path.join(metaRoot, "scroll-texts", `${titleen}.json`),
    titleen
  );
  const orderPath = path.join(metaRoot, "_order.json");
  if (!fs.existsSync(orderPath)) {
    return;
  }
  try {
    const order = JSON.parse(fs.readFileSync(orderPath, "utf8"));
    if (Array.isArray(order)) {
      if (!order.includes(titleen)) {
        order.push(titleen);
        fs.writeFileSync(orderPath, `${JSON.stringify(order, null, 2)}\n`, "utf8");
      }
    }
  } catch {
    /* keep existing _order.json on parse failure */
  }
}

function unquoteYamlScalar(value) {
  if (value == null) {
    return "";
  }
  const t = String(value).trim();
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    return t
      .slice(1, -1)
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, "\r")
      .replace(/\\"/g, '"');
  }
  if (/^-?\d+$/.test(t)) {
    return Number(t);
  }
  return t;
}

function parseBracketArray(s) {
  const inner = s.trim().replace(/^\[/, "").replace(/\]$/, "");
  if (!inner.trim()) return [];
  return inner.split(",").map((part) => {
    const t = part.trim();
    if (/^-?\d+$/.test(t)) return Number(t);
    return unquoteYamlScalar(t);
  });
}

function parseFlowObject(s) {
  const t = String(s).trim();
  if (!t.startsWith("{")) return null;
  const obj = {};
  const re = /([a-zA-Z0-9_]+)\s*:\s*("(?:\\.|[^"])*"|'(?:\\.|[^'])*'|[^,}\s]+)/g;
  let m;
  while ((m = re.exec(t))) {
    obj[m[1]] = unquoteYamlScalar(m[2]);
  }
  return obj;
}

function readYamlBlockScalar(lines, fromIndex, contentIndent) {
  const parts = [];
  let i = fromIndex;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") {
      if (parts.length > 0) parts.push("");
      i++;
      continue;
    }
    const ind = (line.match(/^(\s*)/) || ["", ""])[1].length;
    if (ind < contentIndent) break;
    parts.push(line.slice(contentIndent));
    i++;
  }
  return { value: parts.join("\n").replace(/\n$/, ""), nextIndex: i };
}

function sceneTextFields(scene) {
  if (!scene || typeof scene !== "object") {
    return {
      kobun: "",
      kobunen: "",
      gendaibun: "",
      gendaibunen: "",
      desc: "",
      descen: "",
      tansaku: null,
    };
  }
  const t =
    scene.text && typeof scene.text === "object" && !Array.isArray(scene.text)
      ? scene.text
      : scene;
  const kobun =
    typeof t.kobun === "string"
      ? t.kobun
      : typeof t.kotobagaki === "string"
        ? t.kotobagaki
        : typeof scene.text === "string"
          ? scene.text
          : "";
  const gendaibun =
    typeof t.gendaibun === "string"
      ? t.gendaibun
      : typeof t.modern === "string"
        ? t.modern
        : "";
  const desc =
    typeof t.desc === "string"
      ? t.desc
      : typeof scene.desc === "string"
        ? scene.desc
        : "";
  const descen =
    typeof t.descen === "string"
      ? t.descen
      : typeof t.en === "string"
        ? t.en
        : typeof scene.descen === "string"
          ? scene.descen
          : "";
  const tansaku =
    (t.tansaku && typeof t.tansaku === "object" ? t.tansaku : null) ||
    (scene.tansaku && typeof scene.tansaku === "object" ? scene.tansaku : null);
  return {
    kobun,
    kobunen: typeof t.kobunen === "string" ? t.kobunen : "",
    gendaibun,
    gendaibunen: typeof t.gendaibunen === "string" ? t.gendaibunen : "",
    desc,
    descen,
    tansaku,
  };
}

function readScrollConfigForLocal(scrollId) {
  const configPath = path.join(
    process.cwd(),
    "scrolls",
    scrollId,
    "scroll_config.yaml"
  );
  if (!fs.existsSync(configPath)) {
    return { metadata: {}, scenes: [] };
  }
  const raw = fs.readFileSync(configPath, "utf8");
  const lines = raw.split("\n");
  let metaStart = -1;
  let scenesStart = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^metadata:\s*$/.test(lines[i])) metaStart = i + 1;
    if (/^scenes:\s*$/.test(lines[i])) scenesStart = i + 1;
  }

  const metadata = {};
  if (metaStart >= 0 && scenesStart > metaStart) {
    let i = metaStart;
    while (i < scenesStart - 1) {
      const line = lines[i];
      if (!line.trim()) {
        i++;
        continue;
      }
      const m = line.match(/^ {2}([a-zA-Z0-9_]+):\s*(.*)$/);
      if (!m) {
        i++;
        continue;
      }
      const key = m[1];
      const rest = m[2].trim();
      if (key === "reference" && rest === "") {
        const refs = [];
        i++;
        while (i < scenesStart - 1 && /^ {4}-\s/.test(lines[i])) {
          const item = {};
          const head = lines[i].replace(/^ {4}-\s*/, "");
          const hm = head.match(/^([a-zA-Z0-9_]+):\s*(.*)$/);
          if (hm) item[hm[1]] = unquoteYamlScalar(hm[2]);
          i++;
          while (
            i < scenesStart - 1 &&
            /^ {6}[a-zA-Z0-9_]+:/.test(lines[i])
          ) {
            const nm = lines[i].match(/^ {6}([a-zA-Z0-9_]+):\s*(.*)$/);
            if (nm) item[nm[1]] = unquoteYamlScalar(nm[2]);
            i++;
          }
          refs.push(item);
        }
        metadata[key] = refs;
        continue;
      }
      if (key === "keywords" && rest === "") {
        const kws = [];
        i++;
        while (i < scenesStart - 1 && /^ {4}-\s/.test(lines[i])) {
          const kl = lines[i].replace(/^ {4}-\s*/, "").trim();
          const fo = parseFlowObject(kl);
          kws.push(fo != null ? fo : unquoteYamlScalar(kl));
          i++;
        }
        metadata[key] = kws;
        continue;
      }
      if (rest.startsWith("[")) {
        metadata[key] = parseBracketArray(rest);
      } else if (rest.startsWith("{")) {
        const fo = parseFlowObject(rest);
        metadata[key] = fo != null ? fo : unquoteYamlScalar(rest);
      } else if (rest !== "") {
        metadata[key] = unquoteYamlScalar(rest);
      }
      i++;
    }
  }

  const scenes = [];
  if (scenesStart >= 0) {
    let i = scenesStart;
    while (i < lines.length) {
      const dash = lines[i].match(/^ {2}-\s*(.*)$/);
      if (!dash) {
        i++;
        continue;
      }
      const scene = {};
      const head = dash[1].trim();
      if (head) {
        const hm = head.match(/^([a-zA-Z0-9_]+):\s*(.*)$/);
        if (hm) {
          const hv = hm[2].trim();
          if (hv.startsWith("[")) scene[hm[1]] = parseBracketArray(hv);
          else scene[hm[1]] = unquoteYamlScalar(hv);
        }
      }
      i++;
      while (i < lines.length && !/^ {2}-\s/.test(lines[i])) {
        if (!/^ {4}[a-zA-Z0-9_]+:/.test(lines[i])) break;
        const sm = lines[i].match(/^ {4}([a-zA-Z0-9_]+):\s*(.*)$/);
        if (!sm) {
          i++;
          continue;
        }
        const skey = sm[1];
        const srest = sm[2].trim();
        if (skey === "text" && srest === "") {
          scene.text = {};
          i++;
          while (i < lines.length && /^ {6}[a-zA-Z0-9_]+:/.test(lines[i])) {
            const tm = lines[i].match(/^ {6}([a-zA-Z0-9_]+):\s*(.*)$/);
            if (!tm) break;
            const tkey = tm[1];
            const trest = tm[2].trim();
            if (trest === "|" || trest === ">" || trest === "") {
              const { value, nextIndex } = readYamlBlockScalar(
                lines,
                i + 1,
                8
              );
              scene.text[tkey] = value;
              i = nextIndex;
            } else {
              scene.text[tkey] = unquoteYamlScalar(trest);
              i++;
            }
          }
          continue;
        }
        if (srest.startsWith("[")) scene[skey] = parseBracketArray(srest);
        else if (srest !== "") scene[skey] = unquoteYamlScalar(srest);
        i++;
      }
      if (scene.id != null && scene.id !== "") {
        scenes.push(scene);
      }
    }
  }
  return { metadata, scenes };
}

function readImageDimensionsFromBuffer(buf) {
  if (!buf || buf.length < 24) return null;
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  if (
    buf.length >= 12 &&
    buf.toString("ascii", 0, 4) === "RIFF" &&
    buf.toString("ascii", 8, 12) === "WEBP"
  ) {
    const tag = buf.toString("ascii", 12, 16);
    if (tag === "VP8X" && buf.length >= 30) {
      return {
        width: 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16)),
        height: 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16)),
      };
    }
    if (tag === "VP8L" && buf.length >= 25) {
      const bits = buf.readUInt32LE(21);
      return {
        width: (bits & 0x3fff) + 1,
        height: ((bits >> 14) & 0x3fff) + 1,
      };
    }
    if (tag === "VP8 " && buf.length >= 30) {
      return {
        width: buf.readUInt16LE(26) & 0x3fff,
        height: buf.readUInt16LE(28) & 0x3fff,
      };
    }
  }
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length - 8) {
      if (buf[i] !== 0xff) {
        i++;
        continue;
      }
      const marker = buf[i + 1];
      if (marker === 0xc0 || marker === 0xc2) {
        return {
          height: buf.readUInt16BE(i + 5),
          width: buf.readUInt16BE(i + 7),
        };
      }
      const len = buf.readUInt16BE(i + 2);
      i += 2 + len;
    }
  }
  return null;
}

function readImageDimensions(filePath) {
  const fallback = { width: 1920, height: 1080 };
  try {
    const buf = fs.readFileSync(filePath);
    const dims = readImageDimensionsFromBuffer(buf);
    if (dims && dims.width > 0 && dims.height > 0) return dims;
  } catch {
    /* use fallback */
  }
  return fallback;
}

function listSortedScrollImages(scrollId) {
  const srcDir = path.join(process.cwd(), "scrolls", scrollId, "images");
  if (!fs.existsSync(srcDir)) {
    return [];
  }
  return fs
    .readdirSync(srcDir)
    .filter((name) => {
      const full = path.join(srcDir, name);
      return fs.statSync(full).isFile() && /\.(jpe?g|png|webp)$/i.test(name);
    })
    .sort();
}

function executeLocalVerification(scrollId, titleen, metadata, scenes) {
  const meta = metadata && typeof metadata === "object" ? { ...metadata } : {};
  const sceneList = Array.isArray(scenes) ? scenes : [];
  const imageFiles = listSortedScrollImages(scrollId);

  copyScrollImagesToPublicDev(scrollId, titleen);

  const thumbPublic =
    typeof meta.thumb === "string" && meta.thumb.startsWith("/")
      ? meta.thumb
      : `/thumb/${titleen}_thumb.webp`;
  const thumbDisk = path.join(
    process.cwd(),
    "public",
    ...thumbPublic.replace(/^\//, "").split("/")
  );
  fs.mkdirSync(path.dirname(thumbDisk), { recursive: true });
  if (imageFiles.length > 0) {
    const firstSrc = path.join(
      process.cwd(),
      "scrolls",
      scrollId,
      "images",
      imageFiles[0]
    );
    fs.copyFileSync(firstSrc, thumbDisk);
    meta.thumb = thumbPublic;
  }

  const devBase = `/dev-scroll-images/${titleen}`;
  const images = imageFiles.map((filename, idx) => ({
    chapter: String(idx + 1),
    src: `${devBase}/${filename}`,
    filename,
  }));

  const chapters = sceneList.map((scene, idx) => ({
    chapter: String(scene.id ?? scene.chapter ?? idx + 1),
    title: scene.title ?? "",
    titleen: scene.titleen ?? "",
    range: scene.range ?? null,
  }));

  const sceneStartMap = new Map();
  if (sceneList.length > 0) {
    sceneList.forEach((scene, idx) => {
      const range = Array.isArray(scene.range) ? scene.range : [];
      const startPage =
        Number.isFinite(Number(range[0])) && Number(range[0]) >= 1
          ? Number(range[0])
          : idx + 1;
      if (!sceneStartMap.has(startPage)) {
        const tf = sceneTextFields(scene);
        const kobunName =
          typeof tf.kobun === "string" ? tf.kobun.trim() : "";
        sceneStartMap.set(startPage, {
          cat: "ekotoba",
          chapter: String(scene.id ?? scene.chapter ?? idx + 1),
          config: "",
          src: "",
          name: kobunName,
          srcHeight: 1080,
          srcWidth: 1920,
        });
      }
    });
  } else {
    sceneStartMap.set(1, {
      cat: "ekotoba",
      chapter: "1",
      config: "",
      src: "",
      name: "",
      srcHeight: 1080,
      srcWidth: 1920,
    });
  }

  const emakis = [];
  imageFiles.forEach((filename, imgIdx) => {
    const pageNum = imgIdx + 1;
    if (sceneStartMap.has(pageNum)) {
      emakis.push(sceneStartMap.get(pageNum));
    }
    const imagePath = path.join(
      process.cwd(),
      "scrolls",
      scrollId,
      "images",
      filename
    );
    const { width, height } = readImageDimensions(imagePath);
    emakis.push({
      cat: "image",
      chapter: "",
      config: "local",
      src: `${devBase}/${filename}`,
      name: path.parse(filename).name,
      srcHeight: height,
      srcWidth: width,
    });
  });

  const kw = meta.keyword ?? meta.keywords;
  const keyword = Array.isArray(kw)
    ? kw
    : typeof kw === "string" && kw.trim()
      ? [kw]
      : [];

  const metaJson = {
    id: meta.id ?? scrollId,
    title: meta.title || titleen,
    titleen,
    author: meta.author ?? "",
    authoren: meta.authoren ?? "",
    era: meta.era ?? "",
    eraen: meta.eraen ?? "",
    type: meta.type ?? "",
    typeen: meta.typeen ?? "",
    desc: meta.desc ?? "",
    descen: meta.descen ?? "",
    thumb: meta.thumb ?? thumbPublic,
    sceneText: meta.sceneText ?? "",
    sourceImage: meta.sourceImage ?? "",
    sourceImageUrl: meta.sourceImageUrl ?? "",
    sourceAuthor: meta.sourceAuthor ?? "",
    sourceCollection: meta.sourceCollection ?? "",
    sourceLicense: meta.sourceLicense ?? "",
    reference:
      meta.reference != null && meta.reference !== ""
        ? meta.reference
        : [],
    keyword,
    delivery: "local",
    images,
    chapters,
    emakis,
  };

  const scrollsMetaDir = path.join(
    process.cwd(),
    "src",
    "data",
    "scroll-metadata",
    "scrolls"
  );
  fs.mkdirSync(scrollsMetaDir, { recursive: true });
  fs.writeFileSync(
    path.join(scrollsMetaDir, `${titleen}.json`),
    `${JSON.stringify(metaJson, null, 2)}\n`,
    "utf8"
  );

  const hasText = sceneList.some((s) => {
    const tf = sceneTextFields(s);
    return (
      tf.kobun.trim() ||
      tf.kobunen.trim() ||
      tf.gendaibun.trim() ||
      tf.gendaibunen.trim() ||
      tf.desc.trim() ||
      tf.descen.trim() ||
      Boolean(tf.tansaku)
    );
  });
  if (hasText) {
    const textEntries = sceneList.map((scene, idx) => {
      const tf = sceneTextFields(scene);
      const entry = {
        chapter: String(scene.id ?? scene.chapter ?? idx + 1),
        title: scene.title ?? "",
        titleen: scene.titleen ?? "",
        kobun: tf.kobun,
        gendaibun: tf.gendaibun,
        desc: tf.desc,
      };
      if (tf.kobunen) entry.kobunen = tf.kobunen;
      if (tf.gendaibunen) entry.gendaibunen = tf.gendaibunen;
      if (tf.descen) entry.descen = tf.descen;
      if (tf.tansaku) entry.tansaku = tf.tansaku;
      return entry;
    });
    const textDir = path.join(process.cwd(), "src", "data", "scroll-texts");
    fs.mkdirSync(textDir, { recursive: true });
    fs.writeFileSync(
      path.join(textDir, `${titleen}.json`),
      `${JSON.stringify(textEntries, null, 2)}\n`,
      "utf8"
    );
  }

  const orderPath = path.join(scrollsMetaDir, "_order.json");
  let order = [];
  if (fs.existsSync(orderPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(orderPath, "utf8"));
      if (Array.isArray(parsed)) {
        order = parsed;
      }
    } catch {
      order = [];
    }
  }
  if (!order.includes(titleen)) {
    order.push(titleen);
    fs.writeFileSync(orderPath, `${JSON.stringify(order, null, 2)}\n`, "utf8");
  }

  return "Local verification files generated successfully.";
}

async function runPipelineWithPreflight(scrollId, dryRun, preflightOnly, uploadMode) {
  const preflightRes = await executeScrollUpload({
    scrollId,
    args: ["--preflight-only"],
  });

  if (preflightRes.exitCode !== 0) {
    return { kind: "preflight_failed", preflightRes };
  }

  if (preflightOnly === true) {
    return { kind: "preflight_only_ok", preflightRes };
  }

  const prodRes = await executeScrollUpload({
    scrollId,
    args: buildPipelineArgs(dryRun, uploadMode),
  });

  const stdout = [preflightRes.stdout, prodRes.stdout]
    .filter((s) => s != null && s !== "")
    .join("\n");
  const stderr = [preflightRes.stderr, prodRes.stderr]
    .filter((s) => s != null && s !== "")
    .join("\n");

  return { kind: "full", exitCode: prodRes.exitCode, stdout, stderr };
}

export default async function handler(req, res) {
  if (process.env.NODE_ENV !== "development") {
    return res.status(403).json({ error: "Development only" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    scrollId: bodyScrollId,
    metadata,
    scenes,
    images,
    dryRun,
    rawYaml,
    preflightOnly,
    mode: bodyMode,
  } = req.body ?? {};

  const uploadMode = resolveUploadMode(bodyMode);

  const hasRawYaml =
    typeof rawYaml === "string" && rawYaml.trim().length > 0;

  if (hasRawYaml) {
    let scrollId =
      typeof bodyScrollId === "string" ? bodyScrollId.trim() : "";
    if (validateScrollId(scrollId)) {
      scrollId = extractScrollIdFromRawYaml(rawYaml) ?? "";
    }
    const scrollErr = validateScrollId(scrollId);
    if (scrollErr) {
      return res.status(400).json({ error: scrollErr });
    }

    const imagesErr = validateImagesIfPresent(images);
    if (imagesErr) {
      return res.status(400).json({ error: imagesErr });
    }

    try {
      writeRawYamlAuthoringFiles(scrollId, rawYaml, images);

      const titleen = extractTitleenFromRawYaml(rawYaml) ?? scrollId;
      const parsedYaml = readScrollConfigForLocal(scrollId);
      const rawMeta =
        parsedYaml?.metadata && typeof parsedYaml.metadata === "object"
          ? parsedYaml.metadata
          : parsedYaml;
      const yamlScenes = Array.isArray(parsedYaml.scenes) ? parsedYaml.scenes : [];

      if (uploadMode === "local") {
        if (preflightOnly === true) {
          const imagesDir = path.join(
            process.cwd(),
            "scrolls",
            scrollId,
            "images"
          );
          const hasImages =
            fs.existsSync(imagesDir) && fs.readdirSync(imagesDir).length > 0;
          return res.status(hasImages ? 200 : 422).json({
            ok: hasImages,
            phase: "preflight",
            scrollId,
            titleen,
            mode: "local",
            viewerUrl: `/${titleen}`,
          });
        }
        const stdout = executeLocalVerification(
          scrollId,
          titleen,
          { ...rawMeta, titleen },
          yamlScenes
        );
        return res.status(200).json({
          ok: true,
          mode: "local",
          titleen,
          title: rawMeta.title || titleen,
          viewerUrl: `/${titleen}`,
          stdout,
          scrollId,
        });
      }

      const pipeline = await runPipelineWithPreflight(
        scrollId,
        dryRun,
        preflightOnly,
        uploadMode
      );

      if (pipeline.kind === "preflight_failed") {
        const { preflightRes } = pipeline;
        return res.status(422).json({
          ok: false,
          phase: "preflight",
          exitCode: preflightRes.exitCode,
          stdout: preflightRes.stdout,
          stderr: preflightRes.stderr,
          scrollId,
          titleen,
          mode: uploadMode,
          viewerUrl: `/${titleen}`,
        });
      }

      if (pipeline.kind === "preflight_only_ok") {
        const { preflightRes } = pipeline;
        return res.status(200).json({
          ok: true,
          phase: "preflight",
          exitCode: 0,
          stdout: preflightRes.stdout,
          stderr: preflightRes.stderr,
          scrollId,
          titleen,
          mode: uploadMode,
          viewerUrl: `/${titleen}`,
        });
      }

      let stdout = pipeline.stdout;
      if (
        uploadMode === "r2" &&
        dryRun !== true &&
        preflightOnly !== true &&
        pipeline.exitCode === 0
      ) {
        if (ensureR2CanaryTitle(titleen)) {
          const line = `[R2 Canary] Registered "${titleen}"`;
          stdout = stdout ? `${stdout}\n${line}` : line;
        }
      }

      return res.status(200).json({
        ok: pipeline.exitCode === 0,
        exitCode: pipeline.exitCode,
        stdout,
        stderr: pipeline.stderr,
        scrollId,
        titleen,
        mode: uploadMode,
        viewerUrl: `/${titleen}`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return res.status(500).json({ error: message });
    }
  }

  const scrollId = bodyScrollId;
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

    const titleen =
      typeof metadata.titleen === "string" && metadata.titleen
        ? metadata.titleen
        : scrollId;
    const sceneList = Array.isArray(scenes) ? scenes : [];

    if (uploadMode === "local") {
      if (preflightOnly === true) {
        const imagesDir = path.join(process.cwd(), "scrolls", scrollId, "images");
        const hasImages =
          fs.existsSync(imagesDir) && fs.readdirSync(imagesDir).length > 0;
        return res.status(hasImages ? 200 : 422).json({
          ok: hasImages,
          phase: "preflight",
          scrollId,
          titleen,
          mode: "local",
          viewerUrl: `/${titleen}`,
        });
      }
      const stdout = executeLocalVerification(
        scrollId,
        titleen,
        { ...metadata, titleen },
        sceneList
      );
      return res.status(200).json({
        ok: true,
        mode: "local",
        titleen,
        title: metadata.title || titleen,
        viewerUrl: `/${titleen}`,
        stdout,
        scrollId,
      });
    }

    const pipeline = await runPipelineWithPreflight(
      scrollId,
      dryRun,
      preflightOnly,
      uploadMode
    );

    if (pipeline.kind === "preflight_failed") {
      const { preflightRes } = pipeline;
      return res.status(422).json({
        ok: false,
        phase: "preflight",
        exitCode: preflightRes.exitCode,
        stdout: preflightRes.stdout,
        stderr: preflightRes.stderr,
        scrollId,
        titleen,
        mode: uploadMode,
        viewerUrl: `/${titleen}`,
      });
    }

    if (pipeline.kind === "preflight_only_ok") {
      const { preflightRes } = pipeline;
      return res.status(200).json({
        ok: true,
        phase: "preflight",
        exitCode: 0,
        stdout: preflightRes.stdout,
        stderr: preflightRes.stderr,
        scrollId,
        titleen,
        mode: uploadMode,
        viewerUrl: `/${titleen}`,
      });
    }

    let stdout = pipeline.stdout;
    if (
      uploadMode === "r2" &&
      dryRun !== true &&
      preflightOnly !== true &&
      pipeline.exitCode === 0
    ) {
      if (ensureR2CanaryTitle(titleen)) {
        const line = `[R2 Canary] Registered "${titleen}"`;
        stdout = stdout ? `${stdout}\n${line}` : line;
      }
    }

    return res.status(200).json({
      ok: pipeline.exitCode === 0,
      exitCode: pipeline.exitCode,
      stdout,
      stderr: pipeline.stderr,
      scrollId,
      titleen,
      mode: uploadMode,
      viewerUrl: `/${titleen}`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
}