import fs from "fs";
import path from "path";

const PANEL_META_KEYS = [
  "panel_number",
  "embroidered_mark",
  "latin_inscription",
  "latin_translation_ja",
  "latin_translation_en",
  "title",
  "titleen",
  "title_zh",
  "summary",
  "actors",
  "location",
  "motifs",
  "border_motifs",
];

export function getPanelsConfig(rawPanels) {
  const panels = [];
  for (const p of rawPanels || []) {
    if (!p || typeof p !== "object") continue;
    const sliceRange = p.slice_range || p.range;
    if (!Array.isArray(sliceRange) || sliceRange.length < 2) continue;
    const start = Number(sliceRange[0]);
    const end = Number(sliceRange[1]);
    const panel = {
      id: Number(p.id ?? start),
      chapter_id: Number(p.chapter_id ?? p.scene_id ?? 1),
      slice_range: [start, end],
    };
    for (const key of PANEL_META_KEYS) {
      if (p[key] != null) panel[key] = p[key];
    }
    panels.push(panel);
  }
  panels.sort(
    (a, b) =>
      a.slice_range[0] - b.slice_range[0] || a.id - b.id
  );
  return panels;
}

export function buildViewerChapters(sceneList) {
  return sceneList
    .filter((s) => Array.isArray(s.range) && s.range.length >= 2)
    .map((scene) => {
      const row = {
        chapter: String(scene.id ?? scene.chapter),
        title: scene.title ?? "",
        range: [Number(scene.range[0]), Number(scene.range[1])],
      };
      if (scene.titleen) row.titleen = scene.titleen;
      if (scene.title_zh) row.title_zh = scene.title_zh;
      return row;
    });
}

export function buildPanelsForViewer(panels) {
  return panels.map((panel) => {
    const entry = { ...panel };
    entry.slice_range = [...panel.slice_range];
    return entry;
  });
}

export function sceneFirstGlobalIndex(panels) {
  const out = {};
  for (const panel of panels) {
    const cid = panel.chapter_id;
    const start = panel.slice_range[0];
    out[cid] = Math.min(out[cid] ?? start, start);
  }
  return out;
}

export function panelSlotMetadata(panel) {
  const meta = {
    panel_id: panel.id,
    scene_chapter: String(panel.chapter_id),
  };
  for (const key of PANEL_META_KEYS) {
    if (key in panel) meta[key] = panel[key];
  }
  return meta;
}

export function buildEmakisForPanelsLocal(
  sceneList,
  panels,
  imageFiles,
  devBase,
  scrollId
) {
  const scenesById = {};
  sceneList.forEach((s) => {
    const id = Number(s.id ?? s.chapter);
    if (Number.isFinite(id)) scenesById[id] = s;
  });
  const firstByScene = sceneFirstGlobalIndex(panels);
  const seenSceneEkotoba = new Set();
  const emakis = [];

  panels.forEach((panel) => {
    const [start, end] = panel.slice_range;
    const cid = panel.chapter_id;

    for (let idx = start; idx <= end; idx += 1) {
      const imgIdx = idx - 1;
      const filename = imageFiles[imgIdx];
      if (!filename) continue;

      if (
        !seenSceneEkotoba.has(cid) &&
        idx === (firstByScene[cid] ?? idx)
      ) {
        const ekotoba = {
          cat: "ekotoba",
          chapter: String(cid),
          config: "",
          src: "",
          name: "",
          srcHeight: 1080,
          srcWidth: 1920,
          scene_chapter: String(cid),
          chapter_pill: true,
        };
        const scene = scenesById[cid];
        if (scene?.genji_chapter != null) {
          ekotoba.genji_chapter = String(scene.genji_chapter);
        }
        emakis.push(ekotoba);
        seenSceneEkotoba.add(cid);
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
        chapter: String(panel.id),
        config: "local",
        src: `${devBase}/${filename}`,
        name: path.parse(filename).name,
        srcHeight: height,
        srcWidth: width,
        global_index: idx,
        ...panelSlotMetadata(panel),
      });
    }
  });

  return emakis;
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
