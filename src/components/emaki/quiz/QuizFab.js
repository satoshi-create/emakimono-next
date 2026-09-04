import styles from "@/styles/QuizModal.module.css";
import { faLightbulb, faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslation } from "next-i18next";

/**
 * 観察力クイズ入口 / 再開（ナビと同系のアイコン）。
 * @param {"start"|"resume"} [mode]
 */
const QuizFab = ({ onOpen, onHide, isUIVisible = true, mode = "start" }) => {
  const { t } = useTranslation("common");
  const label =
    mode === "resume" ? t("quiz.resumeLabel") : t("quiz.fabLabel");

  return (
    <div
      className={`${styles.fabWrap} ${isUIVisible ? "" : styles.fabHidden}`}
    >
      <button
        type="button"
        className={styles.fab}
        onClick={onOpen}
        aria-label={label}
        title={label}
      >
        <FontAwesomeIcon
          icon={faLightbulb}
          className={styles.fabIcon}
          aria-hidden
        />
        <span className={styles.fabLabel}>{label}</span>
      </button>
      {typeof onHide === "function" && (
        <button
          type="button"
          className={styles.fabDismiss}
          onClick={(e) => {
            e.stopPropagation();
            onHide();
          }}
          aria-label={t("quiz.hideFab")}
          title={t("quiz.hideFab")}
        >
          <FontAwesomeIcon icon={faClose} aria-hidden />
        </button>
      )}
    </div>
  );
};

export default QuizFab;
