import { getContactUrl } from "@/libs/constants/links";
import styles from "@/styles/LegalPage.module.css";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";

const LegalContactButton = () => {
  const { t } = useTranslation("common");
  const { locale } = useRouter();

  return (
    <a
      href={getContactUrl(locale)}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.contactButton}
    >
      {t("legal.contactButton")}
    </a>
  );
};

export default LegalContactButton;
