import { useCallback, useEffect, useRef, useState } from "react";

// =============================================================================
// デバッグスイッチ
// 検証完了後は false にすることで、すべてのコンソール出力を一括で停止できます。
// =============================================================================
const DEBUG_RAIL_STATE = true;

/**
 * カラー付きコンソールデバッグログ
 * @param {string} tag - イベント・処理名
 * @param {string} hypothesis - デバッグ仮説ID ("A" | "B" | "D")
 * @param {...any} args - 出力データ
 */
function logDebug(tag, hypothesis, ...args) {
  if (!DEBUG_RAIL_STATE) return;
  const time = performance.now().toFixed(1);
  const badgeColor =
    hypothesis === "A"
      ? "#ec4899" // ピンク: サプレス・ピン留め・クリック展開
      : hypothesis === "B"
      ? "#3b82f6" // 青: クールダウン・境界復帰
      : "#10b981"; // 緑: 状態変更（D）
  // デバッグ用 console.log をクリーンアップ
}

/**
 * useViewerDiscoveryRailState
 * 
 * 【責務】
 * 鑑賞画面におけるDiscoveryレール（サイドバー）の開閉状態（railOpen）の唯一の所有者。
 * チラ見え時クリック展開、スクロール開始時のシアター化、開閉チャタリング防止用のサプレス（1200ms）を統括する。
 * 
 * 【バグ1（無限開閉ループ）における関与】
 * - onUserScrollStart（閉じる）と onReachStartBoundary（開く）のクールダウン時間（RAIL_DISMISS_REOPEN_COOLDOWN_MS）を制御
 * - aside クリック時の armRailTheaterSuppress() によるスクロール抑止タイムスタンプ発行
 */
