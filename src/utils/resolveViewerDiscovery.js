import {
  DISCOVERY_SPOTLIGHT_GROUPS,
  HYAKKI_CLUSTER_TITLEEN,
} from "@/libs/constants/discoveryLinks";
import {
  CHOUJU_GIGA_HUB_PATH,
  HOME_LATEST_SCROLLS,
  HYAKKI_HUB_PATH,
  KUSOUZU_HUB_PATH,
} from "@/libs/constants/links";
import { isChojuGigaScroll } from "@/utils/buildChojuGigaHubData";
import { isHyakkiClusterScroll } from "@/utils/buildHyakkiHubData";
import { isKusouzuScroll } from "@/utils/buildKusouzuHubData";

const CHOJU_TITLEENS = [
  "Chōjū-jinbutsu-giga_first",
  "Chōjū-jinbutsu-giga_second",
  "Chōjū-jinbutsu-giga_third",
  "Chōjū-jinbutsu-giga_fourth",
];

/**
 * ビューア横レール用の「次に見る」プラン。
 * 累計ランキングではなくクラスター／最新を優先する。
 */
export function resolveViewerDiscoveryPlan(emaki) {
  const current = emaki?.titleen;
  if (!current) {
    return {
      titleKey: "discovery.railTitle",
      ctaHref: "/type/emaki",
      ctaKey: "discovery.ctaGallery",
      titleens: HOME_LATEST_SCROLLS.map((s) => s.titleen).slice(0, 5),
    };
  }

  if (isHyakkiClusterScroll(emaki)) {
    return {
      titleKey: "discovery.groupYokai",
      ctaHref: HYAKKI_HUB_PATH,
      ctaKey: "discovery.ctaHyakkiHub",
      titleens: HYAKKI_CLUSTER_TITLEEN.filter((t) => t !== current),
    };
  }

  if (isChojuGigaScroll(emaki)) {
    return {
      titleKey: "discovery.groupChoju",
      ctaHref: CHOUJU_GIGA_HUB_PATH,
      ctaKey: "discovery.ctaChojuHub",
      titleens: CHOJU_TITLEENS.filter((t) => t !== current),
    };
  }

  if (isKusouzuScroll(emaki)) {
    const group = DISCOVERY_SPOTLIGHT_GROUPS.find((g) => g.id === "rokudo");
    return {
      titleKey: group.titleKey,
      ctaHref: KUSOUZU_HUB_PATH,
      ctaKey: "discovery.ctaKusouzuHub",
      titleens: (group?.titleens || []).filter((t) => t !== current),
    };
  }

  const matched = DISCOVERY_SPOTLIGHT_GROUPS.find((g) =>
    g.titleens.includes(current)
  );
  if (matched) {
    return {
      titleKey: matched.titleKey,
      ctaHref: matched.ctaHref,
      ctaKey: matched.ctaKey,
      titleens: matched.titleens.filter((t) => t !== current),
    };
  }

  const latest = HOME_LATEST_SCROLLS.map((s) => s.titleen).filter(
    (t) => t !== current
  );
  return {
    titleKey: "discovery.railTitle",
    ctaHref: "/type/emaki",
    ctaKey: "discovery.ctaGallery",
    titleens: latest.slice(0, 5),
  };
}

/** プランの titleens に最新枠を足して上限まで埋める（重複除外） */
export function expandDiscoveryTitleens(planTitleens, currentTitleen, limit = 6) {
  const seen = new Set([currentTitleen, ...(planTitleens || [])]);
  const out = [...(planTitleens || [])];
  for (const { titleen } of HOME_LATEST_SCROLLS) {
    if (out.length >= limit) break;
    if (seen.has(titleen)) continue;
    seen.add(titleen);
    out.push(titleen);
  }
  return out.slice(0, limit);
}
