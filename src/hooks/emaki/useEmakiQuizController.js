// 1. クイズモジュールの遅延ロードとセッション復元
// LocalStorage 上のセッションと ?quiz= クエリに応じて UI 状態を同期する。

import { useCallback, useEffect, useRef, useState } from "react";
import {
  clearQuizSession,
  createQuizSession,
  loadQuizSession,
  saveQuizSession,
} from "@/libs/api/quizSessionStore";
import {
  isQuizFabHidden,
  setQuizFabHidden,
} from "@/libs/api/quizFabPrefs";
import {
  resolvePanoramaCoordToSlice,
  resolveSpotDeepLink,
} from "@/hooks/emaki/useEmakiSpotNavigation";
import { resolveLinkIdByChapter } from "@/utils/resolveQuizJump";
import { runAfterPaint } from "@/utils/runAfterPaint";

export default function useEmakiQuizController({
  data,
  scroll,
  query,
  stopPlayMode,
  handleToId,
  push,
  zoomToSlicePercentRef,
}) {
  const [quizModule, setQuizModule] = useState(null);
  const [quizSession, setQuizSession] = useState(null);
  const [quizUi, setQuizUi] = useState("closed");
  const [quizFabHidden, setQuizFabHiddenState] = useState(false);
  const quizHydratedRef = useRef(false);
  const pendingJumpAppliedRef = useRef(false);
  const quizOpenedFromQueryRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    import("@/data/quiz").then((mod) => {
      if (!cancelled) setQuizModule(mod);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const entryQuiz = quizModule
    ? quizModule.getQuizForTitleen(data.titleen)
    : null;

  const sessionQuiz =
    quizModule && quizSession
      ? quizModule.getQuizById(quizSession.quizId)
      : null;
  const activeQuiz = entryQuiz || sessionQuiz;
  const isSessionForCurrentScroll =
    quizSession &&
    (!quizSession.hostTitleen || quizSession.hostTitleen === data?.titleen);
  const forceQuizFabForResume = Boolean(
    isSessionForCurrentScroll && !quizSession?.done
  );
  const canShowQuizChrome = Boolean(
    scroll &&
      activeQuiz &&
      (entryQuiz ||
        (isSessionForCurrentScroll && !quizSession?.done) ||
        quizUi === "minimized") &&
      (!quizFabHidden || forceQuizFabForResume)
  );
  const fabMode =
    isSessionForCurrentScroll && !quizSession?.done ? "resume" : "start";

  useEffect(() => {
    if (!quizModule || quizHydratedRef.current) return;
    return runAfterPaint(() => {
      if (quizHydratedRef.current) return;
      quizHydratedRef.current = true;
      setQuizFabHiddenState(isQuizFabHidden());
      const stored = loadQuizSession({ hostTitleen: data?.titleen });
      if (!stored) {
        setQuizSession(null);
        return;
      }
      if (!quizModule.getQuizById(stored.quizId)) return;
      setQuizSession(stored);

      const isExplicitQuizQuery =
        query.quiz === "1" || query.quiz === "true";
      if (!isExplicitQuizQuery && !stored.done) {
        setQuizUi("minimized");
      }
    });
  }, [quizModule, data?.titleen, query.quiz]);

  // 2. FAB 再表示イベントと pendingJump によるシーンジャンプ
  useEffect(() => {
    const onShowFab = () => {
      setQuizFabHidden(false);
      setQuizFabHiddenState(false);
    };
    window.addEventListener("emaki-quiz-show-fab", onShowFab);
    return () => window.removeEventListener("emaki-quiz-show-fab", onShowFab);
  }, []);

  useEffect(() => {
    if (!scroll || !quizSession?.pendingJump || pendingJumpAppliedRef.current) {
      return;
    }
    const pj = quizSession.pendingJump;
    if (pj.titleen !== data.titleen) return;
    pendingJumpAppliedRef.current = true;
    const linkId =
      typeof pj.linkId === "number"
        ? pj.linkId
        : resolveLinkIdByChapter(data.emakis, pj.chapter);
    const cleared = { ...quizSession, pendingJump: null };
    saveQuizSession(cleared);
    setQuizSession(cleared);
    setQuizUi("minimized");
    if (typeof linkId === "number") {
      stopPlayMode();
      requestAnimationFrame(() => handleToId(linkId));
    }
  }, [
    scroll,
    data.titleen,
    data.emakis,
    quizSession,
    stopPlayMode,
    handleToId,
  ]);

  const openQuizUi = useCallback(() => {
    if (!quizModule) return;
    if (!activeQuiz) return;
    if (
      quizSession &&
      !quizSession.done &&
      quizSession.quizId === activeQuiz.id &&
      (!quizSession.hostTitleen || quizSession.hostTitleen === data?.titleen)
    ) {
      setQuizUi("open");
      return;
    }
    if (!entryQuiz) return;
    const nextSession = createQuizSession(entryQuiz, data?.titleen);
    saveQuizSession(nextSession);
    setQuizSession(nextSession);
    setQuizUi("open");
  }, [quizModule, quizSession, entryQuiz, activeQuiz, data?.titleen]);

  const closeQuizUi = useCallback(() => {
    setQuizUi("minimized");
  }, []);

  const abandonQuizUi = useCallback(() => {
    clearQuizSession();
    setQuizSession(null);
    setQuizUi("closed");
    pendingJumpAppliedRef.current = false;
  }, []);

  const handleQuizSessionChange = useCallback((next) => {
    saveQuizSession(next);
    setQuizSession(next);
  }, []);

  const handleQuizJumpLocal = useCallback(
    (linkId, spotId, currentQuestion) => {
      stopPlayMode();
      setQuizUi("minimized");
      const target = currentQuestion?.target;
      const hasPanoramaTarget =
        target &&
        Number.isFinite(target.x) &&
        Number.isFinite(target.y);

      if (hasPanoramaTarget && data?.emakis) {
        const resolved = resolvePanoramaCoordToSlice(
          data.emakis,
          target.x,
          target.y
        );
        if (resolved) {
          const rectW = target.w ?? target.rect?.w;
          const rectH = target.h ?? target.rect?.h;
          const targetNumericId =
            typeof resolved.sliceIndex === "number"
              ? resolved.sliceIndex
              : typeof resolved.linkId === "number"
                ? resolved.linkId
                : Number(String(resolved.linkId ?? "").replace(/^scene-/, ""));
          if (Number.isFinite(targetNumericId)) {
            handleToId(targetNumericId);
          }
          window.setTimeout(() => {
            zoomToSlicePercentRef?.current?.({
              sliceIndex: resolved.sliceIndex,
              centerX: resolved.centerX,
              centerY: resolved.centerY,
              targetScale: target.scale ?? 4.6,
              rectW,
              rectH,
            });
          }, 300);
          return;
        }
      }

      handleToId(linkId);
      if (spotId && data?.emakis) {
        window.setTimeout(() => {
          const deep = resolveSpotDeepLink(data.emakis, spotId);
          if (!deep) return;
          zoomToSlicePercentRef?.current?.({
            sliceIndex: deep.sliceIndex,
            centerX: deep.centerX,
            centerY: deep.centerY,
            targetScale: deep.targetScale ?? 4.6,
            rectW: deep.rectW,
            rectH: deep.rectH,
          });
        }, 300);
      }
    },
    [stopPlayMode, handleToId, data?.emakis, zoomToSlicePercentRef]
  );

  const handleQuizJumpScroll = useCallback(
    (titleen) => {
      stopPlayMode();
      setQuizUi("minimized");
      pendingJumpAppliedRef.current = false;
      push(`/${titleen}`);
    },
    [stopPlayMode, push]
  );

  // 3. ?quiz= クエリによる自動オープン
  useEffect(() => {
    if (!scroll || !activeQuiz || quizOpenedFromQueryRef.current) return;
    if (query.quiz === "true" || query.quiz === "1") {
      quizOpenedFromQueryRef.current = true;
      openQuizUi();
    }
  }, [scroll, activeQuiz, query.quiz, openQuizUi]);

  return {
    activeQuiz,
    quizSession,
    quizUi,
    canShowQuizChrome,
    fabMode,
    openQuizUi,
    closeQuizUi,
    abandonQuizUi,
    handleQuizSessionChange,
    handleQuizJumpLocal,
    handleQuizJumpScroll,
  };
}