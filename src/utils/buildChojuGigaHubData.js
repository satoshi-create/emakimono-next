import emakisMetadata from "@/data/image-metadata-cache/image-metadata-cache.json";
import { isWithdrawnScroll } from "@/libs/constants/withdrawnScrolls";
import { removeNestedEmakisObj } from "@/utils/func";

const CHAPTER_MAP = {
  "Chōjū-jinbutsu-giga_first": "_first",
  "Chōjū-jinbutsu-giga_second": "_second",
  "Chōjū-jinbutsu-giga_third": "_third",
  "Chōjū-jinbutsu-giga_fourth": "_fourth",
};

/** Scroll belongs to the Chōjū-jinbutsu-giga series. */
export function isChojuGigaScroll(emaki) {
  return emaki.title?.includes("鳥獣人物戯画絵巻") ?? false;
}

/**
 * Hub data for /chouju-giga/chapters.
 * Returns the 4 scrolls with their chapter data, plus a hero thumb.
 */
export function buildChojuGigaHubData() {
  const scrollEmakis = emakisMetadata
    .filter((emaki) => isChojuGigaScroll(emaki) && !isWithdrawnScroll(emaki.titleen))
    .map((emaki) => removeNestedEmakisObj(emaki));

  // Dynamic import of chapter JSON for each scroll
  // We use a static lookup because webpack needs to resolve them at build time.
  const chapterData = {};
  try {
    chapterData._first = require("@/data/emaki-text-data/Chōjū-jinbutsu-giga_first.json");
  } catch (_) {
    chapterData._first = [];
  }
  try {
    chapterData._second = require("@/data/emaki-text-data/Chōjū-jinbutsu-giga_second.json");
  } catch (_) {
    chapterData._second = [];
  }
  try {
    chapterData._third = require("@/data/emaki-text-data/Chōjū-jinbutsu-giga_third.json");
  } catch (_) {
    chapterData._third = [];
  }
  try {
    chapterData._fourth = require("@/data/emaki-text-data/Chōjū-jinbutsu-giga_fourth.json");
  } catch (_) {
    chapterData._fourth = [];
  }

  const scrolls = scrollEmakis.map((emaki) => {
    const suffix = CHAPTER_MAP[emaki.titleen] ?? null;
    const chapters = suffix ? chapterData[suffix] ?? [] : [];
    return {
      titleen: emaki.titleen,
      title: emaki.title,
      thumb: emaki.thumb ?? null,
      era: emaki.era ?? null,
      eraen: emaki.eraen ?? null,
      author: emaki.author ?? null,
      authoren: emaki.authoren ?? null,
      desc: emaki.desc ?? null,
      descen: emaki.descen ?? null,
      chapters,
      suffix,
    };
  });

  const heroThumb =
    scrolls.find((s) => s.titleen === "Chōjū-jinbutsu-giga_first")?.thumb ?? null;

  return {
    scrolls,
    heroThumb,
    heroCloudinary: "v1775033735/emakimono/choju-giga-yamazaki-kou__choju-giga-yamazaki-kou_1_06__01.jpg",
  };
}
