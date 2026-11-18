import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { REGIONS, ROUTES, THEMES } from "@/data/hub/hubData";
import { getMasterByRawSpotId } from "@/data/rakuchu-rakugai/rakuchuMotifMaster";

const DynamicEmakiHubMap = dynamic(
  () => import("@/components/emaki/hub/EmakiHubMap"),
  { ssr: false, loading: () => <div style={styles.mapLoading}>Loading map…</div> }
);

const kyotoRoutes = ROUTES.filter((r) => r.region === "kyoto");

const SCROLL_FILTERS = [
  { id: "all", labelJa: "全伝本（3作品）", labelEn: "All Screens (3)" },
  { id: "rakuchu_rakugai_funaki", labelJa: "舟木本", labelEn: "Funaki Version" },
  { id: "rakuchu_rakugai_fukuoka", labelJa: "福岡本", labelEn: "Fukuoka Version" },
  { id: "rakuchu_rakugai_met", labelJa: "メトロポリタン本", labelEn: "Met Version" },
];

const l = (locale, ja, en) => (locale === "en" ? en : ja);

const formatSpotId = (spotId) =>
  spotId
    ? spotId.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "";

const stopLabel = (stop, locale) => {
  const wp = stop.wp || stop;
  const ja =
    stop.name?.ja ||
    stop.spot?.nameJa ||
    wp.nameJa ||
    stop.nameJa;
  const en =
    stop.name?.en ||
    stop.spot?.nameEn ||
    wp.nameEn ||
    stop.nameEn;
  if (ja || en) return locale === "en" ? en || ja : ja || en;
  if (stop.spotId) {
    const master = getMasterByRawSpotId(stop.spotId);
    if (master?.nameJa || master?.nameEn) {
      return l(locale, master.nameJa, master.nameEn);
    }
  }
  return formatSpotId(stop.spotId);
};

/**
 * 洛中洛外 chapters 用：テーマフィルタ＋地図＋おすすめルート一覧。
 * @param {{ locale: "ja" | "en"; t?: (key: string) => string }} props
 */
