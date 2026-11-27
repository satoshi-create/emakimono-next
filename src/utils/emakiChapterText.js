/**
 * 絵巻の章テキスト接続ヘルパー。
 *
 * - scroll-texts/{titleen}.json を require.context で自動ロード（sync_all.py 生成）
 * - 源氏絵: genji-chapters.json（54帖マスター）を参照
 * - 巻別 JSON があるとき gendaibun/kobun は巻別のみ（マスターあらすじへフォールバックしない）
 * - 章キー: scroll-texts / ekotoba.chapter = scene id。帖番号は genji_chapter
 *
 * 抽出元: src/utils/func.js（旧 func.js は re-export のみに縮小済み）。
 */
import chaptergenji from "@/data/scroll-texts/genji-chapters";
import parse from "html-react-parser";

/** 縦書き内の連続アラビア数字を縦中横用 span で囲む */
export function withTateChuYoko(text) {
  if (text == null || text === false) return null;
  const s = String(text);
  if (!s) return s;
  const parts = s.split(/(\d+)/);
  if (parts.length === 1) return s;
  return parts.map((part, i) =>
    /^\d+$/.test(part) ? (
      <span key={i} className="tate-chu-yoko">
        {part}
      </span>
    ) : (
      part
    )
  );
}

// ---------------------------------------------------------------------------
// 1. 境界定義・定数（YAML自動アップロード契約）
// scroll-texts/*.json は sync_all.py が scroll_config.yaml の scenes[].text から生成。
// ビルド時 require.context で巻別 JSON を自動登録（新規 titleen 追加時に import 追記不要）。
// ---------------------------------------------------------------------------

/** 章テキストとして読み込まない共有カタログ */
const EMAKI_TEXT_EXCLUDED_SLUGS = new Set([
  "kusouzu-chapters",
  "genji-chapters",
]);

/**
 * 巻別 JSON があるときマスターへ落とさないフィールド。
 * gendaibun 空 = 意図的（帖あらすじを詞書現代文として出さない）。
 */
const GENJI_SCROLL_OWNED_FIELDS = new Set([
  "gendaibun",
  "gendaibunen",
  "kobun",
  "kobunen",
]);

/** ビューア field → マスター JSON で試すキー（先頭優先） */
const GENJI_FIELD_KEYS = {
  title: ["title"],
  titleen: ["titleen", "path"],
  chapter_en: ["chapter_en"],
  chapter_ch: ["chapter_ch"],
  ruby: ["ruby"],
  summary: ["summary"],
  gendaibun: ["gendaibun"],
  gendaibunen: ["gendaibunen"],
  desc: ["desc", "summary"],
  descen: ["descen", "desc"],
  kobun: ["kobun"],
  kobunen: ["kobunen"],
};

// ---------------------------------------------------------------------------
// 2. データ読み込み・フィルタリング処理（require.context → titleen マップ）
// ---------------------------------------------------------------------------

