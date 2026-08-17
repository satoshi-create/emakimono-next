/**
 * スクロール処理 + 現在シーン検出。
 *
 * - handleScroll: 端点判定・スクロール位置保存・インジケータ更新・シーン検出 debounce
 * - detectCurrentScene: スクロール位置から現在表示中のシーンを特定（navIndex 更新）
 * - パフォーマンス: getBoundingClientRect は初回のみ、scrollWidth/clientWidth は1秒間隔でキャッシュ
 * - 自動再生中は setState を抑制し、800ms間隔でシーン検出のみ行う
 *
 * 抽出元: EmakiConteiner.js の detectCurrentScene (useCallback) + handleScroll effect。
 * useEmakiSceneDetection と useEmakiScroll は共有 ref が多いため1つに統合。
 * sectionsCacheRef / scrollDimsRef は呼び出し側（絵巻切替リセット effect）で
 * 操作する必要があるため戻り値で公開する。
 */
import { useCallback, useEffect, useRef } from "react";
import {
  trackManualScroll,
  handleSceneChange,
  updateEngagementState,
  updateScrollProgress,
} from "@/libs/api/measurementUtils";

const useEmakiScroll = ({
  articleRef,
  dataId,
  emakiId,
  navIndex,
  setnavIndex,
  setLiveSceneIndex,
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
}) => {
  // 絵巻ハイパーリンク: シーン検出用の debounce タイマー + throttle
  const sceneDetectionTimerRef = useRef(null);
  const lastSceneDetectionTimeRef = useRef(0); // throttle用タイムスタンプ

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

  const detectCurrentScene = useCallback(() => {
    const el = articleRef.current;
    if (!el) return;

    // 初回: セクション位置をキャッシュ（getBoundingClientRect は1回だけ）
    // items プロパティの存在もチェック（HMRで旧形式キャッシュが残る場合の対策）
    if (!sectionsCacheRef.current?.items) {
      const sections = Array.from(el.querySelectorAll("section[id]"));
      if (sections.length === 0) return;

      const containerRight = el.getBoundingClientRect().right;
      const baseScrollLeft = el.scrollLeft;

      sectionsCacheRef.current = {
        baseScrollLeft,
        items: sections.map((section) => ({
          id: parseInt(section.id, 10),
          // コンテナ右端からのオフセット（スクロール位置に依存しない定数）
          offset: section.getBoundingClientRect().right - containerRight,
        })),
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
      // 計測: シーン遷移・滞在（スクロール検出による）
      handleSceneChange(emakiId, closestId, "scroll_detect");
      // 計測: セッション鑑賞サマリー用の状態更新
      updateEngagementState(emakiId, closestId, toggleFullscreen);

      lastDetectedSceneRef.current = closestId;

      // 自動再生中はツリー全体（数十枚の next/image）の再レンダーを避けるため
      // navIndex は更新しない（停止時に lastDetectedSceneRef から同期）。
      // ただし解説バー（SceneCommentaryBar）の段タイトルはローカル state
      // liveSceneIndex で追従させる（画像ツリーへ再レンダーを波及させない）。
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
      // 解説バー追従値も同期（navIndex と同値に保つ）
      setLiveSceneIndex(closestId);
      // フラグを解除（scrollDialog の処理が完了するまで少し待つ）
      setTimeout(() => {
        if (isScrollDetectedUpdateRef) {
          isScrollDetectedUpdateRef.current = false;
        }
      }, 100);
    }
    // isAutoScrolling: 初回ナッジ中のガード（return）を確実に反映するため依存に含める
    // （含めないとクロージャが古い値 false を捕捉し、ナッジ中も setnavIndex が走る）
  }, [setnavIndex, isScrollDetectedUpdateRef, dataId, emakiId, isAutoScrolling]);

  // パフォーマンス: scrollWidth/clientWidth のキャッシュ
  // 自動再生中は値が変化しないため、毎フレームのレイアウト読み取りを回避
  const scrollDimsRef = useRef({ w: 0, c: 0, ts: 0 });

  useEffect(() => {
    if (!articleRef.current) return;
    const el = articleRef.current;
    const handleScroll = () => {
      const currentScrollX = el.scrollLeft;

      // scrollWidth/clientWidth: 1秒間隔でキャッシュ更新
      // 自動再生中はコンテンツサイズが不変のため、毎フレームの読み取りは不要
      const now = Date.now();
      if (now - scrollDimsRef.current.ts > 1000) {
        scrollDimsRef.current = { w: el.scrollWidth, c: el.clientWidth, ts: now };
      }
      const scrollWidth = scrollDimsRef.current.w || el.scrollWidth;
      const clientWidth = scrollDimsRef.current.c || el.clientWidth;

      // 教育現場向けUI: 端点判定（操作手段に依存しない）
      // RTL環境では scrollLeft が負の値になるため、絶対値で判定
      const SCROLL_MARGIN = 5; // ピクセル誤差を許容
      const maxScrollLeft = scrollWidth - clientWidth;

      // P0改修: スクロール位置を常に保存（フルスクリーン切り替え時の復元用）
      // ただし、復元中は保存をスキップ（上書き防止）
      if (maxScrollLeft > 0 && !scrollPositionStore.isTransitioning) {
        scrollPositionStore.scrollLeft = currentScrollX;
        scrollPositionStore.scrollRatio = Math.abs(currentScrollX) / maxScrollLeft;
        scrollPositionStore.emakiId = dataId;
        scrollPositionStore.restored = false;
        // 計測: セッション最大スクロール到達率を更新
        updateScrollProgress(scrollPositionStore.scrollRatio);
      }

      // 教育現場向けUI: 現在地インジケータ用の進行度を計算
      // パフォーマンス: DOM直接操作でReact再レンダリングを完全に回避
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

      const isAutoPlay = isAutoScrolling || playModeAnimationRef.current;

      // スクロール停止検出 + debounce: 自動再生中はタイマーチャーンを回避
      // 自動再生中は毎フレーム clearTimeout+setTimeout（120回/秒）が不要
      if (!isAutoPlay) {
        // 手動スクロール: 停止検出タイマー（1.5秒後に isScrolling = false）
        if (scrollingTimerRef.current) {
          clearTimeout(scrollingTimerRef.current);
        }
        scrollingTimerRef.current = setTimeout(() => {
          isScrollingRef.current = false;
          setIsScrolling(false);
        }, 1500);

        // 手動スクロール: debounce で最終シーン検出（150ms後）
        if (sceneDetectionTimerRef.current) {
          clearTimeout(sceneDetectionTimerRef.current);
        }
        sceneDetectionTimerRef.current = setTimeout(() => {
          lastSceneDetectionTimeRef.current = Date.now();
          detectCurrentScene();
        }, 150);
      }

      // 開始位置判定: scrollLeft が 0 または正の最大値（RTL環境考慮）
      const atStart =
        Math.abs(currentScrollX) < SCROLL_MARGIN ||
        currentScrollX >= maxScrollLeft - SCROLL_MARGIN;

      // 終了位置判定: scrollLeft が負の最大値または 0 付近（RTL環境考慮）
      const atEnd =
        Math.abs(currentScrollX) >= maxScrollLeft - SCROLL_MARGIN ||
        (currentScrollX < 0 &&
          Math.abs(currentScrollX) >= maxScrollLeft - SCROLL_MARGIN);

      // 状態更新（変化がある場合のみ）
      // 自動再生中は setState を抑制（リスナー再登録・再レンダーによるカクつき防止）
      if (atStart !== isAtStartRef.current) {
        isAtStartRef.current = atStart;
        if (!isAutoPlay) {
          setIsAtStart(atStart);
        }
      }
      if (atEnd !== isAtEndRef.current) {
        isAtEndRef.current = atEnd;
        if (!isAutoPlay) {
          setIsAtEnd(atEnd);
        }
      }

      // 絵巻ハイパーリンク: 自動再生中のシーン検出（800ms間隔）
      // スクロールハンドラ内で同期実行（rAFに遅延するとauto-playの
      // scrollToと同一フレーム内で競合しレイアウトスラッシングが悪化するため）
      if (isAutoPlay) {
        if (now - lastSceneDetectionTimeRef.current > 800) {
          lastSceneDetectionTimeRef.current = now;
          detectCurrentScene();
        }
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

  return { sectionsCacheRef, scrollDimsRef };
};

export default useEmakiScroll;
