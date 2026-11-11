/**
 * useEmakiScroll
 * 
 * 【責務】
 * 絵巻の物理スクロール処理（DOM 実測）および現在シーン検出を担当。
 * 
 * 【バグ1・2との関連】
 * - SCROLL_MARGIN（5px）に基づき、スクロール位置から isAtStart（先頭右端）/ isAtEnd（末尾左端）を算出
 * - isAtStart の切り替わりが useEmakiRailSync の becameStart をトリガーし、レールの自動展開へ連動する
 * - レールの開閉による clientWidth / clientHeight の変化（ResizeObserver）を拾い、寸法キャッシュを再計算
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  trackManualScroll,
  handleSceneChange,
  updateEngagementState,
  updateScrollProgress,
} from "@/libs/api/measurementUtils";
import { estimateSceneIndexFromScrollLeft } from "@/utils/emakiContentWindow";
import { findSceneIndexAtViewportCenter } from "@/utils/emakiSceneDom";
import { scrollPositionStore as defaultScrollStore } from "@/hooks/emaki/scrollPositionStore";

// シーン検出のデバウンス時間（ミリ秒）
const SCENE_DETECT_DEBOUNCE_MS = 180;

const useEmakiScroll = ({
  articleRef,
  dataId,
  emakiId,
  emakis,
  isByobu = false,
  navIndex,
  setnavIndex,
  isScrollDetectedUpdateRef,
  isAutoScrolling,
  playModeAnimationRef,
  palmActiveRef,
  lastDetectedSceneRef,
  isAtStartRef,
  isAtEndRef,
  setIsAtStart,
  setIsAtEnd,
  isScrollingRef,
  setIsScrolling,
  indicatorElRef,
  toggleFullscreen,
  scrollPositionStore = defaultScrollStore,
  detectCurrentSceneRef,
}) => {
  const sceneDetectionTimerRef = useRef(null);
  const lastSceneDetectionTimeRef = useRef(0);
  const emakisRef = useRef(emakis);
  emakisRef.current = emakis;
  void isByobu;

  const indicatorRafRef = useRef(null);
  const indicatorRatioRef = useRef(0);
  const isDesktopRef = useRef(
    typeof window !== "undefined" && window.innerWidth >= 1024
  );
  const scrollingTimerRef = useRef(null);

  // 表示中・中央プローブ中のシーンインデックス
  const [liveSceneIndex, setLiveSceneIndex] = useState(navIndex);
  const [contentWindowCenter, setContentWindowCenter] = useState(navIndex);
  const contentWindowCenterRef = useRef(navIndex);
  const windowCenterRafRef = useRef(null);
  const windowCenterIdleRef = useRef(null);

  useEffect(() => {
    setLiveSceneIndex(navIndex);
  }, [navIndex]);

  // チャプターナビ等による navIndex 変更を検出基準へ同期
  useEffect(() => {
    if (isAutoScrolling || playModeAnimationRef.current) return;
    if (!Number.isFinite(navIndex)) return;
    lastDetectedSceneRef.current = navIndex;
  }, [
    navIndex,
    isAutoScrolling,
    playModeAnimationRef,
    lastDetectedSceneRef,
  ]);

  // 目次ジャンプ等で大きく移動した場合のみ描画窓中心を更新
  useEffect(() => {
    if (!Number.isFinite(navIndex)) return;
    if (navIndex === contentWindowCenterRef.current) return;
    const delta = Math.abs(navIndex - contentWindowCenterRef.current);
    if (delta < 5) return;
    contentWindowCenterRef.current = navIndex;
    setContentWindowCenter(navIndex);
  }, [navIndex]);

  useEffect(() => {
    if (!(isAutoScrolling || playModeAnimationRef.current)) return;
    if (!Number.isFinite(liveSceneIndex)) return;
    if (liveSceneIndex === contentWindowCenterRef.current) return;
    contentWindowCenterRef.current = liveSceneIndex;
    setContentWindowCenter(liveSceneIndex);
  }, [liveSceneIndex, isAutoScrolling, playModeAnimationRef]);

  /**
   * DOM中央プローブによる現在シーンの検出処理
   */
  const detectCurrentScene = useCallback(() => {
    const el = articleRef.current;
    if (!el) return;

    // プログラム制御の移動中は誤判定を防止
    if (scrollPositionStore.isProgrammaticScroll) {
      return;
    }

    const closestId = findSceneIndexAtViewportCenter(el);
    if (closestId === null || isNaN(closestId)) return;
    if (closestId === lastDetectedSceneRef.current) return;
    if (palmActiveRef?.current) return;

    const playing = isAutoScrolling || playModeAnimationRef.current;

    handleSceneChange(emakiId, closestId, "scroll_detect");
    updateEngagementState(emakiId, closestId, toggleFullscreen);

    lastDetectedSceneRef.current = closestId;

    if (playing) {
      setLiveSceneIndex(closestId);
      return;
    }

    if (isScrollDetectedUpdateRef) {
      isScrollDetectedUpdateRef.current = true;
    }
    setnavIndex(closestId);
    setTimeout(() => {
      if (isScrollDetectedUpdateRef) {
        isScrollDetectedUpdateRef.current = false;
      }
    }, 100);
  }, [
    articleRef,
    setnavIndex,
    isScrollDetectedUpdateRef,
    emakiId,
    isAutoScrolling,
    toggleFullscreen,
    playModeAnimationRef,
    palmActiveRef,
    lastDetectedSceneRef,
  ]);

  if (detectCurrentSceneRef) {
    detectCurrentSceneRef.current = detectCurrentScene;
  }

  // 寸法キャッシュ（リサイズ・レイアウトシフト監視用）
  const scrollDimsRef = useRef({ w: 0, c: 0, ts: 0 });

  useEffect(() => {
    if (!articleRef.current) return;
    const el = articleRef.current;

    const flushWindowCenterToState = () => {
      windowCenterIdleRef.current = null;
      const latest = contentWindowCenterRef.current;
      setContentWindowCenter((prev) => (prev === latest ? prev : latest));
    };

    const scheduleWindowCenterStateSync = () => {
      if (windowCenterIdleRef.current) return;
      if (typeof requestIdleCallback !== "undefined") {
        windowCenterIdleRef.current = requestIdleCallback(
          flushWindowCenterToState,
          { timeout: 250 }
        );
      } else {
        windowCenterIdleRef.current = setTimeout(flushWindowCenterToState, 200);
      }
    };

    const scheduleContentWindowCenter = () => {
      if (windowCenterRafRef.current) return;
      windowCenterRafRef.current = requestAnimationFrame(() => {
        windowCenterRafRef.current = null;
        const node = articleRef.current;
        if (!node) return;
        const list = emakisRef.current;
        if (!list?.length) return;
        const closestId = estimateSceneIndexFromScrollLeft(
          list,
          node.scrollLeft,
          node.clientWidth,
          node.clientHeight
        );
        if (closestId === null || isNaN(closestId)) return;
        if (closestId === contentWindowCenterRef.current) return;
        contentWindowCenterRef.current = closestId;
        scheduleWindowCenterStateSync();
      });
    };

    /**
     * スクロールイベントリスナー（物理計算・端点判定）
     */
    const handleScroll = () => {
      const currentScrollX = el.scrollLeft;
      const now = Date.now();

      // 1秒ごとに寸法キャッシュを更新
      if (now - scrollDimsRef.current.ts > 1000) {
        scrollDimsRef.current = { w: el.scrollWidth, c: el.clientWidth, ts: now };
      }
      const scrollWidth = scrollDimsRef.current.w || el.scrollWidth;
      const clientWidth = scrollDimsRef.current.c || el.clientWidth;
      const maxScrollLeft = scrollWidth - clientWidth;
      const SCROLL_MARGIN = 5;

      if (maxScrollLeft > 0 && !scrollPositionStore.isTransitioning) {
        scrollPositionStore.scrollLeft = currentScrollX;
        scrollPositionStore.scrollRatio = Math.abs(currentScrollX) / maxScrollLeft;
        scrollPositionStore.emakiId = dataId;
        scrollPositionStore.restored = false;
        updateScrollProgress(scrollPositionStore.scrollRatio);
      }

      scheduleContentWindowCenter();

      if (isAutoScrolling || playModeAnimationRef.current) {
        return;
      }

      // インジケータ更新
      if (maxScrollLeft > 0) {
        const ratio = Math.abs(currentScrollX) / maxScrollLeft;

        if (indicatorElRef.current) {
          indicatorRatioRef.current = ratio;
          if (!indicatorRafRef.current) {
            indicatorRafRef.current = requestAnimationFrame(() => {
              indicatorRafRef.current = null;
              const ind = indicatorElRef.current;
              if (!ind) return;
              const trackW = isDesktopRef.current ? 180 : 120;
              const indSize = isDesktopRef.current ? 12 : 8;
              const position =
                (1 - indicatorRatioRef.current) * (trackW - indSize);
              ind.style.transform = `translateX(${position}px) translateY(-50%)`;
            });
          }
        }

        if (!isScrollingRef.current) {
          isScrollingRef.current = true;
          setIsScrolling(true);
        }
      }

      if (scrollingTimerRef.current) {
        clearTimeout(scrollingTimerRef.current);
      }
      scrollingTimerRef.current = setTimeout(() => {
        isScrollingRef.current = false;
        setIsScrolling(false);
      }, 1500);

      // シーン判定のデバウンス
      if (sceneDetectionTimerRef.current) {
        clearTimeout(sceneDetectionTimerRef.current);
      }
      sceneDetectionTimerRef.current = setTimeout(() => {
        lastSceneDetectionTimeRef.current = Date.now();
        detectCurrentScene();
      }, SCENE_DETECT_DEBOUNCE_MS);

      // 【物理端点判定】RTLスクロールの誤差を考慮
      const atStart =
        Math.abs(currentScrollX) < SCROLL_MARGIN ||
        currentScrollX >= maxScrollLeft - SCROLL_MARGIN;

      const atEnd =
        Math.abs(currentScrollX) >= maxScrollLeft - SCROLL_MARGIN ||
        (currentScrollX < 0 &&
          Math.abs(currentScrollX) >= maxScrollLeft - SCROLL_MARGIN);

      // 端点ステートの変更通知（useEmakiRailSyncへ渡る）
      if (atStart !== isAtStartRef.current) {
        isAtStartRef.current = atStart;
        setIsAtStart(atStart);
      }
      if (atEnd !== isAtEndRef.current) {
        isAtEndRef.current = atEnd;
        setIsAtEnd(atEnd);
      }
    };

    el.addEventListener("scroll", handleScroll, { passive: true });

    const handleMousedown = () => {
      if (!isAutoScrolling) {
        trackManualScroll(emakiId, "drag");
      }
    };
    el.addEventListener("mousedown", handleMousedown);

    return () => {
      el.removeEventListener("scroll", handleScroll);
      el.removeEventListener("mousedown", handleMousedown);
      if (sceneDetectionTimerRef.current) {
        clearTimeout(sceneDetectionTimerRef.current);
      }
      if (windowCenterRafRef.current) {
        cancelAnimationFrame(windowCenterRafRef.current);
        windowCenterRafRef.current = null;
      }
      if (windowCenterIdleRef.current) {
        if (typeof cancelIdleCallback !== "undefined") {
          cancelIdleCallback(windowCenterIdleRef.current);
        } else {
          clearTimeout(windowCenterIdleRef.current);
        }
        windowCenterIdleRef.current = null;
      }
    };
  }, [detectCurrentScene, isAutoScrolling, dataId, emakiId, scrollPositionStore]);

  /**
   * レイアウトシフト（シアター切り替えによる幅・高さ変更）を監視
   */
  useEffect(() => {
    const el = articleRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    let lastW = el.scrollWidth;
    let lastC = el.clientWidth;
    let timer = null;

    const ro = new ResizeObserver(() => {
      const w = el.scrollWidth;
      const c = el.clientWidth;
      if (Math.abs(w - lastW) < 2 && Math.abs(c - lastC) < 2) return;
      lastW = w;
      lastC = c;
      scrollDimsRef.current = { w: 0, c: 0, ts: 0 };
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        detectCurrentScene();
      }, 120);
    });

    ro.observe(el);
    return () => {
      ro.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [articleRef, dataId, detectCurrentScene]);

  return {
    scrollDimsRef,
    liveSceneIndex,
    contentWindowCenter,
    contentWindowCenterRef,
  };
};

export default useEmakiScroll;