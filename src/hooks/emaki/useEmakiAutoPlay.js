/**
 * 自動スクロール制御（初回ナッジ + 再生モード）。
 *
 * - 初回ナッジ: 初回表示時のみ、横スクロール可能性を緩やかな自動スクロールで認知させる
 * - 再生モード: ユーザー任意の自動スクロール（▶/停止ボタン）
 * - rAF ループ内でシーン検出・端点 ref 更新（transform 移動で scroll イベントを出さない）
 * - scrollWidth は開始時1回 + 末尾付近のみ再計測
 */
import { useEffect, useRef, useState } from "react";
import {
  trackAutoScrollStarted,
  trackAutoScrollInterrupted,
  trackInitialLoadWithHash,
  getDeviceType,
} from "@/libs/api/measurementUtils";
import {
  getPlaybackSpeedPxPerSec,
  PLAYBACK_SCENE_DETECT_MS,
  PLAYBACK_SCROLL_LIMIT_NEAR_END_PX,
} from "@/libs/constants/viewerPlayback";
import { preloadPlaybackImages } from "@/libs/emakiImageLoading/playbackPreload";
import {
  beginTransformPlayback,
  computeMinScrollLeft,
  endTransformPlayback,
  getEffectiveScrollLeft,
  setPlaybackScrollLeft,
  syncEdgeRefsFromScrollLeft,
} from "@/utils/emakiTransformScroll";
import { getSceneIndexFromScrollCache } from "@/utils/emakiSceneFromScroll";
import useEmakiIdleUI from "./useEmakiIdleUI";

/** rAF ループ用: タブ切替等の dt スパイクを抑える上限（秒） */
const MAX_SCROLL_DT_SEC = 0.05;

const maybeRunSceneDetection = (detectCurrentSceneRef, lastDetectMsRef, nowMs) => {
  if (nowMs - lastDetectMsRef.current >= PLAYBACK_SCENE_DETECT_MS) {
    lastDetectMsRef.current = nowMs;
    detectCurrentSceneRef.current?.();
  }
};

/** 再生 rAF 内: スクロール位置から先読み scene index を更新し imperative preload */
const updatePlaybackPrefetch = ({
  articleEl,
  virtualScrollLeftRef,
  sectionsCacheRef,
  prefetchSceneIndexRef,
  processedEmakisRef,
}) => {
  if (!prefetchSceneIndexRef || !sectionsCacheRef) return;

  const newIdx = getSceneIndexFromScrollCache(
    articleEl,
    virtualScrollLeftRef,
    sectionsCacheRef,
    prefetchSceneIndexRef.current
  );

  if (newIdx === prefetchSceneIndexRef.current) return;

  prefetchSceneIndexRef.current = newIdx;
  const emakis = processedEmakisRef?.current;
  if (emakis) preloadPlaybackImages(emakis, newIdx);
};

