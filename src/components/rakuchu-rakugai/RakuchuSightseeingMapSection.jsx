import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { HUB_EMAKIS, REGIONS, ROUTES, THEMES } from "@/data/hub/hubData";

const DynamicEmakiHubMap = dynamic(
  () => import("@/components/emaki/hub/EmakiHubMap"),
  { ssr: false, loading: () => <div style={styles.mapLoading}>Loading map…</div> }
);

const kyotoRoutes = ROUTES.filter((r) => r.region === "kyoto");

const hubByTitleen = Object.fromEntries(HUB_EMAKIS.map((e) => [e.titleen, e]));

const l = (locale, ja, en) => (locale === "en" ? en : ja);

const formatSpotId = (spotId) =>
  spotId
    ? spotId.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "";

const stopLabel = (stop, locale) => {
  const ja = stop.name?.ja || stop.spot?.nameJa;
  const en = stop.name?.en || stop.spot?.nameEn;
  if (ja || en) return l(locale, ja, en);
  const hub = hubByTitleen[stop.titleen];
  if (hub?.spot && stop.spotId && hub.spot.nameJa) {
    return l(locale, hub.spot.nameJa, hub.spot.nameEn);
  }
  return formatSpotId(stop.spotId);
};

/**
 * 洛中洛外 chapters 用：テーマフィルタ＋地図＋おすすめルート一覧。
 * @param {{ locale: "ja" | "en"; t?: (key: string) => string }} props
 */
export function RakuchuSightseeingMapSection({ locale, t = (k) => k }) {
  const [activeTheme, setActiveTheme] = useState("all");
  const [activeRoute, setActiveRoute] = useState(null);
  const [wideLayout, setWideLayout] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setWideLayout(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

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

  return (
    <section style={styles.section} aria-labelledby="rakuchu-sightseeing-map-heading">
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

      <div
        style={{
          ...styles.columns,
          flexDirection: wideLayout ? "row" : "column",
          alignItems: wideLayout ? "stretch" : "stretch",
        }}
      >
        <div
          style={{
            ...styles.mapCol,
            width: wideLayout ? "65%" : "100%",
            flexShrink: wideLayout ? 0 : undefined,
          }}
        >
          <DynamicEmakiHubMap
            region={REGIONS.kyoto}
            regionConfig={REGIONS.kyoto}
            items={[]}
            activeTheme={activeTheme}
            activeRoute={activeRoute}
            onSelectRoute={setActiveRoute}
            locale={locale}
            t={t}
          />
        </div>

        <aside
          style={{
            ...styles.routesCol,
            width: wideLayout ? "35%" : "100%",
            flex: wideLayout ? "1 1 35%" : undefined,
          }}
        >
          <h2 id="rakuchu-sightseeing-map-heading" style={styles.routesHeading}>
            {sectionTitle}
          </h2>
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
      </div>
    </section>
  );
}

const styles = {
  section: {
    fontFamily: "var(--font-ui, 'Noto Sans JP', sans-serif)",
    color: "var(--clr-text, rgb(20 20 20))",
    maxWidth: 1200,
    margin: "0 auto",
    width: "100%",
  },
  themeBar: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.5rem",
    marginBottom: "1.25rem",
  },
  themePill: {
    padding: "0.4rem 0.85rem",
    borderRadius: 6,
    border: "1px solid var(--clr-text-muted, rgb(114 114 114))",
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
  columns: {
    display: "flex",
    gap: "1.5rem",
  },
  mapCol: {
    height: 520,
    minHeight: 520,
    borderRadius: 12,
    overflow: "hidden",
    border: "1px solid var(--border, #e5e7eb)",
    position: "relative",
  },
  routesCol: {},
  routesHeading: {
    fontSize: "1.125rem",
    fontWeight: 700,
    margin: "0 0 0.5rem",
    fontFamily: "var(--font-story, 'Zen Maru Gothic', sans-serif)",
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
    minHeight: 520,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--clr-surface, #f9fbff)",
    color: "var(--clr-text-muted, rgb(114 114 114))",
    fontSize: "0.875rem",
  },
};

export default RakuchuSightseeingMapSection;