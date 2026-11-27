// 1. ビューア上端 inset 測定（フローティング解説バー用 CSS 変数）
// entry-container の getBoundingClientRect から --emaki-top-inset を供給する。

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  trackSessionContext,
  trackManualScroll,
  resetAllTracking,
  trackZoomOpen,
  trackZoomClose,
} from "@/libs/api/measurementUtils";
import { scrollPositionStore } from "@/hooks/emaki/scrollPositionStore";
import { runAfterPaint } from "@/utils/runAfterPaint";
import { shouldMountSceneContent } from "@/utils/emakiContentWindow";
import { isByobuScroll } from "@/utils/isByobuScroll";

let prevDataId = null;

// 1b. フローティング解説用 inset（useEmakiViewerLifecycle より前に呼ぶ）
export function useViewerTopInset({ commentaryFloating, toggleFullscreen, entryContainerRef }) {
  const [viewerTopInset, setViewerTopInset] = useState(null);

  useLayoutEffect(() => {
    if (!commentaryFloating || toggleFullscreen) return undefined;
    const el = entryContainerRef.current;
    if (!el) return undefined;
    const measure = () => {
      if (typeof window === "undefined") return;
      const top = Math.round(el.getBoundingClientRect().top + window.scrollY);
      setViewerTopInset((prev) => (prev === top ? prev : top));
    };
    measure();
    window.addEventListener("resize", measure);
    const timers = [200, 800].map((ms) => setTimeout(measure, ms));
    return () => {
      window.removeEventListener("resize", measure);
      timers.forEach((t) => clearTimeout(t));
    };
  }, [commentaryFloating, toggleFullscreen, entryContainerRef]);

  return viewerTopInset;
}

// 1c. ズーム計測ハンドラ（useEmakiZoomPan より前に呼ぶ）
export function useEmakiZoomOpenHandlers({ emakiId, stopPlayMode }) {
  const zoomStartTimeRef = useRef(null);
  const zoomMaxScaleRef = useRef(1);

  const handleZoomOpenWithTrack = useCallback(
    (source = "unknown") => {
      stopPlayMode();
      if (zoomStartTimeRef.current != null) return;
      zoomStartTimeRef.current = Date.now();
      zoomMaxScaleRef.current = 1;
      trackZoomOpen(emakiId, source);
    },
    [stopPlayMode, emakiId]
  );

  const handleZoomCloseWithTrack = useCallback(() => {
    if (zoomStartTimeRef.current) {
      const durationSec = (Date.now() - zoomStartTimeRef.current) / 1000;
      trackZoomClose(emakiId, durationSec, zoomMaxScaleRef.current);
      zoomStartTimeRef.current = null;
    }
  }, [emakiId]);

  return {
    handleZoomOpenWithTrack,
    handleZoomCloseWithTrack,
    zoomStartTimeRef,
    zoomMaxScaleRef,
  };
}

// 1d. ズーム計測副作用（useEmakiZoomPan の後に呼ぶ）
export function useEmakiZoomAnalyticsEffects({
  isZoomed,
  zoomScale,
  handleZoomCloseWithTrack,
  zoomMaxScaleRef,
}) {
  useEffect(() => {
    if (isZoomed && zoomScale > zoomMaxScaleRef.current) {
      zoomMaxScaleRef.current = zoomScale;
    }
  }, [isZoomed, zoomScale, zoomMaxScaleRef]);

  useEffect(() => {
    if (!isZoomed) {
      handleZoomCloseWithTrack();
    }
  }, [isZoomed, handleZoomCloseWithTrack]);
}

