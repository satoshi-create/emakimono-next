import styles from "@/styles/QuizModal.module.css";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";

const QuizResult = ({
  rankLabel,
  score,
  total,
  resultLinks = [],
  onRetry,
  onClose,
  onAbandon,
}) => {
  const { t } = useTranslation("common");
  const { locale } = useRouter();
  const isEn = locale === "en";

  return (
    <>
      <div className={styles.modalBody}>
        <p className={styles.resultRank}>{rankLabel}</p>
        <p className={styles.resultScore}>
          {t("quiz.scoreLabel", { score, total })}
        </p>
        {resultLinks.length > 0 && (
          <div className={styles.resultLinks}>
            <p className={styles.resultLinksTitle}>{t("quiz.exploreMore")}</p>
            <ul className={styles.resultLinkList}>
              {resultLinks.map((link) => {
                const label = isEn ? link.labelEn : link.labelJa;
                const href =
                  link.type === "scroll" ? `/${link.titleen}` : link.path;
                return (
                  <li key={href}>
                    <Link href={href}>
                      <a
                        className={styles.resultLink}
                        onClick={() => onAbandon?.()}
                      >
                        {label}
                      </a>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
      <div className={styles.modalFooter}>
        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnSecondary}`}
            onClick={onClose}
          >
            {t("quiz.backToViewer")}
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={onRetry}
          >
            {t("quiz.retry")}
          </button>
        </div>
      </div>
    </>
  );
};

export default QuizResult;
