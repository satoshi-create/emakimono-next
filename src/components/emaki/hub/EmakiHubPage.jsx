import RegionSwitcher from "@/components/emaki/hub/RegionSwitcher";
import EmakiHubCard from "@/components/emaki/hub/EmakiHubCard";
import EmakiHubMap from "@/components/emaki/hub/EmakiHubMap";
import { THEMES } from "@/data/emakiHubData";
import styles from "@/styles/EmakiHub.module.css";
import { faMapMarkedAlt, faTh } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";

// Leaflet は SSR で動かないため、クライアントのみで読み込む
const DynamicEmakiHubMap = dynamic(
  () => import("@/components/emaki/hub/EmakiHubMap"),
  { ssr: false, loading: () => <div className={styles.mapLoading}>Loading map…</div> }
);

/**
 * 京都編 / 鎌倉編ハブページ本体。
 * props: hubData = { regions, emakis }（image-metadata-cache.json と JOIN 済み）、 t = useTranslation("common")
 */
const EmakiHubPage = ({ hubData, t }) => {
  const { locale } = useRouter();
  const router = useRouter();

  const initialRegion = ["kyoto", "kamakura"].includes(router.query.region)
    ? router.query.region
    : "kyoto";
  const initialScroll =
    typeof router.query.scroll === "string" ? router.query.scroll : null;
  const [region, setRegion] = useState(initialRegion);
  const [activeScroll, setActiveScroll] = useState(initialScroll);
  const [theme, setTheme] = useState("all");
  const [view, setView] = useState("map");

  const currentRegion = hubData.regions.find((r) => r.id === region);

  // URL クエリの変更（ブラウザバック・直接アクセス）を state へ同期
  useEffect(() => {
    if (["kyoto", "kamakura"].includes(router.query.region)) {
      setRegion(router.query.region);
      setTheme("all");
    }
    setActiveScroll(
      typeof router.query.scroll === "string" ? router.query.scroll : null
    );
  }, [router.query.region, router.query.scroll]);

  const handleRegionChange = (next) => {
    setRegion(next);
    setTheme("all");
    // URL クエリで状態を保持（シェア・GA 計測向き）。履歴を汚さない shallow replace
    router.replace(`/emaki-hub?region=${next}`, undefined, { shallow: true });
  };

  const filteredItems = useMemo(() => {
    return hubData.emakis.filter(
      (item) =>
        item.region === region && (theme === "all" || item.theme === theme)
    );
  }, [hubData.emakis, region, theme]);

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

      {/* フィルター・表示切替 */}
      <section className="section-grid section-padding">
        <h2 className={styles.sectionTitle}>{t("emakiHub.sectionTitle")}</h2>
        <p className={styles.sectionDesc}>{t("emakiHub.sectionDesc")}</p>

        <div className={styles.toolbar}>
          <div className={styles.themeFilter}>
            {THEMES.map((th) => (
              <button
                key={th.id}
                type="button"
                className={`${styles.themeTab} ${
                  theme === th.id ? styles.themeTabActive : ""
                }`}
                onClick={() => setTheme(th.id)}
              >
                {locale === "en" ? th.labelEn : th.labelJa}
              </button>
            ))}
          </div>
          <div className={styles.viewToggle}>
            <button
              type="button"
              className={`${styles.viewBtn} ${
                view === "map" ? styles.viewBtnActive : ""
              }`}
              onClick={() => setView("map")}
            >
              <FontAwesomeIcon icon={faMapMarkedAlt} /> {t("emakiHub.map")}
            </button>
            <button
              type="button"
              className={`${styles.viewBtn} ${
                view === "grid" ? styles.viewBtnActive : ""
              }`}
              onClick={() => setView("grid")}
            >
              <FontAwesomeIcon icon={faTh} /> {t("emakiHub.grid")}
            </button>
          </div>
        </div>

        {view === "grid" ? (
          <div className={styles.cardGrid}>
            {filteredItems.map((item) => (
              <EmakiHubCard key={item.titleen || item.titleJa} item={item} t={t} />
            ))}
          </div>
        ) : (
          <DynamicEmakiHubMap
            region={currentRegion}
            items={filteredItems}
            locale={locale}
            t={t}
            activeScroll={activeScroll}
          />
        )}
      </section>
    </>
  );
};

export default EmakiHubPage;