/** @deprecated 互換の単体フック — 新規は OpenHandlers + AnalyticsEffects を使用 */
export function useEmakiZoomAnalytics({ emakiId, isZoomed, zoomScale, stopPlayMode }) {
  const zoomStartTimeRef = useRef(null);
  const zoomMaxScaleRef = useRef(1);

  const handleZoomOpenWithTrack = useCallback(
    (source = "unknown") => {
      stopPlayMode();
      if (zoomStartTimeRef.current != null) return;
      zoomStartTimeRef.current = Date.now();
      zoomMaxScaleRef.current = 1;
      trackZoomOpen(emakiId, source);
    },
    [stopPlayMode, emakiId]
  );

  const handleZoomCloseWithTrack = useCallback(() => {
    if (zoomStartTimeRef.current) {
      const durationSec = (Date.now() - zoomStartTimeRef.current) / 1000;
      trackZoomClose(emakiId, durationSec, zoomMaxScaleRef.current);
      zoomStartTimeRef.current = null;
    }
  }, [emakiId]);

  useEffect(() => {
    if (isZoomed && zoomScale > zoomMaxScaleRef.current) {
      zoomMaxScaleRef.current = zoomScale;
    }
  }, [isZoomed, zoomScale]);

  useEffect(() => {
    if (!isZoomed) {
      handleZoomCloseWithTrack();
    }
  }, [isZoomed, handleZoomCloseWithTrack]);

  return { handleZoomOpenWithTrack, handleZoomCloseWithTrack };
}

export function computeNextContentMounted({
  data,
  processedEmakis,
  contentWindowCenter,
  liveSceneIndex,
  navIndex,
  isPlayMode,
  isAutoScrolling,
  contentWindowMountedRef,
  contentWindowEmakiRef,
}) {
  if (contentWindowEmakiRef.current !== data.id) {
    contentWindowEmakiRef.current = data.id;
    contentWindowMountedRef.current = new Set();
  }

  const sceneIndexForPrefetch =
    isPlayMode || isAutoScrolling ? liveSceneIndex : navIndex;

  const windowCenter = Number.isFinite(contentWindowCenter)
    ? contentWindowCenter
    : Number.isFinite(sceneIndexForPrefetch)
      ? sceneIndexForPrefetch
      : 0;
  const windowIsPlaying = isPlayMode || isAutoScrolling;
  const pendingHashCenter =
    typeof window !== "undefined"
      ? Number(String(window.location.hash || "").replace("#", "")) || 0
      : 0;

  const isByobu = isByobuScroll(data);
  const mountWindowOpts = { isPlayMode: windowIsPlaying, isByobu };
  const nextContentMounted = new Set();
  for (let i = 0; i < processedEmakis.length; i += 1) {
    const wasMounted = contentWindowMountedRef.current.has(i);
    const nearCenter = shouldMountSceneContent(
      i,
      windowCenter,
      wasMounted,
      mountWindowOpts
    );
    const nearHash =
      pendingHashCenter > 0 &&
      shouldMountSceneContent(i, pendingHashCenter, false, {
        isPlayMode: false,
        isByobu,
      });
    if (nearCenter || nearHash) {
      nextContentMounted.add(i);
    }
  }
  contentWindowMountedRef.current = nextContentMounted;

  return { nextContentMounted, windowCenter, windowIsPlaying };
}

