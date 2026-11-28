// 1. スポット深リンク解決の純粋関数
// 鑑賞者向け通し番号・?scene= 逆引き・?spot= ランディング座標を URL とデータから決定する。

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getFolkloreItemById } from "@/data/folklore/folkloreIndex";
import { isSpotGuideScroll } from "@/utils/isByobuScroll";
import { buildPanoramaSpots } from "@/hooks/emaki/usePanoramaSpots";
import { scrollPositionStore } from "@/hooks/emaki/scrollPositionStore";

/** 鑑賞者向け通し番号（1始まり）の算出: 詞書ありは段数(activeIndex+1)、詞書なしはスライス通し番号 */
export function getVisitorSceneNumber(emakis, navIndex) {
  if (!Array.isArray(emakis) || emakis.length === 0) return 1;
  const ekotobas = emakis.filter((item) => item.cat === "ekotoba");
  if (ekotobas.length > 0) {
    let segment = 0;
    ekotobas.forEach((item, i) => {
      if (item.linkId <= navIndex) segment = i;
    });
    return segment + 1;
  }
  const n = Number(navIndex);
  return Number.isFinite(n) && n >= 0 ? n + 1 : 1;
}

// ?scene=N 入場時にジャンプすべき linkId の逆引き
export function getLinkIdForVisitorScene(emakis, sceneNum) {
  if (!Array.isArray(emakis) || emakis.length === 0) return 0;
  const n = Math.max(1, Math.floor(Number(sceneNum) || 1));
  const ekotobas = emakis.filter((item) => item.cat === "ekotoba");
  if (ekotobas.length > 0) {
    const idx = Math.min(n - 1, ekotobas.length - 1);
    return ekotobas[idx].linkId;
  }
  return n - 1;
}

/**
 * パノラマ全体座標（x: 0〜100, y: 0〜100）を各扇スライス（cat === "image"）のローカル座標へ変換する。
 * 屏風・絵巻は右端（sliceIndex = 0）から左端（sliceIndex = N - 1）へ並ぶ前提。
 */
export function resolvePanoramaCoordToSlice(
  emakis,
  panoramaX,
  panoramaY,
  readingDirection = "rtl",
) {
  const imageSlices = (Array.isArray(emakis) ? emakis : []).filter(
    (item) => item && item.cat === "image",
  );
  if (imageSlices.length === 0 || !Number.isFinite(panoramaX) || !Number.isFinite(panoramaY)) {
    return null;
  }

  // 各スライスの幅比率を srcWidth ベース（未指定時は均等 1）で算出
  const widths = imageSlices.map((s) =>
    Number.isFinite(Number(s.srcWidth)) && Number(s.srcWidth) > 0 ? Number(s.srcWidth) : 1,
  );
  const totalWidth = widths.reduce((sum, w) => sum + w, 0);

  const isLtr = readingDirection === "ltr";
  const clampedX = Math.max(0, Math.min(100, panoramaX));

  let accPercent = 0;
  let targetSliceIndex = imageSlices.length - 1;
  let localX = 50;

  for (let i = 0; i < imageSlices.length; i += 1) {
    const sliceSpanPercent = (widths[i] / totalWidth) * 100;
    const nextAcc = accPercent + sliceSpanPercent;
  if (isLtr) {
      if (clampedX < nextAcc || i === imageSlices.length - 1) {
        targetSliceIndex = i;
        const offsetFromSliceLeft = clampedX - accPercent;
        const ratioFromLeft =
          sliceSpanPercent > 0 ? offsetFromSliceLeft / sliceSpanPercent : 0.5;
        localX = Math.max(0, Math.min(100, Math.round(ratioFromLeft * 1000) / 10));
        break;
      }
    } else if (100 - clampedX <= nextAcc || i === imageSlices.length - 1) {
      targetSliceIndex = i;
      const distFromRight = 100 - clampedX;
      const offsetFromSliceRight = distFromRight - accPercent;
      const ratioFromRight =
        sliceSpanPercent > 0 ? offsetFromSliceRight / sliceSpanPercent : 0.5;
      localX = Math.max(0, Math.min(100, Math.round((1 - ratioFromRight) * 1000) / 10));
      break;
    }
    accPercent = nextAcc;
  }

  const targetSliceObj = imageSlices[targetSliceIndex];
  const fullIndex = emakis.indexOf(targetSliceObj);
  const resolvedIndex = fullIndex >= 0 ? fullIndex : targetSliceIndex;
  const linkId = `scene-${resolvedIndex}`;

  return {
    sliceIndex: resolvedIndex,
    linkId,
    centerX: localX,
    centerY: Math.max(0, Math.min(100, Math.round(panoramaY * 10) / 10)),
  };
}

