import CardA from "@/components/ui/CardA";
import { AppContext } from "@/context/AppContext";
import styles from "@/styles/HomeSectionLink.module.css";
import sectionStyles from "@/styles/TopRanking.module.css";
import Link from "next/link";
import { useContext } from "react";
import { useTranslation } from "next-i18next";

const TopRanking = () => {
  const { t } = useTranslation("common");
  const { rankingData, loading } = useContext(AppContext);

  const top4 = rankingData.slice(0, 4);

  if (loading || top4.length === 0) return null;

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
