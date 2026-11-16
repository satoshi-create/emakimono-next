/**
 * 屏風モード: スポット選択・目次行・表示用メタの算出。
 */
import { useMemo } from "react";
import { isByobuScroll } from "@/utils/isByobuScroll";
import {
  SCROLL_EDITIONS,
  SCROLL_PILL_LABELS,
} from "@/components/rakuchu-rakugai/rakuchuScrollConstants";
import { getMotifVisual, wingSceneHref } from "@/components/rakuchu-rakugai/wingLinks";
import {
  getMasterByRawSpotId,
  isCrossLinkableMaster,
} from "@/data/rakuchu-rakugai/rakuchuMotifMaster";
import { RAKUCHU_RAKUGAI_HUB_PATH } from "@/libs/constants/links";
import { buildRakuchuRakugaiHubData } from "@/utils/buildRakuchuRakugaiHubData";
import { buildCloudinaryUrl } from "@/utils/cloudinaryUrl";

/** @type {Record<string, Record<string, unknown>> | null} */
let rakuchuHubMotifVisualsCache = null;

function getRakuchuHubMotifVisuals() {
  if (!rakuchuHubMotifVisualsCache) {
    rakuchuHubMotifVisualsCache =
      buildRakuchuRakugaiHubData().motifVisuals ?? null;
  }
  return rakuchuHubMotifVisualsCache;
}

/**
 * @param {(typeof import("@/data/rakuchu-rakugai/rakuchuMotifMaster").RAKUCHU_SPOT_MASTERS)[number]} master
 * @param {ReturnType<typeof getMotifVisual> | null | undefined} visual
 * @returns {boolean}
 */
function isOneToOneMotifVisual(master, visual) {
  if (!visual?.image) return false;
  const hasTarget =
    (typeof visual.spotId === "string" && visual.spotId.length > 0) ||
    visual.scene != null;
  if (!hasTarget) return false;
  if (visual.spotId) {
    const linked = getMasterByRawSpotId(visual.spotId);
    return linked?.masterId === master.masterId;
  }
  return true;
}

/**
 * @param {string | undefined} spotId
 * @param {string | undefined} currentTitleen
 * @param {string} locale
 * @returns {{ crossEditionLinks: { key: string, label: string, href: string }[], hubComparisonLink: { label: string, href: string } | null }}
 */
export function resolveByobuSpotLinkChips(spotId, currentTitleen, locale) {
  if (
    !spotId ||
    typeof currentTitleen !== "string" ||
    !currentTitleen.startsWith("rakuchu_rakugai")
  ) {
    return { crossEditionLinks: [], hubComparisonLink: null };
  }
  const master = getMasterByRawSpotId(spotId);
  if (
    !master ||
    !isCrossLinkableMaster(master) ||
    !master.presentIn?.includes(currentTitleen)
  ) {
    return { crossEditionLinks: [], hubComparisonLink: null };
  }
  const isEn = locale === "en";
  const motifVisuals = getRakuchuHubMotifVisuals();
  const pillLabels = isEn ? SCROLL_PILL_LABELS.en : SCROLL_PILL_LABELS.ja;
  const currentVisual = getMotifVisual(
    motifVisuals,
    master.masterId,
    currentTitleen
  );
  if (!isOneToOneMotifVisual(master, currentVisual)) {
    return { crossEditionLinks: [], hubComparisonLink: null };
  }
  /** @type {{ key: string, label: string, href: string }[]} */
  const crossEditionLinks = [];
  for (const edition of SCROLL_EDITIONS) {
    if (
      edition.titleen === currentTitleen ||
      !master.presentIn?.includes(edition.titleen)
    ) {
      continue;
    }
    const visual = getMotifVisual(motifVisuals, master.masterId, edition.titleen);
    if (!isOneToOneMotifVisual(master, visual)) continue;
    const href = wingSceneHref({ titleen: edition.titleen }, visual);
    if (!href) continue;
    const pillIdx = SCROLL_EDITIONS.findIndex((e) => e.titleen === edition.titleen);
    const label =
      pillIdx >= 0
        ? pillLabels[pillIdx]
        : isEn
          ? edition.labelEn
          : edition.labelJa;
    crossEditionLinks.push({
      key: edition.titleen,
      label: String(label || edition.titleen),
      href,
    });
  }
  const comparableEditions = (master.presentIn ?? []).filter((titleen) =>
    isOneToOneMotifVisual(
      master,
      getMotifVisual(motifVisuals, master.masterId, titleen)
    )
  );
  const hubComparisonLink =
    crossEditionLinks.length > 0 || comparableEditions.length >= 2
      ? {
          label: isEn ? "Compare 3 editions ↗" : "3伝本比較 ↗",
          href: `${RAKUCHU_RAKUGAI_HUB_PATH}#motif-${master.masterId}`,
        }
      : null;
  return { crossEditionLinks, hubComparisonLink };
}

