/**
 * LazyImage 用: priority / fullscreen / universal のスケルトン fallback タイマー。
 * onLoadingComplete 未発火時にスケルトンが残り続けないようするセーフティネット。
 */
import { trackImageFallback } from "@/libs/api/measurementUtils";
import { getAdaptiveTimeout } from "@/libs/emakiImageLoading/adaptiveTimeout";
import {
  FB_DEBUG,
  LAZY_IO_ROOT_MARGIN,
} from "@/libs/emakiImageLoading/constants";
import { applyImageLoadVisualComplete } from "@/libs/emakiImageLoading/imageLoadVisual";
import {
  isEagerForUniversalFallback,
  isEagerInFullscreen,
} from "@/libs/emakiImageLoading/eagerPolicy";
import { useEffect } from "react";

const fireFallback = ({
  emakiId,
  uniqueIndex,
  reason,
  isSkeletonVisible,
  hasTrackedRef,
  isPlayModeRef,
  setImageLoaded,
  setSkeletonVisible,
}) => {
  if (!isSkeletonVisible) return;
  if (FB_DEBUG) {
    console.log(
      `[FB-DEBUG] ⚠ FALLBACK FIRED: ${reason} | idx=${uniqueIndex}`
    );
  }
  if (!hasTrackedRef.current && emakiId) {
    trackImageFallback(emakiId, uniqueIndex, reason);
    hasTrackedRef.current = true;
  }
  applyImageLoadVisualComplete({
    isPlayModeRef,
    isSkeletonVisible,
    setImageLoaded,
    setSkeletonVisible,
  });
};

const observeViewportThenTimer = ({ containerEl, startFallbackTimer }) => {
  let fallbackTimer = null;
  let observed = false;

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !observed) {
        observed = true;
        fallbackTimer = startFallbackTimer();
        observer.disconnect();
      }
    },
    { rootMargin: LAZY_IO_ROOT_MARGIN }
  );
  observer.observe(containerEl);

  return () => {
    observer.disconnect();
    if (fallbackTimer) clearTimeout(fallbackTimer);
  };
};

const useImageLoadFallback = ({
  containerRef,
  uniqueIndex,
  prefetchSceneIndexRef,
  isPlayModeRef,
  toggleFullscreen,
  isSkeletonVisible,
  emakiId,
  loadStartTimeRef,
  hasTrackedRef,
  setImageLoaded,
  setSkeletonVisible,
}) => {
  // priority 画像（最初の画像）— 再マウント時キャッシュで onLoadingComplete が来ない場合
  useEffect(() => {
    if (uniqueIndex !== 0) return;

    const timeout = getAdaptiveTimeout("priority", emakiId);
    if (FB_DEBUG) {
      console.log(
        `[FB-DEBUG] priority timer SET: idx=${uniqueIndex}, timeout=${timeout}ms`
      );
    }
    const fallbackTimer = setTimeout(() => {
      fireFallback({
        emakiId,
        uniqueIndex,
        reason: "priority_timeout",
        isSkeletonVisible,
        hasTrackedRef,
        isPlayModeRef,
        setImageLoaded,
        setSkeletonVisible,
      });
    }, timeout);
    return () => clearTimeout(fallbackTimer);
  }, [
    uniqueIndex,
    isSkeletonVisible,
    emakiId,
    hasTrackedRef,
    isPlayModeRef,
    prefetchSceneIndexRef,
    setImageLoaded,
    setSkeletonVisible,
  ]);

  // 全画面切替時 — next/image IO が viewport 変化に追従しない問題への対策
  useEffect(() => {
    if (!toggleFullscreen || !isSkeletonVisible) return;
    const el = containerRef.current;
    if (!el) return;

    let fallbackTimer = null;
    const eagerInFullscreen = isEagerInFullscreen({
      uniqueIndex,
      prefetchIndex: prefetchSceneIndexRef.current,
      isPlayMode: isPlayModeRef.current,
    });

    const startFallbackTimer = () => {
      loadStartTimeRef.current = Date.now();
      const timeout = getAdaptiveTimeout("fullscreen", emakiId);
      if (FB_DEBUG) {
        console.log(
          `[FB-DEBUG] fullscreen timer SET: idx=${uniqueIndex}, timeout=${timeout}ms, eager=${eagerInFullscreen}`
        );
      }
      fallbackTimer = setTimeout(() => {
        fireFallback({
          emakiId,
          uniqueIndex,
          reason: "fullscreen_timeout",
          isSkeletonVisible,
          hasTrackedRef,
          isPlayModeRef,
          setImageLoaded,
          setSkeletonVisible,
        });
      }, timeout);
      return fallbackTimer;
    };

    if (eagerInFullscreen) {
      startFallbackTimer();
      return () => {
        if (fallbackTimer) clearTimeout(fallbackTimer);
      };
    }

    return observeViewportThenTimer({
      containerEl: el,
      startFallbackTimer,
    });
  }, [
    toggleFullscreen,
    isSkeletonVisible,
    emakiId,
    uniqueIndex,
    prefetchSceneIndexRef,
    isPlayModeRef,
    containerRef,
    hasTrackedRef,
    loadStartTimeRef,
    setImageLoaded,
    setSkeletonVisible,
  ]);

  // universal — priority・全画面時以外のセーフティネット
  useEffect(() => {
    if (uniqueIndex === 0 || toggleFullscreen) return;
    if (isPlayModeRef.current) return;
    const el = containerRef.current;
    if (!el) return;

    let fallbackTimer = null;
    const isEager = isEagerForUniversalFallback({
      uniqueIndex,
      prefetchIndex: prefetchSceneIndexRef.current,
      isPlayMode: isPlayModeRef.current,
    });

    const startFallbackTimer = () => {
      loadStartTimeRef.current = Date.now();
      const timeout = getAdaptiveTimeout("universal", emakiId);
      if (FB_DEBUG) {
        console.log(
          `[FB-DEBUG] universal timer SET (viewport enter): idx=${uniqueIndex}, timeout=${timeout}ms`
        );
      }
      fallbackTimer = setTimeout(() => {
        fireFallback({
          emakiId,
          uniqueIndex,
          reason: "universal_timeout",
          isSkeletonVisible,
          hasTrackedRef,
          isPlayModeRef,
          setImageLoaded,
          setSkeletonVisible,
        });
      }, timeout);
      return fallbackTimer;
    };

    if (isEager) {
      startFallbackTimer();
      return () => {
        if (fallbackTimer) clearTimeout(fallbackTimer);
      };
    }

    return observeViewportThenTimer({
      containerEl: el,
      startFallbackTimer,
    });
  }, [
    uniqueIndex,
    toggleFullscreen,
    isSkeletonVisible,
    emakiId,
    isPlayModeRef,
    prefetchSceneIndexRef,
    containerRef,
    hasTrackedRef,
    loadStartTimeRef,
    setImageLoaded,
    setSkeletonVisible,
  ]);
};

export default useImageLoadFallback;
