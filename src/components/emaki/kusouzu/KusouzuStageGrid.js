import Title from "@/components/ui/Title";
import styles from "@/styles/KusouzuHub.module.css";
import Link from "next/link";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";

const KusouzuStageGrid = ({ stages }) => {
  const { t } = useTranslation("common");
  const { locale } = useRouter();

  return (
    <section className={`section-grid section-padding ${styles.stageSection}`}>
      <Title sectiontitle={t("kusouzuHub.stageSectionTitle")} />
      <ul className={styles.stageGrid}>
        {stages.map((stage) => {
          const isEn = locale === "en";
          const displayTitle = isEn ? stage.titleen : stage.title;
          const displayDesc = isEn ? stage.descen : stage.desc;
          const count = stage.scrollTitleens.length;

          return (
            <li key={stage.slug}>
              <Link href={`/kusouzu/${stage.slug}`}>
                <a className={styles.stageCard}>
                  <span className={styles.stageLabel}>
                    {t("kusouzuHub.stageNumber", { stage: stage.stage_ch })}
                  </span>
                  <h3 className={styles.stageTitle}>
                    {!isEn ? (
                      <ruby>
                        {stage.title} <rp>(</rp>
                        <rt>{stage.ruby}</rt>
                        <rp>)</rp>
                      </ruby>
                    ) : (
                      displayTitle
                    )}
                  </h3>
                  {displayDesc && (
                    <p className={styles.stageDesc}>{displayDesc}</p>
                  )}
                  <span className={styles.stageMeta}>
                    {count > 0
                      ? t("kusouzuHub.stageScrollCount", { count })
                      : t("kusouzuHub.stageNoScrolls")}
                  </span>
                </a>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default KusouzuStageGrid;
