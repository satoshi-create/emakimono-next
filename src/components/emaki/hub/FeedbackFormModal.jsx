import styles from "@/styles/EmakiHub.module.css";
import { getFeedbackUrl } from "@/libs/constants/links";
import { faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect } from "react";

/**
 * 言語切替付き Notion フィードバックフォームモーダル。
 * 閉じ方: 背景クリック / Escape / 閉じるボタン。表示中は body スクロールをロック。
 */
const FeedbackFormModal = ({ isOpen, onClose, locale, t }) => {
  useEffect(() => {
    if (!isOpen) return;
    // スクロールロック（既存の html.open パターンに合わせる）
    const html = document.querySelector("html");
    html.classList.add("open");
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      html.classList.remove("open");
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formUrl = getFeedbackUrl(locale);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label={t("emakiHub.feedbackTitle")}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className={styles.modalClose}
          onClick={onClose}
          aria-label={t("emakiHub.close")}
        >
          <FontAwesomeIcon icon={faClose} />
        </button>
        <h2 className={styles.modalTitle}>{t("emakiHub.feedbackTitle")}</h2>
        <p className={styles.modalDesc}>{t("emakiHub.feedbackDesc")}</p>
        <div className={styles.modalIframeWrap}>
          <iframe
            className={styles.modalIframe}
            src={formUrl}
            title={t("emakiHub.feedbackTitle")}
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
};

export default FeedbackFormModal;
