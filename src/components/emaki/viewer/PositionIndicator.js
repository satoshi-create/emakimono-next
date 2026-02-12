import { useEffect, useState } from "react";
import styles from "@/styles/PositionIndicator.module.css";

const PositionIndicator = ({ indicatorElRef, isScrolling, isUIVisible }) => {
  const [visible, setVisible] = useState(false);

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
          ref={indicatorElRef}
          className={styles.indicator}
        />
      </div>
    </div>
  );
};

export default PositionIndicator;
