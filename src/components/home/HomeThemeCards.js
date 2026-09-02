import styles from "@/styles/HomeThemeCards.module.css";
import Link from "next/link";
import { useTranslation } from "next-i18next";

const THEME_ITEMS = [
  { key: "satire", href: "/chouju-giga/chapters", accent: "satire" },
  { key: "darkFantasy", href: "/emaki-hub?theme=dark-fantasy", accent: "dark" },
  { key: "kusouzu", href: "/kusouzu/chapters-kusouzu", accent: "kusouzu" },
  { key: "mangaRoots", href: "/manga-roots", accent: "manga" },
];

const HomeThemeCards = () => {
  const { t } = useTranslation("common");

  return (
    <section className={`section-grid section-padding ${styles.section}`}>
      <h2 className={styles.sectionTitle}>{t("home.themeSectionTitle")}</h2>
      <div className={styles.grid}>
        {THEME_ITEMS.map(({ key, href, accent }) => (
          <Link href={href} key={key}>
            <a className={`${styles.card} ${styles[accent]}`}>
              <h3 className={styles.cardTitle}>{t(`home.themes.${key}.title`)}</h3>
              <p className={styles.cardDesc}>{t(`home.themes.${key}.desc`)}</p>
              {key === "darkFantasy" && (
                <p className={styles.cardWarning}>
                  {t("home.themes.darkFantasy.warning")}
                </p>
              )}
              <span className={styles.cardCta}>
                {t(`home.themes.${key}.cta`)} →
              </span>
            </a>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default HomeThemeCards;
