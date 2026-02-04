import { useEffect, useState } from "react";
import styles from "@/styles/WheelScrollIndicator.module.css";
import { useTranslation } from "next-i18next";

const WheelScrollIndicator = ({ showToast, onToastComplete }) => {
  const { t } = useTranslation("common");
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
        <div>{t("viewer.horizontalScrollHint")}</div>
        <div className={styles.subText}>{t("viewer.verticalScrollHint")}</div>
      </div>
    </div>
  );
};

export default WheelScrollIndicator;
