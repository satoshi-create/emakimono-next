import { useEffect, useState } from "react";
import styles from "@/styles/WheelScrollIndicator.module.css";

const WheelScrollIndicator = ({ showToast, onToastComplete }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (showToast && window.innerWidth >= 768) {
      setIsVisible(true);

      const timer = setTimeout(() => {
        setIsVisible(false);
        onToastComplete?.();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [showToast, onToastComplete]);

  if (!isVisible) return null;

  return (
    <div className={styles.toastContainer}>
      <div className={styles.toast}>
        <div>横スクロールで移動します</div>
        <div className={styles.subText}>縦スクロール: 絵巻の外へカーソルを移動</div>
      </div>
    </div>
  );
};

export default WheelScrollIndicator;
