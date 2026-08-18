import Image from "next/image";
import Title from "@/components/ui/Title";
import styles from "@/styles/KusouzuHub.module.css";
import { cloudinaryThumbLoader } from "@/utils/cloudinaryUrl";
import Link from "next/link";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";

const IMG_PROPS = { width: 533, height: 300, loading: "lazy" };
const IMG_SIZES = "(max-width: 768px) 100vw, 280px";

const StageThumb = ({ stage }) => {
  const alt = stage.title;

  if (stage.thumbCloudinary) {
    return (
      <Image
        loader={cloudinaryThumbLoader}
        src={stage.thumbCloudinary}
        alt={alt}
        {...IMG_PROPS}
        sizes={IMG_SIZES}
        className={styles.stageThumb}
      />
    );
  }

  if (stage.thumb) {
    return (
      <Image
        src={stage.thumb}
        alt={alt}
        {...IMG_PROPS}
        sizes={IMG_SIZES}
        className={styles.stageThumb}
      />
    );
  }

  return null;
};

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
          const hasImage = stage.thumbCloudinary || stage.thumb;

          return (
            <li key={stage.slug}>
              <Link href={`/kusouzu/${stage.slug}`}>
                <a className={styles.stageCard}>
                  {hasImage && (
                    <div className={styles.stageThumbWrap}>
                      <StageThumb stage={stage} />
                    </div>
                  )}
                  <div className={styles.stageCardBody}>
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
                    <span
                      className={
                        count > 0
                          ? styles.stageMeta
                          : styles.stageMetaEmpty
                      }
                    >
                      {count > 0
                        ? t("kusouzuHub.stageScrollCount", { count })
                        : t("kusouzuHub.stageNoScrolls")}
                    </span>
                  </div>
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
