import ShareButtons from "@/components/emaki/viewer/ShareButtons";
import {
  dismissFeedback,
  getScrollEndFeedbackKey,
} from "@/libs/api/scrollFeedbackSession";
import styles from "@/styles/ScrollFeedbackEndPrompt.module.css";
import { useTranslation } from "next-i18next";

/**
 * 巻末プル導線: 共有・フィードバック（巻いいねはナビに集約）
 */
const ScrollFeedbackEndPrompt = ({
  isVisible,
  onOpenFeedback,
  onDismiss,
  emakiId,
  shareTitle,
  navIndex = 0,
  showFeedback = true,
}) => {
  const { t } = useTranslation("common");

  const handleDismiss = () => {
    dismissFeedback(getScrollEndFeedbackKey(emakiId));
    onDismiss?.();
  };

  return (
    <div
      className={`${styles.prompt} ${isVisible ? "" : styles.hidden}`}
      role="status"
      aria-live="polite"
    >
      <p className={styles.text}>{t("scrollFeedback.endPrompt")}</p>
      <div className={styles.actions}>
        <ShareButtons
          variant="cta"
          navIndex={navIndex}
          emakiId={emakiId}
          shareTitle={shareTitle}
        />
        {showFeedback && (
          <button type="button" className={styles.openBtn} onClick={onOpenFeedback}>
            {t("scrollFeedback.open")}
          </button>
        )}
      </div>
      <button
        type="button"
        className={styles.closeBtn}
        onClick={handleDismiss}
        aria-label={t("scrollFeedback.dismiss")}
      >
        ×
      </button>
    </div>
  );
};

export default ScrollFeedbackEndPrompt;
