import styles from "@/styles/ChoujuGigaHubLink.module.css";
import Link from "next/link";
import { useTranslation } from "next-i18next";

const HUB_PATH = "/chouju-giga/chapters";

/** Link to the Chōjū-jinbutsu-giga hub — use on emaki viewer pages for giga scrolls. */
const ChojuGigaHubLink = ({ variant = "tag" }) => {
  const { t } = useTranslation("common");

  return (
    <Link href={HUB_PATH}>
      <a
        className={
          variant === "banner" ? styles.banner : styles.tag
        }
      >
        <span className={styles.label}>{t("choujuGigaHub.linkLabel")}</span>
        {variant === "banner" && (
          <span className={styles.desc}>{t("choujuGigaHub.linkDesc")}</span>
        )}
      </a>
    </Link>
  );
};

export { HUB_PATH };
export default ChojuGigaHubLink;