export function RakuchuSightseeingMapSection({ locale, t = (k) => k }) {
  const [activeTheme, setActiveTheme] = useState("all");
  const [activeScroll, setActiveScroll] = useState("all");
  const [activeRoute, setActiveRoute] = useState(null);
  const [isRoutesOpen, setIsRoutesOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const sectionContainerRef = useRef(null);

  const dispatchMapResize = useCallback(() => {
    window.dispatchEvent(new Event("resize"));
  }, []);

  const handleFullscreenToggle = useCallback(() => {
    setIsFullscreen((prev) => !prev);
    setTimeout(() => dispatchMapResize(), 50);
  }, [dispatchMapResize]);

  useEffect(() => {
    if (!isFullscreen) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isFullscreen]);

  useEffect(() => {
    if (!isFullscreen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsFullscreen(false);
        setTimeout(() => dispatchMapResize(), 50);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [dispatchMapResize, isFullscreen]);

  const handleRouteToggle = useCallback((route) => {
    setActiveRoute((prev) => (prev?.id === route.id ? null : route));
  }, []);

  const sectionTitle = l(
    locale,
    "おすすめの観光ルート（3コース）",
    "Recommended sightseeing routes (3 courses)"
  );

  const routesDesc = l(
    locale,
    "カードを選ぶと地図にルートと立ち寄り番号が表示されます。もう一度クリックで解除できます。",
    "Select a card to show the route and stop numbers on the map. Click again to clear."
  );

  const sectionEl = (
    <div
      ref={sectionContainerRef}
      style={{
        ...styles.section,
        ...(isFullscreen ? styles.sectionFullscreen : null),
      }}
      aria-labelledby="rakuchu-sightseeing-routes-heading"
    >
      <div style={styles.filterStack}>
        <div style={styles.themeBar} role="group" aria-label={l(locale, "作品", "Screen version")}>
          {SCROLL_FILTERS.map((sf) => {
            const active = activeScroll === sf.id;
            return (
              <button
                key={sf.id}
                type="button"
                style={{
                  ...styles.scrollPill,
                  ...(active ? styles.scrollPillActive : null),
                }}
                aria-pressed={active}
                onClick={() => setActiveScroll(sf.id)}
              >
                {l(locale, sf.labelJa, sf.labelEn)}
              </button>
            );
          })}
        </div>
        <div style={styles.themeBar} role="group" aria-label={l(locale, "テーマ", "Theme")}>
          {THEMES.map((th) => {
            const active = activeTheme === th.id;
            return (
              <button
                key={th.id}
                type="button"
                style={{
                  ...styles.themePill,
                  ...(active ? styles.themePillActive : null),
                }}
                aria-pressed={active}
                onClick={() => setActiveTheme(th.id)}
              >
                {l(locale, th.labelJa, th.labelEn)}
              </button>
            );
          })}
        </div>
      </div>

      <div
        style={{
          ...styles.mapWrapper,
          ...(isFullscreen ? styles.mapWrapperFullscreen : null),
        }}
      >
        <button
          type="button"
          style={styles.fullscreenToggleBtn}
          onClick={handleFullscreenToggle}
          aria-pressed={isFullscreen}
        >
          {isFullscreen
            ? l(locale, "✕ 元のサイズに戻す", "✕ Exit Fullscreen")
            : l(locale, "⛶ 全画面表示", "⛶ Fullscreen")}
        </button>
        <DynamicEmakiHubMap
          region={REGIONS.kyoto}
          regionConfig={REGIONS.kyoto}
          items={[]}
          activeTheme={activeTheme}
          activeScroll={activeScroll}
          activeRoute={activeRoute}
          onSelectRoute={setActiveRoute}
          locale={locale}
          t={t}
        />
        {!isRoutesOpen ? (
          <button
            type="button"
            style={styles.routesFloatBtn}
            onClick={() => setIsRoutesOpen(true)}
            aria-expanded={false}
            aria-controls="rakuchu-routes-drawer"
          >
            {activeRoute
              ? l(locale, "ルート表示中（解除可）", "Route shown (tap to manage)")
              : l(
                  locale,
                  "🗺️ おすすめの観光ルート",
                  "🗺️ Recommended sightseeing routes"
                )}
          </button>
        ) : null}
        {isRoutesOpen ? (
          <aside
            id="rakuchu-routes-drawer"
            style={styles.routesDrawer}
            aria-labelledby="rakuchu-sightseeing-routes-heading"
          >
            <div style={styles.routesDrawerHeader}>
              <h2 id="rakuchu-sightseeing-routes-heading" style={styles.routesHeading}>
                {sectionTitle}
              </h2>
              <button
                type="button"
                style={styles.routesDrawerClose}
                onClick={() => setIsRoutesOpen(false)}
                aria-label={l(locale, "閉じる", "Close")}
              >
                ×
              </button>
            </div>
            <p style={styles.routesLead}>{routesDesc}</p>
            <ul style={styles.routeList}>
              {kyotoRoutes.map((route) => {
                const selected = activeRoute?.id === route.id;
                const title = l(locale, route.titleJa, route.titleEn);
                const duration = l(locale, route.durationJa, route.durationEn);
                const summary = l(
                  locale,
                  route.summaryJa || route.summary?.ja,
                  route.summaryEn || route.summary?.en
                );
                return (
                  <li key={route.id} style={styles.routeListItem}>
                    <article
                      style={{
                        ...styles.routeCard,
                        ...(selected ? styles.routeCardActive : null),
                      }}
                    >
                      <button
                        type="button"
                        style={styles.routeCardButton}
                        aria-pressed={selected}
                        onClick={() => handleRouteToggle(route)}
                      >
                        <div style={styles.routeCardHeader}>
                          <h3 style={styles.routeTitle}>{title}</h3>
                          <span style={styles.routeDuration}>
                            {l(locale, "所要", "Duration")}: {duration}
                          </span>
                        </div>
                        <p style={styles.routeSummary}>{summary}</p>
                      </button>
                      <ol style={styles.stopsList}>
                        {route.stops.map((stop, idx) => (
                          <li key={`${route.id}-${idx}`} style={styles.stopItem}>
                            <span style={styles.stopNum}>{idx + 1}</span>
                            {stop.titleen && stop.spotId ? (
                              <Link
                                href={`/${stop.titleen}?spot=${encodeURIComponent(stop.spotId)}`}
                                style={styles.stopLink}
                              >
                                {stopLabel(stop, locale)}
                              </Link>
                            ) : (
                              <span style={styles.stopName}>{stopLabel(stop, locale)}</span>
                            )}
                          </li>
                        ))}
                      </ol>
                    </article>
                  </li>
                );
              })}
            </ul>
          </aside>
        ) : null}
      </div>
    </div>
  );

  if (isFullscreen && typeof document !== "undefined") {
    return createPortal(sectionEl, document.body);
  }
  return sectionEl;
}

const styles = {
  section: {
    fontFamily: "var(--font-ui, 'Noto Sans JP', sans-serif)",
    color: "var(--clr-text, rgb(20 20 20))",
    maxWidth: 1200,
    margin: "0 auto",
    width: "100%",
  },
  sectionFullscreen: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    zIndex: 9999,
    background: "#ffffff",
    padding: "12px 16px",
    display: "flex",
    flexDirection: "column",
    maxWidth: "none",
    margin: 0,
    boxSizing: "border-box",
  },
  filterStack: {
    display: "flex",
    flexDirection: "column",
    gap: "0.65rem",
    marginBottom: "1.25rem",
  },
  themeBar: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.5rem",
    marginBottom: 0,
  },
  scrollPill: {
    padding: "0.4rem 0.85rem",
    borderRadius: 6,
    border: "1px solid #cbd5e1",
    background: "var(--clr-surface, #f9fbff)",
    color: "var(--clr-text, rgb(20 20 20))",
    fontSize: "0.875rem",
    cursor: "pointer",
  },
  scrollPillActive: {
    borderColor: "#1e3a8a",
    background: "#eff6ff",
    color: "#1e3a8a",
    fontWeight: 600,
  },
  themePill: {
    padding: "0.4rem 0.85rem",
    borderRadius: 6,
    border: "1px solid #cbd5e1",
    background: "var(--clr-surface, #f9fbff)",
    color: "var(--clr-text, rgb(20 20 20))",
    fontSize: "0.875rem",
    cursor: "pointer",
  },
  themePillActive: {
    borderColor: "var(--clr-accent, #ff8c77)",
    background: "rgba(255, 140, 119, 0.12)",
    fontWeight: 600,
  },
  mapWrapper: {
    position: "relative",
    width: "100%",
    height: "clamp(400px, 60vh, 540px)",
    minHeight: 400,
    borderRadius: 12,
    overflow: "hidden",
    border: "1px solid var(--border, #e5e7eb)",
  },
  mapWrapperFullscreen: {
    flex: 1,
    minHeight: 0,
    height: "auto",
  },
  fullscreenToggleBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 480,
    background: "rgba(255, 255, 255, 0.94)",
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    padding: "6px 12px",
    fontSize: 12,
    fontWeight: 600,
    color: "#1e293b",
    boxShadow: "0 2px 6px rgba(15, 23, 42, 0.14)",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  routesFloatBtn: {
    position: "absolute",
    bottom: 24,
    right: 12,
    zIndex: 500,
    background: "#1e293b",
    color: "#ffffff",
    borderRadius: 9999,
    padding: "10px 16px",
    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.25)",
    border: "none",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: 600,
    fontFamily: "inherit",
  },
  routesDrawer: {
    position: "absolute",
    top: 12,
    right: 12,
    bottom: 24,
    width: "min(340px, calc(100% - 24px))",
    zIndex: 510,
    background: "rgba(255, 255, 255, 0.96)",
    backdropFilter: "blur(6px)",
    borderRadius: 12,
    overflowY: "auto",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.18)",
    padding: "1rem 1.25rem",
    boxSizing: "border-box",
  },
  routesDrawerHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "0.5rem",
  },
  routesDrawerClose: {
    flexShrink: 0,
    width: "2rem",
    height: "2rem",
    border: "none",
    borderRadius: 8,
    background: "transparent",
    cursor: "pointer",
    fontSize: "1.25rem",
    lineHeight: 1,
    color: "var(--clr-text-muted, rgb(114 114 114))",
  },
  routesHeading: {
    fontSize: "1.125rem",
    fontWeight: 700,
    margin: 0,
    fontFamily: "var(--font-story, 'Zen Maru Gothic', sans-serif)",
    flex: "1 1 auto",
  },
  routesLead: {
    fontSize: "0.875rem",
    color: "var(--clr-text-muted, rgb(114 114 114))",
    margin: "0 0 1rem",
    lineHeight: 1.6,
  },
  routeList: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  routeListItem: {
    margin: 0,
  },
  routeCard: {
    borderRadius: 12,
    border: "1px solid var(--border, #e5e7eb)",
    background: "var(--clr-bg, #fff)",
    overflow: "hidden",
  },
  routeCardActive: {
    borderColor: "var(--clr-accent, #ff8c77)",
    boxShadow: "0 2px 12px rgba(255, 140, 119, 0.2)",
  },
  routeCardButton: {
    display: "block",
    width: "100%",
    textAlign: "left",
    padding: "1rem 1.25rem",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    font: "inherit",
    color: "inherit",
  },
  routeCardHeader: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: "0.5rem",
    alignItems: "flex-start",
  },
  routeTitle: {
    margin: 0,
    fontSize: "1rem",
    fontWeight: 600,
    flex: "1 1 12rem",
  },
  routeDuration: {
    fontSize: "0.75rem",
    color: "var(--clr-text-muted, rgb(114 114 114))",
    whiteSpace: "nowrap",
  },
  routeSummary: {
    margin: "0.75rem 0 0",
    fontSize: "0.875rem",
    lineHeight: 1.65,
    color: "var(--clr-text-muted, rgb(114 114 114))",
  },
  stopsList: {
    margin: 0,
    padding: "0 1.25rem 1rem",
    listStyle: "none",
    borderTop: "1px solid var(--border, #e5e7eb)",
  },
  stopItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.35rem 0",
    fontSize: "0.875rem",
  },
  stopNum: {
    flexShrink: 0,
    width: "1.5rem",
    height: "1.5rem",
    borderRadius: 4,
    background: "var(--clr-surface, #f9fbff)",
    border: "1px solid var(--border, #e5e7eb)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.75rem",
    fontWeight: 600,
  },
  stopLink: {
    color: "var(--clr-link, #065fd4)",
    textDecoration: "none",
  },
  stopName: {
    color: "var(--clr-text, rgb(20 20 20))",
  },
  mapLoading: {
    height: "100%",
    minHeight: 400,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--clr-surface, #f9fbff)",
    color: "var(--clr-text-muted, rgb(114 114 114))",
    fontSize: "0.875rem",
  },
};

export default RakuchuSightseeingMapSection;