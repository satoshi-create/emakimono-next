import styles from "@/styles/QuizModal.module.css";
import { useTranslation } from "next-i18next";

const QuizQuestion = ({
  question,
  index,
  total,
  selectedIndex,
  isEn,
  onSelect,
  onNext,
  onJump,
}) => {
  const { t } = useTranslation("common");
  const answered = selectedIndex !== null;
  const isLast = index >= total - 1;
  const prompt = isEn ? question.promptEn : question.promptJa;
  const explanation = isEn ? question.explanationEn : question.explanationJa;
  const jumpLabel = isEn ? question.jumpLabelEn : question.jumpLabelJa;

  return (
    <>
      <div className={styles.modalBody}>
        <p className={styles.progress}>
          {t("quiz.questionProgress", {
            current: index + 1,
            total,
          })}
        </p>
        <h3 className={styles.prompt}>{prompt}</h3>
        <ul className={styles.choices}>
          {question.choices.map((choice, i) => {
            let cls = styles.choice;
            if (answered) {
              if (i === question.correctIndex) cls += ` ${styles.choiceCorrect}`;
              else if (i === selectedIndex) cls += ` ${styles.choiceWrong}`;
              else cls += ` ${styles.choiceMuted}`;
            }
            const label = isEn ? choice.labelEn : choice.labelJa;
            return (
              <li key={choice.id}>
                <button
                  type="button"
                  className={cls}
                  disabled={answered}
                  onClick={() => onSelect(i)}
                >
                  {choice.id}. {label}
                </button>
              </li>
            );
          })}
        </ul>
        {answered && (
          <div className={styles.feedback}>
            <p
              className={`${styles.feedbackLabel} ${
                selectedIndex === question.correctIndex
                  ? styles.feedbackCorrect
                  : styles.feedbackWrong
              }`}
            >
              {selectedIndex === question.correctIndex
                ? t("quiz.correct")
                : t("quiz.incorrect")}
            </p>
            <p className={styles.explanation}>{explanation}</p>
          </div>
        )}
      </div>
      {answered && (
        <div className={styles.modalFooter}>
          <div className={styles.actions}>
            {question.jump && (
              <button
                type="button"
                className={`${styles.btn} ${styles.btnJump}`}
                onClick={onJump}
              >
                {jumpLabel || t("quiz.seeScene")}
              </button>
            )}
            <button
              type="button"
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={onNext}
            >
              {isLast ? t("quiz.seeResult") : t("quiz.next")}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default QuizQuestion;