function buildEmakiTextDataMap() {
  const map = {};
  const ctx = require.context("../data/scroll-texts", false, /\.json$/);
  ctx.keys().forEach((key) => {
    const slug = key.replace(/^\.\//, "").replace(/\.json$/, "");
    if (EMAKI_TEXT_EXCLUDED_SLUGS.has(slug)) return;
    const data = ctx(key);
    map[slug] = data?.default ?? data;
  });
  return map;
}

const emakiTextDataMap = buildEmakiTextDataMap();

const SCROLL_METADATA_ORDER = "_order.json";

function buildScrollPanelsMap() {
  const map = {};
  const ctx = require.context(
    "../data/scroll-metadata/scrolls",
    false,
    /\.json$/
  );
  ctx.keys().forEach((key) => {
    const base = key.replace(/^\.\//, "");
    if (base === SCROLL_METADATA_ORDER) return;
    const raw = ctx(key);
    const item = raw?.default ?? raw;
    const slug = base.replace(/\.json$/, "");
    const scrollKey = item?.titleen ?? slug;
    if (Array.isArray(item?.panels) && item.panels.length > 0) {
      map[scrollKey] = item.panels;
    }
  });
  return map;
}

const scrollPanelsMap = buildScrollPanelsMap();

function panelEmbroideredMark(panel) {
  const mark = panel?.embroidered_mark;
  if (mark != null && String(mark).trim() !== "") return String(mark).trim();
  if (panel?.panel_number != null) return String(panel.panel_number);
  return "";
}

function buildPanelRangeSuffix(textField, first, last) {
  const isEn = textField === "titleen";
  const isZh = textField === "title_zh";
  if (first === last) {
    if (isEn) return ` (Panel ${first})`;
    if (isZh) return `（场面 ${first}）`;
    return `（場面 ${first}）`;
  }
  if (isEn) return ` (Panels ${first}–${last})`;
  if (isZh) return `（场面 ${first}–${last}）`;
  return `（場面 ${first}–${last}）`;
}

function titleAlreadyHasPanelRange(titleStr, first, last, textField) {
  if (!titleStr) return false;
  const t = String(titleStr);
  const enDash = "[\u2013\\-—]";
  if (first === last) {
    const solo = new RegExp(
      `[（(]\\s*(?:場面|场面|Panels?|Panel)\\s+${escapeForRegExp(first)}\\s*[）)]`,
      "i"
    );
    return solo.test(t);
  }
  const range = new RegExp(
    `${escapeForRegExp(first)}\\s*${enDash}\\s*${escapeForRegExp(last)}`
  );
  if (range.test(t)) return true;
  const labeled = buildPanelRangeSuffix(textField, first, last).trim();
  return t.includes(labeled);
}

function escapeForRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function maybeAppendPanelRange(titleen, chapter, textField, titleValue, panelsOverride) {
  if (titleValue == null || titleValue === "" || titleValue === false) {
    return titleValue;
  }
  if (typeof titleValue !== "string") return titleValue;

  const panels =
    (Array.isArray(panelsOverride) && panelsOverride.length > 0
      ? panelsOverride
      : scrollPanelsMap[titleen]) || [];
  if (!panels.length) return titleValue;

  const chapterStr = String(chapter);
  const chapterPanels = panels.filter(
    (p) => String(p.chapter_id) === chapterStr
  );
  if (!chapterPanels.length) return titleValue;

  const sorted = [...chapterPanels].sort(
    (a, b) =>
      Number(a.panel_number ?? a.id ?? 0) - Number(b.panel_number ?? b.id ?? 0)
  );
  const first = panelEmbroideredMark(sorted[0]);
  const last = panelEmbroideredMark(sorted[sorted.length - 1]);
  if (!first) return titleValue;

  if (titleAlreadyHasPanelRange(titleValue, first, last || first, textField)) {
    return titleValue;
  }
  const suffix = buildPanelRangeSuffix(textField, first, last || first);
  return titleValue + suffix;
}

export const connectEmakiTextData = (titleen, chapter, field) => {
  const chapterData = emakiTextDataMap[titleen];
  if (!chapterData) {
    return "";
  }
  const chapterStr = String(chapter);
  return chapterData
    .filter((item) => chapterStr === String(item.chapter))
    .map((item) => item[field])
    .filter(Boolean)
    .join();
};

/**
 * 章に紐づく構造化データ（オブジェクトや配列）を文字列結合せずにそのまま取得する
 */
export const getChapterCustomData = (titleen, chapter, field) => {
  const chapterData = emakiTextDataMap[titleen];
  if (!chapterData) return null;
  const chapterStr = String(chapter);
  const found = chapterData.find((item) => chapterStr === String(item.chapter));
  return found ? found[field] || null : null;
};

export const hasTextData = (titleen) => Boolean(emakiTextDataMap[titleen]);

/** タイトルまたは titleen から源氏絵かどうかを判定 */
export const isGenjiWork = (titleen, title) => {
  if (typeof title === "string" && title.includes("源氏")) return true;
  if (typeof titleen === "string" && titleen.toLowerCase().includes("genji"))
    return true;
  return false;
};

/** 帖番号（マスター参照用）。hint → 巻別 JSON の genji_chapter → chapter そのもの */
export const resolveGenjiMasterChapter = (
  titleen,
  chapter,
  genjiChapterHint
) => {
  if (genjiChapterHint != null && String(genjiChapterHint).trim() !== "") {
    return String(genjiChapterHint);
  }
  const rows = emakiTextDataMap[titleen];
  if (rows) {
    const row = rows.find((item) => String(item.chapter) === String(chapter));
    if (row?.genji_chapter != null && String(row.genji_chapter).trim() !== "") {
      return String(row.genji_chapter);
    }
  }
  return String(chapter);
};

export const connectGenjiChapters = (chapter, text) => {
  const keys = GENJI_FIELD_KEYS[text] || [text];
  const chapterStr = String(chapter);
  const rows = chaptergenji.filter(
    (item) => chapterStr === String(item.chapter_en)
  );
  for (const key of keys) {
    const joined = rows
      .map((item) => item[key])
      .filter(Boolean)
      .join();
    if (joined) return joined;
  }
  return "";
};

export const connectGenjiChaptersScene = (chapter, scene) => {
  if (scene) {
    const chapterStr = String(chapter);
    return chaptergenji
      .filter((item) => chapterStr === String(item.chapter_en))
      .flatMap((item) => item.scene || [])
      .filter((item) => String(scene) === String(item.sceneId))
      .map((item) => item.content);
  }
};

export const ChaptersTitle = (
  titleen,
  title,
  chapter,
  text,
  genjiChapter,
  panelsOverride
) => {
  const withPanelRange = (value) =>
    maybeAppendPanelRange(titleen, chapter, text, value, panelsOverride);

  if (isGenjiWork(titleen, title)) {
    const masterCh = resolveGenjiMasterChapter(titleen, chapter, genjiChapter);
    if (text === "titleen") {
      const fromFile =
        hasTextData(titleen) &&
        connectEmakiTextData(titleen, chapter, "titleen");
      if (fromFile) return withPanelRange(fromFile);
      const num = connectGenjiChapters(masterCh, "chapter_en");
      const path = connectGenjiChapters(masterCh, "titleen");
      if (num && path) return withPanelRange(`Chapter ${num}: ${path}`);
      if (num) return withPanelRange(`Chapter ${num}`);
      return withPanelRange(path || "");
    }
    // 日本語: 巻別 title を優先（柏木（一）等の段番号を含める）
    const fromFile =
      hasTextData(titleen) && connectEmakiTextData(titleen, chapter, "title");
    if (fromFile) {
      return withTateChuYoko(withPanelRange(fromFile));
    }

    const chEn = connectGenjiChapters(masterCh, "chapter_en");
    if (!chEn) return "";

    const chNum = connectGenjiChapters(masterCh, "chapter_ch");
    const genjiTitle = connectGenjiChapters(masterCh, "title");
    const ruby = connectGenjiChapters(masterCh, "ruby");

    return (
      <>
        {chNum && withTateChuYoko(`【第${chNum}帖】`)}
        <ruby>
          {genjiTitle}
          <rp>(</rp>
          <rt>{ruby}</rt>
          <rp>)</rp>
        </ruby>
      </>
    );
  }
  if (hasTextData(titleen)) {
    const t = connectEmakiTextData(titleen, chapter, text);
    return t ? withTateChuYoko(withPanelRange(t)) : "";
  }
  return chapter ? parse(String(chapter)) : "";
};

/**
 * 段テキストを生文字列で返す（HTML 含む場合あり）。
 * field: desc / descen / gendaibun / gendaibunen / kobun / kobunen など。
 */
export const getChapterFieldRaw = (
  titleen,
  title,
  chapter,
  field,
  fallback = "",
  genjiChapter
) => {
  if (isGenjiWork(titleen, title)) {
    const hasFile = hasTextData(titleen);
    const override = hasFile
      ? connectEmakiTextData(titleen, chapter, field)
      : "";
    if (GENJI_SCROLL_OWNED_FIELDS.has(field)) {
      if (hasFile) return override || fallback || "";
    } else if (override) {
      return override;
    }
    const masterCh = resolveGenjiMasterChapter(titleen, chapter, genjiChapter);
    const fromMaster = connectGenjiChapters(masterCh, field);
    if (fromMaster) return fromMaster;
    return fallback || "";
  }
  if (hasTextData(titleen)) {
    return connectEmakiTextData(titleen, chapter, field) || fallback || "";
  }
  return fallback || "";
};

export const ChaptersGendaibun = (
  titleen,
  title,
  chapter,
  gendaibun,
  text = "gendaibun"
) => {
  if (isGenjiWork(titleen, title)) {
    const field = text === "gendaibunen" ? "gendaibunen" : "gendaibun";
    const raw = getChapterFieldRaw(titleen, title, chapter, field, "");
    return raw ? <>{raw}</> : null;
  }
  const field = text === "gendaibunen" ? "gendaibunen" : "gendaibun";
  if (hasTextData(titleen)) {
    const gendaibunText =
      connectEmakiTextData(titleen, chapter, field) ||
      (field === "gendaibunen"
        ? connectEmakiTextData(titleen, chapter, "gendaibun")
        : "");
    if (gendaibunText) return parse(gendaibunText);
    const titleText = connectEmakiTextData(titleen, chapter, "title");
    return titleText ? parse(titleText) : "";
  }
  return gendaibun && parse(gendaibun);
};

export const ChaptersDesc = (titleen, title, chapter, text, desc) => {
  if (isGenjiWork(titleen, title)) {
    const field = text === "descen" ? "descen" : "desc";
    const raw = getChapterFieldRaw(titleen, title, chapter, field, desc || "");
    return raw ? <>{raw}</> : null;
  }
  if (hasTextData(titleen)) {
    const field = text === "descen" ? "descen" : "desc";
    const fromJson = connectEmakiTextData(titleen, chapter, field);
    return fromJson ? parse(fromJson) : "";
  }
  return desc && parse(desc);
};

// 段の解説を生テキスト（文字列）で返す。ChaptersDesc の文字列版。
export const getChapterDescRaw = (titleen, title, chapter, text, desc) => {
  const field = text === "descen" ? "descen" : "desc";
  return getChapterFieldRaw(titleen, title, chapter, field, desc || "");
};
