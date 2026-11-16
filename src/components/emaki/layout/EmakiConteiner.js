/**
 * EmakiConteiner.js
 *
 * 【責務（Step 2 責務分離後）】
 * - 絵巻ビューアのレイアウトオーケストレーター
 * - 各ドメインフックの呼び出し順序と ref 配線の単一入口
 */
import { useEbikiCoordinatePicker } from "@/components/emaki/dev/EbikiCoordinatePicker";
import EmakiInfo from "@/components/emaki/metadata/EmakiInfo";
import EmakiNavigation from "@/components/emaki/navigation/EmakiNavigation";
import ActionButton from "@/components/emaki/viewer/ActionButton";
import FullScreen from "@/components/emaki/viewer/FullScreen";
import ZoomLayer from "@/components/emaki/viewer/ZoomLayer";
import SceneCommentaryBar from "@/components/emaki/viewer/SceneCommentaryBar";
import PositionIndicator from "@/components/emaki/viewer/PositionIndicator";
import SwitcherEmaki from "@/components/emaki/viewer/SwitcherEmaki";
import WheelScrollIndicator from "@/components/emaki/viewer/WheelScrollIndicator";
import {
  EmakiViewerOverlays,
  EbikiCoordinatePickerHud,
} from "@/components/emaki/layout/EmakiViewerOverlays";
import { AppContext } from "@/context/AppContext";
import { assignUniqueIndex } from "@/utils/emakiItemIndexer";
import {
  faMagnifyingGlass,
  faMagnifyingGlassMinus,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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
import useEmakiViewerLifecycle, {
  useViewerTopInset,
  useEmakiZoomOpenHandlers,
  useEmakiZoomAnalyticsEffects,
  computeNextContentMounted,
} from "@/hooks/emaki/useEmakiViewerLifecycle";
import styles from "@/styles/EmakiConteiner.module.css";
import zoomStyles from "@/styles/ZoomLayer.module.css";
import commentaryStyles from "@/styles/SceneCommentaryBar.module.css";
import {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { trackManualScroll } from "@/libs/api/measurementUtils";
import { useEmakiPrompts } from "@/hooks/emaki/useEmakiPrompts";
import { isByobuScroll } from "@/utils/isByobuScroll";
import {
  buildViewerThemeStyle,
  resolveViewerLayoutMode,
} from "@/theme/colorMode";
import { scrollPositionStore } from "@/hooks/emaki/scrollPositionStore";
import { TbRectangle } from "react-icons/tb";

const QuizFab = dynamic(
  () => import("@/components/emaki/quiz/QuizFab"),
  { ssr: false }
);
const EndNudgeCard = dynamic(
  () => import("@/components/emaki/viewer/EndNudgeCard"),
  { ssr: false }
);

const EmakiContainer = ({
  data,
  height,
  width,
  scroll,
  overflowX,
  boxshadow,
  selectedRef,
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
}) => {
  const {
    setOepnSidebar,
    oepnSidebar,
    orientation,
    handleToId,
    toggleFullscreen,
    handleFullScreen,
    isHelpModalOpen,
    setnavIndex,
    isScrollDetectedUpdateRef,
  } = useContext(AppContext);

  const { backgroundImage } = data;
  const { locale, locales, asPath, defaultLocale, query, isReady, push, pathname, replace } =
    useRouter();
  const { t } = useTranslation("common");

  const wrapperRef = useRef();
  const articleRef = useRef();
  const entryContainerRef = useRef(null);
  const enterZoomRef = useRef(null);
  const zoomToSlicePercentRef = useRef(null);
  const touchDoubleTapAtRef = useRef(0);
  const scrollNextRef = useRef(null);
  const scrollPrevRef = useRef(null);
  const contentWindowMountedRef = useRef(new Set());
  const contentWindowEmakiRef = useRef(data.id);

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

  const [isMdLandscape, setIsMdLandscape] = useState(false);
  const commentaryFloating = Boolean(toggleFullscreen) || isMdLandscape;

  useLayoutEffect(() => {
    if (typeof window === "undefined") return undefined;
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => {
      setIsMdLandscape(orientation === "landscape" && mq.matches);
    };
    update();
    mq.addEventListener?.("change", update);
    window.addEventListener("orientationchange", update);
    return () => {
      mq.removeEventListener?.("change", update);
      window.removeEventListener("orientationchange", update);
    };
  }, [orientation]);

  const viewerTopInset = useViewerTopInset({
    commentaryFloating,
    toggleFullscreen,
    entryContainerRef,
  });

  const emakiId = data.titleen;
  const lastDetectedSceneRef = useRef(navIndex);
  const detectCurrentSceneRef = useRef(null);
  const indicatorElRef = useRef(null);

  const [isScrolling, setIsScrolling] = useState(false);
  const isScrollingRef = useRef(false);
  const [idlePaused, setIdlePaused] = useState(false);

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

  const wasPalmActiveRef = useRef(false);
  useEffect(() => {
    if (isPalmMode) {
      wasPalmActiveRef.current = true;
      return undefined;
    }
    if (!wasPalmActiveRef.current) return undefined;
    wasPalmActiveRef.current = false;
    const t = setTimeout(() => {
      if (typeof detectCurrentSceneRef.current === "function") {
        detectCurrentSceneRef.current();
      }
    }, 120);
    return () => clearTimeout(t);
  }, [isPalmMode]);

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

  const processedEmakis = useMemo(
    () => assignUniqueIndex(data.emakis || []),
    [data.emakis]
  );

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

  const isEditSpotsMode =
    process.env.NODE_ENV === "development" &&
    (query?.editSpots === "1" ||
      (typeof window !== "undefined" &&
        new URLSearchParams(window.location.search).get("editSpots") === "1"));

  const handleToggleEditSpots = () => {
    const nextQuery = { ...query };
    if (isEditSpotsMode) {
      delete nextQuery.editSpots;
    } else {
      nextQuery.editSpots = "1";
    }
    replace({ pathname, query: nextQuery }, undefined, { shallow: true });
  };

  const viewerLayout = resolveViewerLayoutMode({
    data,
    commentaryFloating,
    isFullscreen: toggleFullscreen,
  });

  return (
    <div
      className={`${
        orientation === "landscape" && scroll ? styles.land : styles.prt
      }`}
    >
      <div
        ref={entryContainerRef}
        data-commentary-float={commentaryFloating ? "true" : undefined}
        data-viewer-mode={viewerLayout.viewerMode}
        data-layout-placement={viewerLayout.layoutPlacement}
        className={`js-scrollable entry-container ${
          hasCommentaryData ? commentaryStyles.hasCommentaryBar : ""
        }`}
        style={{
          ...buildViewerThemeStyle(data),
          borderRadius:
            orientation === "landscape" &&
            scroll &&
            toggleFullscreen === false &&
            "12px",
          overflow:
            orientation === "landscape" &&
            scroll &&
            !toggleFullscreen &&
            "hidden",
          width: toggleFullscreen ? "100%" : undefined,
          height: toggleFullscreen ? "100%" : undefined,
          position: "relative",
          touchAction: "pan-x pan-y",
          ...(viewerTopInset != null
            ? { "--emaki-top-inset": `${viewerTopInset}px` }
            : null),
        }}
      >
        {process.env.NODE_ENV === "development" && scroll && (
          <button
            type="button"
            onClick={handleToggleEditSpots}
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              zIndex: 120,
              padding: "6px 10px",
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 6,
              border: "1px solid rgba(255, 255, 255, 0.35)",
              background: isEditSpotsMode
                ? "rgba(255, 140, 119, 0.92)"
                : "rgba(20, 20, 20, 0.75)",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            {isEditSpotsMode ? "編集終了（通常表示へ）" : "スポット編集"}
          </button>
        )}
        {scroll && (
          <FullScreen isUIVisible={isUIVisible} isBarFloating={commentaryFloating} />
        )}
        {scroll && !isEditSpotsMode && (
          <WheelScrollIndicator
            showToast={showWheelToast}
            onToastComplete={() => setShowWheelToast(false)}
          />
        )}
        {scroll && !isEditSpotsMode && (
          <PositionIndicator
            indicatorElRef={indicatorElRef}
            isScrolling={isScrolling}
            isUIVisible={isUIVisible}
          />
        )}
        {scroll && !isEditSpotsMode && onToggleTheater && (
          <div className={zoomStyles.theaterAnchor}>
            <ActionButton
              icon={<TbRectangle style={{ fontSize: "1.5em" }} aria-hidden />}
              description={
                isTheaterMode
                  ? t("discovery.railExpand")
                  : t("discovery.railCollapse")
              }
              onClick={onToggleTheater}
              variant="fullscreen"
              isOn={isTheaterMode}
              isFullscreen={toggleFullscreen}
              isBarFloating={commentaryFloating || isZoomed}
              isUIVisible={isUIVisible}
            />
          </div>
        )}
        {scroll && (
          <>
            <div className={zoomStyles.toggleAnchor}>
              <ActionButton
                icon={
                  <FontAwesomeIcon
                    icon={isZoomed ? faMagnifyingGlassMinus : faMagnifyingGlass}
                    style={{ fontSize: "1.5em" }}
                  />
                }
                description={
                  isZoomed ? t("viewer.zoomToggleOut") : t("viewer.zoomToggleIn")
                }
                onClick={() => {
                  const rect = entryContainerRef.current?.getBoundingClientRect();
                  toggleZoom(
                    rect ? rect.left + rect.width / 2 : null,
                    rect ? rect.top + rect.height / 2 : null
                  );
                }}
                variant="fullscreen"
                isOn={isZoomed}
                isFullscreen={toggleFullscreen}
                isBarFloating={commentaryFloating || isZoomed}
                isUIVisible={isUIVisible}
              />
            </div>
          </>
        )}
        {scroll && !isEditSpotsMode && !isZoomed && (
          <>
            <EmakiNavigation
              handleToId={handleToId}
              data={data}
              isUIVisible={isUIVisible}
              isPlayMode={isPlayMode}
              isAutoScrolling={isAutoScrolling}
              onStartPlayMode={startPlayMode}
              onStopPlayMode={stopPlayMode}
            />
          </>
        )}
        {scroll && toggleFullscreen && (
          <EmakiInfo value={data} isUIVisible={isUIVisible} />
        )}
        <EmakiViewerOverlays
          scroll={scroll}
          isHelpModalOpen={isHelpModalOpen}
          isPolaroidModalOpen={isPolaroidModalOpen}
          processedEmakis={processedEmakis}
          data={data}
          polaroidSceneIndex={polaroidSceneIndex}
          polaroidInitialZoom={polaroidInitialZoom}
          polaroidInitialPan={polaroidInitialPan}
          polaroidModalKey={polaroidModalKey}
          handleClosePolaroidModal={handleClosePolaroidModal}
          canShowQuizChrome={canShowQuizChrome}
          openQuizUi={openQuizUi}
          isUIVisible={isUIVisible}
          fabMode={fabMode}
          activeQuiz={activeQuiz}
          quizSession={quizSession}
          quizUi={quizUi}
          emakiId={emakiId}
          handleQuizSessionChange={handleQuizSessionChange}
          closeQuizUi={closeQuizUi}
          abandonQuizUi={abandonQuizUi}
          handleQuizJumpLocal={handleQuizJumpLocal}
          handleQuizJumpScroll={handleQuizJumpScroll}
          isScrollFeedbackOpen={isScrollFeedbackOpen}
          setIsScrollFeedbackOpen={setIsScrollFeedbackOpen}
          getScrollRatio={getScrollRatio}
          locale={locale}
          handleScrollFeedbackSubmitted={handleScrollFeedbackSubmitted}
          showSharePullPrompt={showSharePullPrompt}
          handleSharePromptCopy={handleSharePromptCopy}
          dismissSharePrompt={dismissSharePrompt}
          showMidFeedbackPrompt={showMidFeedbackPrompt}
          handleMidFeedbackPrimary={handleMidFeedbackPrimary}
          dismissMidFeedbackPrompt={dismissMidFeedbackPrompt}
          showScrollFeedbackEndPrompt={showScrollFeedbackEndPrompt}
          dismissEndPrompt={dismissEndPrompt}
          shareTitle={shareTitle}
          navIndex={navIndex}
          liveSceneIndex={liveSceneIndex}
          scrollFeedbackSubmitted={scrollFeedbackSubmitted}
        />
        <article
          className={`${styles.container} ${styles.rl} scrollbar ${
            isPalmMode ? styles.palmMode : ""
          }`}
          style={{
            "--screen-height": height,
            "--screen-width": width,
            "--overflow-x": overflowX,
            "--box-shadow": boxshadow,
          }}
          onPointerDown={handleRailPointerDown}
          onClick={() => {
            if (isPlayMode) {
              stopPlayMode();
              return;
            }
            if (Date.now() < suppressClickUntilRef.current) return;
            setOepnSidebar(false);
          }}
          onDoubleClick={(e) => {
            if (e.target.closest("button, a, [role='button']")) return;
            if (Date.now() < suppressClickUntilRef.current) return;
            if (Date.now() - touchDoubleTapAtRef.current < 600) return;
            handleFullScreen("landscape");
          }}
          onTouchStart={(e) => {
            handleRailTouchStart(e);
            if (isPlayMode) {
              stopPlayMode();
            }
            if (!isAutoScrolling) {
              trackManualScroll(emakiId, "touch");
            }
          }}
          onTouchEnd={(e) => {
            handleRailTouchEnd(e);
          }}
          onWheel={handleRailWheel}
          ref={articleRef}
        >
          {processedEmakis.map((item, index) => {
            const { cat, src } = item;
            return (
              <SwitcherEmaki
                key={index}
                cat={cat}
                data={data}
                item={item}
                index={index}
                src={src}
                backgroundImage={backgroundImage}
                selectedRef={selectedRef}
                navIndex={navIndex}
                sceneIndex={windowCenter}
                uniqueIndex={item.uniqueIndex}
                scroll={scroll}
                isPlayMode={windowIsPlaying}
                floatLandscape={commentaryFloating && !toggleFullscreen}
                mountContent={nextContentMounted.has(index)}
                ebikiPickerEnabled={ebikiPickerEnabled}
                onEbikiPick={onEbikiPick}
                onSelectSpot={onSelectSpot}
                selectedSpotId={selectedSpotId}
              />
            );
          })}
          {hasNextVolume && showEndNudge && (
            <EndNudgeCard
              editionLinks={editionLinks}
              showKusouzuHubLink={showKusouzuHubLink}
              showChojuGigaHubLink={showChojuGigaHubLink}
              showHyakkiHubLink={showHyakkiHubLink}
              showRakuchuRakugaiHubLink={showRakuchuRakugaiHubLink}
              showEndNudge
            />
          )}
        </article>
        <ZoomLayer
          isZoomed={isZoomed}
          onCapture={handleCaptureFromZoom}
          scale={zoomScale}
          panX={panX}
          panY={panY}
          zoomRef={zoomRef}
          stageRef={zoomStageRef}
          stripRef={zoomStripRef}
          zoomIn={zoomIn}
          zoomOut={zoomOut}
          resetZoom={resetZoom}
          handlers={zoomHandlers}
          slices={zoomSlices}
          centerKey={zoomCenterIndex}
          onSelectSpot={onSelectSpot}
          selectedSpotId={selectedSpotId}
        />
        {ebikiPickerEnabled && (
          <EbikiCoordinatePickerHud
            hudData={ebikiPickerHud}
            onClose={clearEbikiPickerHud}
          />
        )}
        {hasCommentaryData &&
          !ebikiPickerEnabled &&
          !isEditSpotsMode &&
          ((isByobu && allSpots.length > 0) ||
            (!isZoomed || Boolean(selectedSpot))) && (
            <SceneCommentaryBar
              data={data}
              navIndex={liveSceneIndex}
              isFullscreen={toggleFullscreen}
              commentaryFloating={commentaryFloating}
              openPolaroidModal={handleOpenPolaroidModal}
              entryContainerRef={entryContainerRef}
              isPlayMode={isPlayMode}
              onIdlePauseChange={setIdlePaused}
              onIdleActivity={resetIdleTimer}
              selectedSpot={selectedSpot}
              onClearSelectedSpot={onClearSelectedSpot}
              allSpots={allSpots}
              onSelectSpot={onSelectSpotFromCommentary}
              quizFab={
                canShowQuizChrome ? (
                  <QuizFab
                    onOpen={openQuizUi}
                    isUIVisible={isUIVisible}
                    mode={fabMode}
                    variant="bar"
                  />
                ) : null
              }
            />
          )}
      </div>
    </div>
  );
};

export default EmakiContainer;