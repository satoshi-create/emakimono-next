/**
 * useEmakiViewerOrchestrator.js
 *
 * 【責務】
 * - 絵巻ビューア（EmakiConteiner）のドメインフック群の呼び出し順序・共有 ref 配線・
 *   境界 state 管理・パノラマスポット算出を一元化するオーケストレーターフック。
 * - UI コンポーネント側は返却される状態・ハンドラ・Ref を JSX に配線するのみとする。
 */
import { useEbikiCoordinatePicker } from "@/components/emaki/dev/EbikiCoordinatePicker";
import { ALL_QUIZZES } from "@/data/quiz/index";
import { AppContext } from "@/context/AppContext";
import { assignUniqueIndex } from "@/utils/emakiItemIndexer";
import { emakiDisplayTitle } from "@/utils/emakiDisplayTitle";
import useEmakiAutoPlay from "@/hooks/emaki/useEmakiAutoPlay";
import useEmakiPalmDrag from "@/hooks/emaki/useEmakiPalmDrag";
import useEmakiZoomPan from "@/hooks/emaki/useEmakiZoomPan";
import useEmakiZoomBridge from "@/hooks/emaki/useEmakiZoomBridge";
import useEmakiScroll from "@/hooks/emaki/useEmakiScroll";
import useScrollPositionRestore from "@/hooks/emaki/useScrollPositionRestore";
import useEmakiRailSync from "@/hooks/emaki/useEmakiRailSync";
import useEmakiSpotNavigation from "@/hooks/emaki/useEmakiSpotNavigation";
import useEmakiQuizController from "@/hooks/emaki/useEmakiQuizController";
import { usePanoramaSpots } from "@/hooks/emaki/usePanoramaSpots";
import useEmakiViewportState from "@/hooks/emaki/useEmakiViewportState";
import useEmakiViewerLifecycle, {
  useViewerTopInset,
  useEmakiZoomOpenHandlers,
  useEmakiZoomAnalyticsEffects,
  computeNextContentMounted,
} from "@/hooks/emaki/useEmakiViewerLifecycle";
import { useEmakiPrompts } from "@/hooks/emaki/useEmakiPrompts";
import { isByobuScroll } from "@/utils/isByobuScroll";
import { scrollPositionStore } from "@/hooks/emaki/scrollPositionStore";
import { useCallback, useContext, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";

export default function useEmakiViewerOrchestrator({
  data,
  scroll,
  navIndex,
  editionLinks = [],
  showKusouzuHubLink = false,
  showChojuGigaHubLink = false,
  showHyakkiHubLink = false,
  showRakuchuRakugaiHubLink = false,
  onUserScrollStart,
  onReachStartBoundary,
  isTheaterMode,
  onToggleTheater,
  theaterSuppressRef,
  railPinFromExpandRef,
  railPinScrollLeftRef,
}) {
  // =============================================================================
  // 1. DOM・ブリッジRef管理
  //    AppContext / Router / i18n の取得、DOM 接続用 Ref・内部ブリッジ Ref・
  //    スクロール境界および再生制御用の state/ref ペアを初期化する。
  // =============================================================================
  const {
    setOepnSidebar,
    orientation,
    handleToId,
    toggleFullscreen,
    handleFullScreen,
    isHelpModalOpen,
    setnavIndex,
    isScrollDetectedUpdateRef,
  } = useContext(AppContext);

  const { backgroundImage } = data;
  const {
    locale,
    locales,
    asPath,
    defaultLocale,
    query,
    isReady,
    push,
    pathname,
    replace,
  } = useRouter();
  const { t } = useTranslation("common");

  // DOM 接続用 Ref
  const articleRef = useRef();
  const entryContainerRef = useRef(null);
  const indicatorElRef = useRef(null);

  // 内部ブリッジ Ref
  const enterZoomRef = useRef(null);
  const zoomToSlicePercentRef = useRef(null);
  const touchDoubleTapAtRef = useRef(0);
  const contentWindowMountedRef = useRef(new Set());
  const contentWindowEmakiRef = useRef(data.id);

  // 境界状態ペア（state + ref）
  const [isAtStart, setIsAtStart] = useState(true);
  const [isAtEnd, setIsAtEnd] = useState(false);
  const isAtStartRef = useRef(true);
  const isAtEndRef = useRef(false);

  const hasNextVolume =
    editionLinks.length > 0 ||
    showKusouzuHubLink ||
    showChojuGigaHubLink ||
    showHyakkiHubLink ||
    showRakuchuRakugaiHubLink;

  const [isScrollFeedbackOpen, setIsScrollFeedbackOpen] = useState(false);

  const emakiId = data.titleen;
  const lastDetectedSceneRef = useRef(navIndex);
  const detectCurrentSceneRef = useRef(null);

  const [isScrolling, setIsScrolling] = useState(false);
  const isScrollingRef = useRef(false);
  const [idlePaused, setIdlePaused] = useState(false);

  // =============================================================================
  // 2. 再生・スクロール・ナビゲーション同期
  //    自動再生、クイズ制御、パームドラッグ、横スクロール検出、スポット遷移、
  //    ユーザープロンプト、レール同期のドメインフックを順序厳守で接続する。
  // =============================================================================
  const {
    isAutoScrolling,
    isPlayMode,
    startPlayMode,
    stopPlayMode,
    playModeAnimationRef,
    setIsPlayMode,
    isUIVisible,
    showUI,
    resetIdleTimer,
  } = useEmakiAutoPlay({
    articleRef,
    dataId: data.id,
    emakiId,
    navIndex,
    setnavIndex,
    lastDetectedSceneRef,
    isAtStartRef,
    isAtEndRef,
    setIsAtStart,
    setIsAtEnd,
    isScrollingRef,
    setIsScrolling,
    idlePaused,
    detectCurrentSceneRef,
    scrollPositionStore,
  });

  const {
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
  } = useEmakiQuizController({
    data,
    scroll,
    query,
    stopPlayMode,
    handleToId,
    push,
    zoomToSlicePercentRef,
    emakis: data.emakis,
  });

  const { isPalmMode, suppressClickUntilRef, palmActiveRef } =
    useEmakiPalmDrag(articleRef);

  const {
    scrollDimsRef,
    liveSceneIndex,
    contentWindowCenter,
    contentWindowCenterRef,
  } = useEmakiScroll({
    articleRef,
    dataId: data.id,
    emakiId,
    emakis: data.emakis,
    isByobu: isByobuScroll(data),
    navIndex,
    setnavIndex,
    isScrollDetectedUpdateRef,
    isAutoScrolling,
    playModeAnimationRef,
    palmActiveRef,
    lastDetectedSceneRef,
    isAtStartRef,
    isAtEndRef,
    setIsAtStart,
    setIsAtEnd,
    isScrollingRef,
    setIsScrolling,
    indicatorElRef,
    toggleFullscreen,
    scrollPositionStore,
    detectCurrentSceneRef,
  });

  const {
    selectedSpotId,
    selectedSpot,
    allSpots,
    onSelectSpot,
    onSelectSpotFromCommentary,
    onClearSelectedSpot,
  } = useEmakiSpotNavigation({
    scroll,
    isReady,
    data,
    query,
    pathname,
    replace,
    handleToId,
    navIndex,
    liveSceneIndex,
    articleRef,
    zoomToSlicePercentRef,
  });

  const shareTitle =
    locale === "en"
      ? emakiDisplayTitle(data, locale)
      : `${data.title ?? ""}${data.edition ? ` ${data.edition}` : ""}`.trim();

  const {
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
  } = useEmakiPrompts({
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
  });

  const {
    handlePointerDown: handleRailPointerDown,
    handleTouchStart: handleRailTouchStart,
    handleTouchEnd: handleRailTouchEnd,
    handleWheel: handleRailWheel,
  } = useEmakiRailSync({
    articleRef,
    isAtStart,
    isAtStartRef,
    isAtEnd,
    isAtEndRef,
    isAutoScrolling,
    isPlayMode,
    onUserScrollStart,
    onReachStartBoundary,
    theaterSuppressRef,
    railPinFromExpandRef,
    railPinScrollLeftRef,
  });

  // =============================================================================
  // 3. ビューポート・ズーム統合
  //    ビューポートレイアウト状態、トップインセット、ダブルタップ、ズーム/パン、
  //    ズーム計測エフェクト、絵引座標ピッカー、スクロール復元・ライフサイクルを接続する。
  // =============================================================================
  const {
    commentaryFloating,
    viewerLayout,
    isEditSpotsMode,
    handleToggleEditSpots,
    stageHandlers,
  } = useEmakiViewportState({
    orientation,
    toggleFullscreen,
    data,
    query,
    pathname,
    replace,
    isPalmMode,
    detectCurrentSceneRef,
    isPlayMode,
    stopPlayMode,
    isAutoScrolling,
    emakiId,
    suppressClickUntilRef,
    touchDoubleTapAtRef,
    handleFullScreen,
    setOepnSidebar,
    handleRailTouchStart,
    handleRailTouchEnd,
  });

  const viewerTopInset = useViewerTopInset({
    commentaryFloating,
    toggleFullscreen,
    entryContainerRef,
  });

  const handleViewerDoubleTap = useCallback(() => {
    touchDoubleTapAtRef.current = Date.now();
    handleFullScreen("landscape");
  }, [handleFullScreen]);

  const {
    handleZoomOpenWithTrack,
    handleZoomCloseWithTrack,
    zoomMaxScaleRef,
  } = useEmakiZoomOpenHandlers({ emakiId, stopPlayMode });

  const {
    isZoomed,
    scale: zoomScale,
    panX,
    panY,
    zoomRef,
    stageRef: zoomStageRef,
    stripRef: zoomStripRef,
    openZoom,
    resetZoom: originalResetZoom,
    zoomIn,
    zoomOut,
    toggleZoom: originalToggleZoom,
    handlers: zoomHandlers,
  } = useEmakiZoomPan({
    onOpen: () => handleZoomOpenWithTrack("unknown"),
    onDoubleTap: handleViewerDoubleTap,
    containerRef: entryContainerRef,
    requestZoomRef: enterZoomRef,
    maxScale:
      typeof data?.maxScale === "number"
        ? data.maxScale
        : typeof data?.maxZoom === "number"
          ? data.maxZoom / 100
          : typeof data?.titleen === "string" &&
              data.titleen.startsWith("rakuchu_rakugai")
            ? 12
            : isByobuScroll(data)
              ? 8
              : undefined,
  });

  useEmakiZoomAnalyticsEffects({
    isZoomed,
    zoomScale,
    handleZoomCloseWithTrack,
    zoomMaxScaleRef,
  });

  const {
    enabled: ebikiPickerEnabled,
    onPick: onEbikiPick,
    hudData: ebikiPickerHud,
    clearHud: clearEbikiPickerHud,
  } = useEbikiCoordinatePicker({ handleToId, isZoomed });

  const showEndNudge = isAtEnd && hasNextVolume;

  useScrollPositionRestore({
    articleRef,
    dataId: data.id,
    toggleFullscreen,
    orientation,
    scrollPositionStore,
    navIndex,
    handleToId,
    detectCurrentSceneRef,
  });

  const { showWheelToast, setShowWheelToast } = useEmakiViewerLifecycle({
    articleRef,
    scroll,
    emakiId,
    data,
    backgroundImage,
    playModeAnimationRef,
    setIsPlayMode,
    showUI,
    scrollDimsRef,
    detectCurrentSceneRef,
    lastDetectedSceneRef,
    isAtStartRef,
    isAtEndRef,
    setIsAtStart,
    setIsAtEnd,
    orientation,
    toggleFullscreen,
  });

  // =============================================================================
  // 4. パノラマスポット・仮想マウント窓算出
  //    画像リストの一意インデックス付与、クイズ由来パノラマスポット算出、
  //    仮想マウント窓（nextContentMounted）およびズームブリッジを統合する。
  // =============================================================================
  const processedEmakis = useMemo(
    () => assignUniqueIndex(data.emakis || []),
    [data.emakis]
  );

  const activeQuizQuestions = useMemo(() => {
    const scrollKey = data?.scroll_id ?? data?.titleen;
    const quizDef =
      scrollKey &&
      ALL_QUIZZES.find(
        (q) => q.titleen === scrollKey || q.id === scrollKey
      );
    if (!(isEditSpotsMode || quizDef)) return [];
    return quizDef?.questions ?? activeQuiz?.questions ?? [];
  }, [data, isEditSpotsMode, activeQuiz]);

  const { panoramaSpots, hasPanoramaSpots } = usePanoramaSpots(
    data,
    activeQuizQuestions
  );
  const panoramaLinkId = data?.linkId ?? processedEmakis[0]?.linkId;

  const { nextContentMounted, windowCenter, windowIsPlaying } =
    computeNextContentMounted({
      data,
      processedEmakis,
      contentWindowCenter,
      liveSceneIndex,
      navIndex,
      isPlayMode,
      isAutoScrolling,
      contentWindowMountedRef,
      contentWindowEmakiRef,
    });

  const {
    zoomSlices,
    zoomCenterIndex,
    handleCaptureFromZoom,
    handleOpenPolaroidModal,
    handleClosePolaroidModal,
    resetZoom,
    toggleZoom,
    isPolaroidModalOpen,
    polaroidSceneIndex,
    polaroidInitialZoom,
    polaroidInitialPan,
    polaroidModalKey,
  } = useEmakiZoomBridge({
    data,
    processedEmakis,
    articleRef,
    entryContainerRef,
    contentWindowCenterRef,
    liveSceneIndex,
    isZoomed,
    zoomScale,
    panX,
    panY,
    openZoom,
    resetZoom: originalResetZoom,
    toggleZoom: originalToggleZoom,
    enterZoomRef,
    zoomToSlicePercentRef,
    onZoomOpenTrack: handleZoomOpenWithTrack,
    onZoomCloseTrack: handleZoomCloseWithTrack,
  });

  const hasCommentaryData = Boolean(scroll);
  const isByobu = isByobuScroll(data);

  return {
    refs: {
      articleRef,
      entryContainerRef,
      indicatorElRef,
    },
    layoutState: {
      orientation,
      toggleFullscreen,
      commentaryFloating,
      viewerLayout,
      viewerTopInset,
      hasCommentaryData,
      isByobu,
      isPalmMode,
      isZoomed,
      hasNextVolume,
      showEndNudge,
      hasPanoramaSpots,
      panoramaSpots,
      panoramaLinkId,
      processedEmakis,
      nextContentMounted,
      windowCenter,
      windowIsPlaying,
      ebikiPickerEnabled,
      isEditSpotsMode,
      selectedSpot,
      selectedSpotId,
      allSpots,
      canShowQuizChrome,
      isUIVisible,
      fabMode,
    },
    chromeProps: {
      scroll,
      isEditSpotsMode,
      handleToggleEditSpots,
      isUIVisible,
      commentaryFloating,
      showWheelToast,
      setShowWheelToast,
      indicatorElRef,
      isScrolling,
      onToggleTheater,
      isTheaterMode,
      t,
      toggleFullscreen,
      isZoomed,
      toggleZoom,
      entryContainerRef,
      handleToId,
      data,
      isPlayMode,
      isAutoScrolling,
      startPlayMode,
      stopPlayMode,
    },
    overlaysProps: {
      scroll,
      isHelpModalOpen,
      isPolaroidModalOpen,
      processedEmakis,
      data,
      polaroidSceneIndex,
      polaroidInitialZoom,
      polaroidInitialPan,
      polaroidModalKey,
      handleClosePolaroidModal,
      canShowQuizChrome,
      openQuizUi,
      isUIVisible,
      fabMode,
      activeQuiz,
      quizSession,
      quizUi,
      emakiId,
      handleQuizSessionChange,
      closeQuizUi,
      abandonQuizUi,
      handleQuizJumpLocal,
      handleQuizJumpScroll,
      isScrollFeedbackOpen,
      setIsScrollFeedbackOpen,
      getScrollRatio,
      locale,
      handleScrollFeedbackSubmitted,
      showSharePullPrompt,
      handleSharePromptCopy,
      dismissSharePrompt,
      showMidFeedbackPrompt,
      handleMidFeedbackPrimary,
      dismissMidFeedbackPrompt,
      showScrollFeedbackEndPrompt,
      dismissEndPrompt,
      shareTitle,
      navIndex,
      liveSceneIndex,
      scrollFeedbackSubmitted,
    },
    stageProps: {
      handleRailPointerDown,
      stageHandlers,
      handleRailWheel,
      onEbikiPick,
      onSelectSpot,
    },
    zoomLayerProps: {
      isZoomed,
      onCapture: handleCaptureFromZoom,
      scale: zoomScale,
      panX,
      panY,
      zoomRef,
      stageRef: zoomStageRef,
      stripRef: zoomStripRef,
      zoomIn,
      zoomOut,
      resetZoom,
      handlers: zoomHandlers,
      slices: zoomSlices,
      centerKey: zoomCenterIndex,
      data,
      ebikiPickerEnabled,
      onSelectSpot,
      selectedSpotId,
    },
    commentaryBarProps: {
      data,
      navIndex: liveSceneIndex,
      isFullscreen: toggleFullscreen,
      isZoomed,
      commentaryFloating,
      openPolaroidModal: handleOpenPolaroidModal,
      entryContainerRef,
      isPlayMode,
      onIdlePauseChange: setIdlePaused,
      onIdleActivity: resetIdleTimer,
      selectedSpot,
      onClearSelectedSpot,
      allSpots,
      onSelectSpot: onSelectSpotFromCommentary,
      openQuizUi,
      isUIVisible,
      fabMode,
      canShowQuizChrome,
    },
    ebikiHudProps: {
      hudData: ebikiPickerHud,
      onClose: clearEbikiPickerHud,
    },
  };
}
