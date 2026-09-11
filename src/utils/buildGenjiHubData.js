import chapters from "@/data/emaki-text-data/chapters-of-genji.json";
import emakisMetadata from "@/data/image-metadata-cache/image-metadata-cache.json";
import { isWithdrawnScroll } from "@/libs/constants/withdrawnScrolls";
import { removeNestedEmakisObj } from "@/utils/func";
import { buildCloudinaryUrl } from "@/utils/cloudinaryUrl";

/** Scroll has at least one Genji chapter mapping in metadata. */
export function isGenjiScroll(emaki) {
  return Array.isArray(emaki.genjieslug) && emaki.genjieslug.length > 0;
}

/** Keep a single pure URL from a value that may be a srcset string ("url 3840w"). */
export function pureImageUrl(value) {
  if (typeof value !== "string") return null;
  const first = value.trim().split(/\s+/)[0];
  return first || null;
}

/** Resolve a nested scene `src` into a usable image URL (no srcset descriptors). */
function resolveSceneImage(scene) {
  const src = pureImageUrl(scene.src);
  if (!src) return null;
  if (/^https?:\/\//.test(src)) return src;
  if (scene.config === "cloudinary" || /^v\d+\//.test(src)) {
    return buildCloudinaryUrl(src, ["w_800", "f_auto", "q_auto:eco"]);
  }
  return src.startsWith("/") ? src : `/${src}`;
}

/**
 * Map Genji chapter number → first image scene of that chapter.
 * Nested `emakis` alternate 詞書 entries (with `genji_chapter`) and
 * `cat: "image"` entries, so images inherit the preceding chapter.
 */
function buildChapterImageMap(emakisMetadata) {
  const map = {};
  emakisMetadata
    .filter((emaki) => isGenjiScroll(emaki) && !isWithdrawnScroll(emaki.titleen))
    .forEach((emaki) => {
      if (!Array.isArray(emaki.emakis)) return;
      let currentChapter = null;
      emaki.emakis.forEach((scene) => {
        // 詞書 (ekotoba) carries the chapter; following images (empty
        // genji_chapter/chapter) inherit it.
        if (scene.cat === "ekotoba") {
          const key = scene.genji_chapter || scene.chapter;
          if (key) currentChapter = String(key);
          return;
        }
        if (scene.cat !== "image" || !scene.src || !currentChapter) return;
        if (!map[currentChapter]) {
          const url = resolveSceneImage(scene);
          if (url) map[currentChapter] = url;
        }
      });
    });
  return map;
}

/** Same rule as genji/[slug].js — match by chapter path (or chapter_en id). */
export function scrollHasGenjiChapter(scroll, chapter) {
  if (!Array.isArray(scroll.genjieslug)) return false;
  return scroll.genjieslug.some(
    (s) => s.path === chapter.path || s.id === chapter.chapter_en
  );
}

/**
 * Hub data for /genji/chapters-genji — 54 chapters, scroll columns, and mappings.
 * Keys scrolls by titleen (stable across locales).
 */
export function buildGenjiHubData() {
  const scrollEmakis = emakisMetadata
    .filter((emaki) => isGenjiScroll(emaki) && !isWithdrawnScroll(emaki.titleen))
    .map((emaki) => removeNestedEmakisObj(emaki));

  // Build titleen → thumb lookup from ALL scrolls (not just Genji)
  const thumbMap = {};
  emakisMetadata.forEach((emaki) => {
    if (emaki.thumb) thumbMap[emaki.titleen] = pureImageUrl(emaki.thumb);
  });

  // Chapter number → actual scene image from the surviving illustrated scrolls
  const chapterImageMap = buildChapterImageMap(emakisMetadata);

  const scrolls = scrollEmakis.map((emaki) => ({
    titleen: emaki.titleen,
    title: emaki.title,
    chapterPaths: emaki.genjieslug.map((s) => s.path),
  }));

  const chapterList = chapters.map((chapter) => {
    const scrollTitleens = scrolls
      .filter((scroll) => scroll.chapterPaths.includes(chapter.path))
      .map((scroll) => scroll.titleen);

    // Representative thumbnail: first scroll that covers this chapter
    const thumb = scrollTitleens.map((t) => thumbMap[t]).find(Boolean) ?? null;

    // Prefer the actual scene image of this chapter, fall back to the scroll thumb
    const thumbnailUrl =
      chapterImageMap[String(chapter.chapter_en)] ?? thumb ?? null;

    return {
      chapter_en: chapter.chapter_en,
      chapter_ch: chapter.chapter_ch,
      slug: chapter.path,
      title: chapter.title,
      titleen: chapter.titleen,
      ruby: chapter.ruby,
      mainCharacter: chapter["main-character"] ?? null,
      age: chapter.age ?? null,
      summary: chapter.summary ?? null,
      gendaibun: chapter.gendaibun ?? null,
      gendaibunen: chapter.gendaibunen ?? null,
      kobun: chapter.kobun ?? null,
      desc: chapter.desc ?? null,
      descen: chapter.descen ?? null,
      scenes: chapter.scene ?? [],
      sourceUrl: chapter.url ?? chapter.source ?? null,
      scrollTitleens,
      hasScroll: scrollTitleens.length > 0,
      thumb,
      thumbnailUrl,
    };
  });

  return {
    chapters: chapterList,
    scrolls,
    scrollEmakis,
    heroThumb: thumbMap["genjimonogatari-emaki-tokugawa"] ?? null,
    heroCloudinary: null,
  };
}
