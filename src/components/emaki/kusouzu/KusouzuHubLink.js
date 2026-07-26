import styles from "@/styles/KusouzuHubLink.module.css";
import Link from "next/link";
import { useTranslation } from "next-i18next";

const HUB_PATH = "/kusouzu/chapters-kusouzu";

/** Link to the kusōzu hub — use on emaki viewer pages for scrolls with kusouzuslug. */
const KusouzuHubLink = ({ variant = "tag" }) => {
  const { t } = useTranslation("common");

  return (
    <Link href={HUB_PATH}>
      <a
        className={
          variant === "banner" ? styles.banner : styles.tag
        }
      >
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
