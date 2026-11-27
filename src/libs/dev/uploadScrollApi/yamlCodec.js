import fs from "fs";
import path from "path";

export function yamlQuote(str) {
  const s = String(str);
  const escaped = s
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r/g, "\\r")
    .replace(/\n/g, "\\n");
  return `"${escaped}"`;
}

export function yamlScalar(value) {
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

export function yamlLine(key, value, indent) {
  const pad = " ".repeat(indent);
  return `${pad}${key}: ${yamlScalar(value)}`;
}

export function serializeYamlValue(value, indent) {
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

export function serializeYamlObjectBody(obj, indent) {
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

export function serializeYamlObject(obj, indent) {
  return serializeYamlObjectBody(obj, indent);
}

export function serializeScene(scene) {
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

export function buildScrollConfigYaml(scrollId, metadata, scenes) {
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

const RAW_YAML_SCROLL_ID_RE = /scroll_id:\s*["']?([a-zA-Z0-9_-]+)["']?/;
const RAW_YAML_TITLEEN_RE = /titleen:\s*["']?([a-zA-Z0-9_-]+)["']?/;
export function extractScrollIdFromRawYaml(rawYaml) {
  const m = rawYaml.match(RAW_YAML_SCROLL_ID_RE);
  return m ? m[1] : null;
}

export function extractTitleenFromRawYaml(rawYaml) {
  const m = rawYaml.match(RAW_YAML_TITLEEN_RE);
  return m ? m[1] : null;
}

export function unquoteYamlScalar(value) {
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

export function parseBracketArray(s) {
  const inner = s.trim().replace(/^\[/, "").replace(/\]$/, "");
  if (!inner.trim()) return [];
  return inner.split(",").map((part) => {
    const t = part.trim();
    if (/^-?\d+$/.test(t)) return Number(t);
    return unquoteYamlScalar(t);
  });
}

export function parseFlowObject(s) {
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

export function readYamlBlockScalar(lines, fromIndex, contentIndent) {
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

export function readScrollConfigForLocal(scrollId) {
  const configPath = path.join(
    process.cwd(),
    "scrolls",
    scrollId,
    "scroll_config.yaml"
  );
  if (!fs.existsSync(configPath)) {
    return { metadata: {}, scenes: [], panels: [] };
  }
  const raw = fs.readFileSync(configPath, "utf8");
  const lines = raw.split("\n");
  let metaStart = -1;
  let scenesStart = -1;
  let panelsStart = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^metadata:\s*$/.test(lines[i])) metaStart = i + 1;
    if (/^scenes:\s*$/.test(lines[i])) scenesStart = i + 1;
    if (/^panels:\s*$/.test(lines[i])) panelsStart = i + 1;
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
      if (panelsStart >= 0 && i >= panelsStart) break;
      if (/^[a-zA-Z0-9_]+:\s*$/.test(lines[i])) break;
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
        if ((skey === "text" || skey === "summary") && srest === "") {
          scene[skey] = {};
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
              scene[skey][tkey] = value;
              i = nextIndex;
            } else {
              scene[skey][tkey] = unquoteYamlScalar(trest);
              i++;
            }
          }
          continue;
        }
        if (srest.startsWith("[")) scene[skey] = parseBracketArray(srest);
        else if (srest !== "") scene[skey] = unquoteYamlScalar(srest);
        i++;
      }
      if (scene.id != null && scene.id !== "" && Array.isArray(scene.range)) {
        scenes.push(scene);
      }
    }
  }

  const panels = [];
  if (panelsStart >= 0) {
    let i = panelsStart;
    while (i < lines.length) {
      if (/^[a-zA-Z0-9_]+:\s*$/.test(lines[i])) break;
      const dash = lines[i].match(/^ {2}-\s*(.*)$/);
      if (!dash) {
        i++;
        continue;
      }
      const panel = {};
      const head = dash[1].trim();
      if (head) {
        const hm = head.match(/^([a-zA-Z0-9_]+):\s*(.*)$/);
        if (hm) {
          const hv = hm[2].trim();
          if (hv.startsWith("[")) panel[hm[1]] = parseBracketArray(hv);
          else panel[hm[1]] = unquoteYamlScalar(hv);
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
        if ((skey === "text" || skey === "summary") && srest === "") {
          panel[skey] = {};
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
              panel[skey][tkey] = value;
              i = nextIndex;
            } else {
              panel[skey][tkey] = unquoteYamlScalar(trest);
              i++;
            }
          }
          continue;
        }
        if (srest.startsWith("[")) panel[skey] = parseBracketArray(srest);
        else if (srest !== "") panel[skey] = unquoteYamlScalar(srest);
        i++;
      }
      const sliceRange = panel.slice_range || panel.range;
      if (panel.id != null && panel.id !== "" && Array.isArray(sliceRange)) {
        panels.push(panel);
      }
    }
  }
  return { metadata, scenes, panels };
}
