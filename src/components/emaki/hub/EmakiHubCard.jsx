import styles from "@/styles/EmakiHub.module.css";
import Link from "next/link";

/**
 * 絵巻カード。実在作品は dataEmakis.json と JOIN 済みの meta（title/thumb/desc）を持つ。
 * status: "coming-soon" の作品はビューア未公開のため準備中カードとして表示。
 */
const EmakiHubCard = ({ item, t }) => {
  const { titleen, title, thumb, desc, theme, tags, spot, status } = item;

  const isComingSoon = status === "coming-soon";
  const titleJa = title || item.titleJa;
  const titleEn = titleen || item.titleEn;

  return (
    <article className={`${styles.card} ${isComingSoon ? styles.cardComingSoon : ""}`}>
      <div className={styles.cardThumb}>
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt={titleJa} loading="lazy" />
        ) : (
          <div className={styles.cardThumbPlaceholder}>{titleEn}</div>
        )}
        {isComingSoon && (
          <span className={styles.comingSoonBadge}>{t("emakiHub.comingSoon")}</span>
        )}
      </div>

      <div className={styles.cardBody}>
        <h3 className={styles.cardTitle}>{titleJa}</h3>
        <p className={styles.cardTitleEn}>{titleEn}</p>

        <div className={styles.cardTags}>
          {tags.map((tag) => (
            <span key={tag} className={styles.cardTag}>
              {tag}
            </span>
          ))}
        </div>

        {spot && (
          <p className={styles.cardSpot}>
            {t("emakiHub.spotLabel")}: {spot.nameJa}（{spot.nameEn}）
          </p>
        )}

        {desc && <p className={styles.cardDesc}>{desc}</p>}

        {!isComingSoon && titleen ? (
          <Link href={`/${titleen}`}>
            <a className={styles.cardBtn}>{t("emakiHub.viewerBtn")}</a>
          </Link>
        ) : (
          <span className={styles.cardBtnDisabled}>
            {t("emakiHub.comingSoon")}
          </span>
        )}
      </div>
    </article>
  );
};

export default EmakiHubCard;
