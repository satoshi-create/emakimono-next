/**
 * 屏風モード: スポット選択・目次行・表示用メタの算出。
 */
import { useMemo } from "react";
import { isByobuScroll } from "@/utils/isByobuScroll";
import { getMasterByRawSpotId } from "@/data/rakuchu-rakugai/rakuchuMotifMaster";
import { buildCloudinaryUrl } from "@/utils/cloudinaryUrl";

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
    ? activeByobuSpotEntry?.spot ?? null
    : null;

  const effectiveSpot = isByobuSpotMode ? activeByobuSpot : selectedSpot;

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
      let desc = spot.description || spot.summary || "";
      if (!desc && master) {
        desc = isEn
          ? master.summaryEn || master.summaryJa
          : master.summaryJa;
      }
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
    let spotBody = spot.description || spot.summary || "";
    if (!spotBody && rakuchuSpotMaster) {
      spotBody = isEn
        ? rakuchuSpotMaster.summaryEn || rakuchuSpotMaster.summaryJa
        : rakuchuSpotMaster.summaryJa;
    }
    const rawCategory = rakuchuSpotMaster?.category || null;
    const categoryLabel = rawCategory
      ? locale === "en"
        ? rawCategory
        : BYOBU_CATEGORY_JA[rawCategory] || rawCategory
      : null;
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
  };
}