const useEmakiAutoPlay = ({
  articleRef,
  scrollTrackRef,
  virtualScrollLeftRef,
  dataId,
  emakiId,
  navIndex,
  setnavIndex,
  lastDetectedSceneRef,
  isAtStartRef,
  isAtEndRef,
  setIsAtStart,
  setIsAtEnd,
  isScrollingRef,
  setIsScrolling,
  detectCurrentSceneRef,
  sectionsCacheRef,
  prefetchSceneIndexRef,
  processedEmakisRef,
}) => {
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [isPlayMode, setIsPlayMode] = useState(false);
  const playModeAnimationRef = useRef(null);

  const { isUIVisible, showUI } = useEmakiIdleUI({
    emakiId,
    isAutoScrolling,
    isPlayMode,
  });

  useEffect(() => {
    const keyName = `visited_${dataId}`;
    const isFirstVisit = !sessionStorage.getItem(keyName);
    const hasHashInUrl = typeof window !== "undefined" && window.location.hash;

    if (hasHashInUrl && isFirstVisit) {
      const hashSceneIndex = parseInt(window.location.hash.replace("#", ""), 10);
      if (!isNaN(hashSceneIndex)) {
        trackInitialLoadWithHash(emakiId, hashSceneIndex);
      }
    }

    if (isFirstVisit && !hasHashInUrl) {
      const el = articleRef.current;
      const trackEl = scrollTrackRef.current;
      if (!el || !trackEl) return;

      const scrollSpeedPxPerSec = getPlaybackSpeedPxPerSec();
      let animationId = null;
      let stopped = false;
      let lastScrollTs = null;
      let minScrollLeft = computeMinScrollLeft(el);
      let transformActive = false;
      const lastDetectMsRef = { current: 0 };

      const stopAutoScroll = (interruptMethod = null) => {
        if (stopped) return;
        stopped = true;

        if (interruptMethod) {
          const scrollWidth = el.scrollWidth;
          const clientWidth = el.clientWidth;
          const maxScrollLeft = scrollWidth - clientWidth;
          const scrollLeft = getEffectiveScrollLeft(el, virtualScrollLeftRef);
          const scrollRatio =
            maxScrollLeft > 0 ? Math.abs(scrollLeft) / maxScrollLeft : 0;
          trackAutoScrollInterrupted(emakiId, interruptMethod, scrollRatio);
        }

        if (transformActive) {
          endTransformPlayback(el, trackEl, virtualScrollLeftRef);
          transformActive = false;
        }

        setIsAutoScrolling(false);
        setIsAtStart(isAtStartRef.current);
        setIsAtEnd(isAtEndRef.current);

        if (lastDetectedSceneRef.current !== navIndex) {
          setnavIndex(lastDetectedSceneRef.current);
        }

        isScrollingRef.current = false;
        setIsScrolling(false);

        if (animationId) cancelAnimationFrame(animationId);

        el.removeEventListener("mousedown", handleMousedown);
        el.removeEventListener("wheel", handleWheel);
        el.removeEventListener("touchstart", handleTouchstart);
        document.removeEventListener("click", handleClick);
      };

      const handleMousedown = () => stopAutoScroll("mousedown");
      const handleWheel = () => stopAutoScroll("wheel");
      const handleTouchstart = () => stopAutoScroll("touch");
      const handleClick = () => stopAutoScroll("click");

      const autoScroll = (ts) => {
        if (stopped) return;

        if (lastScrollTs === null) lastScrollTs = ts;
        const dt = Math.min((ts - lastScrollTs) / 1000, MAX_SCROLL_DT_SEC);
        lastScrollTs = ts;

        const currentScrollLeft = getEffectiveScrollLeft(el, virtualScrollLeftRef);
        const newScrollLeft = currentScrollLeft - scrollSpeedPxPerSec * dt;

        if (newScrollLeft < minScrollLeft + PLAYBACK_SCROLL_LIMIT_NEAR_END_PX) {
          minScrollLeft = computeMinScrollLeft(el);
        }

        if (newScrollLeft < minScrollLeft) {
          stopAutoScroll();
          return;
        }

        setPlaybackScrollLeft(el, trackEl, virtualScrollLeftRef, newScrollLeft);
        syncEdgeRefsFromScrollLeft(
          newScrollLeft,
          minScrollLeft,
          isAtStartRef,
          isAtEndRef
        );
        maybeRunSceneDetection(detectCurrentSceneRef, lastDetectMsRef, ts);

        animationId = requestAnimationFrame(autoScroll);
      };

      el.addEventListener("mousedown", handleMousedown, { once: true });
      el.addEventListener("wheel", handleWheel, { once: true });
      el.addEventListener("touchstart", handleTouchstart, { once: true });
      document.addEventListener("click", handleClick, { once: true });

      const timerId = setTimeout(() => {
        const hasHashNow = window.location.hash;
        if (hasHashNow) {
          stopped = true;
          return;
        }

        if (!stopped) {
          setIsAutoScrolling(true);
          trackAutoScrollStarted(emakiId, getDeviceType());
          sessionStorage.setItem(keyName, true);

          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              if (stopped) return;
              beginTransformPlayback(el, trackEl, virtualScrollLeftRef);
              transformActive = true;
              minScrollLeft = computeMinScrollLeft(el);
              animationId = requestAnimationFrame(autoScroll);
            });
          });
        }
      }, 500);

      return () => {
        clearTimeout(timerId);
        stopAutoScroll();
      };
    }
  }, [dataId, emakiId]);

  const stopPlayMode = () => {
    const el = articleRef.current;
    const trackEl = scrollTrackRef.current;

    if (playModeAnimationRef.current) {
      cancelAnimationFrame(playModeAnimationRef.current);
      playModeAnimationRef.current = null;
    }

    if (el && virtualScrollLeftRef.current != null) {
      endTransformPlayback(el, trackEl, virtualScrollLeftRef);
    }

    setIsPlayMode(false);

    if (lastDetectedSceneRef.current !== navIndex) {
      setnavIndex(lastDetectedSceneRef.current);
    }

    isScrollingRef.current = false;
    setIsScrolling(false);
    showUI();
  };

  const startPlayMode = () => {
    const el = articleRef.current;
    const trackEl = scrollTrackRef.current;
    if (!el || !trackEl) return;
    if (playModeAnimationRef.current || isAutoScrolling) return;

    setIsPlayMode(true);
    beginTransformPlayback(el, trackEl, virtualScrollLeftRef);

    updatePlaybackPrefetch({
      articleEl: el,
      virtualScrollLeftRef,
      sectionsCacheRef,
      prefetchSceneIndexRef,
      processedEmakisRef,
    });
    const emakis = processedEmakisRef?.current;
    if (emakis && prefetchSceneIndexRef) {
      preloadPlaybackImages(emakis, prefetchSceneIndexRef.current);
    }

    const scrollSpeedPxPerSec = getPlaybackSpeedPxPerSec();
    const playLastTsRef = { current: null };
    const lastDetectMsRef = { current: 0 };
    let minScrollLeft = computeMinScrollLeft(el);

    const playScroll = (ts) => {
      if (playModeAnimationRef.current === null) {
        if (virtualScrollLeftRef.current != null) {
          endTransformPlayback(el, trackEl, virtualScrollLeftRef);
        }
        return;
      }

      if (playLastTsRef.current === null) playLastTsRef.current = ts;
      const dt = Math.min((ts - playLastTsRef.current) / 1000, MAX_SCROLL_DT_SEC);
      playLastTsRef.current = ts;

      const currentScrollLeft = getEffectiveScrollLeft(el, virtualScrollLeftRef);
      const newScrollLeft = currentScrollLeft - scrollSpeedPxPerSec * dt;

      if (newScrollLeft < minScrollLeft + PLAYBACK_SCROLL_LIMIT_NEAR_END_PX) {
        minScrollLeft = computeMinScrollLeft(el);
      }

      if (newScrollLeft < minScrollLeft) {
        endTransformPlayback(el, trackEl, virtualScrollLeftRef);
        setIsPlayMode(false);
        showUI();
        setIsAtStart(isAtStartRef.current);
        setIsAtEnd(isAtEndRef.current);
        if (lastDetectedSceneRef.current !== navIndex) {
          setnavIndex(lastDetectedSceneRef.current);
        }
        playModeAnimationRef.current = null;
        return;
      }

      setPlaybackScrollLeft(el, trackEl, virtualScrollLeftRef, newScrollLeft);
      syncEdgeRefsFromScrollLeft(
        newScrollLeft,
        minScrollLeft,
        isAtStartRef,
        isAtEndRef
      );
      maybeRunSceneDetection(detectCurrentSceneRef, lastDetectMsRef, ts);
      updatePlaybackPrefetch({
        articleEl: el,
        virtualScrollLeftRef,
        sectionsCacheRef,
        prefetchSceneIndexRef,
        processedEmakisRef,
      });

      playModeAnimationRef.current = requestAnimationFrame(playScroll);
    };

    playModeAnimationRef.current = requestAnimationFrame(playScroll);
  };

  useEffect(() => {
    return () => {
      if (playModeAnimationRef.current) {
        cancelAnimationFrame(playModeAnimationRef.current);
        playModeAnimationRef.current = null;
      }
      const el = articleRef.current;
      const trackEl = scrollTrackRef.current;
      if (el && virtualScrollLeftRef.current != null) {
        endTransformPlayback(el, trackEl, virtualScrollLeftRef);
      }
    };
  }, []);

  return {
    isAutoScrolling,
    isPlayMode,
    startPlayMode,
    stopPlayMode,
    playModeAnimationRef,
    setIsPlayMode,
    isUIVisible,
    showUI,
  };
};

export default useEmakiAutoPlay;
