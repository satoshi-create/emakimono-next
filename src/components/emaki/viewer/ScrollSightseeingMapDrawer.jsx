import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import styles from "@/styles/ScrollSightseeingMapDrawer.module.css";
import {
  findGeoSpotByScrollSpot,
  getGeoSpotsForScroll,
} from "@/data/hub/rakuchuRakugaiGeoSpots";

const ScrollSpotMapCanvas = dynamic(() => import("./ScrollSpotMapCanvas"), {
  ssr: false,
});

const ScrollSightseeingMapDrawer = ({
  isOpen,
  onClose,
  titleen = "",
  scrollTitle = "",
  selectedSpotId = null,
  allSpots = [],
  onSelectSpot,
  locale = "ja",
}) => {
  const isEn = locale === "en";

  const geoSpots = useMemo(() => {
    if (!titleen) return [];
    return getGeoSpotsForScroll(titleen) || [];
  }, [titleen]);

  const [activeGeoSpotId, setActiveGeoSpotId] = useState(null);
  const [drawerWidth, setDrawerWidth] = useState(null);
  const [isResizing, setIsResizing] = useState(false);

  const clampDrawerWidth = useCallback((width) => {
    const minWidth = 340;
    const maxWidth = Math.floor(window.innerWidth * 0.92);
    return Math.min(maxWidth, Math.max(minWidth, width));
  }, []);

  const notifyMapResize = useCallback(() => {
    window.dispatchEvent(new Event("resize"));
  }, []);

  const handleResizePointerDown = useCallback(
    (e) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      setIsResizing(true);
      document.body.style.userSelect = "none";
    },
    []
  );

  useEffect(() => {
    if (!isResizing) return undefined;
    const handlePointerMove = (e) => {
      const nextWidth = clampDrawerWidth(window.innerWidth - e.clientX);
      setDrawerWidth(nextWidth);
      notifyMapResize();
    };
    const handlePointerUp = () => {
      setIsResizing(false);
      document.body.style.userSelect = "";
      notifyMapResize();
    };
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      document.body.style.userSelect = "";
    };
  }, [isResizing, clampDrawerWidth, notifyMapResize]);

  const handleWidthToggle = useCallback(() => {
    setDrawerWidth((prev) => {
      if (prev === null) {
        return clampDrawerWidth(Math.floor(window.innerWidth * 0.75));
      }
      return null;
    });
    notifyMapResize();
  }, [clampDrawerWidth, notifyMapResize]);

  useEffect(() => {
    if (!isOpen) return;
    if (selectedSpotId) {
      const matched = findGeoSpotByScrollSpot(titleen, selectedSpotId);
      if (matched?.id) {
        setActiveGeoSpotId(matched.id);
        return;
      }
    }
    setActiveGeoSpotId(null);
  }, [isOpen, titleen, selectedSpotId]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.dataset.mapDrawerOpen = "true";
    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      delete body.dataset.mapDrawerOpen;
    };
  }, [isOpen]);

  const handleJumpToScrollSpot = useCallback(
    (matchedSpotId) => {
      if (!matchedSpotId || !Array.isArray(allSpots)) return;
      const targetRow = allSpots.find(
        (row) =>
          row?.spot?.id === matchedSpotId || row?.linkId === matchedSpotId
      );
      if (targetRow?.spot) {
        onSelectSpot?.(targetRow.spot);
        onClose?.();
      }
    },
    [allSpots, onSelectSpot, onClose]
  );

  if (!isOpen) return null;

  const hubHref = "/hub/rakuchu-rakugai#sightseeing-map";

  const spotCountLabel = isEn
    ? `${geoSpots.length} spots`
    : `${geoSpots.length}件のスポット`;

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-label={
        scrollTitle
          ? `${scrollTitle} — ${isEn ? "Sightseeing Map" : "観光マップ"}`
          : isEn
          ? "Sightseeing Map"
          : "観光マップ"
      }
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose?.();
        }
      }}
    >
      <aside
        className={styles.panel}
        style={
          drawerWidth != null
            ? { width: drawerWidth, maxWidth: drawerWidth }
            : undefined
        }
      >
        <div
          className={styles.resizeHandle}
          role="separator"
          aria-orientation="vertical"
          aria-label={isEn ? "Resize panel" : "パネル幅を調整"}
          onPointerDown={handleResizePointerDown}
        >
          <span className={styles.resizeGrip} aria-hidden="true" />
        </div>
        <header className={styles.header}>
          <div className={styles.headerMain}>
            <div className={styles.titleRow}>
              <h2 className={styles.title}>
                {scrollTitle || (isEn ? "Sightseeing Map" : "観光マップ")}
              </h2>
              <span className={styles.count}>{spotCountLabel}</span>
            </div>
            <div className={styles.headerActions}>
              <Link href={hubHref}>
                <a className={styles.hubLink}>
                  {isEn ? "Open full map page" : "全体マップページで開く"}
                  <span aria-hidden="true">↗</span>
                </a>
              </Link>
            </div>
          </div>
          <div className={styles.headerBtns}>
            <button
              type="button"
              className={styles.widthToggleBtn}
              onClick={handleWidthToggle}
              aria-label={
                isEn
                  ? drawerWidth != null
                    ? "Reset panel width"
                    : "Widen panel"
                  : drawerWidth != null
                  ? "標準幅に戻す"
                  : "パネルを広げる"
              }
            >
              {isEn
                ? drawerWidth != null
                  ? "↔ Standard"
                  : "↔ Widen"
                : drawerWidth != null
                ? "↔ 標準幅"
                : "↔ 広げる"}
            </button>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={() => onClose?.()}
              aria-label={isEn ? "Close map" : "地図を閉じる"}
            >
              ✕
            </button>
          </div>
        </header>

        {geoSpots.length > 0 && (
          <div
            className={styles.chips}
            role="tablist"
            aria-label={isEn ? "Spot selector" : "スポット一覧"}
          >
            {geoSpots.map((spot, idx) => {
              const isActive = spot.id === activeGeoSpotId;
              const name = isEn
                ? spot.nameEn || spot.nameJa
                : spot.nameJa || spot.nameEn;
              return (
                <button
                  key={spot.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`${styles.chip} ${isActive ? styles.chipActive : ""}`}
                  onClick={() => setActiveGeoSpotId(spot.id)}
                >
                  <span className={styles.chipNum}>{idx + 1}</span>
                  <span>{name}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className={styles.mapBody}>
          {geoSpots.length > 0 ? (
            <ScrollSpotMapCanvas
              currentTitleen={titleen}
              geoSpots={geoSpots}
              activeGeoSpotId={activeGeoSpotId}
              onSelectGeoSpot={(geoSpot) =>
                setActiveGeoSpotId(geoSpot?.id || null)
              }
              onJumpToScrollSpot={handleJumpToScrollSpot}
              locale={locale}
            />
          ) : (
            <div className={styles.empty}>
              {isEn
                ? "No sightseeing spots registered for this scroll."
                : "この絵巻に対応する観光スポットはありません。"}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};

export default ScrollSightseeingMapDrawer;
