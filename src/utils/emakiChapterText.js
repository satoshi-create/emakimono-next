/**
 * 絵巻の章テキスト接続ヘルパー。
 *
 * - emaki-text-data/{titleen}.json を require.context で自動ロード（sync_all.py 生成）
 * - 源氏絵（_archive_unused_data/genji）の章データ接続
 * - ChaptersTitle / ChaptersGendaibun / ChaptersDesc / getChapterDescRaw:
 *   「源氏優先 → ファイル正本 → キャッシュ desc フォールバック」の順で表示テキストを解決
 *
 * 抽出元: src/utils/func.js（旧 func.js は re-export のみに縮小済み）。
 * 注意: 源氏関連はレガシー archive データに依存（MVP 対象外のため、現行絵巻では通らない）。
 */
import chaptergenji from "@/libs/_archive_unused_data/genji/chapters-of-genji.json";
import parse from "html-react-parser";

/** 章テキストとして読み込まないファイル（九相カタログは stage_en キーの共有カタログのため除外） */
const EMAKI_TEXT_EXCLUDED_SLUGS = new Set(["chapters-of-kusouzu"]);

function buildEmakiTextDataMap() {
  const map = {};
  const ctx = require.context("../data/emaki-text-data", false, /\.json$/);
  ctx.keys().forEach((key) => {
    const slug = key.replace(/^\.\//, "").replace(/\.json$/, "");
    if (EMAKI_TEXT_EXCLUDED_SLUGS.has(slug)) return;
    const data = ctx(key);
    map[slug] = data?.default ?? data;
  });
  return map;
}

const emakiTextDataMap = buildEmakiTextDataMap();

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

// emaki-text-data/{titleen}.json が存在すれば、その巻のテキストはファイルが正本。
// チャプターキーはキャッシュ（ekotoba.chapter）と一致させる。
export const hasTextData = (titleen) => Boolean(emakiTextDataMap[titleen]);

export const connectGenjiChapters = (chapter, text) => {
  const chapterGenjisummary = chaptergenji
    .filter((item) => chapter === item.chapter_en)
    .map((item) => item[text])
    .join();
  return chapterGenjisummary;
};
export const connectGenjiChaptersScene = (chapter, scene) => {
  if (scene) {
    const chapterGenjisummary = chaptergenji
      .filter((item) => chapter === item.chapter_en)
      .flatMap((item) => item.scene)
      .filter((item) => scene === item.sceneId)
      .map((item) => item.content);
    return chapterGenjisummary;
  }
};

export const ChaptersTitle = (titleen, title, chapter, text) => {
  if (title.includes("源氏")) {
    return (
      <>
        {connectGenjiChapters(chapter, "chapter_en") &&
          `【第${connectGenjiChapters(chapter, "chapter_ch")}帖】`}
        <ruby>
          {connectGenjiChapters(chapter, "chapter_en") &&
            `${connectGenjiChapters(chapter, "title")}`}
          <rp>(</rp>
          <rt>
            {connectGenjiChapters(chapter, "chapter_en") &&
              `${connectGenjiChapters(chapter, "ruby")}`}
          </rt>
          <rp>)</rp>
        </ruby>
      </>
    );
  }
  if (hasTextData(titleen)) {
    return connectEmakiTextData(titleen, chapter, text);
  }
  return chapter && parse(chapter);
};

export const ChaptersGendaibun = (titleen, title, chapter, gendaibun) => {
  if (title.includes("源氏")) {
    return (
      <>
        {connectGenjiChapters(chapter, "summary") &&
          `${connectGenjiChapters(chapter, "summary")}`}
      </>
    );
  }
  if (hasTextData(titleen)) {
    const gendaibunText = connectEmakiTextData(titleen, chapter, "gendaibun");
    if (gendaibunText) return parse(gendaibunText);
    const titleText = connectEmakiTextData(titleen, chapter, "title");
    return titleText ? parse(titleText) : "";
  }
  return gendaibun && parse(gendaibun);
};

export const ChaptersDesc = (titleen, title, chapter, text, desc) => {
  if (title.includes("源氏")) {
    return (
      <>
        {connectGenjiChapters(chapter, "summary") &&
          `${connectGenjiChapters(chapter, "summary")}`}
      </>
    );
  }
  if (hasTextData(titleen)) {
    const field = text === "descen" ? "descen" : "desc";
    const fromJson = connectEmakiTextData(titleen, chapter, field);
    return fromJson ? parse(fromJson) : "";
  }
  return desc && parse(desc);
};

// 段の解説を生テキスト（文字列）で返す。ChaptersDesc の文字列版。
// ボトムコメントバーで「冒頭プレビュー + 詳細をみる」を出し分けるために使用する。
export const getChapterDescRaw = (titleen, title, chapter, text, desc) => {
  if (title.includes("源氏")) {
    return connectGenjiChapters(chapter, "summary") || "";
  }
  if (hasTextData(titleen)) {
    const field = text === "descen" ? "descen" : "desc";
    return connectEmakiTextData(titleen, chapter, field) || "";
  }
  return desc || "";
};
