/**
 * 源氏物語54帖ハブ用の出典メタ（方針 A: 短あらすじ + 外部全文リンク + 任意抜粋）。
 * 研究メモ: scrolls/source/genjimonogatari/genji-source.md
 */

export const GENJI_HUB_PATH = "/genji/chapters-genji";

/** Wikisource 校訂本文（渋谷栄一校訂）の索引 */
export const GENJI_SOURCE_KOBUN_INDEX =
  "https://ja.wikisource.org/wiki/%E6%BA%90%E6%B0%8F%E7%89%A9%E8%AA%9E_(%E6%B8%8B%E8%B0%B7%E6%A0%84%E4%B8%80%E6%A0%A1%E8%A8%82)";

/**
 * 青空文庫・與謝野晶子訳の作品案内（帖本文ではない）。
 * 帖別 URL は buildGenjiGendaibunChapterUrl / AOZORA_YOSANO_CARD_BY_CHAPTER を使う。
 */
export const GENJI_SOURCE_GENDAIBUN_INDEX =
  "https://www.aozora.gr.jp/cards/000052/card362.html";

export const GENJI_SOURCES = {
  kobun: {
    labelJa: "源氏物語（渋谷栄一校訂）— Wikisource",
    labelEn: "The Tale of Genji (Shibuya ed.) — Wikisource",
    indexUrl: GENJI_SOURCE_KOBUN_INDEX,
  },
  gendaibun: {
    labelJa: "源氏物語（與謝野晶子訳）— 青空文庫",
    labelEn: "The Tale of Genji (Yosano Akiko trans.) — Aozora Bunko",
    indexUrl: GENJI_SOURCE_GENDAIBUN_INDEX,
  },
};

/**
 * Wikisource サブページ名がマスター帖名と異なるとき。
 * 実ページは `源氏物語/{wikiTitle}`（親は渋谷校訂ではなく「源氏物語」）。
 */
export const WIKISOURCE_TITLE_BY_MASTER = {
  少女: "乙女",
  匂宮: "匂兵部卿",
};

/**
 * 当サイトの 54 帖番号 → 青空・與謝野訳の図書カード番号。
 * 青空は夕霧を二分割・雲隠れを独立させるため 56 分冊。54 帖へは次で対応:
 * - 39夕霧 → 夕霧一（5054）
 * - 40御法以降は雲隠れ（5058）を飛ばして対応
 */
export const AOZORA_YOSANO_CARD_BY_CHAPTER = {
  1: 5016,
  2: 5017,
  3: 5018,
  4: 5019,
  5: 5020,
  6: 5021,
  7: 5022,
  8: 5023,
  9: 5024,
  10: 5025,
  11: 5026,
  12: 5027,
  13: 5028,
  14: 5029,
  15: 5030,
  16: 5031,
  17: 5032,
  18: 5033,
  19: 5034,
  20: 5035,
  21: 5036,
  22: 5037,
  23: 5038,
  24: 5039,
  25: 5040,
  26: 5041,
  27: 5042,
  28: 5043,
  29: 5044,
  30: 5045,
  31: 5046,
  32: 5047,
  33: 5048,
  34: 5049,
  35: 5050,
  36: 5051,
  37: 5052,
  38: 5053,
  39: 5054,
  40: 5056,
  41: 5057,
  42: 5059,
  43: 5060,
  44: 5061,
  45: 5062,
  46: 5063,
  47: 5064,
  48: 5065,
  49: 5066,
  50: 5067,
  51: 5068,
  52: 5069,
  53: 5070,
  54: 5071,
};

/**
 * @param {string} titleJa マスターの帖名（例: 桐壺）
 */
export function buildGenjiKobunChapterUrl(titleJa) {
  if (!titleJa) return GENJI_SOURCE_KOBUN_INDEX;
  const wikiTitle = WIKISOURCE_TITLE_BY_MASTER[titleJa] || titleJa;
  const page = `源氏物語/${wikiTitle}`;
  return `https://ja.wikisource.org/wiki/${encodeURIComponent(page).replace(
    /%2F/gi,
    "/"
  )}`;
}

/**
 * @param {string|number} chapterEn 1–54
 */
export function buildGenjiGendaibunChapterUrl(chapterEn) {
  const card = AOZORA_YOSANO_CARD_BY_CHAPTER[String(chapterEn)];
  if (!card) return GENJI_SOURCE_GENDAIBUN_INDEX;
  return `https://www.aozora.gr.jp/cards/000052/card${card}.html`;
}
