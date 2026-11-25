import chapters from "@/data/scroll-texts/kusouzu-chapters.json";
import styles from "@/styles/KusouzuHub.module.css";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { getLocalizedField } from "@/utils/emakiDisplayTitle";
import { useMemo } from "react";

/** Build a stage_en → { title, titleen } lookup once. */
const stageLookup = {};
chapters.forEach((ch) => {
  stageLookup[ch.stage_en] = { title: ch.title, titleen: ch.titleen };
});

const KusouzuScrollCard = ({ emaki }) => {
  const { locale } = useRouter();
  const isJa = locale === "ja";
  const { titleen, title, thumb, edition, author, authoren, era, eraen, kusouzuslug } = emaki;

  const stageTags = useMemo(() => {
    if (!Array.isArray(kusouzuslug)) return [];
    // Sort by id (numeric) so that stage 0 (生前相) always comes first
    const sorted = [...kusouzuslug].sort(
      (a, b) => Number(a.id) - Number(b.id)
    );
    return sorted
      .map((s) => stageLookup[s.id])
      .filter(Boolean)
      .slice(0, 5);
  }, [kusouzuslug]);

  const remainingCount = Array.isArray(kusouzuslug)
    ? kusouzuslug.length - 5
    : 0;

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
            <h3 className={styles.scrollCardTitle}>
              {getLocalizedField(emaki, "title", locale)}
              {isJa && edition && ` ${edition}`}
            </h3>
            <div className={styles.scrollCardMeta}>
              {era && (
                <span className={styles.scrollCardEra}>
                  {isJa ? `${getLocalizedField(emaki, "era", locale)}時代` : `${getLocalizedField(emaki, "era", locale)} period`}
                </span>
              )}
              {author && (
                <span className={styles.scrollCardAuthor}>
                  {getLocalizedField(emaki, "author", locale)}
                </span>
              )}
            </div>
            {stageTags.length > 0 && (
              <div className={styles.scrollCardStages}>
                {stageTags.map((st) => (
                  <span key={st.title} className={styles.scrollCardStageTag}>
                    {getLocalizedField(st, "title", locale)}
                  </span>
                ))}
                {remainingCount > 0 && (
                  <span className={styles.scrollCardStageMore}>
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

export default KusouzuScrollCard;
