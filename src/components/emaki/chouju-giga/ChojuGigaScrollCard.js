import styles from "@/styles/ChoujuGigaHub.module.css";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";

/** Map titleen suffix to Japanese/English scroll label. */
const SUFFIX_LABEL = {
  _first: { ja: "甲巻", en: " — Scroll I" },
  _second: { ja: "乙巻", en: " — Scroll II" },
  _third: { ja: "丙巻", en: " — Scroll III" },
  _fourth: { ja: "丁巻", en: " — Scroll IV" },
};

/**
 * Extract the first sentence from a description string.
 */
function firstSentence(text) {
  if (!text) return "";
  // Split by Japanese/English sentence terminators
  const match = text.match(/^.*?[。！？\n.!?]/);
  return match ? match[0].trim() : text.slice(0, 100).trim();
}

const ChojuGigaScrollCard = ({ scroll }) => {
  const { locale } = useRouter();
  const { titleen, title, thumb, era, eraen, author, authoren, desc, descen, chapters, suffix } = scroll;

  const scrollTitle =
    locale === "ja"
      ? suffix && SUFFIX_LABEL[suffix]
        ? `${title}${SUFFIX_LABEL[suffix].ja}`
        : title
      : suffix && SUFFIX_LABEL[suffix]
        ? `${titleen}${SUFFIX_LABEL[suffix].en}`
        : titleen;

  const snippet = locale === "en" ? firstSentence(descen) : firstSentence(desc);
  const displayChapters = chapters?.slice(0, 6) ?? [];
  const remainingCount = chapters ? chapters.length - 6 : 0;

  return (
    <article className={styles.scrollCard}>
      <Link href={`/${titleen}`}>
        <a className={styles.scrollCardInner}>
          {thumb && (
            <div className={styles.scrollCardThumbWrap}>
              <Image
                src={thumb}
                alt={title}
                width={533}
                height={300}
                sizes="(max-width: 768px) 100vw, 300px"
                loading="lazy"
                className={styles.scrollCardThumb}
              />
            </div>
          )}
          <div className={styles.scrollCardBody}>
            {/* Layer 1: Title + scroll suffix */}
            <h3 className={styles.cardTitle}>{scrollTitle}</h3>

            {/* Layer 2: Era + author + snippet */}
            <div className={styles.cardMeta}>
              {era && (
                <span className={styles.cardEra}>
                  {locale === "en" ? `${eraen} period` : `${era}時代`}
                </span>
              )}
              {author && (
                <span className={styles.cardAuthor}>
                  {locale === "ja" ? author : authoren}
                </span>
              )}
            </div>

            {snippet && <p className={styles.cardSnippet}>{snippet}</p>}

            {/* Layer 3: Chapter tags */}
            {displayChapters.length > 0 && (
              <div className={styles.cardChapters}>
                {displayChapters.map((ch) => (
                  <span key={ch.chapter} className={styles.cardChapterTag}>
                    {locale === "en" ? ch.titleen : ch.title}
                  </span>
                ))}
                {remainingCount > 0 && (
                  <span className={styles.cardChapterMore}>
                    +{remainingCount}
                  </span>
                )}
              </div>
            )}
          </div>
        </a>
      </Link>
    </article>
  );
};

export default ChojuGigaScrollCard;
