import emakisMetadata from "@/data/image-metadata-cache/image-metadata-cache.json";
import { HYAKKI_CLUSTER_TITLEEN } from "@/libs/constants/discoveryLinks";
import { isWithdrawnScroll } from "@/libs/constants/withdrawnScrolls";
import { removeNestedEmakisObj } from "@/utils/func";

const TITLEEN_SET = new Set(HYAKKI_CLUSTER_TITLEEN);

/** Scroll belongs to the hyakki / tsukumogami discovery cluster. */
export function isHyakkiClusterScroll(emaki) {
  return TITLEEN_SET.has(emaki?.titleen);
}

/**
 * Hub data for /hyakki/chapters.
 * Order follows HYAKKI_CLUSTER_TITLEEN (stable curation).
 */
export function buildHyakkiHubData() {
  const byTitleen = new Map(
    emakisMetadata
      .filter(
        (emaki) =>
          isHyakkiClusterScroll(emaki) && !isWithdrawnScroll(emaki.titleen)
      )
      .map((emaki) => [emaki.titleen, removeNestedEmakisObj(emaki)])
  );

  const scrolls = HYAKKI_CLUSTER_TITLEEN.map((titleen) => byTitleen.get(titleen))
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
    scrolls.find((s) => s.titleen === "hyakki_utokyo") ?? scrolls[0] ?? null;

  return {
    scrolls,
    heroThumb: hero?.thumb ?? null,
  };
}
