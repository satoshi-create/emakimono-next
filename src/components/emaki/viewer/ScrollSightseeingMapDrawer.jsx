import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
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
    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
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

  const hubHref = "/rakuchu-rakugai/chapters#sightseeing-map";

  const spotCountLabel = isEn
    ? `${geoSpots.length} spots`
    : `${geoSpots.length}件のスポット`;

  return (
    <div
      className="ssmd-backdrop"
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
        className="ssmd-panel"
        style={
          drawerWidth != null
            ? { width: drawerWidth, maxWidth: drawerWidth }
            : undefined
        }
      >
        <div
          className="ssmd-resize-handle"
          role="separator"
          aria-orientation="vertical"
          aria-label={isEn ? "Resize panel" : "パネル幅を調整"}
          onPointerDown={handleResizePointerDown}
        >
          <span className="ssmd-resize-grip" aria-hidden="true" />
        </div>
        <header className="ssmd-header">
          <div className="ssmd-header-main">
            <div className="ssmd-title-row">
              <h2 className="ssmd-title">
                {scrollTitle || (isEn ? "Sightseeing Map" : "観光マップ")}
              </h2>
              <span className="ssmd-count">{spotCountLabel}</span>
            </div>
            <div className="ssmd-header-actions">
              <Link href={hubHref}>
                <a className="ssmd-hub-link">
                  {isEn ? "Open full map page" : "全体マップページで開く"}
                  <span aria-hidden="true">↗</span>
                </a>
              </Link>
            </div>
          </div>
          <div className="ssmd-header-btns">
            <button
              type="button"
              className="ssmd-width-toggle-btn"
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
              className="ssmd-close-btn"
              onClick={() => onClose?.()}
              aria-label={isEn ? "Close map" : "地図を閉じる"}
            >
              ✕
            </button>
          </div>
        </header>

        {geoSpots.length > 0 && (
          <div
            className="ssmd-chips"
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
                  className={`ssmd-chip ${isActive ? "is-active" : ""}`}
                  onClick={() => setActiveGeoSpotId(spot.id)}
                >
                  <span className="ssmd-chip-num">{idx + 1}</span>
                  <span className="ssmd-chip-label">{name}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="ssmd-map-body">
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
            <div className="ssmd-empty">
              {isEn
                ? "No sightseeing spots registered for this scroll."
                : "この絵巻に対応する観光スポットはありません。"}
            </div>
          )}
        </div>
      </aside>

      <style jsx>{`
        .ssmd-backdrop {
          position: fixed;
          inset: 0;
          z-index: 1200;
          background: rgba(15, 23, 42, 0.45);
          display: flex;
          justify-content: flex-end;
          align-items: stretch;
          font-family: var(--font-ui, sans-serif);
          overscroll-behavior: contain;
        }

        .ssmd-panel {
          position: relative;
          width: min(680px, 92vw);
          height: 100%;
          background: var(--clr-bg, #ffffff);
          color: var(--clr-text, #141414);
          display: flex;
          flex-direction: column;
          box-shadow: -8px 0 32px rgba(15, 23, 42, 0.18);
          animation: ssmdSlideInRight 0.22s ease-out;
          overflow: hidden;
          overscroll-behavior: contain;
        }

        .ssmd-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 16px 12px;
          border-bottom: 1px solid #e2e8f0;
          background: var(--clr-surface, #f9fbff);
          flex-shrink: 0;
        }

        .ssmd-header-main {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 0;
          flex: 1;
        }

        .ssmd-title-row {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }

        .ssmd-title {
          margin: 0;
          font-size: 1rem;
          font-weight: 700;
          line-height: 1.35;
          color: var(--clr-text, #141414);
        }

        .ssmd-count {
          display: inline-flex;
          align-items: center;
          padding: 2px 8px;
          border-radius: 9999px;
          background: #e2e8f0;
          color: #334155;
          font-size: 0.75rem;
          font-weight: 600;
          line-height: 1.4;
          white-space: nowrap;
        }

        .ssmd-header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .ssmd-hub-link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--clr-link, #065fd4);
          text-decoration: none;
        }

        .ssmd-hub-link:hover {
          text-decoration: underline;
        }

        .ssmd-resize-handle {
          position: absolute;
          top: 0;
          left: 0;
          bottom: 0;
          width: 10px;
          cursor: ew-resize;
          z-index: 60;
          touch-action: none;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ssmd-resize-grip {
          width: 3px;
          height: 36px;
          border-radius: 2px;
          background: #94a3b8;
          pointer-events: none;
        }

        .ssmd-header-btns {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .ssmd-width-toggle-btn {
          height: 34px;
          padding: 0 10px;
          border-radius: 9999px;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #334155;
          font-size: 0.75rem;
          font-weight: 600;
          line-height: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          white-space: nowrap;
          transition: background-color 0.15s ease, color 0.15s ease;
        }

        .ssmd-width-toggle-btn:hover {
          background: #f1f5f9;
          color: #0f172a;
        }

        .ssmd-close-btn {
          width: 34px;
          height: 34px;
          border-radius: 9999px;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #334155;
          font-size: 1rem;
          line-height: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: background-color 0.15s ease, color 0.15s ease;
        }

        .ssmd-close-btn:hover {
          background: #f1f5f9;
          color: #0f172a;
        }

        .ssmd-chips {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          overflow-x: auto;
          border-bottom: 1px solid #e2e8f0;
          background: #ffffff;
          flex-shrink: 0;
          scrollbar-width: thin;
        }

        .ssmd-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 9999px;
          border: 1px solid #cbd5e1;
          background: #f8fafc;
          color: #1e293b;
          font-size: 0.8125rem;
          font-weight: 500;
          white-space: nowrap;
          cursor: pointer;
          flex-shrink: 0;
          transition: all 0.15s ease;
        }

        .ssmd-chip:hover {
          border-color: #94a3b8;
          background: #f1f5f9;
        }

        .ssmd-chip.is-active {
          border-color: #e11d48;
          background: #fff1f2;
          color: #be123c;
          font-weight: 700;
        }

        .ssmd-chip-num {
          width: 20px;
          height: 20px;
          border-radius: 9999px;
          background: #1e3a5f;
          color: #ffffff;
          font-size: 0.7rem;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .ssmd-chip.is-active .ssmd-chip-num {
          background: #e11d48;
        }

        .ssmd-map-body {
          flex: 1;
          min-height: 0;
          position: relative;
        }

        .ssmd-empty {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          color: var(--clr-text-muted, #727272);
          font-size: 0.875rem;
          text-align: center;
        }

        @keyframes ssmdSlideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }

        @keyframes ssmdSlideInUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }

        @media (max-width: 767px) {
          .ssmd-backdrop {
            align-items: flex-end;
            justify-content: center;
          }

          .ssmd-panel {
            width: 100%;
            height: 92dvh;
            border-top-left-radius: 16px;
            border-top-right-radius: 16px;
            box-shadow: 0 -8px 32px rgba(15, 23, 42, 0.22);
            animation: ssmdSlideInUp 0.22s ease-out;
          }

          .ssmd-resize-handle,
          .ssmd-width-toggle-btn {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default ScrollSightseeingMapDrawer;
