import { getEmakiSpot } from "@/data/emakiHubData";
import styles from "@/styles/SightseeingMapLink.module.css";
import Link from "next/link";
import { useTranslation } from "next-i18next";

/**
 * 絵巻ページ → 観光マップ（/emaki-hub）へのバナー／タグリンク。
 * 対象作品がハブ未掲載の場合は何も表示しない。
 */
const SightseeingMapLink = ({ titleen, variant = "tag" }) => {
  const { t } = useTranslation("common");
  const hit = getEmakiSpot(titleen);
  if (!hit) return null;

  const href = `/emaki-hub?region=${hit.region}&scroll=${encodeURIComponent(titleen)}`;

  return (
    <Link href={href}>
      <a className={variant === "banner" ? styles.banner : styles.tag}>
        <span className={styles.label}>{t("emakiHub.mapLinkLabel")}</span>
        {variant === "banner" && (
          <span className={styles.desc}>
            {hit.spot.nameJa}（{hit.spot.nameEn}）
          </span>
        )}
      </a>
    </Link>
  );
};

export default SightseeingMapLink;
