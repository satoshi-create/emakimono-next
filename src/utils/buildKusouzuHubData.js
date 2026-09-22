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

/** Map ekotoba `chapter` labels (numeric or JP/EN title) → stage_en ("0"–"9"). */
const STAGE_LABEL_TO_EN = (() => {
  const map = {};
  chapters.forEach((c) => {
    map[String(c.stage_en)] = String(c.stage_en);
    if (c.title) map[c.title] = String(c.stage_en);
    if (c.titleen) map[c.titleen] = String(c.stage_en);
  });
  return map;
})();

function normalizeStageKey(chapterValue) {
  const raw = String(chapterValue ?? "").trim();
  if (!raw) return null;
  return STAGE_LABEL_TO_EN[raw] ?? null;
}

/**
 * Viewer scene index (linkId) of a kusōzu stage inside one scroll.
 * Prefer the painting panel (`cat: "image"`) that follows the stage's 詞書,
 * so CTA landings match scene_likes keyed by image linkId.
 * Returns null when the stage is absent (欠相).
 */
export function kusouzuStageSceneHash(scroll, stageEn) {
  const key = stageEn == null ? null : String(stageEn);
  if (!key || !Array.isArray(scroll?.emakis)) return null;

  const scenes = scroll.emakis;

  for (let i = 0; i < scenes.length; i += 1) {
    const scene = scenes[i];
    if (scene.cat !== "ekotoba") continue;
    if (normalizeStageKey(scene.chapter) !== key) continue;

    for (let j = i + 1; j < scenes.length; j += 1) {
      if (scenes[j].cat === "image") return j;
      if (scenes[j].cat === "ekotoba") break;
    }
    return i;
  }

  let currentStage = null;
  for (let i = 0; i < scenes.length; i += 1) {
    const scene = scenes[i];
    if (scene.cat === "ekotoba") {
      currentStage = normalizeStageKey(scene.chapter);
      continue;
    }
    if (scene.cat === "image" && currentStage === key) return i;
  }

  return null;
}

/** Deep link to the painting panel of `stageEn` in `scroll` (null if 欠相). */
export function kusouzuStageHref(scroll, stageEn) {
  if (!scroll?.titleen) return null;
  const hash = kusouzuStageSceneHash(scroll, stageEn);
  return hash == null ? null : `/${scroll.titleen}#${hash}`;
}

/**
 * Hub data for /kusouzu/chapters-kusouzu — stages, scroll columns, and mappings.
 * Keys scrolls by titleen (stable across locales).
 */
export function buildKusouzuHubData() {
  const scrollEmakis = emakisMetadata
    .filter((emaki) => isKusouzuScroll(emaki) && !isWithdrawnScroll(emaki.titleen))
    .map((emaki) => removeNestedEmakisObj(emaki));

  const thumbMap = {};
  emakisMetadata.forEach((emaki) => {
    if (emaki.thumb) thumbMap[emaki.titleen] = emaki.thumb;
  });

  const rawScrollByTitleen = {};
  emakisMetadata
    .filter((emaki) => isKusouzuScroll(emaki) && !isWithdrawnScroll(emaki.titleen))
    .forEach((emaki) => {
      rawScrollByTitleen[emaki.titleen] = emaki;
    });

  const scrolls = scrollEmakis.map((emaki) => ({
    titleen: emaki.titleen,
    title: emaki.title,
    stageIds: emaki.kusouzuslug.map((s) => s.id),
  }));

  const stages = chapters.map((chapter) => {
    const editions = scrolls
      .map((scroll) => {
        const href = kusouzuStageHref(
          rawScrollByTitleen[scroll.titleen],
          chapter.stage_en
        );
        if (!href) return null;
        return {
          titleen: scroll.titleen,
          title: scroll.title,
          href,
        };
      })
      .filter(Boolean);

    const scrollTitleens = editions.map((e) => e.titleen);

    const thumb =
      scrollTitleens
        .map((t) => thumbMap[t])
        .find(Boolean) ?? null;

    return {
      slug: chapter.slug,
      stage_en: chapter.stage_en,
      stage_ch: chapter.stage_ch,
      title: chapter.title,
      titleen: chapter.titleen,
      ruby: chapter.ruby,
      desc: chapter.desc ?? null,
      descen: chapter.descen ?? null,
      gendaibun: chapter.gendaibun ?? null,
      scrollTitleens,
      editions,
      thumb,
      thumbCloudinary: chapter.thumbCloudinary ?? null,
    };
  });

  return {
    stages,
    scrolls,
    scrollEmakis,
    heroThumb: thumbMap["kusouzumaki"] ?? null,
    heroCloudinary: "v1774936234/emakimono/kuso-zu-emaki__kuso-zu-emaki_1_01_01.jpg",
  };
}
