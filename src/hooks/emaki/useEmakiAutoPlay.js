/**

 * 自動スクロール制御（初回ナッジ + 再生モード）。

 *

 * - 初回ナッジ: 初回表示時のみ、横スクロール可能性を緩やかな自動スクロールで認知させる

 * - 再生モード: ユーザー任意の自動スクロール（▶/停止ボタン）

 * - rAF ループ内でシーン検出・端点 ref 更新（scroll リスナーは自動再生中 no-op）

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

import useEmakiIdleUI from "./useEmakiIdleUI";



/** rAF ループ用: タブ切替等の dt スパイクを抑える上限（秒） */

const MAX_SCROLL_DT_SEC = 0.05;

const SCROLL_MARGIN = 5;



const computeMinScrollLeft = (el) => -(el.scrollWidth - el.clientWidth);



const syncEdgeRefsFromScroll = (el, minScrollLeft, isAtStartRef, isAtEndRef) => {

  const currentScrollX = el.scrollLeft;

  const maxScrollLeft = -minScrollLeft;

  if (maxScrollLeft <= 0) return;



  const atStart =

    Math.abs(currentScrollX) < SCROLL_MARGIN ||

    currentScrollX >= maxScrollLeft - SCROLL_MARGIN;

  const atEnd =

    Math.abs(currentScrollX) >= maxScrollLeft - SCROLL_MARGIN ||

    (currentScrollX < 0 &&

      Math.abs(currentScrollX) >= maxScrollLeft - SCROLL_MARGIN);



  if (atStart !== isAtStartRef.current) isAtStartRef.current = atStart;

  if (atEnd !== isAtEndRef.current) isAtEndRef.current = atEnd;

};



const maybeRunSceneDetection = (detectCurrentSceneRef, lastDetectMsRef, nowMs) => {

  if (nowMs - lastDetectMsRef.current >= PLAYBACK_SCENE_DETECT_MS) {

    lastDetectMsRef.current = nowMs;

    detectCurrentSceneRef.current?.();

  }

};



/** 向き・フルスクリーン復元用。programmatic scroll で scroll が発火しない端末向け */
const saveScrollPositionStore = (el, dataId, scrollPositionStore) => {

  if (!el || !scrollPositionStore || scrollPositionStore.isTransitioning) return;

  const maxScrollLeft = el.scrollWidth - el.clientWidth;

  if (maxScrollLeft <= 0) return;

  scrollPositionStore.scrollLeft = el.scrollLeft;

  scrollPositionStore.scrollRatio = Math.abs(el.scrollLeft) / maxScrollLeft;

  scrollPositionStore.emakiId = dataId;

  scrollPositionStore.restored = false;

};



const useEmakiAutoPlay = ({

  articleRef,

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

  scrollPositionStore,

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

      if (!el) return;



      const scrollSpeedPxPerSec = getPlaybackSpeedPxPerSec();

      let animationId = null;

      let stopped = false;

      let lastScrollTs = null;

      let minScrollLeft = computeMinScrollLeft(el);

      const lastDetectMsRef = { current: 0 };



      const originalScrollBehavior = el.style.scrollBehavior;

      el.style.scrollBehavior = "auto";



      const stopAutoScroll = (interruptMethod = null) => {

        if (stopped) return;

        stopped = true;



        if (interruptMethod) {

          const scrollWidth = el.scrollWidth;

          const clientWidth = el.clientWidth;

          const maxScrollLeft = scrollWidth - clientWidth;

          const scrollRatio = maxScrollLeft > 0 ? Math.abs(el.scrollLeft) / maxScrollLeft : 0;

          trackAutoScrollInterrupted(emakiId, interruptMethod, scrollRatio);

        }



        saveScrollPositionStore(el, dataId, scrollPositionStore);



        setIsAutoScrolling(false);

        setIsAtStart(isAtStartRef.current);

        setIsAtEnd(isAtEndRef.current);



        if (lastDetectedSceneRef.current !== navIndex) {

          setnavIndex(lastDetectedSceneRef.current);

        }



        isScrollingRef.current = false;

        setIsScrolling(false);



        if (animationId) cancelAnimationFrame(animationId);

        el.style.scrollBehavior = originalScrollBehavior;

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



        const currentScrollLeft = el.scrollLeft;

        const newScrollLeft = currentScrollLeft - scrollSpeedPxPerSec * dt;



        if (newScrollLeft < minScrollLeft + PLAYBACK_SCROLL_LIMIT_NEAR_END_PX) {

          minScrollLeft = computeMinScrollLeft(el);

        }



        if (newScrollLeft < minScrollLeft) {

          stopAutoScroll();

          return;

        }



        el.scrollLeft = newScrollLeft;

        syncEdgeRefsFromScroll(el, minScrollLeft, isAtStartRef, isAtEndRef);

        saveScrollPositionStore(el, dataId, scrollPositionStore);

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

          el.style.scrollBehavior = originalScrollBehavior;

          return;

        }



        if (!stopped) {

          setIsAutoScrolling(true);

          trackAutoScrollStarted(emakiId, getDeviceType());

          sessionStorage.setItem(keyName, true);



          requestAnimationFrame(() => {

            requestAnimationFrame(() => {

              if (stopped) return;

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

    if (playModeAnimationRef.current) {

      cancelAnimationFrame(playModeAnimationRef.current);

      playModeAnimationRef.current = null;

    }



    saveScrollPositionStore(articleRef.current, dataId, scrollPositionStore);



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

    if (!el) return;

    if (playModeAnimationRef.current || isAutoScrolling) return;



    setIsPlayMode(true);



    const scrollSpeedPxPerSec = getPlaybackSpeedPxPerSec();

    const playLastTsRef = { current: null };

    const lastDetectMsRef = { current: 0 };

    let minScrollLeft = computeMinScrollLeft(el);



    const originalScrollBehavior = el.style.scrollBehavior;

    el.style.scrollBehavior = "auto";



    const playScroll = (ts) => {

      if (playModeAnimationRef.current === null) {

        el.style.scrollBehavior = originalScrollBehavior;

        return;

      }



      if (playLastTsRef.current === null) playLastTsRef.current = ts;

      const dt = Math.min((ts - playLastTsRef.current) / 1000, MAX_SCROLL_DT_SEC);

      playLastTsRef.current = ts;



      const currentScrollLeft = el.scrollLeft;

      const newScrollLeft = currentScrollLeft - scrollSpeedPxPerSec * dt;



      if (newScrollLeft < minScrollLeft + PLAYBACK_SCROLL_LIMIT_NEAR_END_PX) {

        minScrollLeft = computeMinScrollLeft(el);

      }



      if (newScrollLeft < minScrollLeft) {

        saveScrollPositionStore(el, dataId, scrollPositionStore);

        setIsPlayMode(false);

        showUI();

        setIsAtStart(isAtStartRef.current);

        setIsAtEnd(isAtEndRef.current);

        if (lastDetectedSceneRef.current !== navIndex) {

          setnavIndex(lastDetectedSceneRef.current);

        }

        el.style.scrollBehavior = originalScrollBehavior;

        playModeAnimationRef.current = null;

        return;

      }



      el.scrollLeft = newScrollLeft;

      syncEdgeRefsFromScroll(el, minScrollLeft, isAtStartRef, isAtEndRef);

      saveScrollPositionStore(el, dataId, scrollPositionStore);

      maybeRunSceneDetection(detectCurrentSceneRef, lastDetectMsRef, ts);



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


