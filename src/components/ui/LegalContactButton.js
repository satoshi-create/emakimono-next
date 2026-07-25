import { NOTION_CONTACT_URL } from "@/libs/constants/links";
import styles from "@/styles/LegalPage.module.css";
import { useTranslation } from "next-i18next";

const LegalContactButton = () => {
  const { t } = useTranslation("common");

  return (
    <a
      href={NOTION_CONTACT_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.contactButton}
    >
      {t("legal.contactButton")}
    </a>
  );
};

export default LegalContactButton;
