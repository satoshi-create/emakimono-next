import { useEffect, useState } from "react";
import styles from "@/styles/WheelScrollIndicator.module.css";

const WheelScrollIndicator = ({ dataId, autoScrollStopped }) => {
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    console.log('[WheelScrollIndicator] useEffect実行:', {
      dataId,
      autoScrollStopped,
      timestamp: new Date().toISOString()
    });

    const keyName = `wheel_indicator_${dataId}`;
    const alreadyShown = sessionStorage.getItem(keyName);

    // 既に表示済み、またはモバイルデバイスの場合は表示しない
    if (alreadyShown || window.innerWidth < 768) {
      console.log('[WheelScrollIndicator] 表示スキップ:', { alreadyShown, width: window.innerWidth });
      return;
    }

    // 自動スクロールが停止してから0.5秒後に表示
    if (autoScrollStopped) {
      console.log('[WheelScrollIndicator] 表示処理開始（0.5秒後）');
      const timerId = setTimeout(() => {
        console.log('[WheelScrollIndicator] アイコン表示');
        setShowIndicator(true);
        sessionStorage.setItem(keyName, 'true');

        // 2.5秒後に自動消滅
        setTimeout(() => {
          console.log('[WheelScrollIndicator] アイコン非表示');
          setShowIndicator(false);
        }, 2500);
      }, 500);

      return () => {
        console.log('[WheelScrollIndicator] クリーンアップ実行');
        clearTimeout(timerId);
      };
    } else {
      console.log('[WheelScrollIndicator] autoScrollStopped = false のため待機中');
    }
  }, [dataId, autoScrollStopped]);

  if (!showIndicator) return null;

  return (
    <div className={styles.indicatorContainer}>
      <div className={styles.wheelWrapper}>
        {/* ホイールアイコン（上下に動く） */}
        <div className={styles.wheelIcon}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="9" y="6" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="1.5"/>
            <circle className={styles.wheelScroll} cx="12" cy="10" r="1.5" fill="currentColor">
              <animate attributeName="cy" values="10;14;10" dur="1.5s" repeatCount="indefinite"/>
            </circle>
          </svg>
        </div>

        {/* 左右矢印（ホイールの動きに連動） */}
        <div className={styles.arrowsWrapper}>
          <div className={styles.arrowLeft}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite"/>
              </path>
            </svg>
          </div>
          <div className={styles.arrowRight}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite"/>
              </path>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WheelScrollIndicator;