function scrollOffsetPercentFromCenterX(centerX, readingDirection = "rtl") {
  const cx = Number(centerX);
  if (!Number.isFinite(cx)) return 50;
  if (readingDirection === "ltr") {
    return Math.min(100, Math.max(0, Math.round(cx * 10) / 10));
  }
  // handleToId: 0=スライス右端, 100=左端（ピッカー仕様）。スポット x% はスライス左上原点。
  return Math.min(100, Math.max(0, Math.round((100 - cx) * 10) / 10));
}

export function resolveSpotDeepLink(emakisOrData, querySpot) {
  const spotId = String(
    Array.isArray(querySpot) ? querySpot[0] : querySpot ?? ""
  ).trim();

  let emakis;
  let topLevelSpots;
  if (
    emakisOrData &&
    typeof emakisOrData === "object" &&
    !Array.isArray(emakisOrData) &&
    Array.isArray(emakisOrData.emakis)
  ) {
    emakis = emakisOrData.emakis;
    topLevelSpots = emakisOrData.spots;
  } else if (Array.isArray(emakisOrData)) {
    emakis = emakisOrData;
  } else {
    return null;
  }

  if (!spotId || !Array.isArray(emakis)) return null;

  const readingDirection =
    !Array.isArray(emakisOrData) && emakisOrData?.readingDirection === "ltr"
      ? "ltr"
      : "rtl";

  // 1. スライス内 spots（ローカル座標）が存在する場合は最優先で採用
  for (let sliceIndex = 0; sliceIndex < emakis.length; sliceIndex += 1) {
    const slice = emakis[sliceIndex];
    if (slice?.cat !== "image") continue;
    const spots = slice.spots;
    if (!Array.isArray(spots)) continue;
    const spot = spots.find((s) => s?.id === spotId);
    if (!spot) continue;
    const linkId =
      typeof slice.linkId === "number" ? slice.linkId : sliceIndex;
    let centerX = Number(spot.x);
    let centerY = Number(spot.y);
    let rectW = null;
    let rectH = null;
    const rect = spot.rect;
    if (
      rect &&
      typeof rect === "object" &&
      typeof rect.x === "number" &&
      typeof rect.w === "number"
    ) {
      centerX = rect.x + rect.w / 2;
      rectW = rect.w;
      if (typeof rect.y === "number" && typeof rect.h === "number") {
        centerY = rect.y + rect.h / 2;
        rectH = rect.h;
      }
    } else if (!Number.isFinite(centerX)) {
      centerX = 50;
    }
    if (!Number.isFinite(centerY)) {
      centerY = 50;
    }
    const offsetPercent = scrollOffsetPercentFromCenterX(
      centerX,
      readingDirection,
    );
    let targetScale = 2.6;
    if (rectW != null && rectH != null) {
      targetScale = Math.min(
        80 / Math.max(rectW, 12),
        80 / Math.max(rectH, 12)
      );
      targetScale = Math.min(4.6, Math.max(2.2, targetScale));
    }
    return {
      linkId,
      sliceIndex,
      offsetPercent,
      centerX,
      centerY,
      rectW,
      rectH,
      targetScale,
    };
  }

  // 2. トップレベル spots（パノラマ座標）からの解決
  if (Array.isArray(topLevelSpots)) {
    const topSpot = topLevelSpots.find((s) => s?.id === spotId);
    if (topSpot) {
      // panel-inscription-{n} の場合はパノラマ x 逆算のズレを避け、n 番目の画像スライスを直接取得
      const panelMatch = /^panel-inscription-(\d+)$/.exec(spotId);
      if (panelMatch) {
        const panelNum = Number(panelMatch[1]);
        const imageSlices = emakis.filter((item) => item?.cat === "image");
        const targetSliceObj =
          imageSlices[Math.max(0, Math.min(panelNum - 1, imageSlices.length - 1))];
        if (targetSliceObj) {
          const fullIndex = emakis.indexOf(targetSliceObj);
          const linkId =
            typeof targetSliceObj.linkId === "number"
              ? targetSliceObj.linkId
              : fullIndex;
          const centerX = 50;
          const centerY = Number.isFinite(Number(topSpot.y))
            ? Number(topSpot.y)
            : 22;
          return {
            linkId,
            sliceIndex: fullIndex,
            offsetPercent: scrollOffsetPercentFromCenterX(
              centerX,
              readingDirection,
            ),
            centerX,
            centerY,
            rectW: null,
            rectH: null,
            targetScale: 2.6,
          };
        }
      }

      const resolved = resolvePanoramaCoordToSlice(
        emakis,
        Number(topSpot.x),
        Number(topSpot.y),
        readingDirection,
      );
      if (resolved) {
        const match = /^scene-(\d+)$/.exec(String(resolved.linkId));
        const fullIndex = match ? Number(match[1]) : resolved.sliceIndex;
        const slice = emakis[fullIndex];
        const linkId =
          typeof slice?.linkId === "number" ? slice.linkId : fullIndex;
        const topRectW = Number(topSpot?.rect?.w);
        const topRectH = Number(topSpot?.rect?.h);
        return {
          linkId,
          sliceIndex: fullIndex,
          offsetPercent: scrollOffsetPercentFromCenterX(
            resolved.centerX,
            readingDirection,
          ),
          centerX: resolved.centerX,
          centerY: resolved.centerY,
          rectW: Number.isFinite(topRectW) && topRectW > 0 ? topRectW : null,
          rectH: Number.isFinite(topRectH) && topRectH > 0 ? topRectH : null,
          targetScale: 2.6,
        };
      }
    }
  }
  return null;
}

