import chapters from "@/data/emaki-text-data/chapters-of-kusouzu.json";
import emakisMetadata from "@/data/image-metadata-cache/image-metadata-cache.json";
import { isWithdrawnScroll } from "@/libs/constants/withdrawnScrolls";
import { removeNestedEmakisObj } from "@/utils/func";

/** Scroll has at least one kusouzu stage mapping in metadata. */
export function isKusouzuScroll(emaki) {
  return Array.isArray(emaki.kusouzuslug) && emaki.kusouzuslug.length > 0;
}

/** Same rule as kusouzu/[slug].js — match by stage_en id on kusouzuslug. */
export function scrollHasKusouzuStage(scroll, stageEn) {
  return scroll.kusouzuslug?.some((s) => s.id === stageEn) ?? false;
}

/**
 * Hub data for /kusouzu/chapters-kusouzu — stages, scroll columns, and mappings.
 * Keys scrolls by titleen (stable across locales).
 */
export function buildKusouzuHubData() {
  const scrollEmakis = emakisMetadata
    .filter((emaki) => isKusouzuScroll(emaki) && !isWithdrawnScroll(emaki.titleen))
    .map((emaki) => removeNestedEmakisObj(emaki));

  const scrolls = scrollEmakis.map((emaki) => ({
    titleen: emaki.titleen,
    title: emaki.title,
    stageIds: emaki.kusouzuslug.map((s) => s.id),
  }));

  const stages = chapters.map((chapter) => ({
    slug: chapter.slug,
    stage_en: chapter.stage_en,
    stage_ch: chapter.stage_ch,
    title: chapter.title,
    titleen: chapter.titleen,
    ruby: chapter.ruby,
    desc: chapter.desc ?? null,
    descen: chapter.descen ?? null,
    gendaibun: chapter.gendaibun ?? null,
    scrollTitleens: scrolls
      .filter((scroll) => scroll.stageIds.includes(chapter.stage_en))
      .map((scroll) => scroll.titleen),
  }));

  return { stages, scrolls, scrollEmakis };
}
