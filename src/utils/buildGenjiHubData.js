import chapters from "@/data/emaki-text-data/chapters-of-genji.json";
import emakisMetadata from "@/data/image-metadata-cache/image-metadata-cache.json";
import { isWithdrawnScroll } from "@/libs/constants/withdrawnScrolls";
import { removeNestedEmakisObj } from "@/utils/func";

/** Scroll has at least one genjieslug mapping. */
export function isGenjiScroll(emaki) {
  return Array.isArray(emaki.genjieslug) && emaki.genjieslug.length > 0;
}

/** Match by chapter path on genjieslug (e.g. kiritsubo). */
export function scrollHasGenjiChapter(scroll, chapterPath) {
  return (
    scroll.genjieslug?.some((s) => s.path === chapterPath) ?? false
  );
}

/**
 * Hub data for /genji/chapters-genji — 54 chapters + related scrolls.
 */
export function buildGenjiHubData() {
  const scrollEmakis = emakisMetadata
    .filter(
      (emaki) => isGenjiScroll(emaki) && !isWithdrawnScroll(emaki.titleen)
    )
    .map((emaki) => removeNestedEmakisObj(emaki));

  const thumbMap = {};
  emakisMetadata.forEach((emaki) => {
    if (emaki.thumb) thumbMap[emaki.titleen] = emaki.thumb;
  });

  const scrolls = scrollEmakis.map((emaki) => ({
    titleen: emaki.titleen,
    title: emaki.title,
    chapterPaths: (emaki.genjieslug || [])
      .map((s) => s.path)
      .filter(Boolean),
  }));

  const chaptersList = chapters.map((chapter) => {
    const path = chapter.path || chapter.titleen;
    const scrollTitleens = scrolls
      .filter((scroll) => scroll.chapterPaths.includes(path))
      .map((scroll) => scroll.titleen);

    const thumb =
      scrollTitleens.map((t) => thumbMap[t]).find(Boolean) ?? null;

    return {
      chapter_en: chapter.chapter_en,
      chapter_ch: chapter.chapter_ch,
      title: chapter.title,
      titleen: chapter.titleen,
      ruby: chapter.ruby,
      path,
      summary: chapter.summary ?? "",
      gendaibun: chapter.gendaibun ?? "",
      gendaibunen: chapter.gendaibunen ?? "",
      kobun: chapter.kobun ?? "",
      kobunen: chapter.kobunen ?? "",
      source_kobun_url: chapter.source_kobun_url ?? "",
      source_gendaibun_url: chapter.source_gendaibun_url ?? "",
      mainCharacter: chapter["main-character"] ?? "",
      age: chapter.age ?? "",
      scrollTitleens,
      thumb,
    };
  });

  return {
    chapters: chaptersList,
    scrolls,
    scrollEmakis,
    heroThumb: thumbMap["genjimonogatari-emaki-tokugawa"] ?? null,
  };
}

/** Single chapter props for /genji/[slug]. */
export function getGenjiChapterByPath(slug) {
  const hub = buildGenjiHubData();
  const chapter = hub.chapters.find((c) => c.path === slug);
  if (!chapter) return null;
  const relatedScrolls = hub.scrollEmakis.filter((emaki) =>
    scrollHasGenjiChapter(emaki, chapter.path)
  );
  return { chapter, relatedScrolls, hub };
}
