import { useState } from "react";
import styles from "@/styles/QuizModal.module.css";
import { trackQuizShareChallenge } from "@/libs/api/measurementUtils";
import { getQuizNavigation } from "@/data/quiz";
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
  quizDef,
  quizSession,
  hostTitleen,
  completedQuizIds = [],
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
        {(() => {
          // props の命名ゆらぎ（quiz, quizDef, quizSession, hostTitleen）を安全に吸収
          const currentDef = quiz || quizDef;
          const activeQuizId = currentDef?.id || quizSession?.quizId;
          const currentTargetScroll = currentDef?.targetScrollTitleen || currentDef?.titleen || hostTitleen;
          const nav = getQuizNavigation(activeQuizId);
          const scrollTitleen =
            currentTargetScroll || quizSession?.hostTitleen;
          return (
            <div className={styles.resultNavigationContainer}>
              <div className={styles.seriesSection}>
                <p className={styles.resultLinksTitle}>
                  {isEn ? nav.seriesTitleEn : nav.seriesTitleJa}
                </p>
                <div className={styles.seriesPillGrid}>
                  {nav.seriesQuizzes.map((sq) => {
                    const targetSlug = sq.targetScrollTitleen || sq.titleen;
                    const isCurrent =
                      (activeQuizId && sq.id === activeQuizId) ||
                      (currentTargetScroll && targetSlug === currentTargetScroll);
                    const isCompleted = completedQuizIds.includes(sq.id);

                    const label = isEn
                      ? sq.shortTitleEn || sq.titleEn
                      : sq.shortTitleJa || sq.titleJa;

                    if (isCurrent) {
                      return (
                        <span
                          key={sq.id}
                          className={`${styles.seriesPill} ${styles.seriesPillActive}`}
                        >
                          ✓ {label}
                        </span>
                      );
                    }

                    if (isCompleted) {
                      return (
                        <Link
                          key={sq.id}
                          href={`/${targetSlug}?quiz=1`}
                        >
                          <a
                            className={`${styles.seriesPill} ${styles.seriesPillCompleted}`}
                            onClick={() => onAbandon?.()}
                          >
                            ✓ {label} ▶
                          </a>
                        </Link>
                      );
                    }

                    return (
                      <Link
                        key={sq.id}
                        href={`/${targetSlug}?quiz=1`}
                      >
                        <a
                          className={styles.seriesPill}
                          onClick={() => onAbandon?.()}
                        >
                          {label} {isEn ? "Challenge ▶" : "に挑戦 ▶"}
                        </a>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {nav.recommendedQuizzes.length > 0 && (
                <div className={styles.recommendSection}>
                  <p className={styles.resultLinksTitle}>
                    {isEn ? "Other Quizzes" : "別の絵巻クイズに挑戦"}
                  </p>
                  <div className={styles.recommendGrid}>
                    {nav.recommendedQuizzes.map((rq) => (
                      <Link
                        key={rq.id}
                        href={`/${rq.targetScrollTitleen || rq.titleen}?quiz=1`}
                      >
                        <a
                          className={styles.recommendCard}
                          onClick={() => onAbandon?.()}
                        >
                          <span className={styles.recommendCardTitle}>
                            {isEn
                              ? rq.seriesTitleEn && rq.shortTitleEn
                                ? `${rq.seriesTitleEn} (${rq.shortTitleEn})`
                                : rq.shortTitleEn || rq.seriesTitleEn || ""
                              : rq.seriesTitleJa && rq.shortTitleJa
                                ? `${rq.seriesTitleJa}（${rq.shortTitleJa}）`
                                : rq.shortTitleJa || rq.seriesTitleJa || ""}
                          </span>
                        </a>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className={styles.subNavigationLinks}>
                {scrollTitleen && (
                  <>
                    <Link href={`/${scrollTitleen}`}>
                      <a
                        className={styles.subNavLink}
                        onClick={() => onAbandon?.()}
                      >
                        {isEn
                          ? "View this scroll in reader"
                          : "この絵巻を鑑賞する"}
                      </a>
                    </Link>
                    <span className={styles.subNavDivider}>・</span>
                  </>
                )}
                <Link href="/type/emaki">
                  <a
                    className={styles.subNavLink}
                    onClick={() => onAbandon?.()}
                  >
                    {isEn ? "All Emaki" : "絵巻物一覧へ"}
                  </a>
                </Link>
              </div>
            </div>
          );
        })()}
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
