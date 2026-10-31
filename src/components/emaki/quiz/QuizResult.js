import { useState } from "react";
import styles from "@/styles/QuizModal.module.css";
import { trackQuizShareChallenge } from "@/libs/api/measurementUtils";
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
  quiz,
  quizSession,
}) => {
  const { t } = useTranslation("common");
  const { locale } = useRouter();
  const isEn = locale === "en";
  const [copied, setCopied] = useState(false);

  const handleShareChallenge = async () => {
    if (typeof window === "undefined") return;
    const shareUrl = `${window.location.origin}${window.location.pathname}?quiz=1`;
    const shareText = `【絵巻物観察力クイズ】正解数: ${score}/${total}（称号: ${rankLabel}）を獲得しました！このスコアに挑戦できる？ #絵巻物 #鳥獣戯画`;
    const activeQuizId = quiz?.id || quizSession?.quizId;
    const activeEmakiId = quiz?.targetScrollTitleen || quizSession?.hostTitleen;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "絵巻物観察力クイズ",
          text: shareText,
          url: shareUrl,
        });
        trackQuizShareChallenge({
          quizId: activeQuizId,
          emakiId: activeEmakiId,
          score,
          rank: rankLabel,
          method: "web_share",
        });
        return;
      } catch (err) {
        if (err.name !== "AbortError") console.error(err);
      }
    }

    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      trackQuizShareChallenge({
        quizId: activeQuizId,
        emakiId: activeEmakiId,
        score,
        rank: rankLabel,
        method: "clipboard",
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <div className={styles.modalBody} data-quiz-scroll>
        <p className={styles.resultRank}>{rankLabel}</p>
        <p className={styles.resultScore}>
          {t("quiz.scoreLabel", { score, total })}
        </p>
        <div style={{ margin: "16px 0", textAlign: "center" }}>
          <button
            type="button"
            onClick={handleShareChallenge}
            style={{
              padding: "8px 16px",
              backgroundColor: "#2563eb",
              color: "#ffffff",
              borderRadius: "6px",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              fontSize: "14px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            {copied
              ? "挑戦状リンクをコピーしました！"
              : "結果をシェア / 友達に挑戦状を送る"}
          </button>
        </div>
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
