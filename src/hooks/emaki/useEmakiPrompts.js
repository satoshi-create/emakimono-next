/**
 * 中盤プル（共有・フィードバック）および巻末プル導線の状態・表示条件・sessionStorage 同期。
 * 抽出元: EmakiConteiner.js（ViewerPullPrompt / ScrollFeedbackEndPrompt 周辺）。
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  dismissFeedback,
  getScrollEndFeedbackKey,
  hasSubmittedScrollFeedback,
  isFeedbackDismissed,
} from "@/libs/api/scrollFeedbackSession";
import {
  hasDismissedPullPrompt,
  markPullPromptDismissed,
} from "@/libs/api/viewerPullSession";
import * as gtag from "@/libs/api/gtag";
import { buildShareUrl } from "@/utils/buildShareUrl";
import { runAfterPaint } from "@/utils/runAfterPaint";

// =============================================================================
// デバッグスイッチ
// 検証完了後は false にすることで、すべてのコンソール出力を一括で停止できます。
// =============================================================================
const DEBUG_EMAKI_PROMPTS = true;

function logDebug(tag, ...args) {
  if (!DEBUG_EMAKI_PROMPTS) return;
  const time = performance.now().toFixed(1);
  console.log(
    `%c[${time}ms][${tag}]`,
    "color: #3b82f6; font-weight: bold;",
    ...args
  );
}

/**
 * @param {object} params
 * @param {string} params.emakiId
 * @param {boolean} params.scroll
 * @param {React.RefObject<HTMLElement>} params.articleRef
 * @param {boolean} params.isAtEnd
 * @param {boolean} params.isUIVisible
 * @param {boolean} params.isScrollFeedbackOpen
 * @param {(open: boolean) => void} params.setIsScrollFeedbackOpen
 * @param {string} params.locale
 * @param {string} params.asPath
 * @param {string[]} params.locales
 * @param {string} params.defaultLocale
 * @param {number} params.liveSceneIndex
 */