export const BYOBU_CATEGORY_JA = {
  power: "権力・城郭",
  temple: "寺社",
  town: "町並み・祭礼・河川",
  court: "公家・御所",
};

const stripHtml = (html) =>
  (html || "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .trim();

/**
 * ① 作品 JSON 固有フィールド → ② rakuchuMotifMaster
 * @param {Record<string, unknown> | null | undefined} spot
 * @param {(typeof import("@/data/rakuchu-rakugai/rakuchuMotifMaster").RAKUCHU_SPOT_MASTERS)[number] | null | undefined} master
 * @param {boolean} isEn
 */
function resolveByobuSpotCategoryLabel(spot, master, isEn) {
  if (!spot) return null;
  const fromSpot = isEn
    ? spot.categoryen || spot.category
    : spot.category || spot.categoryen;
  if (fromSpot) return String(fromSpot);
  const rawCategory = master?.category || null;
  if (!rawCategory) return null;
  return isEn
    ? rawCategory
    : BYOBU_CATEGORY_JA[rawCategory] || rawCategory;
}

/**
 * @param {Record<string, unknown> | null | undefined} spot
 * @param {(typeof import("@/data/rakuchu-rakugai/rakuchuMotifMaster").RAKUCHU_SPOT_MASTERS)[number] | null | undefined} master
 * @param {boolean} isEn
 */
function resolveByobuSpotSummary(spot, master, isEn) {
  if (!spot) return "";
  const fromSpot = isEn
    ? spot.summaryen ||
      spot.descriptionen ||
      spot.summary ||
      spot.description
    : spot.summary ||
      spot.description ||
      spot.summaryen ||
      spot.descriptionen;
  if (fromSpot) return String(fromSpot);
  if (master) {
    return isEn
      ? master.summaryEn || master.summaryJa || ""
      : master.summaryJa || master.summaryEn || "";
  }
  return "";
}

/**
 * @param {object} opts
 */
export function useByobuSpotCommentary({
  data,
  allSpots,
  selectedSpot,
  navIndex,
  viewMode,
  locale,
  titleen,
  onSelectSpot,
  setViewMode,
  setIsFolkloreOpen,
}) {
  // 1. 屏風スポットモード判定
  const isByobuSpotMode =
    isByobuScroll(data) && Array.isArray(allSpots) && allSpots.length > 0;

  // 2. 選択中スポットエントリの解決
  const activeByobuSpotEntry = useMemo(() => {
    if (!isByobuSpotMode || !selectedSpot) return null;
    const hit = allSpots.find(
      (row) =>
        row.spot?.id && String(row.spot.id) === String(selectedSpot.id)
    );
    if (hit) return hit;
    return {
      spot: selectedSpot,
      linkId: navIndex,
      sliceIndex: navIndex,
      spotGlobalIndex: 0,
    };
  }, [isByobuSpotMode, allSpots, selectedSpot, navIndex]);

  const activeByobuSpot = isByobuSpotMode
    ? activeByobuSpotEntry?.spot ?? selectedSpot ?? null
    : null;

  const effectiveSpot = isByobuSpotMode
    ? activeByobuSpot ?? selectedSpot
    : selectedSpot;

  // 3. スポット目次行（viewMode=index 時のみ生成）
  const spotIndexRows = useMemo(() => {
    if (!isByobuSpotMode || viewMode !== "index") return [];
    const isEn = locale === "en";
    return allSpots.map((row) => {
      const spot = row.spot;
      const rowTitle = isEn ? spot.nameen || spot.name : spot.name;
      const master =
        typeof titleen === "string" && titleen.startsWith("rakuchu_rakugai")
          ? getMasterByRawSpotId(spot.id)
          : null;
      const desc = resolveByobuSpotSummary(spot, master, isEn);
      return {
        linkId: row.linkId,
        title: rowTitle,
        desc: stripHtml(String(desc || "")),
        thumb: row.sliceSrc
          ? buildCloudinaryUrl(row.sliceSrc, [
              "w_160",
              "f_auto",
              "q_auto:good",
            ])
          : null,
      };
    });
  }, [viewMode, isByobuSpotMode, allSpots, locale, titleen]);

  const spotActiveIndex = useMemo(() => {
    if (!isByobuSpotMode || !effectiveSpot?.id) return 0;
    const i = allSpots.findIndex(
      (row) =>
        row.spot?.id && String(row.spot.id) === String(effectiveSpot.id)
    );
    return i >= 0 ? i : 0;
  }, [isByobuSpotMode, allSpots, effectiveSpot?.id]);

  // 4. マスタ連携（カテゴリ・本文フォールバック）
  const rakuchuSpotMaster = useMemo(() => {
    const spot = effectiveSpot;
    if (!spot) return null;
    if (typeof titleen !== "string" || !titleen.startsWith("rakuchu_rakugai")) {
      return null;
    }
    return getMasterByRawSpotId(spot.id) || null;
  }, [effectiveSpot, titleen]);

  const spotDisplay = useMemo(() => {
    const spot = effectiveSpot;
    if (!spot) return null;
    const isEn = locale === "en";
    const spotTitle = isEn ? spot.nameen || spot.name : spot.name;
    const spotBody = resolveByobuSpotSummary(spot, rakuchuSpotMaster, isEn);
    const categoryLabel = resolveByobuSpotCategoryLabel(
      spot,
      rakuchuSpotMaster,
      isEn
    );
    return {
      spotTitle,
      spotBody: stripHtml(String(spotBody || "")),
      categoryLabel,
    };
  }, [effectiveSpot, rakuchuSpotMaster, locale, titleen]);

  const resolveSpotTitle = (row) => {
    const spot = row?.spot;
    if (!spot) return "";
    const isEn = locale === "en";
    return isEn ? spot.nameen || spot.name : spot.name;
  };

  const prevSpot = useMemo(() => {
    if (!isByobuSpotMode || spotActiveIndex <= 0) return null;
    const index = spotActiveIndex - 1;
    const row = allSpots[index];
    if (!row?.spot) return null;
    return { index, title: resolveSpotTitle(row) };
  }, [isByobuSpotMode, spotActiveIndex, allSpots, locale]);

  const nextSpot = useMemo(() => {
    if (!isByobuSpotMode || spotActiveIndex >= allSpots.length - 1) {
      return null;
    }
    const index = spotActiveIndex + 1;
    const row = allSpots[index];
    if (!row?.spot) return null;
    return { index, title: resolveSpotTitle(row) };
  }, [isByobuSpotMode, spotActiveIndex, allSpots, locale]);

  // 5. スポット間ナビゲーション
  const handleNavigateSpot = (spotIdx) => {
    const entry = allSpots[spotIdx];
    if (!entry?.spot) return;
    onSelectSpot?.(entry.spot);
    setViewMode("commentary");
    setIsFolkloreOpen?.(false);
  };

  const byobuChapterTitle = (allSpotsCount) => {
    if (!isByobuSpotMode) return null;
    if (activeByobuSpot && spotDisplay?.spotTitle) {
      return spotDisplay.spotTitle;
    }
    return locale === "en"
      ? `Highlights Guide (${allSpotsCount} Spots)`
      : `見どころガイド（全${allSpotsCount}箇所）`;
  };

  const { crossEditionLinks, hubComparisonLink } = useMemo(
    () =>
      resolveByobuSpotLinkChips(
        effectiveSpot?.id,
        data?.titleen || titleen,
        locale
      ),
    [effectiveSpot?.id, data?.titleen, titleen, locale]
  );

  return {
    isByobuSpotMode,
    activeByobuSpotEntry,
    activeByobuSpot,
    effectiveSpot,
    spotIndexRows,
    spotActiveIndex,
    rakuchuSpotMaster,
    spotDisplay,
    prevSpot,
    nextSpot,
    handleNavigateSpot,
    byobuChapterTitle,
    crossEditionLinks,
    hubComparisonLink,
  };
}