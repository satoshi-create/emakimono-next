import RegionSwitcher from "@/components/emaki/hub/RegionSwitcher";
import EmakiHubMap from "@/components/emaki/hub/EmakiHubMap";
import EmakiHubRouteCard from "@/components/emaki/hub/EmakiHubRouteCard";
// 関連メディアセクションは非表示のため一時コメントアウト（あとで再利用）
// import EmakiRelatedMediaCard from "@/components/emaki/hub/EmakiRelatedMediaCard";
import useEmakiHubController from "@/hooks/emaki/useEmakiHubController";
import styles from "@/styles/EmakiHub.module.css";
import {
  faCompress,
  faExpand,
  faRoute,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import dynamic from "next/dynamic";

// Leaflet は SSR で動かないため、クライアントのみで読み込む
const DynamicEmakiHubMap = dynamic(
  () => import("@/components/emaki/hub/EmakiHubMap"),
  { ssr: false, loading: () => <div className={styles.mapLoading}>Loading map…</div> }
);

/**
 * 京都編 / 鎌倉編ハブページ本体。
 * props: hubData = { regions, emakis, routes, media }（scroll-metadata.json と JOIN 済み）、 t = useTranslation("common")
 * カテゴリーフィルタとおすすめルートは地図内オーバーレイとして配置する。
 */
const EmakiHubPage = ({ hubData, t }) => {
  // 1. コントローラーフック接続
  const {
    locale,
    l,
    themes,
    region,
    theme,
    activeScroll,
    activeRoute,
    routePanelOpen,
    setRoutePanelOpen,
    mapFullscreen,
    currentRegion,
    filteredItems,
    regionRoutes,
    handleRegionChange,
    handleThemeChange,
    handleRouteSelect,
    handleRouteToggle,
    toggleMapFullscreen,
  } = useEmakiHubController({
    regions: hubData.regions,
    emakis: hubData.emakis,
    routes: hubData.routes,
  });

  // 2. ハブレイアウト描画
  return (
    <>
      {/* Hero（和モダン・ダークグラデ帯） */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <h1 className={styles.heroTitle}>
            {locale === "en"
              ? "Explore the historic cityscape depicted in handscrolls and screens."
              : "絵巻と屏風に描かれた都の風景を、京都で辿る。"}
          </h1>
          <p className={styles.heroLead}>
            {locale === "en"
              ? "Compare temples, rivers, and streetscapes from the Rakuchu Rakugai screens with present-day Kyoto on the map."
              : "洛中洛外図屏風に描かれた寺社・河川・町並みを、実際の京都の地図と照らし合わせて味わう。"}
          </p>
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
        <p className={styles.sectionDesc}>
          {locale === "en"
            ? "Explore famous places, rivers, and streets depicted in the Rakuchu Rakugai screens via the map and suggested routes."
            : "洛中洛外図に描かれた名所・河川・通りを、地図やおすすめルートから巡れます。"}
        </p>

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
            activeTheme={theme}
            isFullscreen={mapFullscreen}
          />

          {/* 全画面表示トグル（地図右上） */}
          <button
            type="button"
            className={styles.mapFullscreenBtn}
            onClick={toggleMapFullscreen}
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
            {themes.map((th) => (
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

      {/* 関連メディア（現在は非表示。再利用時にコメント解除） */}
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