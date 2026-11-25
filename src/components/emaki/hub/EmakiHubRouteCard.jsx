import Link from "next/link";
import styles from "@/styles/EmakiHub.module.css";
import { faMapMarkedAlt, faClock } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

/**
 * おすすめ観光ルートカード。
 * stops は JOIN 済みで、絵巻由来なら thumb/title/spot、単独スポットなら spot を持つ。
 */
const EmakiHubRouteCard = ({ route, t, locale, onViewOnMap }) => {
  const isJa = locale === "ja";
  const l = (obj, fallback = "") =>
    !obj
      ? fallback
      : typeof obj === "string"
        ? obj
        : (isJa ? obj.ja : obj.en) || obj.ja || obj.en || fallback;
  const duration = isJa ? route.durationJa : route.durationEn;
  const routeTitle = isJa ? route.titleJa : route.titleEn;

  return (
    <article
      className={styles.routeCard}
      onClick={() => onViewOnMap(route)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onViewOnMap(route);
        }
      }}
    >
      <div className={styles.routeHeader}>
        <div>
          <h3 className={styles.routeTitle}>{routeTitle}</h3>
          <p className={styles.routeTitleEn}>
            {isJa ? route.titleEn : route.titleJa}
          </p>
        </div>
        <span className={styles.routeDuration}>
          <FontAwesomeIcon icon={faClock} size="sm" />{" "}
          {t("emakiHub.routeDuration")}: {duration}
        </span>
      </div>

      <p className={styles.routeSummary}>
        {l(route.summary, isJa ? route.summaryJa : route.summaryEn)}
      </p>

      <ol className={styles.routeStops}>
        {route.stops.map((stop, idx) => (
          <li key={`${route.id}-${idx}`} className={styles.routeStop}>
            <span className={styles.routeStopNum}>{idx + 1}</span>
            {stop.thumb && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={stop.thumb}
                alt={stop.title}
                className={styles.routeStopImg}
                loading="lazy"
              />
            )}
            <div className={styles.routeStopBody}>
              <div className={styles.routeStopLabels}>
                <span className={stop.titleen ? styles.stopBadgeEmaki : styles.stopBadgeSpot}>
                  {stop.titleen
                    ? t("emakiHub.routeStopEmaki")
                    : t("emakiHub.routeStopSpot")}
                </span>
                <span className={styles.routeStopName}>
                  {stop.spot?.nameJa}（{stop.spot?.nameEn}）
                </span>
              </div>
              <p className={styles.routeStopNote}>
                {l(stop.note, isJa ? stop.noteJa : stop.noteEn)}
              </p>
              {stop.titleen && stop.spotId && (
                <Link
                  href={`/${stop.titleen}?spot=${encodeURIComponent(stop.spotId)}`}
                >
                  <a
                    className={styles.routeStopEmakiLink}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {isJa ? "絵巻で見る ↗" : "View in emaki ↗"}
                  </a>
                </Link>
              )}
            </div>
          </li>
        ))}
      </ol>

      <span className={styles.routeBtn}>
        <FontAwesomeIcon icon={faMapMarkedAlt} /> {t("emakiHub.routeViewOnMap")}
      </span>
    </article>
  );
};

export default EmakiHubRouteCard;
