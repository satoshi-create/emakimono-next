import styles from "@/styles/ViewerPullPrompt.module.css";
import { useTranslation } from "next-i18next";

/**
 * Mid-session / end pull CTAs (share copy, mid feedback).
 * @param {"share"|"mid_feedback"} props.mode
 */
const ViewerPullPrompt = ({
  mode,
  isVisible,
  onPrimary,
  onDismiss,
  primaryLabel,
}) => {
  const { t } = useTranslation("common");

  const text =
    mode === "share"
      ? t("pullPrompt.shareText")
      : t("pullPrompt.midFeedbackText");

  const primary =
    primaryLabel ||
    (mode === "share" ? t("pullPrompt.shareAction") : t("pullPrompt.midFeedbackAction"));

  return (
    <div
      className={`${styles.prompt} ${isVisible ? "" : styles.hidden}`}
      role="status"
      aria-live="polite"
    >
      <p className={styles.text}>{text}</p>
      <button type="button" className={styles.openBtn} onClick={onPrimary}>
        {primary}
      </button>
      <button
        type="button"
        className={styles.closeBtn}
        onClick={onDismiss}
        aria-label={t("pullPrompt.dismiss")}
      >
        ×
      </button>
    </div>
  );
};

export default ViewerPullPrompt;