export default function useEmakiViewerLifecycle({
  articleRef,
  scroll,
  emakiId,
  data,
  backgroundImage,
  playModeAnimationRef,
  setIsPlayMode,
  showUI,
  scrollDimsRef,
  detectCurrentSceneRef,
  lastDetectedSceneRef,
  isAtStartRef,
  isAtEndRef,
  setIsAtStart,
  setIsAtEnd,
  orientation,
  toggleFullscreen,
}) {
  const [showWheelToast, setShowWheelToast] = useState(false);

  // 2. 絵巻切替時の scrollPositionStore リセットとセッション計
  useEffect(() => {
    if (prevDataId !== null && prevDataId !== data.id) {
      if (playModeAnimationRef.current) {
        cancelAnimationFrame(playModeAnimationRef.current);
        playModeAnimationRef.current = null;
      }
      setIsPlayMode(false);

      scrollPositionStore.scrollLeft = 0;
      scrollPositionStore.scrollRatio = 0;
      scrollPositionStore.restored = false;
      scrollPositionStore.isTransitioning = false;
      scrollPositionStore.emakiId = null;

      const el = articleRef.current;
      if (el) {
        scrollPositionStore.isTransitioning = true;
        el.scrollTo({ left: 0, behavior: "auto" });
        isAtStartRef.current = true;
        isAtEndRef.current = false;
        setIsAtStart(true);
        setIsAtEnd(false);
        lastDetectedSceneRef.current = 0;
        setTimeout(() => {
          scrollPositionStore.isTransitioning = false;
        }, 100);
      }

      scrollDimsRef.current = { w: 0, c: 0, ts: 0 };
      resetAllTracking();
    }

    prevDataId = data.id;

    return runAfterPaint(() => {
      const imageCount = (data.emakis || []).filter(
        (scene) => scene.cat === "image"
      ).length;
      trackSessionContext(emakiId, imageCount);
    });
  }, [
    data.id,
    data.emakis,
    emakiId,
    backgroundImage,
    articleRef,
    playModeAnimationRef,
    setIsPlayMode,
    scrollDimsRef,
    detectCurrentSceneRef,
    lastDetectedSceneRef,
    isAtStartRef,
    isAtEndRef,
    setIsAtStart,
    setIsAtEnd,
  ]);

  useEffect(() => {
    scrollDimsRef.current = { w: 0, c: 0, ts: 0 };
    const t = setTimeout(() => {
      if (typeof detectCurrentSceneRef.current === "function") {
        detectCurrentSceneRef.current();
      }
    }, 150);
    return () => clearTimeout(t);
  }, [toggleFullscreen, orientation, scrollDimsRef, detectCurrentSceneRef]);

  // 4. ホイール横スクロールと初回トースト（wheel_toast_shown）
  useEffect(() => {
    if (scroll) {
      let scrollSpeed = 30;
      const el = articleRef.current;
      if (!el) return;

      const readingDirection = data?.readingDirection || "rtl";
      const isLtr = readingDirection === "ltr";

      const MouseWheelHandler = (e) => {
        if (e.ctrlKey || e.metaKey) return;
        if (!e.deltaY) return;

        const toastKey = "wheel_toast_shown";
        if (!sessionStorage.getItem(toastKey)) {
          sessionStorage.setItem(toastKey, "true");
          setShowWheelToast(true);
        }

        trackManualScroll(emakiId, "wheel");

        if (playModeAnimationRef.current) {
          cancelAnimationFrame(playModeAnimationRef.current);
          playModeAnimationRef.current = null;
          setIsPlayMode(false);
          showUI();
          e.preventDefault();
          return;
        }

        const scrollDirection = e.deltaY > 0 ? 1 : -1;
        const scrollLeft = el.scrollLeft;
        const scrollWidth = el.scrollWidth;
        const clientWidth = el.clientWidth;
        const maxScrollLeft = scrollWidth - clientWidth;
        const SCROLL_MARGIN = 5;

        const atStart = isLtr
          ? scrollLeft <= SCROLL_MARGIN
          : Math.abs(scrollLeft) < SCROLL_MARGIN ||
            scrollLeft >= maxScrollLeft - SCROLL_MARGIN;

        const atEnd = isLtr
          ? scrollLeft >= maxScrollLeft - SCROLL_MARGIN
          : Math.abs(scrollLeft) >= maxScrollLeft - SCROLL_MARGIN ||
            (scrollLeft < 0 &&
              Math.abs(scrollLeft) >= maxScrollLeft - SCROLL_MARGIN);

        const shouldScroll = isLtr
          ? (scrollDirection === 1 && !atEnd) ||
            (scrollDirection === -1 && !atStart)
          : (scrollDirection === -1 && !atEnd) ||
            (scrollDirection === 1 && !atStart);

        if (shouldScroll) {
          const delta = scrollSpeed * scrollDirection;
          el.scrollLeft += delta;
        }

        e.preventDefault();
        return true;
      };

      el.addEventListener("wheel", MouseWheelHandler, { passive: false });
      return () => {
        el.removeEventListener("wheel", MouseWheelHandler, { passive: false });
      };
    }
  }, [scroll, emakiId, data?.readingDirection, playModeAnimationRef, setIsPlayMode, showUI]);

  return {
    showWheelToast,
    setShowWheelToast,
  };
}