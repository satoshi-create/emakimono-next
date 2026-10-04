/**
 * scrolls/source/ebiki/ebiki.csv → src/data/folklore/
 *
 * CSV は一次資料として保持し、このスクリプトで以下を機械処理する:
 *  - keywords の | 区切り配列化
 *  - scroll_id → titleen 正規化（ビューア URL スラッグ）
 *  - folkloreItems / folkloreByTitleen / folkloreIndex の生成
 *
 * 実行: npm run build:folklore
 *      または node scripts/convert-ebiki-csv.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const CSV_PATH = path.join(ROOT, "scrolls", "source", "ebiki", "ebiki.csv");
const OUT_DIR = path.join(ROOT, "src", "data", "folklore");

/**
 * CSV scroll_id → 本番 titleen（ビューア URL スラッグ）。
 * 未掲載は identity（そのまま）。新規絵巻追加時はここに足す。
 */
const SCROLL_ID_TO_TITLEEN = {
  "choju-jinbutsu-giga_first": "Chōjū-jinbutsu-giga_first",
  "Chōjū-jinbutsu-giga_third": "Chōjū-jinbutsu-giga_third",
  "Chōjū-jinbutsu-giga_fourth": "Chōjū-jinbutsu-giga_fourth",
  "eshi-no-soshi_tohaku": "eshi-no-soshi_tohaku",
  "gakisoushi_kawamoto": "gakisoushi_kawamoto",
  "naomoto_moushibumi_ekotoba": "naomoto_moushibumi_ekotoba",
};

const HEADER =
  "// GENERATED FILE — 手動編集しない。再生成: npm run build:folklore\n" +
  "// 出典: scrolls/source/ebiki/ebiki.csv（一次資料）\n";

/** RFC4180 風の簡易 CSV パーサ（ダブルクォート対応） */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let i = 0;
  let inQuotes = false;
  const s = text.replace(/^\uFEFF/, "");

  while (i < s.length) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += c;
      i += 1;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (c === ",") {
      row.push(field);
      field = "";
      i += 1;
      continue;
    }
    if (c === "\n" || c === "\r") {
      if (c === "\r" && s[i + 1] === "\n") i += 1;
      row.push(field);
      field = "";
      if (row.some((cell) => cell.trim() !== "")) rows.push(row);
      row = [];
      i += 1;
      continue;
    }
    field += c;
    i += 1;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((cell) => cell.trim() !== "")) rows.push(row);
  }
  return rows;
}

function toTitleen(scrollId) {
  const raw = String(scrollId ?? "").trim();
  return SCROLL_ID_TO_TITLEEN[raw] || raw;
}

