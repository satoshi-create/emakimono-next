import styles from "@/styles/ChoujuGigaHubLink.module.css";
import { HYAKKI_HUB_PATH } from "@/libs/constants/links";
import Link from "next/link";
import { useTranslation } from "next-i18next";

/** Link to the hyakki / tsukumogami hub — viewer pages in the cluster. */
const HyakkiHubLink = ({ variant = "tag" }) => {
  const { t } = useTranslation("common");

  return (
    <Link href={HYAKKI_HUB_PATH}>
      <a className={variant === "banner" ? styles.banner : styles.tag}>
        <span className={styles.label}>{t("hyakkiHub.linkLabel")}</span>
        {variant === "banner" && (
          <span className={styles.desc}>{t("hyakkiHub.linkDesc")}</span>
        )}
      </a>
    </Link>
  );
};

export { HYAKKI_HUB_PATH as HUB_PATH };
export default HyakkiHubLink;
