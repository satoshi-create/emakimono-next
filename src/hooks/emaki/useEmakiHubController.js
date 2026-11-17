import { THEMES } from "@/data/hub/hubData";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";

const THEME_IDS = THEMES.map((th) => th.id);
const getThemeFromQuery = (q) =>
  typeof q === "string" && THEME_IDS.includes(q) ? q : "all";

/**
 * ハブページ／作品ページ埋め込み向け：地域・テーマ・ルート・地図全画面の状態と URL 同期。
 */
export function useEmakiHubController({
  regions,
  emakis,
  routes,
  initialRegion = "kyoto",
  initialScroll = null,
  initialRouteId = null,
  syncUrl = true,
}) {
  const router = useRouter();
  const { locale } = router;

  const regionFromRouter =
    syncUrl && ["kyoto", "kamakura"].includes(router.query.region)
      ? router.query.region
      : null;
  const scrollFromRouter =
    syncUrl && typeof router.query.scroll === "string"
      ? router.query.scroll
      : null;
  const routeFromRouter =
    syncUrl && typeof router.query.route === "string"
      ? router.query.route
      : null;

  // 1. 状態管理（State）
  const [region, setRegion] = useState(
    () => regionFromRouter ?? initialRegion
  );
  const [activeScroll, setActiveScroll] = useState(
    () => scrollFromRouter ?? initialScroll
  );
  const [activeRouteId, setActiveRouteId] = useState(
    () => routeFromRouter ?? initialRouteId
  );
  const [theme, setTheme] = useState(() =>
    syncUrl ? getThemeFromQuery(router.query.theme) : "all"
  );
  const [routePanelOpen, setRoutePanelOpen] = useState(false);
  const [mapFullscreen, setMapFullscreen] = useState(false);

  // 2. URLクエリ同期（Effects）
  useEffect(() => {
    if (!syncUrl) return;
    if (["kyoto", "kamakura"].includes(router.query.region)) {
      setRegion(router.query.region);
    }
    setActiveScroll(
      typeof router.query.scroll === "string" ? router.query.scroll : null
    );
    setActiveRouteId(
      typeof router.query.route === "string" ? router.query.route : null
    );
    setTheme(getThemeFromQuery(router.query.theme));
  }, [
    syncUrl,
    router.query.region,
    router.query.scroll,
    router.query.route,
    router.query.theme,
  ]);

  useEffect(() => {
    if (!mapFullscreen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mapFullscreen]);

  useEffect(() => {
    if (!mapFullscreen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setMapFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mapFullscreen]);

  const replaceUrlQuery = (query) => {
    if (!syncUrl) return;
    const basePath = router.asPath.split("?")[0];
    window.history.replaceState(null, "", `${basePath}${query}`);
  };

  // 4. 操作ハンドラ
  const handleRegionChange = (next) => {
    setRegion(next);
    setTheme("all");
    setActiveRouteId(null);
    setRoutePanelOpen(false);
    if (syncUrl) {
      router.replace(`/emaki-hub?region=${next}`, undefined, { shallow: true });
    }
  };

  const handleThemeChange = (nextTheme) => {
    setTheme(nextTheme);
    if (!syncUrl) return;
    const params = new URLSearchParams();
    if (region !== "kyoto") params.set("region", region);
    if (nextTheme !== "all") params.set("theme", nextTheme);
    const query = params.toString();
    replaceUrlQuery(query ? `?${query}` : "");
  };

  const handleRouteSelect = (route) => {
    setTheme("all");
    setActiveRouteId(route.id);
    setRoutePanelOpen(false);
    if (syncUrl) {
      replaceUrlQuery(`?region=${route.region}&route=${route.id}`);
    }
  };

  const handleRouteToggle = () => {
    if (activeRouteId) {
      setActiveRouteId(null);
      setRoutePanelOpen(false);
      if (syncUrl) {
        replaceUrlQuery(`?region=${region}`);
      }
    } else {
      setRoutePanelOpen((v) => !v);
    }
  };

  const toggleMapFullscreen = () => setMapFullscreen((v) => !v);

  // 3. フィルタリング・ルート解決（Pure Logic / Memo）
  const currentRegionObj = useMemo(
    () => regions.find((r) => r.id === region) ?? null,
    [regions, region]
  );

  const activeRoute = useMemo(
    () =>
      routes.find((r) => r.id === activeRouteId && r.region === region) || null,
    [routes, activeRouteId, region]
  );

  const filteredEmakis = useMemo(() => {
    return emakis.filter(
      (item) =>
        item.region === region && (theme === "all" || item.theme === theme)
    );
  }, [emakis, region, theme]);

  const filteredRoutes = useMemo(
    () => routes.filter((r) => r.region === region),
    [routes, region]
  );

  const l = (obj) => (locale === "en" ? obj.en : obj.ja);

  return {
    locale,
    l,
    regions,
    emakis,
    routes,
    themes: THEMES,
    region,
    setRegion,
    theme,
    setTheme,
    activeScroll,
    setActiveScroll,
    activeRouteId,
    setActiveRouteId,
    routePanelOpen,
    setRoutePanelOpen,
    mapFullscreen,
    setMapFullscreen,
    currentRegionObj,
    currentRegion: currentRegionObj,
    filteredEmakis,
    filteredRoutes,
    regionRoutes: filteredRoutes,
    filteredItems: filteredEmakis,
    activeRoute,
    handleRegionChange,
    handleThemeChange,
    handleRouteSelect,
    handleRouteToggle,
    toggleMapFullscreen,
    replaceUrlQuery,
    syncUrl,
  };
}

export default useEmakiHubController;