function parseOffsetPercent(raw) {
  const n = Number(String(raw ?? "").trim());
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

/** CSV `link_id` / `linkId` → number。空・不正は undefined（章推定にフォールバック） */
function parseLinkId(raw) {
  const s = String(raw ?? "").trim();
  if (!s) return undefined;
  const n = Number(s);
  if (!Number.isFinite(n)) return undefined;
  return n;
}

/** 任意の英語カラム。空なら undefined（JA フォールバック用） */
function optionalEn(raw) {
  const s = String(raw ?? "").trim();
  return s || undefined;
}

function rowToItem(obj) {
  const scrollIdRaw = String(obj.scroll_id ?? "").trim();
  const keywordsRaw = String(obj.keywords ?? "").trim();
  const cropThumb = String(obj.crop_thumb ?? "").trim();
  const linkId = parseLinkId(obj.link_id ?? obj.linkId);
  return {
    item_id: String(obj.item_id ?? "").trim(),
    name: String(obj.name ?? "").trim(),
    name_en: optionalEn(obj.name_en),
    reading: String(obj.reading ?? "").trim(),
    act_category: String(obj.act_category ?? "").trim(),
    act_label: String(obj.act_label ?? "").trim(),
    act_label_en: optionalEn(obj.act_label_en),
    target_subject: String(obj.target_subject ?? "").trim(),
    era: String(obj.era ?? "").trim(),
    era_en: optionalEn(obj.era_en),
    keywords: keywordsRaw
      ? keywordsRaw.split("|").map((k) => k.trim()).filter(Boolean)
      : [],
    summary: String(obj.summary ?? "").trim(),
    summary_en: optionalEn(obj.summary_en),
    miyamoto: {
      chapter_title: String(obj.miyamoto_chapter ?? "").trim(),
      insight: String(obj.miyamoto_insight ?? "").trim(),
      page_ref: String(obj.miyamoto_source_book ?? "").trim(),
    },
    titleen: toTitleen(scrollIdRaw),
    scroll_id_raw: scrollIdRaw,
    scene_id: String(obj.scene_id ?? "").trim(),
    scene_title: String(obj.scene_title ?? "").trim(),
    scene_desc: String(obj.scene_desc ?? "").trim(),
    offset_percent: parseOffsetPercent(obj.offset_percent),
    link_id: linkId,
    crop_thumb: cropThumb || undefined,
    ebiki: {
      title: String(obj.ebiki_title ?? "").trim(),
      original_emaki: String(obj.ebiki_original_emaki ?? "").trim(),
      volume: String(obj.ebiki_volume ?? "").trim(),
      page: String(obj.ebiki_page ?? "").trim(),
      number: String(obj.ebiki_number ?? "").trim(),
      artist: String(obj.ebiki_artist ?? "").trim(),
      location: String(obj.ebiki_location ?? "").trim(),
      url: String(obj.ebiki_url ?? "").trim(),
    },
  };
}

function main() {
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`[convert-ebiki] CSV が見つかりません: ${CSV_PATH}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(CSV_PATH, "utf-8");
  const table = parseCsv(raw);
  if (table.length < 2) {
    console.error("[convert-ebiki] CSV が空です");
    process.exit(1);
  }

  const headers = table[0].map((h) => h.trim());
  const items = table.slice(1).map((cols) => {
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = cols[idx] ?? "";
    });
    return rowToItem(obj);
  }).filter((item) => item.item_id);

  /** @type {Record<string, Record<string, string[]>>} */
  const byTitleen = {};
  for (const item of items) {
    if (!byTitleen[item.titleen]) byTitleen[item.titleen] = {};
    const chapterKey = String(item.scene_id);
    if (!byTitleen[item.titleen][chapterKey]) {
      byTitleen[item.titleen][chapterKey] = [];
    }
    byTitleen[item.titleen][chapterKey].push(item.item_id);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const itemsPath = path.join(OUT_DIR, "folkloreItems.js");
  fs.writeFileSync(
    itemsPath,
    `${HEADER}\nconst folkloreItems = ${JSON.stringify(items, null, 2)};\n\nexport default folkloreItems;\n`,
    "utf-8"
  );

  const byPath = path.join(OUT_DIR, "folkloreByTitleen.js");
  fs.writeFileSync(
    byPath,
    `${HEADER}\nconst folkloreByTitleen = ${JSON.stringify(byTitleen, null, 2)};\n\nexport default folkloreByTitleen;\n`,
    "utf-8"
  );

  const indexPath = path.join(OUT_DIR, "folkloreIndex.js");
  fs.writeFileSync(
    indexPath,
    `${HEADER}
import folkloreItems from "./folkloreItems";
import folkloreByTitleen from "./folkloreByTitleen";

const byId = Object.fromEntries(
  folkloreItems.map((item) => [item.item_id, item])
);

/** @param {string} titleen @param {string|number} chapter */
export function getFolkloreItemsByChapter(titleen, chapter) {
  if (!titleen) return [];
  const chapterKey = String(chapter ?? "");
  const ids = folkloreByTitleen[titleen]?.[chapterKey] ?? [];
  return ids.map((id) => byId[id]).filter(Boolean);
}

/** @param {string} id */
export function getFolkloreItemById(id) {
  if (!id) return null;
  return byId[id] ?? null;
}

/** @param {string} titleen */
export function getFolkloreItemsByTitleen(titleen) {
  if (!titleen || !folkloreByTitleen[titleen]) return [];
  const ids = Object.values(folkloreByTitleen[titleen]).flat();
  return ids.map((id) => byId[id]).filter(Boolean);
}

export { folkloreItems, folkloreByTitleen };
export default {
  folkloreItems,
  folkloreByTitleen,
  getFolkloreItemsByChapter,
  getFolkloreItemById,
  getFolkloreItemsByTitleen,
};
`,
    "utf-8"
  );

  console.log(
    `[convert-ebiki] ${items.length} 件 → ${path.relative(ROOT, OUT_DIR)}/`
  );
  console.log(
    `[convert-ebiki] titleen 数: ${Object.keys(byTitleen).length}`
  );
}

main();
