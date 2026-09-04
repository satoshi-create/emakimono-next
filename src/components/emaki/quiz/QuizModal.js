import QuizQuestion from "@/components/emaki/quiz/QuizQuestion";
import QuizResult from "@/components/emaki/quiz/QuizResult";
import { getQuizRank } from "@/data/quiz/choujuGigaKouQuiz";
import {
  trackQuizAnswer,
  trackQuizComplete,
  trackQuizJumpToScene,
  trackQuizStart,
} from "@/libs/api/measurementUtils";
import styles from "@/styles/QuizModal.module.css";
import { resolveQuizJump } from "@/utils/resolveQuizJump";
import { faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { useEffect, useRef } from "react";

/**
 * 観察力クイズモーダル。
 * 進行は session props で制御（親が sessionStorage と同期）。
 * onClose = 最小化（進行保持）。onAbandon = セッション破棄。
 */
const QuizModal = ({
  quiz,
  emakiId,
  emakis,
  session,
  onSessionChange,
  onClose,
  onAbandon,
  onMinimizeAndJumpLocal,
  onMinimizeAndJumpScroll,
}) => {
  const { t } = useTranslation("common");
  const { locale } = useRouter();
  const isEn = locale === "en";
  const startedRef = useRef(false);

  const index = session.index;
  const selectedIndex = session.selectedIndex;
  const answers = session.answers;
  const jumpCount = session.jumpCount;
  const done = session.done;

  const question = quiz.questions[index];
  const total = quiz.questions.length;
  const score = answers.filter((a) => a.correct).length;
  const rank = getQuizRank(quiz, score);
  const rankLabel = isEn ? rank.labelEn : rank.labelJa;

  useEffect(() => {
    if (startedRef.current) return;
    if (session.index !== 0 || session.answers.length > 0 || session.done) {
      startedRef.current = true;
      return;
    }
    startedRef.current = true;
    trackQuizStart(emakiId, quiz.id, quiz.version);
  }, [
    emakiId,
    quiz.id,
    quiz.version,
    session.index,
    session.answers.length,
    session.done,
  ]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // 背景の縦スクロールを止め、BottomNavigation（scrollY>80）が被らないようにする。
  // モーダル内は [data-quiz-scroll] のみスクロール可（端では preventDefault）。
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    window.scrollTo({ top: 0, behavior: "instant" });

    let touchStartY = 0;
    const onTouchStart = (e) => {
      if (e.touches.length === 1) touchStartY = e.touches[0].clientY;
    };

    const blockArrowKeys = (e) => {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
        e.preventDefault();
      }
    };

    const shouldBlockScroll = (scrollEl, deltaY) => {
      if (!scrollEl) return true;
      const { scrollTop, scrollHeight, clientHeight } = scrollEl;
      if (scrollHeight <= clientHeight + 1) return true;
      const atTop = scrollTop <= 0;
      const atBottom = scrollTop + clientHeight >= scrollHeight - 1;
      // deltaY > 0: 下方向へスクロールしようとしている（指は上へ / wheel 正）
      if (atTop && deltaY < 0) return true;
      if (atBottom && deltaY > 0) return true;
      return false;
    };

    const blockWheel = (e) => {
      const scrollEl = e.target?.closest?.("[data-quiz-scroll]");
      if (scrollEl && !shouldBlockScroll(scrollEl, e.deltaY)) return;
      e.preventDefault();
      e.stopPropagation();
    };

    const blockTouch = (e) => {
      if (e.touches.length !== 1) {
        e.preventDefault();
        return;
      }
      const scrollEl = e.target?.closest?.("[data-quiz-scroll]");
      const dy = e.touches[0].clientY - touchStartY;
      // 指が下へ = コンテンツは上へ（deltaY 負）
      if (scrollEl && !shouldBlockScroll(scrollEl, -dy)) return;
      e.preventDefault();
      e.stopPropagation();
    };

    document.addEventListener("touchstart", onTouchStart, {
      passive: true,
      capture: true,
    });
    document.addEventListener("wheel", blockWheel, {
      passive: false,
      capture: true,
    });
    document.addEventListener("keydown", blockArrowKeys, { capture: true });
    document.addEventListener("touchmove", blockTouch, {
      passive: false,
      capture: true,
    });
    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      document.removeEventListener("touchstart", onTouchStart, { capture: true });
      document.removeEventListener("wheel", blockWheel, { capture: true });
      document.removeEventListener("keydown", blockArrowKeys, { capture: true });
      document.removeEventListener("touchmove", blockTouch, { capture: true });
    };
  }, []);

  const patchSession = (partial) => {
    onSessionChange({ ...session, ...partial });
  };

  const handleSelect = (choiceIndex) => {
    if (selectedIndex !== null || !question) return;
    const correct = choiceIndex === question.correctIndex;
    const nextAnswers = [
      ...answers,
      {
        questionId: question.id,
        choiceIndex,
        correct,
      },
    ];
    patchSession({
      selectedIndex: choiceIndex,
      answers: nextAnswers,
    });
    trackQuizAnswer({
      emakiId,
      quizId: quiz.id,
      questionId: question.id,
      order: question.order,
      choiceIndex,
      isCorrect: correct,
    });
  };

  const handleJump = () => {
    if (!question?.jump) return;
    const resolved = resolveQuizJump(emakis, question.jump, emakiId);
    if (!resolved) return;

    const nextJumpCount = jumpCount + 1;
    const basePatch = { jumpCount: nextJumpCount };

    if (resolved.kind === "local") {
      trackQuizJumpToScene({
        emakiId,
        quizId: quiz.id,
        questionId: question.id,
        toScene: resolved.linkId,
        toChapter: resolved.chapter,
      });
      patchSession(basePatch);
      onMinimizeAndJumpLocal(resolved.linkId);
      return;
    }

    trackQuizJumpToScene({
      emakiId,
      quizId: quiz.id,
      questionId: question.id,
      toScene: resolved.linkId ?? 0,
      toChapter: resolved.chapter,
    });
    patchSession({
      ...basePatch,
      pendingJump: {
        titleen: resolved.titleen,
        chapter: resolved.chapter,
        linkId: resolved.linkId,
      },
    });
    onMinimizeAndJumpScroll(resolved.titleen);
  };

  const handleNext = () => {
    if (index >= total - 1) {
      const finalRank = getQuizRank(quiz, score);
      trackQuizComplete({
        emakiId,
        quizId: quiz.id,
        score,
        total,
        rank: finalRank.id,
        jumpCount,
      });
      patchSession({ done: true });
      return;
    }
    patchSession({
      index: index + 1,
      selectedIndex: null,
    });
  };

  const handleRetry = () => {
    startedRef.current = false;
    onSessionChange({
      ...session,
      index: 0,
      selectedIndex: null,
      answers: [],
      jumpCount: 0,
      done: false,
      pendingJump: null,
    });
    startedRef.current = true;
    trackQuizStart(emakiId, quiz.id, quiz.version);
  };

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="quiz-modal-title"
    >
      <div className={styles.backdrop} onClick={onClose} aria-hidden />
      <div className={styles.modal} data-quiz-modal>
        <div className={styles.modalHeader}>
          <h2 id="quiz-modal-title" className={styles.title}>
            {t("quiz.title")}
          </h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label={t("quiz.close")}
          >
            <FontAwesomeIcon icon={faClose} />
          </button>
        </div>
        {done ? (
          <QuizResult
            rankLabel={rankLabel}
            score={score}
            total={total}
            resultLinks={quiz.resultLinks}
            onRetry={handleRetry}
            onClose={onClose}
            onAbandon={onAbandon}
          />
        ) : (
          question && (
            <QuizQuestion
              question={question}
              index={index}
              total={total}
              selectedIndex={selectedIndex}
              isEn={isEn}
              onSelect={handleSelect}
              onNext={handleNext}
              onJump={handleJump}
            />
          )
        )}
      </div>
    </div>
  );
};

export default QuizModal;
