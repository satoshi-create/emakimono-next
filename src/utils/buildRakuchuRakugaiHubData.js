import emakisMetadata from "@/data/scroll-metadata";
import { RAKUCHU_RAKUGAI_CLUSTER_TITLEEN } from "@/libs/constants/discoveryLinks";
import { isWithdrawnScroll } from "@/libs/constants/withdrawnScrolls";
import { removeNestedEmakisObj } from "@/utils/func";

const TITLEEN_SET = new Set(RAKUCHU_RAKUGAI_CLUSTER_TITLEEN);

/** Scroll belongs to the rakuchu / rakugai discovery cluster. */
export function isRakuchuRakugaiClusterScroll(emaki) {
  return TITLEEN_SET.has(emaki?.titleen);
}

/**
 * Hub data for /rakuchu-rakugai/chapters.
 * Order follows RAKUCHU_RAKUGAI_CLUSTER_TITLEEN (stable curation).
 */
export function buildRakuchuRakugaiHubData() {
  const byTitleen = new Map(
    emakisMetadata
      .filter(
        (emaki) =>
          isRakuchuRakugaiClusterScroll(emaki) &&
          !isWithdrawnScroll(emaki.titleen)
      )
      .map((emaki) => [emaki.titleen, removeNestedEmakisObj(emaki)])
  );

  const scrolls = RAKUCHU_RAKUGAI_CLUSTER_TITLEEN.map((titleen) =>
    byTitleen.get(titleen)
  )
    .filter(Boolean)
    .map((emaki) => ({
      titleen: emaki.titleen,
      title: emaki.title,
      thumb: emaki.thumb ?? null,
      era: emaki.era ?? null,
      eraen: emaki.eraen ?? null,
      author: emaki.author ?? null,
      authoren: emaki.authoren ?? null,
      desc: emaki.desc ?? null,
      descen: emaki.descen ?? null,
      edition: emaki.edition ?? null,
    }));

  const hero =
    scrolls.find((s) => s.titleen === "rakuchu_rakugai_funaki") ??
    scrolls[0] ??
    null;

  return {
    scrolls,
    heroThumb: hero?.thumb ?? null,
  };
}