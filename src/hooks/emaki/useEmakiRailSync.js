import { useEffect, useRef } from "react";

// =============================================================================
// デバッグスイッチ
// 検証完了後は false にすることで、すべてのコンソール出力を一括で停止できます。
// =============================================================================
const DEBUG_RAIL_SYNC = true;

/**
 * カラー付きコンソールデバッグログ
 * @param {string} tag - イベント・処理名
 * @param {string} hypothesis - デバッグ仮説ID ("A" | "B" | "C" | "E")
 * @param {...any} args - 出力データ
 */
function logDebug(tag, hypothesis, ...args) {
  if (!DEBUG_RAIL_SYNC) return;
  const time = performance.now().toFixed(1);
  const badgeColor =
    hypothesis === "A"
      ? "#ef4444" // 赤: サプレス・ピン留め
      : hypothesis === "B"
      ? "#3b82f6" // 青: 先頭復帰
      : hypothesis === "C"
      ? "#10b981" // 緑: 境界判定
      : "#8b5cf6"; // 紫: 端点状態
  // デバッグ用 console.log をクリーンアップ
}

/**
 * useEmakiRailSync
 * 
 * 【責務】
 * ビューア（article）上のユーザー入力イベント（wheel / touch / pointerdown）を検知し、
 * 親コンポーネント（EmakiLandscapContent）のDiscoveryレール開閉コールバックと同期させる。
 * 
 * 【バグ1（無限開閉ループ）における関与】
 * 1. ユーザー自発スクロール時: notifyUserScroll 経由で onUserScrollStart() を呼び出し、レールをシアター化（閉じる）
 * 2. 先頭到達時: becameStart 判定で onReachStartBoundary() を呼び出し、レールを復帰（開く）
 * 3. 展開直後のピン留め: railPinFromExpandRef が有効な間、80px 以上の移動があるまで誤閉じ（onUserScrollStart）を抑止
 */
