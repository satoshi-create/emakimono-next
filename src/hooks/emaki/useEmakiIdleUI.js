/**
 * 静止UI耐性（Idle UI）: 長時間無操作時にナビUIを非表示にする。
 *
 * - PC (1024px以上): 5秒 / Tablet/Mobile: 3秒で非表示
 * - マウス移動・ホイール・タッチ・クリック・キーボードで即座に復帰
 * - 初回ナッジ・▶再生中は非表示にしない（再生中の React 再レンダーを避ける）
 * - 計測: trackUIHidden / trackUIRevealed を発火
 *
 * 抽出元: EmakiConteiner.js の「静止UI耐性」useEffect。
 * 戻り値の showUI は、再生モード停止・ホイール操作による停止時の UI 復帰に使う。
 */
import { useEffect, useRef, useState } from "react";
import { trackUIHidden, trackUIRevealed } from "@/libs/api/measurementUtils";

const useEmakiIdleUI = ({ emakiId, isAutoScrolling, isPlayMode }) => {
  const [isUIVisible, setIsUIVisible] = useState(true); // UI表示状態
  const idleTimeoutRef = useRef(null); // 無操作タイマー
  // 計測用: タイマー開始時刻を記録
  const idleStartTimeRef = useRef(Date.now());
  const wasUIHiddenRef = useRef(false); // UI非表示状態だったかを記録

  useEffect(() => {
    // デバイス幅に応じた無操作タイムアウト時間
    // PC (1024px以上): 5秒、Tablet/Mobile: 3秒
    const getIdleTimeout = () => {
      const width = window.innerWidth;
      return width >= 1024 ? 5000 : 3000;
    };

    // タイマーのクリア
    const clearIdleTimer = () => {
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
        idleTimeoutRef.current = null;
      }
    };

    // タイマーの開始
    const startIdleTimer = () => {
      clearIdleTimer();
      idleStartTimeRef.current = Date.now(); // 計測用: タイマー開始時刻を記録
      const idleTimeout = getIdleTimeout();
      idleTimeoutRef.current = setTimeout(() => {
        if (!isAutoScrolling && !isPlayMode) {
          // 計測: UI非表示
          trackUIHidden(emakiId, idleTimeout);
          wasUIHiddenRef.current = true;
          setIsUIVisible(false);
        }
      }, idleTimeout);
    };

    // ユーザー操作検出時の処理（トリガー種別付き）
    const handleUserActivityWithType = (triggerType) => {
      // 計測: UI再表示（非表示状態からの復帰時のみ）
      if (wasUIHiddenRef.current) {
        trackUIRevealed(emakiId, triggerType);
        wasUIHiddenRef.current = false;
      }
      // UIを即座に表示
      setIsUIVisible(true);
      // タイマーをリセット
      startIdleTimer();
    };

    // 各イベント種別のハンドラー
    const handleMousemove = () => handleUserActivityWithType("mousemove");
    const handleWheel = () => handleUserActivityWithType("wheel");
    const handleTouchstart = () => handleUserActivityWithType("touch");
    const handleClick = () => handleUserActivityWithType("click");
    const handleKeydown = () => handleUserActivityWithType("keydown");

    // 初回ナッジ・▶再生中はタイマーを止め UI を表示したままにする
    if (isAutoScrolling || isPlayMode) {
      clearIdleTimer();
    } else {
      startIdleTimer();
    }

    // イベントリスナーの登録
    // マウス移動、ホイール、タッチ、クリック、キーボード操作を検出
    window.addEventListener("mousemove", handleMousemove);
    window.addEventListener("wheel", handleWheel, { passive: true });
    window.addEventListener("touchstart", handleTouchstart, { passive: true });
    window.addEventListener("click", handleClick);
    window.addEventListener("keydown", handleKeydown);

    // クリーンアップ
    return () => {
      clearIdleTimer();
      window.removeEventListener("mousemove", handleMousemove);
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchstart);
      window.removeEventListener("click", handleClick);
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [isAutoScrolling, isPlayMode, emakiId]); // 依存配列: 自動スクロール・再生モード状態の変化を監視

  /** 外部（再生モード停止・ホイール停止）からの UI 復帰 */
  const showUI = () => setIsUIVisible(true);

  return { isUIVisible, showUI };
};

export default useEmakiIdleUI;