export function useEmakiPrompts({
  emakiId,
  scroll,
  articleRef,
  isAtEnd,
  isUIVisible,
  isScrollFeedbackOpen,
  setIsScrollFeedbackOpen,
  locale,
  asPath,
  locales,
  defaultLocale,
  liveSceneIndex,
}) {
  // ---------------------------------------------------------------------------
  // 1. 状態管理（State）
  // ---------------------------------------------------------------------------
  // dismiss フラグと送信済みは sessionStorage と同期。同一タブ内の再表示を抑止する。
  const [scrollFeedbackSubmitted, setScrollFeedbackSubmitted] = useState(false);
  const [endPromptDismissed, setEndPromptDismissed] = useState(false);
  const [sharePromptDismissed, setSharePromptDismissed] = useState(false);
  const [midFeedbackDismissed, setMidFeedbackDismissed] = useState(false);
  // スクロール比率の「到達した最大バケット」。一度 30%/55% を超えるとセッション中は戻らない。
  const [scrollRatioBucket, setScrollRatioBucket] = useState(0);

  const visibilityPrevRef = useRef(null);

  // ---------------------------------------------------------------------------
  // 2. 永続化・同期（Effects）
  // ---------------------------------------------------------------------------
  // emakiId 切替時: 前絵巻の dismiss / 送信状態を sessionStorage から復元し、バケットをリセット。
  useEffect(() => {
    if (!emakiId) return;
    return runAfterPaint(() => {
      const submitted = hasSubmittedScrollFeedback(emakiId);
      const shareDismissed = hasDismissedPullPrompt(emakiId, "share");
      const midDismissed = hasDismissedPullPrompt(emakiId, "mid_feedback");
      const endDismissed = isFeedbackDismissed(getScrollEndFeedbackKey(emakiId));

      setScrollFeedbackSubmitted(submitted);
      setSharePromptDismissed(shareDismissed);
      setMidFeedbackDismissed(midDismissed);
      setEndPromptDismissed(endDismissed);
      setScrollRatioBucket(0);

      logDebug("Prompt:Init", {
        emakiId,
        submitted,
        shareDismissed,
        midDismissed,
        endDismissed,
      });
    });
  }, [emakiId]);

  const getScrollRatio = useCallback(() => {
    const el = articleRef.current;
    if (!el) return null;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 0) return null;
    return Math.round((Math.abs(el.scrollLeft) / maxScroll) * 1000) / 1000;
  }, [articleRef]);

  // 横スクロール位置から比率バケットを更新（デバウンス 400ms）。
  useEffect(() => {
    if (!scroll) return;
    const el = articleRef.current;
    if (!el) return;

    let timer = null;
    const updateBucket = () => {
      const r = getScrollRatio();
      if (r == null) return;
      if (r >= 0.55) setScrollRatioBucket((b) => Math.max(b, 0.55));
      else if (r >= 0.3) setScrollRatioBucket((b) => Math.max(b, 0.3));
    };
    const onScroll = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(updateBucket, 400);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    updateBucket();

    return () => {
      if (timer) clearTimeout(timer);
      el.removeEventListener("scroll", onScroll);
    };
  }, [scroll, getScrollRatio, emakiId, articleRef]);

  // ---------------------------------------------------------------------------
  // 3. 表示条件判定（Derived State）
  // ---------------------------------------------------------------------------
  // 共有は 30% 到達・中盤 FB は 55%・巻末は isAtEnd。相互排他と isUIVisible で重ね表示を防ぐ。
  const showSharePullPrompt =
    scroll &&
    !isAtEnd &&
    !sharePromptDismissed &&
    !isScrollFeedbackOpen &&
    scrollRatioBucket >= 0.3 &&
    isUIVisible;

  const showMidFeedbackPrompt =
    scroll &&
    !isAtEnd &&
    !scrollFeedbackSubmitted &&
    !midFeedbackDismissed &&
    !isScrollFeedbackOpen &&
    !showSharePullPrompt &&
    scrollRatioBucket >= 0.55 &&
    isUIVisible;

  const showScrollFeedbackEndPrompt =
    scroll &&
    isAtEnd &&
    !endPromptDismissed &&
    !isFeedbackDismissed(getScrollEndFeedbackKey(emakiId)) &&
    !isScrollFeedbackOpen &&
    isUIVisible &&
    !showSharePullPrompt &&
    !showMidFeedbackPrompt;

  useEffect(() => {
    const snapshot = {
      showSharePullPrompt,
      showMidFeedbackPrompt,
      showScrollFeedbackEndPrompt,
      scrollRatioBucket,
      isAtEnd,
      isUIVisible,
      isScrollFeedbackOpen,
      sharePromptDismissed,
      midFeedbackDismissed,
      endPromptDismissed,
      scrollFeedbackSubmitted,
    };
    const prev = visibilityPrevRef.current;
    if (
      prev &&
      prev.showSharePullPrompt === snapshot.showSharePullPrompt &&
      prev.showMidFeedbackPrompt === snapshot.showMidFeedbackPrompt &&
      prev.showScrollFeedbackEndPrompt === snapshot.showScrollFeedbackEndPrompt &&
      prev.scrollRatioBucket === snapshot.scrollRatioBucket &&
      prev.isAtEnd === snapshot.isAtEnd &&
      prev.isUIVisible === snapshot.isUIVisible
    ) {
      return;
    }
    visibilityPrevRef.current = snapshot;
    logDebug("Prompt:Visibility", snapshot);
  }, [
    showSharePullPrompt,
    showMidFeedbackPrompt,
    showScrollFeedbackEndPrompt,
    scrollRatioBucket,
    isAtEnd,
    isUIVisible,
    isScrollFeedbackOpen,
    sharePromptDismissed,
    midFeedbackDismissed,
    endPromptDismissed,
    scrollFeedbackSubmitted,
  ]);

  // ---------------------------------------------------------------------------
  // 4. イベントハンドラ（Handlers）
  // ---------------------------------------------------------------------------
  const handleScrollFeedbackSubmitted = useCallback(() => {
    logDebug("Prompt:Action", { action: "feedback_submitted", emakiId });
    dismissFeedback(getScrollEndFeedbackKey(emakiId));
    setScrollFeedbackSubmitted(true);
    setEndPromptDismissed(true);
    setMidFeedbackDismissed(true);
  }, [emakiId]);

  const handleSharePromptCopy = useCallback(async () => {
    logDebug("Prompt:Action", { action: "share_primary", emakiId });
    const url = buildShareUrl({
      locale,
      asPath,
      locales,
      defaultLocale,
      navIndex: liveSceneIndex,
    });
    try {
      await navigator.clipboard.writeText(url);
      gtag.event("sns_share_click", {
        platform: "copy",
        emaki_id: emakiId || "",
        scene_index: liveSceneIndex ?? 0,
        source: "mid_prompt",
      });
    } catch (err) {
      console.error("Share prompt copy failed:", err);
    }
    markPullPromptDismissed(emakiId, "share");
    setSharePromptDismissed(true);
  }, [locale, asPath, locales, defaultLocale, liveSceneIndex, emakiId]);

  const dismissSharePrompt = useCallback(() => {
    logDebug("Prompt:Action", { action: "share_dismiss", emakiId });
    markPullPromptDismissed(emakiId, "share");
    setSharePromptDismissed(true);
  }, [emakiId]);

  const dismissMidFeedbackPrompt = useCallback(() => {
    logDebug("Prompt:Action", { action: "mid_feedback_dismiss", emakiId });
    markPullPromptDismissed(emakiId, "mid_feedback");
    setMidFeedbackDismissed(true);
  }, [emakiId]);

  const handleMidFeedbackPrimary = useCallback(() => {
    logDebug("Prompt:Action", { action: "mid_feedback_primary", emakiId });
    markPullPromptDismissed(emakiId, "mid_feedback");
    setMidFeedbackDismissed(true);
    setIsScrollFeedbackOpen(true);
  }, [emakiId, setIsScrollFeedbackOpen]);

  const dismissEndPrompt = useCallback(() => {
    logDebug("Prompt:Action", { action: "end_dismiss", emakiId });
    dismissFeedback(getScrollEndFeedbackKey(emakiId));
    setEndPromptDismissed(true);
  }, [emakiId]);

  return {
    getScrollRatio,
    scrollFeedbackSubmitted,
    showSharePullPrompt,
    showMidFeedbackPrompt,
    showScrollFeedbackEndPrompt,
    handleScrollFeedbackSubmitted,
    handleSharePromptCopy,
    dismissSharePrompt,
    dismissMidFeedbackPrompt,
    handleMidFeedbackPrimary,
    dismissEndPrompt,
  };
}
