import CardA from "@/components/ui/CardA";
import styles from "@/styles/HomeSectionLink.module.css";
import sectionStyles from "@/styles/TopRanking.module.css";
import Link from "next/link";
import { useTranslation } from "next-i18next";

/**
 * ホーム「いま人気の絵巻」。
 * emakis は index getStaticProps（ISR）から渡し、初回 HTML に載せて CLS を防ぐ。
 */
const TopRanking = ({ emakis = [] }) => {
  const { t } = useTranslation("common");
  const top4 = emakis.slice(0, 4);

  if (top4.length === 0) return null;

  return (
    <section className={sectionStyles.popularSection}>
      <CardA
        emakis={top4}
        columns="four"
        sectiontitle={t("home.popularSectionTitle")}
        sectiontitleen={t("home.popularSectionTitle")}
        bcg="var(--clr-surface)"
      />
      <div className={`section-grid ${styles.wrap} ${styles.wrapSurface}`}>
        <Link href="/ranking">
          <a>
            <button type="button" className={styles.btn}>
              {t("home.popularMoreLink")}
            </button>
          </a>
        </Link>
      </div>
    </section>
  );
};

export default TopRanking;