export const useEmakiRailSync = ({
  articleRef,
  isAtStart,
  isAtStartRef,
  isAtEnd,
  isAtEndRef,
  isAutoScrolling,
  isPlayMode,
  onUserScrollStart,
  onReachStartBoundary,
  theaterSuppressRef,
  railPinFromExpandRef,
  railPinScrollLeftRef,
  onLog,
}) => {
  // ---------------------------------------------------------------------------
  // 1. 参照管理（Refs）
  // ---------------------------------------------------------------------------
  // 前回レンダリング時の開始位置フラグ（先頭到達 transition 検出用）
  const prevAtStartRef = useRef(isAtStart);
  const touchStartPosRef = useRef(null);

  // ---------------------------------------------------------------------------
  // [フロー 1] ユーザー自発スクロール判定・通知関数
  // wheel, touchstart, pointerdown から共通で呼び出され、条件に応じて親コールバックを叩く
  // ---------------------------------------------------------------------------
  const notifyUserScroll = (e, source = "unknown") => {
    // 自動再生モード中や初期ナッジ中はレール開閉イベントを誘発させない
    if (isAutoScrolling || isPlayMode) return;

    // 【仮説A: サプレスガード】チラ見えクリック展開直後のクールダウン時間内であれば全スクロール通知を遮断
    const suppressed =
      theaterSuppressRef?.current &&
      Date.now() < theaterSuppressRef.current;
    if (suppressed) {
      const remainMs = Math.max(0, (theaterSuppressRef?.current || 0) - Date.now());
      logDebug("NotifyUserScroll:SuppressSkip", "A", { source, remainMs });
      if (typeof onLog === "function") {
        onLog(
          "notifyUserScroll",
          "theater-suppress-skip",
          { source, remainMs },
          "A"
        );
      }
      return;
    }

    // 【仮説A: ピン留めガード】展開直後のタッチ・ポインター操作による即時誤閉じを遮断
    if (
      railPinFromExpandRef?.current &&
      (source === "pointerdown" || source === "touchstart")
    ) {
      logDebug("NotifyUserScroll:PinSkip", "A", { source });
      if (typeof onLog === "function") {
        onLog(
          "notifyUserScroll",
          "rail-pin-skip-pointer-touch",
          { source },
          "A"
        );
      }
      return;
    }

    const wheelDelta = (e?.deltaX || 0) + (e?.deltaY || 0);
    const atStart = isAtStartRef.current;
    // 先頭位置でさらに右（RTLの巻き戻り方向）へスクロールしようとした場合は開く処理のみを叩く
    const reachBranch =
      source === "wheel" &&
      atStart &&
      wheelDelta >= 0 &&
      Boolean(onReachStartBoundary);

    // 【要件限定】サイドバーの下スライド（シアター化）は「絵巻進行方向（wheelDelta < 0）へのwheel操作」のみに限定
    const isForwardWheel = source === "wheel" && wheelDelta < 0;

    logDebug(
      reachBranch
        ? "NotifyUserScroll:ReachBoundary"
        : isForwardWheel
        ? "NotifyUserScroll:ScrollStart(WheelForward)"
        : "NotifyUserScroll:IgnoredNonWheel",
      reachBranch ? "C" : "A",
      {
        source,
        eventType: e?.type,
        wheelDelta,
        atStart,
        isAtEnd: isAtEndRef.current,
        reachBranch,
        isForwardWheel,
      }
    );

    if (typeof onLog === "function") {
      onLog(
        "notifyUserScroll",
        reachBranch
          ? "notify-reach-boundary"
          : isForwardWheel
          ? "notify-scroll-start"
          : "notify-ignored",
        {
          source,
          eventType: e?.type,
          wheelDelta,
          atStart,
          isAtEnd: isAtEndRef.current,
          reachBranch,
        },
        reachBranch ? "C" : "A"
      );
    }

    if (reachBranch) {
      onReachStartBoundary();
      return;
    }

    // 絵巻進行方向へのホイール操作時のみレールを閉じる（下にスライド）
    if (isForwardWheel && onUserScrollStart) {
      onUserScrollStart();
    }
  };

  // ---------------------------------------------------------------------------
  // [フロー 2] 先頭境界到達エフェクト
  // 先頭（右端）へ到達した瞬間（becameStart === true）にレールを再オープンする
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const becameStart = !prevAtStartRef.current && isAtStart;

    if (isAutoScrolling || isPlayMode || !onReachStartBoundary) {
      prevAtStartRef.current = isAtStart;
      return;
    }

    const suppressed =
      theaterSuppressRef?.current && Date.now() < theaterSuppressRef.current;

    if (becameStart && !suppressed) {
      logDebug("Effect:BecameStart -> onReachStartBoundary", "B", {
        isAtStart,
        isAutoScrolling,
        isPlayMode,
      });
      if (typeof onLog === "function") {
        onLog(
          "isAtStart-effect",
          "becameStart-onReachStartBoundary",
          { isAtStart, isAutoScrolling, isPlayMode },
          "B"
        );
      }
      onReachStartBoundary();
    }

    prevAtStartRef.current = isAtStart;
  }, [isAtStart, isAutoScrolling, isPlayMode, onReachStartBoundary, theaterSuppressRef, onLog]);

  // ---------------------------------------------------------------------------
  // [フロー 3] 端点状態監視エフェクト（ログ記録のみ維持、自動スライドは行わない）
  // ---------------------------------------------------------------------------
  useEffect(() => {
    logDebug("Effect:AtBoundaryUpdated", "E", { isAtStart, isAtEnd });
    if (typeof onLog === "function") {
      onLog(
        "isAtStart-state",
        "isAtStart-isAtEnd-updated",
        { isAtStart, isAtEnd },
        "E"
      );
    }
  }, [isAtStart, isAtEnd, onLog]);

  // ---------------------------------------------------------------------------
  // [フロー 4] DOM イベントハンドラ群（<article> にバインド）
  // ※ポインター押下やタッチによる誤スライドは排除
  // ---------------------------------------------------------------------------

  /**
   * article 上の pointerdown ハンドラ（レールスライドは誘発させない）
   */
  const handlePointerDown = () => {};

  /**
   * article 上の touchstart ハンドラ（開始座標のみ記録。touchmove ではレイアウトを変えない）
   */
  const handleTouchStart = (e) => {
    const t0 = e?.touches?.[0];
    if (!t0) {
      touchStartPosRef.current = null;
      return;
    }
    touchStartPosRef.current = { x: t0.clientX, y: t0.clientY };
  };

  /**
   * 指離し時のみ、RTL 進行方向への意図的横スワイプでシアター化を通知
   */
  const handleTouchEnd = (e) => {
    const start = touchStartPosRef.current;
    touchStartPosRef.current = null;

    if (isAutoScrolling || isPlayMode || !start) return;

    const suppressed =
      theaterSuppressRef?.current && Date.now() < theaterSuppressRef.current;
    if (suppressed) return;

    const end = e?.changedTouches?.[0];
    if (!end) return;

    const dx = end.clientX - start.x;
    const dy = end.clientY - start.y;
    const isHorizontalSwipe =
      Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy) * 1.2;

    if (!isHorizontalSwipe) return;

    logDebug("TouchEnd:HorizontalSwipe -> onUserScrollStart", "A", {
      dx,
      dy,
      atStart: isAtStartRef.current,
    });

    onUserScrollStart?.();
  };

  /**
   * article 上の wheel ハンドラ
   * チラ見えクリックによる展開直後、80px 以上の有意な移動があるまで閉じを保留（ピン留め制御）
   */
  const handleWheel = (e) => {
    if (railPinFromExpandRef?.current) {
      const el = articleRef.current;
      const current = el?.scrollLeft ?? 0;
      const baseline = railPinScrollLeftRef?.current ?? 0;
      const moved = Math.abs(current - baseline);

      // 80px 未満のスクロールは展開直後の慣性とみなし、レール閉じを抑止
      if (moved < 80) {
        logDebug("Wheel:PinBelowThresholdSkip", "A", {
          deltaX: e.deltaX,
          deltaY: e.deltaY,
          current,
          baseline,
          moved,
        });
        if (typeof onLog === "function") {
          onLog(
            "onWheel",
            "rail-pin-below-threshold-skip",
            {
              deltaX: e.deltaX,
              deltaY: e.deltaY,
              current,
              baseline,
              moved,
            },
            "A"
          );
        }
        return;
      }

      // 80px 以上動いた時点でピン留め解除
      railPinFromExpandRef.current = false;
      logDebug("Wheel:PinThresholdMetClose", "A", { current, baseline, moved });
      if (typeof onLog === "function") {
        onLog(
          "onWheel",
          "rail-pin-threshold-met-close",
          { current, baseline, moved },
          "A"
        );
      }
    }
    notifyUserScroll(e, "wheel");
  };

  return {
    notifyUserScroll,
    handlePointerDown,
    handleTouchStart,
    handleTouchEnd,
    handleWheel,
  };
};

export default useEmakiRailSync;