export const useViewerDiscoveryRailState = ({
  viewerFullscreen = false,
  articleRef,
  onLog,
}) => {
  // ---------------------------------------------------------------------------
  // 1. 状態管理（State）
  // ---------------------------------------------------------------------------
  // レールの開閉状態（true: 2列表示 / false: シアター全幅モード）
  const [railOpen, setRailOpen] = useState(true);

  // ---------------------------------------------------------------------------
  // 2. 定数定義（Constants）
  // ---------------------------------------------------------------------------
  // CSS transition（0.42s）およびレイアウト安定待ち時間（ミリ秒）
  const RAIL_THEATER_SUPPRESS_MS = 1200;
  // スクロールで閉じた直後の誤再オープン抑止時間（ミリ秒）
  const RAIL_DISMISS_REOPEN_COOLDOWN_MS = 1200;

  // ---------------------------------------------------------------------------
  // 3. 参照管理（Refs）- 再レンダリングをトリガーしない値の保持
  // ---------------------------------------------------------------------------
  const suppressRailTheaterRef = useRef(0);
  const railPinFromExpandRef = useRef(false);
  const railPinScrollLeftRef = useRef(0);
  const railOpenRef = useRef(railOpen);
  const theaterDismissedAtRef = useRef(0);
  const lastScrollCloseNotifyRef = useRef(0);
  const expandClickGuardUntilRef = useRef(0);

  // レンダリング間での最新 state の参照同期
  useEffect(() => {
    railOpenRef.current = railOpen;
    logDebug("State:RailOpenChanged", "D", { railOpen, viewerFullscreen });
  }, [railOpen, viewerFullscreen]);

  // ---------------------------------------------------------------------------
  // [ヘルパー関数] サプレスタイマーの武装
  // ---------------------------------------------------------------------------
  const armRailTheaterSuppress = useCallback(() => {
    const until = Date.now() + RAIL_THEATER_SUPPRESS_MS;
    suppressRailTheaterRef.current = until;
    logDebug("ArmSuppress", "A", { suppressUntil: until, durationMs: RAIL_THEATER_SUPPRESS_MS });
  }, [RAIL_THEATER_SUPPRESS_MS]);

  // ---------------------------------------------------------------------------
  // [フロー 1] スクロール開始通知ハンドラ（子 hook から呼ばれる）
  // レールが開いている場合、シアターモードへ遷移（railOpen: false）
  // ---------------------------------------------------------------------------
  const onUserScrollStart = useCallback(() => {
    const suppressed = Date.now() < suppressRailTheaterRef.current;
    const now = Date.now();
    const suppressRemainMs = Math.max(0, suppressRailTheaterRef.current - now);
    const debounceRemainMs = Math.max(0, 120 - (now - lastScrollCloseNotifyRef.current));

    logDebug("Callback:ScrollStart", "A", {
      railOpen: railOpenRef.current,
      suppressed,
      suppressRemainMs,
      debounceRemainMs,
      viewerFullscreen,
    });

    if (typeof onLog === "function") {
      onLog(
        "onUserScrollStart",
        suppressed ? "scroll-close-suppressed" : "scroll-close-attempt",
        {
          railOpen: railOpenRef.current,
          suppressed,
          suppressRemainMs,
          debounceRemainMs,
        },
        "A"
      );
    }

    // サプレスガードまたは全画面時は閉じる動作を遮断
    if (suppressed) return;
    if (!railOpenRef.current || viewerFullscreen) return;

    // 120ms 以内の連打はデバウンス
    if (now - lastScrollCloseNotifyRef.current < 120) return;

    lastScrollCloseNotifyRef.current = now;
    theaterDismissedAtRef.current = now;
    railPinFromExpandRef.current = false;

    logDebug("Action:CloseRail -> TheaterMode", "A");
    setRailOpen(false);
  }, [viewerFullscreen, onLog]);

  // ---------------------------------------------------------------------------
  // [フロー 2] 先頭境界到達通知ハンドラ（子 hook から呼ばれる）
  // シアターモードである場合、レールを再展開（railOpen: true）
  // ---------------------------------------------------------------------------
  const onReachStartBoundary = useCallback(() => {
    const suppressed = Date.now() < suppressRailTheaterRef.current;
    const now = Date.now();
    const dismissCooldown = now - theaterDismissedAtRef.current < RAIL_DISMISS_REOPEN_COOLDOWN_MS;
    const suppressRemainMs = Math.max(0, suppressRailTheaterRef.current - now);

    logDebug("Callback:ReachBoundary", "B", {
      railOpen: railOpenRef.current,
      suppressed,
      dismissCooldown,
      suppressRemainMs,
      viewerFullscreen,
    });

    if (typeof onLog === "function") {
      onLog(
        "onReachStartBoundary",
        suppressed
          ? "boundary-open-suppressed"
          : dismissCooldown
            ? "boundary-open-dismiss-cooldown"
            : "boundary-open-attempt",
        {
          railOpen: railOpenRef.current,
          suppressed,
          dismissCooldown,
          suppressRemainMs,
        },
        "B"
      );
    }

    if (suppressed || dismissCooldown) return;

    if (!railOpenRef.current && !viewerFullscreen) {
      logDebug("Action:OpenRail -> ReopenFromBoundary", "B");
      setRailOpen(true);
    }
  }, [viewerFullscreen, RAIL_DISMISS_REOPEN_COOLDOWN_MS, onLog]);

  // ---------------------------------------------------------------------------
  // [フロー 3] aside（レール要素）のイベントハンドラ群
  // ---------------------------------------------------------------------------

  /**
   * レール展開を実行する共通処理
   */
  const triggerExpand = useCallback(
    (triggerSource) => {
      if (railOpenRef.current) return;
      const currentLeft = articleRef?.current?.scrollLeft ?? 0;
      logDebug(`DOM:${triggerSource}:Triggered`, "A", {
        railOpen: railOpenRef.current,
        currentScrollLeft: currentLeft,
      });

      armRailTheaterSuppress();
      expandClickGuardUntilRef.current = Date.now() + 550;
      theaterDismissedAtRef.current = 0;
      railPinFromExpandRef.current = true;
      railPinScrollLeftRef.current = currentLeft;

      if (typeof onLog === "function") {
        onLog(
          "aside",
          "aside-click-expand",
          {
            railOpen: false,
            pinScrollLeft: currentLeft,
            triggerSource,
          },
          "A"
        );
      }
      logDebug("Action:OpenRail -> Expanded", "A", { pinScrollLeft: currentLeft });
      setRailOpen(true);
    },
    [armRailTheaterSuppress, articleRef, onLog]
  );

  /**
   * aside の onPointerDown ハンドラ
   * シアター時、clickイベント消失対策として即座に展開を実行
   */
  const handleRailPointerDown = useCallback(
    (e) => {
      // 内部のリンクやボタン（aタグ等）をクリックした場合は誤展開を防ぐ
      if (e?.target?.closest("a, button")) return;

      logDebug("DOM:PointerDown", "A", { railOpen: railOpenRef.current });
      if (!railOpenRef.current) {
        e?.preventDefault?.();
        e?.stopPropagation?.();
        triggerExpand("PointerDown");
      }
    },
    [triggerExpand]
  );

  /**
   * aside の onClick ハンドラ（キーボード操作やフォールバック用）
   */
  const handleRailClick = useCallback(
    (e) => {
      if (e?.target?.closest("a, button")) return;
      if (!railOpenRef.current) {
        e?.preventDefault?.();
        e?.stopPropagation?.();
        triggerExpand("Click");
      }
    },
    [triggerExpand]
  );

  const toggleRail = useCallback(() => {
    if (railOpenRef.current) {
      armRailTheaterSuppress();
      theaterDismissedAtRef.current = Date.now();
      railPinFromExpandRef.current = false;
      setRailOpen(false);
    } else {
      triggerExpand("Toggle");
    }
  }, [armRailTheaterSuppress, triggerExpand, railPinFromExpandRef]);

  return {
    railOpen,
    setRailOpen,
    suppressRailTheaterRef,
    expandClickGuardUntilRef,
    railPinFromExpandRef,
    railPinScrollLeftRef,
    onUserScrollStart,
    onReachStartBoundary,
    handleRailPointerDown,
    handleRailClick,
    toggleRail,
  };
};

export default useViewerDiscoveryRailState;