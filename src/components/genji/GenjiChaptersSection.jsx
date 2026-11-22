import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import styles from "@/styles/GenjiHub.module.css";
import { pureImageUrl } from "@/utils/buildGenjiHubData";

export default function GenjiChaptersSection({ chapters = [] }) {
  const { t } = useTranslation("common");
  const { locale } = useRouter();
  const isEn = locale === "en";

  return (
    <section className={styles.chapterSection}>
      {chapters.length === 0 ? (
        <p className={styles.chapterEmpty}>
          {t("genjiHub.noResult", {
            defaultValue: isEn
              ? "No chapters match your search."
              : "該当する帖がありません。",
          })}
        </p>
      ) : (
        <ul className={styles.chapterGrid}>
          {chapters.map((chapter) => {
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
                          alt={isEn ? chapter.titleen : chapter.title}
                          layout="fill"
                          sizes="(max-width: 768px) 100vw, 25vw"
                        />
                      </span>
                    )}
                    <span className={styles.chapterCardBody}>
                      <span
                        className={`${styles.chapterNumberBadge} ${
                          isEn ? styles.chapterNumberBadgeEn : ""
                        }`}
                      >
                        {isEn
                          ? `Chapter ${chapter.chapter_en}`
                          : `第${chapter.chapter_ch}帖`}
                      </span>
                      <h2 className={styles.chapterTitle}>
                        {isEn ? chapter.titleen : chapter.title}
                      </h2>
                      <span className={styles.chapterRuby}>{chapter.ruby}</span>
                      <span className={styles.chapterDesc}>
                        {(isEn ? chapter.descen : chapter.summary) ?? ""}
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
                              defaultValue: isEn
                                ? `${chapter.scrollTitleens.length} scroll(s)`
                                : `絵巻 ${chapter.scrollTitleens.length} 件`,
                            })
                          : t("genjiHub.scrollNone", {
                              defaultValue: isEn ? "No scroll" : "絵巻なし",
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