/**
 * スクロール処理 + 現在シーン検出。
 *
 * - handleScroll: 端点判定・スクロール位置保存・インジケータ更新・シーン検出 debounce
 * - detectCurrentScene: 読取位置（コンテナ幅 38%）+ ヒステリシス 80px でシーン特定
 * - パフォーマンス: getBoundingClientRect は初回のみ、scrollWidth/clientWidth は1秒間隔でキャッシュ
 * - 自動再生中: scroll リスナーは位置保存のみ行い、シーン検出等は useEmakiAutoPlay の rAF 側
 * - 自動再生中は setnavIndex を抑制し liveSceneIndex のみ更新（解説バー・URL hash・共有追従用）
 *
 * 抽出元: EmakiConteiner.js の detectCurrentScene (useCallback) + handleScroll effect。
 * useEmakiSceneDetection と useEmakiScroll は共有 ref が多いため1つに統合。
 * sectionsCacheRef / scrollDimsRef は呼び出し側（絵巻切替リセット effect）で
 * 操作する必要があるため戻り値で公開する。
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  trackManualScroll,
  handleSceneChange,
  updateEngagementState,
  updateScrollProgress,
} from "@/libs/api/measurementUtils";
import {
  SCENE_DETECTION_HYSTERESIS_PX,
  SCENE_READING_POSITION_RATIO,
} from "@/libs/constants/viewerPlayback";

const useEmakiScroll = ({
  articleRef,
  dataId,
  emakiId,
  navIndex,
  setnavIndex,
  isScrollDetectedUpdateRef,
  isAutoScrolling,
  playModeAnimationRef,
  lastDetectedSceneRef,
  isAtStartRef,
  isAtEndRef,
  setIsAtStart,
  setIsAtEnd,
  isScrollingRef,
  setIsScrolling,
  indicatorElRef,
  toggleFullscreen,
  scrollPositionStore,
  detectCurrentSceneRef,
}) => {
  const sceneDetectionTimerRef = useRef(null);
  const lastSceneDetectionTimeRef = useRef(0);

  // 教育現場向けUI: 静かな現在地インジケータ
  // パフォーマンス: scrollRatio はReact stateではなくDOM直接操作で更新
  // スクロール中のEmakiConteiner再レンダリングを完全に排除
  // インジケーター更新の rAF 集約用: ペイントを1フレームに1回に制限
  // （毎フレームの style 書き込みによる強制レイアウトを回避）
  const indicatorRafRef = useRef(null);
  const indicatorRatioRef = useRef(0); // 最新の進行度（rAFコールバックで参照）
  const isDesktopRef = useRef(
    typeof window !== "undefined" && window.innerWidth >= 1024
  ); // セッション中ほぼ不変のためマウント時1回だけ計算
  const scrollingTimerRef = useRef(null); // スクロール検出タイマー

  // 絵巻ハイパーリンク: スクロール位置から現在表示中のシーンを検出
  // パフォーマンス: 初回のみ getBoundingClientRect でセクション位置を計算・キャッシュし、
  // 以降は scrollLeft の算術演算のみでシーンを特定（DOM読み取り・レイアウト強制ゼロ）
  const sectionsCacheRef = useRef(null);

  // 再生中の解説バー追従用（navIndex は画像ツリー再レンダー抑制のため固定）
  const [liveSceneIndex, setLiveSceneIndex] = useState(navIndex);

  useEffect(() => {
    setLiveSceneIndex(navIndex);
  }, [navIndex]);

  const detectCurrentScene = useCallback(() => {
    const el = articleRef.current;
    if (!el) return;

    // 初回: セクション位置をキャッシュ（getBoundingClientRect は1回だけ）
    // items プロパティの存在もチェック（HMRで旧形式キャッシュが残る場合の対策）
    if (!sectionsCacheRef.current?.items) {
      const sections = Array.from(el.querySelectorAll("section[id]"));
      if (sections.length === 0) return;

      const containerRect = el.getBoundingClientRect();
      const readingX =
        containerRect.right -
        containerRect.width * SCENE_READING_POSITION_RATIO;
      const baseScrollLeft = el.scrollLeft;

      sectionsCacheRef.current = {
        baseScrollLeft,
        items: sections.map((section) => {
          const rect = section.getBoundingClientRect();
          const sectionCenter = rect.left + rect.width / 2;
          return {
            id: parseInt(section.id, 10),
            // 読取位置からのオフセット（scrollLeft 差分のみで追跡）
            offset: sectionCenter - readingX,
          };
        }),
      };
    }

    // 2回目以降: scrollLeft の差分だけでシーンを特定（DOM読み取りなし）
    const cache = sectionsCacheRef.current;
    const scrollDelta = el.scrollLeft - cache.baseScrollLeft;

    let closestId = null;
    let closestDistance = Infinity;

    cache.items.forEach(({ id, offset }) => {
      const distance = Math.abs(offset - scrollDelta);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestId = id;
      }
    });

    if (closestId !== null && !isNaN(closestId) && closestId !== lastDetectedSceneRef.current) {
      const currentItem = cache.items.find(
        (item) => item.id === lastDetectedSceneRef.current
      );
      if (currentItem) {
        const currentDist = Math.abs(currentItem.offset - scrollDelta);
        if (closestDistance >= currentDist - SCENE_DETECTION_HYSTERESIS_PX) {
          return;
        }
      }

      // 計測: シーン遷移・滞在（スクロール検出による）
      handleSceneChange(emakiId, closestId, "scroll_detect");
      // 計測: セッション鑑賞サマリー用の状態更新
      updateEngagementState(emakiId, closestId, toggleFullscreen);

      lastDetectedSceneRef.current = closestId;

      // 自動再生中は liveSceneIndex のみ更新（解説バー追従。停止時に navIndex を同期）
      if (isAutoScrolling || playModeAnimationRef.current) {
        setLiveSceneIndex(closestId);
        return;
      }

      // 絵巻ハイパーリンク: スクロール検出による更新であることをマーク
      // scrollDialog の自動スクロールを抑制するため
      if (isScrollDetectedUpdateRef) {
        isScrollDetectedUpdateRef.current = true;
      }
      setnavIndex(closestId);
      // フラグを解除（scrollDialog の処理が完了するまで少し待つ）
      setTimeout(() => {
        if (isScrollDetectedUpdateRef) {
          isScrollDetectedUpdateRef.current = false;
        }
      }, 100);
    }
    // isAutoScrolling: 初回ナッジ中のガード（return）を確実に反映するため依存に含める
    // （含めないとクロージャが古い値 false を捕捉し、ナッジ中も setnavIndex が走る）
  }, [
    setnavIndex,
    isScrollDetectedUpdateRef,
    emakiId,
    isAutoScrolling,
    toggleFullscreen,
    playModeAnimationRef,
  ]);

  if (detectCurrentSceneRef) {
    detectCurrentSceneRef.current = detectCurrentScene;
  }

  // パフォーマンス: scrollWidth/clientWidth のキャッシュ
  // 自動再生中は値が変化しないため、毎フレームのレイアウト読み取りを回避
  const scrollDimsRef = useRef({ w: 0, c: 0, ts: 0 });

  useEffect(() => {
    if (!articleRef.current) return;
    const el = articleRef.current;
    const handleScroll = () => {
      const currentScrollX = el.scrollLeft;
      const now = Date.now();
      const SCROLL_MARGIN = 5;
      if (now - scrollDimsRef.current.ts > 1000) {
        scrollDimsRef.current = { w: el.scrollWidth, c: el.clientWidth, ts: now };
      }
      const scrollWidth = scrollDimsRef.current.w || el.scrollWidth;
      const clientWidth = scrollDimsRef.current.c || el.clientWidth;
      const maxScrollLeft = scrollWidth - clientWidth;

      // 向き・フルスクリーン復元用: 自動再生中も保存（programmatic scrollLeft でも scroll 発火）
      if (maxScrollLeft > 0 && !scrollPositionStore.isTransitioning) {
        scrollPositionStore.scrollLeft = currentScrollX;
        scrollPositionStore.scrollRatio = Math.abs(currentScrollX) / maxScrollLeft;
        scrollPositionStore.emakiId = dataId;
        scrollPositionStore.restored = false;
        updateScrollProgress(scrollPositionStore.scrollRatio);
      }

      // 自動再生中は rAF 側で端点・シーン検出（それ以外の毎フレーム処理を省略）
      if (isAutoScrolling || playModeAnimationRef.current) {
        return;
      }

      // 教育現場向けUI: 現在地インジケータ
      if (maxScrollLeft > 0) {
        const ratio = Math.abs(currentScrollX) / maxScrollLeft;

        // PositionIndicatorのDOM要素を直接更新（React stateを経由しない）
        // rAFに集約し、毎フレームの style 書き込みを1フレーム1回に制限
        if (indicatorElRef.current) {
          indicatorRatioRef.current = ratio;
          if (!indicatorRafRef.current) {
            indicatorRafRef.current = requestAnimationFrame(() => {
              indicatorRafRef.current = null;
              const el = indicatorElRef.current;
              if (!el) return;
              const trackW = isDesktopRef.current ? 180 : 120;
              const indSize = isDesktopRef.current ? 12 : 8;
              const position =
                (1 - indicatorRatioRef.current) * (trackW - indSize);
              el.style.transform = `translateX(${position}px) translateY(-50%)`;
            });
          }
        }

        // isScrolling: 開始時に1回だけsetStateを呼ぶ（ref で重複呼び出しを防止）
        if (!isScrollingRef.current) {
          isScrollingRef.current = true;
          setIsScrolling(true);
        }
      }

      // 手動スクロール: 停止検出 + debounce シーン検出
      if (scrollingTimerRef.current) {
        clearTimeout(scrollingTimerRef.current);
      }
      scrollingTimerRef.current = setTimeout(() => {
        isScrollingRef.current = false;
        setIsScrolling(false);
      }, 1500);

      if (sceneDetectionTimerRef.current) {
        clearTimeout(sceneDetectionTimerRef.current);
      }
      sceneDetectionTimerRef.current = setTimeout(() => {
        lastSceneDetectionTimeRef.current = Date.now();
        detectCurrentScene();
      }, 150);

      // 開始位置判定
      const atStart =
        Math.abs(currentScrollX) < SCROLL_MARGIN ||
        currentScrollX >= maxScrollLeft - SCROLL_MARGIN;

      // 終了位置判定: scrollLeft が負の最大値または 0 付近（RTL環境考慮）
      const atEnd =
        Math.abs(currentScrollX) >= maxScrollLeft - SCROLL_MARGIN ||
        (currentScrollX < 0 &&
          Math.abs(currentScrollX) >= maxScrollLeft - SCROLL_MARGIN);

      // 状態更新（変化がある場合のみ）
      if (atStart !== isAtStartRef.current) {
        isAtStartRef.current = atStart;
        setIsAtStart(atStart);
      }
      if (atEnd !== isAtEndRef.current) {
        isAtEndRef.current = atEnd;
        setIsAtEnd(atEnd);
      }
    };

    el.addEventListener("scroll", handleScroll);

    // 計測: マウスドラッグによるスクロール操作
    const handleMousedown = () => {
      if (!isAutoScrolling) {
        trackManualScroll(emakiId, "drag");
      }
    };
    el.addEventListener("mousedown", handleMousedown);

    return () => {
      el.removeEventListener("scroll", handleScroll);
      el.removeEventListener("mousedown", handleMousedown);
      // クリーンアップ: シーン検出タイマーもクリア
      if (sceneDetectionTimerRef.current) {
        clearTimeout(sceneDetectionTimerRef.current);
      }
    };
  }, [detectCurrentScene, isAutoScrolling, dataId, emakiId]);

  return { sectionsCacheRef, scrollDimsRef, liveSceneIndex };
};

export default useEmakiScroll;
