import { useEffect, useState } from "react";
import styles from "@/styles/PositionIndicator.module.css";

const PositionIndicator = ({ scrollRatio, isScrolling, isUIVisible }) => {
  const [visible, setVisible] = useState(false);

  // デバッグ: コンポーネントがマウントされているか確認
  useEffect(() => {
    console.log("[PositionIndicator] マウントされました");
  }, []);

  // デバッグ: props の変化を監視
  useEffect(() => {
    console.log("[PositionIndicator] scrollRatio:", scrollRatio, "isScrolling:", isScrolling, "isUIVisible:", isUIVisible, "visible:", visible);
  }, [scrollRatio, isScrolling, isUIVisible, visible]);

  // 教育現場向けUI: 静止UI耐性と連動
  // スクロール中 かつ UI表示中の場合のみ表示
  useEffect(() => {
    if (isScrolling && isUIVisible) {
      setVisible(true);
    } else {
      // スクロール停止後、即座に非表示
      const timer = setTimeout(() => setVisible(false), 50);
      return () => clearTimeout(timer);
    }
  }, [isScrolling, isUIVisible]);

  // scrollRatio を 0〜1 にクランプ
  const ratio = Math.max(0, Math.min(1, scrollRatio));

  // インジケータ位置計算（背景トラック内での相対位置）
  // レスポンシブ対応: モバイル 120px/8px、デスクトップ 180px/12px
  const isDesktop = typeof window !== "undefined" && window.innerWidth >= 1024;
  const TRACK_WIDTH = isDesktop ? 180 : 120;
  const INDICATOR_SIZE = isDesktop ? 12 : 8;
  const moveRange = TRACK_WIDTH - INDICATOR_SIZE;
  // 絵巻は右から左へスクロールするため、ratio を反転
  // ratio=0（開始位置/右端）→ position=moveRange（右端）
  // ratio=1（終了位置/左端）→ position=0（左端）
  const position = (1 - ratio) * moveRange;

  return (
    <div
      className={styles.container}
      style={{
        opacity: visible ? 0.5 : 0,
        transition: visible ? "opacity 0.2s ease-in" : "opacity 0.4s ease-out",
        pointerEvents: "none", // 一切の操作を受け付けない
      }}
    >
      <div className={styles.track}>
        <div
          className={styles.indicator}
          style={{ transform: `translateX(${position}px) translateY(-50%)` }}
        />
      </div>
    </div>
  );
};

export default PositionIndicator;
