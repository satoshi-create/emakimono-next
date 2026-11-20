/**
 * EmakiConteiner.js
 *
 * 【責務（Step 2 責務分離後）】
 * - 絵巻ビューアのレイアウトオーケストレーター
 * - useEmakiViewerOrchestrator の戻り値を各レイアウトコンポーネントへ配線する
 */
import dynamic from "next/dynamic";
import ZoomLayer from "@/components/emaki/viewer/ZoomLayer";
import SpotPins from "@/components/emaki/viewer/SpotPins";
import { EmakiViewerChrome } from "@/components/emaki/layout/EmakiViewerChrome";
import SceneCommentaryBar from "@/components/emaki/viewer/SceneCommentaryBar";
import SwitcherEmaki from "@/components/emaki/viewer/SwitcherEmaki";
import { EmakiViewerOverlays } from "@/components/emaki/layout/EmakiViewerOverlays";
import { EbikiCoordinatePickerHud } from "@/components/dev/EbikiCoordinatePicker";
import { useEffect, useState } from "react";
import useEmakiViewerOrchestrator from "@/hooks/emaki/useEmakiViewerOrchestrator";
import styles from "@/styles/EmakiConteiner.module.css";
import commentaryStyles from "@/styles/SceneCommentaryBar.module.css";
import { buildViewerThemeStyle } from "@/theme/colorMode";

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
  // 1. オーケストレーターフック接続
  const {
    refs,
    layoutState,
    chromeProps,
    overlaysProps,
    stageProps,
    zoomLayerProps,
    commentaryBarProps,
    ebikiHudProps,
  } = useEmakiViewerOrchestrator({
    data,
    height,
    width,
    scroll,
    overflowX,
    boxshadow,
    selectedRef,
    navIndex,
    editionLinks,
    showKusouzuHubLink,
    showChojuGigaHubLink,
    showHyakkiHubLink,
    showRakuchuRakugaiHubLink,
    onUserScrollStart,
    onReachStartBoundary,
    isTheaterMode,
    onToggleTheater,
    theaterSuppressRef,
    railPinFromExpandRef,
    railPinScrollLeftRef,
  });

  const { backgroundImage } = data;

  const [isMapDrawerOpen, setIsMapDrawerOpen] = useState(false);
  useEffect(() => {
    const body = document.body;
    const syncMapDrawerOpen = () => {
      setIsMapDrawerOpen(body?.dataset?.mapDrawerOpen === "true");
    };
    syncMapDrawerOpen();
    const observer = new MutationObserver(syncMapDrawerOpen);
    observer.observe(body, {
      attributes: true,
      attributeFilter: ["data-map-drawer-open"],
    });
    return () => observer.disconnect();
  }, []);

  const stageTouchAction = isMapDrawerOpen ? "none" : "pan-x pan-y";

  const usePanoramaSpotLayer =
    Array.isArray(data?.spots) ||
    Boolean(
      layoutState.panoramaSpots?.some((s) => s?.quizQuestionId != null)
    );

  // 2. ビューアレイアウト描画
  return (
    <div
      className={`${
        layoutState.orientation === "landscape" && scroll
          ? styles.land
          : styles.prt
      }`}
    >
      <div
        ref={refs.entryContainerRef}
        data-commentary-float={
          layoutState.commentaryFloating ? "true" : undefined
        }
        data-viewer-mode={layoutState.viewerLayout.viewerMode}
        data-layout-placement={layoutState.viewerLayout.layoutPlacement}
        className={`js-scrollable entry-container ${
          layoutState.hasCommentaryData ? commentaryStyles.hasCommentaryBar : ""
        }`}
        style={{
          ...buildViewerThemeStyle(data),
          borderRadius:
            layoutState.orientation === "landscape" &&
            scroll &&
            layoutState.toggleFullscreen === false &&
            "12px",
          overflow:
            layoutState.orientation === "landscape" &&
            scroll &&
            !layoutState.toggleFullscreen &&
            "hidden",
          width: layoutState.toggleFullscreen ? "100%" : undefined,
          height: layoutState.toggleFullscreen ? "100%" : undefined,
          position: "relative",
          touchAction: stageTouchAction,
          ...(layoutState.viewerTopInset != null
            ? { "--emaki-top-inset": `${layoutState.viewerTopInset}px` }
            : null),
        }}
      >
        <EmakiViewerChrome {...chromeProps} />
        <EmakiViewerOverlays {...overlaysProps} />
        <article
          className={`${styles.container} ${styles.rl} scrollbar ${
            layoutState.isPalmMode ? styles.palmMode : ""
          }`}
          style={{
            "--screen-height": height,
            "--screen-width": width,
            "--overflow-x": overflowX,
            "--box-shadow": boxshadow,
            touchAction: isMapDrawerOpen ? "none" : undefined,
          }}
          onPointerDown={stageProps.handleRailPointerDown}
          {...stageProps.stageHandlers}
          onWheel={stageProps.handleRailWheel}
          ref={refs.articleRef}
        >
          <div
            style={{
              position: "relative",
              display: "inline-flex",
              flexDirection: "row-reverse",
              width: "max-content",
              height: "100%",
              flexShrink: 0,
            }}
          >
            {layoutState.processedEmakis.map((item, index) => {
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
                  sceneIndex={layoutState.windowCenter}
                  uniqueIndex={item.uniqueIndex}
                  scroll={scroll}
                  isPlayMode={layoutState.windowIsPlaying}
                  floatLandscape={
                    layoutState.commentaryFloating &&
                    !layoutState.toggleFullscreen
                  }
                  mountContent={layoutState.nextContentMounted.has(index)}
                  ebikiPickerEnabled={layoutState.ebikiPickerEnabled}
                  onEbikiPick={stageProps.onEbikiPick}
                  onSelectSpot={stageProps.onSelectSpot}
                  selectedSpotId={layoutState.selectedSpotId}
                />
              );
            })}
            {!layoutState.isZoomed &&
              usePanoramaSpotLayer &&
              (layoutState.hasPanoramaSpots || layoutState.isEditSpotsMode) && (
              <SpotPins
                spots={layoutState.panoramaSpots}
                isPanorama
                linkId={layoutState.panoramaLinkId}
                zoomScale={1}
                data={data}
                ebikiPickerEnabled={layoutState.ebikiPickerEnabled}
                onSelectSpot={stageProps.onSelectSpot}
                selectedSpotId={layoutState.selectedSpotId}
              />
            )}
          </div>
          {layoutState.hasNextVolume && layoutState.showEndNudge && (
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
        <ZoomLayer {...zoomLayerProps} />
        {layoutState.ebikiPickerEnabled && (
          <EbikiCoordinatePickerHud {...ebikiHudProps} />
        )}
        {layoutState.hasCommentaryData &&
          !layoutState.ebikiPickerEnabled &&
          !layoutState.isEditSpotsMode &&
          ((layoutState.isSpotGuide && layoutState.allSpots.length > 0) ||
            (!layoutState.isZoomed || Boolean(layoutState.selectedSpot))) && (
            <SceneCommentaryBar
              {...commentaryBarProps}
              quizFab={
                commentaryBarProps.canShowQuizChrome ? (
                  <QuizFab
                    onOpen={commentaryBarProps.openQuizUi}
                    isUIVisible={commentaryBarProps.isUIVisible}
                    mode={commentaryBarProps.fabMode}
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
