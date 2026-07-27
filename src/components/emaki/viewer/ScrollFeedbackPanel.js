import { postScrollFeedback } from "@/libs/api/ugcApi";
import { markScrollFeedbackSubmitted } from "@/libs/api/scrollFeedbackSession";
import { SCROLL_FEEDBACK_CHOICES } from "@/libs/constants/scrollFeedback";
import * as gtag from "@/libs/api/gtag";
import styles from "@/styles/ScrollFeedbackPanel.module.css";
import { faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { useTranslation } from "next-i18next";

const ScrollFeedbackPanel = ({
  emakiId,
  sceneIndex,
  getScrollRatio,
  locale,
  onClose,
  onSubmitted,
}) => {
  const { t } = useTranslation("common");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isThanks, setIsThanks] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !isSubmitting) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, isSubmitting]);

  useEffect(() => {
    const blockWheel = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };
    const blockArrowKeys = (e) => {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    const blockTouch = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    document.addEventListener("wheel", blockWheel, { passive: false, capture: true });
    document.addEventListener("keydown", blockArrowKeys, { capture: true });
    document.addEventListener("touchmove", blockTouch, { passive: false, capture: true });

    return () => {
      document.removeEventListener("wheel", blockWheel, { capture: true });
      document.removeEventListener("keydown", blockArrowKeys, { capture: true });
      document.removeEventListener("touchmove", blockTouch, { capture: true });
    };
  }, []);

  const handleChoice = async (choice) => {
    if (isSubmitting || isThanks) return;

    setIsSubmitting(true);
    setError("");

    try {
      await postScrollFeedback({
        emakiId,
        choice,
        sceneIndex,
        scrollRatio: getScrollRatio?.() ?? null,
        locale,
      });

      markScrollFeedbackSubmitted(emakiId);
      gtag.event("scroll_feedback", {
        emaki_id: emakiId,
        choice,
        scene_index: sceneIndex,
      });

      setIsThanks(true);
      onSubmitted?.();

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.message || t("scrollFeedback.error"));
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.backdrop} onClick={isSubmitting ? undefined : onClose} />
      <div className={styles.modal}>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          disabled={isSubmitting}
          aria-label={t("scrollFeedback.close")}
        >
          <FontAwesomeIcon icon={faClose} />
        </button>

        {isThanks ? (
          <p className={styles.thanks}>{t("scrollFeedback.thanks")}</p>
        ) : (
          <>
            <h3 className={styles.title}>{t("scrollFeedback.prompt")}</h3>
            <div className={styles.choices}>
              {SCROLL_FEEDBACK_CHOICES.map((choice) => (
                <button
                  key={choice}
                  type="button"
                  className={styles.choiceBtn}
                  disabled={isSubmitting}
                  onClick={() => handleChoice(choice)}
                >
                  {t(`scrollFeedback.choices.${choice}`)}
                </button>
              ))}
            </div>
            {error && <p className={styles.error}>{error}</p>}
          </>
        )}
      </div>
    </div>
  );
};

export default ScrollFeedbackPanel;