// 2. スポット選択状態と URL クエリ同期
// selectedSpotId / allSpots / 浅いルーター replace と commentary・ズーム層へのハンドラを提供する。

export default function useEmakiSpotNavigation({
  scroll,
  isReady,
  data,
  query,
  pathname,
  replace,
  handleToId,
  navIndex,
  liveSceneIndex,
  articleRef,
  zoomToSlicePercentRef,
}) {
  const pendingInitialHashRef = useRef(0);
  const [hashFollowEnabled, setHashFollowEnabled] = useState(false);
  const didApplyEntryHashRef = useRef(false);
  const appliedSpotRef = useRef(null);
  const pendingSpotRef = useRef(null);
  const [pendingSpotZoom, setPendingSpotZoom] = useState(null);
  const [selectedSpotId, setSelectedSpotId] = useState(null);

  const selectedSpot = useMemo(() => {
    if (!selectedSpotId) return null;
    if (Array.isArray(data?.spots)) {
      const top = data.spots.find(
        (s) => s?.id && String(s.id) === String(selectedSpotId)
      );
      if (top) return top;
    }
    if (!Array.isArray(data?.emakis)) return null;
    for (let i = 0; i < data.emakis.length; i += 1) {
      const slice = data.emakis[i];
      if (slice?.cat !== "image" || !Array.isArray(slice.spots)) continue;
      const found = slice.spots.find(
        (s) => s?.id && String(s.id) === String(selectedSpotId)
      );
      if (found) return found;
    }
    return null;
  }, [selectedSpotId, data?.emakis]);

  const allSpots = useMemo(() => {
    if (!isSpotGuideScroll(data) || !Array.isArray(data?.emakis)) return [];
    const rows = [];
    let spotGlobalIndex = 0;
    data.emakis.forEach((slice, sliceIndex) => {
      if (slice?.cat !== "image" || !Array.isArray(slice.spots)) return;
      const { linkId } = slice;
      slice.spots.forEach((spot) => {
        if (!spot?.id) return;
        rows.push({
          spot,
          linkId: typeof linkId === "number" ? linkId : sliceIndex,
          sliceIndex,
          spotGlobalIndex,
          sliceSrc: slice.src,
        });
        spotGlobalIndex += 1;
      });
    });
    const seenIds = new Set(rows.map((r) => String(r.spot.id)));
    const { panoramaSpots } = buildPanoramaSpots(data);
    for (const spot of panoramaSpots) {
      if (!spot?.id || seenIds.has(String(spot.id))) continue;
      const resolved = resolvePanoramaCoordToSlice(
        data.emakis,
        Number(spot.x),
        Number(spot.y),
        data?.readingDirection === "ltr" ? "ltr" : "rtl",
      );
      const sliceIndex = resolved?.sliceIndex ?? 0;
      const slice = data.emakis[sliceIndex];
      const linkId =
        typeof slice?.linkId === "number" ? slice.linkId : sliceIndex;
      rows.push({
        spot,
        linkId,
        sliceIndex,
        spotGlobalIndex,
        sliceSrc: slice?.src ?? null,
      });
      spotGlobalIndex += 1;
      seenIds.add(String(spot.id));
    }
    return rows;
  }, [data]);

  const onSelectSpotFromCommentary = useCallback(
    (spot) => {
      if (!spot?.id) return;
      const id = String(spot.id);
      pendingSpotRef.current = id;
      setSelectedSpotId(id);
      const nextQuery = { ...query, spot: id };
      delete nextQuery.scene;
      replace({ pathname, query: nextQuery }, undefined, { shallow: true });
      const landing = resolveSpotDeepLink(data, id);
      if (!landing) return;
      appliedSpotRef.current = id;
      handleToId(landing.linkId, {
        realign: true,
        offsetPercent: landing.offsetPercent,
        behavior: "smooth",
      });
      setPendingSpotZoom({
        centerX: landing.centerX,
        centerY: landing.centerY,
        rectW: landing.rectW,
        rectH: landing.rectH,
        sliceIndex: landing.sliceIndex,
        linkId: landing.linkId,
        offsetPercent: landing.offsetPercent,
      });
    },
    [query, pathname, replace, data?.emakis, handleToId]
  );

  useEffect(() => {
    if (!isReady) return;
    const raw = query?.spot;
    const spotId = raw
      ? String(Array.isArray(raw) ? raw[0] : raw).trim()
      : "";
    const pending = pendingSpotRef.current;
    if (pending !== null) {
      const pendingStr = pending === "" ? "" : String(pending);
      if (spotId !== pendingStr) return;
      pendingSpotRef.current = null;
    }
    if (!spotId) {
      setSelectedSpotId(null);
      return;
    }
    setSelectedSpotId(spotId);
  }, [isReady, query?.spot]);

  const onSelectSpot = useCallback(
    (spot) => {
      if (!spot?.id) return;
      const id = String(spot.id);
      const nextId = id;
      pendingSpotRef.current = nextId;
      setSelectedSpotId(nextId);
      const nextQuery = { ...query, spot: nextId };
      delete nextQuery.scene;
      replace({ pathname, query: nextQuery }, undefined, { shallow: true });
      const landing = resolveSpotDeepLink(data, nextId);
      if (!landing) return;
      appliedSpotRef.current = nextId;
      handleToId(landing.linkId, {
        realign: true,
        offsetPercent: landing.offsetPercent,
        behavior: "auto",
      });
      let targetScale = 2.6;
      if (landing.rectW != null && landing.rectH != null) {
        targetScale = Math.min(
          80 / Math.max(landing.rectW, 4),
          80 / Math.max(landing.rectH, 4)
        );
        targetScale = Math.min(5.5, Math.max(1.2, targetScale));
      }
      zoomToSlicePercentRef.current?.({
        sliceIndex: landing.sliceIndex,
        centerX: landing.centerX,
        centerY: landing.centerY,
        targetScale,
        rectW: landing.rectW,
        rectH: landing.rectH,
        readingDirection: data?.readingDirection,
      });
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("emaki:spot-badge-select", {
            detail: { spotId: nextId },
          })
        );
      }
    },
    [query, pathname, replace, data, handleToId, zoomToSlicePercentRef]
  );

  const onClearSelectedSpot = useCallback(() => {
    pendingSpotRef.current = "";
    setSelectedSpotId(null);
    const nextQuery = { ...query };
    delete nextQuery.spot;
    replace({ pathname, query: nextQuery }, undefined, { shallow: true });
  }, [query, pathname, replace]);

  // 3. 入場時ハッシュ / ?ebiki / ?scene とライブシーンの history 同期
  useEffect(() => {
    if (!scroll) return;
    setHashFollowEnabled(false);
    const ebikiRaw = query?.ebiki;
    if (ebikiRaw) {
      const id = String(Array.isArray(ebikiRaw) ? ebikiRaw[0] : ebikiRaw).trim();
      const found = id ? getFolkloreItemById(id) : null;
      pendingInitialHashRef.current =
        typeof found?.link_id === "number" ? found.link_id : 0;
      return;
    }
    const hash =
      Number(String(window.location.hash || "").replace("#", "")) || 0;
    const hasQueryScene = Boolean(query?.scene);
    const hasQuerySpot = Boolean(query?.spot);
    pendingInitialHashRef.current = hash;
    if (hash <= 0 && !hasQueryScene && !hasQuerySpot) setHashFollowEnabled(true);
  }, [scroll, data.id, query?.ebiki, query?.scene, query?.spot]);

  useEffect(() => {
    if (typeof window === "undefined" || !scroll) return;
    const urlHasSpot =
      Boolean(query?.spot) ||
      new URL(window.location.href).searchParams.has("spot");
    if (selectedSpotId || urlHasSpot) return;
    const pending = pendingInitialHashRef.current;
    if (!hashFollowEnabled) {
      if (pending > 0) {
        const url = new URL(window.location.href);
        url.searchParams.set("scene", String(pending));
        url.hash = "";
        window.history.replaceState(null, "", url.pathname + url.search);
      }
      return;
    }
    if (pending > 0 && liveSceneIndex !== pending && liveSceneIndex === 0) {
      return;
    }
    pendingInitialHashRef.current = 0;
    const currentEmakis = data?.emakis || [];
    const url = new URL(window.location.href);
    const currentSceneNum = getVisitorSceneNumber(currentEmakis, liveSceneIndex);
    url.searchParams.set("scene", String(currentSceneNum));
    url.hash = "";
    window.history.replaceState(null, "", url.pathname + url.search);
  }, [
    liveSceneIndex,
    scroll,
    hashFollowEnabled,
    data?.emakis,
    selectedSpotId,
    query?.spot,
  ]);

  useEffect(() => {
    if (!scroll || hashFollowEnabled) return;
    const el = articleRef?.current;
    if (!el) return;
    let lastLeft = el.scrollLeft;
    const onScroll = () => {
      const left = el.scrollLeft;
      if (
        !scrollPositionStore.isProgrammaticScroll &&
        Math.abs(left - lastLeft) > 1
      ) {
        pendingInitialHashRef.current = 0;
        setHashFollowEnabled(true);
      }
      lastLeft = left;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
    };
  }, [scroll, data.id, articleRef, hashFollowEnabled]);

  useEffect(() => {
    if (!pendingSpotZoom) return undefined;
    const { centerX, centerY, rectW, rectH, sliceIndex, explicitScale } = pendingSpotZoom;
    const zoomTimer = setTimeout(() => {
      if (!zoomToSlicePercentRef.current) {
        setPendingSpotZoom(null);
        return;
      }
      let targetScale =
        typeof explicitScale === "number" && Number.isFinite(explicitScale)
          ? Math.min(5.5, Math.max(1.2, explicitScale))
          : 2.6;
      if (rectW != null && rectH != null) {
        targetScale = Math.min(
          80 / Math.max(rectW, 4),
          80 / Math.max(rectH, 4)
        );
        targetScale = Math.min(5.5, Math.max(1.2, targetScale));
      }
      zoomToSlicePercentRef.current({
        sliceIndex,
        centerX,
        centerY,
        targetScale,
        rectW,
        rectH,
        readingDirection: data?.readingDirection,
      });
      setPendingSpotZoom(null);
    }, 300);
    return () => clearTimeout(zoomTimer);
  }, [pendingSpotZoom, zoomToSlicePercentRef, data?.readingDirection]);

  // 4. 初回 ?spot / ?scene / レガシーハッシュによるジャンプ
  useEffect(() => {
    if (!scroll || !isReady) return;
    if (query?.ebiki) {
      if (!didApplyEntryHashRef.current) didApplyEntryHashRef.current = true;
      return;
    }

    const rawSlice = Array.isArray(query?.slice) ? query.slice[0] : query?.slice;
    const rawCx = Array.isArray(query?.cx) ? query.cx[0] : query?.cx;
    const rawCy = Array.isArray(query?.cy) ? query.cy[0] : query?.cy;
    const rawCz = Array.isArray(query?.cz) ? query.cz[0] : query?.cz;
    if (
      !query?.spot &&
      rawSlice !== undefined &&
      rawCx !== undefined &&
      rawCy !== undefined
    ) {
      const sliceIndex = Number(rawSlice);
      const centerX = Number(rawCx);
      const centerY = Number(rawCy);
      const explicitScale = rawCz !== undefined ? Number(rawCz) : undefined;
      const coordKey = `${sliceIndex}:${centerX}:${centerY}:${explicitScale ?? ""}`;
      const emakis = Array.isArray(data?.emakis) ? data.emakis : [];
      const targetSlice = Number.isInteger(sliceIndex) ? emakis[sliceIndex] : null;
      const linkId = targetSlice?.linkId;
      if (
        typeof linkId === "number" &&
        Number.isFinite(centerX) &&
        Number.isFinite(centerY) &&
        appliedSpotRef.current !== coordKey
      ) {
        appliedSpotRef.current = coordKey;
        const offsetPercent = scrollOffsetPercentFromCenterX(centerX);
        const pin = () => window.scrollTo({ top: 0, behavior: "instant" });
        handleToId(linkId, {
          realign: true,
          offsetPercent,
          behavior: "auto",
        });
        pin();
        const timers = [50, 200, 500, 1000].map((ms) => setTimeout(pin, ms));
        setPendingSpotZoom({
          centerX,
          centerY,
          rectW: null,
          rectH: null,
          sliceIndex,
          linkId,
          offsetPercent,
          explicitScale,
        });
        return () => {
          timers.forEach(clearTimeout);
        };
      }
    }

    const querySpot = query?.spot;
    if (querySpot) {
      const spotId = String(
        Array.isArray(querySpot) ? querySpot[0] : querySpot ?? ""
      ).trim();
      const pending = pendingSpotRef.current;
      const pendingStr =
        pending === null ? null : pending === "" ? "" : String(pending);
      const queryStale =
        pendingStr !== null && spotId !== pendingStr;
      if (!queryStale) {
        if (spotId && appliedSpotRef.current !== spotId) {
          const landing = resolveSpotDeepLink(data, querySpot);
          if (landing) {
            appliedSpotRef.current = spotId;
            setSelectedSpotId(spotId);
            const {
              linkId,
              sliceIndex,
              offsetPercent,
              centerX,
              centerY,
              rectW,
              rectH,
            } = landing;
            const pin = () => window.scrollTo({ top: 0, behavior: "instant" });
            handleToId(linkId, {
              realign: true,
              offsetPercent,
              behavior: "auto",
            });
            pin();
            const timers = [50, 200, 500, 1000].map((ms) => setTimeout(pin, ms));
            setPendingSpotZoom({
              centerX,
              centerY,
              rectW,
              rectH,
              sliceIndex,
              linkId,
              offsetPercent,
            });
            return () => {
              timers.forEach(clearTimeout);
            };
          }
        } else if (spotId && appliedSpotRef.current === spotId) {
          setSelectedSpotId(spotId);
          return;
        }
      }
    }

    const queryScene = query?.scene;
    let targetIndex = null;

    if (queryScene !== undefined && queryScene !== null) {
      const parsed = Number(queryScene);
      if (!Number.isNaN(parsed) && parsed >= 1) {
        targetIndex = getLinkIdForVisitorScene(data?.emakis || [], parsed);
      }
    }

    if (targetIndex === null) {
      const hashflag = Number(
        String(
          typeof window !== "undefined" ? window.location.hash || "" : ""
        ).replace("#", "")
      );
      if (!Number.isNaN(hashflag) && hashflag > 0) {
        targetIndex = hashflag;
      }
    }

    if (didApplyEntryHashRef.current) return;
    didApplyEntryHashRef.current = true;

    if (targetIndex === null || targetIndex === undefined) return;
    const pin = () => window.scrollTo({ top: 0, behavior: "instant" });
    if (navIndex === targetIndex) {
      pin();
      return;
    }
    handleToId(targetIndex, {
      realign: true,
      scrollBehavior: "auto",
      align: "right",
      offsetPercent: -50,
    });
    pin();
    const timers = [50, 200, 500, 1000].map((ms) => setTimeout(pin, ms));
    return () => {
      timers.forEach(clearTimeout);
    };
  }, [
    scroll,
    isReady,
    data.id,
    handleToId,
    navIndex,
    query?.ebiki,
    query?.spot,
    data?.emakis,
  ]);

  return {
    selectedSpotId,
    selectedSpot,
    allSpots,
    onSelectSpot,
    onSelectSpotFromCommentary,
    onClearSelectedSpot,
  };
}