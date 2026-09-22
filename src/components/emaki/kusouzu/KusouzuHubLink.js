import styles from "@/styles/KusouzuHubLink.module.css";
import Link from "next/link";
import { useTranslation } from "next-i18next";

const HUB_PATH = "/kusouzu/chapters-kusouzu";

/**
 * Link to the kusōzu hub.
 * variant="icon"（コメンタリーバー内）は、段タイトル右隣に「九相図一覧 ↗」ピルを置く。
 */
const KusouzuHubLink = ({ variant = "tag", linkClassName }) => {
  const { t } = useTranslation("common");

  const guideLabel = t("kusouzuHub.hubGuide", {
    defaultValue: "九相図一覧",
  });
  const guideTitle = t("kusouzuHub.hubGuideTitle", {
    defaultValue: "九相図の全場面一覧・見比べハブ",
  });

  if (variant === "icon") {
    return (
      <Link href={HUB_PATH}>
        <a
          className={linkClassName || styles.hubIconBtn}
          aria-label={guideTitle}
          title={guideTitle}
        >
          <span>{guideLabel}</span>
          <span aria-hidden="true">↗</span>
        </a>
      </Link>
    );
  }

  return (
    <Link href={HUB_PATH}>
      <a className={variant === "banner" ? styles.banner : styles.tag}>
        <span className={styles.label}>{t("kusouzuHub.linkLabel")}</span>
        {variant === "banner" && (
          <span className={styles.desc}>{t("kusouzuHub.linkDesc")}</span>
        )}
      </a>
    </Link>
  );
};

export { HUB_PATH };
export default KusouzuHubLink;
