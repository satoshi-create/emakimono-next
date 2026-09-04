import styles from "@/styles/QuizModal.module.css";
import { AppContext } from "@/context/AppContext";
import { faLightbulb } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useContext } from "react";
import { useTranslation } from "next-i18next";

/**
 * 観察力クイズ入口 / 再開。
 * @param {"float"|"bar"} [variant] float=PC・SP横 / bar=SP縦コメンタリーバー内
 * @param {"start"|"resume"} [mode]
 */
const QuizFab = ({
  onOpen,
  isUIVisible = true,
  mode = "start",
  variant = "float",
}) => {
  const { t } = useTranslation("common");
  const { orientation } = useContext(AppContext);
  const label =
    mode === "resume" ? t("quiz.resumeLabel") : t("quiz.fabLabel");

  // float（PC / SP横）はナビ idle に連動。bar（SP縦）は非連動
  const hideWithIdle = variant === "float" && !isUIVisible;

  return (
    <div
      className={`${styles.fabWrap} ${hideWithIdle ? styles.fabHidden : ""}`}
      data-variant={variant}
      data-orientation={orientation || "landscape"}
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
    </div>
  );
};

export default QuizFab;
