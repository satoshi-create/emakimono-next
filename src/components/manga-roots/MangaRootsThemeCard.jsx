import styles from "@/styles/MangaRoots.module.css";
import Link from "next/link";

const MangaRootsThemeCard = ({ theme, t, locale }) => {
  const thumb = theme.scrolls.find((s) => s.thumb)?.thumb;
  const classicNames = theme.scrolls.map((s) => s.title).join(" / ");
  const spots = [];
  const seenSpots = new Set();
  theme.scrolls.forEach((s) => {
    if (!s.spot) return;
    const key = s.spot.nameEn || s.spot.nameJa;
    if (seenSpots.has(key)) return;
    seenSpots.add(key);
    spots.push(s.spot);
  });

  return (
    <article className={styles.card}>
      <div className={styles.cardThumb}>
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt={classicNames} loading="lazy" />
        ) : (
          <div className={styles.cardThumbPlaceholder} />
        )}
      </div>

      <div className={styles.cardBody}>
        <h3 className={styles.cardTitle}>{t(`mangaRoots.${theme.titleKey}`)}</h3>

        <p className={styles.pairLabel}>{t("mangaRoots.modernLabel")}</p>
        <p className={styles.pairValue}>{t(`mangaRoots.${theme.modernKey}`)}</p>

        <p className={styles.pairLabel}>{t("mangaRoots.classicLabel")}</p>
        <p className={styles.pairValue}>{classicNames}</p>

        {spots.map((spot) => (
          <p key={spot.nameEn} className={styles.spot}>
            {locale === "en" ? spot.nameEn : spot.nameJa}
          </p>
        ))}

        <p className={styles.story}>{t(`mangaRoots.${theme.storyKey}`)}</p>

        <div className={styles.cardActions}>
          {theme.scrolls.map((scroll) => (
            <Link key={scroll.titleen} href={`/${scroll.titleen}`}>
              <a className={styles.cta}>{t(`mangaRoots.${scroll.ctaKey}`)}</a>
            </Link>
          ))}
        </div>
      </div>
    </article>
  );
};

export default MangaRootsThemeCard;
