import RegionSwitcher from "@/components/emaki/hub/RegionSwitcher";
import EmakiHubMap from "@/components/emaki/hub/EmakiHubMap";
import EmakiHubRouteCard from "@/components/emaki/hub/EmakiHubRouteCard";
// 漫画・アニメと絵巻セクションは非表示のため一時コメントアウト（あとで再利用）
// import EmakiRelatedMediaCard from "@/components/emaki/hub/EmakiRelatedMediaCard";
import { THEMES } from "@/data/emakiHubData";
import styles from "@/styles/EmakiHub.module.css";
import {
  faCompress,
  faExpand,
  faRoute,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";

// Leaflet は SSR で動かないため、クライアントのみで読み込む
const DynamicEmakiHubMap = dynamic(
  () => import("@/components/emaki/hub/EmakiHubMap"),
  { ssr: false, loading: () => <div className={styles.mapLoading}>Loading map…</div> }
);

const THEME_IDS = THEMES.map((th) => th.id);
const getThemeFromQuery = (q) =>
  typeof q === "string" && THEME_IDS.includes(q) ? q : "all";

/**
 * 京都編 / 鎌倉編ハブページ本体。
 * props: hubData = { regions, emakis, routes, media }（image-metadata-cache.json と JOIN 済み）、 t = useTranslation("common")
 * カテゴリーフィルタとおすすめルートは地図内オーバーレイとして配置する。
 */
const EmakiHubPage = ({ hubData, t }) => {
  const { locale } = useRouter();
  const router = useRouter();

  const initialRegion = ["kyoto", "kamakura"].includes(router.query.region)
    ? router.query.region
    : "kyoto";
  const initialScroll =
    typeof router.query.scroll === "string" ? router.query.scroll : null;
  const initialRoute =
    typeof router.query.route === "string" ? router.query.route : null;
  const [region, setRegion] = useState(initialRegion);
  const [activeScroll, setActiveScroll] = useState(initialScroll);
  const [activeRouteId, setActiveRouteId] = useState(initialRoute);
  const [theme, setTheme] = useState(() => getThemeFromQuery(router.query.theme));
  const [routePanelOpen, setRoutePanelOpen] = useState(false);
  const [mapFullscreen, setMapFullscreen] = useState(false);

  const currentRegion = hubData.regions.find((r) => r.id === region);

  // URL クエリの変更（ブラウザバック・直接アクセス）を state へ同期
  useEffect(() => {
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
    router.query.region,
    router.query.scroll,
    router.query.route,
    router.query.theme,
  ]);

  // 全画面表示中はページスクロールを止める
  useEffect(() => {
    if (!mapFullscreen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mapFullscreen]);

  // Esc で全画面を閉じる
  useEffect(() => {
    if (!mapFullscreen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setMapFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mapFullscreen]);

  const handleRegionChange = (next) => {
    setRegion(next);
    setTheme("all");
    setActiveRouteId(null);
    setRoutePanelOpen(false);
    router.replace(`/emaki-hub?region=${next}`, undefined, { shallow: true });
  };

  const replaceUrlQuery = (query) => {
    const basePath = router.asPath.split("?")[0];
    window.history.replaceState(null, "", `${basePath}${query}`);
  };

  const handleThemeChange = (nextTheme) => {
    setTheme(nextTheme);
    const params = new URLSearchParams();
    if (region !== "kyoto") params.set("region", region);
    if (nextTheme !== "all") params.set("theme", nextTheme);
    const query = params.toString();
    replaceUrlQuery(query ? `?${query}` : "");
  };

  // ルート選択：地図でルートをハイライトし、パネルを閉じて地図を見せる
  const handleRouteSelect = (route) => {
    setTheme("all");
    setActiveRouteId(route.id);
    setRoutePanelOpen(false);
    replaceUrlQuery(`?region=${route.region}&route=${route.id}`);
  };

  // ルートトグル：未選択ならパネル（プルダウン）を開き、選択中ならルートを解除する
  const handleRouteToggle = () => {
    if (activeRouteId) {
      setActiveRouteId(null);
      setRoutePanelOpen(false);
      replaceUrlQuery(`?region=${region}`);
    } else {
      setRoutePanelOpen((v) => !v);
    }
  };

  const activeRoute = useMemo(
    () =>
      hubData.routes.find(
        (r) => r.id === activeRouteId && r.region === region
      ) || null,
    [hubData.routes, activeRouteId, region]
  );

  const filteredItems = useMemo(() => {
    return hubData.emakis.filter(
      (item) =>
        item.region === region && (theme === "all" || item.theme === theme)
    );
  }, [hubData.emakis, region, theme]);

  const regionRoutes = useMemo(
    () => hubData.routes.filter((r) => r.region === region),
    [hubData.routes, region]
  );

  const l = (obj) => (locale === "en" ? obj.en : obj.ja);

  return (
    <>
      {/* Hero（和モダン・ダークグラデ帯） */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <h1 className={styles.heroTitle}>{l(currentRegion.copy)}</h1>
          <p className={styles.heroLead}>{l(currentRegion.lead)}</p>
          <RegionSwitcher
            regions={hubData.regions}
            currentRegion={region}
            onChange={handleRegionChange}
            t={t}
          />
        </div>
      </section>

      {/* セクションナビ */}
      <nav className={styles.sectionNav}>
        <a href="#browse">{t("emakiHub.sectionTitle")}</a>
      </nav>

      {/* 作品を巡る（フィルタ・ルートは地図内オーバーレイ） */}
      <section
        id="browse"
        className={`section-grid-wide section-padding ${styles.sectionAnchor}`}
      >
        <h2 className={styles.sectionTitle}>{t("emakiHub.sectionTitle")}</h2>
        <p className={styles.sectionDesc}>{t("emakiHub.sectionDesc")}</p>

        <div
          className={`${styles.mapWrap} ${
            mapFullscreen ? styles.mapWrapFullscreen : ""
          }`}
        >
          <DynamicEmakiHubMap
            region={currentRegion}
            items={filteredItems}
            locale={locale}
            t={t}
            activeScroll={activeScroll}
            activeRoute={activeRoute}
            isFullscreen={mapFullscreen}
          />

          {/* 全画面表示トグル（地図右上） */}
          <button
            type="button"
            className={styles.mapFullscreenBtn}
            onClick={() => setMapFullscreen((v) => !v)}
            aria-label={
              mapFullscreen
                ? t("emakiHub.mapFullscreenClose")
                : t("emakiHub.mapFullscreenOpen")
            }
            aria-expanded={mapFullscreen}
          >
            <FontAwesomeIcon icon={mapFullscreen ? faCompress : faExpand} />
          </button>

          {/* カテゴリーフィルタ（地図左上） */}
          <div
            className={styles.mapFilter}
            role="group"
            aria-label={t("emakiHub.themeFilter")}
          >
            {THEMES.map((th) => (
              <button
                key={th.id}
                type="button"
                className={`${styles.themeTab} ${
                  theme === th.id ? styles.themeTabActive : ""
                }`}
                onClick={() => handleThemeChange(th.id)}
              >
                {locale === "en" ? th.labelEn : th.labelJa}
              </button>
            ))}
          </div>

          {/* アクティブルート表示（地図左下） */}
          {/* チップは廃止。「おすすめの観光ルート」ボタンで解除できる */}

          {/* おすすめルート（地図右側・折りたたみ式） */}
          {routePanelOpen && !activeRoute ? (
            <aside className={styles.routePanel}>
              <div className={styles.routePanelHeader}>
                <h3 className={styles.routePanelTitle}>
                  {t("emakiHub.routesTitle")}
                </h3>
                <button
                  type="button"
                  className={styles.routePanelClose}
                  onClick={() => setRoutePanelOpen(false)}
                  aria-label={t("emakiHub.routesClose")}
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
              <p className={styles.routePanelDesc}>{t("emakiHub.routesDesc")}</p>
              <div className={styles.routePanelList}>
                {regionRoutes.map((route) => (
                  <EmakiHubRouteCard
                    key={route.id}
                    route={route}
                    t={t}
                    locale={locale}
                    onViewOnMap={handleRouteSelect}
                  />
                ))}
              </div>
            </aside>
          ) : (
            <button
              type="button"
              className={`${styles.routePanelToggle} ${
                activeRoute ? styles.routePanelToggleActive : ""
              }`}
              onClick={handleRouteToggle}
            >
              <FontAwesomeIcon icon={activeRoute ? faTimes : faRoute} />
              <span>
                {activeRoute
                  ? `${t("emakiHub.routesTitle")}: ${
                      locale === "en" ? activeRoute.titleEn : activeRoute.titleJa
                    }`
                  : t("emakiHub.routesTitle")}
              </span>
            </button>
          )}
        </div>
      </section>

      {/* 漫画・アニメと絵巻（現在は非表示。再利用時にコメント解除） */}
      {/* <section
        id="media"
        className={`section-grid-wide section-padding ${styles.sectionAnchor}`}
      >
        <h2 className={styles.sectionTitle}>{t("emakiHub.mediaTitle")}</h2>
        <p className={styles.sectionDesc}>{t("emakiHub.mediaDesc")}</p>
        <div className={styles.mediaGrid}>
          {hubData.media.map((media) => (
            <EmakiRelatedMediaCard
              key={media.id}
              media={media}
              t={t}
              locale={locale}
            />
          ))}
        </div>
      </section> */}
    </>
  );
};

export default EmakiHubPage;
