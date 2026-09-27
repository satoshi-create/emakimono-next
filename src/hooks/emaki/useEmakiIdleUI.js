/**
 * 静止UI耐性（Idle UI）: 長時間無操作時にナビUIを非表示にする。
 *
 * - PC (1024px以上): 5秒 / Tablet/Mobile: 3秒で非表示
 * - マウス移動・ホイール・タッチ・クリック・キーボードで即座に復帰
 * - 初回ナッジ（自動スクロール）中は非表示にしない
 * - idlePaused（絵引チップ／詳細シート操作中）はタイマー停止＋UI維持
 * - 計測: trackUIHidden / trackUIRevealed を発火
 *
 * 抽出元: EmakiConteiner.js の「静止UI耐性」useEffect。
 * 戻り値の showUI は、再生モード停止・ホイール操作による停止時の UI 復帰に使う。
 * resetIdleTimer は外部（絵引チップ操作など）からのタイマー再スタート用。
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { trackUIHidden, trackUIRevealed } from "@/libs/api/measurementUtils";

const useEmakiIdleUI = ({
  emakiId,
  isAutoScrolling,
  isPlayMode,
  idlePaused = false,
}) => {
  const [isUIVisible, setIsUIVisible] = useState(true);
  const idleTimeoutRef = useRef(null);
  const idleStartTimeRef = useRef(Date.now());
  const wasUIHiddenRef = useRef(false);
  const startIdleTimerRef = useRef(() => {});

  useEffect(() => {
    const getIdleTimeout = () => {
      const width = window.innerWidth;
      return width >= 1024 ? 5000 : 3000;
    };

    const clearIdleTimer = () => {
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
        idleTimeoutRef.current = null;
      }
    };

    const startIdleTimer = () => {
      clearIdleTimer();
      // 絵引開閉・詳細シート中 / 初回ナッジ中はタイマーを動かさない
      if (idlePaused || isAutoScrolling) return;
      idleStartTimeRef.current = Date.now();
      const idleTimeout = getIdleTimeout();
      idleTimeoutRef.current = setTimeout(() => {
        if (!isAutoScrolling && !idlePaused) {
          trackUIHidden(emakiId, idleTimeout);
          wasUIHiddenRef.current = true;
          setIsUIVisible(false);
        }
      }, idleTimeout);
    };

    startIdleTimerRef.current = startIdleTimer;

    const handleUserActivityWithType = (triggerType) => {
      if (wasUIHiddenRef.current) {
        trackUIRevealed(emakiId, triggerType);
        wasUIHiddenRef.current = false;
      }
      setIsUIVisible(true);
      startIdleTimer();
    };

    const handleMousemove = () => handleUserActivityWithType("mousemove");
    const handleWheel = () => handleUserActivityWithType("wheel");
    const handleTouchstart = () => handleUserActivityWithType("touch");
    const handleClick = () => handleUserActivityWithType("click");
    const handleKeydown = () => handleUserActivityWithType("keydown");

    if (idlePaused || isAutoScrolling) {
      clearIdleTimer();
      if (idlePaused) setIsUIVisible(true);
    } else {
      startIdleTimer();
    }

    window.addEventListener("mousemove", handleMousemove);
    window.addEventListener("wheel", handleWheel, { passive: true });
    window.addEventListener("touchstart", handleTouchstart, { passive: true });
    window.addEventListener("click", handleClick);
    window.addEventListener("keydown", handleKeydown);

    return () => {
      clearIdleTimer();
      window.removeEventListener("mousemove", handleMousemove);
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchstart);
      window.removeEventListener("click", handleClick);
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [isAutoScrolling, isPlayMode, emakiId, idlePaused]);

  const showUI = () => setIsUIVisible(true);

  /** 絵引チップ操作など、外部からの明示的なアイドルリセット */
  const resetIdleTimer = useCallback(() => {
    wasUIHiddenRef.current = false;
    setIsUIVisible(true);
    startIdleTimerRef.current();
  }, []);

  return { isUIVisible, showUI, resetIdleTimer };
};

export default useEmakiIdleUI;
