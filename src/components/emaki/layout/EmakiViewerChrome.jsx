import EmakiInfo from "@/components/emaki/metadata/EmakiInfo";
import EmakiNavigation from "@/components/emaki/navigation/EmakiNavigation";
import ActionButton from "@/components/emaki/viewer/ActionButton";
import FullScreen from "@/components/emaki/viewer/FullScreen";
import PositionIndicator from "@/components/emaki/viewer/PositionIndicator";
import WheelScrollIndicator from "@/components/emaki/viewer/WheelScrollIndicator";
import {
  faMagnifyingGlass,
  faMagnifyingGlassMinus,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import zoomStyles from "@/styles/ZoomLayer.module.css";
import { TbRectangle } from "react-icons/tb";

export function EmakiViewerChrome({
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
}) {
  return (
    <>
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
    </>
  );
}