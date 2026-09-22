import Image from "next/image";
import Title from "@/components/ui/Title";
import styles from "@/styles/KusouzuHub.module.css";
import { cloudinaryThumbLoader } from "@/utils/cloudinaryUrl";
import Link from "next/link";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";

const IMG_PROPS = { width: 533, height: 300, loading: "lazy" };
const IMG_SIZES = "(max-width: 768px) 100vw, 280px";

const SHORT_LABELS = {
  kusouzumaki: { ja: "鎌倉・九相図巻", en: "Kamakura" },
  kusouzu_kobayasieieitaku: { ja: "明治・小林永濯", en: "Meiji · Eitaku" },
  "nine-stages-of-decay-empress-danrin": {
    ja: "江戸・檀林皇后",
    en: "Edo · Danrin",
  },
};

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

const editionLabel = (edition, isEn) => {
  const short = SHORT_LABELS[edition.titleen];
  if (short) return isEn ? short.en : short.ja;
  return isEn ? edition.titleen : edition.title;
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
          const editions = stage.editions ?? [];
          const hasImage = stage.thumbCloudinary || stage.thumb;

          return (
            <li key={stage.slug}>
              <article className={styles.stageCard}>
                <Link href={`/kusouzu/${stage.slug}`}>
                  <a className={styles.stageCardMain}>
                    {hasImage && (
                      <div className={styles.stageThumbWrap}>
                        <StageThumb stage={stage} />
                      </div>
                    )}
                    <div className={styles.stageCardBody}>
                      <span className={styles.stageLabel}>
                        {t("kusouzuHub.stageNumber", {
                          stage: stage.stage_ch,
                        })}
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
                    </div>
                  </a>
                </Link>
                <div className={styles.stageCtaRow}>
                  {editions.length > 0 ? (
                    editions.map((edition) => (
                      <Link key={edition.titleen} href={edition.href}>
                        <a className={styles.stageCta}>
                          {t("kusouzuHub.stageViewIn", {
                            scroll: editionLabel(edition, isEn),
                          })}
                        </a>
                      </Link>
                    ))
                  ) : (
                    <span className={styles.stageMetaEmpty}>
                      {t("kusouzuHub.stageNoScrolls")}
                    </span>
                  )}
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default KusouzuStageGrid;
