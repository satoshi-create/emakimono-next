import fs from "fs";
import path from "path";

import {
  getPanelsConfig,
  buildViewerChapters,
  buildPanelsForViewer,
  buildEmakisForPanelsLocal,
} from "@/libs/dev/uploadScrollApi/panelsPipeline";

export function copyScrollImagesToPublicDev(scrollId, titleen) {
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

export function defaultLocalThumbPublicPath(titleen) {
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

export function patchMetadataJsonDeliveryLocal(filePath, titleen) {
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

export function applyLocalDeliveryToSyncedMetadata(titleen) {
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

export function sceneTextFields(scene) {
  if (!scene || typeof scene !== "object") {
    return {
      kobun: "",
      kobunen: "",
      gendaibun: "",
      gendaibunen: "",
      desc: "",
      descen: "",
      desc_zh: "",
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
  const desc_zh =
    typeof t.desc_zh === "string"
      ? t.desc_zh
      : typeof scene.desc_zh === "string"
        ? scene.desc_zh
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
    desc_zh,
    tansaku,
  };
}

export function readImageDimensionsFromBuffer(buf) {
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

export function readImageDimensions(filePath) {
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

export function listSortedScrollImages(scrollId) {
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

export function executeLocalVerification(scrollId, titleen, metadata, scenes, panels) {
  const meta = metadata && typeof metadata === "object" ? { ...metadata } : {};
  const sceneList = Array.isArray(scenes) ? scenes : [];
  const panelConfig = getPanelsConfig(Array.isArray(panels) ? panels : []);
  const usePanels = panelConfig.length > 0;
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

  const chapters = usePanels
    ? buildViewerChapters(sceneList)
    : sceneList.map((scene, idx) => ({
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

  const emakis = usePanels
    ? buildEmakisForPanelsLocal(
        sceneList,
        panelConfig,
        imageFiles,
        devBase,
        scrollId
      )
    : [];
  if (!usePanels) {
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
  }

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
    ...(meta.title_zh ? { title_zh: meta.title_zh } : {}),
    author: meta.author ?? "",
    authoren: meta.authoren ?? "",
    ...(meta.author_zh ? { author_zh: meta.author_zh } : {}),
    era: meta.era ?? "",
    eraen: meta.eraen ?? "",
    ...(meta.era_zh ? { era_zh: meta.era_zh } : {}),
    type: meta.type ?? "",
    typeen: meta.typeen ?? "",
    ...(meta.type_zh ? { type_zh: meta.type_zh } : {}),
    desc: meta.desc ?? "",
    descen: meta.descen ?? "",
    ...(meta.desc_zh ? { desc_zh: meta.desc_zh } : {}),
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
    ...((meta.reading_direction || meta.readingDirection) === "ltr"
      ? { readingDirection: "ltr" }
      : {}),
    keyword,
    delivery: "local",
    images,
    chapters,
    emakis,
    ...(usePanels ? { panels: buildPanelsForViewer(panelConfig) } : {}),
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
      if (scene.title_zh) entry.title_zh = scene.title_zh;
      if (tf.kobunen) entry.kobunen = tf.kobunen;
      if (tf.gendaibunen) entry.gendaibunen = tf.gendaibunen;
      if (tf.descen) entry.descen = tf.descen;
      if (tf.desc_zh) entry.desc_zh = tf.desc_zh;
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
