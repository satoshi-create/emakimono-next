import styles from "@/styles/EmakiHub.module.css";
import Link from "next/link";

/**
 * 漫画・アニメ ↔ 絵巻 の関連カード。
 * 画像は絵巻側サムネのみ使用。外部リンクは公式サイトのみ（編集的言及）。
 * props.media = { titleJa, titleEn, type, theme, rationale, officialUrl, emaki: { titleen, title, thumb } }
 */
const EmakiRelatedMediaCard = ({ media, t, locale }) => {
  const l = (obj) => (locale === "en" ? obj.en : obj.ja);
  const typeLabel =
    media.type === "manga"
      ? t("emakiHub.mediaTypeManga")
      : t("emakiHub.mediaTypeAnime");

  return (
    <article className={styles.mediaCard}>
      <div className={styles.mediaThumb}>
        {media.emaki?.thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={media.emaki.thumb} alt={media.emaki.title} loading="lazy" />
        ) : (
          <div className={styles.mediaThumbPlaceholder}>
            {media.emaki?.titleen}
          </div>
        )}
      </div>

      <div className={styles.mediaBody}>
        <div className={styles.mediaTypeBadge}>{typeLabel}</div>
        <h3 className={styles.mediaTitle}>{media.titleJa}</h3>
        <p className={styles.mediaTitleEn}>{media.titleEn}</p>
        <p className={styles.mediaRationale}>{l(media.rationale)}</p>

        <p className={styles.mediaEmakiName}>
          {t("emakiHub.mediaViewEmaki")} — {media.emaki?.title}
        </p>

        <div className={styles.mediaActions}>
          {media.emaki?.titleen && (
            <Link href={`/${media.emaki.titleen}`}>
              <a
                className={styles.mediaBtn}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("emakiHub.mediaViewEmaki")}
              </a>
            </Link>
          )}
          <a
            className={styles.mediaOfficial}
            href={media.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("emakiHub.mediaOfficial")} ↗
          </a>
        </div>
      </div>
    </article>
  );
};

export default EmakiRelatedMediaCard;
