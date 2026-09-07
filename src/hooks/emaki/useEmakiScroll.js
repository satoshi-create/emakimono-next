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
import { estimateSceneIndexFromScrollLeft } from "@/utils/emakiContentWindow";
import { parseSceneSectionId } from "@/utils/emakiSceneDom";

const useEmakiScroll = ({
  articleRef,
  dataId,
  emakiId,
  emakis,
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
  scrollPositionStore,
  detectCurrentSceneRef,
}) => {
  const sceneDetectionTimerRef = useRef(null);
  const lastSceneDetectionTimeRef = useRef(0);
  const emakisRef = useRef(emakis);
  emakisRef.current = emakis;

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
  // 描画窓中心: navIndex の 150ms debounce を待たず scrollLeft から rAF 追従
  const [contentWindowCenter, setContentWindowCenter] = useState(navIndex);
  const contentWindowCenterRef = useRef(navIndex);
  const windowCenterRafRef = useRef(null);
  // スクロール中の state 反映を idle へ集約するためのハンドル（1回にまとめる）
  const windowCenterIdleRef = useRef(null);

  useEffect(() => {
    setLiveSceneIndex(navIndex);
  }, [navIndex]);

  // hash / 目次ジャンプ: 大きく離れた navIndex のみ窓へ反映（150ms debounce 追従で窓を巻き戻さない）
  useEffect(() => {
    if (!Number.isFinite(navIndex)) return;
    if (navIndex === contentWindowCenterRef.current) return;
    const delta = Math.abs(navIndex - contentWindowCenterRef.current);
    if (delta < 5) return;
    contentWindowCenterRef.current = navIndex;
    setContentWindowCenter(navIndex);
  }, [navIndex]);

  // 再生中 liveSceneIndex は窓の先読み中心にも使う（手動スクロール時は rAF のみ＝巻き戻し防止）
  useEffect(() => {
    if (!(isAutoScrolling || playModeAnimationRef.current)) return;
    if (!Number.isFinite(liveSceneIndex)) return;
    if (liveSceneIndex === contentWindowCenterRef.current) return;
    contentWindowCenterRef.current = liveSceneIndex;
    setContentWindowCenter(liveSceneIndex);
  }, [liveSceneIndex, isAutoScrolling, playModeAnimationRef]);

  const detectCurrentScene = useCallback(() => {
    const el = articleRef.current;
    if (!el) return;

    // 初回: セクション位置キャッシュは idle まで遅延（マウント直後の Forced reflow を避ける）
    if (!sectionsCacheRef.current?.items) {
      if (sectionsCacheRef.current?.pending) return;
      sectionsCacheRef.current = { pending: true };

      const buildCache = () => {
        const node = articleRef.current;
        if (!node) {
          sectionsCacheRef.current = null;
          return;
        }
        const sections = Array.from(node.querySelectorAll("section[id]"));
        if (sections.length === 0) {
          sectionsCacheRef.current = null;
          return;
        }

        const containerRect = node.getBoundingClientRect();
        const readingX =
          containerRect.right -
          containerRect.width * SCENE_READING_POSITION_RATIO;
        const baseScrollLeft = node.scrollLeft;

        sectionsCacheRef.current = {
          baseScrollLeft,
          items: sections
            .map((section) => {
              const rect = section.getBoundingClientRect();
              const sectionCenter = rect.left + rect.width / 2;
              return {
                id: parseSceneSectionId(section.id),
                offset: sectionCenter - readingX,
              };
            })
            .filter((item) => !isNaN(item.id)),
        };
      };

      if (typeof requestIdleCallback !== "undefined") {
        requestIdleCallback(buildCache, { timeout: 400 });
      } else {
        requestAnimationFrame(() => requestAnimationFrame(buildCache));
      }
      return;
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

      // パームドラッグ中はシーン確定を保留する（指で位置を選んでいる最中に navIndex を
      // 更新すると EmakiConteiner 全体の再レンダー→「角ばり」や、hash 追従を介した
      // 巻き戻し連鎖を招く）。ドラッグ終了時（EmakiConteiner 側）に最終1回だけ検出する。
      if (palmActiveRef?.current) {
        return;
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
    palmActiveRef,
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

    /** 描画窓用: ヒステリシスなしで最寄りシーンを rAF 1回に集約して更新 */
    // スクロール中は state を更新せず ref のみ進め、idle 時に1回へ集約して反映する。
    // パンフレーム内で EmakiConteiner の再レンダー（殻→中身マウント・eager 再評価）が
    // 走ると入力→描画の追いつきで巻き戻り/ジャンプに見えるため、ここで非同期化する。
    const flushWindowCenterToState = () => {
      windowCenterIdleRef.current = null;
      const latest = contentWindowCenterRef.current;
      // functional update: 反映時点で最新値と変わっていなければ再レンダーしない
      setContentWindowCenter((prev) => (prev === latest ? prev : latest));
    };
    const scheduleWindowCenterStateSync = () => {
      if (windowCenterIdleRef.current) return; // 既に反映予約済み
      if (typeof requestIdleCallback !== "undefined") {
        windowCenterIdleRef.current = requestIdleCallback(
          flushWindowCenterToState,
          { timeout: 250 }
        );
      } else {
        // requestIdleCallback 非対応（旧 Safari 等）: 短遅延で同様に集約
        windowCenterIdleRef.current = setTimeout(flushWindowCenterToState, 200);
      }
    };

    const scheduleContentWindowCenter = () => {
      if (windowCenterRafRef.current) return;
      windowCenterRafRef.current = requestAnimationFrame(() => {
        windowCenterRafRef.current = null;
        const node = articleRef.current;
        if (!node) return;

        const applyCenter = (closestId) => {
          if (closestId === null || isNaN(closestId)) return;
          if (closestId === contentWindowCenterRef.current) return;
          // ref は即時・state は idle 反映（連続スクロール中は最新の中心だけを1回で適用）
          contentWindowCenterRef.current = closestId;
          scheduleWindowCenterStateSync();
        };

        const cache = sectionsCacheRef.current;
        if (!cache?.items) {
          // DOM キャッシュ未構築でもメタデータ幅で窓を進める（初回スクロールの殻バースト遅延防止）
          const list = emakisRef.current;
          if (list?.length) {
            applyCenter(
              estimateSceneIndexFromScrollLeft(
                list,
                node.scrollLeft,
                node.clientWidth,
                node.clientHeight
              )
            );
          }
          // 併せて idle キャッシュ構築を起動
          detectCurrentScene();
          return;
        }
        const scrollDelta = node.scrollLeft - cache.baseScrollLeft;
        let closestId = null;
        let closestDistance = Infinity;
        for (let i = 0; i < cache.items.length; i += 1) {
          const { id, offset } = cache.items[i];
          const distance = Math.abs(offset - scrollDelta);
          if (distance < closestDistance) {
            closestDistance = distance;
            closestId = id;
          }
        }
        applyCenter(closestId);
      });
    };

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

      // 描画窓は debounce せず追従（自動再生中の programmatic scroll も含む）
      scheduleContentWindowCenter();

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

    el.addEventListener("scroll", handleScroll, { passive: true });

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
  }, [detectCurrentScene, isAutoScrolling, dataId, emakiId]);

  // 中身マウント等で scrollWidth が変わったらシーン位置キャッシュを破棄し再構築
  useEffect(() => {
    const el = articleRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    let lastW = el.scrollWidth;
    let timer = null;
    const ro = new ResizeObserver(() => {
      const w = el.scrollWidth;
      if (Math.abs(w - lastW) < 2) return;
      lastW = w;
      if (sectionsCacheRef.current?.items) {
        sectionsCacheRef.current = null;
      }
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
    sectionsCacheRef,
    scrollDimsRef,
    liveSceneIndex,
    contentWindowCenter,
  };
};

export default useEmakiScroll;
