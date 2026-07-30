import KusouzuScrollCard from "@/components/emaki/kusouzu/KusouzuScrollCard";
import Title from "@/components/ui/Title";
import styles from "@/styles/KusouzuHub.module.css";
import { useTranslation } from "next-i18next";

const KusouzuScrollCatalog = ({ scrollEmakis }) => {
  const { t } = useTranslation("common");

  return (
    <section className={`section-grid section-padding ${styles.scrollSection}`}>
      <Title sectiontitle={t("kusouzuHub.scrollSectionTitle")} />
      <div className={styles.scrollGrid}>
        {scrollEmakis.map((emaki) => (
          <KusouzuScrollCard key={emaki.titleen} emaki={emaki} />
        ))}
      </div>
    </section>
  );
};

export default KusouzuScrollCatalog;
