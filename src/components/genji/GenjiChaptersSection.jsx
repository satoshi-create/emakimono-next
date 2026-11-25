import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import Title from "@/components/ui/Title";
import styles from "@/styles/GenjiHub.module.css";
import { pureImageUrl } from "@/utils/buildGenjiHubData";

const filterBtnBase = {
  fontFamily: "var(--font-ui)",
  fontSize: "0.875rem",
  padding: "0.5rem 0.875rem",
  borderRadius: "4px",
  border: "1px solid rgb(211 211 211 / 0.8)",
  cursor: "pointer",
  background: "var(--clr-bg)",
  color: "var(--clr-text)",
};

export default function GenjiChaptersSection({ chapters = [] }) {
  const { t } = useTranslation("common");
  const { locale } = useRouter();
  const isJa = locale === "ja";
  const [onlyWithScroll, setOnlyWithScroll] = useState(true);
  const scrollChaptersCount = chapters.filter((c) => c.hasScroll).length;
  const visibleChapters = onlyWithScroll
    ? chapters.filter((c) => c.hasScroll)
    : chapters;

  return (
    <section className={`section-grid section-padding ${styles.chapterSection}`}>
      <Title
        sectiontitle={
          !isJa
            ? t("genjiHub.chapterSectionTitleEn", {
                defaultValue: "The Tale of Genji: 54 Chapters",
              })
            : t("genjiHub.chapterSectionTitle", {
                defaultValue: "源氏物語 五十四帖",
              })
        }
      />
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem",
          marginBottom: "1.25rem",
        }}
      >
        <button
          type="button"
          aria-pressed={onlyWithScroll}
          onClick={() => setOnlyWithScroll(true)}
          style={{
            ...filterBtnBase,
            ...(onlyWithScroll
              ? {
                  borderColor: "var(--clr-accent-green)",
                  background: "rgb(84 137 106 / 0.12)",
                  fontWeight: 600,
                }
              : {}),
          }}
        >
          {t("genjiHub.filterChaptersWithScroll", {
            count: scrollChaptersCount,
            defaultValue: !isJa
              ? `Chapters with scrolls (${scrollChaptersCount})`
              : `絵巻のある帖のみ（${scrollChaptersCount}）`,
          })}
        </button>
        <button
          type="button"
          aria-pressed={!onlyWithScroll}
          onClick={() => setOnlyWithScroll(false)}
          style={{
            ...filterBtnBase,
            ...(!onlyWithScroll
              ? {
                  borderColor: "var(--clr-accent-green)",
                  background: "rgb(84 137 106 / 0.12)",
                  fontWeight: 600,
                }
              : {}),
          }}
        >
          {t("genjiHub.filterChaptersAll", {
            count: chapters.length,
            defaultValue: !isJa
              ? `All chapters (${chapters.length})`
              : `すべて（${chapters.length}帖）`,
          })}
        </button>
      </div>
      {visibleChapters.length === 0 ? (
        <p className={styles.chapterEmpty}>
          {t("genjiHub.noResult", {
            defaultValue: !isJa
              ? "No chapters match your search."
              : "該当する帖がありません。",
          })}
        </p>
      ) : (
        <ul className={styles.chapterGrid}>
          {visibleChapters.map((chapter) => {
            const thumbSrc =
              pureImageUrl(chapter.thumbnailUrl) || pureImageUrl(chapter.thumb);
            return (
              <li key={chapter.slug}>
                <Link href={`/genji/${chapter.slug}`}>
                  <a className={styles.chapterCard}>
                    {thumbSrc && (
                      <span className={styles.chapterThumbWrap}>
                        <Image
                          className={styles.chapterThumb}
                          src={thumbSrc}
                          alt={!isJa ? chapter.titleen : chapter.title}
                          layout="fill"
                          sizes="(max-width: 768px) 100vw, 25vw"
                        />
                      </span>
                    )}
                    <span className={styles.chapterCardBody}>
                      <span
                        className={`${styles.chapterNumberBadge} ${
                          !isJa ? styles.chapterNumberBadgeEn : ""
                        }`}
                      >
                        {!isJa
                          ? `Chapter ${chapter.chapter_en}`
                          : `第${chapter.chapter_ch}帖`}
                      </span>
                      <h2 className={styles.chapterTitle}>
                        {!isJa ? chapter.titleen : chapter.title}
                      </h2>
                      <span className={styles.chapterRuby}>{chapter.ruby}</span>
                      <span className={styles.chapterDesc}>
                        {(!isJa ? chapter.descen : chapter.summary) ?? ""}
                      </span>
                      <span
                        className={
                          chapter.hasScroll
                            ? styles.chapterMeta
                            : styles.chapterMetaEmpty
                        }
                      >
                        {chapter.hasScroll
                          ? t("genjiHub.scrollAvailable", {
                              defaultValue: !isJa
                                ? `${chapter.scrollTitleens.length} scroll(s)`
                                : `絵巻 ${chapter.scrollTitleens.length} 件`,
                            })
                          : t("genjiHub.scrollNone", {
                              defaultValue: !isJa ? "No scroll" : "絵巻なし",
                            })}
                      </span>
                    </span>
                  </a>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}