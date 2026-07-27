import styles from "@/styles/ScrollFeedbackEndPrompt.module.css";
import { useTranslation } from "next-i18next";

const ScrollFeedbackEndPrompt = ({
  isVisible,
  onOpen,
  onDismiss,
}) => {
  const { t } = useTranslation("common");

  return (
    <div
      className={`${styles.prompt} ${isVisible ? "" : styles.hidden}`}
      role="status"
      aria-live="polite"
    >
      <p className={styles.text}>{t("scrollFeedback.endPrompt")}</p>
      <button type="button" className={styles.openBtn} onClick={onOpen}>
        {t("scrollFeedback.open")}
      </button>
      <button
        type="button"
        className={styles.closeBtn}
        onClick={onDismiss}
        aria-label={t("scrollFeedback.dismiss")}
      >
        ×
      </button>
    </div>
  );
};

export default ScrollFeedbackEndPrompt;
