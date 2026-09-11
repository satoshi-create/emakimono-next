import styles from "@/styles/GenjiHubLink.module.css";
import { faScroll } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";

export const HUB_PATH = "/genji/chapters-genji";

/**
 * Link from the emaki viewer to the Tale of Genji hub.
 * Pass `genjieslug`（帖スラグ, e.g. "wakamurasaki"）to deep-link a chapter;
 * omit it to point at the 54-chapter list hub.
 */
const GenjiHubLink = ({ genjieslug, variant = "tag", sceneTitle }) => {
  const { t } = useTranslation("common");
  const { locale } = useRouter();
  const isEn = locale === "en";
  const href = genjieslug ? `/genji/${genjieslug}` : HUB_PATH;

  const cleanSceneTitle =
    typeof sceneTitle === "string" ? sceneTitle.trim() : "";

  const label = t("genjiHub.linkLabel", {
    defaultValue: isEn
      ? "View the Tale of Genji hub"
      : "源氏物語 54帖ハブを見る",
  });
  // ツールチップ: 遷移先と現在のシーン名を明示する
  const tooltip = cleanSceneTitle
    ? isEn
      ? `View "${cleanSceneTitle}" in The Tale of Genji Hub`
      : `「${cleanSceneTitle}」の源氏物語54帖ハブを開く`
    : label;
  const desc = t("genjiHub.linkDesc", {
    defaultValue: isEn
      ? "Browse all 54 chapters and their illustrated scrolls."
      : "源氏物語54帖と絵巻を横断して鑑賞できます。",
  });

  if (variant === "icon") {
    return (
      <Link href={href}>
        <a className={styles.hubIconBtn} aria-label={tooltip} title={tooltip}>
          <FontAwesomeIcon
            className={styles.icon}
            icon={faScroll}
            aria-hidden="true"
          />
        </a>
      </Link>
    );
  }

  const className = variant === "banner" ? styles.banner : styles.tag;

  return (
    <Link href={href}>
      <a className={className}>
        <span className={styles.head}>
          <FontAwesomeIcon
            className={styles.icon}
            icon={faScroll}
            aria-hidden="true"
          />
          <span className={styles.label}>{label}</span>
        </span>
        {variant === "banner" && <span className={styles.desc}>{desc}</span>}
      </a>
    </Link>
  );
};

export default GenjiHubLink;
