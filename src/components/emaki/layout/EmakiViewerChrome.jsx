import EmakiInfo from "@/components/emaki/metadata/EmakiInfo";
import EmakiNavigation from "@/components/emaki/navigation/EmakiNavigation";
import ActionButton from "@/components/emaki/viewer/ActionButton";
import FullScreen from "@/components/emaki/viewer/FullScreen";
import PositionIndicator from "@/components/emaki/viewer/PositionIndicator";
import WheelScrollIndicator from "@/components/emaki/viewer/WheelScrollIndicator";
import {
  faMagnifyingGlass,
  faMagnifyingGlassMinus,
  faMapLocationDot,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getGeoSpotsForScroll } from "@/data/hub/rakuchuRakugaiGeoSpots";
import zoomStyles from "@/styles/ZoomLayer.module.css";
import Link from "next/link";
import { useMemo, useState } from "react";
import { TbRectangle } from "react-icons/tb";
import ScrollSightseeingMapDrawer from "../viewer/ScrollSightseeingMapDrawer";

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
  titleen,
  scrollTitle,
  selectedSpotId,
  selectedSpot,
  allSpots,
  onSelectSpot,
  locale = "ja",
  isMapDrawerOpen: controlledIsMapDrawerOpen,
  openMapDrawer,
  closeMapDrawer,
  isLtr = false,
}) {
  const [localIsMapDrawerOpen, setLocalIsMapDrawerOpen] = useState(false);
  const isDrawerOpen = controlledIsMapDrawerOpen ?? localIsMapDrawerOpen;
  const handleOpenDrawer = openMapDrawer ?? (() => setLocalIsMapDrawerOpen(true));
  const handleCloseDrawer = closeMapDrawer ?? (() => setLocalIsMapDrawerOpen(false));
  const hasGeoSpots = useMemo(
    () => Boolean(titleen) && getGeoSpotsForScroll(titleen).length > 0,
    [titleen]
  );

  return (
    <>
      {scroll && (process.env.NODE_ENV === "development" || hasGeoSpots) && (
        <div
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            zIndex: 120,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {hasGeoSpots && (
            <button
              type="button"
              onClick={handleOpenDrawer}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 9999,
                border: "none",
                background: "rgba(255, 255, 255, 0.94)",
                color: "#1e293b",
                boxShadow: "0 2px 8px rgba(15, 23, 42, 0.16)",
                cursor: "pointer",
              }}
            >
              <FontAwesomeIcon
                icon={faMapLocationDot}
                style={{ color: "#c2410c", fontSize: 14 }}
                aria-hidden
              />
              {locale === "en" ? "Kyoto Map" : "京都マップ"}
            </button>
          )}
          {(process.env.NODE_ENV === "development" ||
            (typeof window !== "undefined" &&
              Boolean(process.env.NEXT_PUBLIC_BOARD_ADMIN_KEY) &&
              localStorage.getItem("emakimono_board_admin_key") ===
                process.env.NEXT_PUBLIC_BOARD_ADMIN_KEY)) && (
            <Link href="/dev">
              <a
                style={{
                  padding: "6px 10px",
                  fontSize: 12,
                  fontWeight: 600,
                  borderRadius: 6,
                  border: "1px solid rgba(255, 255, 255, 0.35)",
                  background: "rgba(20, 20, 20, 0.75)",
                  color: "#fff",
                  cursor: "pointer",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                開発ハブ (/dev)
              </a>
            </Link>
          )}
          {process.env.NODE_ENV === "development" && (
            <>
              <button
                type="button"
                onClick={handleToggleEditSpots}
                style={{
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
            </>
          )}
        </div>
      )}
      {scroll && (
        <FullScreen isUIVisible={isUIVisible} isBarFloating={commentaryFloating || isZoomed} />
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
          isLtr={isLtr}
        />
      )}
      {scroll && !isEditSpotsMode && onToggleTheater && (
        <div
          className={`${zoomStyles.theaterAnchor}${
            isLtr ? ` ${zoomStyles.theaterAnchorLtr}` : ""
          }`}
        >
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
      {scroll && hasGeoSpots && (
        <ScrollSightseeingMapDrawer
          isOpen={isDrawerOpen}
          onClose={handleCloseDrawer}
          titleen={titleen}
          scrollTitle={scrollTitle}
          selectedSpotId={
            selectedSpot?.id
              ? String(selectedSpot.id)
              : selectedSpotId
                ? String(selectedSpotId)
                : null
          }
          allSpots={allSpots}
          onSelectSpot={onSelectSpot}
          locale={locale}
        />
      )}
    </>
  );
}