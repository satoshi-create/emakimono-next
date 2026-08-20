import MangaRootsThemeCard from "@/components/manga-roots/MangaRootsThemeCard";
import { getMangaRootsEmakiId } from "@/data/mangaRoots";
import { getContactUrl } from "@/libs/constants/links";
import styles from "@/styles/MangaRoots.module.css";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/router";

const DynamicMangaRootsNetwork = dynamic(
  () => import("@/components/manga-roots/MangaRootsNetwork"),
  { ssr: false, loading: () => <div className={styles.networkLoading} /> }
);

const KYOTO_HUB_HREF = "/emaki-hub?region=kyoto";

export const MangaRootsHero = ({ t }) => (
  <section className={styles.hero}>
    <div className={styles.heroInner}>
      <h1 className={styles.heroTitle}>{t("mangaRoots.heroTitle")}</h1>
      <p className={styles.heroLead}>{t("mangaRoots.heroLead")}</p>
      <a className={styles.heroCta} href="#themes">
        {t("mangaRoots.ctaExplore")}
        <span className={styles.heroCtaSub}>{t("mangaRoots.ctaExploreSub")}</span>
      </a>
    </div>
  </section>
);

export const MangaRootsThemes = ({ themes, t }) => {
  const { locale } = useRouter();
  return (
    <div className={`section-grid section-padding ${styles.section}`}>
      <h2 className={styles.sectionTitle}>{t("mangaRoots.themesTitle")}</h2>
      <p className={styles.sectionDesc}>{t("mangaRoots.themesDesc")}</p>
      <p className={styles.warning}>{t("mangaRoots.warning")}</p>
      <div className={styles.cardList}>
        {themes.map((theme) => (
          <MangaRootsThemeCard
            key={theme.id}
            theme={theme}
            t={t}
            locale={locale}
          />
        ))}
      </div>
    </div>
  );
};

export const MangaRootsNetworkSection = ({ graph, t }) => {
  const { locale, query } = useRouter();
  const emakiParam = Array.isArray(query.emaki) ? query.emaki[0] : query.emaki;
  const focusEmakiId = getMangaRootsEmakiId(emakiParam);
  return (
    <div className={`section-grid section-padding ${styles.section}`}>
      <h1 className={styles.sectionTitle}>{t("mangaRoots.networkTitle")}</h1>
      <p className={styles.sectionDesc}>{t("mangaRoots.networkDesc")}</p>
      <DynamicMangaRootsNetwork
        graph={graph}
        t={t}
        locale={locale}
        focusEmakiId={focusEmakiId}
      />
    </div>
  );
};

export const MangaRootsMap = ({ spots, t }) => {
  const { locale } = useRouter();
  return (
    <div className={`section-grid section-padding ${styles.section}`}>
      <h2 className={styles.sectionTitle}>{t("mangaRoots.mapTitle")}</h2>
      <p className={styles.sectionDesc}>{t("mangaRoots.mapDesc")}</p>
      <ul className={styles.spotList}>
        {spots.map((spot) => (
          <li key={spot.nameEn} className={styles.spotItem}>
            <span className={styles.spotName}>
              {locale === "en" ? spot.nameEn : spot.nameJa}
            </span>
            <span className={styles.spotAlt}>
              {locale === "en" ? spot.nameJa : spot.nameEn}
            </span>
          </li>
        ))}
      </ul>
      <Link href={KYOTO_HUB_HREF}>
        <a className={styles.mapBanner}>
          <span className={styles.mapBannerTitle}>{t("mangaRoots.mapCta")}</span>
          <span className={styles.mapBannerHint}>{t("mangaRoots.mapCtaHint")}</span>
        </a>
      </Link>
    </div>
  );
};

export const MangaRootsFeedback = ({ t }) => {
  const { locale } = useRouter();
  return (
    <div className={`section-grid section-padding ${styles.section}`}>
      <h2 className={styles.sectionTitle}>{t("mangaRoots.feedbackTitle")}</h2>
      <p className={styles.sectionDesc}>{t("mangaRoots.feedbackDesc")}</p>
      <a
        className={styles.feedbackCta}
        href={getContactUrl(locale)}
        target="_blank"
        rel="noopener noreferrer"
      >
        {t("mangaRoots.feedbackCta")}
      </a>
    </div>
  );
};
