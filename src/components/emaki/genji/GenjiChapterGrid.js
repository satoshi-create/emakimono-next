import Title from "@/components/ui/Title";
import styles from "@/styles/GenjiHub.module.css";
import Link from "next/link";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";

const GenjiChapterGrid = ({ chapters }) => {
  const { t } = useTranslation("common");
  const { locale } = useRouter();
  const isEn = locale === "en";

  return (
    <section className={`section-grid section-padding ${styles.chapterSection}`}>
      <Title sectiontitle={t("genjiHub.chapterSectionTitle")} />
      <ul className={styles.chapterGrid}>
        {chapters.map((chapter) => {
          const count = chapter.scrollTitleens.length;
          const summary = chapter.summary;

          return (
            <li key={chapter.path}>
              <Link href={`/genji/${chapter.path}`}>
                <a className={styles.chapterCard}>
                  <span className={styles.chapterLabel}>
                    {t("genjiHub.chapterNumber", {
                      num: isEn ? chapter.chapter_en : chapter.chapter_ch,
                    })}
                  </span>
                  <h3 className={styles.chapterTitle}>
                    {!isEn ? (
                      <ruby>
                        {chapter.title} <rp>(</rp>
                        <rt>{chapter.ruby}</rt>
                        <rp>)</rp>
                      </ruby>
                    ) : (
                      chapter.titleen
                    )}
                  </h3>
                  {summary && (
                    <p className={styles.chapterSummary}>{summary}</p>
                  )}
                  <span
                    className={
                      count > 0 ? styles.chapterMeta : styles.chapterMetaEmpty
                    }
                  >
                    {count > 0
                      ? t("genjiHub.chapterScrollCount", { count })
                      : t("genjiHub.chapterNoScrolls")}
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

export default GenjiChapterGrid;
